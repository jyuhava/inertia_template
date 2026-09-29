<script setup lang="ts">
import { computed, ref } from 'vue';
import type { MappingCandidate, MappingRecord } from '@/types/mapping';
import AppIcon from './AppIcon.vue';
import StatusBadge from './StatusBadge.vue';
import DataTable from './DataTable.vue';
import AppModal from './AppModal.vue';
import EmptyState from './EmptyState.vue';
import type { ColumnDefinition } from '@/types/common';
import { MappingService } from '@/services/MappingService';
import { useMappingStore } from '@/stores/mapping';
import { useToast } from '@/composables/useUi';
import { formatDateTime, relativeTime } from '@/utils/format';
import type { EntityKey } from '@/types/integration';

/**
 * MappingTable — tabel pemetaan SIAKAD <-> PDDIKTI.
 *
 * Menampilkan data lokal, pasangan PDDIKTI, cara pemetaan, dan tingkat
 * keyakinan. Operator dapat memetakan manual (dengan daftar kandidat),
 * melepas pemetaan, atau mengandalkan pencocokan otomatis.
 */
const props = defineProps<{
    entity: EntityKey;
    records: MappingRecord[];
    loading?: boolean;
    selected?: string[];
    selectable?: boolean;
}>();

const emit = defineEmits<{
    'update:selected': [string[]];
    mapped: [];
    unmapped: [];
}>();

const mapping = useMappingStore();
const toast = useToast();

const pickerOpen = ref(false);
const activeRecord = ref<MappingRecord | null>(null);
const candidates = ref<MappingCandidate[]>([]);
const loadingCandidates = ref(false);
const saving = ref(false);

const columns: ColumnDefinition[] = [
    { key: 'localCode', label: 'Kode SIAKAD', mono: true, sortable: true },
    { key: 'localLabel', label: 'Data SIAKAD', sortable: true },
    { key: 'externalCode', label: 'Kode / ID PDDIKTI', mono: true },
    { key: 'externalLabel', label: 'Data PDDIKTI' },
    { key: 'mappingType', label: 'Cara' },
    { key: 'status', label: 'Status', align: 'center' },
    { key: 'confidence', label: 'Keyakinan', align: 'right' },
    { key: 'lastSyncedAt', label: 'Sinkron terakhir' },
];

const rows = computed(() => props.records as unknown as Record<string, unknown>[]);
const allSelectedOnPage = computed(() => rows.value.length > 0 && rows.value.every((row) => (props.selected ?? []).includes(String(row.localId))));

const openPicker = async (record: MappingRecord): Promise<void> => {
    activeRecord.value = record;
    pickerOpen.value = true;
    loadingCandidates.value = true;
    try {
        candidates.value = MappingService.rankedCandidates(await mapping.loadCandidates(props.entity, record.localId));
    } finally {
        loadingCandidates.value = false;
    }
};

const applyCandidate = async (candidate: MappingCandidate): Promise<void> => {
    if (!activeRecord.value) return;
    saving.value = true;
    const ok = await mapping.saveMapping(props.entity, {
        localId: activeRecord.value.localId,
        externalId: candidate.externalId,
        externalLabel: candidate.label,
        externalCode: candidate.externalCode ?? undefined,
        mappingType: 'manual',
    });
    saving.value = false;

    if (ok) {
        toast.success('Pemetaan disimpan', `${activeRecord.value.localLabel} → ${candidate.label}`);
        pickerOpen.value = false;
        activeRecord.value = null;
        emit('mapped');
        return;
    }
    toast.error('Gagal menyimpan pemetaan', mapping.error ? new Error(mapping.error) : null);
};

const unmapSelected = async (): Promise<void> => {
    if (!props.selected || props.selected.length === 0) return;
    const updated = await mapping.bulkUnmap(props.entity, props.selected);
    toast.info(`${updated} pemetaan dilepas`, 'Data tersebut tidak lagi memiliki pasangan ID PDDikti.');
    emit('unmapped');
};

const toggleAll = (): void => {
    if (allSelectedOnPage.value) {
        emit('update:selected', []);
        return;
    }
    emit('update:selected', rows.value.map((row) => String(row.localId)));
};

const toggleRow = (localId: string): void => {
    const current = props.selected ?? [];
    emit('update:selected', current.includes(localId) ? current.filter((id) => id !== localId) : [...current, localId]);
};

const typeLabel = (type: MappingRecord['mappingType']): string => {
    switch (type) {
        case 'by-code':
            return 'otomatis (kode)';
        case 'by-name':
            return 'otomatis (nama)';
        case 'by-identity':
            return 'otomatis (identitas)';
        case 'manual':
            return 'manual';
        default:
            return '—';
    }
};

