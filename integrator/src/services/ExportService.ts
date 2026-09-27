import type { EntityKey, PayloadPreviewItem, SyncLogEntry } from '@/types/integration';
import { entityDefinitions } from '@/config/entities';
import { rowValue } from '@/types/rows';
import { toCsv, jsonToCsv } from '@/utils/csv';
import { buildFilename, downloadCsv, downloadJson } from '@/utils/download';
import { maskSensitive } from '@/utils/json';
import type { JsonValue } from '@/types/common';
import { formatDateTime } from '@/utils/format';

/**
 * ExportService
 * =============
 * Semua tabel dapat diekspor ke CSV / JSON, termasuk payload dan log.
 * Nilai sensitif (token/password) selalu disensor sebelum diekspor.
 */
export const ExportService = {
    /** Ekspor baris tabel sesuai kolom yang terlihat. */
    exportRowsToCsv: (entity: EntityKey, rows: Record<string, unknown>[], visibleColumns: string[]): void => {
        const definition = entityDefinitions[entity];
        const columns = definition.columns.filter((column) => visibleColumns.includes(column.key));
        const headers = columns.map((column) => column.label);
        const data = rows.map((row) => columns.map((column) => rowValue(row, column.key) as string | number | null));

        downloadCsv(toCsv(headers, data), buildFilename(entity, 'csv'));
    },

    exportRowsToJson: (entity: EntityKey, rows: Record<string, unknown>[]): void => {
        downloadJson(
            {
                entity,
                exportedAt: new Date().toISOString(),
                total: rows.length,
                data: rows.map((row) => maskSensitive(row as JsonValue)),
            },
            buildFilename(entity, 'json'),
        );
    },

    /** Ekspor payload yang akan dikirim (token disensor). */
    exportPayloads: (entity: EntityKey, items: PayloadPreviewItem[]): void => {
        downloadJson(
            {
                entity,
                generatedAt: new Date().toISOString(),
                note: 'Token tidak pernah disertakan pada payload yang diekspor.',
                items: items.map((item) => ({
                    localId: item.localId,
                    label: item.localLabel,
                    act: item.act,
                    action: item.action,
                    status: item.status,
                    record: maskSensitive(item.record as JsonValue),
                    skippedFields: item.skippedFields,
                    blockers: item.dependencies.blockers,
                })),
            },
            buildFilename(`${entity}-payload`, 'json'),
        );
    },

    exportSinglePayload: (item: PayloadPreviewItem): void => {
        downloadJson(
            { act: item.act, token: '[HIDDEN]', record: maskSensitive(item.record as JsonValue) },
            buildFilename(`${item.entity}-${item.localId}-payload`, 'json'),
        );
    },

    exportLogs: (logs: SyncLogEntry[], format: 'csv' | 'json' = 'csv'): void => {
        if (format === 'json') {
            downloadJson({ exportedAt: new Date().toISOString(), total: logs.length, logs }, buildFilename('logs', 'json'));
            return;
        }

        const headers = ['Waktu', 'Entity', 'Data', 'Act', 'Aksi', 'Status', 'Kode PDDikti', 'Kategori Error', 'Durasi (ms)', 'Percobaan', 'Pengguna'];
        const rows = logs.map((log) => [
            formatDateTime(log.createdAt),
            log.entity,
            log.localLabel,
            log.act,
            log.action,
            log.status,
            log.neoFeederCode ?? '',
            log.errorCategory ?? '',
            log.durationMs,
            log.attempt,
            log.user,
        ]);
        downloadCsv(toCsv(headers, rows), buildFilename('logs', 'csv'));
    },

    exportRequestResponse: (log: SyncLogEntry): void => {
        downloadJson(
            {
                requestId: log.requestId,
                act: log.act,
                entity: log.entity,
                localId: log.localId,
                request: maskSensitive(log.payload as JsonValue),
                response: log.response,
                meta: { httpStatus: log.httpStatus, code: log.neoFeederCode, message: log.neoFeederMessage, durationMs: log.durationMs, attempt: log.attempt },
            },
            buildFilename(`log-${log.requestId}`, 'json'),
        );
    },

    exportArbitraryJson: (payload: unknown, prefix: string): void => {
        downloadJson(payload, buildFilename(prefix, 'json'));
    },

    exportJsonRows: (rows: Record<string, JsonValue>[], prefix: string): void => {
        const csv = jsonToCsv(rows);
        if (csv) downloadCsv(csv, buildFilename(prefix, 'csv'));
    },
};
