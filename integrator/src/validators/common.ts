import type { EntityKey, ValidationIssue } from '@/types/integration';
import type { ReferenceKey } from '@/types/reference';

export interface ValidationContext {
    entity: EntityKey;
    resolveExternalId: (entity: EntityKey, localId: string | number | null) => string | null;
    resolveReference: (refKey: ReferenceKey, localValue: string | null) => string | null;
    /** true bila nilai referensi lokal dikenali oleh PDDikti */
    hasReference: (refKey: ReferenceKey, localValue: string | null) => boolean;
    semesterCodes: Set<string>;
    prodiIds: Set<string>;
}

export type EntityValidator = (row: Record<string, unknown>, ctx: ValidationContext) => ValidationIssue[];

let sequence = 0;

export const issue = (
    entity: EntityKey,
    localId: string | number,
    localLabel: string,
    severity: ValidationIssue['severity'],
    code: string,
    message: string,
    extra: { field?: string; remediation?: string } = {},
): ValidationIssue => {
    sequence += 1;
    return {
        id: `${entity}-${localId}-${code}-${sequence}`,
        entity,
        localId: String(localId),
        localLabel,
        severity,
        code,
        message,
        field: extra.field,
        remediation: extra.remediation,
        createdAt: new Date().toISOString(),
    };
};

export const str = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
};

export const isEmpty = (value: unknown): boolean => value === null || value === undefined || str(value).trim() === '';

export const digitsOnly = (value: unknown, length?: number): boolean => {
    const text = str(value).trim();
    if (!/^\d+$/.test(text)) return false;
    return length === undefined || text.length === length;
};

export const maxLength = (value: unknown, limit: number): boolean => str(value).trim().length <= limit;

/** Validasi field wajib. */
export const requireField = (
    ctx: ValidationContext,
    row: Record<string, unknown>,
    localId: string | number,
    localLabel: string,
    field: string,
    label: string,
    severity: ValidationIssue['severity'] = 'error',
): ValidationIssue[] => {
    if (!isEmpty(row[field])) return [];
    return [
        issue(ctx.entity, localId, localLabel, severity, `${ctx.entity.toUpperCase()}_${field.toUpperCase()}_REQUIRED`, `${label} belum diisi.`, {
            field,
            remediation: `Lengkapi ${label} pada data SIAKAD.`,
        }),
    ];
};

/**
 * Memastikan entitas induk sudah memiliki ID PDDikti.
 * Contoh pesan: "Data tidak dapat dikirim karena Mata Kuliah belum memiliki ID PDDikti."
 */
export const requireMappedEntity = (
    ctx: ValidationContext,
    row: Record<string, unknown>,
    localId: string | number,
    localLabel: string,
    dependencyEntity: EntityKey,
    dependencyLabel: string,
    payloadField: string,
    localValue: string | number | null,
): ValidationIssue[] => {
    if (isEmpty(localValue)) {
        return [
            issue(ctx.entity, localId, localLabel, 'error', `DEP_${dependencyEntity.toUpperCase()}_MISSING`, `${dependencyLabel} belum dipilih untuk data ini.`, {
                field: payloadField,
                remediation: `Tautkan ${dependencyLabel} pada data SIAKAD.`,
            }),
        ];
    }

    if (ctx.resolveExternalId(dependencyEntity, localValue) !== null) return [];

    return [
        issue(
            ctx.entity,
            localId,
            localLabel,
            'critical',
            `DEP_${dependencyEntity.toUpperCase()}_UNMAPPED`,
            `Data tidak dapat dikirim karena ${dependencyLabel} belum memiliki ID PDDikti.`,
            { field: payloadField, remediation: `Petakan ${dependencyLabel} pada menu Pemetaan terlebih dahulu.` },
        ),
    ];
};

/** Validasi nilai referensi (mis. agama, jalur masuk, jenis keluar). */
export const requireReference = (
    ctx: ValidationContext,
    row: Record<string, unknown>,
    localId: string | number,
    localLabel: string,
    field: string,
    refKey: ReferenceKey,
    label: string,
    severity: ValidationIssue['severity'] = 'error',
): ValidationIssue[] => {
    const value = row[field];
    if (isEmpty(value)) {
        return [
            issue(ctx.entity, localId, localLabel, severity, `REF_${refKey.toUpperCase()}_EMPTY`, `${label} belum diisi sehingga referensi PDDikti tidak dapat ditentukan.`, {
                field,
                remediation: `Lengkapi ${label} pada data SIAKAD atau petakan nilainya pada menu Referensi.`,
            }),
        ];
    }

    if (ctx.hasReference(refKey, str(value))) return [];

    return [
        issue(ctx.entity, localId, localLabel, severity, `REF_${refKey.toUpperCase()}_UNMAPPED`, `Nilai ${label} "${str(value)}" belum dipetakan ke referensi PDDikti.`, {
            field,
            remediation: `Petakan nilai tersebut pada menu Referensi (${refKey}).`,
        }),
    ];
};

/** Peringatan umum: data berbeda dengan PDDIKTI (INFO). */
export const infoDifferent = (
    ctx: ValidationContext,
    row: Record<string, unknown>,
    localId: string | number,
    localLabel: string,
    field: string,
    label: string,
): ValidationIssue[] => [
    issue(ctx.entity, localId, localLabel, 'info', 'INFO_DIFFERENT', `Nilai ${label} berbeda dengan PDDikti dan akan diperbarui saat sinkronisasi.`, { field }),
];
