<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import PageHeader from '@/components/PageHeader.vue';
import SectionCard from '@/components/SectionCard.vue';
import StatCard from '@/components/StatCard.vue';
import FilterPanel from '@/components/FilterPanel.vue';
import DataTable from '@/components/DataTable.vue';
import PaginationBar from '@/components/PaginationBar.vue';
import BulkActionBar from '@/components/BulkActionBar.vue';
import ActionMenu from '@/components/ActionMenu.vue';
import AppModal from '@/components/AppModal.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import EntityDetailDrawer from '@/components/EntityDetailDrawer.vue';
import PayloadViewer from '@/components/PayloadViewer.vue';
import ValidationPanel from '@/components/ValidationPanel.vue';
import ComparisonTable from '@/components/ComparisonTable.vue';
import SyncProgress from '@/components/SyncProgress.vue';
import EmptyState from '@/components/EmptyState.vue';
import ErrorPanel from '@/components/ErrorPanel.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import AppIcon from '@/components/AppIcon.vue';
import { useEntityTable } from '@/composables/useEntityTable';
import { useJobMonitor } from '@/composables/useJobMonitor';
import { useToast } from '@/composables/useUi';
import { useSyncStore } from '@/stores/sync';
import { usePeriodStore } from '@/stores/period';
import { useConnectionStore } from '@/stores/connection';
import { SiakadService } from '@/services/SiakadService';
import { SyncService } from '@/services/SyncService';
import { ExportService } from '@/services/ExportService';
import { ImportService, type ImportPreviewResult } from '@/services/ImportService';
import { entityDefinitions } from '@/config/entities';
import { getSyncStep } from '@/config/syncOrder';
import { formatDuration } from '@/utils/format';
import type { EntityKey, PayloadPreviewItem, PayloadPreviewResponse, ValidationIssue } from '@/types/integration';
import type { ComparisonRow } from '@/types/integration';
import type { EntityDetail } from '@/types/siakad';
import type { ActionMenuItem } from '@/types/ui';

/**
 * EntityList — daftar data generik untuk SEMUA entitas akademik.
 *
 * Alur operator: filter → pilih baris → validasi/bandingkan → pratinjau payload
 * → konfirmasi → sinkronisasi → pantau progress → retry bila gagal.
 * Tidak ada data yang dikirim tanpa konfirmasi eksplisit.
 */
const route = useRoute();
const router = useRouter();
const toast = useToast();

const entity = computed<EntityKey>(() => (route.meta.entity as EntityKey) ?? 'mahasiswa');
const definition = computed(() => entityDefinitions[entity.value]);

const table = useEntityTable(entity.value);
const {
    rows,
    stats,
    meta,
    loading,
    error,
    selection,
    filters,
    search,
    sort,
    totalSelected,
    hasFilters,
    activeFilterCount,
    capability,
} = table;

const sync = useSyncStore();
const period = usePeriodStore();
const connection = useConnectionStore();
const { preview } = storeToRefs(sync);

/**
 * Pemantauan job sinkronisasi memakai snapshot lokal (useJobMonitor) agar
 * panel progres selalu menampilkan kondisi terbaru dari backend.
 */
const {
    job: activeJob,
    polling: jobPolling,
    error: jobMonitorError,
    retryFailed: retryJob,
    cancel: cancelJob,
    watch: watchJob,
} = useJobMonitor({
    onFinished: () => {
        void load(meta.value.page);
        void sync.loadOrder();
    },
});

/* ------------------------------------------------------------- dialog --- */
const detailOpen = ref(false);
const detail = ref<EntityDetail | null>(null);
const detailLoading = ref(false);
const decisions = ref<Record<string, string>>({});

const previewOpen = ref(false);
const confirmSyncOpen = ref(false);
const confirmedUnderstood = ref(false);

const validationOpen = ref(false);
const validationIssues = ref<ValidationIssue[]>([]);
const compareOpen = ref(false);
const compareItems = ref<{ localId: string; localLabel: string; status: string; comparison: ComparisonRow[] }[]>([]);

const importOpen = ref(false);
const importFormat = ref<'csv' | 'json'>('csv');
const importContent = ref('');
const importResult = ref<ImportPreviewResult | null>(null);

const payloadOpen = ref(false);
const previewItem = ref<PayloadPreviewItem | null>(null);

