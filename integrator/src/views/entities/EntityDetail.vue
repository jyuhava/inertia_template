<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageHeader from '@/components/PageHeader.vue';
import SectionCard from '@/components/SectionCard.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import EntityTabs from '@/components/EntityTabs.vue';
import ComparisonTable from '@/components/ComparisonTable.vue';
import ValidationPanel from '@/components/ValidationPanel.vue';
import PayloadViewer from '@/components/PayloadViewer.vue';
import ResponseViewer from '@/components/ResponseViewer.vue';
import SyncHistory from '@/components/SyncHistory.vue';
import JsonBlock from '@/components/JsonBlock.vue';
import LoadingState from '@/components/LoadingState.vue';
import EmptyState from '@/components/EmptyState.vue';
import ErrorPanel from '@/components/ErrorPanel.vue';
import AppIcon from '@/components/AppIcon.vue';
import AppModal from '@/components/AppModal.vue';
import { SiakadService } from '@/services/SiakadService';
import { ExportService } from '@/services/ExportService';
import { entityDefinitions } from '@/config/entities';
import { getSyncStep } from '@/config/syncOrder';
import { useToast } from '@/composables/useUi';
import { formatDateTime, humanizeKey, relativeTime, displayValue } from '@/utils/format';
import type { ComparisonStatus, EntityKey, PayloadPreviewResponse } from '@/types/integration';
import type { EntityDetail } from '@/types/siakad';
import type { DetailTab } from '@/types/ui';
import { useSyncStore } from '@/stores/sync';
import { usePeriodStore } from '@/stores/period';
import { useConnectionStore } from '@/stores/connection';

/**
 * EntityDetail — halaman detail penuh satu baris data dengan tab:
 * Overview, Data SIAKAD, Data PDDIKTI, Perbandingan, Validasi, Payload,
 * Response, dan History.
 */
const route = useRoute();
const router = useRouter();
const toast = useToast();
const sync = useSyncStore();
const period = usePeriodStore();
const connection = useConnectionStore();

const entity = computed<EntityKey>(() => (route.meta.entity as EntityKey) ?? 'mahasiswa');
const localId = computed(() => String(route.params.id ?? ''));
const definition = computed(() => entityDefinitions[entity.value]);
const step = computed(() => getSyncStep(entity.value));

const detail = ref<EntityDetail | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const tab = ref('overview');
const decisions = ref<Record<string, string>>({});

const payloadOpen = ref(false);
const preview = ref<PayloadPreviewResponse | null>(null);

const label = computed(() => {
    if (!detail.value) return '';
    const local = detail.value.local as Record<string, unknown>;
    return String(local.localLabel ?? local.nama ?? local.namaProdi ?? local.namaMk ?? local.judul ?? local.kode ?? localId.value);
});

const issueCount = computed(() => detail.value?.issues.filter((issue) => issue.severity === 'critical' || issue.severity === 'error').length ?? 0);
const diffCount = computed(() => detail.value?.comparison.filter((row) => row.status === 'DIFFERENT').length ?? 0);

const tabs = computed<DetailTab[]>(() => [
    { key: 'overview', label: 'Overview' },
    { key: 'siakad', label: 'Data SIAKAD' },
    { key: 'pddikti', label: 'Data PDDIKTI' },
    { key: 'comparison', label: 'Perbandingan', count: diffCount.value, tone: 'warning' },
    { key: 'validation', label: 'Validasi', count: issueCount.value, tone: 'danger' },
    { key: 'payload', label: 'Payload' },
    { key: 'response', label: 'Response' },
    { key: 'history', label: 'History', count: detail.value?.history.length ?? 0 },
]);

const comparisonSummary = computed<Record<ComparisonStatus, number> | null>(() => {
    if (!detail.value) return null;
    return {
        MATCH: detail.value.comparison.filter((row) => row.status === 'MATCH').length,
        DIFFERENT: detail.value.comparison.filter((row) => row.status === 'DIFFERENT').length,
        MISSING_LOCAL: detail.value.comparison.filter((row) => row.status === 'MISSING_LOCAL').length,
        MISSING_PDDIKTI: detail.value.comparison.filter((row) => row.status === 'MISSING_PDDIKTI').length,
    };
});

const localEntries = computed(() => {
    if (!detail.value) return [];
    const hidden = ['__comparison', '__issues', '__remote'];
    return Object.entries(detail.value.local)
        .filter(([key]) => !hidden.includes(key))
        .map(([key, value]) => ({ key, label: humanizeKey(key), value }));
});

const lastLog = computed(() => detail.value?.history[0] ?? null);

