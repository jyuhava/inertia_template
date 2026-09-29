<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import PageHeader from '@/components/PageHeader.vue';
import SectionCard from '@/components/SectionCard.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import AppIcon from '@/components/AppIcon.vue';
import ErrorPanel from '@/components/ErrorPanel.vue';
import EmptyState from '@/components/EmptyState.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { useConnectionStore } from '@/stores/connection';
import { useToast } from '@/composables/useUi';
import { formatDateTime, relativeTime } from '@/utils/format';

/**
 * Koneksi Neo Feeder.
 *
 * Halaman ini menyimpan konfigurasi koneksi dan memicu uji koneksi/autentikasi
 * melalui BACKEND. Password dan token tidak pernah ditampilkan atau dikirim ke
 * frontend — form hanya menandai bahwa kredensial sudah tersimpan.
 */
const connection = useConnectionStore();
const toast = useToast();
const { profile, status, token, dictionary, events, lastTest, loading, testing, authenticating, saving, syncingDictionary } = storeToRefs(connection);

const form = ref({
    baseUrl: '',
    webServiceUrl: '',
    username: '',
    password: '',
    timeoutSeconds: 30,
    retryCount: 2,
    active: true,
    useProxy: true,
});

const confirmRefresh = ref(false);

const syncForm = (): void => {
    if (!profile.value) return;
    form.value = {
        baseUrl: profile.value.baseUrl,
        webServiceUrl: profile.value.webServiceUrl,
        username: profile.value.username,
        password: '',
        timeoutSeconds: profile.value.timeoutSeconds,
        retryCount: profile.value.retryCount,
        active: profile.value.active,
        useProxy: profile.value.useProxy,
    };
};

onMounted(async () => {
    await connection.fetch();
    syncForm();
});

const save = async (): Promise<void> => {
    const ok = await connection.save({
        profile: {
            baseUrl: form.value.baseUrl,
            webServiceUrl: form.value.webServiceUrl,
            username: form.value.username,
            timeoutSeconds: Number(form.value.timeoutSeconds),
            retryCount: Number(form.value.retryCount),
            active: form.value.active,
            useProxy: form.value.useProxy,
        },
        password: form.value.password || undefined,
    });

    if (ok) {
        form.value.password = '';
        toast.success('Konfigurasi disimpan', 'Kredensial disimpan oleh backend, tidak pernah dikirim ke frontend.');
        return;
    }
    toast.error('Gagal menyimpan konfigurasi', connection.error ? new Error(connection.error) : null);
};

const runTest = async (): Promise<void> => {
    const result = await connection.test();
    if (!result) {
        toast.error('Uji koneksi gagal', connection.error ? new Error(connection.error) : null);
        return;
    }
    if (result.status === 'CONNECTED') {
        toast.success('Koneksi berhasil', `Web service merespons dalam ${result.latencyMs ?? '—'} ms (Neo Feeder ${result.serverVersion ?? '—'}).`);
        return;
    }
    toast.plainError('Koneksi bermasalah', result.message, `status: ${result.status}`);
};

const runAuthenticate = async (): Promise<void> => {
    const ok = await connection.authenticate();
    if (ok) {
        toast.success('Autentikasi berhasil', 'Token diperbarui dan berlaku pada backend.');
        return;
    }
    toast.error('Autentikasi gagal', connection.error ? new Error(connection.error) : null);
};

const runRefresh = async (): Promise<void> => {
    confirmRefresh.value = false;
    const ok = await connection.refreshToken();
    if (ok) {
        toast.success('Token diperbarui');
        return;
    }
    toast.error('Gagal memperbarui token', connection.error ? new Error(connection.error) : null);
};

const runDictionary = async (): Promise<void> => {
    const ok = await connection.syncDictionary();
    if (ok) {
        toast.success('Dictionary tersinkron', `${dictionary.value.actCount} act terverifikasi untuk Neo Feeder ${dictionary.value.version}.`);
        return;
    }
    toast.error('Gagal mengambil dictionary', connection.error ? new Error(connection.error) : null);
};

