import type { JsonObject } from '@/types/common';
import type { EntityKey, JobItemStatus, SyncJob, SyncJobItem, SyncLogEntry } from '@/types/integration';
import { entityDefinitions } from '@/config/entities';
import { getActDefinition } from '@/services/neofeeder/ActRegistry';
import { buildPayload } from '@/services/neofeeder/TransformService';
import { getVersionAdapter } from '@/services/neofeeder/SchemaAdapter';
import { mockUuid } from './sourceData';
import { isoNow, mockState } from './state';
import { callAct, simulateLatency } from './neofeederSim';
import { asString } from '@/utils/json';
import { dataset } from './sourceData';

/**
 * SyncRunner (mock)
 * =================
 * Menjalankan antrean sinkronisasi item-per-item seperti mesin sinkronisasi
 * sebenarnya: status berjalan diperbarui bertahap sehingga UI dapat
 * menampilkan progres nyata, dan setiap percobaan dicatat ke log.
 */

export type RowResolver = (entity: EntityKey, localId: string | number | null) => string | null;

const actionForItem = (entity: EntityKey, localId: string, hasExternalId: boolean): 'INSERT' | 'UPDATE' | 'SKIP' => {
    const definition = entityDefinitions[entity];
    if (definition.acts.syncCapability === 'read-only') return 'SKIP';
    if (definition.acts.syncCapability === 'update-only' && !hasExternalId) return 'SKIP';
    return hasExternalId ? 'UPDATE' : 'INSERT';
};

const actForItem = (entity: EntityKey, action: 'INSERT' | 'UPDATE' | 'SKIP'): string | null => {
    const acts = entityDefinitions[entity].acts;
    if (action === 'INSERT') return acts.insert ?? null;
    if (action === 'UPDATE') return acts.update ?? acts.insert ?? null;
    return null;
};

const rowFor = (entity: EntityKey, localId: string): Record<string, unknown> | null => {
    const rows = [...mockStateRowSource(entity)];
    return rows.find((row) => String(row.localId || row.id) === localId) ?? null;
};

const mockStateRowSource = (entity: EntityKey): Record<string, unknown>[] => {
    switch (entity) {
        case 'perguruan-tinggi':
            return [dataset.perguruanTinggi as unknown as Record<string, unknown>];
        case 'prodi':
            return dataset.prodi as unknown as Record<string, unknown>[];
        case 'semester':
            return dataset.semester as unknown as Record<string, unknown>[];
        case 'dosen':
            return dataset.dosen as unknown as Record<string, unknown>[];
        case 'mahasiswa':
            return dataset.mahasiswa as unknown as Record<string, unknown>[];
        case 'riwayat-pendidikan':
            return dataset.riwayat as unknown as Record<string, unknown>[];
        case 'kurikulum':
            return dataset.kurikulum as unknown as Record<string, unknown>[];
        case 'mata-kuliah':
            return dataset.mataKuliah as unknown as Record<string, unknown>[];
        case 'mata-kuliah-kurikulum':
            return dataset.kurikulumItems as unknown as Record<string, unknown>[];
        case 'kelas':
            return dataset.kelas as unknown as Record<string, unknown>[];
        case 'dosen-pengajar':
            return dataset.pengajar as unknown as Record<string, unknown>[];
        case 'krs':
            return dataset.krs as unknown as Record<string, unknown>[];
        case 'nilai':
            return dataset.nilai as unknown as Record<string, unknown>[];
        case 'aktivitas-mahasiswa':
            return dataset.aktivitas as unknown as Record<string, unknown>[];
        case 'kelulusan':
            return dataset.kelulusan as unknown as Record<string, unknown>[];
        default:
            return [];
    }
};

const labelFor = (entity: EntityKey, row: Record<string, unknown> | null, localId: string): string => {
    if (!row) return localId;
    switch (entity) {
        case 'mahasiswa':
        case 'kelulusan':
            return `${asString(row.nim)} — ${asString(row.nama)}`;
        case 'kelas':
            return `${asString(row.kodeKelas)} — ${asString(row.namaMk)}`;
        case 'mata-kuliah':
            return `${asString(row.kode)} — ${asString(row.nama)}`;
        case 'prodi':
            return `${asString(row.kodeProdi)} — ${asString(row.namaProdi)}`;
        default:
            return asString(row.nama ?? row.judul ?? row.kode ?? localId, localId);
    }
};

