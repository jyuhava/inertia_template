<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import PageHeader from '@/components/PageHeader.vue';
import SectionCard from '@/components/SectionCard.vue';
import SyncProgress from '@/components/SyncProgress.vue';
import DataTable from '@/components/DataTable.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import ErrorPanel from '@/components/ErrorPanel.vue';
import EmptyState from '@/components/EmptyState.vue';
import AppIcon from '@/components/AppIcon.vue';
import JsonBlock from '@/components/JsonBlock.vue';
import AppModal from '@/components/AppModal.vue';
import { useSyncStore } from '@/stores/sync';
import { useLogsStore } from '@/stores/logs';
import { useJobMonitor } from '@/composables/useJobMonitor';
import { entityDefinitions } from '@/config/entities';
import { useToast } from '@/composables/useUi';
import { formatDateTime, formatDuration, formatNumber } from '@/utils/format';
import { SyncService } from '@/services/SyncService';
import type { SyncJobItem } from '@/types/integration';

/**
 * SyncJobDetail — rincian satu job sinkronisasi: progres, daftar item,
 * hasil per item, serta akses cepat ke payload dan respons Neo Feeder.
 */
const route = useRoute();
const router = useRouter();
const toast = useToast();
const sync = useSyncStore();
const logs = useLogsStore();

/** Snapshot job dipantau secara langsung agar progres selalu terbaru. */
const {
    job,
    polling,
    retryableCount,
    watch: watchJob,
    retryFailed: retryJob,
    cancel: cancelJob,
} = useJobMonitor({
    onFinished: () => {
        void sync.loadJobs({ page: 1 });
    },
});

const jobId = computed(() => String(route.params.id ?? ''));
const logModalOpen = ref(false);
const filterStatus = ref('');

const columns = [
    { key: 'localLabel', label: 'Data' },
    { key: 'act', label: 'Act', mono: true },
    { key: 'action', label: 'Aksi', align: 'center' as const },
    { key: 'status', label: 'Status', align: 'center' as const },
    { key: 'attempts', label: 'Percobaan', align: 'right' as const },
    { key: 'responseCode', label: 'error_code', align: 'right' as const },
    { key: 'durationMs', label: 'Durasi', align: 'right' as const },
    { key: 'message', label: 'Pesan' },
];

const items = computed(() => job.value?.items ?? []);
const filteredItems = computed(() => (filterStatus.value ? items.value.filter((item) => item.status === filterStatus.value) : items.value));

const statusCounts = computed(() => ({
    PENDING: items.value.filter((item) => item.status === 'PENDING').length,
    RUNNING: items.value.filter((item) => item.status === 'RUNNING').length,
    SUCCESS: items.value.filter((item) => item.status === 'SUCCESS').length,
    FAILED: items.value.filter((item) => item.status === 'FAILED').length,
    SKIPPED: items.value.filter((item) => item.status === 'SKIPPED').length,
}));

const load = async (): Promise<void> => {
    const loaded = await sync.loadJob(jobId.value);
    if (!loaded) {
        toast.error('Job tidak ditemukan', sync.error ? new Error(sync.error) : null);
        return;
    }
    watchJob(jobId.value, loaded);
};

onMounted(load);

const retry = async (): Promise<void> => {
    if (!job.value) return;
    await retryJob();
    toast.info('Retry dijalankan', 'Item gagal teknis diulang sesuai kebijakan retry.');
};

const cancel = async (): Promise<void> => {
    if (!job.value) return;
    await cancelJob();
    toast.warning('Permintaan pembatalan dikirim');
};

const openLog = async (requestId: string | null): Promise<void> => {
    if (!requestId) {
        toast.warning('Log belum tersedia', 'Item ini belum memiliki request yang tercatat.');
        return;
    }
    await logs.load({ page: 1, perPage: 50 });
    const match = logs.logs.find((entry) => entry.requestId === requestId);
    if (!match) {
        void router.push(`/logs?search=${requestId}`);
        return;
    }
    await logs.loadDetail(match.id);
    logModalOpen.value = true;
};

const itemRow = (item: SyncJobItem): Record<string, unknown> => ({ ...item, message: item.message ?? '—' });

