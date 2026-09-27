<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { EntityDetail } from '@/types/siakad';
import type { ComparisonStatus } from '@/types/integration';
import AppDrawer from './AppDrawer.vue';
import EntityTabs from './EntityTabs.vue';
import type { DetailTab } from '@/types/ui';
import StatusBadge from './StatusBadge.vue';
import JsonBlock from './JsonBlock.vue';
import ComparisonTable from './ComparisonTable.vue';
import ValidationPanel from './ValidationPanel.vue';
import PayloadViewer from './PayloadViewer.vue';
import ResponseViewer from './ResponseViewer.vue';
import SyncHistory from './SyncHistory.vue';
import LoadingState from './LoadingState.vue';
import EmptyState from './EmptyState.vue';
import AppIcon from './AppIcon.vue';
import { entityDefinitions } from '@/config/entities';
import { formatDateTime, humanizeKey, relativeTime, displayValue } from '@/utils/format';
import { buildEnvelope } from '@/services/neofeeder/TransformService';

/**
 * EntityDetailDrawer — panel detail satu baris data dengan tab lengkap:
 * Overview, Data SIAKAD, Data PDDIKTI, Perbandingan, Validasi, Payload,
 * Response, dan History.
 *
 * Dipakai dari daftar entitas agar operator dapat memeriksa data tanpa
 * berpindah halaman (halaman detail penuh tersedia melalui tab Overview → Buka halaman).
 */
const props = withDefaults(
    defineProps<{
        open: boolean;
        detail: EntityDetail | null;
        loading?: boolean;
        decisions?: Record<string, string>;
    }>(),
    { loading: false, decisions: () => ({}) },
);

const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'sync', localId: string): void;
    (e: 'preview', localId: string): void;
    (e: 'openFull', localId: string): void;
    (e: 'openLog', logId: string): void;
    (e: 'decide', field: string, decision: string): void;
}>();

const tab = ref('overview');

watch(
    () => props.detail?.local.localId,
    () => {
        tab.value = 'overview';
    },
);

const definition = computed(() => (props.detail ? entityDefinitions[props.detail.entity] : null));

const issueCount = computed(() => props.detail?.issues.filter((issue) => issue.severity === 'critical' || issue.severity === 'error').length ?? 0);
const diffCount = computed(() => props.detail?.comparison.filter((row) => row.status === 'DIFFERENT').length ?? 0);

const tabs = computed<DetailTab[]>(() => [
    { key: 'overview', label: 'Overview' },
    { key: 'siakad', label: 'Data SIAKAD' },
    { key: 'pddikti', label: 'Data PDDIKTI' },
    { key: 'comparison', label: 'Perbandingan', count: diffCount.value, tone: 'warning' },
    { key: 'validation', label: 'Validasi', count: issueCount.value, tone: 'danger' },
    { key: 'payload', label: 'Payload' },
    { key: 'response', label: 'Response' },
    { key: 'history', label: 'History', count: props.detail?.history.length ?? 0 },
]);

const comparisonSummary = computed<Record<ComparisonStatus, number> | null>(() => {
    if (!props.detail) return null;
    return {
        MATCH: props.detail.comparison.filter((row) => row.status === 'MATCH').length,
        DIFFERENT: props.detail.comparison.filter((row) => row.status === 'DIFFERENT').length,
        MISSING_LOCAL: props.detail.comparison.filter((row) => row.status === 'MISSING_LOCAL').length,
        MISSING_PDDIKTI: props.detail.comparison.filter((row) => row.status === 'MISSING_PDDIKTI').length,
    };
});

const localEntries = computed(() => {
    if (!props.detail) return [];
    const hidden = ['__comparison', '__issues', '__remote', 'comparison', 'issues', 'payload', 'history'];
    return Object.entries(props.detail.local)
        .filter(([key]) => !hidden.includes(key))
        .map(([key, value]) => ({ key, label: humanizeKey(key), value }));
});

const lastLog = computed(() => props.detail?.history[0] ?? null);

/* Handler lokal untuk aksi di template — menghindari pemanggilan emit
   langsung dari template agar pemeriksaan tipe tetap presisi. */
