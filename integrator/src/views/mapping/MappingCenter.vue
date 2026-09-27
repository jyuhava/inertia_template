<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import PageHeader from '@/components/PageHeader.vue';
import SectionCard from '@/components/SectionCard.vue';
import StatCard from '@/components/StatCard.vue';
import EmptyState from '@/components/EmptyState.vue';
import ErrorPanel from '@/components/ErrorPanel.vue';
import AppIcon from '@/components/AppIcon.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { useMappingStore } from '@/stores/mapping';
import { MappingService } from '@/services/MappingService';
import { entityDefinitions, entityList } from '@/config/entities';
import { useToast } from '@/composables/useUi';
import { formatNumber } from '@/utils/format';
import type { EntityKey } from '@/types/integration';
import type { AutoMapResult } from '@/types/mapping';

/**
 * Mapping Center — dashboard pemetaan seluruh entitas.
 *
 * Menampilkan progres pemetaan per entitas (prodi, dosen, mahasiswa, mata
 * kuliah, kurikulum, semester, kelas) serta menjalankan pencocokan otomatis.
 */
const mapping = useMappingStore();
const router = useRouter();
const toast = useToast();

const autoMapOpen = ref(false);
const autoMapEntity = ref<EntityKey | null>(null);
const autoMapMode = ref<'code' | 'name' | 'identity'>('code');
const autoMapResult = ref<AutoMapResult | null>(null);
const confirmed = ref(false);

const stats = computed(() => mapping.summary);

const mappedEntities = computed(() => stats.value.filter((item) => item.total > 0));

const requiredEntities = computed(() => mappedEntities.value.filter((item) => item.required));

const blocking = computed(() => requiredEntities.value.filter((item) => item.unmapped + item.conflict > 0));

const totalProgress = computed(() => mapping.overallProgress);

onMounted(() => {
    void mapping.loadSummary(true);
});

const openAutoMap = (entity: EntityKey): void => {
    autoMapEntity.value = entity;
    autoMapResult.value = null;
    confirmed.value = false;
    autoMapOpen.value = true;
};

const runAutoMap = async (): Promise<void> => {
    if (!autoMapEntity.value) return;
    const result = await mapping.runAutoMap(autoMapEntity.value, autoMapMode.value);
    if (!result) {
        toast.error('Pencocokan otomatis gagal', mapping.error ? new Error(mapping.error) : null);
        return;
    }
    autoMapResult.value = result;
    toast.success('Pencocokan otomatis selesai', MappingService.summarizeAutoMap(result).detail);
    confirmed.value = false;
};

const runAutoMapAll = async (): Promise<void> => {
    const targets = requiredEntities.value.filter((item) => item.unmapped > 0);
    let matched = 0;
    let conflicts = 0;

    for (const item of targets) {
        const result = await mapping.runAutoMap(item.entity, 'code');
        matched += result?.matched ?? 0;
        conflicts += result?.conflicts ?? 0;
    }

    toast.info('Pencocokan otomatis entitas wajib selesai', `${matched} berhasil dipetakan, ${conflicts} konflik perlu keputusan operator.`);
};

const openMappingPage = (entity: EntityKey): void => {
    void router.push(`/mapping/${entity}`);
};

const autoMapMessage = computed(() => {
    if (!autoMapEntity.value) return '';
    const strategy = autoMapMode.value === 'code' ? 'kode' : autoMapMode.value === 'name' ? 'nama' : 'identitas';
    return `Sistem akan mencocokkan ${entityDefinitions[autoMapEntity.value].label} SIAKAD dengan data PDDikti berdasarkan ${strategy}. Data yang tidak meyakinkan tidak akan dipetakan.`;
});
</script>

