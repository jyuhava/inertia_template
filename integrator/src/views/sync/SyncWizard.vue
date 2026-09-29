<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import PageHeader from '@/components/PageHeader.vue';
import SectionCard from '@/components/SectionCard.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import ValidationPanel from '@/components/ValidationPanel.vue';
import PayloadViewer from '@/components/PayloadViewer.vue';
import SyncProgress from '@/components/SyncProgress.vue';
import StatCard from '@/components/StatCard.vue';
import EmptyState from '@/components/EmptyState.vue';
import AppIcon from '@/components/AppIcon.vue';
import { useSyncStore } from '@/stores/sync';
import { useJobMonitor } from '@/composables/useJobMonitor';
import { usePeriodStore } from '@/stores/period';
import { useMappingStore } from '@/stores/mapping';
import { SiakadService } from '@/services/SiakadService';
import { SyncService } from '@/services/SyncService';
import { entityDefinitions, entityList } from '@/config/entities';
import { getSyncStep } from '@/config/syncOrder';
import { useToast } from '@/composables/useUi';
import { formatDuration, formatNumber } from '@/utils/format';
import type { EntityKey, ValidationIssue } from '@/types/integration';

/**
 * Sync Wizard — alur terpandu sembilan langkah:
 * 1 periode → 2 prodi → 3 entitas → 4 pemeriksaan pemetaan → 5 validasi →
 * 6 pratinjau → 7 konfirmasi → 8 sinkronisasi → 9 hasil.
 */
const sync = useSyncStore();
const period = usePeriodStore();
const mapping = useMappingStore();
const router = useRouter();
const toast = useToast();
const { preview, plan } = storeToRefs(sync);

const {
    job: activeJob,
    retryableCount,
    retryFailed: retryActiveJob,
    cancel: cancelActiveJob,
    watch: watchJob,
} = useJobMonitor({
    onFinished: () => {
        void sync.loadJobs({ page: 1 });
    },
});

const step = ref(1);
const selectedEntity = ref<EntityKey | null>(null);
const candidateIds = ref<string[]>([]);
const candidateRows = ref<Record<string, unknown>[]>([]);
const validationIssues = ref<ValidationIssue[]>([]);
const loadingCandidates = ref(false);
const confirmed = ref(false);

const steps = [
    { index: 1, label: 'Pilih Periode' },
    { index: 2, label: 'Pilih Program Studi' },
    { index: 3, label: 'Pilih Entitas' },
    { index: 4, label: 'Pemeriksaan Pemetaan' },
    { index: 5, label: 'Validasi' },
    { index: 6, label: 'Pratinjau Payload' },
    { index: 7, label: 'Konfirmasi' },
    { index: 8, label: 'Sinkronisasi' },
    { index: 9, label: 'Hasil' },
];

const definition = computed(() => (selectedEntity.value ? entityDefinitions[selectedEntity.value] : null));
const syncStep = computed(() => (selectedEntity.value ? getSyncStep(selectedEntity.value) : null));

const requiredMappings = computed(() => {
    if (!syncStep.value) return [];
    return syncStep.value.dependsOn.map((dependency) => ({
        entity: dependency,
        label: entityDefinitions[dependency].label,
        stats: mapping.summary.find((item) => item.entity === dependency) ?? null,
    }));
});

const mappingReady = computed(() => requiredMappings.value.every((item) => (item.stats ? item.stats.unmapped + item.stats.conflict === 0 : true)));

const blockingIssues = computed(() => validationIssues.value.filter((issue) => issue.severity === 'critical' || issue.severity === 'error'));

const entityOptions = computed(() =>
    entityList
        .filter((item) => item.acts.syncCapability !== 'read-only')
        .map((item) => ({
            key: item.key,
            label: item.label,
            capability: item.acts.syncCapability,
            note: item.acts.capabilityNote,
            order: getSyncStep(item.key)?.order ?? 99,
        }))
        .sort((a, b) => a.order - b.order),
);

onMounted(async () => {
    await Promise.all([period.load(true), sync.loadOrder(), mapping.loadSummary(true)]);
});

watch(step, async (value) => {
    if (value === 4) await mapping.loadSummary(true);
    if (value === 5) await runValidation();
});

