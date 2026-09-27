<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import PageHeader from '@/components/PageHeader.vue';
import SectionCard from '@/components/SectionCard.vue';
import StatCard from '@/components/StatCard.vue';
import DataTable from '@/components/DataTable.vue';
import PaginationBar from '@/components/PaginationBar.vue';
import AppDrawer from '@/components/AppDrawer.vue';
import JsonBlock from '@/components/JsonBlock.vue';
import ResponseViewer from '@/components/ResponseViewer.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import EmptyState from '@/components/EmptyState.vue';
import ErrorPanel from '@/components/ErrorPanel.vue';
import AppIcon from '@/components/AppIcon.vue';
import { useLogsStore } from '@/stores/logs';
import { entityDefinitions, entityList } from '@/config/entities';
import { ExportService } from '@/services/ExportService';
import { errorCategoryMeta } from '@/utils/status';
import { formatDateTime, formatDuration, formatNumber, relativeTime } from '@/utils/format';
import type { SyncLogEntry } from '@/types/integration';
import type { ErrorCategory } from '@/types/common';

/**
 * LogsView — audit trail lengkap: request, respons, kode Neo Feeder, durasi,
 * percobaan, dan operator. Token selalu disensor pada payload yang ditampilkan.
 */
const route = useRoute();
const logs = useLogsStore();
const detailOpen = ref(false);

const columns = [
    { key: 'createdAt', label: 'Waktu' },
    { key: 'entity', label: 'Entitas' },
    { key: 'localLabel', label: 'Data' },
    { key: 'act', label: 'Act', mono: true },
    { key: 'action', label: 'Aksi', align: 'center' as const },
    { key: 'status', label: 'Status', align: 'center' as const },
    { key: 'neoFeederCode', label: 'error_code', align: 'right' as const },
    { key: 'errorCategory', label: 'Kategori error' },
    { key: 'durationMs', label: 'Durasi', align: 'right' as const },
    { key: 'attempt', label: 'Percobaan', align: 'right' as const },
    { key: 'user', label: 'Operator' },
];

const categoryOptions = computed(() => Object.entries(errorCategoryMeta).map(([value, meta]) => ({ value, label: meta.label })));

const rows = computed(() =>
    logs.logs.map((log) => ({
        ...log,
        entityLabel: entityDefinitions[log.entity]?.label ?? log.entity,
        errorLabel: log.errorCategory ? (errorCategoryMeta[log.errorCategory as ErrorCategory]?.label ?? log.errorCategory) : '—',
    })),
);

const failureRate = computed(() => (logs.stats.total === 0 ? 0 : Math.round((logs.stats.failed / logs.stats.total) * 100)));

const drawerTitle = computed(() => (logs.detail ? `${logs.detail.act} · ${logs.detail.localLabel}` : 'Detail log'));

const drawerSubtitle = computed(() => {
    if (!logs.detail) return '';
    return `request ${logs.detail.requestId} · ${formatDateTime(logs.detail.createdAt)} · ${logs.detail.user}`;
});


const load = async (page = 1): Promise<void> => {
    await logs.load({ page });
};

onMounted(async () => {
    const searchFromQuery = route.query.search as string | undefined;
    if (searchFromQuery) {
        logs.filters.search = searchFromQuery;
        await logs.applyFilters({ search: searchFromQuery });
    } else {
        await load(1);
    }
});

watch(
    () => route.query.search,
    async (value) => {
        if (typeof value === 'string') {
            await logs.applyFilters({ search: value });
        }
    },
);

const openDetail = async (log: SyncLogEntry): Promise<void> => {
    await logs.loadDetail(log.id);
    detailOpen.value = true;
};

const exportLogs = (format: 'csv' | 'json'): void => {
    ExportService.exportLogs(logs.logs, format);
};

const exportRequestResponse = (): void => {
    if (!logs.detail) return;
    ExportService.exportRequestResponse(logs.detail);
};
</script>