<template>
    <div>
        <PageHeader
            icon="map"
            title="Mapping Center"
            description="Pusat pemetaan data SIAKAD ke ID PDDikti. Pemetaan bersifat persisten di backend dan menjadi prasyarat pengiriman data."
            hint="Entitas wajib harus selesai dipetakan sebelum sinkronisasi entitas akademik dijalankan."
            :tone="blocking.length > 0 ? 'warning' : 'neutral'"
        >
            <template #actions>
                <button type="button" class="btn btn-secondary" :disabled="mapping.autoMapping" @click="runAutoMapAll">
                    <AppIcon name="sparkles" :size="14" />
                    Cocokkan otomatis entitas wajib
                </button>
                <button type="button" class="btn btn-primary" :disabled="mapping.loading" @click="mapping.loadSummary(true)">
                    <AppIcon name="refresh" :size="14" :class="mapping.loading ? 'animate-spin' : ''" />
                    Muat ulang
                </button>
            </template>
        </PageHeader>

        <ErrorPanel v-if="mapping.error" class="mb-3" title="Gagal memuat statistik pemetaan" :message="mapping.error" @retry="mapping.loadSummary(true)" @dismiss="mapping.error = null" />

        <div class="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Total data SIAKAD" :value="mapping.totalRecords" tone="info" hint="Baris pada seluruh entitas yang dipetakan" icon="activity" />
            <StatCard label="Sudah dipetakan" :value="mapping.totalMapped" tone="success" hint="Memiliki ID PDDikti" icon="check" />
            <StatCard label="Belum dipetakan" :value="mapping.totalUnmapped" tone="warning" hint="Perlu tindakan operator" icon="alert" />
            <StatCard label="Progres keseluruhan" :value="`${totalProgress}%`" tone="accent" hint="Persentase baris yang sudah dipetakan" icon="map" />
        </div>

        <div v-if="blocking.length > 0" class="mb-4 border border-amber-200 bg-amber-50 p-3">
            <p class="flex items-center gap-1.5 text-[12.5px] font-semibold text-amber-900">
                <AppIcon name="alert" :size="14" />
                Sinkronisasi terblokir: {{ blocking.map((item) => item.label).join(', ') }} belum lengkap dipetakan
            </p>
            <p class="mt-1 text-2xs text-amber-900">
                Data turunan memerlukan ID PDDikti dari entitas induk. Selesaikan pemetaan entitas tersebut terlebih dahulu.
            </p>
        </div>

        <div class="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
            <SectionCard v-for="item in mappedEntities" :key="item.entity" :title="item.label" :hint="item.required ? 'Entitas wajib' : 'Entitas pendukung'">
                <template #actions>
                    <StatusBadge
                        :status="item.mapped === item.total ? 'MAPPED' : item.mapped === 0 ? 'UNMAPPED' : 'SYNC_REQUIRED'"
                        kind="mapping"
                        :show-description="false"
                    />
                </template>

                <div class="flex items-end justify-between">
                    <div>
                        <p class="text-[24px] font-semibold leading-none text-neutral-900">{{ formatNumber(item.mapped) }}<span class="text-[14px] text-neutral-400">/{{ formatNumber(item.total) }}</span></p>
                        <p class="mt-1 text-2xs text-neutral-500">terpetakan ke PDDikti</p>
                    </div>
                    <div class="text-right text-2xs">
                        <p v-if="item.unmapped > 0" class="text-amber-700">{{ formatNumber(item.unmapped) }} belum dipetakan</p>
                        <p v-if="item.conflict > 0" class="text-red-700">{{ formatNumber(item.conflict) }} konflik</p>
                        <p v-if="item.invalid > 0" class="text-red-700">{{ formatNumber(item.invalid) }} tidak valid</p>
                    </div>
                </div>

                <div class="mt-2 h-2 w-full border border-neutral-200 bg-neutral-100">
                    <div class="h-full transition-all" :class="item.progress === 100 ? 'bg-emerald-600' : 'bg-neutral-900'" :style="{ width: `${item.progress}%` }" />
                </div>
                <p class="mt-1 text-2xs text-neutral-500">{{ item.progress }}% selesai</p>

                <div class="mt-3 flex flex-wrap gap-1.5">
                    <button type="button" class="btn btn-secondary btn-xs" @click="openMappingPage(item.entity)">
                        <AppIcon name="map" :size="12" />
                        Kelola pemetaan
                    </button>
                    <button type="button" class="btn btn-secondary btn-xs" :disabled="mapping.autoMapping" @click="openAutoMap(item.entity)">
                        <AppIcon name="sparkles" :size="12" />
                        Cocokkan otomatis
                    </button>
                    <RouterLink :to="`/${entityDefinitions[item.entity].route}`" class="btn btn-ghost btn-xs">
                        Lihat data
                        <AppIcon name="chevron" :size="12" />
                    </RouterLink>
                </div>
            </SectionCard>
        </div>

        <EmptyState
            v-if="mappedEntities.length === 0 && !mapping.loading"
            icon="map"
            title="Belum ada statistik pemetaan"
            message="Statistik akan muncul setelah backend mengirimkan ringkasan pemetaan. Pastikan koneksi dan sesi operator aktif."
        />

        <SectionCard class="mt-3" title="Entitas lain" hint="Entitas yang tidak memerlukan pemetaan manual atau bersifat referensi" :padded="false">
            <div class="grid grid-cols-1 divide-y divide-neutral-100 md:grid-cols-3 md:divide-y-0">
                <RouterLink
                    v-for="definition in entityList.filter((item) => !mappedEntities.some((stat) => stat.entity === item.key))"
                    :key="definition.key"
                    :to="`/mapping/${definition.key}`"
                    class="flex items-start gap-2 px-3 py-2 hover:bg-brand-50/50"
                >
                    <AppIcon :name="definition.icon" :size="14" class="mt-0.5 text-neutral-400" />
                    <span>
                        <span class="block text-[12.5px] font-medium text-neutral-800">{{ definition.label }}</span>
                        <span class="block text-2xs text-neutral-500">{{ definition.acts.syncCapability === 'read-only' ? 'Hanya dibaca / dipetakan' : definition.acts.capabilityNote }}</span>
                    </span>
                </RouterLink>
            </div>
        </SectionCard>

        <ConfirmDialog
            :open="autoMapOpen"
            title="Pencocokan otomatis"
            :message="autoMapMessage"
            confirm-label="Jalankan pencocokan"
            :loading="mapping.autoMapping"
            :require-checkbox="!autoMapResult"
            checkbox-label="Saya memahami hasil pencocokan otomatis perlu ditinjau untuk data bernilai rendah keyakinan."
            :checked="confirmed"
            @update:checked="confirmed = $event"
            @confirm="runAutoMap"
            @cancel="autoMapOpen = false"
        >
            <div class="space-y-2">
                <label class="block">
                    <span class="label">Strategi pencocokan</span>
                    <select v-model="autoMapMode" class="select">
                        <option value="code">Berdasarkan kode (paling aman)</option>
                        <option value="name">Berdasarkan nama (perlu peninjauan)</option>
                        <option value="identity">Berdasarkan identitas (NIM/NIDN)</option>
                    </select>
                </label>

                <div v-if="autoMapResult" class="border border-neutral-200 bg-neutral-50 p-2 text-[12px]">
                    <p class="font-medium text-neutral-800">Hasil pencocokan</p>
                    <p class="mt-1 text-neutral-600">Dipetakan: {{ autoMapResult.matched }} · Konflik: {{ autoMapResult.conflicts }} · Dilewati: {{ autoMapResult.skipped }}</p>
                    <ul v-if="autoMapResult.details.length > 0" class="mt-1.5 max-h-40 space-y-1 overflow-y-auto">
                        <li v-for="detail in autoMapResult.details.slice(0, 12)" :key="detail.localId" class="flex items-center gap-2 text-2xs">
                            <StatusBadge :status="detail.status" kind="mapping" :show-description="false" />
                            <span class="min-w-0 flex-1 truncate text-neutral-700">{{ detail.localLabel }} → {{ detail.externalLabel ?? '—' }}</span>
                            <span class="text-neutral-500">{{ detail.reason }}</span>
                        </li>
                    </ul>
                </div>
            </div>
        </ConfirmDialog>
    </div>
</template>
