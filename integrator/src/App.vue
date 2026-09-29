<script setup lang="ts">
import { onMounted } from 'vue';
import AppLayout from '@/layouts/AppLayout.vue';
import ToastHost from '@/components/ToastHost.vue';
import SessionGate from '@/components/SessionGate.vue';
import { useAuthStore } from '@/stores/auth';

/**
 * Akar aplikasi integrator.
 * Layout, notifikasi, dan gerbang sesi operator (bukan halaman login publik).
 */
const auth = useAuthStore();

onMounted(() => {
    void auth.bootstrap();
});
</script>

<template>
    <SessionGate>
        <AppLayout>
            <RouterView v-slot="{ Component, route }">
                <component :is="Component" :key="route.path" />
            </RouterView>
        </AppLayout>
    </SessionGate>
    <ToastHost />
</template>
