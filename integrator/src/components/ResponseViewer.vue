<script setup lang="ts">
import { computed } from 'vue';
import type { JsonObject } from '@/types/common';
import JsonBlock from './JsonBlock.vue';
import AppIcon from './AppIcon.vue';
import StatusBadge from './StatusBadge.vue';
import { errorCategoryMeta } from '@/utils/status';
import { formatDuration, formatDateTime } from '@/utils/format';

/**
 * ResponseViewer — menampilkan respons mentah Neo Feeder:
 * HTTP status, error_code, pesan, durasi, percobaan, dan kategori error
 * dalam bahasa manusiawi (bukan sekadar "500 Internal Server Error").
 */
const props = withDefaults(
    defineProps<{
        response: JsonObject | null;
        httpStatus?: number | null;
        code?: number | null;
        message?: string | null;
        durationMs?: number | null;
        attempt?: number | null;
        requestId?: string | null;
        createdAt?: string | null;
        errorCategory?: string | null;
        maxHeight?: string;
    }>(),
    { httpStatus: null, code: null, message: null, durationMs: null, attempt: null, requestId: null, createdAt: null, errorCategory: null, maxHeight: '340px' },
);

const success = computed(() => Number(props.code ?? (props.response?.error_code as number) ?? -1) === 0);

const resolvedCode = computed(() => props.code ?? (props.response?.error_code as number | undefined) ?? null);
const resolvedMessage = computed(() => props.message ?? (props.response?.error_desc as string | undefined) ?? '—');

const category = computed(() => (props.errorCategory ? errorCategoryMeta[props.errorCategory as keyof typeof errorCategoryMeta] : null));
</script>

<template>
    <div class="space-y-2.5">
        <div class="grid grid-cols-2 gap-2 md:grid-cols-4">
            <div class="border border-neutral-200 bg-white px-2.5 py-2">
                <p class="kv-label">HTTP status</p>
                <p class="mt-0.5 font-mono text-[12.5px]" :class="httpStatus && httpStatus >= 500 ? 'text-red-700' : 'text-neutral-800'">{{ httpStatus ?? '—' }}</p>
            </div>
            <div class="border border-neutral-200 bg-white px-2.5 py-2">
                <p class="kv-label">error_code</p>
                <p class="mt-0.5 font-mono text-[12.5px]" :class="success ? 'text-emerald-700' : 'text-red-700'">{{ resolvedCode ?? '—' }}</p>
            </div>
            <div class="border border-neutral-200 bg-white px-2.5 py-2">
                <p class="kv-label">Durasi</p>
                <p class="mt-0.5 font-mono text-[12.5px] text-neutral-800">{{ formatDuration(durationMs) }}</p>
            </div>
            <div class="border border-neutral-200 bg-white px-2.5 py-2">
                <p class="kv-label">Percobaan</p>
                <p class="mt-0.5 font-mono text-[12.5px] text-neutral-800">{{ attempt ?? '—' }}</p>
            </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 border px-3 py-2" :class="success ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'">
            <AppIcon :name="success ? 'check' : 'alert'" :size="15" :class="success ? 'text-emerald-700' : 'text-red-700'" />
            <p class="flex-1 text-[12.5px]" :class="success ? 'text-emerald-900' : 'text-red-900'">{{ resolvedMessage }}</p>
            <StatusBadge v-if="category" :status="category.label" kind="severity" :show-description="false" />
        </div>

        <p v-if="category" class="text-2xs text-neutral-600">{{ category.description }}</p>

        <dl class="grid grid-cols-1 gap-1 md:grid-cols-2">
            <div class="flex gap-2">
                <dt class="kv-label w-24 shrink-0">Request ID</dt>
                <dd class="font-mono text-[11.5px] text-neutral-700">{{ requestId ?? '—' }}</dd>
            </div>
            <div class="flex gap-2">
                <dt class="kv-label w-24 shrink-0">Waktu</dt>
                <dd class="text-[12px] text-neutral-700">{{ formatDateTime(createdAt) }}</dd>
            </div>
        </dl>

        <JsonBlock :value="response ?? { info: 'Belum ada respons tersimpan untuk data ini.' }" label="Respons mentah Neo Feeder" :max-height="maxHeight" :masked="true" />
    </div>
</template>