<template>
    <div>
        <PageHeader
            icon="file"
            title="Log & Audit Trail"
            description="Seluruh percobaan pengiriman ke Neo Feeder tercatat: payload yang dikirim (token disensor), respons mentah, kode error, durasi, jumlah percobaan, dan operator pelaksana."
            hint="Log dipakai untuk penelusuran kegagalan dan bukti audit pelaporan PDDikti."
        >
            <template #actions>
                <button type="button" class="btn btn-secondary" @click="exportLogs('csv')">
                    <AppIcon name="download" :size="14" />
                    Export CSV
                </button>
                <button type="button" class="btn btn-secondary" @click="exportLogs('json')">
                    <AppIcon name="download" :size="14" />
                    Export JSON
                </button>
                <button type="button" class="btn btn-primary" :disabled="logs.loading" @click="load(logs.meta.page)">
                    <AppIcon name="refresh" :size="14" :class="logs.loading ? 'animate-spin' : ''" />
                    Segarkan
                </button>
            </template>
        </PageHeader>

        <ErrorPanel v-if="logs.error" class="mb-3" title="Gagal memuat log" :message="logs.error" @retry="load(1)" @dismiss="logs.error = null" />

        <div class="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Total request" :value="logs.stats.total" tone="info" hint="Seluruh percobaan pengiriman" icon="activity" />
            <StatCard label="Berhasil" :value="logs.stats.success" tone="success" hint="error_code = 0" icon="check" />
            <StatCard label="Gagal" :value="logs.stats.failed" tone="danger" :hint="`${failureRate}% dari total request`" icon="alert" />
            <StatCard label="Rata-rata durasi" :value="formatDuration(logs.stats.avgDurationMs)" tone="neutral" hint="Termasuk retry yang tercatat" icon="clock" />
        </div>

        <SectionCard :padded="false">
            <div class="flex flex-wrap items-end gap-2 border-b border-neutral-200 px-3 py-2.5">
                <label class="w-52">
                    <span class="label">Entitas</span>
                    <select class="select" :value="logs.filters.entity" @change="logs.applyFilters({ entity: ($event.target as HTMLSelectElement).value as never })">
                        <option value="">Semua entitas</option>
                        <option v-for="definition in entityList" :key="definition.key" :value="definition.key">{{ definition.label }}</option>
                    </select>
                </label>

                <label class="w-40">
                    <span class="label">Status</span>
                    <select class="select" :value="logs.filters.status" @change="logs.applyFilters({ status: ($event.target as HTMLSelectElement).value as never })">
                        <option value="">Semua status</option>
                        <option value="success">Berhasil</option>
                        <option value="failed">Gagal</option>
                    </select>
                </label>

                <label class="w-48">
                    <span class="label">Kategori error</span>
                    <select class="select" :value="logs.filters.errorCategory" @change="logs.applyFilters({ errorCategory: ($event.target as HTMLSelectElement).value })">
                        <option value="">Semua kategori</option>
                        <option v-for="option in categoryOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                    </select>
                </label>

                <label class="min-w-[220px] flex-1">
                    <span class="label">Pencarian</span>
                    <input
                        class="input"
                        type="search"
                        placeholder="Cari data, act, pesan, atau request id…"
                        :value="logs.filters.search"
                        @input="logs.applyFilters({ search: ($event.target as HTMLInputElement).value })"
                    />
                </label>

                <button type="button" class="btn btn-secondary" @click="logs.resetFilters()">
                    <AppIcon name="x" :size="13" />
                    Reset
                </button>

                <span class="ml-auto badge border-neutral-300 bg-neutral-100 text-neutral-600">{{ formatNumber(logs.meta.total) }} catatan</span>
            </div>

            <DataTable
                :columns="columns"
                :rows="rows"
                :loading="logs.loading"
                clickable-rows
                empty-title="Belum ada log"
                empty-message="Log akan terisi setelah ada percobaan pengiriman ke Neo Feeder."
                @row-click="openDetail($event as SyncLogEntry)"
            >
                <template #cell-createdAt="{ row }">
                    <span :title="formatDateTime(String((row as Record<string, unknown>).createdAt))">{{ relativeTime(String((row as Record<string, unknown>).createdAt)) }}</span>
                </template>

                <template #cell-entity="{ row }">
                    <span class="text-[12px] text-neutral-700">{{ (row as Record<string, unknown>).entityLabel }}</span>
                </template>

                <template #cell-status="{ row }">
                    <StatusBadge :status="(row as Record<string, unknown>).status === 'success' ? 'SUCCESS' : 'FAILED'" :show-description="false" />
                </template>

                <template #cell-neoFeederCode="{ row }">
                    <span class="font-mono" :class="Number((row as Record<string, unknown>).neoFeederCode) === 0 ? 'text-emerald-700' : 'text-red-700'">
                        {{ (row as Record<string, unknown>).neoFeederCode ?? '—' }}
                    </span>
                </template>

                <template #cell-errorCategory="{ row }">
                    <span v-if="(row as Record<string, unknown>).errorCategory" class="badge border-red-200 bg-red-50 text-red-700">
                        {{ (row as Record<string, unknown>).errorLabel }}
                    </span>
                    <span v-else class="text-2xs text-neutral-400">—</span>
                </template>

                <template #cell-durationMs="{ row }">
                    {{ formatDuration(Number((row as Record<string, unknown>).durationMs)) }}
                </template>

                <template #cell-localLabel="{ row }">
                    <span class="text-[12px] text-neutral-800">{{ (row as Record<string, unknown>).localLabel }}</span>
                </template>

                <template #actions="{ row }">
                    <button type="button" class="btn btn-ghost btn-xs" title="Detail payload & respons" @click="openDetail(row as SyncLogEntry)">
                        <AppIcon name="eye" :size="12" />
                    </button>
                </template>
            </DataTable>

            <PaginationBar
                :page="logs.meta.page"
                :per-page="logs.meta.perPage"
                :total="logs.meta.total"
                :last-page="logs.meta.lastPage"
                :loading="logs.loading"
                @page-change="load"
                @per-page-change="(size) => { logs.meta.perPage = size; load(1); }"
            />
        </SectionCard>

        <AppDrawer
            :open="detailOpen"
            width="max-w-4xl"
            :title="drawerTitle"
            :subtitle="drawerSubtitle"
            @close="detailOpen = false"
        >
            <template #header-actions>
                <button type="button" class="btn btn-secondary btn-xs" :disabled="!logs.detail" @click="exportRequestResponse">
                    <AppIcon name="download" :size="12" />
                    Unduh request & respons
                </button>
            </template>

            <div v-if="logs.loadingDetail" class="text-[12.5px] text-neutral-500">Memuat detail log…</div>

            <div v-else-if="logs.detail" class="space-y-3">
                <div class="flex flex-wrap items-center gap-2">
                    <StatusBadge :status="logs.detail.status === 'success' ? 'SUCCESS' : 'FAILED'" :show-description="false" />
                    <span class="badge border-neutral-300 bg-neutral-100 font-mono text-neutral-700">{{ logs.detail.act }}</span>
                    <span class="badge border-neutral-300 bg-neutral-100 text-neutral-700">{{ logs.detail.action }}</span>
                    <span class="badge border-neutral-300 bg-neutral-100 text-neutral-700">{{ entityDefinitions[logs.detail.entity].label }}</span>
                    <span v-if="logs.detail.jobId" class="badge border-neutral-300 bg-neutral-100 text-neutral-700">job {{ logs.detail.jobId }}</span>
                    <RouterLink v-if="logs.detail.jobId" :to="`/synchronization/jobs/${logs.detail.jobId}`" class="btn btn-ghost btn-xs">
                        Buka job
                    </RouterLink>
                </div>

                <ResponseViewer
                    :response="(logs.detail.response ?? null) as never"
                    :http-status="logs.detail.httpStatus"
                    :code="logs.detail.neoFeederCode"
                    :message="logs.detail.neoFeederMessage"
                    :duration-ms="logs.detail.durationMs"
                    :attempt="logs.detail.attempt"
                    :request-id="logs.detail.requestId"
                    :created-at="logs.detail.createdAt"
                    :error-category="logs.detail.errorCategory"
                />

                <JsonBlock :value="logs.detail.payload ?? {}" label="Request payload (token disensor)" />
            </div>

            <template #footer>
                <button type="button" class="btn btn-secondary" @click="detailOpen = false">Tutup</button>
            </template>
        </AppDrawer>
    </div>
</template>
