<script setup lang="ts">
import { computed } from 'vue';
import type { SyncJob } from '@/types/integration';
import StatusBadge from './StatusBadge.vue';
import AppIcon from './AppIcon.vue';
import { SyncService } from '@/services/SyncService';
import { formatDuration, formatDateTime, relativeTime } from '@/utils/format';

/**
 * SyncProgress — progres job sinkronisasi secara nyata (dari item yang
 * diproses backend), lengkap dengan item terbaru, retry, dan pembatalan.
 */
const props = withDefaults(defineProps<{ job: SyncJob; showItems?: boolean; maxItems?: number }>(), { showItems: true, maxItems: 8 });

const emit = defineEmits<{ retry: []; cancel: []; 'open-log': [string] }>();

const percent = computed(() => SyncService.progressPercent(props.job));
const finished = computed(() => SyncService.isFinished(props.job));
const retryable = computed(() => SyncService.retryableItems(props.job));
const nonRetryable = computed(() => SyncService.nonRetryableItems(props.job));
const eta = computed(() => SyncService.estimatedRemainingMs(props.job));

const recentItems = computed(() =>
    [...props.job.items]
        .filter((item) => item.status !== 'PENDING')
        .sort((a, b) => String(b.finishedAt ?? '').localeCompare(String(a.finishedAt ?? '')))
        .slice(0, props.maxItems),
);

const statusCount = (status: string): number => props.job.items.filter((item) => item.status === status).length;
</script>

<template>
    <div class="space-y-3">
        <div class="flex flex-wrap items-center gap-2">
            <StatusBadge :status="job.status" kind="job" size="md" />
            <span v-if="job.dryRun" class="badge border-amber-300 bg-amber-50 text-amber-800">DRY RUN</span>
            <span class="font-mono text-[11px] text-neutral-500">{{ job.id }}</span>
            <span class="text-2xs text-neutral-500">{{ job.periodLabel ?? 'semua periode' }}{{ job.prodiLabel ? ` · ${job.prodiLabel}` : '' }}</span>
            <span class="ml-auto text-2xs text-neutral-500">mulai {{ formatDateTime(job.startedAt) }} · {{ job.createdBy }}</span>
        </div>

        <div>
            <div class="mb-1 flex items-center justify-between text-2xs text-neutral-600">
                <span>{{ job.processed }} / {{ job.total }} diproses ({{ percent }}%)</span>
                <span v-if="!finished && eta > 0">perkiraan sisa {{ formatDuration(eta) }}</span>
                <span v-else-if="finished">selesai {{ relativeTime(job.finishedAt) }}</span>
            </div>
            <div class="h-2 w-full border border-neutral-200 bg-neutral-100">
                <div class="h-full transition-all" :class="job.failed > 0 ? 'bg-amber-500' : 'bg-emerald-600'" :style="{ width: `${percent}%` }" />
            </div>
        </div>

        <div class="grid grid-cols-2 gap-2 md:grid-cols-4">
            <div class="border border-neutral-200 bg-white px-2.5 py-2">
                <p class="kv-label">Berhasil</p>
                <p class="mt-0.5 text-[15px] font-semibold text-emerald-700">{{ job.success }}</p>
            </div>
            <div class="border border-neutral-200 bg-white px-2.5 py-2">
                <p class="kv-label">Gagal</p>
                <p class="mt-0.5 text-[15px] font-semibold" :class="job.failed > 0 ? 'text-red-700' : 'text-neutral-500'">{{ job.failed }}</p>
            </div>
            <div class="border border-neutral-200 bg-white px-2.5 py-2">
                <p class="kv-label">Dilewati</p>
                <p class="mt-0.5 text-[15px] font-semibold text-neutral-600">{{ job.skipped }}</p>
            </div>
            <div class="border border-neutral-200 bg-white px-2.5 py-2">
                <p class="kv-label">Tidak valid</p>
                <p class="mt-0.5 text-[15px] font-semibold" :class="job.invalid > 0 ? 'text-red-700' : 'text-neutral-500'">{{ job.invalid }}</p>
            </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
            <button v-if="retryable.length > 0" type="button" class="btn btn-secondary btn-xs" @click="emit('retry')">
                <AppIcon name="retry" :size="12" />
                Retry {{ retryable.length }} item gagal
            </button>
            <button v-if="!finished" type="button" class="btn btn-danger btn-xs" @click="emit('cancel')">
                <AppIcon name="cancel" :size="12" />
                Batalkan job
            </button>
            <span v-if="nonRetryable.length > 0" class="badge border-red-200 bg-red-50 text-red-700">
                {{ nonRetryable.length }} item perlu perbaikan data (tidak bisa di-retry)
            </span>
        </div>

        <div v-if="showItems" class="border border-neutral-200">
            <div class="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-3 py-1.5">
                <span class="text-2xs font-semibold uppercase tracking-wider text-neutral-600">Item terbaru</span>
                <span class="text-2xs text-neutral-500">
                    pending {{ statusCount('PENDING') }} · berjalan {{ statusCount('RUNNING') }} · sukses {{ statusCount('SUCCESS') }} · gagal {{ statusCount('FAILED') }}
                </span>
            </div>
            <ul class="divide-y divide-neutral-100">
                <li v-for="item in recentItems" :key="item.id" class="flex flex-wrap items-center gap-2 px-3 py-1.5">
                    <StatusBadge :status="item.status" kind="jobitem" :show-description="false" />
                    <span class="min-w-0 flex-1 truncate text-[12px] text-neutral-800">{{ item.localLabel }}</span>
                    <span class="font-mono text-[10.5px] text-neutral-500">{{ item.act }}</span>
                    <span v-if="item.durationMs" class="text-2xs text-neutral-500">{{ formatDuration(item.durationMs) }}</span>
                    <span v-if="item.message" class="w-full truncate text-2xs" :class="item.status === 'FAILED' ? 'text-red-700' : 'text-neutral-500'">{{ item.message }}</span>
                    <button v-if="item.requestId" type="button" class="btn btn-ghost btn-xs" @click="emit('open-log', item.requestId)">
                        <AppIcon name="eye" :size="12" />
                        Log
                    </button>
                </li>
                <li v-if="recentItems.length === 0" class="px-3 py-4 text-center text-2xs text-neutral-500">Belum ada item yang diproses.</li>
            </ul>
        </div>
    </div>
</template>