/* ----------------------------------------------------------- computed --- */
const statCards = computed(() =>
    definition.value.statCards.map((card) => ({
        key: card.key,
        label: card.label,
        hint: card.hint,
        tone: card.tone,
        value: Number((stats.value as Record<string, number>)[card.source] ?? 0),
        filterValue:
            card.source === 'willSend'
                ? 'NEW'
                : card.source === 'willUpdate'
                  ? 'CHANGED'
                  : card.source === 'invalid'
                    ? 'INVALID'
                    : card.source === 'failed'
                      ? 'FAILED'
                      : card.source === 'conflict'
                        ? 'CONFLICT'
                        : card.source === 'unmapped'
                          ? 'UNMAPPED'
                          : '',
    })),
);

const readOnly = computed(() => capability.value === 'read-only');
const updateOnly = computed(() => capability.value === 'update-only');
const step = computed(() => getSyncStep(entity.value));
const dependencyEntities = computed(() => step.value?.dependsOn ?? []);

/** Entitas induk yang belum lengkap dipetakan — hanya peringatan, bukan pemblokiran menyeluruh. */
const dependencyWarnings = computed(() =>
    dependencyEntities.value
        .map((dependency) => {
            const item = sync.order.find((entry) => entry.entity === dependency);
            return { entity: dependency, label: entityDefinitions[dependency].label, ready: item ? item.ready : true, unmapped: item?.unmapped ?? 0 };
        })
        .filter((entry) => !entry.ready),
);

const plan = computed(() => sync.plan);
const sendableIds = computed(() => (preview.value ? SyncService.sendableIds(preview.value) : []));
const totalInvalid = computed(() => Number((stats.value as Record<string, number>).invalid ?? 0));

const menuItems = computed<ActionMenuItem[]>(() => [
    { key: 'refresh', label: 'Refresh data', description: 'Muat ulang daftar dari SIAKAD', icon: 'refresh' },
    { key: 'validate', label: 'Validasi data terpilih', description: 'Periksa aturan Neo Feeder tanpa mengirim', icon: 'shield', disabled: totalSelected.value === 0 },
    { key: 'compare', label: 'Bandingkan dengan PDDIKTI', description: 'Lihat perbedaan field per field', icon: 'sync', disabled: totalSelected.value === 0 },
    { key: 'preview', label: 'Pratinjau payload', description: 'Lihat envelope { act, token, record }', icon: 'eye', disabled: totalSelected.value === 0 },
    { key: 'export-csv', label: 'Export CSV', description: 'Unduh baris sesuai kolom terlihat', icon: 'download' },
    { key: 'export-json', label: 'Export JSON', description: 'Sertakan metadata status integrasi', icon: 'download' },
    { key: 'import', label: 'Import data pendukung', description: 'Alur: import → preview → validation → mapping', icon: 'upload' },
    { key: 'retry', label: 'Retry kegagalan teknis', description: 'Ulangi item gagal pada job aktif', icon: 'retry', disabled: sync.retryableCount === 0 },
    { key: 'sync-history', label: 'Riwayat sinkronisasi', description: 'Buka halaman Sinkronisasi', icon: 'clock' },
    { key: 'reset', label: 'Reset filter', description: 'Kembalikan filter ke kondisi awal', icon: 'x', disabled: !hasFilters.value },
]);

/* ---------------------------------------------------------------- muat --- */
const load = async (page = 1): Promise<void> => {
    await table.load({ page });
};

onMounted(async () => {
    await Promise.all([period.load(), sync.loadOrder(), connection.fetch()]);
    filters.value = { ...period.filterParams };
    await load(1);
});

watch(
    () => [period.selectedPeriodId, period.selectedProdiId],
    async () => {
        filters.value = { ...filters.value, ...period.filterParams };
        await load(1);
    },
);

watch(entity, async () => {
    table.clearSelection();
    filters.value = { ...period.filterParams };
    sync.reset();
    await load(1);
});

/* -------------------------------------------------------------- detail --- */
const openDetail = async (localId: string): Promise<void> => {
    detailOpen.value = true;
    detailLoading.value = true;
    decisions.value = {};
    try {
        detail.value = await SiakadService.detail(entity.value, localId);
    } catch (caught) {
        toast.error('Gagal memuat detail data', caught instanceof Error ? caught : null);
        detail.value = null;
    } finally {
        detailLoading.value = false;
    }
};

const openFullDetail = (localId: string): void => {
    void router.push(`/${definition.value.route}/${localId}`);
};

