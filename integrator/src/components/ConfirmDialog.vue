<script setup lang="ts">
import { computed } from 'vue';
import AppModal from './AppModal.vue';
import AppIcon from './AppIcon.vue';

/** ConfirmDialog — konfirmasi aksi berisiko (sinkronisasi, unmap, retry). */
const props = withDefaults(
    defineProps<{
        open: boolean;
        title?: string;
        message?: string;
        confirmLabel?: string;
        cancelLabel?: string;
        tone?: 'primary' | 'danger' | 'warning';
        loading?: boolean;
        requireCheckbox?: boolean;
        checkboxLabel?: string;
        checked?: boolean;
    }>(),
    {
        title: 'Konfirmasi tindakan',
        message: '',
        confirmLabel: 'Lanjutkan',
        cancelLabel: 'Batal',
        tone: 'primary',
        loading: false,
        requireCheckbox: false,
        checkboxLabel: 'Saya memahami konsekuensi tindakan ini.',
        checked: false,
    },
);

const emit = defineEmits<{ confirm: []; cancel: []; 'update:checked': [boolean] }>();

const confirmClass = computed(() => (props.tone === 'danger' ? 'btn btn-danger' : props.tone === 'warning' ? 'btn btn-brand' : 'btn btn-primary'));
const canConfirm = computed(() => !props.requireCheckbox || props.checked);
</script>

<template>
    <AppModal :open="open" :title="title" size="sm" :close-on-backdrop="false" @close="emit('cancel')">
        <div class="flex items-start gap-3">
            <AppIcon :name="tone === 'danger' ? 'alert' : tone === 'warning' ? 'info' : 'check'" :size="18" class="mt-0.5" :class="tone === 'danger' ? 'text-red-600' : tone === 'warning' ? 'text-amber-600' : 'text-neutral-700'" />
            <div class="min-w-0 flex-1 space-y-2">
                <p v-if="message" class="text-[12.5px] leading-relaxed text-neutral-700">{{ message }}</p>
                <slot />

                <label v-if="requireCheckbox" class="flex items-start gap-2 border border-neutral-200 bg-neutral-50 p-2">
                    <input type="checkbox" class="mt-0.5 h-3.5 w-3.5" :checked="checked" @change="emit('update:checked', ($event.target as HTMLInputElement).checked)" />
                    <span class="text-[12px] text-neutral-700">{{ checkboxLabel }}</span>
                </label>
            </div>
        </div>

        <template #footer>
            <button type="button" class="btn btn-secondary" :disabled="loading" @click="emit('cancel')">{{ cancelLabel }}</button>
            <button type="button" :class="confirmClass" :disabled="loading || !canConfirm" @click="emit('confirm')">
                <AppIcon v-if="loading" name="refresh" :size="13" class="animate-spin" />
                {{ loading ? 'Memproses…' : confirmLabel }}
            </button>
        </template>
    </AppModal>
</template>
