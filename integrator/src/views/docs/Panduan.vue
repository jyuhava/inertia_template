<script setup lang="ts">
import { computed, ref } from 'vue';
import PageHeader from '@/components/PageHeader.vue';
import SectionCard from '@/components/SectionCard.vue';
import AppIcon from '@/components/AppIcon.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import { syncOrder } from '@/config/syncOrder';
import { entityDefinitions } from '@/config/entities';
import { referenceList } from '@/config/references';
import { neoFeederActs, actCount } from '@/services/neofeeder/ActRegistry';
import { neoFeederVersions } from '@/services/neofeeder/SchemaAdapter';
import { appConfig } from '@/config/app.config';

/**
 * Panduan Integrator — dokumentasi operasional di dalam aplikasi:
 * konfigurasi, alur mapping → validation → sync, arti status, dependency,
 * kode respons Neo Feeder, dan penanganan masalah.
 */
const expanded = ref<Record<string, boolean>>({ panduan: true });

const toggle = (key: string): void => {
    expanded.value = { ...expanded.value, [key]: !expanded.value[key] };
};

const actGroups = computed(() => {
    const groups: Record<string, string[]> = {};
    Object.values(neoFeederActs).forEach((act) => {
        const kind = act.kind;
        groups[kind] = groups[kind] ? [...groups[kind], act.act] : [act.act];
    });
    return groups;
});

const statusRows = [
    { status: 'UNMAPPED', meaning: 'Belum punya pasangan ID PDDikti', action: 'Petakan pada Mapping Center' },
    { status: 'MAPPED', meaning: 'Sudah punya ID PDDikti, belum pernah dikirim', action: 'Sinkronkan bila data berubah' },
    { status: 'NEW', meaning: 'Belum ada di PDDikti', action: 'Kirim dengan act Insert' },
    { status: 'CHANGED', meaning: 'Ada di PDDikti tetapi ada field berbeda', action: 'Kirim dengan act Update' },
    { status: 'SYNCED', meaning: 'Identik pada field yang dibandingkan', action: 'Tidak perlu tindakan' },
    { status: 'INVALID', meaning: 'Gagal validasi aturan Neo Feeder', action: 'Perbaiki data SIAKAD' },
    { status: 'CONFLICT', meaning: 'Field identitas berbeda dengan PDDikti', action: 'Putuskan manual (tidak ditimpa otomatis)' },
    { status: 'FAILED', meaning: 'Pengiriman terakhir gagal', action: 'Retry bila kegagalan teknis' },
    { status: 'SYNCING', meaning: 'Sedang dikirim ke Neo Feeder', action: 'Tunggu proses selesai' },
];

const errorRows = [
    { code: '0', meaning: 'Sukses', handling: 'Data tersimpan di PDDikti; ID PDDikti disimpan ke mapping.' },
    { code: '400', meaning: 'Validasi Neo Feeder menolak data', handling: 'Perbaiki data SIAKAD; retry tidak akan berhasil tanpa perbaikan.' },
    { code: '401/403', meaning: 'Token tidak valid atau akses ditolak', handling: 'Autentikasi ulang/refresh token pada halaman Koneksi.' },
    { code: '409', meaning: 'Konflik data identitas', handling: 'Periksa halaman Perbandingan dan putuskan manual.' },
    { code: '500/504', meaning: 'Kesalahan server PDDikti / timeout', handling: 'Retry dengan jeda; periksa koneksi jaringan ke web service.' },
];
</script>