const tokenBadge = computed(() => {
    if (!token.value.expiresAt) return { label: 'belum ada token', tone: 'border-neutral-300 bg-neutral-100 text-neutral-600' };
    const expired = new Date(token.value.expiresAt).getTime() < Date.now();
    return expired
        ? { label: 'token kedaluwarsa', tone: 'border-red-200 bg-red-50 text-red-700' }
        : { label: `berlaku sampai ${formatDateTime(token.value.expiresAt)}`, tone: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
});
</script>

<template>
    <div>
        <PageHeader
            icon="plug"
            title="Koneksi Neo Feeder"
            description="Konfigurasi Web Service Neo Feeder dan pemantauan status koneksi. Kredensial (username, password, token) hanya disimpan backend — modul ini tidak pernah menerimanya."
            hint="Endpoint standar Neo Feeder: ws/live2.php pada host aplikasi Neo Feeder (umumnya port 8082)."
        >
            <template #actions>
                <button type="button" class="btn btn-secondary" :disabled="testing" @click="runTest">
                    <AppIcon name="activity" :size="14" :class="testing ? 'animate-pulse' : ''" />
                    {{ testing ? 'Menguji…' : 'Uji Koneksi' }}
                </button>
                <button type="button" class="btn btn-secondary" :disabled="authenticating" @click="runAuthenticate">
                    <AppIcon name="shield" :size="14" />
                    Autentikasi
                </button>
                <button type="button" class="btn btn-secondary" :disabled="authenticating" @click="confirmRefresh = true">
                    <AppIcon name="refresh" :size="14" />
                    Refresh Token
                </button>
                <button type="button" class="btn btn-primary" :disabled="saving" @click="save">
                    <AppIcon name="check" :size="14" />
                    Simpan
                </button>
            </template>
        </PageHeader>

        <ErrorPanel v-if="connection.error" class="mb-4" title="Kesalahan koneksi" :message="connection.error" @retry="connection.fetch" @dismiss="connection.error = null" />

        <div class="grid grid-cols-1 gap-3 xl:grid-cols-3">
            <!-- Form konfigurasi -->
            <SectionCard class="xl:col-span-2" title="Konfigurasi Web Service" hint="Perubahan disimpan ke backend; password tidak pernah dikembalikan ke frontend." :padded="true">
                <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <label class="md:col-span-2">
                        <span class="label">Base URL Neo Feeder</span>
                        <input v-model="form.baseUrl" class="input font-mono text-[12px]" placeholder="http://10.10.20.15:8082" />
                        <span class="mt-1 block text-2xs text-neutral-500">Alamat aplikasi Neo Feeder (tanpa path web service).</span>
                    </label>

                    <label class="md:col-span-2">
                        <span class="label">Web Service URL</span>
                        <input v-model="form.webServiceUrl" class="input font-mono text-[12px]" placeholder="http://10.10.20.15:8082/ws/live2.php" />
                        <span class="mt-1 block text-2xs text-neutral-500">Pastikan endpoint ini dapat dijangkau dari server SIAKAD (biasanya hanya dari jaringan kampus).</span>
                    </label>

                    <label>
                        <span class="label">Username</span>
                        <input v-model="form.username" class="input" autocomplete="off" />
                    </label>

                    <label>
                        <span class="label">Password</span>
                        <input
                            v-model="form.password"
                            class="input"
                            type="password"
                            autocomplete="new-password"
                            :placeholder="profile?.passwordConfigured ? '•••••••• (tersimpan di backend)' : 'belum diatur'"
                        />
                        <span class="mt-1 block text-2xs text-neutral-500">Biarkan kosong bila tidak ingin mengubah password yang tersimpan.</span>
                    </label>

                    <label>
                        <span class="label">Timeout (detik)</span>
                        <input v-model.number="form.timeoutSeconds" class="input" type="number" min="5" max="300" />
                    </label>

                    <label>
                        <span class="label">Retry Count</span>
                        <input v-model.number="form.retryCount" class="input" type="number" min="0" max="5" />
                        <span class="mt-1 block text-2xs text-neutral-500">Dipakai untuk kegagalan teknis (timeout/error server), bukan kegagalan validasi.</span>
                    </label>

                    <label class="flex items-start gap-2 border border-neutral-200 bg-neutral-50 p-2">
                        <input v-model="form.active" type="checkbox" class="mt-0.5 h-3.5 w-3.5" />
                        <span>
                            <span class="block text-[12.5px] font-medium text-neutral-800">Integrasi aktif</span>
                            <span class="block text-2xs text-neutral-500">Bila dimatikan, seluruh pengiriman diblokir walau token valid.</span>
                        </span>
                    </label>

                    <label class="flex items-start gap-2 border border-neutral-200 bg-neutral-50 p-2">
                        <input v-model="form.useProxy" type="checkbox" class="mt-0.5 h-3.5 w-3.5" />
                        <span>
                            <span class="block text-[12.5px] font-medium text-neutral-800">Lewat backend (disarankan)</span>
                            <span class="block text-2xs text-neutral-500">Request dikirim backend SIAKAD sehingga kredensial tidak menyentuh browser.</span>
                        </span>
                    </label>
                </div>

                <div class="mt-4 border border-amber-200 bg-amber-50 p-3">
                    <p class="flex items-center gap-1.5 text-[12.5px] font-semibold text-amber-900">
                        <AppIcon name="shield" :size="14" />
                        Aturan keamanan yang diterapkan modul ini
                    </p>
                    <ul class="mt-1.5 list-disc space-y-0.5 pl-5 text-2xs leading-relaxed text-amber-900">
                        <li>Password Neo Feeder tidak pernah dikirim ke browser; form hanya menandai <span class="font-mono">passwordConfigured</span>.</li>
                        <li>Token tidak pernah ditampilkan, disimpan di localStorage, atau dicetak pada console.</li>
                        <li>Payload yang ditampilkan/diekspor selalu menyensor token menjadi <span class="font-mono">[HIDDEN]</span>.</li>
                        <li>Operasi hapus ke PDDikti tidak diekspos pada antarmuka operator.</li>
                    </ul>
                </div>
            </SectionCard>

            <!-- Status -->
            <div class="space-y-3">
                <SectionCard title="Status koneksi">
                    <div class="flex items-center gap-2">
                        <StatusBadge :status="status?.status ?? 'DISCONNECTED'" kind="connection" size="md" />
                        <span v-if="status?.serverVersion" class="badge border-neutral-300 bg-neutral-100 text-neutral-700">Neo Feeder {{ status.serverVersion }}</span>
                    </div>

                    <dl class="mt-3 space-y-2 text-[12px]">
                        <div class="flex justify-between gap-2">
                            <dt class="kv-label">API status</dt>
                            <dd>{{ status?.apiStatus ?? '—' }}</dd>
                        </div>
                        <div class="flex justify-between gap-2">
                            <dt class="kv-label">Koneksi terakhir</dt>
                            <dd>{{ formatDateTime(status?.lastConnectedAt) }}</dd>
                        </div>
                        <div class="flex justify-between gap-2">
                            <dt class="kv-label">Request sukses terakhir</dt>
                            <dd>{{ formatDateTime(status?.lastSuccessfulRequestAt) }}</dd>
                        </div>
                        <div class="flex justify-between gap-2">
                            <dt class="kv-label">Token</dt>
                            <dd><span class="badge" :class="tokenBadge.tone">{{ tokenBadge.label }}</span></dd>
                        </div>
                        <div class="flex justify-between gap-2">
                            <dt class="kv-label">Refresh 24 jam</dt>
                            <dd>{{ token.refreshesLast24h }}×</dd>
                        </div>
                        <div class="flex justify-between gap-2">
                            <dt class="kv-label">Kebijakan retry</dt>
                            <dd>{{ connection.retryPolicy.maxAttempts }} percobaan</dd>
                        </div>
                    </dl>

                    <p v-if="status?.message" class="mt-2 border border-red-200 bg-red-50 px-2 py-1.5 text-2xs text-red-700">{{ status.message }}</p>
                </SectionCard>

                <SectionCard title="Dictionary act" hint="Dipakai untuk memverifikasi nama field pada versi Neo Feeder terpasang.">
                    <div class="flex items-center gap-2">
                        <StatusBadge :status="dictionary.synced ? 'SUCCESS' : 'SYNC_REQUIRED'" :show-description="false" />
                        <span class="text-[12px] text-neutral-700">
                            {{ dictionary.synced ? `${dictionary.actCount} act terverifikasi` : 'belum diverifikasi' }}
                        </span>
                    </div>
                    <p class="mt-2 text-2xs leading-relaxed text-neutral-500">
                        Bila dictionary belum tersinkron, payload yang memakai schema dasar ditandai "belum diverifikasi" pada Payload Inspector. Jalankan sinkronisasi dictionary agar peringatan ini hilang.
                    </p>
                    <button type="button" class="btn btn-secondary mt-2" :disabled="syncingDictionary" @click="runDictionary">
                        <AppIcon name="sync" :size="14" :class="syncingDictionary ? 'animate-spin' : ''" />
                        {{ syncingDictionary ? 'Mengambil…' : 'Sinkronkan Dictionary' }}
                    </button>
                    <p v-if="dictionary.fetchedAt" class="mt-1 text-2xs text-neutral-500">Terakhir: {{ formatDateTime(dictionary.fetchedAt) }} (versi {{ dictionary.version }})</p>
                </SectionCard>
            </div>
        </div>

        <!-- Hasil uji koneksi + riwayat -->
        <div class="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <SectionCard title="Hasil uji koneksi terakhir">
                <EmptyState v-if="!lastTest" compact icon="activity" title="Belum ada pengujian" message="Klik 'Uji Koneksi' untuk memeriksa keterjangkauan web service dan validitas token." />
                <div v-else class="space-y-2">
                    <div class="flex flex-wrap items-center gap-2">
                        <StatusBadge :status="lastTest.status" kind="connection" />
                        <span class="text-2xs text-neutral-500">{{ formatDateTime(lastTest.checkedAt) }}</span>
                        <span v-if="lastTest.latencyMs" class="badge border-neutral-300 bg-neutral-100 text-neutral-700">{{ lastTest.latencyMs }} ms</span>
                    </div>
                    <p class="text-[12.5px] text-neutral-700">{{ lastTest.message }}</p>
                    <ul class="divide-y divide-neutral-100 border border-neutral-200">
                        <li v-for="step in lastTest.steps" :key="step.label" class="flex items-start gap-2 px-3 py-2">
                            <AppIcon :name="step.ok ? 'check' : 'x'" :size="14" :class="step.ok ? 'text-emerald-600' : 'text-red-600'" class="mt-0.5" />
                            <span class="min-w-0 flex-1">
                                <span class="block text-[12px] text-neutral-800">{{ step.label }}</span>
                                <span class="block font-mono text-[10.5px] text-neutral-500">{{ step.detail }}</span>
                            </span>
                        </li>
                    </ul>
                </div>
            </SectionCard>

            <SectionCard title="Riwayat aktivitas koneksi" :padded="false">
                <EmptyState v-if="events.length === 0" compact icon="clock" title="Belum ada aktivitas" message="Aktivitas uji koneksi, autentikasi, dan penyimpanan konfigurasi akan tampil di sini." />
                <ul v-else class="divide-y divide-neutral-100">
                    <li v-for="event in events" :key="`${event.at}-${event.action}`" class="px-3 py-2">
                        <div class="flex flex-wrap items-center gap-2">
                            <StatusBadge :status="event.status" kind="connection" :show-description="false" />
                            <span class="text-[12px] font-medium text-neutral-800">{{ event.action }}</span>
                            <span class="ml-auto text-2xs text-neutral-500">{{ relativeTime(event.at) }}</span>
                        </div>
                        <p class="mt-0.5 text-2xs text-neutral-600">{{ event.message }}</p>
                    </li>
                </ul>
            </SectionCard>
        </div>

        <ConfirmDialog
            :open="confirmRefresh"
            title="Refresh token Neo Feeder"
            message="Token saat ini akan diganti dengan token baru dari Web Service. Job sinkronisasi yang sedang berjalan tidak terpengaruh."
            confirm-label="Refresh sekarang"
            :loading="authenticating"
            @confirm="runRefresh"
            @cancel="confirmRefresh = false"
        />
    </div>
</template>
