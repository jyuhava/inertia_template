import type { JsonObject } from './common';

/**
 * Entitas akademik yang dikelola Integrator.
 * SIAKAD tetap sumber data utama — integrator hanya memetakan, memvalidasi,
 * mentransformasi, dan mengirimkan ke Neo Feeder.
 */
export type EntityKey =
    | 'perguruan-tinggi'
    | 'prodi'
    | 'semester'
    | 'dosen'
    | 'mahasiswa'
    | 'riwayat-pendidikan'
    | 'kurikulum'
    | 'mata-kuliah'
    | 'mata-kuliah-kurikulum'
    | 'kelas'
    | 'dosen-pengajar'
    | 'krs'
    | 'nilai'
    | 'aktivitas-mahasiswa'
    | 'kelulusan';

export type MappingStatus = 'MAPPED' | 'UNMAPPED' | 'INVALID' | 'CONFLICT';

export type DataStatus =
    | 'UNMAPPED'
    | 'MAPPED'
    | 'VALID'
    | 'INVALID'
    | 'NEW'
    | 'CHANGED'
    | 'SYNCED'
    | 'SYNC_REQUIRED'
    | 'SYNCING'
    | 'SUCCESS'
    | 'FAILED'
    | 'CONFLICT';

export type JobStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'CANCELLED';

export type JobItemStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'INVALID';

export type ComparisonStatus = 'MATCH' | 'DIFFERENT' | 'MISSING_LOCAL' | 'MISSING_PDDIKTI';

export interface ComparisonRow {
    field: string;
    label: string;
    local: string | number | boolean | null;
    remote: string | number | boolean | null;
    status: ComparisonStatus;
    /** true bila field ini adalah identitas kuat (mis. NIM/NIDN) sehingga perbedaan = CONFLICT */
    identity?: boolean;
}

export interface ValidationIssue {
    id: string;
    entity: EntityKey;
    localId: string;
    localLabel: string;
    severity: 'critical' | 'error' | 'warning' | 'info';
    code: string;
    field?: string;
    message: string;
    remediation?: string;
    createdAt: string;
}

export interface ValidationSummary {
    entity: EntityKey;
    total: number;
    valid: number;
    critical: number;
    error: number;
    warning: number;
    info: number;
    conflict: number;
}

export interface PayloadPreviewItem {
    localId: string;
    localLabel: string;
    act: string;
    entity: EntityKey;
    action: 'INSERT' | 'UPDATE' | 'SKIP';
    status: DataStatus;
    record: JsonObject;
    /** field yang dikirim vs field yang tidak dikirim karena belum terpetakan */
    skippedFields: { field: string; reason: string }[];
    issues: ValidationIssue[];
    dependencies: DependencyCheckResult;
}

export interface PayloadPreviewResponse {
    entity: EntityKey;
    act: string;
    dryRun: boolean;
    generatedAt: string;
    items: PayloadPreviewItem[];
    summary: {
        total: number;
        ready: number;
        invalid: number;
        warning: number;
        conflict: number;
        skipped: number;
    };
}

export interface DependencyRequirement {
    entity: EntityKey;
    label: string;
    /** field pada payload yang mengisi id PDDikti milik dependency */
    field: string;
}

export interface DependencyBlocker {
    requirement: DependencyRequirement;
    localId: string | null;
    localLabel: string;
    reason: string;
}

export interface DependencyCheckResult {
    ok: boolean;
    blockers: DependencyBlocker[];
}

export interface SyncJobItem {
    id: string;
    jobId: string;
    entity: EntityKey;
    localId: string;
    localLabel: string;
    pddiktiId: string | null;
    act: string;
    action: 'INSERT' | 'UPDATE' | 'SKIP';
    status: JobItemStatus;
    attempts: number;
    maxAttempts: number;
    message: string | null;
    errorCategory: string | null;
    durationMs: number | null;
    startedAt: string | null;
    finishedAt: string | null;
    responseCode: number | null;
    requestId: string | null;
}

