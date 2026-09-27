<script setup lang="ts">
import { computed, ref } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import type { NormalizedError } from '@/utils/errors';

/**
 * ErrorPanel — menampilkan kesalahan dengan bahasa manusiawi + kategori,
 * serta detail teknis pada bagian yang dapat dibuka.
 */
const props = defineProps<{
    title?: string;
    message: string;
    normalized?: NormalizedError | null;
    retryable?: boolean;
    compact?: boolean;
}>();

const emit = defineEmits<{ retry: []; dismiss: [] }>();

const showDetail = ref(false);

const categoryLabel = computed(() => {
    const labels: Record<string, string> = {
        NETWORK_ERROR: 'Gangguan jaringan',
        TIMEOUT: 'Waktu habis',
        AUTH_ERROR: 'Autentikasi gagal',
        VALIDATION_ERROR: 'Validasi gagal',
        PDDIKTI_ERROR: 'Kesalahan PDDikti',
        CONFLICT: 'Konflik data',
        UNKNOWN_ERROR: 'Kesalahan tidak dikenal',
    };
    return props.normalized ? (labels[props.normalized.category] ?? props.normalized.category) : null;
});

const canRetry = computed(() => props.retryable ?? props.normalized?.retryable ?? false);
</script>

<template>
    <div class="border border-red-200 bg-red-50" :class="compact ? 'p-3' : 'p-4'">
        <div class="flex items-start gap-2.5">
            <AppIcon name="alert" :size="16" class="mt-0.5 shrink-0 text-red-600" />
            <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                    <p class="text-[12.5px] font-semibold text-red-900">{{ title ?? 'Terjadi kesalahan' }}</p>
                    <span v-if="categoryLabel" class="badge border-red-300 bg-white text-red-700">{{ categoryLabel }}</span>
                    <span v-if="normalized?.httpStatus" class="badge border-red-200 bg-white text-red-700">HTTP {{ normalized.httpStatus }}</span>
                    <span v-if="normalized?.neoFeederCode !== null && normalized?.neoFeederCode !== undefined" class="badge border-red-200 bg-white text-red-700">code {{ normalized.neoFeederCode }}</span>
                </div>
                <p class="mt-1 text-[12px] leading-relaxed text-red-800">{{ message }}</p>

                <div v-if="normalized?.actions?.length" class="mt-2 flex flex-wrap gap-1.5">
                    <span v-for="action in normalized.actions" :key="action" class="badge border-red-200 bg-white text-red-700">{{ action }}</span>
                </div>

                <div class="mt-2 flex flex-wrap items-center gap-2">
                    <button v-if="canRetry" type="button" class="btn btn-secondary btn-xs" @click="emit('retry')">
                        <AppIcon name="retry" :size="12" />
                        Coba lagi
                    </button>
                    <button v-if="normalized?.detail" type="button" class="btn btn-ghost btn-xs" @click="showDetail = !showDetail">
                        {{ showDetail ? 'Sembunyikan detail teknis' : 'Lihat detail teknis' }}
                    </button>
                    <button type="button" class="btn btn-ghost btn-xs" @click="emit('dismiss')">Tutup</button>
                </div>

                <pre v-if="showDetail && normalized?.detail" class="mt-2 max-h-56 overflow-auto border border-red-200 bg-white p-2 font-mono text-[10.5px] leading-relaxed text-red-900">{{ normalized.detail }}</pre>
            </div>
        </div>
    </div>
</template>
