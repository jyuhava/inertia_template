import type { ListQuery } from '@/types/common';
import type { EntityKey } from '@/types/integration';
import { siakadApi, type EntityListResponse } from '@/api/siakad';
import type { RowMap } from '@/types/rows';

/**
 * SiakadService
 * =============
 * Satu pintu bagi store/komponen untuk mengambil data SIAKAD.
 * Komponen tidak boleh memanggil axios langsung (lihat aturan modul).
 */
export const SiakadService = {
    session: () => siakadApi.session(),

    dashboard: () => siakadApi.dashboard(),

    periods: () => siakadApi.periods(),

    prodiOptions: () => siakadApi.prodiOptions(),

    listEntity: <K extends EntityKey>(entity: K, query: ListQuery = {}) =>
        siakadApi.entities.list(entity, query) as Promise<EntityListResponse<K>>,

    detail: (entity: EntityKey, localId: string) => siakadApi.entities.detail(entity, localId),

    previewPayload: (entity: EntityKey, ids: string[], dryRun = true) => siakadApi.entities.preview(entity, ids, dryRun),

    validateSelection: (entity: EntityKey, ids: string[] = []) => siakadApi.entities.validate(entity, ids),

    compare: (entity: EntityKey, ids: string[]) => siakadApi.entities.compare(entity, ids),

    validationSummary: () => siakadApi.validation.summary(),

    issues: (query: ListQuery = {}) => siakadApi.validation.issues(query),

    monitoring: () => siakadApi.monitoring(),

    logs: (query: ListQuery = {}) => siakadApi.logs.list(query),

    log: (id: string) => siakadApi.logs.detail(id),

    importPreview: (entity: EntityKey, format: 'csv' | 'json', content: string) => siakadApi.importPreview({ entity, format, content }),
};

export type { EntityListResponse, RowMap };
