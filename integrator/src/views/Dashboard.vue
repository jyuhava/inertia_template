<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import PageHeader from '@/components/PageHeader.vue';
import SectionCard from '@/components/SectionCard.vue';
import StatCard from '@/components/StatCard.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import DataTable from '@/components/DataTable.vue';
import EmptyState from '@/components/EmptyState.vue';
import LoadingState from '@/components/LoadingState.vue';
import ErrorPanel from '@/components/ErrorPanel.vue';
import AppIcon from '@/components/AppIcon.vue';
import { useDashboardStore } from '@/stores/dashboard';
import { usePeriodStore } from '@/stores/period';
import { useUiStore } from '@/stores/ui';
import { entityDefinitions } from '@/config/entities';
import { formatDateTime, formatNumber, formatDuration, relativeTime } from '@/utils/format';
import { appConfig } from '@/config/app.config';
import { errorCategoryMeta } from '@/utils/status';
import type { ErrorCategory } from '@/types/common';

/**
 * Dashboard integrator.
 *
 * Memberi gambaran operasional: status koneksi, jumlah data per status,
 * progres sinkronisasi, job terakhir, kegagalan, serta peringatan validasi
 * dan pemetaan. TIDAK ada sinkronisasi otomatis dari halaman ini.
 */
const dashboard = useDashboardStore();
const period = usePeriodStore();
const ui = useUiStore();
const { summary, loading, error, syncProgress, attentionItems, lastLoadedAt } = storeToRefs(dashboard);

const refreshing = ref(false);
let timer: number | null = null;

const entityRows = computed(() =>
    (summary.value?.perEntity ?? []).map((item) => ({
        ...item,
        route: `/${entityDefinitions[item.entity]?.route ?? item.entity}`,
        capability: entityDefinitions[item.entity]?.acts.syncCapability ?? 'full',
    })),
);

const columns = [
    { key: 'label', label: 'Entitas', sortable: true },
    { key: 'siakad', label: 'SIAKAD', align: 'right' as const, sortable: true },
    { key: 'pddikti', label: 'PDDIKTI', align: 'right' as const },
    { key: 'synced', label: 'Sinkron', align: 'right' as const },
    { key: 'willSend', label: 'Akan dikirim', align: 'right' as const },
    { key: 'invalid', label: 'Tidak valid', align: 'right' as const },
    { key: 'unmapped', label: 'Belum dipetakan', align: 'right' as const },
    { key: 'progress', label: 'Progres pemetaan', align: 'right' as const },
    { key: 'capability', label: 'Kapabilitas', align: 'center' as const },
];

const load = async (): Promise<void> => {
    refreshing.value = true;
    await Promise.all([dashboard.load(), period.load()]);
    refreshing.value = false;
};

const capabilityLabel = (capability: string): string => {
    const labels: Record<string, string> = {
        full: 'kirim + update',
        'update-only': 'update saja',
        'assignment-only': 'penugasan',
        'read-only': 'baca saja',
    };
    return labels[capability] ?? capability;
};

onMounted(async () => {
    await load();
    if (ui.autoRefreshDashboard) {
        timer = window.setInterval(() => void dashboard.load(), 60_000);
    }
});

onUnmounted(() => {
    if (timer !== null) window.clearInterval(timer);
});

const dashboardHint = computed(() => {
    const loaded = lastLoadedAt.value ? formatDateTime(lastLoadedAt.value) : '—';
    const version = summary.value?.connection.serverVersion ?? '—';
    return `Terakhir dimuat ${loaded} · sumber: SIAKAD, target: Neo Feeder ${version}`;
});

</script>

