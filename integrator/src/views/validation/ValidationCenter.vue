<script setup lang="ts">
import { computed, onMounted } from 'vue';
import PageHeader from '@/components/PageHeader.vue';
import SectionCard from '@/components/SectionCard.vue';
import StatCard from '@/components/StatCard.vue';
import DataTable from '@/components/DataTable.vue';
import PaginationBar from '@/components/PaginationBar.vue';
import ValidationPanel from '@/components/ValidationPanel.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import EmptyState from '@/components/EmptyState.vue';
import ErrorPanel from '@/components/ErrorPanel.vue';
import AppIcon from '@/components/AppIcon.vue';
import { useValidationStore } from '@/stores/validation';
import { useEntityTable } from '@/composables/useEntityTable';
import { entityDefinitions, entityList } from '@/config/entities';
import { formatNumber } from '@/utils/format';
import { useRouter } from 'vue-router';
import type { ValidationIssue } from '@/types/integration';

/**
 * Validation Center — rekapitulasi temuan validasi seluruh entitas:
 * total error, warning, valid, dan konflik beserta filter entity/severity.
 */
const validation = useValidationStore();
const router = useRouter();
const table = useEntityTable('mahasiswa'); // hanya dipakai untuk util filter/ekspor ringan

const severityFilters = computed(() => validation.severityFilterOptions);

const entityOptions = computed(() => entityList.map((definition) => ({ value: definition.key, label: definition.label })));

const summaryRows = computed(() => validation.summaries.map((summary) => ({ ...summary, label: entityDefinitions[summary.entity].label })));

const columns = [
    { key: 'label', label: 'Entitas' },
    { key: 'total', label: 'Total data', align: 'right' as const },
    { key: 'valid', label: 'Lolos', align: 'right' as const },
    { key: 'critical', label: 'Critical', align: 'right' as const },
    { key: 'error', label: 'Error', align: 'right' as const },
    { key: 'warning', label: 'Warning', align: 'right' as const },
    { key: 'info', label: 'Info', align: 'right' as const },
];

const issueColumns = [
    { key: 'severity', label: 'Tingkat', align: 'center' as const },
    { key: 'code', label: 'Kode', mono: true },
    { key: 'message', label: 'Temuan' },
    { key: 'localLabel', label: 'Data' },
    { key: 'entity', label: 'Entitas' },
];

onMounted(async () => {
    await Promise.all([validation.loadSummary(), validation.loadIssues({ page: 1 })]);
});

const openEntity = (issue: ValidationIssue): void => {
    const definition = entityDefinitions[issue.entity];
    void router.push(`/${definition.route}/${issue.localId}`);
};

const loadPage = (page: number): void => {
    void validation.loadIssues({ page });
};
</script>