/* ------------------------------------------------------------- langkah 3--- */
const loadCandidates = async (): Promise<void> => {
    if (!selectedEntity.value) return;
    loadingCandidates.value = true;
    try {
        const response = await SiakadService.listEntity(selectedEntity.value, {
            page: 1,
            perPage: 250,
            filters: { periodId: period.selectedPeriodId ?? undefined, prodiId: period.selectedProdiId ?? undefined },
        });

        candidateRows.value = response.data as unknown as Record<string, unknown>[];
        candidateIds.value = (response.data as unknown as Record<string, unknown>[])
            .filter((row) => ['NEW', 'CHANGED', 'FAILED', 'SYNC_REQUIRED'].includes(String(row.dataStatus)))
            .map((row) => String(row.localId));

        if (candidateIds.value.length === 0) {
            toast.info('Tidak ada data yang perlu dikirim', 'Seluruh data pada periode/prodi ini sudah sinkron atau belum dipetakan.');
        }
    } catch (caught) {
        toast.error('Gagal memuat kandidat data', caught instanceof Error ? caught : null);
    } finally {
        loadingCandidates.value = false;
    }
};

/* ------------------------------------------------------------- langkah 5--- */
const runValidation = async (): Promise<void> => {
    if (!selectedEntity.value || candidateIds.value.length === 0) return;
    try {
        const response = await SiakadService.validateSelection(selectedEntity.value, candidateIds.value);
        validationIssues.value = response.issues;
    } catch (caught) {
        toast.error('Validasi gagal dijalankan', caught instanceof Error ? caught : null);
    }
};

/* ------------------------------------------------------------- langkah 6--- */
const runPreview = async (): Promise<void> => {
    if (!selectedEntity.value) return;
    const response = await sync.prepare(selectedEntity.value, candidateIds.value);
    if (!response) {
        toast.error('Gagal menyusun pratinjau', sync.error ? new Error(sync.error) : null);
        return;
    }
    confirmed.value = false;
};

/* ------------------------------------------------------------- langkah 8--- */
const startSync = async (): Promise<void> => {
    if (!selectedEntity.value || !preview.value) return;
    const ids = SyncService.sendableIds(preview.value);
    if (ids.length === 0) {
        toast.warning('Tidak ada data yang dapat dikirim', 'Semua kandidat memiliki masalah validasi atau dependency.');
        return;
    }

    const job = await sync.confirmAndRun({
        entity: selectedEntity.value,
        ids,
        dryRun: sync.dryRun,
        periodId: period.selectedPeriodId,
        periodLabel: period.periodLabel,
        prodiId: period.selectedProdiId,
        prodiLabel: period.prodiLabel,
    });

    if (!job) {
        toast.error('Job gagal dibuat', sync.error ? new Error(sync.error) : null);
        return;
    }

    watchJob(job.id, job);
    toast.success(sync.dryRun ? 'DRY RUN dijalankan' : 'Sinkronisasi dimulai', `Job ${job.id} memproses ${ids.length} data.`);
    step.value = 9;
};

const next = async (): Promise<void> => {
    if (step.value === 1 && !period.selectedPeriodId) {
        toast.warning('Pilih periode terlebih dahulu');
        return;
    }
    if (step.value === 3 && selectedEntity.value) {
        await loadCandidates();
    }
    if (step.value === 6) {
        await runPreview();
    }
    step.value = Math.min(9, step.value + 1);
};

const back = (): void => {
    step.value = Math.max(1, step.value - 1);
};

const reset = (): void => {
    step.value = 1;
    selectedEntity.value = null;
    candidateIds.value = [];
    candidateRows.value = [];
    validationIssues.value = [];
    confirmed.value = false;
    sync.reset();
};

const validationHint = computed(() => `${candidateIds.value.length} data berstatus Akan dikirim / Perlu update / Gagal pada konteks terpilih.`);

const stepSummary = computed(() => {
    const parts = [`Langkah ${step.value} dari 9 · ${steps[step.value - 1]?.label}`];
    if (selectedEntity.value) parts.push(`entitas: ${definition.value?.label}`);
    if (sync.dryRun) parts.push('mode DRY RUN');
    return parts.join(' · ');
});

</script>

