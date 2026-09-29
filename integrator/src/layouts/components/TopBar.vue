<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useUiStore } from '@/stores/ui';
import { useConnectionStore } from '@/stores/connection';
import { usePeriodStore } from '@/stores/period';
import { useRouter } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import { formatDateTime, relativeTime } from '@/utils/format';

/**
 * TopBar — konteks global: periode & prodi aktif, status koneksi, operator.
 * Periode/prodi di sini berlaku untuk seluruh modul (satu sumber kebenaran).
 */
const ui = useUiStore();
const auth = useAuthStore();
const connection = useConnectionStore();
const period = usePeriodStore();
const router = useRouter();

const signOut = async (): Promise<void> => {
    await auth.logout();
    await router.replace('/login');
};

const tokenExpiryLabel = computed(() => {
    const expires = connection.token.expiresAt;
    if (!expires) return 'belum ada token';
    return relativeTime(expires);
});

const lastRequest = computed(() => connection.status?.lastSuccessfulRequestAt ?? null);

const connectionTitle = computed(() => `Terakhir sukses: ${formatDateTime(lastRequest.value)}`);
</script>

<template>
    <header class="flex flex-wrap items-center gap-3 border-b border-neutral-200 bg-white px-4 py-2.5">
        <button type="button" class="btn btn-ghost px-1.5 lg:hidden" aria-label="Buka navigasi" @click="ui.sidebarMobileOpen = true">
            <AppIcon name="list" :size="16" />
        </button>

        <button type="button" class="btn btn-ghost hidden px-1.5 lg:inline-flex" :title="ui.sidebarCollapsed ? 'Tampilkan sidebar' : 'Sembunyikan sidebar'" @click="ui.toggleSidebar()">
            <AppIcon :name="ui.sidebarCollapsed ? 'chevron' : 'arrow_left'" :size="16" />
        </button>

        <!-- Filter global -->
        <div class="flex flex-wrap items-center gap-2">
            <label class="flex items-center gap-1.5">
                <span class="kv-label">Periode</span>
                <select class="select w-44 py-1" :value="period.selectedPeriodId ?? ''" @change="period.setPeriod(($event.target as HTMLSelectElement).value || null)">
                    <option value="">Semua periode</option>
                    <option v-for="item in period.periods" :key="item.id" :value="String(item.id)">
                        {{ item.namaSemester }}{{ item.pddiktiId ? '' : ' · belum dipetakan' }}
                    </option>
                </select>
            </label>

            <label class="flex items-center gap-1.5">
                <span class="kv-label">Prodi</span>
                <select class="select w-52 py-1" :value="period.selectedProdiId ?? ''" @change="period.setProdi(($event.target as HTMLSelectElement).value || null)">
                    <option value="">Semua program studi</option>
                    <option v-for="prodi in period.prodiOptions" :key="prodi.value" :value="prodi.value">
                        {{ prodi.label }}{{ prodi.mapped ? '' : ' · belum dipetakan' }}
                    </option>
                </select>
            </label>
        </div>

        <div class="ml-auto flex items-center gap-2">
            <RouterLink to="/connection" class="flex items-center gap-2 border border-neutral-200 px-2 py-1" :title="connectionTitle">
                <AppIcon name="plug" :size="14" class="text-neutral-500" />
                <StatusBadge :status="connection.statusLabel" kind="connection" size="md" :with-dot="true" />
                <span class="hidden text-2xs text-neutral-500 xl:inline">Token: {{ tokenExpiryLabel }}</span>
            </RouterLink>

            <div class="hidden items-center gap-2 border border-neutral-200 px-2 py-1 md:flex">
                <div class="flex h-6 w-6 items-center justify-center bg-neutral-900 text-[10px] font-bold text-white">
                    {{ auth.displayName.slice(0, 1) }}
                </div>
                <div class="leading-tight">
                    <p class="text-[11.5px] font-semibold text-neutral-800">{{ auth.displayName }}</p>
                    <p class="text-[10px] text-neutral-500">{{ auth.roleLabel }}</p>
                </div>
            </div>

            <button
                v-if="!auth.isMockMode"
                type="button"
                class="btn btn-secondary"
                :disabled="auth.loading"
                title="Akhiri sesi integrator"
                @click="signOut"
            >
                <AppIcon name="logout" :size="14" />
                <span class="hidden lg:inline">Keluar</span>
            </button>
        </div>
    </header>
</template>