/* -------------------------------------------------------- aksi terpilih --- */
const validateSelection = async (): Promise<void> => {
    try {
        const response = await SiakadService.validateSelection(entity.value, selection.value);
        validationIssues.value = response.issues;
        validationOpen.value = true;
        const blocking = response.issues.filter((issue) => issue.severity === 'critical' || issue.severity === 'error').length;
        if (blocking === 0) {
            toast.success('Validasi selesai', 'Tidak ada temuan yang memblokir pengiriman pada data terpilih.');
        } else {
            toast.warning('Validasi menemukan masalah', `${blocking} temuan memblokir pengiriman data terpilih.`);
        }
    } catch (caught) {
        toast.error('Validasi gagal dijalankan', caught instanceof Error ? caught : null);
    }
};

const compareSelection = async (): Promise<void> => {
    try {
        const response = await SiakadService.compare(entity.value, selection.value);
        compareItems.value = response.items.map((item) => ({ localId: item.localId, localLabel: item.localLabel, status: item.status, comparison: item.comparison }));
        compareOpen.value = true;
    } catch (caught) {
        toast.error('Perbandingan gagal dijalankan', caught instanceof Error ? caught : null);
    }
};

const openPreview = async (): Promise<void> => {
    if (selection.value.length === 0) {
        toast.warning('Belum ada data dipilih', 'Pilih minimal satu baris data terlebih dahulu.');
        return;
    }
    const response = await sync.prepare(entity.value, selection.value);
    if (!response) {
        toast.error('Gagal menyusun pratinjau payload', sync.error ? new Error(sync.error) : null);
        return;
    }
    previewOpen.value = true;
    confirmedUnderstood.value = false;
};

const askSync = (): void => {
    previewOpen.value = false;
    confirmSyncOpen.value = true;
};

const runSync = async (): Promise<void> => {
    const ids = sendableIds.value;
    if (ids.length === 0) {
        toast.warning('Tidak ada data yang dapat dikirim', 'Semua data terpilih memiliki masalah validasi atau dependency.');
        confirmSyncOpen.value = false;
        return;
    }

    const dryRun = sync.dryRun;
    const job = await sync.confirmAndRun({
        entity: entity.value,
        ids,
        dryRun,
        periodId: period.selectedPeriodId,
        periodLabel: period.periodLabel,
        prodiId: period.selectedProdiId,
        prodiLabel: period.prodiLabel,
    });

    confirmSyncOpen.value = false;

    if (!job) {
        toast.error('Job sinkronisasi gagal dibuat', sync.error ? new Error(sync.error) : null);
        return;
    }

    watchJob(job.id, job);
    toast.success(dryRun ? 'DRY RUN dijalankan' : 'Sinkronisasi dijalankan', `${ids.length} data diproses pada job ${job.id}. Progres tampil di bawah.`);
    sync.clearPreview();
    table.clearSelection();
};

const retryActiveJob = async (): Promise<void> => {
    if (!activeJob.value) return;
    await retryJob();
    toast.info('Retry dijalankan', 'Item yang gagal secara teknis diulang. Kegagalan validasi tetap harus diperbaiki pada SIAKAD.');
};

const cancelActiveJob = async (): Promise<void> => {
    if (!activeJob.value) return;
    await cancelJob();
    toast.warning('Permintaan pembatalan dikirim');
};

/* -------------------------------------------------------------- export --- */
const exportData = (format: 'csv' | 'json'): void => {
    if (format === 'csv') {
        ExportService.exportRowsToCsv(entity.value, rows.value, definition.value.columns.map((column) => column.key));
        toast.success('Export CSV selesai', `${rows.value.length} baris pada halaman ini diunduh.`);
        return;
    }
    ExportService.exportRowsToJson(entity.value, rows.value);
    toast.success('Export JSON selesai', `${rows.value.length} baris pada halaman ini diunduh.`);
};

const exportPreviewPayloads = (): void => {
    if (!preview.value) return;
    ExportService.exportPayloads(entity.value, preview.value.items);
    toast.success('Payload diekspor', 'Token disensor pada berkas hasil ekspor.');
};

/* -------------------------------------------------------------- import --- */
const readImportFile = async (file?: File): Promise<void> => {
    if (!file) return;
    importContent.value = await ImportService.readFile(file);
    importFormat.value = ImportService.detectFormat(file.name, importContent.value);
};

