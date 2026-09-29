<script setup lang="ts">
import { computed } from 'vue';
import type { ComparisonRow } from '@/types/integration';
import StatusBadge from './StatusBadge.vue';
import { CompareService } from '@/services/CompareService';
import { displayValue } from '@/utils/format';

/**
 * ComparisonTable — perbandingan field SIAKAD vs PDDIKTI.
 * Perbedaan identitas ditandai khusus dan TIDAK pernah ditimpa otomatis:
 * operator memilih tindakan pada kolom keputusan.
 */
const props = withDefaults(
    defineProps<{
        rows: ComparisonRow[];
        showDecision?: boolean;
        diffOnly?: boolean;
        decisions?: Record<string, string>;
        density?: 'compact' | 'normal';
    }>(),
    { showDecision: false, diffOnly: false, decisions: () => ({}), density: 'compact' },
);

const emit = defineEmits<{ decide: [string, string] }>();

const visibleRows = computed(() => (props.diffOnly ? CompareService.diffOnly(props.rows) : props.rows));
const summary = computed(() => CompareService.summarize(props.rows));
const description = computed(() => CompareService.describe(props.rows));

const isDifferent = (row: ComparisonRow): boolean => row.status !== 'MATCH';
const isIdentityDiff = (row: ComparisonRow): boolean => row.status === 'DIFFERENT' && row.identity === true;
</script>

<template>
    <div>
        <div class="flex flex-wrap items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-3 py-2">
            <span class="text-[12px] text-neutral-700">{{ description }}</span>
            <div class="ml-auto flex flex-wrap items-center gap-1.5">
                <span class="badge border-emerald-200 bg-emerald-50 text-emerald-700">{{ summary.MATCH }} sama</span>
                <span class="badge border-amber-200 bg-amber-50 text-amber-800">{{ summary.DIFFERENT }} berbeda</span>
                <span v-if="summary.MISSING_LOCAL" class="badge border-neutral-300 bg-neutral-100 text-neutral-700">{{ summary.MISSING_LOCAL }} kosong di SIAKAD</span>
                <span v-if="summary.MISSING_PDDIKTI" class="badge border-neutral-300 bg-neutral-100 text-neutral-700">{{ summary.MISSING_PDDIKTI }} belum ada di PDDikti</span>
            </div>
        </div>

        <div class="table-wrap">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Field</th>
                        <th>SIAKAD</th>
                        <th>PDDIKTI</th>
                        <th class="w-[92px]">Status</th>
                        <th v-if="showDecision" class="w-[220px]">Keputusan operator</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="row in visibleRows" :key="row.field">
                        <td>
                            <div class="flex items-center gap-1.5">
                                <span class="font-medium text-neutral-800">{{ row.label }}</span>
                                <span v-if="row.identity" class="badge border-neutral-300 bg-neutral-100 text-neutral-600" title="Field identitas — perbedaan tidak ditimpa otomatis">identitas</span>
                            </div>
                            <p class="font-mono text-[10.5px] text-neutral-400">{{ row.field }}</p>
                        </td>
                        <td :class="isDifferent(row) ? 'font-medium text-amber-800' : ''">{{ displayValue(row.local) }}</td>
                        <td :class="isDifferent(row) ? 'font-medium text-amber-800' : ''">{{ displayValue(row.remote) }}</td>
                        <td><StatusBadge :status="isIdentityDiff(row) ? 'CONFLICT' : row.status" kind="comparison" /></td>
                        <td v-if="showDecision">
                            <select
                                v-if="row.status !== 'MATCH'"
                                class="select py-1 text-2xs"
                                :value="decisions[row.field] ?? (row.identity ? 'KEEP_PDDIKTI' : 'KEEP_LOCAL')"
                                @change="emit('decide', row.field, ($event.target as HTMLSelectElement).value)"
                            >
                                <option v-for="option in CompareService.decisionOptions(row)" :key="option.value" :value="option.value">
                                    {{ option.label }}{{ option.recommended ? ' (disarankan)' : '' }}
                                </option>
                            </select>
                            <span v-else class="text-2xs text-neutral-400">tidak perlu tindakan</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <p v-if="showDecision" class="border-t border-neutral-200 bg-neutral-50 px-3 py-2 text-2xs leading-relaxed text-neutral-500">
            Keputusan "Pertahankan nilai PDDikti" mengosongkan field terkait dari payload sehingga nilai di PDDikti tidak berubah. Field identitas selalu memakai keputusan ini
            secara bawaan karena perubahan identitas harus disengaja.
        </p>
    </div>
</template>
