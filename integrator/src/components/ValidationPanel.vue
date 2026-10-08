<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ValidationIssue } from '@/types/integration';
import StatusBadge from './StatusBadge.vue';
import AppIcon from './AppIcon.vue';
import EmptyState from './EmptyState.vue';
import { ValidationService } from '@/services/ValidationService';
import { useClipboard } from '@/composables/useUi';

/**
 * ValidationPanel — daftar temuan validasi per baris data.
 * Menampilkan pesan utama, tindakan perbaikan, serta pengelompokan kode temuan.
 */
const props = withDefaults(
    defineProps<{
        issues: ValidationIssue[];
        title?: string;
        groupByCode?: boolean;
        showEntity?: boolean;
        compact?: boolean;
        maxHeight?: string;
    }>(),
    { title: 'Hasil validasi', groupByCode: false, showEntity: false, compact: false, maxHeight: '360px' },
);

const emit = defineEmits<{ 'open-entity': [ValidationIssue] }>();

const { copy } = useClipboard();
const expanded = ref<Record<string, boolean>>({});

const counts = computed(() => ValidationService.countsBySeverity(props.issues));
const sorted = computed(() => ValidationService.sortBySeverity(props.issues));
const grouped = computed(() => ValidationService.groupByCode(props.issues));
const blockingMessage = computed(() => ValidationService.blockMessage(props.issues));
const hint = computed(() => ValidationService.remediationHint(props.issues));

const toggle = (id: string): void => {
    expanded.value = { ...expanded.value, [id]: !expanded.value[id] };
};

const copyIssue = (issue: ValidationIssue): void => {
    void copy(JSON.stringify({ code: issue.code, severity: issue.severity, entity: issue.entity, localId: issue.localId, message: issue.message, remediation: issue.remediation }, null, 2), 'Detail temuan');
};
</script>

<template>
    <div>
        <div class="flex flex-wrap items-center gap-2 border-b border-neutral-200 bg-white px-3 py-2">
            <span class="panel-title" :class="compact ? 'text-[11.5px]' : ''">{{ title }}</span>
            <div class="flex flex-wrap items-center gap-1.5">
                <span v-if="counts.critical" class="badge border-red-300 bg-red-50 text-red-700">{{ counts.critical }} critical</span>
                <span v-if="counts.error" class="badge border-red-200 bg-red-50 text-red-700">{{ counts.error }} error</span>
                <span v-if="counts.warning" class="badge border-amber-200 bg-amber-50 text-amber-800">{{ counts.warning }} warning</span>
                <span v-if="counts.info" class="badge border-sky-200 bg-sky-50 text-sky-700">{{ counts.info }} info</span>
                <span v-if="issues.length === 0" class="badge border-emerald-200 bg-emerald-50 text-emerald-700">tidak ada temuan</span>
            </div>
        </div>

        <div v-if="blockingMessage" class="border-b border-red-200 bg-red-50 px-3 py-2">
            <p class="flex items-start gap-1.5 text-[12px] font-medium text-red-800">
                <AppIcon name="alert" :size="14" class="mt-0.5 shrink-0" />
                {{ blockingMessage }}
            </p>
            <p v-if="hint" class="mt-1 pl-5 text-2xs text-red-700">Saran: {{ hint }}</p>
        </div>

        <EmptyState v-if="issues.length === 0" compact icon="check" title="Data lolos validasi" message="Tidak ada temuan pada data ini. Data dapat diiktusertakan pada proses sinkronisasi." />

        <div v-else class="overflow-y-auto" :style="{ maxHeight }">
            <!-- Mode ringkas per kode temuan -->
            <table v-if="groupByCode" class="data-table">
                <thead>
                    <tr>
                        <th>Kode</th>
                        <th>Temuan</th>
                        <th class="w-[92px]">Tingkat</th>
                        <th class="w-[70px] text-right">Jumlah</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in grouped" :key="item.code">
                        <td class="font-mono text-[11px] text-neutral-600">{{ item.code }}</td>
                        <td>{{ item.message }}</td>
                        <td><StatusBadge :status="item.severity" kind="severity" /></td>
                        <td class="text-right font-semibold">{{ item.count }}</td>
                    </tr>
                </tbody>
            </table>

            <!-- Mode daftar temuan detail -->
            <ul v-else class="divide-y divide-neutral-100">
                <li v-for="issue in sorted" :key="issue.id" class="px-3 py-2">
                    <div class="flex flex-wrap items-start gap-2">
                        <StatusBadge :status="issue.severity" kind="severity" />
                        <div class="min-w-0 flex-1">
                            <p class="text-[12.5px] text-neutral-800">{{ issue.message }}</p>
                            <p class="mt-0.5 font-mono text-[10.5px] text-neutral-500">
                                {{ issue.code }}
                                <span v-if="issue.field">· field: {{ issue.field }}</span>
                                <span v-if="!showEntity">· {{ issue.localLabel }}</span>
                            </p>
                            <p v-if="issue.remediation" class="mt-1 text-2xs text-neutral-600">Saran perbaikan: {{ issue.remediation }}</p>
                        </div>
                        <div class="flex items-center gap-1">
                            <button v-if="showEntity" type="button" class="btn btn-ghost btn-xs" @click="emit('open-entity', issue)">
                                <AppIcon name="external" :size="12" />
                                Buka
                            </button>
                            <button type="button" class="btn btn-ghost btn-xs" @click="copyIssue(issue)">
                                <AppIcon name="copy" :size="12" />
                            </button>
                        </div>
                    </div>

                    <div v-if="issue.remediation && !compact" class="mt-1">
                        <button type="button" class="text-2xs text-neutral-500 underline" @click="toggle(issue.id)">
                            {{ expanded[issue.id] ? 'Sembunyikan detail aturan' : 'Detail aturan validasi' }}
                        </button>
                        <p v-if="expanded[issue.id]" class="mt-1 border border-neutral-200 bg-neutral-50 p-2 text-2xs leading-relaxed text-neutral-600">
                            Temuan ini dihasilkan oleh validator entitas <span class="font-mono">{{ issue.entity }}</span> untuk baris <span class="font-mono">{{ issue.localId }}</span
                            >. Aturan berasal dari persyaratan Web Service Neo Feeder; perbaikan dilakukan pada data SIAKAD, bukan pada payload.
                        </p>
                    </div>
                </li>
            </ul>
        </div>
    </div>
</template>