<template>
    <div>
        <PageHeader
            icon="play"
            title="Sync Wizard"
            description="Alur terpandu untuk melaporkan data akademik ke PDDikti: pilih periode, program studi, entitas, periksa pemetaan, validasi, pratinjau payload, konfirmasi, lalu jalankan sinkronisasi."
            hint="Setiap langkah bersifat wajib dilewati secara berurutan. Tidak ada data yang dikirim sebelum langkah konfirmasi."
        >
            <template #actions>
                <RouterLink to="/synchronization" class="btn btn-secondary">
                    <AppIcon name="arrow_left" :size="14" />
                    Synchronization Center
                </RouterLink>
                <button type="button" class="btn btn-secondary" @click="reset">
                    <AppIcon name="refresh" :size="14" />
                    Mulai ulang
                </button>
            </template>
        </PageHeader>

        <!-- Indikator langkah -->
        <ol class="mb-4 flex flex-wrap items-center gap-1">
            <li v-for="item in steps" :key="item.index" class="flex items-center gap-1">
                <button
                    type="button"
                    class="flex items-center gap-1.5 border px-2 py-1 text-2xs font-semibold uppercase tracking-wide transition"
                    :class="
                        step === item.index
                            ? 'border-neutral-900 bg-neutral-900 text-white'
                            : step > item.index
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-neutral-300 bg-white text-neutral-500'
                    "
                    @click="step > item.index ? (step = item.index) : undefined"
                >
                    <span>{{ item.index }}</span>
                    <span class="hidden md:inline">{{ item.label }}</span>
                </button>
                <AppIcon v-if="item.index < 9" name="chevron" :size="12" class="text-neutral-300" />
            </li>
        </ol>

        <!-- Langkah 1: periode -->
        <SectionCard v-if="step === 1" title="Langkah 1 · Pilih periode pelaporan" hint="Periode menentukan id_semester pada seluruh payload.">
            <div class="grid grid-cols-1 gap-2 md:grid-cols-3">
                <button
                    v-for="item in period.periods"
                    :key="item.id"
                    type="button"
                    class="border px-3 py-2 text-left transition"
                    :class="String(item.id) === period.selectedPeriodId ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400'"
                    @click="period.setPeriod(String(item.id))"
                >
                    <div class="flex items-center justify-between gap-2">
                        <span class="text-[12.5px] font-medium text-neutral-800">{{ item.namaSemester }}</span>
                        <StatusBadge :status="item.pddiktiId ? 'MAPPED' : 'UNMAPPED'" kind="mapping" :show-description="false" />
                    </div>
                    <p class="mt-0.5 font-mono text-[10.5px] text-neutral-500">kode SIAKAD {{ item.kode }} · PDDikti {{ item.pddiktiKode ?? '—' }}</p>
                    <p class="text-2xs text-neutral-500">{{ item.status }}</p>
                </button>
            </div>
            <p class="mt-2 text-2xs text-neutral-500">Semester yang belum dipetakan tidak dapat dipakai pada payload — selesaikan pemetaannya di Mapping Center → Semester.</p>
        </SectionCard>

        <!-- Langkah 2: prodi -->
        <SectionCard v-else-if="step === 2" title="Langkah 2 · Pilih program studi" hint="Kosongkan untuk menproses seluruh program studi.">
            <div class="flex flex-wrap gap-2">
                <button
                    type="button"
                    class="border px-3 py-1.5 text-[12.5px]"
                    :class="period.selectedProdiId === null ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200'"
                    @click="period.setProdi(null)"
                >
                    Semua program studi
                </button>
                <button
                    v-for="prodi in period.prodiOptions"
                    :key="prodi.value"
                    type="button"
                    class="flex items-center gap-2 border px-3 py-1.5 text-[12.5px]"
                    :class="period.selectedProdiId === prodi.value ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400'"
                    @click="period.setProdi(prodi.value)"
                >
                    <StatusBadge :status="prodi.mapped ? 'MAPPED' : 'UNMAPPED'" kind="mapping" :show-description="false" />
                    {{ prodi.label }}
                </button>
            </div>
        </SectionCard>

        <!-- Langkah 3: entity -->
        <SectionCard v-else-if="step === 3" title="Langkah 3 · Pilih entitas yang akan disinkronkan" hint="Urutan mengikuti dependency; entitas turunan tidak dijalankan bila induk belum siap." :padded="false">
            <div class="divide-y divide-neutral-100">
                <button
                    v-for="option in entityOptions"
                    :key="option.key"
                    type="button"
                    class="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-brand-50/50"
                    :class="selectedEntity === option.key ? 'bg-brand-50' : ''"
                    @click="selectedEntity = option.key"
                >
                    <span class="mt-0.5 font-mono text-[11px] text-neutral-500">{{ String(option.order).padStart(2, '0') }}</span>
                    <AppIcon :name="entityDefinitions[option.key].icon" :size="15" class="mt-0.5 text-neutral-500" />
                    <span class="min-w-0 flex-1">
                        <span class="block text-[12.5px] font-medium text-neutral-800">{{ option.label }}</span>
                        <span class="block text-2xs leading-relaxed text-neutral-500">{{ option.note }}</span>
                    </span>
                    <span class="badge border-neutral-300 bg-neutral-100 text-neutral-600">{{ option.capability === 'update-only' ? 'update saja' : 'kirim + update' }}</span>
                </button>
            </div>
        </SectionCard>

        <!-- Langkah 4: mapping check -->
        <SectionCard v-else-if="step === 4" title="Langkah 4 · Pemeriksaan pemetaan" hint="Sinkronisasi hanya dijalankan bila seluruh entitas induk sudah memiliki ID PDDikti." :padded="false">
            <EmptyState v-if="!selectedEntity" compact icon="map" title="Entitas belum dipilih" message="Kembali ke langkah 3 untuk memilih entitas." />
            <template v-else>
                <ul class="divide-y divide-neutral-100">
                    <li v-for="item in requiredMappings" :key="item.entity" class="flex flex-wrap items-center gap-3 px-3 py-2.5">
                        <span class="min-w-0 flex-1 text-[12.5px] font-medium text-neutral-800">{{ item.label }}</span>
                        <span v-if="item.stats" class="text-2xs text-neutral-600">
                            {{ formatNumber(item.stats.mapped) }}/{{ formatNumber(item.stats.total) }} terpetakan · {{ item.stats.unmapped }} belum · {{ item.stats.conflict }} konflik
                        </span>
                        <StatusBadge :status="item.stats && item.stats.unmapped + item.stats.conflict === 0 ? 'MAPPED' : 'UNMAPPED'" kind="mapping" />
                    </li>
                    <li v-if="requiredMappings.length === 0" class="px-3 py-3 text-[12.5px] text-neutral-600">Entitas ini tidak memerlukan pemetaan entitas induk.</li>
                </ul>

                <div class="border-t border-neutral-200 bg-neutral-50 px-3 py-2.5">
                    <p v-if="mappingReady" class="flex items-center gap-1.5 text-[12.5px] text-emerald-700">
                        <AppIcon name="check" :size="14" />
                        Pemetaan entitas induk sudah lengkap. Anda dapat melanjutkan ke validasi.
                    </p>
                    <div v-else class="text-[12.5px] text-red-700">
                        <p class="flex items-center gap-1.5 font-semibold">
                            <AppIcon name="alert" :size="14" />
                            Pemetaan belum lengkap sehingga sinkronisasi akan diblokir.
                        </p>
                        <RouterLink to="/mapping" class="btn btn-secondary btn-xs mt-2">
                            <AppIcon name="map" :size="12" />
                            Buka Mapping Center
                        </RouterLink>
                    </div>
                </div>
            </template>
        </SectionCard>

        <!-- Langkah 5: validasi -->
        <SectionCard v-else-if="step === 5" title="Langkah 5 · Validasi data kandidat" :hint="validationHint" :padded="false">
            <div v-if="loadingCandidates" class="p-4 text-[12.5px] text-neutral-500">Memuat kandidat data…</div>
            <EmptyState v-else-if="candidateIds.length === 0" compact icon="check" title="Tidak ada data yang perlu dikirim" message="Seluruh data pada periode/prodi ini sudah sinkron atau belum dipetakan. Tidak ada yang perlu divalidasi." />
            <ValidationPanel v-else :issues="validationIssues" title="Temuan validasi kandidat" max-height="460px" />
            <div v-if="candidateIds.length > 0" class="border-t border-neutral-200 bg-neutral-50 px-3 py-2 text-2xs text-neutral-600">
                {{ blockingIssues.length }} temuan memblokir. Data dengan temuan blocking tidak akan disertakan pada pengiriman.
            </div>
        </SectionCard>

        <!-- Langkah 6: pratinjau -->
        <SectionCard v-else-if="step === 6" title="Langkah 6 · Pratinjau payload" hint="Periksa envelope { act, token, record } sebelum dikirim." :padded="false">
            <div v-if="!preview" class="p-4">
                <EmptyState compact icon="eye" title="Pratinjau belum dibuat" message="Tekan Lanjut untuk membentuk payload dari data kandidat." />
            </div>
            <template v-else>
                <div v-if="plan" class="grid grid-cols-2 gap-2 border-b border-neutral-200 p-3 md:grid-cols-4">
                    <StatCard label="Siap dikirim" :value="plan.willSend + plan.willUpdate" tone="success" compact />
                    <StatCard label="Data baru" :value="plan.willSend" tone="accent" compact />
                    <StatCard label="Update" :value="plan.willUpdate" tone="warning" compact />
                    <StatCard label="Tidak boleh dikirim" :value="plan.invalid + plan.blocked" tone="danger" compact />
                </div>

                <div class="max-h-[52vh] overflow-y-auto p-3">
                    <div v-for="item in preview.items.slice(0, 25)" :key="item.localId" class="mb-3 border border-neutral-200">
                        <div class="flex flex-wrap items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-3 py-2">
                            <StatusBadge :status="item.status" :show-description="false" />
                            <span class="min-w-0 flex-1 truncate text-[12.5px] text-neutral-800">{{ item.localLabel }}</span>
                            <span class="badge border-neutral-300 bg-neutral-100 font-mono text-neutral-700">{{ item.act }}</span>
                            <span class="badge border-neutral-300 bg-neutral-100 text-neutral-700">{{ item.action }}</span>
                        </div>
                        <div class="p-2">
                            <PayloadViewer :item="item" :show-envelope="true" max-height="220px" />
                        </div>
                    </div>
                    <p v-if="preview.items.length > 25" class="text-2xs text-neutral-500">Menampilkan 25 dari {{ preview.items.length }} item. Sisanya tersedia melalui ekspor payload.</p>
                </div>
            </template>
        </SectionCard>

        <!-- Langkah 7: konfirmasi -->
        <SectionCard v-else-if="step === 7" title="Langkah 7 · Konfirmasi pengiriman" hint="Sinkronisasi dijalankan sebagai job dengan progres yang dapat dipantau.">
            <div v-if="plan" class="space-y-3">
                <div class="grid grid-cols-2 gap-2 md:grid-cols-4">
                    <StatCard label="Akan dikirim" :value="plan.willSend + plan.willUpdate" tone="success" compact />
                    <StatCard label="Invalid" :value="plan.invalid" tone="danger" compact />
                    <StatCard label="Terblokir dependency" :value="plan.blocked" tone="danger" compact />
                    <StatCard label="Perkiraan durasi" :value="formatDuration(plan.estimatedDurationMs)" tone="neutral" compact />
                </div>

                <dl class="grid grid-cols-1 gap-2 md:grid-cols-3">
                    <div class="flex gap-2"><dt class="kv-label w-24 shrink-0">Periode</dt><dd class="text-[12.5px]">{{ period.periodLabel }}</dd></div>
                    <div class="flex gap-2"><dt class="kv-label w-24 shrink-0">Program studi</dt><dd class="text-[12.5px]">{{ period.prodiLabel }}</dd></div>
                    <div class="flex gap-2"><dt class="kv-label w-24 shrink-0">Entitas</dt><dd class="text-[12.5px]">{{ definition?.label }}</dd></div>
                </dl>

                <label class="flex items-center gap-2 border border-neutral-300 bg-white px-2.5 py-2">
                    <input v-model="sync.dryRun" type="checkbox" class="h-3.5 w-3.5" />
                    <span class="text-[12.5px] text-neutral-700">Jalankan sebagai DRY RUN (menyusun payload dan validasi tanpa mengirim ke Neo Feeder)</span>
                </label>

                <label class="flex items-start gap-2 border border-amber-200 bg-amber-50 p-2.5">
                    <input v-model="confirmed" type="checkbox" class="mt-0.5 h-3.5 w-3.5" />
                    <span class="text-[12px] text-amber-900">
                        Saya memverifikasi periode pelaporan sudah dibuka pada PDDikti dan data yang akan dikirim sudah benar. Jika DRY RUN dimatikan, data akan langsung dikirim ke Neo Feeder.
                    </span>
                </label>

                <div class="flex flex-wrap gap-2">
                    <button type="button" class="btn btn-primary" :disabled="!confirmed || sync.creating" @click="startSync">
                        <AppIcon name="play" :size="14" />
                        {{ sync.dryRun ? 'Jalankan dry run' : 'Kirim sekarang' }}
                    </button>
                    <button type="button" class="btn btn-secondary" @click="step = 6">
                        <AppIcon name="arrow_left" :size="14" />
                        Kembali ke pratinjau
                    </button>
                </div>
            </div>
            <EmptyState v-else compact icon="alert" title="Pratinjau belum tersedia" message="Kembali ke langkah 6 untuk menyusun pratinjau payload." />
        </SectionCard>

        <!-- Langkah 8: sinkronisasi (job berjalan) -->
        <SectionCard v-else-if="step === 8" title="Langkah 8 · Sinkronisasi berjalan" hint="Progres diperbarui otomatis">
            <SyncProgress v-if="activeJob" :key="`${activeJob.id}-${activeJob.status}-${activeJob.processed}`" :job="activeJob" @retry="retryActiveJob" @cancel="cancelActiveJob" @open-log="(requestId) => router.push(`/logs?search=${requestId}`)" />
            <EmptyState v-else compact icon="sync" title="Tidak ada job aktif" message="Job belum dijalankan atau sudah selesai." />
        </SectionCard>

        <!-- Langkah 9: hasil -->
        <SectionCard v-else title="Langkah 9 · Hasil sinkronisasi" hint="Rincian hasil pengiriman beserta tindak lanjut">
            <div v-if="activeJob" class="space-y-3">
                <div class="grid grid-cols-2 gap-2 md:grid-cols-4">
                    <StatCard label="Total" :value="activeJob.total" tone="info" compact />
                    <StatCard label="Berhasil" :value="activeJob.success" tone="success" compact />
                    <StatCard label="Gagal" :value="activeJob.failed" tone="danger" compact />
                    <StatCard label="Dilewati" :value="activeJob.skipped" tone="neutral" compact />
                </div>

                <div class="flex flex-wrap gap-2">
                    <RouterLink :to="`/synchronization/jobs/${activeJob.id}`" class="btn btn-primary">
                        <AppIcon name="external" :size="14" />
                        Buka detail job
                    </RouterLink>
                    <button type="button" class="btn btn-secondary" :disabled="retryableCount === 0" @click="retryActiveJob">
                        <AppIcon name="retry" :size="14" />
                        Retry {{ retryableCount }} item gagal teknis
                    </button>
                    <RouterLink to="/logs" class="btn btn-secondary">
                        <AppIcon name="file" :size="14" />
                        Lihat log & respons
                    </RouterLink>
                    <button type="button" class="btn btn-secondary" @click="reset">
                        <AppIcon name="refresh" :size="14" />
                        Mulai alur baru
                    </button>
                </div>

                <p class="text-2xs text-neutral-500">
                    Kegagalan validasi tidak dapat di-retry: perbaiki data pada SIAKAD terlebih dahulu, lalu jalankan alur ini kembali untuk data tersebut.
                </p>
            </div>
            <EmptyState v-else compact icon="clock" title="Belum ada hasil" message="Jalankan sinkronisasi pada langkah sebelumnya untuk melihat hasil." />
        </SectionCard>

        <!-- Navigasi -->
        <div class="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" class="btn btn-secondary" :disabled="step === 1" @click="back">
                <AppIcon name="arrow_left" :size="14" />
                Kembali
            </button>
            <button v-if="step < 7" type="button" class="btn btn-primary" :disabled="step === 3 && !selectedEntity" @click="next">
                Lanjut
                <AppIcon name="arrow_right" :size="14" />
            </button>
            <span class="ml-auto text-2xs text-neutral-600">{{ stepSummary }}</span>
        </div>
    </div>
</template>