<template>
    <div>
        <PageHeader
            icon="shield"
            title="Validation Center"
            description="Semua temuan validasi dari aturan Neo Feeder: field wajib, format identitas, kelengkapan pemetaan, dan dependency antar entitas. Data dengan temuan critical/error tidak akan dikirim."
            hint="Perbaikan dilakukan pada data SIAKAD, bukan pada payload."
        >
            <template #actions>
                <button type="button" class="btn btn-secondary" :disabled="validation.loading" @click="validation.loadSummary(); validation.loadIssues({ page: 1 })">
                    <AppIcon name="refresh" :size="14" :class="validation.loading ? 'animate-spin' : ''" />
                    Muat ulang
                </button>
                <RouterLink to="/synchronization/wizard" class="btn btn-primary">
                    <AppIcon name="play" :size="14" />
                    Lanjut ke Sync Wizard
                </RouterLink>
            </template>
        </PageHeader>

        <ErrorPanel v-if="validation.error" class="mb-3" title="Gagal memuat data validasi" :message="validation.error" @retry="validation.loadSummary" @dismiss="validation.error = null" />

        <div class="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Total error" :value="validation.totals.critical + validation.totals.error" tone="danger" hint="Critical + error yang memblokir pengiriman" icon="alert" />
            <StatCard label="Total warning" :value="validation.totals.warning" tone="warning" hint="Dapat dikirim tetapi berisiko" icon="info" />
            <StatCard label="Data lolos" :value="validation.totals.valid" tone="success" hint="Tidak memiliki temuan blocking" icon="check" />
            <StatCard label="Konflik data" :value="validation.totals.conflict" tone="accent" hint="Perbedaan identitas dengan PDDikti" icon="sync" />
        </div>

        <div class="grid grid-cols-1 gap-3 xl:grid-cols-3">
            <SectionCard class="xl:col-span-2" title="Rekap per entitas" hint="Urutan prioritas perbaikan berdasarkan jumlah temuan blocking" :padded="false">
                <DataTable :columns="columns" :rows="summaryRows" :loading="validation.loading" empty-title="Tidak ada entitas" empty-message="Belum ada data entitas untuk divalidasi.">
                    <template #cell-label="{ row }">
                        <RouterLink :to="`/mapping/${(row as Record<string, unknown>).entity}`" class="font-medium text-neutral-800 hover:underline">
                            {{ (row as Record<string, unknown>).label }}
                        </RouterLink>
                    </template>
                    <template #cell-critical="{ row }">
                        <span :class="Number((row as Record<string, unknown>).critical) > 0 ? 'font-semibold text-red-700' : 'text-neutral-400'">
                            {{ formatNumber(Number((row as Record<string, unknown>).critical)) }}
                        </span>
                    </template>
                    <template #cell-error="{ row }">
                        <span :class="Number((row as Record<string, unknown>).error) > 0 ? 'font-semibold text-red-700' : 'text-neutral-400'">
                            {{ formatNumber(Number((row as Record<string, unknown>).error)) }}
                        </span>
                    </template>
                    <template #cell-warning="{ row }">
                        <span :class="Number((row as Record<string, unknown>).warning) > 0 ? 'font-semibold text-amber-700' : 'text-neutral-400'">
                            {{ formatNumber(Number((row as Record<string, unknown>).warning)) }}
                        </span>
                    </template>
                </DataTable>
            </SectionCard>

            <SectionCard title="Temuan yang paling sering muncul" hint="Pengelompokan berdasarkan kode aturan" :padded="false">
                <EmptyState v-if="validation.grouped.length === 0" compact icon="check" title="Tidak ada temuan" message="Seluruh data memenuhi aturan validasi." />
                <ul v-else class="divide-y divide-neutral-100">
                    <li v-for="item in validation.grouped" :key="item.code" class="px-3 py-2">
                        <div class="flex items-start gap-2">
                            <StatusBadge :status="item.severity" kind="severity" :show-description="false" />
                            <span class="min-w-0 flex-1 text-[12px] text-neutral-700">{{ item.message }}</span>
                            <span class="font-mono text-[11px] text-neutral-500">{{ item.count }}×</span>
                        </div>
                        <p class="mt-0.5 font-mono text-[10.5px] text-neutral-400">{{ item.code }} · {{ entityDefinitions[item.entity].label }}</p>
                    </li>
                </ul>
            </SectionCard>
        </div>

        <SectionCard class="mt-3" title="Daftar temuan" hint="Filter berdasarkan entitas dan tingkat keparahan" :padded="false">
            <div class="flex flex-wrap items-end gap-2 border-b border-neutral-200 px-3 py-2.5">
                <label class="w-56">
                    <span class="label">Entitas</span>
                    <select class="select" :value="validation.filters.entity" @change="validation.applyFilters({ entity: ($event.target as HTMLSelectElement).value as never })">
                        <option value="">Semua entitas</option>
                        <option v-for="option in entityOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                    </select>
                </label>

                <label class="w-44">
                    <span class="label">Tingkat</span>
                    <select class="select" :value="validation.filters.severity" @change="validation.applyFilters({ severity: ($event.target as HTMLSelectElement).value as never })">
                        <option v-for="option in severityFilters" :key="option.value" :value="option.value">{{ option.label }}</option>
                    </select>
                </label>

                <label class="min-w-[220px] flex-1">
                    <span class="label">Pencarian</span>
                    <input class="input" type="search" placeholder="Cari pesan, kode, atau label data…" :value="validation.filters.search" @input="validation.applyFilters({ search: ($event.target as HTMLInputElement).value })" />
                </label>

                <button type="button" class="btn btn-secondary" @click="validation.resetFilters()">
                    <AppIcon name="x" :size="13" />
                    Reset
                </button>

                <span class="ml-auto badge border-neutral-300 bg-neutral-100 text-neutral-600">{{ formatNumber(validation.meta.total) }} temuan</span>
            </div>

            <DataTable
                :columns="issueColumns"
                :rows="validation.sortedIssues"
                :loading="validation.loading"
                clickable-rows
                empty-title="Tidak ada temuan"
                empty-message="Tidak ada temuan validasi yang cocok dengan filter saat ini."
                @row-click="openEntity($event as ValidationIssue)"
            >
                <template #cell-severity="{ row }">
                    <StatusBadge :status="(row as ValidationIssue).severity" kind="severity" />
                </template>
                <template #cell-entity="{ row }">
                    <span class="text-2xs text-neutral-600">{{ entityDefinitions[(row as ValidationIssue).entity].label }}</span>
                </template>
                <template #cell-localLabel="{ row }">
                    <span class="text-[12px] text-neutral-700">{{ (row as ValidationIssue).localLabel }}</span>
                </template>
            </DataTable>

            <PaginationBar
                :page="validation.meta.page"
                :per-page="validation.meta.perPage"
                :total="validation.meta.total"
                :last-page="validation.meta.lastPage"
                :loading="validation.loading"
                @page-change="loadPage"
                @per-page-change="(size) => { validation.meta.perPage = size; loadPage(1); }"
            />
        </SectionCard>

        <SectionCard class="mt-3" title="Ringkasan temuan terpilih" hint="Klik baris pada daftar di atas untuk membuka data terkait" :padded="false">
            <ValidationPanel :issues="validation.sortedIssues.slice(0, 6)" title="6 temuan teratas" group-by-code max-height="240px" />
        </SectionCard>
    </div>
</template>
