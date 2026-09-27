<script setup lang="ts">
import { computed } from 'vue';
import type { PayloadPreviewItem } from '@/types/integration';
import JsonBlock from './JsonBlock.vue';
import StatusBadge from './StatusBadge.vue';
import AppIcon from './AppIcon.vue';

/**
 * PayloadViewer — inspektur payload sebelum dikirim.
 *
 * Menampilkan envelope `{ act, token: "[HIDDEN]", record }`, field yang
 * dilewati beserta alasannya, serta peringatan bila schema act belum
 * diverifikasi terhadap dictionary versi Neo Feeder terpasang.
 */
const props = withDefaults(defineProps<{ item: PayloadPreviewItem; showEnvelope?: boolean; maxHeight?: string }>(), {
    showEnvelope: true,
    maxHeight: '380px',
});

const envelope = computed(() => ({
    act: props.item.act,
    token: '[HIDDEN]',
    record: props.item.record,
}));

const blocking = computed(() => props.item.issues.filter((issue) => issue.severity === 'critical' || issue.severity === 'error'));
const warnings = computed(() => props.item.issues.filter((issue) => issue.severity === 'warning'));
</script>

<template>
    <div class="space-y-2.5">
        <div class="flex flex-wrap items-center gap-2">
            <span class="badge border-neutral-300 bg-neutral-100 font-mono text-neutral-700">{{ item.act }}</span>
            <StatusBadge :status="item.status" />
            <span
                class="badge"
                :class="item.action === 'INSERT' ? 'border-brand-300 bg-brand-50 text-brand-800' : item.action === 'UPDATE' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-neutral-300 bg-neutral-100 text-neutral-600'"
            >
                {{ item.action }}
            </span>
            <span class="text-2xs text-neutral-500">{{ item.localLabel }}</span>
        </div>

        <div v-if="blocking.length > 0" class="border border-red-200 bg-red-50 p-2">
            <p class="flex items-center gap-1.5 text-[12px] font-semibold text-red-800">
                <AppIcon name="alert" :size="13" />
                Payload belum layak dikirim ({{ blocking.length }} masalah)
            </p>
            <ul class="mt-1 list-disc space-y-0.5 pl-5 text-2xs text-red-700">
                <li v-for="issue in blocking" :key="issue.id">{{ issue.message }}</li>
            </ul>
        </div>

        <div v-if="!item.dependencies.ok" class="border border-red-200 bg-red-50 p-2">
            <p class="text-[12px] font-semibold text-red-800">Dependency belum terpenuhi</p>
            <ul class="mt-1 list-disc space-y-0.5 pl-5 text-2xs text-red-700">
                <li v-for="blocker in item.dependencies.blockers" :key="`${blocker.requirement.field}-${blocker.localId}`">
                    {{ blocker.reason }}
                    <span class="font-mono">({{ blocker.requirement.field }})</span>
                </li>
            </ul>
        </div>

        <div v-if="warnings.length > 0" class="border border-amber-200 bg-amber-50 p-2">
            <p class="text-[12px] font-semibold text-amber-800">{{ warnings.length }} peringatan (tetap dapat dikirim)</p>
            <ul class="mt-1 list-disc space-y-0.5 pl-5 text-2xs text-amber-800">
                <li v-for="issue in warnings" :key="issue.id">{{ issue.message }}</li>
            </ul>
        </div>

        <div v-if="item.skippedFields.length > 0" class="border border-neutral-200 bg-neutral-50 p-2">
            <p class="text-[12px] font-semibold text-neutral-700">Field yang tidak dikirim ({{ item.skippedFields.length }})</p>
            <table class="mt-1 w-full text-2xs">
                <tbody>
                    <tr v-for="field in item.skippedFields" :key="field.field" class="border-b border-neutral-200 last:border-0">
                        <td class="py-1 pr-3 font-mono text-neutral-700">{{ field.field }}</td>
                        <td class="py-1 text-neutral-500">{{ field.reason }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <JsonBlock :value="showEnvelope ? envelope : item.record" :label="showEnvelope ? 'Envelope request' : 'record'" :max-height="maxHeight" :download-name="`payload-${item.entity}-${item.localId}.json`" />
    </div>
</template>