const runImportPreview = async (): Promise<void> => {
    try {
        importResult.value = await ImportService.preview(entity.value, importFormat.value, importContent.value);
        toast.info('Preview import siap', `${importResult.value.total} baris terbaca, ${importResult.value.summary.invalid} perlu perbaikan.`);
    } catch (caught) {
        toast.error('Preview import gagal', caught instanceof Error ? caught : null);
    }
};

/* ------------------------------------------------------------- actions --- */
const onMenuSelect = (key: string): void => {
    const actions: Record<string, () => void> = {
        refresh: () => void load(meta.value.page),
        validate: () => void validateSelection(),
        compare: () => void compareSelection(),
        preview: () => void openPreview(),
        'export-csv': () => exportData('csv'),
        'export-json': () => exportData('json'),
        import: () => {
            importOpen.value = true;
            importResult.value = null;
        },
        retry: () => void retryActiveJob(),
        'sync-history': () => void router.push('/synchronization'),
        reset: () => void table.resetFilters(),
    };
    actions[key]?.();
};

const openPayload = (item: PayloadPreviewItem): void => {
    previewItem.value = item;
    payloadOpen.value = true;
};

const decide = (field: string, decision: string): void => {
    decisions.value = { ...decisions.value, [field]: decision };
};

const syncRow = (localId: string): void => {
    table.selectIds([localId]);
    void openPreview();
};

const confirmMessage = computed(() => {
    const count = sendableIds.value.length;
    if (sync.dryRun) return `${count} data akan divalidasi dan payload-nya dibentuk TANPA dikirim ke Neo Feeder.`;
    return `${count} data akan dikirim ke PDDikti melalui Neo Feeder pada periode ${period.periodLabel}. Pastikan periode pelaporan memang terbuka.`;
});

const confirmCheckLabel = computed(() =>
    sync.dryRun ? 'Saya memahami dry run tidak mengubah data di PDDikti.' : 'Saya memverifikasi periode, prodi, dan data yang akan dikirim sudah benar.',
);

const pageHint = computed(
    () => `Urutan sinkronisasi ${step.value?.order ?? '—'} dari ${sync.order.length} · ${definition.value.acts.capabilityNote}`,
);

const previewSubtitle = computed(() => (preview.value ? `${preview.value.items.length} data disiapkan · ${preview.value.generatedAt}` : ''));

</script>