const scoreClass = (score: number): string => (score >= 0.85 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : score >= 0.6 ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-neutral-300 bg-neutral-100 text-neutral-600');
</script>

<template>
    <div>
        <div v-if="selectable && (selected?.length ?? 0) > 0" class="flex flex-wrap items-center gap-2 border-b border-brand-300 bg-brand-50 px-3 py-2">
            <span class="text-[12.5px] font-semibold text-brand-900">{{ selected?.length }} pemetaan dipilih</span>
            <button type="button" class="btn btn-secondary btn-xs" @click="unmapSelected">
                <AppIcon name="x" :size="12" />
                Lepas pemetaan terpilih
            </button>
        </div>

        <DataTable
            :columns="columns"
            :rows="rows"
            :loading="loading"
            :selectable="selectable"
            :selected="selected"
            empty-title="Belum ada data untuk dipetakan"
            empty-message="Pastikan data SIAKAD untuk entitas ini sudah tersedia, lalu jalankan pencocokan otomatis."
            @select="toggleRow"
            @select-all="toggleAll"
        >
            <template #cell-status="{ row }">
                <StatusBadge :status="String((row as Record<string, unknown>).status)" kind="mapping" />
            </template>

            <template #cell-externalLabel="{ row }">
                <span v-if="(row as Record<string, unknown>).externalLabel">{{ (row as Record<string, unknown>).externalLabel }}</span>
                <span v-else class="text-2xs text-neutral-400">belum ada pasangan</span>
            </template>

            <template #cell-mappingType="{ row }">
                <span class="text-2xs text-neutral-600">{{ typeLabel((row as unknown as MappingRecord).mappingType) }}</span>
            </template>

            <template #cell-confidence="{ row }">
                <span v-if="(row as unknown as MappingRecord).confidence !== null" class="badge" :class="scoreClass((row as unknown as MappingRecord).confidence ?? 0)">
                    {{ Math.round(((row as unknown as MappingRecord).confidence ?? 0) * 100) }}%
                </span>
                <span v-else class="text-2xs text-neutral-400">—</span>
            </template>

            <template #cell-lastSyncedAt="{ row }">
                <span v-if="(row as Record<string, unknown>).lastSyncedAt" :title="formatDateTime(String((row as Record<string, unknown>).lastSyncedAt))">
                    {{ relativeTime(String((row as Record<string, unknown>).lastSyncedAt)) }}
                </span>
                <span v-else class="text-2xs text-neutral-400">belum pernah</span>
            </template>

            <template #actions="{ row }">
                <button type="button" class="btn btn-secondary btn-xs" @click="openPicker(row as unknown as MappingRecord)">
                    <AppIcon name="map" :size="12" />
                    {{ (row as unknown as MappingRecord).externalId ? 'Ganti' : 'Petakan' }}
                </button>
            </template>
        </DataTable>

        <AppModal :open="pickerOpen" size="lg" title="Pilih pasangan PDDIKTI" :subtitle="activeRecord ? `${activeRecord.localCode} — ${activeRecord.localLabel}` : ''" @close="pickerOpen = false">
            <div v-if="loadingCandidates" class="p-4 text-[12.5px] text-neutral-500">Mencari kandidat pada data PDDIKTI…</div>

            <EmptyState
                v-else-if="candidates.length === 0"
                compact
                icon="search"
                title="Tidak ada kandidat"
                message="Data PDDIKTI untuk entitas ini belum tersedia atau belum ditarik. Jalankan pengambilan data pada halaman Koneksi/Referensi terlebih dahulu."
            />

            <div v-else class="space-y-2">
                <p class="text-2xs text-neutral-500">
                    Kandidat diurutkan berdasarkan skor kecocokan (kode identik, nama identik, dan kemiripan nama). Skor di bawah 60% sebaiknya diperiksa manual.
                </p>
                <ul class="divide-y divide-neutral-100 border border-neutral-200">
                    <li v-for="candidate in candidates" :key="candidate.externalId" class="flex flex-wrap items-center gap-2 px-3 py-2">
                        <div class="min-w-0 flex-1">
                            <p class="text-[12.5px] font-medium text-neutral-800">{{ candidate.label }}</p>
                            <p class="font-mono text-[10.5px] text-neutral-500">{{ candidate.externalCode ?? '—' }} · {{ candidate.externalId }}</p>
                            <p class="text-2xs text-neutral-500">Alasan: {{ candidate.reason }}</p>
                        </div>
                        <span class="badge" :class="scoreClass(candidate.score)">{{ Math.round(candidate.score * 100) }}%</span>
                        <button type="button" class="btn btn-primary btn-xs" :disabled="saving" @click="applyCandidate(candidate)">
                            <AppIcon name="check" :size="12" />
                            Pilih
                        </button>
                    </li>
                </ul>
            </div>

            <template #footer>
                <button type="button" class="btn btn-secondary" @click="pickerOpen = false">Tutup</button>
            </template>
        </AppModal>
    </div>
</template>
