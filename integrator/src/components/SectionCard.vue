<script setup lang="ts">
/** SectionCard — panel standar (judul, hint, aksi, konten). */
withDefaults(
    defineProps<{
        title?: string;
        hint?: string;
        padded?: boolean;
        dense?: boolean;
    }>(),
    { title: '', hint: '', padded: true, dense: false },
);
</script>

<template>
    <section class="panel">
        <header v-if="title || $slots.actions || hint" class="panel-header">
            <div>
                <h2 v-if="title" class="panel-title">{{ title }}</h2>
                <p v-if="hint" class="panel-hint">{{ hint }}</p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
                <slot name="actions" />
            </div>
        </header>
        <div :class="padded ? (dense ? 'p-2.5' : 'p-4') : ''">
            <slot />
        </div>
        <footer v-if="$slots.footer" class="border-t border-neutral-200 px-4 py-2">
            <slot name="footer" />
        </footer>
    </section>
</template>