<template>
    <div>
        <PageHeader
            :icon="definition.icon"
            :title="definition.label"
            :description="definition.description"
            :hint="pageHint"
            :tone="totalInvalid > 0 ? 'warning' : 'neutral'"
        >
            <template #actions>
                <label class="flex items-center gap-1.5 border border-neutral-300 bg-white px-2 py-1.5" title="DRY RUN hanya menyusun payload dan menjalankan validasi tanpa mengirim data">
                    <input v-model="sync.dryRun" type="checkbox" class="h-3.5 w-3.5" />
                    <span class="text-2xs font-semibold uppercase tracking-wide text-neutral-600">Dry run</span>
                </label>
                <button type="button" class="btn btn-secondary" :disabled="totalSelected === 0" @click="openPreview">
                    <AppIcon name="eye" :size="14" />
                    Pratinjau payload
                </button>
                <button type="button" class="btn btn-primary" :disabled="totalSelected === 0 || readOnly" @click="openPreview">
                    <AppIcon name="sync" :size="14" />
                    Sinkronkan data terpilih
                </button>
                <ActionMenu :items="menuItems" @select="onMenuSelect" />
            </template>
        </PageHeader>

        <div v-if="readOnly" class="mb-3 border border-sky-200 bg-sky-50 p-3">
            <p class="flex items-center gap-1.5 text-[12.5px] font-semibold text-sky-900">
                <AppIcon name="info" :size="14" />
                Entitas ini hanya dapat dibaca dan dipetakan
            </p>
            <p class="mt-1 text-2xs text-sky-900">{{ definition.acts.capabilityNote }}</p>
        </div>

        <div v-if="updateOnly" class="mb-3 border border-amber-200 bg-amber-50 p-3">
            <p class="flex items-center gap-1.5 text-[12.5px] font-semibold text-amber-900">
                <AppIcon name="alert" :size="14" />
                Hanya act Update yang tersedia untuk entitas ini
            </p>
            <p class="mt-1 text-2xs text-amber-900">{{ definition.acts.capabilityNote }}</p>
        </div>

        <div v-if="dependencyWarnings.length > 0" class="mb-3 border border-amber-200 bg-amber-50 p-3">
            <p class="flex items-center gap-1.5 text-[12.5px] font-semibold text-amber-900">
                <AppIcon name="alert" :size="14" />
                Sebagian data akan terblokir karena entitas induk belum lengkap dipetakan
            </p>
            <p class="mt-1 text-2xs text-amber-900">
                <template v-for="(warning, index) in dependencyWarnings" :key="warning.entity">
                    <span>{{ warning.label }} ({{ warning.unmapped }} belum dipetakan){{ index < dependencyWarnings.length - 1 ? ', ' : '.' }}</span>
                </template>
                Data yang entitas induknya belum memiliki ID PDDikti otomatis dilewati pada pratinjau payload, sedangkan data yang induknya sudah siap tetap dapat dikirim.
            </p>
            <RouterLink to="/mapping" class="btn btn-secondary btn-xs mt-2">
                <AppIcon name="map" :size="12" />
                Buka Mapping Center
            </RouterLink>
        </div>

        <ErrorPanel v-if="error" class="mb-3" title="Gagal memuat data" :message="error" @retry="load(1)" @dismiss="table.error.value = null" />

        <div class="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-8">
            <StatCard
                v-for="card in statCards"
                :key="card.key"
                :label="card.label"
                :value="card.value"
                :hint="card.hint"
                :tone="card.tone"
                compact
                clickable
                :active="card.filterValue !== '' && filters.dataStatus === card.filterValue"
                @click="card.filterValue !== '' ? table.setFilter('dataStatus', filters.dataStatus === card.filterValue ? '' : card.filterValue) : undefined"
            />
        </div>

        <SectionCard :padded="false">
            <FilterPanel
                :filters="definition.filters"
                :values="filters"
                :search="search"
                :active-count="activeFilterCount"
                :loading="loading"
                @update:search="table.setSearch($event)"
                @update:filter="table.setFilter($event[0], $event[1])"
                @reset="table.resetFilters()"
            />

            <BulkActionBar v-if="totalSelected > 0" :count="totalSelected" @clear="table.clearSelection()">
                <button type="button" class="btn btn-secondary btn-xs" @click="validateSelection">
                    <AppIcon name="shield" :size="12" />
                    Validasi terpilih
                </button>
                <button type="button" class="btn btn-secondary btn-xs" @click="compareSelection">
                    <AppIcon name="sync" :size="12" />
                    Bandingkan
                </button>
                <button type="button" class="btn btn-secondary btn-xs" @click="openPreview">
                    <AppIcon name="eye" :size="12" />
                    Pratinjau payload
                </button>
                <button type="button" class="btn btn-primary btn-xs" :disabled="readOnly" @click="openPreview">
                    <AppIcon name="play" :size="12" />
                    Sinkronkan terpilih
                </button>
            </BulkActionBar>

            <DataTable
                :columns="definition.columns"
                :rows="rows"
                :loading="loading"
                selectable
                :selected="selection"
                :sort="sort"
                clickable-rows
                :empty-title="`Belum ada data ${definition.singular}`"
                empty-message="Tidak ada data yang cocok dengan filter. Ubah periode/prodi atau reset filter."
                @select="table.toggleRow($event)"
                @select-all="table.toggleAll()"
                @sort="(key, direction) => table.setSort(key, direction)"
                @row-click="openDetail(String(($event as Record<string, unknown>).localId))"
            >
                <template #actions="{ row }">
                    <button type="button" class="btn btn-ghost btn-xs" title="Buka detail" @click="openDetail(String((row as Record<string, unknown>).localId))">
                        <AppIcon name="eye" :size="12" />
                    </button>
                    <button type="button" class="btn btn-secondary btn-xs" title="Pratinjau payload" @click="syncRow(String((row as Record<string, unknown>).localId))">
                        <AppIcon name="file" :size="12" />
                    </button>
                    <button
                        type="button"
                        class="btn btn-primary btn-xs"
                        :disabled="readOnly"
                        :title="readOnly ? definition.acts.capabilityNote : 'Sinkronkan baris ini'"
                        @click="syncRow(String((row as Record<string, unknown>).localId))"
                    >
                        <AppIcon name="sync" :size="12" />
                    </button>
                </template>
            </DataTable>

            <PaginationBar
                :page="meta.page"
                :per-page="meta.perPage"
                :total="meta.total"
                :last-page="meta.lastPage"
                :loading="loading"
                @page-change="load"
                @per-page-change="table.setPerPage($event)"
            />
        </SectionCard>

        <SectionCard v-if="activeJob" class="mt-3" title="Sinkronisasi berjalan" :hint="jobPolling ? 'Progres diperbarui otomatis' : 'Job telah selesai'">
            <template #actions>
                <button type="button" class="btn btn-secondary btn-xs" @click="router.push(`/synchronization/jobs/${activeJob?.id}`)">
                    <AppIcon name="external" :size="12" />
                    Buka detail job
                </button>
            </template>
            <p v-if="jobMonitorError" class="mb-2 border border-amber-200 bg-amber-50 px-2 py-1.5 text-2xs text-amber-900">
                {{ jobMonitorError }} — klik "Buka detail job" untuk memuat ulang status.
            </p>
            <SyncProgress :key="`${activeJob.id}-${activeJob.status}-${activeJob.processed}`" :job="activeJob" @retry="retryActiveJob" @cancel="cancelActiveJob" @open-log="(requestId) => router.push(`/logs?search=${requestId}`)" />
        </SectionCard>

        <AppModal :open="previewOpen" size="xl" title="Pratinjau payload sebelum pengiriman" :subtitle="preview ? `${preview.items.length} data disiapkan · ${preview.generatedAt}` : ''" @close="previewOpen = false">
            <div v-if="preview && plan" class="space-y-3">
                <div class="grid grid-cols-2 gap-2 md:grid-cols-4">
                    <div class="border border-neutral-200 bg-white px-2.5 py-2">
                        <p class="kv-label">Data yang akan dikirim</p>
                        <p class="mt-0.5 text-[18px] font-semibold text-neutral-900">{{ plan.willSend + plan.willUpdate }}</p>
                    </div>
                    <div class="border border-neutral-200 bg-white px-2.5 py-2">
                        <p class="kv-label">Data baru (Insert)</p>
                        <p class="mt-0.5 text-[18px] font-semibold text-brand-800">{{ plan.willSend }}</p>
                    </div>
                    <div class="border border-neutral-200 bg-white px-2.5 py-2">
                        <p class="kv-label">Data update</p>
                        <p class="mt-0.5 text-[18px] font-semibold text-amber-700">{{ plan.willUpdate }}</p>
                    </div>
                    <div class="border border-neutral-200 bg-white px-2.5 py-2">
                        <p class="kv-label">Tidak boleh dikirim</p>
                        <p class="mt-0.5 text-[18px] font-semibold text-red-700">{{ plan.invalid + plan.blocked }}</p>
                    </div>
                </div>

                <div class="flex flex-wrap items-center gap-2 border border-neutral-200 bg-neutral-50 px-3 py-2 text-2xs text-neutral-600">
                    <span>Total {{ plan.total }} item</span>
                    <span>· invalid {{ plan.invalid }}</span>
                    <span>· dependency terblokir {{ plan.blocked }}</span>
                    <span>· dilewati {{ plan.willSkip }}</span>
                    <span>· peringatan {{ plan.warnings }}</span>
                    <span>· perkiraan durasi {{ formatDuration(plan.estimatedDurationMs) }}</span>
                    <span class="ml-auto badge" :class="sync.dryRun ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-neutral-300 bg-neutral-100 text-neutral-700'">
                        {{ sync.dryRun ? 'DRY RUN aktif' : 'pengiriman nyata' }}
                    </span>
                </div>

                <div v-if="plan.blocked > 0" class="border border-red-200 bg-red-50 p-2.5">
                    <p class="text-[12px] font-semibold text-red-800">Sebagian data terblokir dependency</p>
                    <ul class="mt-1 list-disc space-y-0.5 pl-5 text-2xs text-red-800">
                        <li v-for="(reason, index) in SyncService.blockedReasons(preview).slice(0, 6)" :key="index">{{ reason.localLabel }} — {{ reason.reason }}</li>
                    </ul>
                </div>

                <div class="max-h-[46vh] overflow-y-auto border border-neutral-200">
                    <ul class="divide-y divide-neutral-100">
                        <li v-for="item in preview.items" :key="item.localId" class="px-3 py-2">
                            <div class="flex flex-wrap items-center gap-2">
                                <StatusBadge :status="item.status" :show-description="false" />
                                <span class="min-w-0 flex-1 truncate text-[12.5px] text-neutral-800">{{ item.localLabel }}</span>
                                <span class="badge border-neutral-300 bg-neutral-100 font-mono text-neutral-700">{{ item.act }}</span>
                                <span
                                    class="badge"
                                    :class="item.action === 'INSERT' ? 'border-brand-300 bg-brand-50 text-brand-800' : item.action === 'UPDATE' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-neutral-300 bg-neutral-100 text-neutral-600'"
                                >
                                    {{ item.action }}
                                </span>
                                <button type="button" class="btn btn-secondary btn-xs" @click="openPayload(item)">
                                    <AppIcon name="eye" :size="12" />
                                    Lihat payload
                                </button>
                            </div>
                            <p v-if="!item.dependencies.ok" class="mt-1 text-2xs text-red-700">{{ item.dependencies.blockers[0]?.reason }}</p>
                            <p v-else-if="item.skippedFields.length > 0" class="mt-1 text-2xs text-neutral-500">{{ item.skippedFields.length }} field tidak dikirim (kosong / belum dipetakan)</p>
                        </li>
                    </ul>
                </div>
            </div>

            <EmptyState v-else compact icon="eye" title="Belum ada pratinjau" message="Pilih data lalu tekan Pratinjau payload." />

            <template #footer>
                <button type="button" class="btn btn-secondary" @click="exportPreviewPayloads">
                    <AppIcon name="download" :size="13" />
                    Unduh payload JSON
                </button>
                <button type="button" class="btn btn-secondary" @click="previewOpen = false">Tutup</button>
                <button type="button" class="btn btn-primary" :disabled="sendableIds.length === 0" @click="askSync">
                    <AppIcon name="play" :size="13" />
                    Lanjut konfirmasi ({{ sendableIds.length }} data)
                </button>
            </template>
        </AppModal>

        <ConfirmDialog
            :open="confirmSyncOpen"
            :tone="sync.dryRun ? 'primary' : 'warning'"
            :title="sync.dryRun ? 'Jalankan DRY RUN' : 'Kirim data ke Neo Feeder'"
            :message="confirmMessage"
            :confirm-label="sync.dryRun ? 'Jalankan dry run' : 'Kirim sekarang'"
            require-checkbox
            :checkbox-label="confirmCheckLabel"
            :checked="confirmedUnderstood"
            :loading="sync.creating"
            @update:checked="confirmedUnderstood = $event"
            @confirm="runSync"
            @cancel="confirmSyncOpen = false"
        >
            <div v-if="plan" class="mt-1 space-y-1 border border-neutral-200 bg-neutral-50 p-2 text-[12px]">
                <p class="font-medium text-neutral-800">Ringkasan pengiriman</p>
                <p class="text-neutral-600">Data yang akan dikirim: <b>{{ plan.willSend + plan.willUpdate }}</b></p>
                <p class="text-neutral-600">Data baru: {{ plan.willSend }} · Data update: {{ plan.willUpdate }}</p>
                <p class="text-neutral-600">Invalid: {{ plan.invalid }} · Terblokir dependency: {{ plan.blocked }}</p>
                <p class="text-2xs text-neutral-500">Tidak boleh dikirim: {{ plan.invalid + plan.blocked }} data</p>
            </div>
        </ConfirmDialog>

        <AppModal :open="validationOpen" size="lg" title="Hasil validasi data terpilih" @close="validationOpen = false">
            <ValidationPanel :issues="validationIssues" show-entity max-height="52vh" @open-entity="openDetail($event.localId)" />
            <template #footer>
                <button type="button" class="btn btn-secondary" @click="validationOpen = false">Tutup</button>
            </template>
        </AppModal>

        <AppModal :open="compareOpen" size="xl" title="Perbandingan SIAKAD vs PDDIKTI" subtitle="Perbedaan tidak pernah ditimpa otomatis — putuskan per field" @close="compareOpen = false">
            <div class="space-y-4">
                <div v-for="item in compareItems" :key="item.localId" class="border border-neutral-200">
                    <div class="flex flex-wrap items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-3 py-2">
                        <StatusBadge :status="item.status" :show-description="false" />
                        <span class="text-[12.5px] font-medium text-neutral-800">{{ item.localLabel }}</span>
                        <span class="ml-auto font-mono text-[10.5px] text-neutral-500">ID SIAKAD {{ item.localId }}</span>
                    </div>
                    <ComparisonTable :rows="item.comparison" show-decision :decisions="decisions" @decide="decide" />
                </div>
            </div>
            <template #footer>
                <button type="button" class="btn btn-secondary" @click="compareOpen = false">Tutup</button>
            </template>
        </AppModal>

        <AppModal :open="importOpen" size="lg" title="Import data pendukung" subtitle="Import tidak pernah langsung menyinkronkan data" @close="importOpen = false">
            <div class="space-y-3">
                <div class="border border-neutral-200 bg-neutral-50 p-2.5">
                    <p class="text-[12px] font-semibold text-neutral-800">Alur import</p>
                    <p class="mt-0.5 text-2xs text-neutral-600">
                        Import → Preview → Validation → Mapping → Approval → Sync. Berkas CSV/JSON menjadi data pendukung; pengiriman tetap melalui alur sinkronisasi.
                    </p>
                </div>

                <label class="block">
                    <span class="label">Berkas CSV / JSON</span>
                    <input type="file" accept=".csv,.json" class="input" @change="readImportFile(($event.target as HTMLInputElement).files?.[0])" />
                </label>

                <label class="block">
                    <span class="label">Atau tempelkan isi berkas</span>
                    <textarea v-model="importContent" class="textarea font-mono text-[11.5px]" rows="6" :placeholder="ImportService.templateColumns(entity).join(',')" />
                </label>

                <div class="flex flex-wrap items-center gap-2">
                    <button type="button" class="btn btn-secondary" :disabled="!importContent" @click="runImportPreview">
                        <AppIcon name="eye" :size="13" />
                        Preview & validasi
                    </button>
                    <span class="badge border-neutral-300 bg-neutral-100 text-neutral-600">format terdeteksi: {{ importFormat }}</span>
                </div>

                <div v-if="importResult" class="space-y-2 border border-neutral-200">
                    <div class="flex flex-wrap items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-3 py-2">
                        <span class="text-[12px] font-medium text-neutral-800">{{ importResult.total }} baris terbaca</span>
                        <span class="badge border-emerald-200 bg-emerald-50 text-emerald-700">{{ importResult.summary.valid }} siap</span>
                        <span class="badge border-red-200 bg-red-50 text-red-700">{{ importResult.summary.invalid }} perlu perbaikan</span>
                    </div>
                    <ul class="max-h-64 divide-y divide-neutral-100 overflow-y-auto">
                        <li v-for="row in importResult.preview" :key="row.index" class="px-3 py-2">
                            <div class="flex items-center gap-2">
                                <span class="font-mono text-[10.5px] text-neutral-500">#{{ row.index }}</span>
                                <StatusBadge :status="row.blocking === 0 ? 'VALID' : 'INVALID'" :show-description="false" />
                                <span class="truncate text-[12px] text-neutral-700">{{ Object.values(row.row).slice(0, 3).join(' · ') }}</span>
                            </div>
                            <ul v-if="row.issues.length > 0" class="mt-1 list-disc space-y-0.5 pl-5 text-2xs text-red-700">
                                <li v-for="issue in row.issues.slice(0, 3)" :key="issue.id">{{ issue.message }}</li>
                            </ul>
                        </li>
                    </ul>
                    <p class="border-t border-neutral-200 bg-neutral-50 px-3 py-2 text-2xs text-neutral-500">{{ importResult.note }}</p>
                </div>
            </div>

            <template #footer>
                <button type="button" class="btn btn-secondary" @click="importOpen = false">Tutup</button>
            </template>
        </AppModal>

        <AppModal :open="payloadOpen" size="lg" title="Payload yang akan dikirim" @close="payloadOpen = false">
            <PayloadViewer v-if="previewItem" :item="previewItem" max-height="52vh" />
            <template #footer>
                <button type="button" class="btn btn-secondary" @click="payloadOpen = false">Tutup</button>
            </template>
        </AppModal>

        <EntityDetailDrawer
            :open="detailOpen"
            :detail="detail"
            :loading="detailLoading"
            :decisions="decisions"
            @close="detailOpen = false"
            @open-full="openFullDetail"
            @preview="syncRow"
            @sync="syncRow"
            @open-log="(id) => router.push(`/logs?search=${id}`)"
            @decide="decide"
        />
    </div>
</template>
