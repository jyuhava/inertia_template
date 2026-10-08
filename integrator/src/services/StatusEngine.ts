import type { ComparisonRow, ComparisonStatus, DataStatus, EntityKey, MappingStatus, ValidationIssue } from '@/types/integration';
import type { JsonObject } from '@/types/common';
import type { ReferenceKey } from '@/types/reference';
import { fieldMaps, type FieldPair } from '@/config/fieldMaps';

/**
 * StatusEngine
 * ============
 * Engine tunggal untuk:
 *  1. membandingkan data SIAKAD dengan data PDDIKTI (`Compare Center`)
 *  2. menentukan status data (NEW / CHANGED / SYNCED / INVALID / CONFLICT / UNMAPPED)
 *
 * Engine ini dipakai oleh backend integrator (mock maupun implementasi nyata)
 * DAN oleh mode dry-run di frontend, sehingga operator melihat hasil yang sama.
 */

export interface CompareOptions {
    /** Resolver id lokal -> id PDDikti (mapping persistent). */
    resolveExternalId: (entity: EntityKey, localId: string | number | null) => string | null;
    /** Resolver nilai referensi lokal (mis. "Islam") -> id referensi PDDikti. */
    resolveReference: (refKey: ReferenceKey, localValue: string | null) => string | null;
}

export interface CompareResult {
    rows: ComparisonRow[];
    differentFields: string[];
    missingLocalFields: string[];
    missingRemoteFields: string[];
    conflictFields: string[];
    matches: number;
}

const REFERENCE_ENTITY_KEYS: ReferenceKey[] = ['program-studi', 'semester', 'perguruan-tinggi'];

const isEmpty = (value: unknown): boolean => value === null || value === undefined || value === '';

const normalize = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? '1' : '0';
    return String(value).trim().replace(/\s+/g, ' ');
};

const comparable = (value: unknown): string =>
    normalize(value)
        .toLowerCase()
        .replace(/^(dr\.|ir\.|dr\. eng\.|drs\.|dra\.)\s*/i, '')
        .replace(/\s*,\s*(m\.kom|m\.t|m\.cs|m\.pd|m\.si|s\.kom|s\.t|m\.sc)\.?$/i, '')
        .replace(/[.,]/g, '');

/** Bandingkan satu field: lokal vs remote. */
const compareField = (
    field: FieldPair,
    local: Record<string, unknown>,
    remote: JsonObject,
    options: CompareOptions,
): ComparisonRow => {
    const localRaw = local[field.local];
    const remoteRaw = field.remote ? remote[field.remote] : undefined;
    const remoteLabelKey = field.remote ? `nama_${field.remote.replace(/^id_/, '')}` : null;
    const remoteLabel = remoteLabelKey ? remote[remoteLabelKey] : undefined;

    let status: ComparisonStatus = 'MATCH';
    let remoteDisplay: string | number | boolean | null = (remoteRaw as string | number | boolean | null) ?? null;

    if (field.noCompare) {
        status = 'MATCH';
        remoteDisplay = null;
    } else if (field.type === 'reference' && field.refKey) {
        if (REFERENCE_ENTITY_KEYS.includes(field.refKey)) {
            const resolved = options.resolveExternalId(
                field.refKey === 'program-studi' ? 'prodi' : field.refKey === 'semester' ? 'semester' : 'perguruan-tinggi',
                (localRaw as string | number | null) ?? null,
            );
            if (isEmpty(localRaw)) {
                status = 'MISSING_LOCAL';
            } else if (isEmpty(remoteRaw)) {
                status = 'MISSING_PDDIKTI';
            } else if (resolved && resolved === normalize(remoteRaw)) {
                status = 'MATCH';
            } else {
                status = 'DIFFERENT';
                remoteDisplay = (remoteLabel as string) ?? (remoteRaw as string);
            }
        } else if (!isEmpty(remoteLabel)) {
            // PDDikti mengirim label (nama_agama, nama_jenis_daftar, dst)
            const resolvedId = options.resolveReference(field.refKey, (localRaw as string) ?? null);
            const sameById = resolvedId !== null && normalize(remoteRaw) === normalize(resolvedId);
            const sameByLabel = comparable(localRaw) === comparable(remoteLabel);
            status = isEmpty(localRaw) ? 'MISSING_LOCAL' : isEmpty(remoteLabel) ? 'MISSING_PDDIKTI' : sameById || sameByLabel ? 'MATCH' : 'DIFFERENT';
            remoteDisplay = remoteLabel as string;
        } else {
            // Hanya tersedia ID referensi: tidak dapat dibandingkan secara isi
            status = isEmpty(localRaw) ? 'MISSING_LOCAL' : isEmpty(remoteRaw) ? 'MISSING_PDDIKTI' : 'MATCH';
        }
    } else if (isEmpty(localRaw) && isEmpty(remoteRaw)) {
        status = 'MATCH';
    } else if (isEmpty(localRaw)) {
        status = 'MISSING_LOCAL';
    } else if (isEmpty(remoteRaw)) {
        status = 'MISSING_PDDIKTI';
    } else {
        const same = field.type === 'number' || field.type === 'date' ? normalize(localRaw) === normalize(remoteRaw) : comparable(localRaw) === comparable(remoteRaw);
        status = same ? 'MATCH' : 'DIFFERENT';
    }

    return {
        field: field.local,
        label: field.label,
        local: (localRaw as string | number | boolean | null) ?? null,
        remote: remoteDisplay,
        status,
        identity: field.identity === true,
    };
};

