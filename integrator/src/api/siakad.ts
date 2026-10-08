import type { JsonObject, Paginated, OperatorSession, ListQuery } from '@/types/common';
import type {
    ComparisonRow,
    ConnectionProfile,
    ConnectionTestResult,
    DashboardSummary,
    EntityKey,
    MonitoringSummary,
    NeoFeederConnectionStatus,
    PayloadPreviewResponse,
    SyncJob,
    SyncLogEntry,
    ValidationIssue,
    ValidationSummary,
} from '@/types/integration';
import type { EntityDetail } from '@/types/siakad';
import type { AutoMapResult, MappingCandidate, MappingRecord, MappingStats } from '@/types/mapping';
import type { ReferenceDefinition, ReferenceItem, ReferenceSummary } from '@/types/reference';
import type { RowMap } from '@/types/rows';
import type { SiakadSemester } from '@/types/siakad';
import { get, post, put } from './http';

/**
 * Kontrak API SIAKAD untuk modul Integrator.
 *
 * Endpoint (dipakai sama oleh mock dan backend nyata):
 *   GET  /session                        GET  /dashboard/summary
 *   GET  /csrf                           POST /login
 *   POST /logout
 *   GET  /connection                     PUT  /connection
 *   POST /connection/test                POST /connection/authenticate
 *   POST /connection/token/refresh       POST /connection/dictionary/sync
 *   GET  /references                     GET  /references/{key}
 *   GET  /periods                        GET  /prodi-options
 *   GET  /mapping                        GET  /mapping/{entity}
 *   POST /mapping/{entity}               POST /mapping/{entity}/bulk
 *   POST /mapping/{entity}/unmap         POST /mapping/{entity}/auto
 *   GET  /mapping/{entity}/candidates
 *   GET  /{entity}                       GET  /{entity}/{id}
 *   POST /{entity}/preview               POST /{entity}/validate
 *   POST /{entity}/compare
 *   GET  /validation/summary             GET  /validation/issues
 *   GET  /sync/order                     GET  /sync/jobs
 *   POST /sync/jobs                      GET  /sync/jobs/{id}
 *   POST /sync/jobs/{id}/run             POST /sync/jobs/{id}/retry-failed
 *   POST /sync/jobs/{id}/cancel
 *   GET  /logs                           GET  /logs/{id}
 *   GET  /monitoring                     POST /import/preview
 */

export interface EntityListResponse<K extends EntityKey> {
    data: RowMap[K][];
    meta: Paginated<RowMap[K]>['meta'];
    stats: Record<string, number>;
    entity: EntityKey;
    capability: string;
    capabilityNote: string;
    acts: Record<string, string | undefined>;
}

export interface ConnectionResponse {
    profile: ConnectionProfile;
    status: NeoFeederConnectionStatus;
    token: { expiresAt: string | null; issuedAt: string | null; refreshesLast24h: number };
    dictionary: { synced: boolean; version: string | null; fetchedAt: string | null; actCount: number };
    events: { at: string; action: string; status: string; message: string }[];
    retryPolicy: { maxAttempts: number; baseDelayMs: number };
}

export interface SyncJobListResponse {
    data: SyncJob[];
    meta: { page: number; perPage: number; total: number; lastPage: number };
    stats: {
        queued: number;
        running: number;
        completed: number;
        partial: number;
        failed: number;
        totalItems: number;
        successItems: number;
        failedItems: number;
    };
}

export interface LogListResponse {
    data: SyncLogEntry[];
    meta: { page: number; perPage: number; total: number; lastPage: number };
    stats: { total: number; success: number; failed: number; avgDurationMs: number };
}

export interface ValidationSummaryResponse {
    summaries: ValidationSummary[];
    totals: { total: number; valid: number; critical: number; error: number; warning: number; info: number; conflict: number };
}

export interface IssueListResponse {
    data: ValidationIssue[];
    meta: { page: number; perPage: number; total: number; lastPage: number };
    grouped: { code: string; message: string; entity: EntityKey; severity: ValidationIssue['severity']; count: number }[];
}

export interface MappingListResponse {
    data: MappingRecord[];
    meta: { page: number; perPage: number; total: number; lastPage: number };
    stats: MappingStats;
}

export interface ReferenceListResponse {
    definition: ReferenceDefinition;
    data: ReferenceItem[];
    meta: { page: number; perPage: number; total: number; lastPage: number };
    dictionaryVerified: boolean;
    requiresProdi: boolean;
}

export interface PeriodsResponse {
    active: number | null;
    data: (SiakadSemester & { mappingStatus: string; pddiktiId: string | null })[];
}

const toParams = (query: ListQuery = {}): Record<string, string | number> => {
    const params: Record<string, string | number> = {};
    if (query.page) params.page = query.page;
    if (query.perPage) params.perPage = query.perPage;
    if (query.search) params.search = query.search;
    if (query.sort) params.sort = query.sort;
    if (query.direction) params.direction = query.direction;
    Object.entries(query.filters ?? {}).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') return;
        params[key] = String(value);
    });
    return params;
};

