<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import PageHeader from '@/components/PageHeader.vue';
import SectionCard from '@/components/SectionCard.vue';
import EmptyState from '@/components/EmptyState.vue';
import LoadingState from '@/components/LoadingState.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import AppIcon from '@/components/AppIcon.vue';
import ErrorPanel from '@/components/ErrorPanel.vue';
import { useReferenceStore } from '@/stores/reference';
import { referenceGroupLabels, referenceList } from '@/config/references';
import type { ReferenceDefinition } from '@/types/reference';
import { formatDateTime, formatNumber, relativeTime } from '@/utils/format';

/**
 * ReferenceList — katalog referensi PDDikti.
 * Menandai referensi wajib dan berapa nilai lokal SIAKAD yang belum dipetakan.
 */
const store = useReferenceStore();
const search = ref('');

const groups = computed(() => {
    const order: ReferenceDefinition['group'][] = ['institusi', 'akademik', 'mahasiswa', 'dosen', 'kegiatan', 'wilayah'];
    return order.map((group) => ({
        key: group,
        label: referenceGroupLabels[group],
        items: referenceList
            .filter((item) => item.group === group)
            .filter((item) => !search.value || item.label.toLowerCase().includes(search.value.toLowerCase()) || item.key.includes(search.value.toLowerCase()))
            .map((item) => {
                const summary = store.summaries.find((entry) => entry.key === item.key);
                return {
                    definition: item,
                    total: summary?.total ?? 0,
                    usedBySiakad: summary?.usedBySiakad ?? 0,
                    unmapped: summary?.unmappedLocalValues ?? 0,
                    act: summary?.act ?? item.act,
                    lastFetchedAt: summary?.lastFetchedAt ?? null,
                };
            }),
    }));
});

const requiredUnmapped = computed(() => store.summaries.filter((item) => item.unmappedLocalValues > 0).length);

onMounted(() => {
    void store.loadSummary(true);
});
</script>

<template>
    <div>
        <PageHeader
            icon="book"
            title="Referensi PDDikti"
            description="Referensi resmi Neo Feeder (agama, jalur masuk, jenis keluar, skala nilai, wilayah, dan lainnya). Referensi bersifat read-only dari PDDikti — yang dikelola operator adalah pemetaan nilai SIAKAD ke id referensi."
            hint="Referensi wajib harus lengkap sebelum sinkronisasi entitas terkait dijalankan."
        >
            <template #actions>
                <div class="relative w-64">
                    <AppIcon name="search" :size="14" class="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input v-model="search" type="search" class="input pl-7" placeholder="Cari referensi…" />
                </div>
                <button type="button" class="btn btn-secondary" :disabled="store.loading" @click="store.loadSummary(true)">
                    <AppIcon name="refresh" :size="14" :class="store.loading ? 'animate-spin' : ''" />
                    Muat ulang
                </button>
            </template>
        </PageHeader>

        <ErrorPanel v-if="store.error" class="mb-3" title="Gagal memuat referensi" :message="store.error" @retry="store.loadSummary(true)" @dismiss="store.error = null" />

        <div v-if="requiredUnmapped > 0" class="mb-3 border border-amber-200 bg-amber-50 p-3">
            <p class="flex items-center gap-1.5 text-[12.5px] font-semibold text-amber-900">
                <AppIcon name="alert" :size="14" />
                {{ requiredUnmapped }} referensi masih memiliki nilai lokal SIAKAD yang belum dipetakan
            </p>
            <p class="mt-1 text-2xs text-amber-900">
                Nilai yang belum dipetakan menyebabkan validasi gagal pada entitas terkait (mis. jenis pendaftaran, jalur masuk, pembiayaan, skala nilai). Buka referensi tersebut untuk
                memeriksa nilai mana yang belum memiliki padanan PDDikti.
            </p>
        </div>

        <LoadingState v-if="store.loading && store.summaries.length === 0" :rows="8" label="Memuat referensi PDDikti…" />

        <div v-else class="space-y-3">
            <SectionCard v-for="group in groups" :key="group.key" :title="group.label" :hint="`${group.items.length} referensi`" :padded="false">
                <EmptyState v-if="group.items.length === 0" compact icon="search" title="Tidak ada referensi" message="Tidak ada referensi yang cocok dengan pencarian Anda." />

                <div v-else class="grid grid-cols-1 divide-y divide-neutral-100 md:grid-cols-2 md:divide-y-0">
                    <RouterLink
                        v-for="item in group.items"
                        :key="item.definition.key"
                        :to="`/references/${item.definition.key}`"
                        class="flex items-start gap-3 border-neutral-100 px-3 py-2.5 hover:bg-brand-50/50 md:border-b"
                    >
                        <div class="min-w-0 flex-1">
                            <div class="flex flex-wrap items-center gap-2">
                                <span class="text-[12.5px] font-semibold text-neutral-800">{{ item.definition.label }}</span>
                                <span v-if="item.definition.requiredForSync" class="badge border-brand-300 bg-brand-50 text-brand-800">wajib</span>
                                <span v-if="item.definition.requiresProdi" class="badge border-neutral-300 bg-neutral-100 text-neutral-600">per prodi</span>
                                <span v-if="!item.act" class="badge border-sky-200 bg-sky-50 text-sky-700">statis SIAKAD</span>
                            </div>
                            <p class="mt-0.5 text-2xs leading-relaxed text-neutral-500">{{ item.definition.description }}</p>
                            <p class="mt-1 font-mono text-[10.5px] text-neutral-400">{{ item.act || 'tanpa act Neo Feeder' }}</p>
                        </div>

                        <div class="shrink-0 text-right">
                            <p class="text-[13px] font-semibold text-neutral-800">{{ formatNumber(item.total) }}</p>
                            <p class="text-2xs text-neutral-500">item</p>
                            <p v-if="item.unmapped > 0" class="mt-1 badge border-amber-200 bg-amber-50 text-amber-800">{{ item.unmapped }} belum dipetakan</p>
                            <p v-else class="mt-1 badge border-emerald-200 bg-emerald-50 text-emerald-700">lengkap</p>
                        </div>
                    </RouterLink>
                </div>

                <template #footer>
                    <div class="flex flex-wrap items-center gap-3 text-2xs text-neutral-500">
                        <span v-if="group.items[0]?.lastFetchedAt">Data referensi terakhir diperbarui {{ relativeTime(group.items[0]?.lastFetchedAt) }}</span>
                        <span v-else>Data referensi belum pernah ditarik dari Neo Feeder.</span>
                        <span class="ml-auto">Terakhir sinkron dictionary: {{ formatDateTime(store.summaries[0]?.lastFetchedAt ?? null) }}</span>
                    </div>
                </template>
            </SectionCard>
        </div>
    </div>
</template>