export const compareEntity = (entity: EntityKey, local: Record<string, unknown>, remote: JsonObject | null, options: CompareOptions): CompareResult => {
    const fields = fieldMaps[entity] ?? [];
    const rows: ComparisonRow[] = [];
    const emptyRemote: JsonObject = {};

    fields.forEach((field) => {
        rows.push(compareField(field, local, remote ?? emptyRemote, options));
    });

    const differentFields = rows.filter((row) => row.status === 'DIFFERENT').map((row) => row.field);
    const conflictFields = rows.filter((row) => row.status === 'DIFFERENT' && row.identity === true).map((row) => row.field);

    return {
        rows,
        differentFields,
        conflictFields,
        missingLocalFields: rows.filter((row) => row.status === 'MISSING_LOCAL').map((row) => row.field),
        missingRemoteFields: rows.filter((row) => row.status === 'MISSING_PDDIKTI').map((row) => row.field),
        matches: rows.filter((row) => row.status === 'MATCH').length,
    };
};

export interface StatusInput {
    entity: EntityKey;
    mappingStatus: MappingStatus;
    hasRemote: boolean;
    comparison: CompareResult;
    issues: ValidationIssue[];
    /** status pengiriman terakhir dari log, bila ada */
    lastSyncStatus?: 'SUCCESS' | 'FAILED' | 'SYNCING' | null;
}

/**
 * Menentukan status data mengikuti aturan pada spesifikasi:
 *  - tidak ada mapping            -> UNMAPPED / NEW
 *  - mapping ada & data berbeda   -> CHANGED (identitas berbeda -> CONFLICT)
 *  - mapping ada & data sama      -> SYNCED
 *  - validasi gagal               -> INVALID
 */
export const determineDataStatus = (input: StatusInput): DataStatus => {
    const hasBlockingIssue = input.issues.some((issue) => issue.severity === 'critical' || issue.severity === 'error');

    if (input.lastSyncStatus === 'SYNCING') return 'SYNCING';
    if (hasBlockingIssue) return 'INVALID';
    if (input.mappingStatus === 'CONFLICT' || input.comparison.conflictFields.length > 0) return 'CONFLICT';
    if (input.mappingStatus === 'UNMAPPED' && !input.hasRemote) return 'UNMAPPED';
    if (input.lastSyncStatus === 'FAILED') return 'FAILED';
    if (!input.hasRemote) return 'NEW';
    if (input.comparison.differentFields.length > 0) return 'CHANGED';
    return 'SYNCED';
};

export interface StatusTally {
    total: number;
    synced: number;
    willSend: number;
    willUpdate: number;
    invalid: number;
    failed: number;
    unmapped: number;
    conflict: number;
    inProgress: number;
    mapped: number;
    pddikti: number;
}

export const emptyTally = (): StatusTally => ({
    total: 0,
    synced: 0,
    willSend: 0,
    willUpdate: 0,
    invalid: 0,
    failed: 0,
    unmapped: 0,
    conflict: 0,
    inProgress: 0,
    mapped: 0,
    pddikti: 0,
});

export const tallyStatus = (tally: StatusTally, status: DataStatus, mappingStatus: MappingStatus, hasRemote: boolean): StatusTally => {
    const next: StatusTally = { ...tally };
    next.total += 1;
    if (hasRemote) next.pddikti += 1;
    if (mappingStatus === 'MAPPED') next.mapped += 1;

    switch (status) {
        case 'SYNCED':
        case 'SUCCESS':
            next.synced += 1;
            break;
        case 'NEW':
            next.willSend += 1;
            break;
        case 'CHANGED':
        case 'SYNC_REQUIRED':
            next.willUpdate += 1;
            break;
        case 'INVALID':
            next.invalid += 1;
            break;
        case 'FAILED':
            next.failed += 1;
            break;
        case 'UNMAPPED':
            next.unmapped += 1;
            break;
        case 'CONFLICT':
            next.conflict += 1;
            break;
        case 'SYNCING':
            next.inProgress += 1;
            break;
        default:
            break;
    }

    return next;
};

export const progressPercent = (tally: StatusTally): number => {
    if (tally.total === 0) return 0;
    return Math.round((tally.synced / tally.total) * 100);
};
