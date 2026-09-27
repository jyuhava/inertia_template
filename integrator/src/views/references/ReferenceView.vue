<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import PageHeader from '@/components/PageHeader.vue';
import SectionCard from '@/components/SectionCard.vue';
import DataTable from '@/components/DataTable.vue';
import PaginationBar from '@/components/PaginationBar.vue';
import EmptyState from '@/components/EmptyState.vue';
import ErrorPanel from '@/components/ErrorPanel.vue';
import AppIcon from '@/components/AppIcon.vue';
import AppDrawer from '@/components/AppDrawer.vue';
import JsonBlock from '@/components/JsonBlock.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import { useReferenceStore } from '@/stores/reference';
import { getReferenceDefinition, referenceList } from '@/config/references';
import { useClipboard, useDebounce, useToast } from '@/composables/useUi';
import { formatNumber } from '@/utils/format';
import type { ReferenceItem, ReferenceKey } from '@/types/reference';
import { ExportService } from '@/services/ExportService';

/**
 * ReferenceView — daftar isi satu referensi PDDikti.
 * Mendukung pencarian, pagination, penyegaran, penyalinan ID, export, dan
 * pemeriksaan detail (termasuk nilai lokal SIAKAD yang dipetakan).
 */
const route = useRoute();
const store = useReferenceStore();
const toast = useToast();
const { copy } = useClipboard();
const debounce = useDebounce(350);

const key = computed(() => String(route.params.key) as ReferenceKey);
const definition = computed(() => getReferenceDefinition(key.value));
const notFound = computed(() => !referenceList.some((item) => item.key === key.value));

const search = ref('');
const onlyUnmapped = ref(false);
const detail = ref<ReferenceItem | null>(null);
const perPage = ref(25);

const items = computed(() => store.items[key.value] ?? []);
const meta = computed(() => store.meta[key.value] ?? { page: 1, perPage: perPage.value, total: 0, lastPage: 1 });

const filtered = computed(() =>
    items.value.filter((item) => {
        if (onlyUnmapped.value && item.localValue) return false;
        return true;
    }),
);

const columns = [
    { key: 'code', label: 'Kode / ID', mono: true, sortable: true },
    { key: 'name', label: 'Nama referensi', sortable: true },
    { key: 'description', label: 'Keterangan' },
    { key: 'localValue', label: 'Nilai lokal SIAKAD' },
    { key: 'usedBySiakad', label: 'Dipakai SIAKAD', align: 'right' as const },
    { key: 'active', label: 'Aktif', align: 'center' as const },
];

const load = async (page = 1): Promise<void> => {
    await store.loadItems(key.value, { page, perPage: meta.value.perPage, search: search.value || undefined }, true);
};

onMounted(async () => {
    if (notFound.value) return;
    await load(1);
});

watch(key, async () => {
    search.value = '';
    onlyUnmapped.value = false;
    if (!notFound.value) await load(1);
});

const onSearch = (value: string): void => {
    search.value = value;
    debounce.run(() => void load(1));
};

