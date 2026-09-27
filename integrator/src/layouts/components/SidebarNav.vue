<script setup lang="ts">
import { computed, ref } from 'vue';
import { entityGroupLabels, entityList } from '@/config/entities';
import AppIcon from '@/components/AppIcon.vue';
import { useUiStore } from '@/stores/ui';
import { useAuthStore } from '@/stores/auth';

/**
 * SidebarNav — navigasi utama integrator.
 * Dapat diciutkan (collapse) dan menjadi drawer pada layar kecil.
 */
const ui = useUiStore();
const auth = useAuthStore();

const groups = computed(() => {
    const map = new Map<string, { label: string; items: { label: string; route: string; icon: string }[] }>();

    map.set('ringkasan', {
        label: 'Ringkasan',
        items: [
            { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
            { label: 'Monitoring', route: '/monitoring', icon: 'activity' },
        ],
    });

    map.set('konfigurasi', {
        label: 'Konfigurasi',
        items: [
            { label: 'Koneksi Neo Feeder', route: '/connection', icon: 'plug' },
            { label: 'Referensi PDDikti', route: '/references', icon: 'book' },
        ],
    });

    map.set('pemetaan', {
        label: 'Pemetaan',
        items: [
            { label: 'Mapping Center', route: '/mapping', icon: 'map' },
            { label: 'Program Studi', route: '/mapping/prodi', icon: 'academic-cap' },
            { label: 'Mahasiswa', route: '/mapping/mahasiswa', icon: 'users' },
            { label: 'Dosen', route: '/mapping/dosen', icon: 'user-tie' },
            { label: 'Mata Kuliah', route: '/mapping/mata-kuliah', icon: 'book' },
            { label: 'Semester', route: '/mapping/semester', icon: 'calendar' },
        ],
    });

    map.set('akademik', {
        label: 'Data Akademik',
        items: entityList.map((definition) => ({
            label: definition.label,
            route: `/${definition.route}`,
            icon: definition.icon,
        })),
    });

    map.set('sinkronisasi', {
        label: 'Sinkronisasi',
        items: [
            { label: 'Synchronization Center', route: '/synchronization', icon: 'sync' },
            { label: 'Sync Wizard', route: '/synchronization/wizard', icon: 'play' },
            { label: 'Log & Audit', route: '/logs', icon: 'file' },
            { label: 'Validation Center', route: '/validation', icon: 'shield' },
        ],
    });

    map.set('bantuan', {
        label: 'Bantuan',
        items: [{ label: 'Panduan Integrator', route: '/panduan', icon: 'info' }],
    });

    return Array.from(map.values());
});

const expanded = ref<Record<string, boolean>>({ pemetaan: true, akademik: false, sinkronisasi: true });

const toggle = (key: string): void => {
    expanded.value = { ...expanded.value, [key]: !expanded.value[key] };
};

const isCollapsed = computed(() => ui.sidebarCollapsed);
const entityGroupHint = (group: string): string => entityGroupLabels[group as never] ?? group;
</script>

<template>
    <aside
        class="flex h-full flex-col border-r border-neutral-200 bg-white transition-all"
        :class="isCollapsed ? 'w-[62px]' : 'w-[248px]'"
    >
        <!-- Identitas institusi -->
        <div class="flex items-center gap-2 border-b border-neutral-200 px-3 py-3">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center border border-neutral-900 bg-neutral-900 font-mono text-[11px] font-bold text-brand-400">
                PD
            </div>
            <div v-if="!isCollapsed" class="min-w-0">
                <p class="truncate text-[12.5px] font-semibold text-neutral-900">Integrator PDDikti</p>
                <p class="truncate text-2xs text-neutral-500">{{ auth.institution }}</p>
            </div>
        </div>

        <nav class="flex-1 overflow-y-auto pb-6">
            <template v-for="group in groups" :key="group.label">
                <button
                    v-if="group.items.length > 4"
                    type="button"
                    class="nav-section flex w-full items-center justify-between hover:text-neutral-700"
                    @click="toggle(group.label.toLowerCase())"
                >
                    <span>{{ isCollapsed ? '•••' : group.label }}</span>
                    <AppIcon v-if="!isCollapsed" :name="expanded[group.label.toLowerCase()] ? 'chevron-down' : 'chevron'" :size="12" />
                </button>
                <p v-else class="nav-section">{{ isCollapsed ? '•••' : group.label }}</p>

                <template v-if="group.items.length <= 4 || expanded[group.label.toLowerCase()] || isCollapsed">
                    <RouterLink
                        v-for="item in group.items"
                        :key="item.route"
                        :to="item.route"
                        class="nav-item"
                        :class="{ 'nav-item-active': $route.path === item.route || $route.path.startsWith(`${item.route}/`) }"
                        :title="item.label"
                        @click="ui.sidebarMobileOpen = false"
                    >
                        <AppIcon :name="item.icon" :size="15" class="shrink-0" />
                        <span v-if="!isCollapsed" class="truncate">{{ item.label }}</span>
                    </RouterLink>
                </template>
            </template>
        </nav>

        <div v-if="!isCollapsed" class="border-t border-neutral-200 px-3 py-2">
            <p class="text-[10px] leading-relaxed text-neutral-500">
                SIAKAD tetap sumber data utama. Integrator hanya memetakan, memvalidasi, dan mengirim ke Neo Feeder.
            </p>
        </div>
    </aside>
</template>
