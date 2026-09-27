<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import { useAuthStore } from '@/stores/auth';
import { useConnectionStore } from '@/stores/connection';
import { usePeriodStore } from '@/stores/period';
import { useUiStore } from '@/stores/ui';
import { useToast } from '@/composables/useUi';
import SidebarNav from './components/SidebarNav.vue';
import TopBar from './components/TopBar.vue';
import Breadcrumbs from './components/Breadcrumbs.vue';
import { appConfig } from '@/config/app.config';

/**
 * AppLayout — kerangka aplikasi: sidebar + header + breadcrumb + konten.
 * Mode mock ditandai jelas agar operator tidak salah mengira sedang
 * berkomunikasi dengan Neo Feeder sungguhan.
 */
const ui = useUiStore();
const auth = useAuthStore();
const connection = useConnectionStore();
const period = usePeriodStore();
const route = useRoute();
const toast = useToast();
const refreshing = ref(false);

onMounted(async () => {
    await Promise.all([period.load(), connection.fetch()]);
    if (connection.dictionary && !connection.dictionary.synced) {
        toast.info('Dictionary belum disinkronkan', 'Jalankan "Sinkronkan Dictionary" pada halaman Koneksi agar nama field terverifikasi.');
    }
});

watch(
    () => ui.sidebarMobileOpen,
    (open) => {
        document.body.style.overflow = open ? 'hidden' : '';
    },
);

const isMock = auth.isMockMode;

const refreshAll = async (): Promise<void> => {
    refreshing.value = true;
    try {
        await period.load(true);
        await connection.fetch();
        toast.success('Data dasar diperbarui', 'Periode, program studi, dan status koneksi dimuat ulang.');
    } finally {
        refreshing.value = false;
    }
};

const routeKey = (): string => route.fullPath;
</script>

<template>
    <div class="flex min-h-screen bg-neutral-100">
        <!-- Sidebar desktop -->
        <div class="sticky top-0 hidden h-screen lg:block">
            <SidebarNav />
        </div>

        <!-- Sidebar mobile (drawer) -->
        <div v-if="ui.sidebarMobileOpen" class="fixed inset-0 z-40 lg:hidden">
            <div class="absolute inset-0 bg-neutral-900/40" @click="ui.sidebarMobileOpen = false" />
            <div class="absolute left-0 top-0 h-full">
                <SidebarNav />
            </div>
        </div>

        <div class="flex min-w-0 flex-1 flex-col">
            <TopBar />

            <div class="flex flex-wrap items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-4 py-1.5">
                <Breadcrumbs />
                <div class="ml-auto flex items-center gap-2">
                    <span v-if="isMock" class="badge border-amber-300 bg-amber-100 text-amber-800" title="VITE_MOCK_MODE=true — seluruh request dilayani mock adapter di browser">
                        MOCK MODE
                    </span>
                    <span v-if="!connection.dictionary.synced" class="badge border-amber-200 bg-amber-50 text-amber-800" title="Daftar field act belum diverifikasi terhadap dictionary versi Neo Feeder terpasang">
                        Dictionary belum diverifikasi
                    </span>
                    <button type="button" class="btn btn-ghost btn-xs" :disabled="refreshing" @click="refreshAll">
                        <AppIcon name="refresh" :size="13" :class="refreshing ? 'animate-spin' : ''" />
                        Muat ulang konteks
                    </button>
                </div>
            </div>

            <main :key="routeKey()" class="min-w-0 flex-1 px-4 py-4 lg:px-6 lg:py-5">
                <slot />
            </main>

            <footer class="border-t border-neutral-200 bg-white px-4 py-2 text-2xs text-neutral-500">
                <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>{{ appConfig.appName }} v0.1</span>
                    <span>Sumber data: SIAKAD · Target: PDDikti Neo Feeder</span>
                    <span v-if="connection.status?.serverVersion">Neo Feeder {{ connection.status.serverVersion }}</span>
                    <RouterLink to="/panduan" class="hover:text-neutral-800 hover:underline">Panduan</RouterLink>
                </div>
            </footer>
        </div>
    </div>
</template>
