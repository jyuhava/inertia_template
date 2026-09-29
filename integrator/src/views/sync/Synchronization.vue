<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import PageHeader from '@/components/PageHeader.vue';
import SectionCard from '@/components/SectionCard.vue';
import StatCard from '@/components/StatCard.vue';
import DataTable from '@/components/DataTable.vue';
import PaginationBar from '@/components/PaginationBar.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import EmptyState from '@/components/EmptyState.vue';
import ErrorPanel from '@/components/ErrorPanel.vue';
import AppIcon from '@/components/AppIcon.vue';
import SyncProgress from '@/components/SyncProgress.vue';
import { useSyncStore } from '@/stores/sync';
import { useLogsStore } from '@/stores/logs';
import { useJobMonitor } from '@/composables/useJobMonitor';
import { entityDefinitions, entityList } from '@/config/entities';
import { useToast } from '@/composables/useUi';
import { formatDateTime, formatDuration, formatNumber, relativeTime } from '@/utils/format';
import { ExportService } from '@/services/ExportService';
import type { EntityKey } from '@/types/integration';

/**
 * Synchronization Center — daftar job sinkronisasi, urutan dependency,
 * dan pintasan aksi lanjutan (retry, cancel, buka detail).
 */
const sync = useSyncStore();
const logs = useLogsStore();
const router = useRouter();
const toast = useToast();
const { jobs, jobMeta, jobStats, loading } = storeToRefs(sync);

const {
    job: activeJob,
    polling: jobPolling,
    retryFailed: retryFailedJob,
    cancel: cancelActiveJob,
    watch: watchJob,
} = useJobMonitor({
    onFinished: () => {
        void sync.loadJobs({ page: 1 });
    },
});

const entityFilter = ref('');
const statusFilter = ref('');
const search = ref('');

const columns = [
    { key: 'id', label: 'Job ID', mono: true },
    { key: 'entity', label: 'Entitas' },
    { key: 'status', label: 'Status', align: 'center' as const },
    { key: 'total', label: 'Total', align: 'right' as const },
    { key: 'success', label: 'Berhasil', align: 'right' as const },
    { key: 'failed', label: 'Gagal', align: 'right' as const },
    { key: 'skipped', label: 'Dilewati', align: 'right' as const },
    { key: 'createdAt', label: 'Dibuat' },
    { key: 'finishedAt', label: 'Selesai' },
    { key: 'createdBy', label: 'Operator' },
];

const statusOptions = [
    { value: '', label: 'Semua status' },
    { value: 'QUEUED', label: 'Antrean' },
    { value: 'RUNNING', label: 'Berjalan' },
    { value: 'COMPLETED', label: 'Selesai' },
    { value: 'PARTIAL', label: 'Sebagian berhasil' },
    { value: 'FAILED', label: 'Gagal' },
    { value: 'CANCELLED', label: 'Dibatalkan' },
];

const rows = computed(() =>
    jobs.value.map((job) => ({
        ...job,
        entityLabel: entityDefinitions[job.entity]?.label ?? job.entity,
        duration: job.startedAt && job.finishedAt ? new Date(job.finishedAt).getTime() - new Date(job.startedAt).getTime() : null,
    })),
);

const load = async (page = 1): Promise<void> => {
    await sync.loadJobs({ page, entity: entityFilter.value as EntityKey | '', status: statusFilter.value, search: search.value || undefined });
};

onMounted(async () => {
    await Promise.all([sync.loadOrder(), load(1)]);
    await watchRunningJob();
});

/** Bila ada job yang masih berjalan, pantau langsung agar progres terlihat. */
const watchRunningJob = async (): Promise<void> => {
    const running = jobs.value.find((job) => job.status === 'RUNNING' || job.status === 'QUEUED');
    if (!running) return;
    const loaded = await sync.loadJob(running.id);
    if (loaded) watchJob(loaded.id, loaded);
};

const openJob = (id: string): void => {
    void router.push(`/synchronization/jobs/${id}`);
};

const retryJob = async (id: string): Promise<void> => {
    const loaded = await sync.loadJob(id);
    if (loaded) watchJob(loaded.id, loaded);
    await retryFailedJob();
    toast.info('Retry dijalankan', 'Item gagal teknis diulang. Item gagal validasi harus diperbaiki pada data SIAKAD.');
    await load(jobMeta.value.page);
};

const cancelJob = async (id: string): Promise<void> => {
    const loaded = await sync.loadJob(id);
    if (loaded) watchJob(loaded.id, loaded);
    await cancelActiveJob();
    toast.warning('Permintaan pembatalan dikirim');
    await load(jobMeta.value.page);
};

const exportJobs = (): void => {
    ExportService.exportRowsToJson('prodi', rows.value as unknown as Record<string, unknown>[]);
    toast.success('Daftar job diekspor');
};
</script>