export const siakadApi = {
    session: () => get<OperatorSession>('/session'),

    /**
     * Login/logout operator integrator.
     *
     * Hanya dipakai mode nyata. Frontend yang berada pada subdomain terpisah
     * tidak menerima cookie sesi SIAKAD secara otomatis, jadi operator login
     * dari halaman integrator (lihat controller AuthController di backend).
     */
    auth: {
        login: (email: string, password: string, remember = false) =>
            post<OperatorSession>('/login', { email, password, remember }),
        logout: () => post<{ message: string }>('/logout'),
    },

    dashboard: () => get<DashboardSummary>('/dashboard/summary'),

    connection: {
        get: () => get<ConnectionResponse>('/connection'),
        save: (payload: { profile: Partial<ConnectionProfile>; password?: string }) => put<{ profile: ConnectionProfile; status: NeoFeederConnectionStatus }>('/connection', payload),
        test: () => post<ConnectionTestResult>('/connection/test'),
        authenticate: () => post<{ status: string; message: string; tokenExpiresAt: string | null; serverVersion: string | null }>('/connection/authenticate'),
        refreshToken: () => post<{ status: string; message: string; tokenExpiresAt: string | null; serverVersion: string | null }>('/connection/token/refresh'),
        syncDictionary: () => post<{ synced: boolean; version: string; actCount: number; fetchedAt: string; message: string }>('/connection/dictionary/sync'),
    },

    references: {
        summary: () => get<ReferenceSummary[]>('/references'),
        list: (key: string, query?: ListQuery) => get<ReferenceListResponse>(`/references/${key}`, toParams(query)),
    },

    periods: () => get<PeriodsResponse>('/periods'),
    prodiOptions: () => get<{ value: string; label: string; kode: string; mapped: boolean }[]>('/prodi-options'),

    mapping: {
        summary: () => get<MappingStats[]>('/mapping'),
        list: (entity: EntityKey, query?: ListQuery) => get<MappingListResponse>(`/mapping/${entity}`, toParams(query)),
        save: (entity: EntityKey, payload: { localId: string; externalId: string; externalLabel?: string; externalCode?: string; mappingType?: string }) =>
            post<{ record: MappingRecord }>(`/mapping/${entity}`, payload),
        bulk: (entity: EntityKey, items: { localId: string; externalId: string; mappingType?: string }[]) => post<{ updated: number; requested: number }>(`/mapping/${entity}/bulk`, { items }),
        unmap: (entity: EntityKey, localIds: string[]) => post<{ updated: number }>(`/mapping/${entity}/unmap`, { localIds }),
        auto: (entity: EntityKey, mode: 'code' | 'name' | 'identity') => post<AutoMapResult>(`/mapping/${entity}/auto`, { mode }),
        candidates: (entity: EntityKey, localId: string) => get<{ candidates: MappingCandidate[] }>(`/mapping/${entity}/candidates`, { localId }),
    },

    entities: {
        list: <K extends EntityKey>(entity: K, query?: ListQuery) => get<EntityListResponse<K>>(`/${entity}`, toParams(query)),
        detail: (entity: EntityKey, localId: string) => get<EntityDetail>(`/${entity}/${localId}`),
        preview: (entity: EntityKey, ids: string[], dryRun = true) => post<PayloadPreviewResponse>(`/${entity}/preview`, { ids, dryRun }),
        validate: (entity: EntityKey, ids: string[] = []) => post<{ entity: EntityKey; issues: ValidationIssue[]; checkedAt: string }>(`/${entity}/validate`, { ids }),
        compare: (entity: EntityKey, ids: string[]) =>
            post<{ entity: EntityKey; items: { localId: string; localLabel: string; status: string; comparison: ComparisonRow[]; remote: JsonObject | null }[]; generatedAt: string }>(`/${entity}/compare`, { ids }),
    },

    validation: {
        summary: () => get<ValidationSummaryResponse>('/validation/summary'),
        issues: (query?: ListQuery) => get<IssueListResponse>('/validation/issues', toParams(query)),
    },

    sync: {
        order: () =>
            get<{ order: number; entity: EntityKey; label: string; dependsOn: EntityKey[]; mandatory: boolean; mapped: number; unmapped: number; total: number; ready: boolean; capability: string; capabilityNote: string }[]>('/sync/order'),
        jobs: (query?: ListQuery) => get<SyncJobListResponse>('/sync/jobs', toParams(query)),
        job: (id: string) => get<SyncJob>(`/sync/jobs/${id}`),
        create: (payload: {
            entity: EntityKey;
            ids: string[];
            dryRun: boolean;
            periodId?: string | null;
            periodLabel?: string | null;
            prodiId?: string | null;
            prodiLabel?: string | null;
        }) => post<SyncJob>('/sync/jobs', payload),
        run: (id: string) => post<SyncJob>(`/sync/jobs/${id}/run`),
        retryFailed: (id: string) => post<SyncJob>(`/sync/jobs/${id}/retry-failed`),
        cancel: (id: string) => post<SyncJob>(`/sync/jobs/${id}/cancel`),
    },

    logs: {
        list: (query?: ListQuery) => get<LogListResponse>('/logs', toParams(query)),
        detail: (id: string) => get<SyncLogEntry>(`/logs/${id}`),
    },

    monitoring: () => get<MonitoringSummary>('/monitoring'),

    importPreview: (payload: { entity: EntityKey; format: 'csv' | 'json'; content: string }) =>
        post<{
            entity: EntityKey;
            format: string;
            total: number;
            preview: { index: number; row: Record<string, unknown>; issues: ValidationIssue[]; blocking: number }[];
            summary: { valid: number; invalid: number };
            note: string;
        }>('/import/preview', payload),
};

export type SiakadApi = typeof siakadApi;