const load = async (): Promise<void> => {
    loading.value = true;
    error.value = null;
    try {
        detail.value = await SiakadService.detail(entity.value, localId.value);
    } catch (caught) {
        error.value = (caught as Error).message;
        detail.value = null;
    } finally {
        loading.value = false;
    }
};

onMounted(async () => {
    await Promise.all([period.load(), connection.fetch(), sync.loadOrder()]);
    await load();
});

watch([entity, localId], async () => {
    tab.value = 'overview';
    decisions.value = {};
    await load();
});

const openPreview = async (): Promise<void> => {
    const response = await sync.prepare(entity.value, [localId.value]);
    if (!response) {
        toast.error('Gagal menyusun payload', sync.error ? new Error(sync.error) : null);
        return;
    }
    preview.value = response;
    payloadOpen.value = true;
};

const exportPayload = (): void => {
    if (!detail.value?.payload) return;
    ExportService.exportSinglePayload(detail.value.payload);
    toast.success('Payload diekspor', 'Token telah disensor pada berkas hasil ekspor.');
};

const decide = (field: string, decision: string): void => {
    decisions.value = { ...decisions.value, [field]: decision };
};

const pageTitle = computed(() => label.value || `Detail ${definition.value.singular}`);

const pageDescription = computed(
    () => `Detail ${definition.value.singular} pada SIAKAD beserta status integrasi, perbandingan dengan PDDikti, validasi, payload, dan riwayat sinkronisasi.`,
);

const pageHint = computed(() => {
    const idPart = detail.value?.pddiktiId ? ` · ID PDDIKTI ${detail.value.pddiktiId}` : ' · belum memiliki ID PDDIKTI';
    return `ID SIAKAD ${localId.value}${idPart} · urutan sinkronisasi ${step.value?.order ?? '—'}`;
});

</script>

