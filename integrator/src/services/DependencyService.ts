import type { DependencyBlocker, DependencyCheckResult, EntityKey } from '@/types/integration';
import { getDependencyFields } from '@/config/dependencies';
import { getSyncStep } from '@/config/syncOrder';
import { entityDefinitions } from '@/config/entities';

/**
 * DependencyService
 * =================
 * Memastikan data tidak dikirim sebelum seluruh entitas induknya memiliki ID PDDikti.
 *
 * Contoh nyata yang ditangani:
 *  - Kelas Kuliah memerlukan Prodi, Semester, dan Mata Kuliah
 *  - KRS memerlukan Mahasiswa dan Kelas Kuliah
 *  - Nilai memerlukan Mahasiswa, Kelas, dan keanggotaan kelas (KRS)
 *  - Penugasan Dosen memerlukan Dosen dan Kelas
 */

export interface DependencyResolvers {
    resolveExternalId: (entity: EntityKey, localId: string | number | null) => string | null;
}

const isBlank = (value: unknown): boolean => value === null || value === undefined || String(value).trim() === '';

export const checkDependencies = (
    entity: EntityKey,
    row: Record<string, unknown>,
    resolvers: DependencyResolvers,
): DependencyCheckResult => {
    const blockers: DependencyBlocker[] = [];

    const fields = getDependencyFields(entity);
    fields.forEach((field) => {
        const localValue = field.keyFrom
            ? field.keyFrom.map((key) => String(row[key] ?? '')).join(':')
            : row[field.localField];

        if (isBlank(localValue) || (field.keyFrom && field.keyFrom.some((key) => isBlank(row[key])))) {
            blockers.push({
                requirement: { entity: field.entity, label: field.label, field: field.payloadField },
                localId: null,
                localLabel: '—',
                reason: `${field.label} belum ditentukan pada data ${entityDefinitions[entity].singular}.`,
            });
            return;
        }

        if (resolvers.resolveExternalId(field.entity, localValue as string | number) === null) {
            blockers.push({
                requirement: { entity: field.entity, label: field.label, field: field.payloadField },
                localId: String(localValue),
                localLabel: String(row[`${field.localField}Label`] ?? localValue),
                reason: `Data tidak dapat dikirim karena ${field.label} belum memiliki ID PDDikti.`,
            });
        }
    });

    return { ok: blockers.length === 0, blockers };
};

/** Blocker level batch: entitas induk yang gagal pada job sebelumnya. */
export const checkBatchDependencies = (
    entity: EntityKey,
    failedEntities: EntityKey[],
): DependencyBlocker[] => {
    const step = getSyncStep(entity);
    if (!step) return [];

    return step.dependsOn
        .filter((dependency) => failedEntities.includes(dependency))
        .map((dependency) => ({
            requirement: {
                entity: dependency,
                label: entityDefinitions[dependency].label,
                field: '—',
            },
            localId: null,
            localLabel: '—',
            reason: `Sinkronisasi ${entityDefinitions[entity].label} dihentikan karena ${entityDefinitions[dependency].label} gagal pada proses sebelumnya.`,
        }));
};

/**
 * Menentukan urutan eksekusi yang aman: entitas dengan dependency yang belum
 * selesai ditunda, dan bila dependency gagal maka dependent tetap diblokir.
 */
export const resolveExecutionOrder = (entities: EntityKey[]): { entity: EntityKey; ready: boolean; blockedBy: EntityKey[] }[] => {
    const set = new Set(entities);
    return entities
        .map((entity) => {
            const step = getSyncStep(entity);
            const blockedBy = (step?.dependsOn ?? []).filter((dependency) => set.has(dependency));
            return { entity, ready: blockedBy.length === 0, blockedBy };
        })
        .sort((a, b) => {
            const stepA = getSyncStep(a.entity)?.order ?? 99;
            const stepB = getSyncStep(b.entity)?.order ?? 99;
            return stepA - stepB;
        });
};