const pageDescription = computed(() => {
    if (!job.value) return 'Detail job sinkronisasi';
    const prodiPart = job.value.prodiLabel ? ` · ${job.value.prodiLabel}` : '';
    return `Sinkronisasi ${entityDefinitions[job.value.entity].label} · ${job.value.periodLabel ?? 'semua periode'}${prodiPart}`;
});

const pageHint = computed(() => {
    if (!job.value) return '';
    return `Dibuat ${formatDateTime(job.value.createdAt)} oleh ${job.value.createdBy} · ${job.value.dryRun ? 'DRY RUN' : 'pengiriman nyata'}`;
});

const logModalTitle = computed(() => (logs.detail ? `Request ${logs.detail.requestId}` : 'Detail request'));

</script>

<template>
    <div>
        <PageHeader
            icon="sync"
            :title="`Job ${jobId}`"
            :description="pageDescription"
            :hint="pageHint"
        >
            <template #actions>
                <RouterLink to="/synchronization" class="btn btn-secondary">
                    <AppIcon name="arrow_left" :size="14" />
                    Semua job
                </RouterLink>
                <button type="button" class="btn btn-secondary" @click="load">
                    <AppIcon name="refresh" :size="14" :class="polling ? 'animate-spin' : ''" />
                    {{ polling ? 'Memantau…' : 'Segarkan' }}
                </button>
                <button type="button" class="btn btn-secondary" :disabled="retryableCount === 0" @click="retry">
                    <AppIcon name="retry" :size="14" />
                    Retry gagal ({{ retryableCount }})
                </button>
                <button type="button" class="btn btn-danger" :disabled="!job || SyncService.isFinished(job)" @click="cancel">
                    <AppIcon name="cancel" :size="14" />
                    Batalkan
                </button>
            </template>
        </PageHeader>

        <ErrorPanel v-if="sync.error" class="mb-3" title="Gagal memuat job" :message="sync.error" @retry="load" @dismiss="sync.error = null" />

        <EmptyState v-if="!job" icon="search" title="Job tidak ditemukan" message="Job sinkronisasi yang Anda cari tidak tersedia.">
            <RouterLink to="/synchronization" class="btn btn-secondary mt-3">Kembali ke Synchronization Center</RouterLink>
        </EmptyState>

        <template v-else>
            <SectionCard class="mb-3" title="Progres sinkronisasi" :hint="job.dryRun ? 'DRY RUN — tidak ada data yang dikirim ke Neo Feeder' : 'Progres diperbarui otomatis'">
                <SyncProgress :key="`${job.id}-${job.status}-${job.processed}`" :job="job" :max-items="12" @retry="retry" @cancel="cancel" @open-log="openLog" />
            </SectionCard>

            <div class="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-5">
                <div class="panel px-3 py-2">
                    <p class="kv-label">Total item</p>
                    <p class="mt-0.5 text-[18px] font-semibold">{{ formatNumber(job.total) }}</p>
                </div>
                <div class="panel px-3 py-2">
                    <p class="kv-label">Berhasil</p>
                    <p class="mt-0.5 text-[18px] font-semibold text-emerald-700">{{ formatNumber(job.success) }}</p>
                </div>
                <div class="panel px-3 py-2">
                    <p class="kv-label">Gagal</p>
                    <p class="mt-0.5 text-[18px] font-semibold text-red-700">{{ formatNumber(job.failed) }}</p>
                </div>
                <div class="panel px-3 py-2">
                    <p class="kv-label">Dilewati</p>
                    <p class="mt-0.5 text-[18px] font-semibold text-neutral-600">{{ formatNumber(job.skipped) }}</p>
                </div>
                <div class="panel px-3 py-2">
                    <p class="kv-label">Durasi total</p>
                    <p class="mt-0.5 text-[18px] font-semibold">
                        {{ job.startedAt && job.finishedAt ? formatDuration(new Date(job.finishedAt).getTime() - new Date(job.startedAt).getTime()) : '—' }}
                    </p>
                </div>
            </div>

            <SectionCard title="Item job" :padded="false">
                <div class="flex flex-wrap items-center gap-2 border-b border-neutral-200 px-3 py-2">
                    <button
                        v-for="option in [
                            { value: '', label: `Semua (${job.total})` },
                            { value: 'SUCCESS', label: `Berhasil (${statusCounts.SUCCESS})` },
                            { value: 'FAILED', label: `Gagal (${statusCounts.FAILED})` },
                            { value: 'PENDING', label: `Menunggu (${statusCounts.PENDING})` },
                            { value: 'SKIPPED', label: `Dilewati (${statusCounts.SKIPPED})` },
                        ]"
                        :key="option.value"
                        type="button"
                        class="btn btn-xs"
                        :class="filterStatus === option.value ? 'btn-primary' : 'btn-secondary'"
                        @click="filterStatus = option.value"
                    >
                        {{ option.label }}
                    </button>
                </div>

                <DataTable :columns="columns" :rows="filteredItems.map(itemRow)" empty-title="Tidak ada item" empty-message="Job ini belum memiliki item yang sesuai filter.">
                    <template #cell-status="{ row }">
                        <StatusBadge :status="String((row as Record<string, unknown>).status)" kind="jobitem" />
                    </template>

                    <template #cell-durationMs="{ row }">
                        {{ (row as Record<string, unknown>).durationMs ? formatDuration(Number((row as Record<string, unknown>).durationMs)) : '—' }}
                    </template>

                    <template #cell-responseCode="{ row }">
                        <span class="font-mono" :class="Number((row as Record<string, unknown>).responseCode) === 0 ? 'text-emerald-700' : 'text-red-700'">
                            {{ (row as Record<string, unknown>).responseCode ?? '—' }}
                        </span>
                    </template>

                    <template #cell-message="{ row }">
                        <span class="text-2xs" :class="(row as Record<string, unknown>).status === 'FAILED' ? 'text-red-700' : 'text-neutral-600'">
                            {{ (row as Record<string, unknown>).message ?? '—' }}
                        </span>
                    </template>

                    <template #actions="{ row }">
                        <button type="button" class="btn btn-ghost btn-xs" title="Payload & respons" @click="openLog((row as Record<string, unknown>).requestId as string)">
                            <AppIcon name="file" :size="12" />
                        </button>
                    </template>
                </DataTable>
            </SectionCard>

            <SectionCard class="mt-3" title="Catatan job">
                <p class="text-[12.5px] text-neutral-700">{{ job.notes ?? 'Tidak ada catatan tambahan pada job ini.' }}</p>
                <ul class="mt-2 list-disc space-y-1 pl-5 text-2xs text-neutral-600">
                    <li>Item yang gagal karena validasi tidak akan berhasil pada retry — perbaiki data SIAKAD terlebih dahulu.</li>
                    <li>Job bersifat idempotent: item yang sudah sukses tidak dikirim ulang.</li>
                    <li>Token disensor pada seluruh payload yang ditampilkan maupun diekspor.</li>
                </ul>
            </SectionCard>
        </template>

        <AppModal :open="logModalOpen" size="lg" :title="logModalTitle" @close="logModalOpen = false">
            <div v-if="logs.detail" class="space-y-3">
                <div class="flex flex-wrap items-center gap-2">
                    <StatusBadge :status="logs.detail.status === 'success' ? 'SUCCESS' : 'FAILED'" :show-description="false" />
                    <span class="badge border-neutral-300 bg-neutral-100 font-mono text-neutral-700">{{ logs.detail.act }}</span>
                    <span class="text-2xs text-neutral-500">
                        {{ formatDateTime(logs.detail.createdAt) }} · {{ formatDuration(logs.detail.durationMs) }} · percobaan {{ logs.detail.attempt }}
                    </span>
                </div>
                <JsonBlock :value="logs.detail.payload ?? {}" label="Request (token disensor)" />
                <JsonBlock :value="logs.detail.response ?? {}" label="Response Neo Feeder" />
            </div>
            <template #footer>
                <button type="button" class="btn btn-secondary" @click="logModalOpen = false">Tutup</button>
            </template>
        </AppModal>
    </div>
</template>
