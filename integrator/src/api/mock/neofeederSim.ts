import type { JsonObject, JsonValue } from '@/types/common';
import type { NeoFeederEnvelope, NeoFeederRawResponse } from '@/types/neofeeder';
import { getActDefinition, neoFeederActs } from '@/services/neofeeder/ActRegistry';
import { dataset, mockUuid, pddiktiMirror } from './sourceData';
import { mockState, isoNow } from './state';
import { stableHash } from '@/utils/json';
import { appConfig } from '@/config/app.config';

/**
 * Simulator Web Service Neo Feeder (khusus MOCK MODE).
 *
 * Meniru perilaku nyata:
 *  - respons envelope `{ error_code, error_desc, data }` (0 = sukses)
 *  - token kedaluwarsa -> error_code 401
 *  - kegagalan tidak permanen (timeout/server error) dan kegagalan validasi
 *  - id PDDikti baru dihasilkan untuk insert
 *
 * Hasil simulasi dibuat deterministik (hash dari act + record) supaya UI
 * menampilkan kondisi yang stabil pada setiap reload, namun tetap bervariasi
 * antar record (sukses / gagal validasi / timeout / konflik).
 */

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const LATENCY_BASE = Math.max(40, Math.min(appConfig.mockLatencyMs, 900));

export const simulateLatency = async (multiplier = 1): Promise<number> => {
    const jitter = Math.floor(Math.random() * 120);
    const total = Math.round(LATENCY_BASE * multiplier) + jitter;
    await delay(total);
    return total;
};

const envelopeKey = (envelope: NeoFeederEnvelope): string =>
    `${envelope.act}|${JSON.stringify(envelope.record ?? envelope.filter ?? {})}`;

const failureProfile = (
    envelope: NeoFeederEnvelope,
    attempt: number,
): 'success' | 'validation' | 'timeout' | 'server' | 'conflict' => {
    const hash = stableHash(`${envelopeKey(envelope)}#${attempt}`);
    const roll = hash % 100;

    if (attempt > 1) {
        // Percobaan ulang lebih besar peluang berhasilnya
        if (roll < 6) return 'timeout';
        if (roll < 9) return 'server';
        return 'success';
    }

    if (roll < 8) return 'validation';
    if (roll < 12) return 'timeout';
    if (roll < 15) return 'server';
    if (roll < 17) return 'conflict';
    return 'success';
};

const rowsForAct = (act: string): JsonObject[] => {
    const definition = getActDefinition(act);
    const entity = definition?.entity;
    if (!entity) return [];

    const mirror = pddiktiMirror[entity] ?? {};
    return Object.values(mirror);
};

export const isTokenValid = (): boolean => Boolean(mockState.token.expiresAt && new Date(mockState.token.expiresAt).getTime() > Date.now());

export const issueToken = async (username: string, password?: string): Promise<NeoFeederRawResponse> => {
    await simulateLatency(1.2);

    if (!username || !password) {
        return { error_code: 401, error_desc: 'Username atau password Neo Feeder tidak boleh kosong.', data: [] };
    }

    if (password.length < 4) {
        return { error_code: 401, error_desc: 'Autentikasi ke Neo Feeder gagal: kredensial tidak dikenali.', data: [] };
    }

    mockState.token = {
        value: mockUuid(`token-${username}-${Date.now()}`),
        issuedAt: isoNow(),
        expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
        refreshes: [isoNow(), ...mockState.token.refreshes].slice(0, 10),
    };
    mockState.status = {
        ...mockState.status,
        status: 'CONNECTED',
        tokenExpiresAt: mockState.token.expiresAt,
        lastConnectedAt: isoNow(),
        message: null,
    };

    return { error_code: 0, error_desc: '', data: [{ token: '[HIDDEN-BACKEND]' }] };
};

export const connectionProbe = async (): Promise<{ raw: NeoFeederRawResponse; latencyMs: number }> => {
    const latency = await simulateLatency(1.4);
    const roll = stableHash(`probe-${mockState.connection.webServiceUrl}`) % 100;

    if (!mockState.connection.active) {
        return { raw: { error_code: 0, error_desc: 'Koneksi dinonaktifkan pada konfigurasi integrator.', data: [] }, latencyMs: latency };
    }

    if (roll < 4) {
        return { raw: { error_code: 504, error_desc: 'Tidak ada respons dari Neo Feeder (simulasi timeout).', data: [] }, latencyMs: latency };
    }

    return {
        raw: {
            error_code: 0,
            error_desc: '',
            data: [
                {
                    server_version: mockState.status.serverVersion ?? '3.1',
                    api_status: 'aktif',
                    perguruan_tinggi: dataset.perguruanTinggi.namaPt,
                    waktu_server: isoNow(),
                },
            ],
        },
        latencyMs: latency,
    };
};