<template>
    <div>
        <PageHeader
            icon="info"
            title="Panduan Integrator PDDikti"
            description="Dokumentasi singkat namun lengkap: konfigurasi, alur kerja operator, arti status, dependency antar entitas, dan penanganan kegagalan."
            hint="Modul ini bekerja sebagai jembatan SIAKAD → Neo Feeder. SIAKAD tetap sumber data utama dan tidak ada data yang dihapus ke PDDikti."
        />

        <div class="grid grid-cols-1 gap-3 xl:grid-cols-3">
            <div class="space-y-3 xl:col-span-2">
                <SectionCard title="Alur kerja operator" hint="Pilih periode → prodi → data → mapping → validasi → preview → sync → response → retry bila perlu">
                    <ol class="space-y-2">
                        <li v-for="(step, index) in [
                            'Buka halaman Koneksi, uji koneksi, dan lakukan autentikasi. Pastikan dictionary act sudah tersinkron.',
                            'Pilih periode dan program studi pada header agar seluruh modul memakai konteks yang sama.',
                            'Selesaikan pemetaan entitas wajib (Prodi, Semester, Mahasiswa, Mata Kuliah, Kelas) di Mapping Center.',
                            'Buka daftar entitas, gunakan filter Status Data untuk menemukan baris berstatus Akan dikirim / Perlu update.',
                            'Periksa Pratinjau payload pada baris terpilih. Pastikan tidak ada dependency yang menghalangi.',
                            'Jalankan DRY RUN untuk data bervolume besar, lalu periksa hasilnya pada log.',
                            'Sinkronkan data terpilih, pantau progres pada panel job hingga selesai.',
                            'Tinjau response dan log; gunakan Retry hanya untuk kegagalan teknis (timeout/error server).',
                        ]" :key="index" class="flex items-start gap-2">
                            <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border border-neutral-300 bg-neutral-50 text-[10.5px] font-semibold text-neutral-600">{{ index + 1 }}</span>
                            <span class="text-[12.5px] leading-relaxed text-neutral-700">{{ step }}</span>
                        </li>
                    </ol>
                </SectionCard>

                <SectionCard title="Urutan sinkronisasi (dependency-aware)" hint="Entitas turunan tidak dijalankan bila entitas induk gagal">
                    <ol class="space-y-1.5">
                        <li v-for="step in syncOrder" :key="step.entity" class="flex flex-wrap items-center gap-2 border-b border-neutral-100 pb-1.5 last:border-0">
                            <span class="font-mono text-[11px] text-neutral-500">{{ String(step.order).padStart(2, '0') }}</span>
                            <span class="text-[12.5px] font-medium text-neutral-800">{{ step.label }}</span>
                            <span v-if="step.mandatory" class="badge border-brand-300 bg-brand-50 text-brand-800">wajib</span>
                            <span v-if="step.dependsOn.length > 0" class="text-2xs text-neutral-500">
                                memerlukan: {{ step.dependsOn.map((dependency) => entityDefinitions[dependency].label).join(', ') }}
                            </span>
                            <span class="ml-auto badge border-neutral-300 bg-neutral-100 text-neutral-600">
                                {{ entityDefinitions[step.entity].acts.syncCapability }}
                            </span>
                        </li>
                    </ol>

                    <div class="mt-3 border border-amber-200 bg-amber-50 p-2.5">
                        <p class="text-[12px] font-semibold text-amber-900">Batasan Web Service yang dihormati modul ini</p>
                        <ul class="mt-1 list-disc space-y-0.5 pl-5 text-2xs leading-relaxed text-amber-900">
                            <li>Biodata dosen tidak dapat dikirim (tidak ada act Insert/Update biodata dosen); penulisan hanya melalui penugasan dosen pada kelas.</li>
                            <li>Nilai hanya bisa di-update; nilai baru lahir dari keikutsertaan mahasiswa sebagai peserta kelas.</li>
                            <li>Program studi, semester, dan profil perguruan tinggi tidak dikirim dari SIAKAD — hanya dipetakan.</li>
                            <li>Operasi hapus tidak disediakan pada antarmuka operator.</li>
                        </ul>
                    </div>
                </SectionCard>

                <SectionCard title="Arti status data" :padded="false">
                    <table class="data-table">
                        <thead>
                            <tr><th>Status</th><th>Arti</th><th>Tindakan</th></tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in statusRows" :key="row.status">
                                <td><StatusBadge :status="row.status" /></td>
                                <td>{{ row.meaning }}</td>
                                <td class="text-neutral-600">{{ row.action }}</td>
                            </tr>
                        </tbody>
                    </table>
                </SectionCard>

                <SectionCard title="Kode respons Neo Feeder & penanganannya" :padded="false">
                    <table class="data-table">
                        <thead>
                            <tr><th class="w-24">error_code</th><th>Arti</th><th>Penanganan</th></tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in errorRows" :key="row.code">
                                <td class="font-mono">{{ row.code }}</td>
                                <td>{{ row.meaning }}</td>
                                <td class="text-neutral-600">{{ row.handling }}</td>
                            </tr>
                        </tbody>
                    </table>
                </SectionCard>
            </div>

            <div class="space-y-3">
                <SectionCard title="Konfigurasi environment">
                    <ul class="space-y-1.5 text-[12px] text-neutral-700">
                        <li><span class="font-mono text-[11px]">VITE_APP_NAME</span> — nama aplikasi pada header.</li>
                        <li><span class="font-mono text-[11px]">VITE_SIAKAD_API_URL</span> — base URL SIAKAD.</li>
                        <li><span class="font-mono text-[11px]">VITE_INTEGRATOR_API_PREFIX</span> — prefix endpoint integrator (bawaan <span class="font-mono text-[11px]">/api/integrator</span>).</li>
                        <li><span class="font-mono text-[11px]">VITE_MOCK_MODE</span> — <span class="font-mono text-[11px]">{{ appConfig.mockMode ? 'true (aktif)' : 'false' }}</span>.</li>
                        <li><span class="font-mono text-[11px]">VITE_MOCK_LATENCY_MS</span> — simulasi latensi backend.</li>
                    </ul>
                    <p class="mt-2 text-2xs text-neutral-500">Kredensial Neo Feeder tidak pernah ditempatkan pada environment frontend.</p>
                </SectionCard>

                <SectionCard title="Referensi PDDikti yang dikelola">
                    <ul class="space-y-1">
                        <li v-for="group in ['institusi', 'akademik', 'mahasiswa', 'dosen', 'kegiatan', 'wilayah']" :key="group" class="border-b border-neutral-100 pb-1.5 last:border-0">
                            <p class="kv-label">{{ group }}</p>
                            <p class="text-[12px] text-neutral-700">
                                {{ referenceList.filter((item) => item.group === group).map((item) => item.label).join(' · ') }}
                            </p>
                        </li>
                    </ul>
                </SectionCard>

                <SectionCard title="Registry act Neo Feeder">
                    <p class="text-[12px] text-neutral-700">
                        Modul ini memakai <b>{{ actCount }} act</b> terdaftar yang diambil dari daftar Web Service Neo Feeder terverifikasi. Komponen Vue tidak pernah menulis nama act
                        secara langsung.
                    </p>
                    <div class="mt-2 space-y-1">
                        <div v-for="(acts, kind) in actGroups" :key="kind" class="border-b border-neutral-100 pb-1.5 last:border-0">
                            <p class="kv-label">{{ kind }} ({{ acts.length }})</p>
                            <p class="font-mono text-[10.5px] leading-relaxed text-neutral-600">{{ acts.slice(0, 8).join(', ') }}{{ acts.length > 8 ? ', …' : '' }}</p>
                        </div>
                    </div>
                </SectionCard>

                <SectionCard title="Versi Neo Feeder yang didukung">
                    <ul class="space-y-2">
                        <li v-for="version in neoFeederVersions" :key="version.version">
                            <p class="text-[12.5px] font-medium text-neutral-800">{{ version.label }}</p>
                            <p class="text-2xs leading-relaxed text-neutral-600">{{ version.notes }}</p>
                        </li>
                    </ul>
                    <p class="mt-2 text-2xs text-neutral-500">
                        Penyesuaian field antar versi ditangani NeoFeederVersionAdapter sehingga perubahan versi tidak menyebar ke komponen.
                    </p>
                </SectionCard>

                <SectionCard title="Troubleshooting umum">
                    <ul class="space-y-2 text-[12px] text-neutral-700">
                        <li>
                            <p class="font-medium text-neutral-800">"Neo Feeder tidak dapat dihubungi"</p>
                            <p class="text-2xs">Periksa Web Service URL, port, dan kebijakan jaringan. Jalankan Uji Koneksi.</p>
                        </li>
                        <li>
                            <p class="font-medium text-neutral-800">"Token tidak valid"</p>
                            <p class="text-2xs">Lakukan autentikasi ulang. Token Neo Feeder umumnya berumur pendek.</p>
                        </li>
                        <li>
                            <p class="font-medium text-neutral-800">Sinkronisasi diblokir dependency</p>
                            <p class="text-2xs">Petakan entitas induk terlebih dahulu (mis. Prodi, Semester, Mata Kuliah).</p>
                        </li>
                        <li>
                            <p class="font-medium text-neutral-800">Field "belum diverifikasi"</p>
                            <p class="text-2xs">Sinkronkan dictionary act pada halaman Koneksi agar nama field dipastikan sesuai versi terpasang.</p>
                        </li>
                        <li>
                            <p class="font-medium text-neutral-800">Kegagalan berulang pada satu data</p>
                            <p class="text-2xs">Buka detail baris → tab Response untuk melihat pesan Neo Feeder, lalu perbaiki data SIAKAD.</p>
                        </li>
                    </ul>
                </SectionCard>
            </div>
        </div>
    </div>
</template>
