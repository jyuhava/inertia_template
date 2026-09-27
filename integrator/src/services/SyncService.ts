import type { ListQuery } from '@/types/common';
import type { EntityKey, PayloadPreviewItem, PayloadPreviewResponse, SyncJob, SyncJobItem } from '@/types/integration';
import { siakadApi } from '@/api/siakad';
import { getSyncStep, syncOrder } from '@/config/syncOrder';
import { appConfig } from '@/config/app.config';
import { isRetryableCategory } from '@/utils/errors';

export interface SyncPlanSummary {
    total: number;
    willSend: number;
    willUpdate: number;
    willSkip: number;
    blocked: number;
    invalid: number;
    warnings: number;
    conflicts: number;
    estimatedDurationMs: number;
}

/**
 * SyncService
 * ===========
 * Mengelola siklus hidup job sinkronisasi: perencanaan, konfirmasi,
 * pembuatan job, pemantauan progres, retry, dan pembatalan.
 */
export const SyncService = {
    order: () => siakadApi.sync.order(),

    jobs: (query: ListQuery = {}) => siakadApi.sync.jobs(query),

    job: (id: string) => siakadApi.sync.job(id),

    create: (payload: {
        entity: EntityKey;
        ids: string[];
        dryRun: boolean;
        periodId?: string | null;
        periodLabel?: string | null;
        prodiId?: string | null;
        prodiLabel?: string | null;
    }) => siakadApi.sync.create(payload),

    run: (id: string) => siakadApi.sync.run(id),

    retryFailed: (id: string) => siakadApi.sync.retryFailed(id),

    cancel: (id: string) => siakadApi.sync.cancel(id),

    preview: (entity: EntityKey, ids: string[], dryRun = true) => siakadApi.entities.preview(entity, ids, dryRun),

    /**
     * Ringkasan rencana sinkronisasi untuk dialog konfirmasi:
     * "Data yang akan dikirim: 36 / Data baru: 10 / Data update: 20 / Invalid: 6".
     */
    planSummary: (preview: PayloadPreviewResponse, averageLatencyMs = 480): SyncPlanSummary => {
        const items = preview.items;
        const invalid = items.filter((item) => item.issues.some((issue) => issue.severity === 'critical' || issue.severity === 'error')).length;
        const blocked = items.filter((item) => !item.dependencies.ok).length;
        const willSend = items.filter((item) => item.action === 'INSERT' && item.dependencies.ok && !itemsAreInvalid(item)).length;
        const willUpdate = items.filter((item) => item.action === 'UPDATE' && item.dependencies.ok && !itemsAreInvalid(item)).length;
        const willSkip = items.filter((item) => item.action === 'SKIP' || !item.dependencies.ok).length;

        return {
            total: items.length,
            willSend,
            willUpdate,
            willSkip,
            blocked,
            invalid,
            warnings: items.filter((item) => item.issues.some((issue) => issue.severity === 'warning')).length,
            conflicts: items.filter((item) => item.status === 'CONFLICT').length,
            estimatedDurationMs: (willSend + willUpdate) * averageLatencyMs,
        };
    },

    planFromItems: (items: PayloadPreviewItem[], averageLatencyMs = 480): SyncPlanSummary => {
        const invalid = items.filter((item) => item.issues.some((issue) => issue.severity === 'critical' || issue.severity === 'error')).length;
        const blocked = items.filter((item) => !item.dependencies.ok).length;
        const sendable = items.filter((item) => item.action !== 'SKIP' && item.dependencies.ok && !item.issues.some((issue) => issue.severity === 'critical' || issue.severity === 'error'));

        return {
            total: items.length,
            willSend: sendable.filter((item) => item.action === 'INSERT').length,
            willUpdate: sendable.filter((item) => item.action === 'UPDATE').length,
            willSkip: items.length - sendable.length,
            blocked,
            invalid,
            warnings: items.filter((item) => item.issues.some((issue) => issue.severity === 'warning')).length,
            conflicts: items.filter((item) => item.status === 'CONFLICT').length,
            estimatedDurationMs: sendable.length * averageLatencyMs,
        };
    },

    /** Ambil hanya item yang boleh dikirim (dipakai sebelum membuat job). */
    sendableIds: (preview: PayloadPreviewResponse): string[] =>
        preview.items
            .filter((item) => item.action !== 'SKIP' && item.dependencies.ok && !item.issues.some((issue) => issue.severity === 'critical' || issue.severity === 'error'))
            .map((item) => item.localId),

    blockedReasons: (preview: PayloadPreviewResponse): { localLabel: string; reason: string }[] =>
        preview.items
            .filter((item) => !item.dependencies.ok)
            .flatMap((item) => item.dependencies.blockers.map((blocker) => ({ localLabel: item.localLabel, reason: blocker.reason }))),

    progressPercent: (job: SyncJob): number => (job.total === 0 ? 0 : Math.round((job.processed / job.total) * 100)),

    remaining: (job: SyncJob): number => Math.max(0, job.total - job.processed),

    estimatedRemainingMs: (job: SyncJob, averageLatencyMs = 480): number => SyncService.remaining(job) * averageLatencyMs,

    isFinished: (job: SyncJob): boolean => ['COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED'].includes(job.status),

    /** Retry hanya untuk kegagalan teknis, bukan kegagalan validasi. */
    retryableItems: (job: SyncJob): SyncJobItem[] =>
        job.items.filter((item) => item.status === 'FAILED' && (item.errorCategory === null || isRetryableCategory(item.errorCategory)) && item.attempts < item.maxAttempts),

    nonRetryableItems: (job: SyncJob): SyncJobItem[] => job.items.filter((item) => item.status === 'FAILED' && !SyncService.retryableItems(job).includes(item)),

    dependencyNote: (entity: EntityKey): string => {
        const step = getSyncStep(entity);
        if (!step || step.dependsOn.length === 0) return 'Tidak memiliki dependency.';
        return `Memerlukan: ${step.dependsOn.map((dependency) => dependency).join(', ')}.`;
    },

    maxBulkItems: appConfig.maxBulkItemsPerJob,

    orderLabel: (entity: EntityKey): string => {
        const index = syncOrder.findIndex((step) => step.entity === entity);
        return index === -1 ? '—' : `${index + 1} dari ${syncOrder.length}`;
    },
};

const itemsAreInvalid = (item: PayloadPreviewItem): boolean =>
    item.issues.some((issue) => issue.severity === 'critical' || issue.severity === 'error');