export const callAct = async (
    envelope: NeoFeederEnvelope,
    attempt = 1,
): Promise<{ raw: NeoFeederRawResponse; latencyMs: number; httpStatus: number }> => {
    const definition = getActDefinition(envelope.act);
    const multiplier = definition?.kind === 'list' || definition?.kind === 'report' ? 0.7 : 1.1;
    const latencyMs = await simulateLatency(multiplier);

    if (definition?.kind !== 'auth' && !isTokenValid()) {
        mockState.status = { ...mockState.status, status: 'AUTHENTICATION_FAILED', message: 'Token kedaluwarsa atau belum diperoleh.' };
        return { raw: { error_code: 401, error_desc: 'Token tidak valid atau sudah kedaluwarsa. Lakukan autentikasi ulang.', data: [] }, latencyMs, httpStatus: 200 };
    }

    if (definition?.kind === 'reference' || definition?.kind === 'list' || definition?.kind === 'count' || definition?.kind === 'report' || definition?.kind === 'detail') {
        const rows = rowsForAct(envelope.act);
        const filter = (envelope.filter ?? '').trim();

        // Dukungan filter sederhana: "field = 'value'" dan "field in ('a','b')"
        let filtered = rows;
        const equality = /^([a-z_]+)\s*=\s*'([^']*)'$/i.exec(filter);
        if (equality) {
            const [, field, value] = equality;
            filtered = rows.filter((row) => String(row[field] ?? '') === value);
        }

        if (definition.kind === 'count') {
            return { raw: { error_code: 0, error_desc: '', data: [{ jumlah: filtered.length }] }, latencyMs, httpStatus: 200 };
        }

        const offset = envelope.offset ?? 0;
        const limit = envelope.limit ?? filtered.length;
        return { raw: { error_code: 0, error_desc: '', data: filtered.slice(offset, offset + limit) }, latencyMs, httpStatus: 200 };
    }

    // --- insert / update -------------------------------------------------
    const record = (envelope.record ?? {}) as JsonObject;
    const missingRequired = (definition?.recordFields ?? []).filter(
        (field) => field.required && (record[field.key] === undefined || record[field.key] === null || record[field.key] === ''),
    );

    if (missingRequired.length > 0) {
        return {
            raw: {
                error_code: 400,
                error_desc: `Field wajib belum terisi: ${missingRequired.map((field) => field.key).join(', ')}`,
                data: [],
            },
            latencyMs,
            httpStatus: 200,
        };
    }

    const profile = failureProfile(envelope, attempt);

    if (profile === 'timeout') {
        return { raw: { error_code: 0, error_desc: '', data: [] }, latencyMs: latencyMs + 9_000, httpStatus: 504 };
    }

    if (profile === 'server') {
        return {
            raw: { error_code: 500, error_desc: 'Kesalahan pada server PDDikti saat memproses permintaan (silakan coba beberapa saat lagi).', data: [] },
            latencyMs,
            httpStatus: 502,
        };
    }

    if (profile === 'validation') {
        const messages = [
            'NIK tidak boleh kosong',
            'Kode mata kuliah sudah digunakan pada program studi yang sama',
            'Semester tidak sesuai dengan periode pelaporan yang sedang dibuka',
            'Nama kelas kuliah sudah terdaftar pada semester ini',
            'Nilai huruf tidak sesuai dengan skala nilai program studi',
        ];
        return { raw: { error_code: 400, error_desc: messages[stableHash(envelopeKey(envelope)) % messages.length], data: [] }, latencyMs, httpStatus: 200 };
    }

    if (profile === 'conflict') {
        return {
            raw: { error_code: 409, error_desc: 'Data dengan identitas yang sama sudah ada di PDDikti tetapi berbeda isi. Periksa melalui menu Perbandingan.', data: [] },
            latencyMs,
            httpStatus: 200,
        };
    }

    const idField = definition?.responseIdField ?? 'id';
    const generatedId = record[idField] ? String(record[idField]) : mockUuid(`${envelope.act}-${JSON.stringify(record)}`);

    return {
        raw: { error_code: 0, error_desc: '', data: [{ [idField]: generatedId }] },
        latencyMs,
        httpStatus: 200,
    };
};

export const buildDictionary = (): JsonObject => ({
    version: mockState.status.serverVersion ?? '3.1',
    acts: Object.values(neoFeederActs).map((act) => ({
        act: act.act,
        name: act.label,
        kind: act.kind,
        fields: (act.recordFields ?? []).map((field) => ({
            name: field.key,
            type: field.type,
            required: field.required ? 1 : 0,
        })),
    })) as unknown as JsonValue[],
});

export { mockState };