const exportItems = (format: 'csv' | 'json'): void => {
    if (format === 'json') {
        ExportService.exportRowsToJson('perguruan-tinggi', filtered.value as unknown as Record<string, unknown>[]);
        return;
    }
    const csvRows = filtered.value.map((item) => [
        item.code ?? item.id,
        item.name,
        item.description ?? '',
        item.localValue ?? '',
        item.usedBySiakad ?? 0,
        item.active ? 'ya' : 'tidak',
    ]);
    const header = ['kode', 'nama', 'keterangan', 'nilai_lokal_siakad', 'dipakai_siakad', 'aktif'];
    const content = [header.join(','), ...csvRows.map((row) => row.map((cell) => (String(cell).includes(',') ? `"${cell}"` : cell)).join(','))].join('\n');
    const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `referensi-${key.value}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Export selesai', `${filtered.value.length} baris referensi diunduh sebagai CSV.`);
};
</script>

<template>
    <div>
        <PageHeader
            v-if="!notFound"
            icon="book"
            :title="definition?.label ?? 'Referensi'"
            :description="definition?.description"
            :hint="definition?.act ? `Sumber: act ${definition.act}` : 'Referensi statis SIAKAD (tidak ada act khusus pada Web Service).'"
        >
            <template #actions>
                <RouterLink to="/references" class="btn btn-secondary">
                    <AppIcon name="arrow_left" :size="14" />
                    Semua referensi
                </RouterLink>
                <button type="button" class="btn btn-secondary" :disabled="store.loadingKey === key" @click="load(meta.page)">
                    <AppIcon name="refresh" :size="14" :class="store.loadingKey === key ? 'animate-spin' : ''" />
                    Segarkan
                </button>
                <button type="button" class="btn btn-secondary" @click="exportItems('csv')">
                    <AppIcon name="download" :size="14" />
                    Unduh CSV
                </button>
            </template>
        </PageHeader>

        <EmptyState v-if="notFound" icon="alert" title="Referensi tidak dikenal" message="Kunci referensi yang Anda buka tidak terdaftar pada modul integrator.">
            <RouterLink to="/references" class="btn btn-secondary mt-3">Kembali ke daftar referensi</RouterLink>
        </EmptyState>

        <template v-else>
            <ErrorPanel v-if="store.error" class="mb-3" title="Gagal memuat referensi" :message="store.error" @retry="load(1)" @dismiss="store.error = null" />

            <SectionCard :padded="false">
                <div class="flex flex-wrap items-end gap-2 border-b border-neutral-200 px-3 py-2.5">
                    <div class="relative w-72">
                        <AppIcon name="search" :size="14" class="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input class="input pl-7" type="search" placeholder="Cari kode atau nama referensi…" :value="search" @input="onSearch(($event.target as HTMLInputElement).value)" />
                    </div>

                    <label class="flex items-center gap-1.5 text-2xs text-neutral-600">
                        <input v-model="onlyUnmapped" type="checkbox" class="h-3.5 w-3.5" />
                        Hanya nilai lokal yang belum dipetakan
                    </label>

                    <div class="ml-auto flex items-center gap-2">
                        <span class="badge border-neutral-300 bg-neutral-100 text-neutral-600">{{ formatNumber(meta.total) }} referensi</span>
                        <span v-if="definition?.requiredForSync" class="badge border-brand-300 bg-brand-50 text-brand-800">wajib untuk sinkronisasi</span>
                        <span v-if="store.dictionaryVerified[key]" class="badge border-emerald-200 bg-emerald-50 text-emerald-700">dictionary terverifikasi</span>
                        <span v-else class="badge border-amber-200 bg-amber-50 text-amber-800">dictionary belum diverifikasi</span>
                    </div>
                </div>

                <DataTable :columns="columns" :rows="filtered" :loading="store.loadingKey === key" empty-title="Referensi kosong" empty-message="Data referensi belum ditarik dari Neo Feeder. Jalankan sinkronisasi dictionary/data referensi pada halaman Koneksi.">
                    <template #cell-code="{ row }">
                        <span class="font-mono">{{ (row as ReferenceItem).code ?? (row as ReferenceItem).id }}</span>
                        <button type="button" class="ml-1 text-neutral-400 hover:text-neutral-700" :title="`Salin ID ${(row as ReferenceItem).id}`" @click="copy((row as ReferenceItem).id, 'ID referensi')">
                            <AppIcon name="copy" :size="11" />
                        </button>
                    </template>

                    <template #cell-localValue="{ row }">
                        <span v-if="(row as ReferenceItem).localValue" class="badge border-emerald-200 bg-emerald-50 text-emerald-700">{{ (row as ReferenceItem).localValue }}</span>
                        <span v-else class="badge border-amber-200 bg-amber-50 text-amber-800">belum dipetakan</span>
                    </template>

                    <template #cell-active="{ row }">
                        <StatusBadge :status="(row as ReferenceItem).active ? 'SUCCESS' : 'DISCONNECTED'" :show-description="false" />
                    </template>

                    <template #cell-usedBySiakad="{ row }">
                        {{ formatNumber((row as ReferenceItem).usedBySiakad ?? 0) }}
                    </template>

                    <template #actions="{ row }">
                        <button type="button" class="btn btn-ghost btn-xs" @click="detail = row as ReferenceItem">
                            <AppIcon name="eye" :size="12" />
                            Detail
                        </button>
                    </template>
                </DataTable>

                <PaginationBar
                    :page="meta.page"
                    :per-page="perPage"
                    :total="meta.total"
                    :last-page="meta.lastPage"
                    :loading="store.loadingKey === key"
                    @page-change="load"
                    @per-page-change="(size) => { perPage = size; load(1); }"
                />
            </SectionCard>
        </template>

        <AppDrawer :open="detail !== null" :title="detail?.name ?? ''" :subtitle="detail ? `ID PDDikti: ${detail.id}` : ''" width="max-w-xl" @close="detail = null">
            <div v-if="detail" class="space-y-3">
                <dl class="space-y-2">
                    <div class="flex gap-2">
                        <dt class="kv-label w-32 shrink-0">Kode</dt>
                        <dd class="font-mono text-[12px]">{{ detail.code ?? '—' }}</dd>
                    </div>
                    <div class="flex gap-2">
                        <dt class="kv-label w-32 shrink-0">Nilai lokal SIAKAD</dt>
                        <dd>{{ detail.localValue ?? 'belum dipetakan' }}</dd>
                    </div>
                    <div class="flex gap-2">
                        <dt class="kv-label w-32 shrink-0">Dipakai SIAKAD</dt>
                        <dd>{{ formatNumber(detail.usedBySiakad ?? 0) }} baris</dd>
                    </div>
                    <div class="flex gap-2">
                        <dt class="kv-label w-32 shrink-0">Keterangan</dt>
                        <dd class="text-[12px]">{{ detail.description ?? '—' }}</dd>
                    </div>
                </dl>

                <JsonBlock :value="{ id: detail.id, code: detail.code ?? null, name: detail.name, extra: detail.extra ?? null }" label="Record referensi (siap dipakai pada payload)" />
                <button type="button" class="btn btn-secondary" @click="copy(JSON.stringify({ id: detail.id, name: detail.name }), 'Record referensi')">
                    <AppIcon name="copy" :size="13" />
                    Salin record
                </button>
            </div>
        </AppDrawer>
    </div>
</template>