<template>
    <div>
        <PageHeader
            icon="sync"
            title="Synchronization Center"
            description="Pemantauan seluruh job sinkronisasi: antrean, progres, hasil, durasi, dan operator. Setiap percobaan tercatat pada log lengkap dengan payload dan respons Neo Feeder."
            hint="Sinkronisasi tidak pernah berjalan otomatis; selalu dimulai dari konfirmasi operator."
        >
            <template #actions>
                <button type="button" class="btn btn-secondary" @click="exportJobs">
                    <AppIcon name="download" :size="14" />
                    Export daftar job
                </button>
                <RouterLink to="/logs" class="btn btn-secondary">
                    <AppIcon name="file" :size="14" />
                    Log & Audit
                </RouterLink>
                <RouterLink to="/synchronization/wizard" class="btn btn-primary">
                    <AppIcon name="play" :size="14" />
                    Sync Wizard
                </RouterLink>
            </template>
        </PageHeader>

        <ErrorPanel v-if="sync.error" class="mb-3" title="Gagal memuat data sinkronisasi" :message="sync.error" @retry="load(1)" @dismiss="sync.error = null" />

        <div class="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Antrean" :value="jobStats.queued" tone="neutral" hint="Job belum dijalankan" icon="clock" />
            <StatCard label="Berjalan" :value="jobStats.running" tone="warning" hint="Sedang memproses item" icon="sync" />
            <StatCard label="Berhasil" :value="jobStats.successItems" tone="success" hint="Item sukses dari seluruh job" icon="check" />
            <StatCard label="Gagal" :value="jobStats.failedItems" tone="danger" hint="Item gagal yang perlu ditindak" icon="alert" />
        </div>

        <SectionCard class="mb-3" title="Urutan sinkronisasi (dependency-aware)" hint="Entitas turunan tidak dijalankan bila entitas induk gagal" :padded="false">
            <div class="table-wrap">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th class="w-12">#</th>
                            <th>Entitas</th>
                            <th>Memerlukan</th>
                            <th class="w-24 text-right">Total</th>
                            <th class="w-28 text-right">Terpetakan</th>
                            <th class="w-24 text-center">Siap</th>
                            <th class="w-32">Kapabilitas</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="step in sync.order" :key="step.entity">
                            <td class="font-mono text-[11px] text-neutral-500">{{ String(step.order).padStart(2, '0') }}</td>
                            <td>
                                <RouterLink :to="`/${entityDefinitions[step.entity].route}`" class="font-medium text-neutral-800 hover:underline">{{ step.label }}</RouterLink>
                                <span v-if="step.mandatory" class="badge ml-1.5 border-brand-300 bg-brand-50 text-brand-800">wajib</span>
                            </td>
                            <td class="text-2xs text-neutral-600">
                                {{ step.dependsOn.length === 0 ? '—' : step.dependsOn.map((dependency) => entityDefinitions[dependency].label).join(', ') }}
                            </td>
                            <td class="text-right">{{ formatNumber(step.total) }}</td>
                            <td class="text-right">{{ formatNumber(step.mapped) }}<span v-if="step.unmapped > 0" class="ml-1 text-2xs text-amber-700">(+{{ step.unmapped }} belum)</span></td>
                            <td class="text-center">
                                <StatusBadge :status="step.ready ? 'MAPPED' : 'UNMAPPED'" kind="mapping" :show-description="false" />
                            </td>
                            <td><span class="badge border-neutral-300 bg-neutral-100 text-neutral-600">{{ step.capability }}</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </SectionCard>

        <SectionCard v-if="activeJob" class="mb-3" :title="`Job aktif · ${activeJob.id}`" :hint="jobPolling ? 'Progres diperbarui otomatis' : 'Job telah selesai'" :padded="false">
            <div class="p-3">
                <SyncProgress :key="`${activeJob.id}-${activeJob.status}-${activeJob.processed}`" :job="activeJob" @retry="retryJob(activeJob.id)" @cancel="cancelJob(activeJob.id)" @open-log="(requestId) => router.push(`/logs?search=${requestId}`)" />
            </div>
        </SectionCard>

        <SectionCard title="Riwayat job" hint="Semua job sinkronisasi yang pernah dijalankan" :padded="false">
            <div class="flex flex-wrap items-end gap-2 border-b border-neutral-200 px-3 py-2.5">
                <label class="w-52">
                    <span class="label">Entitas</span>
                    <select class="select" :value="entityFilter" @change="entityFilter = ($event.target as HTMLSelectElement).value; load(1)">
                        <option value="">Semua entitas</option>
                        <option v-for="definition in entityList" :key="definition.key" :value="definition.key">{{ definition.label }}</option>
                    </select>
                </label>

                <label class="w-44">
                    <span class="label">Status</span>
                    <select class="select" :value="statusFilter" @change="statusFilter = ($event.target as HTMLSelectElement).value; load(1)">
                        <option v-for="option in statusOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                    </select>
                </label>

                <label class="min-w-[200px] flex-1">
                    <span class="label">Pencarian</span>
                    <input class="input" type="search" placeholder="Cari job id atau operator…" :value="search" @input="search = ($event.target as HTMLInputElement).value; load(1)" />
                </label>

                <button type="button" class="btn btn-secondary" :disabled="loading" @click="load(jobMeta.page)">
                    <AppIcon name="refresh" :size="13" :class="loading ? 'animate-spin' : ''" />
                    Segarkan
                </button>

                <span class="ml-auto badge border-neutral-300 bg-neutral-100 text-neutral-600">{{ formatNumber(jobMeta.total) }} job</span>
            </div>

            <DataTable
                :columns="columns"
                :rows="rows"
                :loading="loading"
                clickable-rows
                empty-title="Belum ada job sinkronisasi"
                empty-message="Jalankan sinkronisasi dari daftar entitas atau melalui Sync Wizard."
                @row-click="openJob(String(($event as Record<string, unknown>).id))"
            >
                <template #cell-entity="{ row }">
                    <span class="text-[12.5px] text-neutral-800">{{ (row as Record<string, unknown>).entityLabel }}</span>
                    <span v-if="(row as Record<string, unknown>).dryRun" class="badge ml-1.5 border-amber-300 bg-amber-50 text-amber-800">dry run</span>
                </template>

                <template #cell-status="{ row }">
                    <StatusBadge :status="String((row as Record<string, unknown>).status)" kind="job" />
                </template>

                <template #cell-createdAt="{ row }">
                    <span :title="formatDateTime(String((row as Record<string, unknown>).createdAt))">{{ relativeTime(String((row as Record<string, unknown>).createdAt)) }}</span>
                </template>

                <template #cell-finishedAt="{ row }">
                    <span v-if="(row as Record<string, unknown>).finishedAt" :title="formatDateTime(String((row as Record<string, unknown>).finishedAt))">
                        {{ relativeTime(String((row as Record<string, unknown>).finishedAt)) }}
                        <span v-if="(row as Record<string, unknown>).duration" class="text-2xs text-neutral-500">· {{ formatDuration(Number((row as Record<string, unknown>).duration)) }}</span>
                    </span>
                    <span v-else class="text-2xs text-neutral-400">—</span>
                </template>

                <template #actions="{ row }">
                    <button type="button" class="btn btn-ghost btn-xs" title="Detail job" @click="openJob(String((row as Record<string, unknown>).id))">
                        <AppIcon name="eye" :size="12" />
                    </button>
                    <button
                        type="button"
                        class="btn btn-secondary btn-xs"
                        title="Retry item gagal teknis"
                        :disabled="Number((row as Record<string, unknown>).failed) === 0"
                        @click="retryJob(String((row as Record<string, unknown>).id))"
                    >
                        <AppIcon name="retry" :size="12" />
                    </button>
                    <button
                        type="button"
                        class="btn btn-danger btn-xs"
                        title="Batalkan job"
                        :disabled="['COMPLETED', 'FAILED', 'CANCELLED', 'PARTIAL'].includes(String((row as Record<string, unknown>).status))"
                        @click="cancelJob(String((row as Record<string, unknown>).id))"
                    >
                        <AppIcon name="cancel" :size="12" />
                    </button>
                </template>
            </DataTable>

            <PaginationBar
                :page="jobMeta.page"
                :per-page="jobMeta.perPage"
                :total="jobMeta.total"
                :last-page="jobMeta.lastPage"
                :loading="loading"
                @page-change="load"
                @per-page-change="(size) => { jobMeta.perPage = size; load(1); }"
            />
        </SectionCard>

        <SectionCard class="mt-3" title="Peringatan penting" hint="Hal yang perlu diingat operator">
            <ul class="list-disc space-y-1 pl-5 text-[12.5px] text-neutral-700">
                <li>Retry hanya dijalankan untuk kegagalan teknis (timeout, gangguan jaringan, error server). Kegagalan validasi harus diperbaiki pada data SIAKAD.</li>
                <li>Job bersifat idempotent: data yang sudah dikirim dan tidak berubah akan berstatus <span class="font-mono">SYNCED</span> sehingga tidak dikirim ulang.</li>
                <li>Operasi hapus ke PDDikti tidak tersedia pada modul ini untuk mencegah kehilangan data pelaporan.</li>
                <li>Semua payload dan respons tersimpan pada log dengan token disensor.</li>
            </ul>
        </SectionCard>
    </div>
</template>
