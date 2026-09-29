<script setup lang="ts">
import { computed } from 'vue';
import type { SyncLogEntry } from '@/types/integration';
import StatusBadge from './StatusBadge.vue';
import EmptyState from './EmptyState.vue';
import AppIcon from './AppIcon.vue';
import { formatDateTime, formatDuration, relativeTime } from '@/utils/format';

/**
 * SyncHistory — histori sinkronisasi satu baris data (audit trail ringkas).
 */
const props = withDefaults(defineProps<{ logs: SyncLogEntry[]; compact?: boolean; maxItems?: number }>(), { compact: false, maxItems: 20 });

const emit = defineEmits<{ open: [SyncLogEntry] }>();

const items = computed(() => props.logs.slice(0, props.maxItems));
</script>

<template>
    <div>
        <EmptyState v-if="items.length === 0" compact icon="clock" title="Belum ada riwayat" message="Data ini belum pernah disinkronkan ke Neo Feeder." />

        <ol v-else class="relative space-y-0 border-l border-neutral-200 pl-4">
            <li v-for="log in items" :key="log.id" class="relative pb-3">
                <span class="absolute -left-[21px] top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full border" :class="log.status === 'success' ? 'border-emerald-400 bg-emerald-500' : 'border-red-400 bg-red-500'" />

                <div class="flex flex-wrap items-center gap-2">
                    <StatusBadge :status="log.status === 'success' ? 'SUCCESS' : 'FAILED'" :show-description="false" />
                    <span class="font-mono text-[11px] text-neutral-700">{{ log.act }}</span>
                    <span class="badge border-neutral-300 bg-neutral-100 text-neutral-600">{{ log.action }}</span>
                    <span class="text-2xs text-neutral-500">{{ formatDateTime(log.createdAt) }} · {{ relativeTime(log.createdAt) }}</span>
                    <span class="text-2xs text-neutral-500">· {{ formatDuration(log.durationMs) }} · percobaan {{ log.attempt }}</span>
                    <button type="button" class="btn btn-ghost btn-xs ml-auto" @click="emit('open', log)">
                        <AppIcon name="eye" :size="12" />
                        Payload & respons
                    </button>
                </div>

                <p v-if="log.neoFeederMessage" class="mt-1 text-[12px]" :class="log.status === 'success' ? 'text-neutral-600' : 'text-red-700'">
                    {{ log.neoFeederMessage }}
                </p>
                <p v-if="!compact" class="mt-0.5 font-mono text-[10.5px] text-neutral-500">
                    request {{ log.requestId }} · user {{ log.user }}{{ log.jobId ? ` · job ${log.jobId}` : '' }}
                </p>
            </li>
        </ol>
    </div>
</template>
