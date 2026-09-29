<script setup lang="ts">
import { computed } from 'vue';
import type { DataStatus, JobStatus, MappingStatus } from '@/types/integration';
import { dataStatusMeta, jobItemStatusMeta, jobStatusMeta, mappingStatusMeta, connectionStatusMeta, comparisonStatusMeta, severityMeta, toneClasses } from '@/utils/status';

/**
 * StatusBadge — satu komponen untuk SELURUH status di integrator sehingga arti
 * warna/label konsisten: data, pemetaan, job, koneksi, perbandingan, severity.
 */
type Kind = 'data' | 'mapping' | 'job' | 'jobitem' | 'connection' | 'comparison' | 'severity';

const props = withDefaults(
    defineProps<{
        status: string | null | undefined;
        kind?: Kind;
        size?: 'sm' | 'md';
        withDot?: boolean;
        showDescription?: boolean;
    }>(),
    { kind: 'data', size: 'sm', withDot: true, showDescription: true },
);

const meta = computed(() => {
    const key = (props.status ?? '').toUpperCase() || 'UNKNOWN';
    switch (props.kind) {
        case 'mapping':
            return mappingStatusMeta[key as MappingStatus] ?? { label: key, tone: 'neutral' as const, description: '' };
        case 'job':
            return jobStatusMeta[key as JobStatus] ?? { label: key, tone: 'neutral' as const, description: '' };
        case 'jobitem':
            return jobItemStatusMeta[key] ?? { label: key, tone: 'neutral' as const, description: '' };
        case 'connection':
            return connectionStatusMeta[key] ?? { label: key, tone: 'neutral' as const, description: '' };
        case 'comparison':
            return comparisonStatusMeta[key] ?? { label: key, tone: 'neutral' as const, description: '' };
        case 'severity':
            return severityMeta[key.toLowerCase() as 'critical' | 'error' | 'warning' | 'info'] ?? { label: key, tone: 'neutral' as const, description: '' };
        default:
            return dataStatusMeta[key as DataStatus] ?? { label: key.replace(/_/g, ' '), tone: 'neutral' as const, description: '' };
    }
});

const classes = computed(() => toneClasses[meta.value.tone]);
const sizeClasses = computed(() => (props.size === 'sm' ? 'px-1.5 py-0.5 text-[10.5px]' : 'px-2 py-0.5 text-2xs'));
const title = computed(() => (props.showDescription ? [meta.value.label, meta.value.description].filter(Boolean).join(' — ') : meta.value.label));
</script>

<template>
    <span class="badge" :class="[classes, sizeClasses]" :title="title">
        <span v-if="withDot" class="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-70" />
        {{ meta.label }}
    </span>
</template>