<template>
    <div>
        <PageHeader
            :icon="definition.icon"
            :title="pageTitle"
            :description="pageDescription"
            :hint="pageHint"
        >
            <template #actions>
                <RouterLink :to="`/${definition.route}`" class="btn btn-secondary">
                    <AppIcon name="arrow_left" :size="14" />
                    Daftar {{ definition.label }}
                </RouterLink>
                <button type="button" class="btn btn-secondary" :disabled="loading" @click="load">
                    <AppIcon name="refresh" :size="14" :class="loading ? 'animate-spin' : ''" />
                    Muat ulang
                </button>
                <button type="button" class="btn btn-secondary" :disabled="!detail?.payload" @click="exportPayload">
                    <AppIcon name="download" :size="14" />
                    Unduh payload
                </button>
                <button type="button" class="btn btn-primary" :disabled="!detail || !detail.dependencies.ok" @click="openPreview">
                    <AppIcon name="sync" :size="14" />
                    Pratinjau & sinkronkan
                </button>
            </template>
        </PageHeader>

        <ErrorPanel v-if="error" class="mb-3" title="Gagal memuat detail" :message="error" @retry="load" @dismiss="error = null" />

        <LoadingState v-if="loading && !detail" :rows="8" label="Memuat detail data…" />

        <template v-else-if="detail">
            <div class="mb-3 flex flex-wrap items-center gap-2">
                <StatusBadge :status="detail.dataStatus" size="md" />
                <StatusBadge :status="detail.mappingStatus" kind="mapping" />
                <span v-if="detail.payload" class="badge border-neutral-300 bg-neutral-100 font-mono text-neutral-700">{{ detail.payload.act }}</span>
                <span class="badge border-neutral-300 bg-neutral-100 text-neutral-600">{{ definition.label }}</span>
                <span class="font-mono text-[10.5px] text-neutral-500">local id {{ localId }}</span>
            </div>

            <SectionCard :padded="false">
                <EntityTabs :tabs="tabs" :model-value="tab" @update:model-value="tab = $event">
                    <template #actions>
                        <button type="button" class="btn btn-secondary btn-xs" @click="tab = 'payload'">
                            <AppIcon name="file" :size="12" />
                            Lihat payload
                        </button>
                        <button type="button" class="btn btn-secondary btn-xs" @click="tab = 'history'">
                            <AppIcon name="clock" :size="12" />
                            Riwayat
                        </button>
                    </template>
                </EntityTabs>

                <div class="p-3">
                    <div v-if="tab === 'overview'" class="grid grid-cols-1 gap-3 lg:grid-cols-3">
                        <div class="panel p-3 lg:col-span-2">
                            <h3 class="panel-title mb-2">Ringkasan integrasi</h3>
                            <dl class="grid grid-cols-1 gap-2 md:grid-cols-2">
                                <div class="flex gap-2"><dt class="kv-label w-32 shrink-0">Status data</dt><dd><StatusBadge :status="detail.dataStatus" /></dd></div>
                                <div class="flex gap-2"><dt class="kv-label w-32 shrink-0">Status pemetaan</dt><dd><StatusBadge :status="detail.mappingStatus" kind="mapping" /></dd></div>
                                <div class="flex gap-2"><dt class="kv-label w-32 shrink-0">ID PDDIKTI</dt><dd class="font-mono text-[11.5px]">{{ detail.pddiktiId ?? '—' }}</dd></div>
                                <div class="flex gap-2">
                                    <dt class="kv-label w-32 shrink-0">Sinkron terakhir</dt>
                                    <dd class="text-[12px]">{{ lastLog ? `${formatDateTime(lastLog.createdAt)} (${relativeTime(lastLog.createdAt)})` : 'belum pernah' }}</dd>
                                </div>
                                <div class="flex gap-2"><dt class="kv-label w-32 shrink-0">Act pengiriman</dt><dd class="font-mono text-[11.5px]">{{ detail.payload?.act ?? definition.acts.list }}</dd></div>
                                <div class="flex gap-2"><dt class="kv-label w-32 shrink-0">Aksi payload</dt><dd class="text-[12px]">{{ detail.payload?.action ?? '—' }}</dd></div>
                                <div class="flex gap-2"><dt class="kv-label w-32 shrink-0">Temuan validasi</dt><dd class="text-[12px]">{{ detail.issues.length }} temuan ({{ issueCount }} memblokir)</dd></div>
                                <div class="flex gap-2"><dt class="kv-label w-32 shrink-0">Field berbeda</dt><dd class="text-[12px]">{{ diffCount }} field</dd></div>
                            </dl>

                            <div v-if="comparisonSummary" class="mt-3 flex flex-wrap gap-1.5">
                                <span class="badge border-emerald-200 bg-emerald-50 text-emerald-700">{{ comparisonSummary.MATCH }} field sama</span>
                                <span class="badge border-amber-200 bg-amber-50 text-amber-800">{{ comparisonSummary.DIFFERENT }} berbeda</span>
                                <span v-if="comparisonSummary.MISSING_LOCAL" class="badge border-neutral-300 bg-neutral-100 text-neutral-600">{{ comparisonSummary.MISSING_LOCAL }} kosong di SIAKAD</span>
                                <span v-if="comparisonSummary.MISSING_PDDIKTI" class="badge border-neutral-300 bg-neutral-100 text-neutral-600">{{ comparisonSummary.MISSING_PDDIKTI }} belum ada di PDDikti</span>
                            </div>

                            <p class="mt-3 text-2xs leading-relaxed text-neutral-500">{{ definition.acts.capabilityNote }}</p>
                        </div>

                        <div class="panel p-3">
                            <h3 class="panel-title mb-2">Dependency</h3>
                            <p v-if="detail.dependencies.ok" class="flex items-center gap-1.5 text-[12px] text-emerald-700">
                                <AppIcon name="check" :size="13" />
                                Semua entitas induk sudah memiliki ID PDDikti.
                            </p>
                            <ul v-else class="space-y-1.5">
                                <li v-for="blocker in detail.dependencies.blockers" :key="`${blocker.requirement.field}-${blocker.localId}`" class="flex items-start gap-1.5 text-[12px] text-red-700">
                                    <AppIcon name="alert" :size="13" class="mt-0.5 shrink-0" />
                                    <span>
                                        {{ blocker.reason }}
                                        <span class="block font-mono text-[10.5px] text-red-600">{{ blocker.requirement.field }}</span>
                                    </span>
                                </li>
                            </ul>

                            <div v-if="!detail.dependencies.ok" class="mt-2 border border-amber-200 bg-amber-50 p-2 text-2xs text-amber-900">
                                Perbaiki dependency pada entitas terkait lalu kembali ke halaman ini. Sinkronisasi tidak diizinkan selama dependency belum lengkap.
                            </div>
                        </div>
                    </div>

                    <div v-else-if="tab === 'siakad'" class="table-wrap">
                        <table class="data-table">
                            <thead>
                                <tr><th class="w-64">Field</th><th>Nilai</th></tr>
                            </thead>
                            <tbody>
                                <tr v-for="entry in localEntries" :key="entry.key">
                                    <td>
                                        <span class="font-medium text-neutral-700">{{ entry.label }}</span>
                                        <span class="block font-mono text-[10.5px] text-neutral-400">{{ entry.key }}</span>
                                    </td>
                                    <td>{{ displayValue(entry.value) }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div v-else-if="tab === 'pddikti'">
                        <EmptyState
                            v-if="!detail.remote"
                            compact
                            icon="search"
                            title="Belum ada data di PDDIKTI"
                            message="Data ini belum ditemukan pada hasil Get* Neo Feeder sehingga kemungkinan akan dikirim sebagai data baru."
                        />
                        <JsonBlock v-else :value="detail.remote" label="Record PDDIKTI" />
                    </div>

                    <ComparisonTable v-else-if="tab === 'comparison'" :rows="detail.comparison" show-decision :decisions="decisions" @decide="decide" />

                    <ValidationPanel v-else-if="tab === 'validation'" :issues="detail.issues" title="Temuan validasi" max-height="520px" />

                    <div v-else-if="tab === 'payload'">
                        <EmptyState v-if="!detail.payload" compact icon="file" title="Payload belum dapat dibentuk" message="Entitas ini tidak memiliki act pengiriman (read-only) atau data belum siap dikirim." />
                        <PayloadViewer v-else :item="detail.payload" max-height="520px" />
                    </div>

                    <ResponseViewer
                        v-else-if="tab === 'response'"
                        :response="(lastLog?.response ?? null) as never"
                        :http-status="lastLog?.httpStatus ?? null"
                        :code="lastLog?.neoFeederCode ?? null"
                        :message="lastLog?.neoFeederMessage ?? null"
                        :duration-ms="lastLog?.durationMs ?? null"
                        :attempt="lastLog?.attempt ?? null"
                        :request-id="lastLog?.requestId ?? null"
                        :created-at="lastLog?.createdAt ?? null"
                        :error-category="lastLog?.errorCategory ?? null"
                    />

                    <SyncHistory v-else-if="tab === 'history'" :logs="detail.history" @open="router.push('/logs')" />
                </div>
            </SectionCard>
        </template>

        <EmptyState v-else icon="search" title="Data tidak ditemukan" message="Baris data yang Anda cari tidak tersedia pada entitas ini.">
            <RouterLink :to="`/${definition.route}`" class="btn btn-secondary mt-3">Kembali ke daftar</RouterLink>
        </EmptyState>

        <AppModal :open="payloadOpen" size="xl" title="Pratinjau payload" :subtitle="preview ? `${preview.items.length} data disiapkan` : ''" @close="payloadOpen = false">
            <div v-if="preview" class="space-y-3">
                <div v-if="sync.plan" class="grid grid-cols-2 gap-2 md:grid-cols-4">
                    <div class="border border-neutral-200 bg-white px-2.5 py-2">
                        <p class="kv-label">Siap dikirim</p>
                        <p class="mt-0.5 text-[16px] font-semibold text-neutral-900">{{ sync.plan.willSend + sync.plan.willUpdate }}</p>
                    </div>
                    <div class="border border-neutral-200 bg-white px-2.5 py-2">
                        <p class="kv-label">Invalid</p>
                        <p class="mt-0.5 text-[16px] font-semibold text-red-700">{{ sync.plan.invalid }}</p>
                    </div>
                    <div class="border border-neutral-200 bg-white px-2.5 py-2">
                        <p class="kv-label">Terblokir dependency</p>
                        <p class="mt-0.5 text-[16px] font-semibold text-red-700">{{ sync.plan.blocked }}</p>
                    </div>
                    <div class="border border-neutral-200 bg-white px-2.5 py-2">
                        <p class="kv-label">Mode</p>
                        <p class="mt-0.5 text-[12.5px] font-semibold text-neutral-900">{{ sync.dryRun ? 'DRY RUN' : 'pengiriman nyata' }}</p>
                    </div>
                </div>

                <PayloadViewer v-for="item in preview.items" :key="item.localId" :item="item" max-height="420px" />
            </div>

            <template #footer>
                <button type="button" class="btn btn-secondary" @click="ExportService.exportPayloads(entity, preview?.items ?? []); toast.success('Payload diekspor');">
                    <AppIcon name="download" :size="13" />
                    Unduh payload
                </button>
                <button type="button" class="btn btn-secondary" @click="payloadOpen = false">Tutup</button>
                <RouterLink to="/synchronization/wizard" class="btn btn-primary" @click="payloadOpen = false">
                    <AppIcon name="play" :size="13" />
                    Buka Sync Wizard
                </RouterLink>
            </template>
        </AppModal>
    </div>
</template>