export interface SyncJob {
    id: string;
    entity: EntityKey;
    status: JobStatus;
    dryRun: boolean;
    periodId: string | null;
    periodLabel: string | null;
    prodiId: string | null;
    prodiLabel: string | null;
    createdBy: string;
    createdAt: string;
    startedAt: string | null;
    finishedAt: string | null;
    total: number;
    processed: number;
    success: number;
    failed: number;
    skipped: number;
    invalid: number;
    cancelRequested: boolean;
    items: SyncJobItem[];
    order: number;
    notes?: string | null;
}

export interface SyncLogEntry {
    id: string;
    requestId: string;
    entity: EntityKey;
    localId: string;
    localLabel: string;
    pddiktiId: string | null;
    act: string;
    action: 'INSERT' | 'UPDATE' | 'SKIP';
    payload: JsonObject | null;
    response: JsonObject | null;
    httpStatus: number | null;
    neoFeederCode: number | null;
    neoFeederMessage: string | null;
    status: 'success' | 'failed';
    errorCategory: string | null;
    durationMs: number;
    attempt: number;
    user: string;
    jobId: string | null;
    createdAt: string;
}

export interface SyncOrderStep {
    order: number;
    entity: EntityKey;
    label: string;
    dependsOn: EntityKey[];
    mandatory: boolean;
}

export interface SyncResultSummary {
    total: number;
    success: number;
    failed: number;
    skipped: number;
    invalid: number;
    durationMs: number;
}

export interface NeoFeederConnectionStatus {
    status: 'CONNECTED' | 'DISCONNECTED' | 'AUTHENTICATION_FAILED' | 'TIMEOUT' | 'SERVER_ERROR';
    serverVersion: string | null;
    apiStatus: string | null;
    lastConnectedAt: string | null;
    lastSuccessfulRequestAt: string | null;
    tokenExpiresAt: string | null;
    message: string | null;
}

export interface ConnectionProfile {
    baseUrl: string;
    webServiceUrl: string;
    username: string;
    /** backend hanya mengirim penanda bahwa password tersimpan, bukan nilainya */
    passwordConfigured: boolean;
    timeoutSeconds: number;
    retryCount: number;
    active: boolean;
    useProxy: boolean;
}

export interface ConnectionTestResult {
    status: NeoFeederConnectionStatus['status'];
    message: string;
    latencyMs: number | null;
    serverVersion: string | null;
    apiStatus: string | null;
    checkedAt: string;
    steps: { label: string; ok: boolean; detail: string }[];
}

export interface DashboardSummary {
    connection: NeoFeederConnectionStatus;
    lastSync: {
        jobId: string;
        entity: EntityKey;
        finishedAt: string;
        success: number;
        failed: number;
        total: number;
        user: string;
    } | null;
    totals: {
        siakad: number;
        pddikti: number;
        synced: number;
        willSend: number;
        willUpdate: number;
        invalid: number;
        failed: number;
        unmapped: number;
        conflict: number;
        inProgress: number;
    };
    perEntity: {
        entity: EntityKey;
        label: string;
        siakad: number;
        pddikti: number;
        synced: number;
        willSend: number;
        invalid: number;
        mapped: number;
        unmapped: number;
        progress: number;
    }[];
    recentJobs: {
        id: string;
        entity: EntityKey;
        status: JobStatus;
        total: number;
        success: number;
        failed: number;
        createdAt: string;
        createdBy: string;
        dryRun: boolean;
    }[];
    failedItems: {
        entity: EntityKey;
        localId: string;
        localLabel: string;
        message: string;
        errorCategory: string;
        createdAt: string;
        jobId: string;
    }[];
    validationWarnings: {
        code: string;
        message: string;
        entity: EntityKey;
        severity: 'critical' | 'error' | 'warning' | 'info';
        count: number;
    }[];
    mappingWarnings: {
        entity: EntityKey;
        label: string;
        unmapped: number;
        conflict: number;
        total: number;
    }[];
}

export interface MonitoringSummary {
    queue: { queued: number; running: number; completed: number; failed: number };
    throughput: { label: string; success: number; failed: number }[];
    latency: { act: string; avgMs: number; maxMs: number; calls: number }[];
    errorBreakdown: { category: string; count: number }[];
    recentFailures: SyncLogEntry[];
    tokenHealth: {
        status: NeoFeederConnectionStatus['status'];
        tokenExpiresAt: string | null;
        refreshesLast24h: number;
    };
}
