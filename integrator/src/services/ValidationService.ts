import type { ListQuery } from '@/types/common';
import type { EntityKey, ValidationIssue } from '@/types/integration';
import { siakadApi } from '@/api/siakad';

export type SeverityKey = ValidationIssue['severity'];

export const severityOrder: Record<SeverityKey, number> = { critical: 0, error: 1, warning: 2, info: 3 };

/**
 * ValidationService
 * =================
 * Mengelola hasil validasi: pengelompokan, penyaringan, dan ringkasan
 * yang dipakai Validation Center serta panel detail entitas.
 */
export const ValidationService = {
    summary: () => siakadApi.validation.summary(),

    issues: (query: ListQuery = {}) => siakadApi.validation.issues(query),

    sortBySeverity: (issues: ValidationIssue[]): ValidationIssue[] =>
        [...issues].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]),

    blocking: (issues: ValidationIssue[]): ValidationIssue[] => issues.filter((issue) => issue.severity === 'critical' || issue.severity === 'error'),

    blockingCount: (issues: ValidationIssue[]): number => issues.filter((issue) => issue.severity === 'critical' || issue.severity === 'error').length,

    countsBySeverity: (issues: ValidationIssue[]): Record<SeverityKey, number> => ({
        critical: issues.filter((issue) => issue.severity === 'critical').length,
        error: issues.filter((issue) => issue.severity === 'error').length,
        warning: issues.filter((issue) => issue.severity === 'warning').length,
        info: issues.filter((issue) => issue.severity === 'info').length,
    }),

    groupByCode: (issues: ValidationIssue[]): { code: string; message: string; severity: SeverityKey; count: number; entity: EntityKey }[] => {
        const map = new Map<string, { code: string; message: string; severity: SeverityKey; count: number; entity: EntityKey }>();
        issues.forEach((issue) => {
            const existing = map.get(issue.code);
            if (existing) {
                existing.count += 1;
                return;
            }
            map.set(issue.code, { code: issue.code, message: issue.message, severity: issue.severity, count: 1, entity: issue.entity });
        });
        return Array.from(map.values()).sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity] || b.count - a.count);
    },

    groupByEntity: (issues: ValidationIssue[]): { entity: EntityKey; total: number; critical: number; error: number; warning: number; info: number }[] => {
        const map = new Map<EntityKey, { entity: EntityKey; total: number; critical: number; error: number; warning: number; info: number }>();
        issues.forEach((issue) => {
            const entry = map.get(issue.entity) ?? { entity: issue.entity, total: 0, critical: 0, error: 0, warning: 0, info: 0 };
            entry.total += 1;
            entry[issue.severity] += 1;
            map.set(issue.entity, entry);
        });
        return Array.from(map.values()).sort((a, b) => b.critical + b.error - (a.critical + a.error));
    },

    /**
     * Pesan siap pakai saat sinkronisasi diblokir. Contoh keluaran:
     * "Data tidak dapat dikirim karena Mata Kuliah belum memiliki ID PDDIKTI."
     */
    blockMessage: (issues: ValidationIssue[]): string | null => {
        const blocking = ValidationService.blocking(issues);
        if (blocking.length === 0) return null;
        return blocking[0].message;
    },

    remediationHint: (issues: ValidationIssue[]): string | null => {
        const blocking = ValidationService.blocking(issues);
        const withHint = blocking.find((issue) => issue.remediation);
        return withHint?.remediation ?? null;
    },
};
