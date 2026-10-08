<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

/**
 * Breadcrumbs — jejak navigasi berbasis meta route (grup → halaman).
 */
const route = useRoute();

const crumbs = computed(() => {
    const items: { label: string; to?: string }[] = [{ label: 'Integrator', to: '/dashboard' }];
    const group = route.meta.group as string | undefined;
    if (group) items.push({ label: group });
    items.push({ label: (route.meta.title as string | undefined) ?? 'Dashboard' });

    if (route.params.id) {
        items.push({ label: `#${String(route.params.id)}` });
    }

    return items;
});
</script>

<template>
    <nav class="flex flex-wrap items-center gap-1.5 text-2xs text-neutral-500" aria-label="Breadcrumb">
        <template v-for="(crumb, index) in crumbs" :key="`${crumb.label}-${index}`">
            <RouterLink v-if="crumb.to && index < crumbs.length - 1" :to="crumb.to" class="hover:text-neutral-800 hover:underline">
                {{ crumb.label }}
            </RouterLink>
            <span v-else class="font-semibold text-neutral-700">{{ crumb.label }}</span>
            <span v-if="index < crumbs.length - 1" class="text-neutral-500">/</span>
        </template>
    </nav>
</template>
