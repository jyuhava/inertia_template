/** Tipe-tipe dasar yang dipakai lintas modul. */

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export interface PaginationMeta {
    page: number;
    perPage: number;
    total: number;
    lastPage: number;
}

export interface Paginated<T> {
    data: T[];
    meta: PaginationMeta;
}

export interface ListQuery {
    page?: number;
    perPage?: number;
    search?: string;
    sort?: string;
    direction?: 'asc' | 'desc';
    /** filter bebas; nilai kosong diabaikan oleh service */
    filters?: Record<string, string | number | boolean | undefined | null>;
}

export type Severity = 'critical' | 'error' | 'warning' | 'info';

/** Kategori error hasil normalisasi (dipakai UI & retry policy). */
export type ErrorCategory =
    | 'NETWORK_ERROR'
    | 'TIMEOUT'
    | 'AUTH_ERROR'
    | 'VALIDATION_ERROR'
    | 'PDDIKTI_ERROR'
    | 'CONFLICT'
    | 'UNKNOWN_ERROR';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent';

export interface SelectOption {
    value: string;
    label: string;
}

export interface ColumnDefinition {
    key: string;
    label: string;
    align?: 'left' | 'right' | 'center';
    width?: string;
    mono?: boolean;
    sortable?: boolean;
    /** true untuk kolom yang boleh disembunyikan lewat panel column visibility */
    hideable?: boolean;
    defaultHidden?: boolean;
}

export interface StatCardData {
    key: string;
    label: string;
    value: number | string;
    hint?: string;
    tone?: StatusTone;
    icon?: string;
}

/** Operator yang sedang memakai integrator (dikirim backend, bukan disimpan lokal). */
export interface OperatorSession {
    id: number | string;
    name: string;
    email: string;
    role: string;
    permissions: string[];
    institution?: string;
    mockMode: boolean;
}
