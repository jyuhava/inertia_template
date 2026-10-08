<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import { useAuthStore } from '@/stores/auth';
import { appConfig } from '@/config/app.config';

/**
 * SessionGate — menahan tampilan sampai sesi operator diketahui.
 *
 * Frontend integrator dapat dilayani pada subdomain terpisah dari SIAKAD
 * (mis. feeder.alwafi.ac.id). Pada susunan itu cookie sesi SIAKAD tidak
 * otomatis tersedia, sehingga saat sesi kosong operator diberi form login
 * (bukan sekadar penjelasan), lalu seluruh aplikasi baru dirender.
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

    <RouterView v-else-if="blocked && $route.name === 'login'" />

    <div v-else-if="blocked" class="flex min-h-screen items-center justify-center bg-neutral-100 p-6">
        <div class="panel w-full max-w-lg p-6">
            <div class="flex items-start gap-3">
                <AppIcon name="shield" :size="22" class="mt-0.5 text-amber-600" />
                <div>
                    <h1 class="text-[15px] font-semibold text-neutral-900">Sesi operator tidak tersedia</h1>
                    <p class="mt-1 text-[12.5px] leading-relaxed text-neutral-600">
                        {{ auth.error ?? 'Modul integrator membutuhkan sesi SIAKAD yang aktif.' }}
                    </p>
                    <ul class="mt-3 space-y-1 text-[12px] text-neutral-600">
                        <li>• Masuk dengan akun SIAKAD peran admin untuk membuka modul.</li>
                        <li>
                            • Endpoint <code class="font-mono text-[11px]">/api/integrator/session</code> harus
                            tersedia pada backend.
                        </li>
                        <li v-if="appConfig.mockMode">• Pada mode mock, sesi dummy otomatis dibuat.</li>
                    </ul>
                    <div class="mt-4 flex gap-2">
                        <button type="button" class="btn btn-secondary" :disabled="auth.loading" @click="auth.bootstrap()">
                            <AppIcon name="refresh" :size="14" />
                            Coba lagi
                        </button>
                        <RouterLink class="btn btn-primary" to="/login">Masuk</RouterLink>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <slot v-else />
</template>
