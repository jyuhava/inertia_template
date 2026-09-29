<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import { useAuthStore } from '@/stores/auth';
import { appConfig } from '@/config/app.config';

/**
 * Layar login operator integrator.
 *
 * Muncul ketika sesi SIAKAD tidak tersedia. Modul integrator dapat dilayani
 * pada subdomain terpisah dari SIAKAD (mis. feeder.alwafi.ac.id); pada
 * susunan itu cookie sesi SIAKAD tidak otomatis ikut, sehingga operator perlu
 * login di sini. Password tidak pernah disimpan di frontend.
 */
const auth = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const remember = ref(false);

// Sesi sudah ada (mis. tombol "kembali" pada peramban setelah reload):
// langsung arahkan ke dashboard, jangan tampilkan form lagi.
watch(
    () => auth.isAuthenticated,
    (isAuthenticated) => {
        if (isAuthenticated && router.currentRoute.value.name === 'login') {
            void router.replace('/dashboard');
        }
    },
);

const submit = async (): Promise<void> => {
    if (!email.value || !password.value || auth.loading) return;
    await auth.login(email.value, password.value, remember.value);
    password.value = '';
};
</script>

<template>
    <div class="flex min-h-screen items-center justify-center bg-neutral-100 p-6">
        <div class="panel w-full max-w-sm p-6">
            <div class="flex items-start gap-3">
                <AppIcon name="shield" :size="22" class="mt-0.5 text-brand-600" />
                <div class="min-w-0 flex-1">
                    <h1 class="text-[15px] font-semibold text-neutral-900">{{ appConfig.appName }}</h1>
                    <p class="mt-1 text-[12.5px] leading-relaxed text-neutral-600">
                        Masuk dengan akun SIAKAD yang memiliki akses Integrator (peran admin).
                    </p>
                </div>
            </div>

            <form class="mt-5 space-y-3" @submit.prevent="submit">
                <label class="block">
                    <span class="label">Email</span>
                    <input
                        v-model="email"
                        class="input"
                        type="email"
                        name="email"
                        autocomplete="username"
                        required
                        :disabled="auth.loading"
                    />
                </label>

                <label class="block">
                    <span class="label">Password</span>
                    <input
                        v-model="password"
                        class="input"
                        type="password"
                        name="password"
                        autocomplete="current-password"
                        required
                        :disabled="auth.loading"
                    />
                </label>

                <label class="flex items-center gap-2 text-[12px] text-neutral-600">
                    <input v-model="remember" type="checkbox" :disabled="auth.loading" />
                    Ingat saya di perangkat ini
                </label>

                <p
                    v-if="auth.error"
                    class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700"
                    role="alert"
                >
                    {{ auth.error }}
                </p>

                <button type="submit" class="btn btn-primary w-full justify-center" :disabled="auth.loading">
                    <AppIcon v-if="auth.loading" name="refresh" :size="14" class="animate-spin" />
                    {{ auth.loading ? 'Memproses…' : 'Masuk' }}
                </button>
            </form>

            <p v-if="!appConfig.mockMode" class="mt-4 text-2xs leading-relaxed text-neutral-500">
                Sesi disimpan sebagai cookie pada domain {{ appConfig.siakadApiUrl }} dan hanya berlaku untuk
                origin tersebut. Kredensial hanya dikirim ke backend SIAKAD, tidak pernah disimpan di peramban.
            </p>
        </div>
    </div>
</template>
