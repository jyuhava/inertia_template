<script setup lang="ts">
import { computed, onMounted } from 'vue';
import PageHeader from '@/components/PageHeader.vue';
import SectionCard from '@/components/SectionCard.vue';
import StatCard from '@/components/StatCard.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import EmptyState from '@/components/EmptyState.vue';
import ErrorPanel from '@/components/ErrorPanel.vue';
import AppIcon from '@/components/AppIcon.vue';
import { useDashboardStore } from '@/stores/dashboard';
import { entityDefinitions } from '@/config/entities';
import { errorCategoryMeta } from '@/utils/status';
import { formatDateTime, formatDuration, formatNumber, relativeTime } from '@/utils/format';
import type { ErrorCategory } from '@/types/common';

/**
 * Monitoring — kesehatan operasional integrasi: antrean, throughput harian,
 * latensi per act, sebaran kategori error, kegagalan terbaru, dan kesehatan token.
 */
const dashboard = useDashboardStore();

const monitoring = computed(() => dashboard.monitoring);

const maxThroughput = computed(() => {
    if (!monitoring.value) return 1;
    return Math.max(1, ...monitoring.value.throughput.map((item) => item.success + item.failed));
});

const maxError = computed(() => {
    if (!monitoring.value) return 1;
    return Math.max(1, ...monitoring.value.errorBreakdown.map((item) => item.count));
});

onMounted(() => {
    void dashboard.loadMonitoring();
});

const barWidth = (value: number): string => `${Math.round((value / maxThroughput.value) * 100)}%`;
const errorWidth = (value: number): string => `${Math.round((value / maxError.value) * 100)}%`;
</script>

