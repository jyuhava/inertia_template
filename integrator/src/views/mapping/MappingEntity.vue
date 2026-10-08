<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import PageHeader from '@/components/PageHeader.vue';
import SectionCard from '@/components/SectionCard.vue';
import MappingTable from '@/components/MappingTable.vue';
import PaginationBar from '@/components/PaginationBar.vue';
import StatCard from '@/components/StatCard.vue';
import EmptyState from '@/components/EmptyState.vue';
import ErrorPanel from '@/components/ErrorPanel.vue';
import AppIcon from '@/components/AppIcon.vue';
import { useMappingStore } from '@/stores/mapping';
import { entityDefinitions } from '@/config/entities';
import { mappingStatusMeta } from '@/utils/status';
import { formatNumber } from '@/utils/format';
import type { EntityKey } from '@/types/integration';

/**
 * MappingEntity — kelola pemetaan satu entitas:
 * filter status/pencarian, pencocokan otomatis, pemetaan manual per baris,
 * dan pelepasan pemetaan secara massal.
 */
const route = useRoute();
const mapping = useMappingStore();

const entity = computed(() => String(route.params.entity) as EntityKey);
const definition = computed(() => entityDefinitions[entity.value]);

const search = ref('');
const statusFilter = ref('');
const selected = ref<string[]>([]);

const stats = computed(() => mapping.summary.find((item) => item.entity === entity.value) ?? null);

const load = async (page = 1): Promise<void> => {
    if (!definition.value) return;
    await mapping.loadRecords(entity.value, { page, perPage: mapping.meta.perPage, search: search.value || undefined, mappingStatus: statusFilter.value || undefined });
};

onMounted(async () => {
    await mapping.loadSummary();
    await load(1);
});

watch(entity, async () => {
    search.value = '';
    statusFilter.value = '';
    selected.value = [];
    mapping.records = [];
    await load(1);
});

const onSelect = (ids: string[]): void => {
    selected.value = ids;
};

const statusOptions = computed(() => Object.entries(mappingStatusMeta).map(([value, meta]) => ({ value, label: meta.label })));

const pageDescription = computed(() =>
    definition.value
        ? `Petakan ${definition.value.label} SIAKAD ke ID PDDikti. Pemetaan dipakai sebagai referensi id pada payload (mis. ${definition.value.mappingIdentityField}).`
        : '',
);

</script>

<template>
    <div>
        <PageHeader
            v-if="definition"
            :icon="definition.icon"
            :title="`Pemetaan ${definition.label}`"
            :description="pageDescription"
            :hint="definition.acts.capabilityNote"
        >
            <template #actions>
                <RouterLink to="/mapping" class="btn btn-secondary">
                    <AppIcon name="arrow_left" :size="14" />
                    Mapping Center
                </RouterLink>
                <button type="button" class="btn btn-secondary" :disabled="mapping.loading" @click="load(mapping.meta.page)">
                    <AppIcon name="refresh" :size="14" :class="mapping.loading ? 'animate-spin' : ''" />
                    Segarkan
                </button>
                <RouterLink :to="`/${definition.route}`" class="btn btn-primary">
                    <AppIcon name="external" :size="14" />
                    Lihat data
                </RouterLink>
            </template>
        </PageHeader>

        <EmptyState v-else icon="alert" title="Entitas tidak dikenal" message="Entitas yang Anda buka tidak terdaftar pada modul integrator.">
            <RouterLink to="/mapping" class="btn btn-secondary mt-3">Kembali ke Mapping Center</RouterLink>
        </EmptyState>

        <template v-if="definition">
            <ErrorPanel v-if="mapping.error" class="mb-3" title="Gagal memuat data pemetaan" :message="mapping.error" @retry="load(1)" @dismiss="mapping.error = null" />

            <div v-if="stats" class="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard label="Total data" :value="stats.total" tone="info" hint="Baris SIAKAD pada entitas ini" />
                <StatCard label="Terpetakan" :value="stats.mapped" tone="success" :hint="`${stats.progress}% selesai`" />
                <StatCard label="Belum dipetakan" :value="stats.unmapped" tone="warning" hint="Perlu dicocokkan atau dipetakan manual" />
                <StatCard label="Konflik / tidak valid" :value="stats.conflict + stats.invalid" tone="danger" hint="Perlu keputusan operator" />
            </div>

            <SectionCard :padded="false">
                <div class="flex flex-wrap items-end gap-2 border-b border-neutral-200 px-3 py-2.5">
                    <div class="relative w-72">
                        <AppIcon name="search" :size="14" class="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input
                            class="input pl-7"
                            type="search"
                            placeholder="Cari kode, nama, atau identitas…"
                            :value="search"
                            @input="search = ($event.target as HTMLInputElement).value; load(1)"
                        />
                    </div>

                    <label class="w-44">
                        <span class="label">Status pemetaan</span>
                        <select class="select" :value="statusFilter" @change="statusFilter = ($event.target as HTMLSelectElement).value; load(1); selected = []">
                            <option value="">Semua status</option>
                            <option v-for="option in statusOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                        </select>
                    </label>

                    <button type="button" class="btn btn-secondary" @click="mapping.runAutoMap(entity, 'code')" :disabled="mapping.autoMapping">
                        <AppIcon name="sparkles" :size="14" />
                        Cocokkan otomatis (kode)
                    </button>

                    <span class="ml-auto badge border-neutral-300 bg-neutral-100 text-neutral-600">{{ formatNumber(mapping.meta.total) }} baris</span>
                </div>

                <MappingTable
                    :entity="entity"
                    :records="mapping.records"
                    :loading="mapping.loading"
                    selectable
                    :selected="selected"
                    @update:selected="onSelect"
                    @mapped="load(mapping.meta.page)"
                    @unmapped="load(mapping.meta.page)"
                />

                <PaginationBar
                    :page="mapping.meta.page"
                    :per-page="mapping.meta.perPage"
                    :total="mapping.meta.total"
                    :last-page="mapping.meta.lastPage"
                    :loading="mapping.loading"
                    @page-change="load"
                    @per-page-change="(size) => { mapping.meta.perPage = size; load(1); }"
                />
            </SectionCard>

            <p class="mt-3 text-2xs text-neutral-500">
                Pemetaan disimpan pada backend (tabel pemetaan PDDikti: <span class="font-mono">pddikti_mahasiswa_mappings</span>, <span class="font-mono">pddikti_dosen_mappings</span>,
                <span class="font-mono">pddikti_akademik_mappings</span>). Perbedaan nama antara SIAKAD dan PDDikti tidak pernah ditimpa otomatis — perbedaan tersebut tampil sebagai konflik pada
                halaman Perbandingan.
            </p>
        </template>
    </div>
</template>
