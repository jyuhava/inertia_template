import type { JsonObject, JsonValue } from '@/types/common';
import type { EntityKey } from '@/types/integration';
import type { NeoFeederActDefinition, NeoFeederFieldSpec, NeoFeederVersion, PayloadBuildContext, PayloadBuildResult } from '@/types/neofeeder';
import type { ReferenceKey } from '@/types/reference';
import { getActDefinition } from './ActRegistry';
import { applyFieldOverrides, filterFieldsForVersion, getVersionAdapter, isActAvailable, requiredFieldsFor } from './SchemaAdapter';
import { asNumber, asString } from '@/utils/json';

/**
 * TransformService
 * ================
 * Mengubah data SIAKAD menjadi payload Neo Feeder sesuai schema act aktif.
 *
 * Prinsip:
 *  - Nama field tidak pernah di-hardcode di komponen; selalu dari ActRegistry.
 *  - Nilai kosong tidak dikirim, tetapi dicatat di `skippedFields` + alasannya.
 *  - Field referensi (agama, jalur masuk, dst) di-resolve lewat mapping referensi.
 *  - Field induk (id_prodi, id_matkul, id_kelas_kuliah) di-resolve lewat mapping entitas.
 *  - Bila schema act belum diverifikasi versi terpasang, field ditandai `unverifiedFields`.
 */

export interface BuildPayloadOptions extends PayloadBuildContext {
    version: NeoFeederVersion | string | null;
    /** daftar field menurut dictionary Neo Feeder terpasang (bila sudah disinkronkan) */
    dictionaryFields?: string[] | null;
}

const ENTITY_REFERENCE_MAP: Partial<Record<ReferenceKey, EntityKey>> = {
    'program-studi': 'prodi',
    semester: 'semester',
    'perguruan-tinggi': 'perguruan-tinggi',
};

const toIsoDate = (value: unknown): string | null => {
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
};

const convertValue = (
    field: NeoFeederFieldSpec,
    raw: unknown,
    options: BuildPayloadOptions,
): { value: JsonValue | null; skipped?: string } => {
    if (raw === null || raw === undefined || raw === '') return { value: null, skipped: 'kosong di SIAKAD' };

    if (field.type === 'reference' && field.refKey) {
        const text = String(raw).trim();
        const entityTarget = ENTITY_REFERENCE_MAP[field.refKey];

        if (entityTarget) {
            const resolved = options.resolve(entityTarget, text);
            return resolved ? { value: resolved } : { value: null, skipped: 'entitas induk belum dipetakan ke PDDikti' };
        }

        const resolved = options.resolveReference(field.refKey, text);
        return resolved ? { value: resolved } : { value: null, skipped: 'nilai referensi belum dipetakan' };
    }

    switch (field.type) {
        case 'int': {
            const numeric = asNumber(raw, null);
            return numeric === null ? { value: null, skipped: 'bukan angka' } : { value: Math.trunc(numeric) };
        }
        case 'decimal': {
            const numeric = asNumber(raw, null);
            return numeric === null ? { value: null, skipped: 'bukan angka' } : { value: numeric };
        }
        case 'date': {
            const iso = toIsoDate(raw);
            return iso ? { value: iso } : { value: null, skipped: 'tanggal tidak valid' };
        }
        case 'bool': {
            const truthy = raw === true || raw === 1 || raw === '1' || raw === 'true';
            return { value: truthy ? '1' : '0' };
        }
        default:
            return { value: asString(raw) };
    }
};

export const buildPayload = (act: string, options: BuildPayloadOptions): PayloadBuildResult => {
    const definition: NeoFeederActDefinition | null = getActDefinition(act);

    if (!definition || !definition.recordFields) {
        return {
            act,
            record: {},
            skippedFields: [{ field: '*', reason: 'act tidak terdaftar pada ActRegistry sehingga payload tidak dapat dibentuk' }],
            unverifiedFields: [],
            rawLocal: (options.values ?? {}) as JsonValue,
            existing: options.existing ?? null,
        };
    }

    const record: JsonObject = {};
    const skippedFields: { field: string; reason: string }[] = [];
    const required = new Set(requiredFieldsFor(act, options.version));
    definition.recordFields.forEach((field) => {
        if (field.required) required.add(field.key);
    });

    definition.recordFields.forEach((field) => {
        const raw = field.localField ? options.values[field.localField] : undefined;

        // Field id PDDikti (id_mahasiswa, id_registrasi_mahasiswa, id_kelas_kuliah, id_matkul)
        // diisi dari record PDDikti yang sudah ada (kondisi UPDATE).
        if (raw === undefined || raw === null || raw === '') {
            const fromExisting = options.existing ? options.existing[field.key] : undefined;
            if (fromExisting !== undefined && fromExisting !== null && fromExisting !== '') {
                record[field.key] = fromExisting;
                return;
            }
        }

        const converted = convertValue(field, raw, options);

        if (converted.value === null) {
            if (required.has(field.key)) {
                skippedFields.push({ field: field.key, reason: `wajib diisi tetapi ${converted.skipped ?? 'tidak tersedia'}` });
            } else if (converted.skipped) {
                skippedFields.push({ field: field.key, reason: converted.skipped });
            }
            return;
        }

        record[field.key] = converted.value;
    });

    const overridden = applyFieldOverrides(act, record as Record<string, unknown>, options.version);
    const finalRecord = overridden.record as JsonObject;
    const fieldKeys = Object.keys(finalRecord);
    const filtered = filterFieldsForVersion(act, fieldKeys, options.dictionaryFields ?? null, options.version);

    const unverifiedFields: string[] = [];
    if (definition.schemaSource === 'assumed') unverifiedFields.push(...filtered.accepted);
    if (!isActAvailable(act, options.version)) unverifiedFields.push(...fieldKeys);

    if (!isActAvailable(act, options.version)) {
        skippedFields.push({ field: '*', reason: `act ${act} belum tersedia pada ${getVersionAdapter(options.version).label}` });
    }

    filtered.rejected.forEach((field) => {
        skippedFields.push({ field, reason: 'tidak ada pada dictionary versi Neo Feeder terpasang' });
    });

    return {
        act,
        record: finalRecord,
        skippedFields,
        unverifiedFields,
        rawLocal: (options.values ?? {}) as JsonValue,
        existing: options.existing ?? null,
    };
};

/**
 * Membentuk envelope request final untuk ditampilkan pada Payload Inspector.
 * Token SELALU disensor — backend yang menambahkan token sebenarnya.
 */
export const buildEnvelope = (act: string, record: JsonObject | null, options: { filter?: string; order?: string; limit?: number; offset?: number } = {}): JsonObject => ({
    act,
    token: '[HIDDEN]',
    ...(record ? { record } : {}),
    ...(options.filter !== undefined ? { filter: options.filter } : {}),
    ...(options.order !== undefined ? { order: options.order } : {}),
    ...(options.limit !== undefined ? { limit: options.limit } : {}),
    ...(options.offset !== undefined ? { offset: options.offset } : {}),
});

export const describeVersion = (version: NeoFeederVersion | string | null): string => getVersionAdapter(version).label;

/** Nilai lokal yang akan dipakai sebuah field (untuk tabel comparison payload). */
export const mapLocalToRemoteFields = (act: string): { local: string; remote: string; required: boolean }[] => {
    const definition = getActDefinition(act);
    if (!definition?.recordFields) return [];
    return definition.recordFields
        .filter((field) => field.localField)
        .map((field) => ({ local: field.localField as string, remote: field.key, required: field.required === true }));
};
