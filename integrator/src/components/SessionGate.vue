<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import { useAuthStore } from '@/stores/auth';

/**
 * SessionGate — menahan tampilan sampai sesi operator diketahui.
 * Ini BUKAN halaman login publik: akses tetap dikendalikan backend SIAKAD
 * (middleware auth + role:admin). Bila sesi tidak valid, operator diberi
 * penjelasan dan tautan ke SIAKAD.
 */
const auth = useAuthStore();

const blocked = computed(() => auth.ready && !auth.isAuthenticated);
</script>

<template>
    <div v-if="!auth.ready" class="flex min-h-screen items-center justify-center bg-neutral-100">
        <div class="flex items-center gap-3 text-[13px] text-neutral-600">
            <span class="h-3 w-3 animate-pulse rounded-full bg-neutral-400" />
            Memuat sesi operator…
        </div>
    </div>

    <div v-else-if="blocked" class="flex min-h-screen items-center justify-center bg-neutral-100 p-6">
        <div class="panel w-full max-w-lg p-6">
            <div class="flex items-start gap-3">
                <AppIcon name="shield" :size="22" class="mt-0.5 text-amber-600" />
                <div>
                    <h1 class="text-[15px] font-semibold text-neutral-900">Sesi operator tidak tersedia</h1>
                    <p class="mt-1 text-[12.5px] leading-relaxed text-neutral-600">
                        {{ auth.error ?? 'Modul integrator membutuhkan sesi admin SIAKAD yang aktif.' }}
                    </p>
                    <ul class="mt-3 space-y-1 text-[12px] text-neutral-600">
                        <li>• Pastikan Anda sudah login pada SIAKAD (peran admin).</li>
                        <li>• Endpoint <code class="font-mono text-[11px]">/api/integrator/session</code> harus tersedia pada backend.</li>
                        <li>• Pada mode mock, sesi dummy otomatis dibuat sehingga modul dapat diuji tanpa backend.</li>
                    </ul>
                    <div class="mt-4 flex gap-2">
                        <button type="button" class="btn btn-secondary" @click="auth.bootstrap()">
                            <AppIcon name="refresh" :size="14" />
                            Coba lagi
                        </button>
                        <a class="btn btn-primary" href="/login">Buka halaman login SIAKAD</a>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <slot v-else />
</template>
