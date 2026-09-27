<script setup lang="ts">
import { computed, ref } from 'vue';
import AppIcon from './AppIcon.vue';
import { maskSensitive } from '@/utils/json';
import { useClipboard } from '@/composables/useUi';
import type { JsonValue } from '@/types/common';

/**
 * JsonBlock — penampil JSON dengan penyorot sederhana, salin, dan unduh.
 * Nilai sensitif (token/password) selalu disensor sebelum ditampilkan.
 */
const props = withDefaults(
    defineProps<{
        value: unknown;
        label?: string;
        maxHeight?: string;
        masked?: boolean;
        toolbar?: boolean;
        downloadName?: string;
    }>(),
    { label: '', maxHeight: '420px', masked: true, toolbar: true, downloadName: '' },
);

const { copy } = useClipboard();
const collapsed = ref(false);
const wrap = ref(false);

const safeValue = computed(() => (props.masked ? maskSensitive(props.value as JsonValue) : props.value));

const text = computed(() => {
    try {
        return JSON.stringify(safeValue.value, null, 4) ?? 'null';
    } catch {
        return String(safeValue.value);
    }
});

const lineCount = computed(() => text.value.split('\n').length);

const highlighted = computed(() => {
    const escaped = text.value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return escaped
        .replace(/("(?:[^"\\]|\\.)*")(\s*:)/g, '<span class="text-sky-300">$1</span>$2')
        .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span class="text-emerald-300">$1</span>')
        .replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="text-amber-300">$1</span>')
        .replace(/:\s*(true|false|null)/g, ': <span class="text-fuchsia-300">$1</span>');
});

const download = (): void => {
    const name = props.downloadName || `payload-${Date.now()}.json`;
    const blob = new Blob([text.value], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    URL.revokeObjectURL(url);
};
</script>

<template>
    <div class="border border-neutral-200 bg-neutral-950">
        <div v-if="toolbar" class="flex flex-wrap items-center gap-2 border-b border-neutral-800 bg-neutral-900 px-2.5 py-1.5">
            <span v-if="label" class="font-mono text-[11px] uppercase tracking-wide text-neutral-400">{{ label }}</span>
            <span class="badge border-neutral-700 bg-neutral-800 text-neutral-300">{{ lineCount }} baris</span>
            <span v-if="masked" class="badge border-amber-700 bg-amber-900/40 text-amber-300" title="Token/password otomatis disensor">token disensor</span>

            <div class="ml-auto flex items-center gap-1.5">
                <button type="button" class="btn btn-ghost btn-xs text-neutral-300 hover:bg-neutral-800" @click="wrap = !wrap">{{ wrap ? 'Tanpa wrap' : 'Wrap' }}</button>
                <button type="button" class="btn btn-ghost btn-xs text-neutral-300 hover:bg-neutral-800" @click="collapsed = !collapsed">
                    {{ collapsed ? 'Perluas' : 'Ringkas' }}
                </button>
                <button type="button" class="btn btn-ghost btn-xs text-neutral-300 hover:bg-neutral-800" @click="copy(text, 'JSON')">
                    <AppIcon name="copy" :size="12" />
                    Salin
                </button>
                <button type="button" class="btn btn-ghost btn-xs text-neutral-300 hover:bg-neutral-800" @click="download">
                    <AppIcon name="download" :size="12" />
                    Unduh
                </button>
            </div>
        </div>

        <pre
            v-if="!collapsed"
            class="overflow-auto p-3 font-mono text-[11.5px] leading-relaxed text-neutral-100"
            :class="wrap ? 'whitespace-pre-wrap break-all' : ''"
            :style="{ maxHeight }"
            v-html="highlighted"
        />
        <button v-else type="button" class="w-full px-3 py-2 text-left font-mono text-[11px] text-neutral-400 hover:text-neutral-200" @click="collapsed = false">
            (ringkas) klik untuk menampilkan {{ lineCount }} baris JSON
        </button>
    </div>
</template>