<template>
    <div>
        <PageHeader
            icon="activity"
            title="Monitoring Sinkronisasi"
            description="Pantauan kesehatan integrasi: antrean job, throughput harian, latensi per act, sebaran kegagalan, dan status token Neo Feeder."
            hint="Data dihitung dari log sinkronisasi yang tercatat pada backend."
        >
            <template #actions>
                <RouterLink to="/logs" class="btn btn-secondary">
                    <AppIcon name="file" :size="14" />
                    Log & Audit
                </RouterLink>
                <button type="button" class="btn btn-primary" :disabled="dashboard.loadingMonitoring" @click="dashboard.loadMonitoring()">
                    <AppIcon name="refresh" :size="14" :class="dashboard.loadingMonitoring ? 'animate-spin' : ''" />
                    Muat ulang
                </button>
            </template>
        </PageHeader>

        <ErrorPanel v-if="dashboard.error" class="mb-3" title="Gagal memuat monitoring" :message="dashboard.error" @retry="dashboard.loadMonitoring()" @dismiss="dashboard.error = null" />

        <EmptyState v-if="!monitoring && !dashboard.loadingMonitoring" icon="activity" title="Data monitoring belum tersedia" message="Monitoring akan terisi setelah ada job sinkronisasi yang tercatat pada backend." />

        <template v-if="monitoring">
            <div class="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard label="Antrean" :value="monitoring.queue.queued" tone="neutral" hint="Job menunggu dijalankan" icon="clock" />
                <StatCard label="Berjalan" :value="monitoring.queue.running" tone="warning" hint="Sedang memproses" icon="sync" />
                <StatCard label="Selesai" :value="monitoring.queue.completed" tone="success" hint="Job tuntas / sebagian" icon="check" />
                <StatCard label="Gagal" :value="monitoring.queue.failed" tone="danger" hint="Job tanpa item sukses" icon="alert" />
            </div>

            <div class="grid grid-cols-1 gap-3 xl:grid-cols-2">
                <SectionCard title="Throughput 7 hari" hint="Jumlah item sukses dan gagal per hari">
                    <div class="space-y-2">
                        <div v-for="item in monitoring.throughput" :key="item.label" class="flex items-center gap-2">
                            <span class="w-14 shrink-0 text-2xs text-neutral-500">{{ item.label }}</span>
                            <div class="flex h-4 flex-1 border border-neutral-200 bg-neutral-50">
                                <div class="h-full bg-emerald-500" :style="{ width: barWidth(item.success) }" :title="`${item.success} sukses`" />
                                <div class="h-full bg-red-500" :style="{ width: barWidth(item.failed) }" :title="`${item.failed} gagal`" />
                            </div>
                            <span class="w-20 shrink-0 text-right text-2xs text-neutral-600">{{ item.success }}/{{ item.failed }}</span>
                        </div>
                    </div>
                    <div class="mt-2 flex items-center gap-3 text-2xs text-neutral-500">
                        <span class="flex items-center gap-1"><span class="inline-block h-2 w-2 bg-emerald-500" /> sukses</span>
                        <span class="flex items-center gap-1"><span class="inline-block h-2 w-2 bg-red-500" /> gagal</span>
                    </div>
                </SectionCard>

                <SectionCard title="Kesehatan token" hint="Status autentikasi terhadap Web Service Neo Feeder">
                    <div class="flex flex-wrap items-center gap-2">
                        <StatusBadge :status="monitoring.tokenHealth.status" kind="connection" size="md" />
                        <span v-if="monitoring.tokenHealth.tokenExpiresAt" class="badge border-neutral-300 bg-neutral-100 text-neutral-700">
                            berlaku sampai {{ formatDateTime(monitoring.tokenHealth.tokenExpiresAt) }}
                        </span>
                    </div>
                    <dl class="mt-3 space-y-2 text-[12px]">
                        <div class="flex justify-between gap-2">
                            <dt class="kv-label">Refresh token 24 jam</dt>
                            <dd>{{ monitoring.tokenHealth.refreshesLast24h }}×</dd>
                        </div>
                        <div class="flex justify-between gap-2">
                            <dt class="kv-label">Sisa waktu berlaku</dt>
                            <dd>{{ relativeTime(monitoring.tokenHealth.tokenExpiresAt) }}</dd>
                        </div>
                    </dl>
                    <p class="mt-2 text-2xs leading-relaxed text-neutral-500">
                        Token dikelola backend dan tidak pernah ditampilkan ke frontend. Bila status berubah menjadi AUTHENTICATION_FAILED, lakukan autentikasi ulang pada halaman Koneksi.
                    </p>
                    <RouterLink to="/connection" class="btn btn-secondary btn-xs mt-2">
                        <AppIcon name="plug" :size="12" />
                        Buka halaman Koneksi
                    </RouterLink>
                </SectionCard>

                <SectionCard title="Latensi per act" hint="Rata-rata dan maksimum durasi request Web Service" :padded="false">
                    <EmptyState v-if="monitoring.latency.length === 0" compact icon="activity" title="Belum ada data latensi" message="Latensi terhitung setelah ada request yang tercatat pada log." />
                    <table v-else class="data-table">
                        <thead>
                            <tr><th>Act</th><th class="text-right">Panggilan</th><th class="text-right">Rata-rata</th><th class="text-right">Maksimum</th></tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in monitoring.latency" :key="item.act">
                                <td class="font-mono text-[11px]">{{ item.act }}</td>
                                <td class="text-right">{{ formatNumber(item.calls) }}</td>
                                <td class="text-right" :class="item.avgMs > 5000 ? 'font-semibold text-amber-700' : ''">{{ formatDuration(item.avgMs) }}</td>
                                <td class="text-right text-neutral-600">{{ formatDuration(item.maxMs) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </SectionCard>

                <SectionCard title="Sebaran kategori error" hint="Pengelompokan kegagalan berdasarkan kategori ternormalisasi">
                    <EmptyState v-if="monitoring.errorBreakdown.length === 0" compact icon="check" title="Tidak ada kegagalan" message="Seluruh request tercatat sukses." />
                    <div v-else class="space-y-2">
                        <div v-for="item in monitoring.errorBreakdown" :key="item.category" class="flex items-center gap-2">
                            <span class="w-40 shrink-0 text-[12px] text-neutral-700">{{ errorCategoryMeta[item.category as ErrorCategory]?.label ?? item.category }}</span>
                            <div class="h-3 flex-1 border border-neutral-200 bg-neutral-50">
                                <div class="h-full bg-red-500" :style="{ width: errorWidth(item.count) }" />
                            </div>
                            <span class="w-10 shrink-0 text-right text-2xs font-semibold text-neutral-700">{{ item.count }}</span>
                        </div>
                        <p class="text-2xs text-neutral-500">
                            Kategori retryable (gangguan jaringan, timeout, kesalahan PDDikti) dapat diulang; kategori validasi/konflik harus diperbaiki pada data SIAKAD.
                        </p>
                    </div>
                </SectionCard>
            </div>

            <SectionCard class="mt-3" title="Kegagalan terbaru" hint="10 kegagalan terakhir beserta tindak lanjut" :padded="false">
                <EmptyState v-if="monitoring.recentFailures.length === 0" compact icon="check" title="Tidak ada kegagalan terbaru" message="Semua pengiriman terakhir berhasil." />
                <ul v-else class="divide-y divide-neutral-100">
                    <li v-for="log in monitoring.recentFailures" :key="log.id" class="px-3 py-2">
                        <div class="flex flex-wrap items-center gap-2">
                            <StatusBadge :status="log.errorCategory ?? 'UNKNOWN_ERROR'" kind="severity" :show-description="false" />
                            <span class="badge border-neutral-300 bg-neutral-100 font-mono text-neutral-700">{{ log.act }}</span>
                            <span class="text-2xs text-neutral-500">{{ entityDefinitions[log.entity].label }} · {{ relativeTime(log.createdAt) }} · {{ formatDuration(log.durationMs) }}</span>
                            <RouterLink :to="`/logs?search=${log.requestId}`" class="btn btn-ghost btn-xs ml-auto">
                                <AppIcon name="eye" :size="12" />
                                Detail log
                            </RouterLink>
                        </div>
                        <p class="mt-1 text-[12px] text-neutral-800">{{ log.localLabel }}</p>
                        <p class="text-2xs text-red-700">{{ log.neoFeederMessage ?? 'Tanpa keterangan' }}</p>
                    </li>
                </ul>
            </SectionCard>
        </template>
    </div>
</template>