export const createJob = (input: {
    entity: EntityKey;
    ids: string[];
    dryRun: boolean;
    user: string;
    periodId?: string | null;
    periodLabel?: string | null;
    prodiId?: string | null;
    prodiLabel?: string | null;
    maxAttempts?: number;
}): SyncJob => {
    const jobId = `job-${mockUuid(`${input.entity}-${Date.now()}-${input.ids.join(',')}`).slice(0, 12)}`;
    const maxAttempts = input.maxAttempts ?? Math.max(1, mockState.connection.retryCount + 1);

    const items: SyncJobItem[] = input.ids.map((localId, index) => {
        const row = rowFor(input.entity, localId);
        const mapping = mockState.mappings[input.entity]?.[localId];
        const hasExternalId = Boolean(mapping?.externalId);
        const action = actionForItem(input.entity, localId, hasExternalId);
        const act = actForItem(input.entity, action) ?? entityDefinitions[input.entity].acts.list;

        return {
            id: `${jobId}-item-${index + 1}`,
            jobId,
            entity: input.entity,
            localId,
            localLabel: labelFor(input.entity, row, localId),
            pddiktiId: mapping?.externalId ?? null,
            act,
            action: action ?? 'SKIP',
            status: action === 'SKIP' ? 'SKIPPED' : 'PENDING',
            attempts: 0,
            maxAttempts,
            message: action === 'SKIP' ? 'Tidak ada act pengiriman untuk entitas ini (read-only / belum ada di PDDikti).' : null,
            errorCategory: null,
            durationMs: null,
            startedAt: null,
            finishedAt: null,
            responseCode: null,
            requestId: null,
        };
    });

    const job: SyncJob = {
        id: jobId,
        entity: input.entity,
        status: 'QUEUED',
        dryRun: input.dryRun,
        periodId: input.periodId ?? null,
        periodLabel: input.periodLabel ?? null,
        prodiId: input.prodiId ?? null,
        prodiLabel: input.prodiLabel ?? null,
        createdBy: input.user,
        createdAt: isoNow(),
        startedAt: null,
        finishedAt: null,
        total: items.length,
        processed: 0,
        success: 0,
        failed: 0,
        skipped: items.filter((item) => item.status === 'SKIPPED').length,
        invalid: 0,
        cancelRequested: false,
        items,
        order: entityDefinitions[input.entity].syncWeight,
        notes: input.dryRun ? 'DRY RUN — tidak ada data yang dikirim ke Neo Feeder.' : null,
    };

    mockState.jobs.unshift(job);
    return job;
};

const writeLog = (job: SyncJob, item: SyncJobItem, payload: JsonObject | null, response: JsonObject | null, status: 'success' | 'failed', message: string, errorCategory: string | null, durationMs: number, httpStatus: number | null): SyncLogEntry => {
    const log: SyncLogEntry = {
        id: `log-${mockUuid(`${job.id}-${item.id}-${item.attempts}`).slice(0, 14)}`,
        requestId: `req-${mockUuid(`${item.id}-${item.attempts}`).slice(0, 12)}`,
        entity: job.entity,
        localId: item.localId,
        localLabel: item.localLabel,
        pddiktiId: item.pddiktiId,
        act: item.act,
        action: item.action === 'SKIP' ? 'UPDATE' : item.action,
        payload,
        response,
        httpStatus,
        neoFeederCode: response ? Number(response.error_code ?? -1) : null,
        neoFeederMessage: response ? asString(response.error_desc) || null : null,
        status,
        errorCategory,
        durationMs,
        attempt: item.attempts,
        user: job.createdBy,
        jobId: job.id,
        createdAt: isoNow(),
    };
    mockState.logs.unshift(log);
    return log;
};

const buildRecord = (entity: EntityKey, localId: string, row: Record<string, unknown>, action: 'INSERT' | 'UPDATE', resolver: RowResolver): JsonObject | null => {
    const acts = entityDefinitions[entity].acts;
    const act = action === 'UPDATE' ? (acts.update ?? acts.insert) : acts.insert;
    if (!act) return null;

    const mapping = mockState.mappings[entity]?.[localId];
    const existing = mapping?.externalId
        ? ({ [getActDefinition(act)?.responseIdField ?? 'id']: mapping.externalId } as JsonObject)
        : null;

    const built = buildPayload(act, {
        entity,
        localId,
        action,
        values: row,
        existing,
        issues: [],
        resolve: resolver,
        resolveReference: (refKey, value) => {
            const items = mockState.references[refKey] ?? [];
            const found = items.find((item) => (item.localValue ?? item.name) === value);
            return found ? found.id : null;
        },
        version: mockState.status.serverVersion,
        dictionaryFields: mockState.dictionary ? (getActDefinition(act)?.recordFields ?? []).map((field) => field.key) : null,
    });

    return built.record;
};

