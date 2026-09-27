import type { EntityKey, ValidationIssue, ValidationSummary } from '@/types/integration';
import type { EntityValidator, ValidationContext } from './common';
import { validateDosen, validateMahasiswa, validateRiwayatPendidikan } from './sivitas';
import { validateKurikulum, validateMataKuliah, validateMataKuliahKurikulum, validateProdi, validateSemester } from './akademik';
import { validateDosenPengajar, validateKelas, validateKrs, validateNilai } from './perkuliahan';
import { validateAktivitas, validateKelulusan } from './hasil';
import { issue } from './common';
import { entityDefinitions } from '@/config/entities';
import type { ReferenceKey } from '@/types/reference';

/** Validator per entitas. Entitas tanpa validator hanya memakai pemeriksaan mapping. */
export const validators: Partial<Record<EntityKey, EntityValidator>> = {
    prodi: validateProdi,
    semester: validateSemester,
    dosen: validateDosen,
    mahasiswa: validateMahasiswa,
    'riwayat-pendidikan': validateRiwayatPendidikan,
    kurikulum: validateKurikulum,
    'mata-kuliah': validateMataKuliah,
    'mata-kuliah-kurikulum': validateMataKuliahKurikulum,
    kelas: validateKelas,
    'dosen-pengajar': validateDosenPengajar,
    krs: validateKrs,
    nilai: validateNilai,
    'aktivitas-mahasiswa': validateAktivitas,
    kelulusan: validateKelulusan,
};

const MAPPED_ENTITY_BY_KEY: Partial<Record<EntityKey, EntityKey>> = {
    'perguruan-tinggi': 'perguruan-tinggi',
    prodi: 'prodi',
    semester: 'semester',
    dosen: 'dosen',
    mahasiswa: 'mahasiswa',
};

/** Validasi generik: entitas yang tidak punya validator tetap dicek pemetaannya. */
const genericValidator: EntityValidator = (row, ctx) => {
    const id = String(row.localId ?? row.id ?? '');
    const label = String(row.nama ?? row.kode ?? row.judul ?? id);
    const mappedEntity = MAPPED_ENTITY_BY_KEY[ctx.entity];
    if (!mappedEntity) return [];
    if (ctx.resolveExternalId(mappedEntity, (row.id as number) ?? null) !== null) return [];
    return [
        issue(ctx.entity, id, label, 'error', `${ctx.entity.toUpperCase()}_UNMAPPED`, `${entityDefinitions[ctx.entity].singular} belum dipetakan ke PDDikti.`, {
            remediation: 'Buka Mapping Center dan petakan data ini.',
        }),
    ];
};

export interface RunValidationOptions {
    entity: EntityKey;
    rows: Record<string, unknown>[];
    context: ValidationContext;
}

export const validateRows = ({ entity, rows, context }: RunValidationOptions): ValidationIssue[] => {
    const validator = validators[entity] ?? genericValidator;
    const issues: ValidationIssue[] = [];

    rows.forEach((row) => {
        try {
            issues.push(...validator(row, { ...context, entity }));
        } catch (error) {
            issues.push(
                issue(entity, String(row.localId ?? row.id ?? ''), String(row.nama ?? row.id ?? ''), 'warning', 'VALIDATOR_ERROR', `Validator gagal menilai baris ini: ${(error as Error).message}`),
            );
        }
    });

    return issues;
};

export const summarizeIssues = (entity: EntityKey, issues: ValidationIssue[], total: number): ValidationSummary => {
    const bySeverity = (severity: ValidationIssue['severity']): number => issues.filter((item) => item.severity === severity).length;
    const affected = new Set(issues.filter((item) => item.severity === 'critical' || item.severity === 'error').map((item) => item.localId)).size;

    return {
        entity,
        total,
        valid: Math.max(0, total - affected),
        critical: bySeverity('critical'),
        error: bySeverity('error'),
        warning: bySeverity('warning'),
        info: bySeverity('info'),
        conflict: issues.filter((item) => item.code.includes('CONFLICT')).length,
    };
};

export const issueCountsByCode = (issues: ValidationIssue[]): { code: string; message: string; entity: EntityKey; severity: ValidationIssue['severity']; count: number }[] => {
    const map = new Map<string, { code: string; message: string; entity: EntityKey; severity: ValidationIssue['severity']; count: number }>();
    issues.forEach((item) => {
        const existing = map.get(item.code);
        if (existing) {
            existing.count += 1;
            return;
        }
        map.set(item.code, { code: item.code, message: item.message, entity: item.entity, severity: item.severity, count: 1 });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
};

export const hasBlockingIssue = (issues: ValidationIssue[]): boolean =>
    issues.some((item) => item.severity === 'critical' || item.severity === 'error');

export const referenceKeysUsedBy = (entity: EntityKey): ReferenceKey[] => {
    const definition = entityDefinitions[entity];
    if (!definition) return [];
    return [];
};
