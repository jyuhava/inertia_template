import type { JsonObject, JsonValue } from './common';
import type { EntityKey, ValidationIssue } from './integration';
import type { ReferenceKey } from './reference';

export interface NeoFeederFieldSpec {
    key: string;
    label: string;
    type: 'string' | 'int' | 'decimal' | 'date' | 'datetime' | 'bool' | 'reference' | 'enum';
    required?: boolean;
    refKey?: ReferenceKey;
    localField?: string;
    maxLength?: number;
    enumValues?: string[];
    notes?: string;
}

export type NeoFeederActKind =
    | 'auth'
    | 'list'
    | 'detail'
    | 'count'
    | 'insert'
    | 'update'
    | 'delete'
    | 'reference'
    | 'report';

/**
 * Definisi satu `act` Web Service Neo Feeder.
 *
 * `schemaSource` menyatakan asal daftar field:
 *  - 'ws-dictionary' : nama act & parameter mengikuti dokumentasi WS resmi
 *                      (Postman collection PDDikti Feeder / dictionary Neo Feeder).
 *  - 'assumed'       : field BELUM diverifikasi untuk versi Neo Feeder yang
 *                      dipasang. UI menandainya sebagai peringatan dan operator
 *                      wajib menjalankan "Sinkronkan Dictionary" pada halaman
 *                      Koneksi sebelum mengirim data.
 */
export interface NeoFeederActDefinition {
    act: string;
    label: string;
    kind: NeoFeederActKind;
    entity?: EntityKey;
    /** act pengambil data pasangan (list/detail) untuk kebutuhan comparison */
    counterpart?: string;
    supportsFilter?: boolean;
    supportsOrder?: boolean;
    supportsPaging?: boolean;
    requiresRecord?: boolean;
    recordFields?: NeoFeederFieldSpec[];
    responseIdField?: string;
    schemaSource: 'ws-dictionary' | 'assumed';
    availableSince?: string;
    notes?: string;
}

export interface NeoFeederEnvelope {
    act: string;
    token?: string;
    filter?: string;
    order?: string;
    limit?: number;
    offset?: number;
    record?: JsonObject;
}

export interface NeoFeederRawResponse {
    error_code?: number | string;
    error_desc?: string;
    data?: unknown;
    [key: string]: unknown;
}

export interface NeoFeederResult<T = unknown> {
    success: boolean;
    code: number;
    message: string;
    data: T;
    raw: JsonObject;
    act: string;
    requestId: string;
    durationMs: number;
    attempts: number;
    httpStatus: number | null;
    /** true bila respons berasal dari mock adapter */
    mocked: boolean;
}

export interface NeoFeederDictionaryResponse {
    version: string;
    fetchedAt: string;
    source: 'ws-dictionary' | 'assumed';
    acts: NeoFeederActDefinition[];
}

export type NeoFeederVersion = '2.0' | '2.2' | '3.0' | '3.1';

/** Adapter versi: menyaring act/field yang tersedia pada versi Neo Feeder terpasang. */
export interface NeoFeederVersionAdapter {
    version: NeoFeederVersion;
    label: string;
    notes: string;
    /** act yang hanya tersedia sejak versi tertentu */
    minimumVersionByAct: Record<string, NeoFeederVersion>;
    /** override/penyesuaian nama field per act pada versi ini */
    fieldOverrides: Record<string, Record<string, string>>;
    /** field yang wajib ada pada versi ini (mis. nomor HP wajib sejak 3.0) */
    requiredFields: Record<string, string[]>;
}

export interface PayloadBuildContext {
    entity: EntityKey;
    localId: string;
    action: 'INSERT' | 'UPDATE' | 'SKIP';
    /** record SIAKAD apa adanya (kunci = nama field lokal pada fieldMaps) */
    values: Record<string, unknown>;
    /** record PDDikti yang sudah ada (untuk UPDATE) */
    existing?: JsonObject | null;
    /** masalah validasi yang sudah diketahui */
    issues: ValidationIssue[];
    /** resolver id PDDIKTI untuk dependency (mis. id_prodi, id_matkul) */
    resolve: (entity: EntityKey, localId: string | number | null) => string | null;
    /** resolver nilai referensi (mis. agama 'Islam' -> id_agama) */
    resolveReference: (refKey: ReferenceKey, localValue: string | null) => string | null;
    /** konteks tambahan per entity (mis. periode terpilih) */
    context?: Record<string, string | number | null>;
}

export interface PayloadBuildResult {
    act: string;
    record: JsonObject;
    skippedFields: { field: string; reason: string }[];
    /** daftar field yang belum terverifikasi untuk versi Neo Feeder terpasang */
    unverifiedFields: string[];
    rawLocal: JsonValue;
    existing: JsonObject | null;
}