export const startJobRunner = (jobId: string, resolver: RowResolver): void => {
    const job = mockState.jobs.find((item) => item.id === jobId);
    if (!job || job.status === 'RUNNING') return;

    job.status = 'RUNNING';
    job.startedAt = job.startedAt ?? isoNow();

    const run = async (): Promise<void> => {
        for (const item of job.items) {
            if (job.cancelRequested) {
                job.status = 'CANCELLED';
                job.finishedAt = isoNow();
                return;
            }

            if (item.status === 'SKIPPED' || item.status === 'SUCCESS') continue;

            item.status = 'RUNNING';
            item.startedAt = isoNow();
            item.attempts += 1;

            const row = rowFor(job.entity, item.localId);
            if (!row) {
                item.status = 'FAILED';
                item.message = 'Data SIAKAD tidak ditemukan.';
                item.errorCategory = 'UNKNOWN_ERROR';
                job.failed += 1;
                job.processed += 1;
                continue;
            }

            const action: 'INSERT' | 'UPDATE' = item.action === 'INSERT' ? 'INSERT' : 'UPDATE';
            const record = buildRecord(job.entity, item.localId, row, action, resolver);
            const payload: JsonObject = { act: item.act, token: '[HIDDEN]', ...(record ? { record } : {}) };

            if (job.dryRun) {
                const latency = await simulateLatency(0.25);
                item.status = 'SKIPPED';
                item.message = 'DRY RUN: payload tervalidasi tanpa dikirim ke Neo Feeder.';
                item.durationMs = Math.round(latency);
                item.finishedAt = isoNow();
                job.skipped += 1;
                job.processed += 1;
                writeLog(job, item, payload, { error_code: 0, error_desc: 'DRY RUN', data: [] }, 'success', item.message, null, item.durationMs, 200);
                continue;
            }

            const versionAdapter = getVersionAdapter(mockState.status.serverVersion);
            const { raw, latencyMs, httpStatus } = await callAct({ act: item.act, record: record ?? undefined }, item.attempts);
            const code = Number(raw.error_code ?? -1);
            const message = asString(raw.error_desc) || (code === 0 ? 'Sukses' : 'Tidak ada keterangan');

            item.durationMs = Math.round(latencyMs);
            item.responseCode = code;
            item.finishedAt = isoNow();
            item.requestId = `req-${mockUuid(`${item.id}-${item.attempts}`).slice(0, 12)}`;

            if (code === 0 && httpStatus < 500) {
                item.status = 'SUCCESS';
                item.message = `Sukses (${versionAdapter.label})`;
                item.errorCategory = null;
                job.success += 1;

                const idField = getActDefinition(item.act)?.responseIdField ?? 'id';
                const returned = Array.isArray(raw.data) && raw.data[0] ? asString((raw.data[0] as JsonObject)[idField]) : '';
                const mapping = mockState.mappings[job.entity]?.[item.localId];
                if (mapping) {
                    mapping.externalId = mapping.externalId ?? (returned || mockUuid(`${item.act}-${item.localId}`));
                    mapping.externalLabel = mapping.externalLabel ?? mapping.localLabel;
                    mapping.status = 'MAPPED';
                    mapping.lastSyncedAt = isoNow();
                    mapping.lastMessage = 'Sinkronisasi berhasil.';
                    item.pddiktiId = mapping.externalId;
                }
            } else {
                const category = httpStatus === 504 || code === 500 ? 'TIMEOUT' : code === 401 ? 'AUTH_ERROR' : code === 409 ? 'CONFLICT' : code === 400 ? 'VALIDATION_ERROR' : 'PDDIKTI_ERROR';
                item.status = 'FAILED';
                item.message = message;
                item.errorCategory = category;
                job.failed += 1;

                if (category === 'AUTH_ERROR') {
                    mockState.status = { ...mockState.status, status: 'AUTHENTICATION_FAILED', message };
                }
            }

            job.processed += 1;
            writeLog(job, item, payload, raw as JsonObject, item.status === 'SUCCESS' ? 'success' : 'failed', message, item.errorCategory, item.durationMs, httpStatus);
        }

        job.status = job.failed === 0 ? 'COMPLETED' : job.success > 0 ? 'PARTIAL' : 'FAILED';
        job.finishedAt = isoNow();
        mockState.status = { ...mockState.status, lastSuccessfulRequestAt: job.success > 0 ? isoNow() : mockState.status.lastSuccessfulRequestAt };
    };

    void run();
};

export const retryFailedItems = (jobId: string, resolver: RowResolver): SyncJob | null => {
    const job = mockState.jobs.find((item) => item.id === jobId);
    if (!job) return null;

    let retried = 0;
    job.items.forEach((item) => {
        if (item.status !== 'FAILED') return;
        if (item.attempts >= item.maxAttempts) {
            item.message = `${item.message ?? ''} (batas percobaan ${item.maxAttempts} tercapai)`.trim();
            return;
        }
        if (item.errorCategory === 'VALIDATION_ERROR' || item.errorCategory === 'CONFLICT') {
            item.message = `${item.message ?? ''} — perbaiki data di SIAKAD sebelum mencoba ulang.`.trim();
            return;
        }
        item.status = 'PENDING';
        item.message = 'Menunggu percobaan ulang.';
        retried += 1;
    });

    if (retried > 0) {
        job.failed = Math.max(0, job.failed - retried);
        job.processed = Math.max(0, job.processed - retried);
        job.status = 'QUEUED';
        job.finishedAt = null;
        startJobRunner(jobId, resolver);
    }

    return job;
};

export const cancelJob = (jobId: string): SyncJob | null => {
    const job = mockState.jobs.find((item) => item.id === jobId);
    if (!job) return null;
    job.cancelRequested = true;
    if (job.status === 'QUEUED') job.status = 'CANCELLED';
    return job;
};

export const jobSummary = (job: SyncJob): { total: number; processed: number; success: number; failed: number; skipped: number; invalid: number; status: JobItemStatus[] } => ({
    total: job.total,
    processed: job.processed,
    success: job.success,
    failed: job.failed,
    skipped: job.skipped,
    invalid: job.invalid,
    status: job.items.map((item) => item.status),
});