const requestOpenFull = (): void => {
    if (props.detail) emit('openFull', String(props.detail.local.localId));
};

const requestPreview = (): void => {
    if (props.detail) emit('preview', String(props.detail.local.localId));
};

const requestSync = (): void => {
    if (props.detail) emit('sync', String(props.detail.local.localId));
};

const close = (): void => {
    emit('close');
};

const drawerTitle = computed(() => (props.detail ? `${definition.value?.singular ?? 'Data'} · ${label.value}` : 'Detail data'));

const drawerSubtitle = computed(() => {
    if (!props.detail) return '';
    const idPart = props.detail.pddiktiId ? ` · ID PDDIKTI ${props.detail.pddiktiId}` : ' · belum memiliki ID PDDIKTI';
    return `ID SIAKAD ${props.detail.local.localId}${idPart}`;
});

const label = computed(() => {
    if (!props.detail) return '';
    const local = props.detail.local as Record<string, unknown>;
    return String(local.localLabel ?? local.nama ?? local.namaProdi ?? local.judul ?? local.kode ?? props.detail.local.localId);
});
</script>

<template>
    <AppDrawer
        :open="open"
        width="max-w-5xl"
        :title="drawerTitle"
        :subtitle="drawerSubtitle"
        @close="emit('close')"
    >
        <template #header-actions>
            <button v-if="detail" type="button" class="btn btn-secondary btn-xs" @click="requestOpenFull">
                <AppIcon name="external" :size="12" />
                Buka halaman penuh
            </button>
        </template>

        <LoadingState v-if="loading && !detail" :rows="6" label="Memuat detail data…" />
        <EmptyState v-else-if="!detail" compact title="Detail belum tersedia" message="Pilih satu baris data untuk melihat detailnya." />

        <div v-else class="space-y-3">
            <EntityTabs :tabs="tabs" :model-value="tab" @update:model-value="tab = $event">
                <template #actions>
                    <StatusBadge :status="detail.dataStatus" size="md" />
                    <StatusBadge :status="detail.mappingStatus" kind="mapping" />
                    <button type="button" class="btn btn-secondary btn-xs" @click="requestPreview">
                        <AppIcon name="eye" :size="12" />
                        Pratinjau payload
                    </button>
                    <button type="button" class="btn btn-primary btn-xs" :disabled="!detail.dependencies.ok" @click="requestSync">
                        <AppIcon name="sync" :size="12" />
                        Sinkronkan
                    </button>
                </template>
            </EntityTabs>

            <!-- Overview -->
            <div v-if="tab === 'overview'" class="grid grid-cols-1 gap-3 lg:grid-cols-3">
                <div class="panel p-3 lg:col-span-2">
                    <h3 class="panel-title mb-2">Ringkasan</h3>
                    <dl class="grid grid-cols-1 gap-2 md:grid-cols-2">
                        <div class="flex gap-2">
                            <dt class="kv-label w-28 shrink-0">Status data</dt>
                            <dd><StatusBadge :status="detail.dataStatus" /></dd>
                        </div>
                        <div class="flex gap-2">
                            <dt class="kv-label w-28 shrink-0">Status pemetaan</dt>
                            <dd><StatusBadge :status="detail.mappingStatus" kind="mapping" /></dd>
                        </div>
                        <div class="flex gap-2">
                            <dt class="kv-label w-28 shrink-0">ID PDDIKTI</dt>
                            <dd class="font-mono text-[11.5px]">{{ detail.pddiktiId ?? '—' }}</dd>
                        </div>
                        <div class="flex gap-2">
                            <dt class="kv-label w-28 shrink-0">Sinkron terakhir</dt>
                            <dd class="text-[12px]">{{ detail.history[0] ? `${formatDateTime(detail.history[0].createdAt)} (${relativeTime(detail.history[0].createdAt)})` : 'belum pernah' }}</dd>
                        </div>
                        <div class="flex gap-2">
                            <dt class="kv-label w-28 shrink-0">Act pengiriman</dt>
                            <dd class="font-mono text-[11.5px]">{{ detail.payload?.act ?? definition?.acts.list }}</dd>
                        </div>
                        <div class="flex gap-2">
                            <dt class="kv-label w-28 shrink-0">Aksi</dt>
                            <dd class="text-[12px]">{{ detail.payload?.action ?? '—' }}</dd>
                        </div>
                    </dl>

                    <div v-if="comparisonSummary" class="mt-3 flex flex-wrap gap-1.5">
                        <span class="badge border-emerald-200 bg-emerald-50 text-emerald-700">{{ comparisonSummary.MATCH }} field sama</span>
                        <span class="badge border-amber-200 bg-amber-50 text-amber-800">{{ comparisonSummary.DIFFERENT }} berbeda</span>
                        <span v-if="comparisonSummary.MISSING_LOCAL" class="badge border-neutral-300 bg-neutral-100 text-neutral-600">{{ comparisonSummary.MISSING_LOCAL }} kosong di SIAKAD</span>
                        <span v-if="comparisonSummary.MISSING_PDDIKTI" class="badge border-neutral-300 bg-neutral-100 text-neutral-600">{{ comparisonSummary.MISSING_PDDIKTI }} belum ada di PDDikti</span>
                    </div>
                </div>

                <div class="panel p-3">
                    <h3 class="panel-title mb-2">Dependency</h3>
                    <p v-if="detail.dependencies.ok" class="flex items-center gap-1.5 text-[12px] text-emerald-700">
                        <AppIcon name="check" :size="13" />
                        Seluruh entitas induk sudah memiliki ID PDDikti.
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
                </div>
            </div>

            <!-- Data SIAKAD -->
            <div v-else-if="tab === 'siakad'" class="panel">
                <div class="panel-header">
                    <h3 class="panel-title">Data SIAKAD (sumber utama)</h3>
                    <span class="panel-hint">{{ localEntries.length }} field</span>
                </div>
                <div class="table-wrap">
                    <table class="data-table">
                        <thead>
                            <tr><th>Field</th><th>Nilai</th></tr>
                        </thead>
                        <tbody>
                            <tr v-for="entry in localEntries" :key="entry.key">
                                <td class="w-56">
                                    <span class="font-medium text-neutral-700">{{ entry.label }}</span>
                                    <span class="block font-mono text-[10.5px] text-neutral-400">{{ entry.key }}</span>
                                </td>
                                <td>{{ displayValue(entry.value) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Data PDDIKTI -->
            <div v-else-if="tab === 'pddikti'" class="space-y-2">
                <EmptyState
                    v-if="!detail.remote"
                    compact
                    icon="search"
                    title="Belum ada data di PDDIKTI"
                    message="Data ini belum ditemukan pada hasil Get* Neo Feeder. Kemungkinan akan dikirim sebagai data baru (act Insert)."
                />
                <JsonBlock v-else :value="detail.remote" label="Record PDDIKTI" />
            </div>

            <!-- Perbandingan -->
            <ComparisonTable v-else-if="tab === 'comparison'" :rows="detail.comparison" show-decision :decisions="decisions" @decide="emit('decide', $event[0], $event[1])" />

            <!-- Validasi -->
            <ValidationPanel v-else-if="tab === 'validation'" :issues="detail.issues" title="Temuan validasi data ini" max-height="440px" />

            <!-- Payload -->
            <div v-else-if="tab === 'payload'" class="space-y-2">
                <EmptyState v-if="!detail.payload" compact icon="file" title="Payload belum dapat dibentuk" message="Act pengiriman untuk entitas ini tidak tersedia (read-only) atau data belum siap." />
                <PayloadViewer v-else :item="detail.payload" max-height="440px" />
            </div>

            <!-- Response -->
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

            <!-- History -->
            <SyncHistory v-else-if="tab === 'history'" :logs="detail.history" @open="emit('openLog', $event.id)" />
        </div>

        <template #footer>
            <span v-if="detail?.payload" class="mr-auto font-mono text-[10.5px] text-neutral-500">
                envelope: {{ JSON.stringify(buildEnvelope(detail.payload.act, detail.payload.record, {})).slice(0, 90) }}…
            </span>
            <button type="button" class="btn btn-secondary" @click="close">Tutup</button>
        </template>
    </AppDrawer>
</template>
