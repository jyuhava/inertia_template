<script setup lang="ts">
import PageHeader from '@/components/PageHeader.vue';
import AppIcon from '@/components/AppIcon.vue';

/** NotFound — halaman tidak ditemukan dengan tautan pemulihan. */
const suggestions = [
    { label: 'Dashboard', route: '/dashboard', description: 'Ringkasan kesiapan data' },
    { label: 'Mapping Center', route: '/mapping', description: 'Pemetaan SIAKAD ↔ PDDIKTI' },
    { label: 'Sinkronisasi', route: '/synchronization', description: 'Job dan riwayat pengiriman' },
    { label: 'Validation Center', route: '/validation', description: 'Temuan validasi data' },
];
</script>

<template>
    <div>
        <PageHeader icon="alert" title="Halaman tidak ditemukan" description="Alamat yang Anda tuju tidak tersedia pada modul integrator. Gunakan tautan di bawah untuk melanjutkan." />

        <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <RouterLink v-for="item in suggestions" :key="item.route" :to="item.route" class="panel flex items-start gap-2 p-3 hover:border-neutral-400">
                <AppIcon name="chevron" :size="15" class="mt-0.5 text-neutral-400" />
                <span>
                    <span class="block text-[12.5px] font-semibold text-neutral-800">{{ item.label }}</span>
                    <span class="block text-2xs text-neutral-500">{{ item.description }}</span>
                </span>
            </RouterLink>
        </div>
    </div>
</template>
