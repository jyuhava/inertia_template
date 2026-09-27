import type { EntityKey, SyncOrderStep } from '@/types/integration';

/**
 * Urutan sinkronisasi dependency-aware.
 *
 * Aturan: sebuah entitas hanya boleh dijalankan setelah seluruh entitas pada
 * `dependsOn` berstatus aman (mapped + tidak gagal). Bila dependency gagal,
 * entitas turunannya TIDAK dijalankan (lihat DependencyService / SyncService).
 */
export const syncOrder: SyncOrderStep[] = [
    {
        order: 1,
        entity: 'perguruan-tinggi',
        label: 'Perguruan Tinggi',
        dependsOn: [],
        mandatory: true,
    },
    {
        order: 2,
        entity: 'prodi',
        label: 'Program Studi',
        dependsOn: ['perguruan-tinggi'],
        mandatory: true,
    },
    {
        order: 3,
        entity: 'semester',
        label: 'Semester / Periode',
        dependsOn: [],
        mandatory: true,
    },
    {
        order: 4,
        entity: 'dosen',
        label: 'Dosen',
        dependsOn: ['prodi'],
        mandatory: false,
    },
    {
        order: 5,
        entity: 'mahasiswa',
        label: 'Biodata Mahasiswa',
        dependsOn: ['prodi', 'semester'],
        mandatory: true,
    },
    {
        order: 6,
        entity: 'riwayat-pendidikan',
        label: 'Riwayat Pendidikan',
        dependsOn: ['mahasiswa', 'prodi', 'semester'],
        mandatory: true,
    },
    {
        order: 7,
        entity: 'kurikulum',
        label: 'Kurikulum',
        dependsOn: ['prodi'],
        mandatory: true,
    },
    {
        order: 8,
        entity: 'mata-kuliah',
        label: 'Mata Kuliah',
        dependsOn: ['prodi'],
        mandatory: true,
    },
    {
        order: 9,
        entity: 'mata-kuliah-kurikulum',
        label: 'Mata Kuliah Kurikulum',
        dependsOn: ['kurikulum', 'mata-kuliah'],
        mandatory: false,
    },
    {
        order: 10,
        entity: 'kelas',
        label: 'Kelas Kuliah',
        dependsOn: ['prodi', 'semester', 'mata-kuliah'],
        mandatory: true,
    },
    {
        order: 11,
        entity: 'dosen-pengajar',
        label: 'Penugasan Dosen',
        dependsOn: ['kelas', 'dosen'],
        mandatory: true,
    },
    {
        order: 12,
        entity: 'krs',
        label: 'KRS / Anggota Kelas',
        dependsOn: ['mahasiswa', 'kelas'],
        mandatory: true,
    },
    {
        order: 13,
        entity: 'nilai',
        label: 'Nilai Perkuliahan',
        dependsOn: ['mahasiswa', 'kelas', 'krs'],
        mandatory: false,
    },
    {
        order: 14,
        entity: 'aktivitas-mahasiswa',
        label: 'Aktivitas Mahasiswa',
        dependsOn: ['mahasiswa', 'semester'],
        mandatory: false,
    },
    {
        order: 15,
        entity: 'kelulusan',
        label: 'Kelulusan / Status Akhir',
        dependsOn: ['mahasiswa', 'semester'],
        mandatory: true,
    },
];

export const syncOrderEntities: EntityKey[] = syncOrder.map((step) => step.entity);

export const getSyncStep = (entity: EntityKey): SyncOrderStep | undefined =>
    syncOrder.find((step) => step.entity === entity);

/** Label ringkas urutan sinkronisasi untuk ditampilkan di UI. */
export const syncOrderLabel = syncOrder.map((step) => `${step.order}. ${step.label}`).join(' → ');