<template>
    <div>
        <PageHeader
            icon="dashboard"
            title="Dashboard Integrator PDDikti"
            description="Ringkasan kesiapan data SIAKAD untuk dilaporkan ke PDDikti melalui Neo Feeder. Semua angka di bawah mengikuti periode dan program studi yang dipilih pada header."
            :hint="dashboardHint"
        >
            <template #actions>
                <RouterLink to="/synchronization/wizard" class="btn btn-primary">
                    <AppIcon name="play" :size="14" />
                    Mulai Sync Wizard
                </RouterLink>
                <RouterLink to="/synchronization" class="btn btn-secondary">
                    <AppIcon name="sync" :size="14" />
                    Sinkronisasi
                </RouterLink>
                <button type="button" class="btn btn-secondary" :disabled="refreshing" @click="load">
                    <AppIcon name="refresh" :size="14" :class="refreshing ? 'animate-spin' : ''" />
                    Muat ulang
                </button>
            </template>
        </PageHeader>

        <ErrorPanel v-if="error" class="mb-4" title="Gagal memuat dashboard" :message="error" @retry="load" @dismiss="dashboard.error = null" />

        <LoadingState v-if="loading && !summary" :rows="8" label="Menghitung kesiapan data…" />

        <template v-else-if="summary">
            <!-- Status koneksi + progres -->
            <div class="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-4">
                <div class="panel p-3 lg:col-span-2">
                    <div class="flex flex-wrap items-center gap-2">
                        <AppIcon name="plug" :size="16" class="text-neutral-500" />
                        <h2 class="panel-title">Koneksi Neo Feeder</h2>
                        <StatusBadge :status="summary.connection.status" kind="connection" size="md" />
                        <RouterLink to="/connection" class="btn btn-ghost btn-xs ml-auto">
                            Konfigurasi
                            <AppIcon name="chevron" :size="12" />
                        </RouterLink>
                    </div>

                    <dl class="mt-3 grid grid-cols-2 gap-2 text-[12px] md:grid-cols-4">
                        <div>
                            <dt class="kv-label">Server version</dt>
                            <dd class="font-mono">{{ summary.connection.serverVersion ?? '—' }}</dd>
                        </div>
                        <div>
                            <dt class="kv-label">API status</dt>
                            <dd>{{ summary.connection.apiStatus ?? '—' }}</dd>
                        </div>
                        <div>
                            <dt class="kv-label">Koneksi terakhir</dt>
                            <dd>{{ relativeTime(summary.connection.lastConnectedAt) }}</dd>
                        </div>
                        <div>
                            <dt class="kv-label">Request sukses terakhir</dt>
                            <dd>{{ relativeTime(summary.connection.lastSuccessfulRequestAt) }}</dd>
                        </div>
                    </dl>

                    <p v-if="summary.connection.message" class="mt-2 border border-amber-200 bg-amber-50 px-2 py-1.5 text-2xs text-amber-800">{{ summary.connection.message }}</p>
                </div>

                <div class="panel p-3">
                    <h2 class="panel-title">Progres sinkronisasi</h2>
                    <p class="mt-2 text-[26px] font-semibold leading-none text-neutral-900">{{ syncProgress }}%</p>
                    <p class="mt-1 text-2xs text-neutral-500">{{ formatNumber(summary.totals.synced) }} dari {{ formatNumber(summary.totals.siakad) }} baris sudah identik dengan PDDikti.</p>
                    <div class="mt-2 h-2 w-full border border-neutral-200 bg-neutral-100">
                        <div class="h-full bg-emerald-600 transition-all" :style="{ width: `${syncProgress}%` }" />
                    </div>
                    <div class="mt-2 grid grid-cols-2 gap-1.5 text-2xs text-neutral-600">
                        <span>Akan dikirim: <b>{{ formatNumber(summary.totals.willSend) }}</b></span>
                        <span>Perlu update: <b>{{ formatNumber(summary.totals.willUpdate) }}</b></span>
                        <span>Sedang proses: <b>{{ formatNumber(summary.totals.inProgress) }}</b></span>
                        <span>Konflik: <b>{{ formatNumber(summary.totals.conflict) }}</b></span>
                    </div>
                </div>

                <div class="panel p-3">
                    <h2 class="panel-title">Sinkronisasi terakhir</h2>
                    <template v-if="summary.lastSync">
                        <p class="mt-2 text-[12.5px] text-neutral-800">
                            {{ entityDefinitions[summary.lastSync.entity]?.label ?? summary.lastSync.entity }}
                        </p>
                        <p class="text-2xs text-neutral-500">{{ formatDateTime(summary.lastSync.finishedAt) }} · {{ summary.lastSync.user }}</p>
                        <div class="mt-2 flex flex-wrap gap-1.5">
                            <span class="badge border-emerald-200 bg-emerald-50 text-emerald-700">{{ summary.lastSync.success }} berhasil</span>
                            <span class="badge" :class="summary.lastSync.failed > 0 ? 'border-red-200 bg-red-50 text-red-700' : 'border-neutral-300 bg-neutral-100 text-neutral-600'">
                                {{ summary.lastSync.failed }} gagal
                            </span>
                            <span class="badge border-neutral-300 bg-neutral-100 text-neutral-600">{{ summary.lastSync.total }} item</span>
                        </div>
                        <RouterLink :to="`/synchronization/jobs/${summary.lastSync.jobId}`" class="btn btn-secondary btn-xs mt-2">Lihat job</RouterLink>
                    </template>
                    <div v-else>
                        <EmptyState compact icon="clock" title="Belum ada sinkronisasi" message="Belum ada job sinkronisasi yang dijalankan pada modul ini." />
                    </div>
                </div>
            </div>

            <!-- Kartu utama -->
            <div class="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard label="Jumlah data PDDIKTI" :value="summary.totals.pddikti" tone="success" hint="Baris SIAKAD yang sudah punya pasangan di PDDikti" icon="check" to="/synchronization" />
                <StatCard label="Akan dikirim" :value="summary.totals.willSend" tone="accent" hint="Belum ada di PDDikti (act Insert)" icon="upload" />
                <StatCard label="Data tidak valid" :value="summary.totals.invalid" tone="danger" hint="Gagal validasi, tidak boleh dikirim" icon="alert" to="/validation" />
                <StatCard label="Jumlah data akademik" :value="summary.totals.siakad" tone="info" hint="Total baris SIAKAD pada entitas yang dipantau" icon="activity" />
            </div>

            <!-- Perlu perhatian -->
            <div v-if="attentionItems.length > 0" class="mb-4 border border-amber-200 bg-amber-50 p-3">
                <div class="flex flex-wrap items-center gap-2">
                    <AppIcon name="alert" :size="15" class="text-amber-700" />
                    <p class="text-[12.5px] font-semibold text-amber-900">Perlu perhatian operator</p>
                    <div class="ml-auto flex flex-wrap gap-1.5">
                        <RouterLink v-for="item in attentionItems" :key="item.key" :to="item.key === 'invalid' ? '/validation' : '/synchronization'" class="badge border-amber-300 bg-white text-amber-800 hover:bg-amber-100">
                            {{ item.label }}: <b>{{ formatNumber(item.value) }}</b>
                        </RouterLink>
                    </div>
                </div>
            </div>

            <!-- Tabel entitas -->
            <SectionCard title="Ringkasan per entitas" hint="Klik entitas untuk membuka daftar data, filter, dan aksi sinkronisasi." :padded="false">
                <DataTable :columns="columns" :rows="entityRows" :empty-title="'Tidak ada entitas'" :empty-message="'Belum ada data entitas yang dapat diringkas.'">
                    <template #cell-label="{ row }">
                        <RouterLink :to="String((row as Record<string, unknown>).route)" class="font-medium text-neutral-800 hover:underline">
                            {{ (row as Record<string, unknown>).label }}
                        </RouterLink>
                    </template>
                    <template #cell-progress="{ row }">
                        <div class="flex items-center justify-end gap-2">
                            <div class="h-1.5 w-16 border border-neutral-200 bg-neutral-100">
                                <div class="h-full bg-neutral-900" :style="{ width: `${Number((row as Record<string, unknown>).progress ?? 0)}%` }" />
                            </div>
                            <span class="font-mono text-[11px]">{{ Number((row as Record<string, unknown>).progress ?? 0) }}%</span>
                        </div>
                    </template>
                    <template #cell-capability="{ row }">
                        <span class="badge border-neutral-300 bg-neutral-100 text-neutral-600">{{ capabilityLabel(String((row as Record<string, unknown>).capability)) }}</span>
                    </template>
                </DataTable>
            </SectionCard>

            <!-- Job, kegagalan, peringatan -->
            <div class="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
                <SectionCard title="Sinkronisasi terbaru" hint="6 job terakhir" :padded="false">
                    <EmptyState v-if="summary.recentJobs.length === 0" compact icon="sync" title="Belum ada job" message="Jalankan sinkronisasi dari daftar entitas atau melalui Sync Wizard." />
                    <ul v-else class="divide-y divide-neutral-100">
                        <li v-for="job in summary.recentJobs" :key="job.id" class="flex flex-wrap items-center gap-2 px-3 py-2">
                            <StatusBadge :status="job.status" kind="job" :show-description="false" />
                            <RouterLink :to="`/synchronization/jobs/${job.id}`" class="min-w-0 flex-1 truncate text-[12px] font-medium text-neutral-800 hover:underline">
                                {{ entityDefinitions[job.entity]?.label ?? job.entity }}
                                <span v-if="job.dryRun" class="badge ml-1 border-amber-300 bg-amber-50 text-amber-800">dry run</span>
                            </RouterLink>
                            <span class="text-2xs text-neutral-500">{{ job.success }}/{{ job.total }} · {{ relativeTime(job.createdAt) }}</span>
                        </li>
                    </ul>
                </SectionCard>

                <SectionCard title="Pengiriman gagal" hint="10 kegagalan terakhir yang tercatat" :padded="false">
                    <EmptyState v-if="summary.failedItems.length === 0" compact icon="check" title="Tidak ada kegagalan" message="Semua percobaan pengiriman terakhir berhasil." />
                    <ul v-else class="divide-y divide-neutral-100">
                        <li v-for="item in summary.failedItems" :key="`${item.localId}-${item.createdAt}`" class="px-3 py-2">
                            <div class="flex flex-wrap items-center gap-2">
                                <span class="badge border-red-200 bg-red-50 text-red-700">{{ errorCategoryMeta[item.errorCategory as ErrorCategory]?.label ?? item.errorCategory }}</span>
                                <span class="text-2xs text-neutral-500">{{ entityDefinitions[item.entity]?.label ?? item.entity }} · {{ relativeTime(item.createdAt) }}</span>
                            </div>
                            <p class="mt-1 text-[12px] text-neutral-800">{{ item.localLabel }}</p>
                            <p class="text-2xs text-red-700">{{ item.message }}</p>
                            <RouterLink :to="`/synchronization/jobs/${item.jobId}`" class="btn btn-ghost btn-xs mt-1">Lihat job & retry</RouterLink>
                        </li>
                    </ul>
                </SectionCard>

                <SectionCard title="Peringatan" hint="Validasi data dan kelengkapan pemetaan" :padded="false">
                    <div class="border-b border-neutral-200 px-3 py-2">
                        <p class="kv-label mb-1">Aturan validasi yang paling sering muncul</p>
                        <EmptyState v-if="summary.validationWarnings.length === 0" compact icon="check" title="Tidak ada peringatan" message="Seluruh data memenuhi aturan validasi dasar." />
                        <ul v-else class="space-y-1">
                            <li v-for="warning in summary.validationWarnings" :key="warning.code" class="flex items-start gap-2">
                                <StatusBadge :status="warning.severity" kind="severity" :show-description="false" />
                                <span class="min-w-0 flex-1 text-[12px] text-neutral-700">{{ warning.message }}</span>
                                <span class="font-mono text-[11px] text-neutral-500">{{ warning.count }}×</span>
                            </li>
                        </ul>
                    </div>

                    <div class="px-3 py-2">
                        <p class="kv-label mb-1">Kelengkapan pemetaan entitas wajib</p>
                        <ul class="space-y-1.5">
                            <li v-for="warning in summary.mappingWarnings" :key="warning.entity" class="flex items-center gap-2">
                                <RouterLink :to="`/mapping/${warning.entity}`" class="min-w-0 flex-1 truncate text-[12px] text-neutral-700 hover:underline">{{ warning.label }}</RouterLink>
                                <span class="badge" :class="warning.unmapped > 0 ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-700'">
                                    {{ warning.total - warning.unmapped }}/{{ warning.total }} terpetakan
                                </span>
                            </li>
                        </ul>
                        <RouterLink to="/mapping" class="btn btn-secondary btn-xs mt-2">Buka Mapping Center</RouterLink>
                    </div>
                </SectionCard>
            </div>

            <p class="mt-3 text-2xs text-neutral-500">
                Mode mock: <span class="font-mono">{{ appConfig.mockMode ? 'aktif' : 'nonaktif' }}</span> · interval polling job {{ formatDuration(appConfig.syncPollIntervalMs) }} ·
                <RouterLink to="/panduan" class="underline">lihat panduan alur sinkronisasi</RouterLink>
            </p>
        </template>
    </div>
</template>
