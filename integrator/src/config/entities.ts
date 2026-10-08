import type { EntityKey } from '@/types/integration';

/**
 * Kemampuan sinkronisasi per entitas, diturunkan dari daftar act Web Service
 * Neo Feeder yang benar-benar tersedia (211 act terdokumentasi / `GetDictionary`):
 *
 *  - 'full'            : punya act Insert + Update -> bisa dikirim/diperbarui
 *  - 'update-only'     : hanya ada act Update (mis. nilai yang lahir dari peserta kelas)
 *  - 'assignment-only' : biodata hanya baca, penulisan lewat entitas relasi
 *  - 'read-only'       : hanya act Get (referensi/institusi) -> tidak pernah dikirim
 */
export type SyncCapability = 'full' | 'update-only' | 'assignment-only' | 'read-only';

export interface EntityActSet {
    list: string;
    detail?: string;
    count?: string;
    insert?: string;
    update?: string;
    /** act tambahan untuk menulis relasi anak (mis. anggota aktivitas) */
    childInsert?: string;
    childUpdate?: string;
    syncCapability: SyncCapability;
    /** penjelasan singkat kenapa kapabilitasnya demikian */
    capabilityNote: string;
}

export interface EntityFilterDefinition {
    key: string;
    label: string;
    type: 'period' | 'prodi' | 'select' | 'search' | 'date' | 'boolean';
    options?: { value: string; label: string }[];
    placeholder?: string;
    width?: string;
}

export interface EntityStatDefinition {
    key: string;
    label: string;
    source: 'total' | 'synced' | 'willSend' | 'willUpdate' | 'invalid' | 'failed' | 'unmapped' | 'conflict' | 'inProgress' | 'mapped' | 'pddikti';
    tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent';
    hint?: string;
}

export type DetailTabKey = 'overview' | 'siakad' | 'pddikti' | 'comparison' | 'validation' | 'payload' | 'response' | 'history';

export interface EntityDefinition {
    key: EntityKey;
    label: string;
    singular: string;
    group: 'institusi' | 'sivitas' | 'kurikulum' | 'perkuliahan' | 'hasil';
    route: string;
    apiPath: string;
    icon: string;
    description: string;
    acts: EntityActSet;
    columns: import('@/types/common').ColumnDefinition[];
    filters: EntityFilterDefinition[];
    statCards: EntityStatDefinition[];
    requiresPeriod: boolean;
    requiresProdi: boolean;
    /** kolom utama yang dipakai pada tabel mapping */
    mappingIdentityField: string;
    /** urutan default pada sync order */
    syncWeight: number;
    detailTabs: DetailTabKey[];
    searchPlaceholder: string;
}

const statusDataOptions = [
    { value: 'SYNCED', label: 'Sudah sinkron' },
    { value: 'NEW', label: 'Akan dikirim' },
    { value: 'CHANGED', label: 'Perlu update' },
    { value: 'INVALID', label: 'Tidak valid' },
    { value: 'FAILED', label: 'Gagal' },
    { value: 'CONFLICT', label: 'Konflik' },
    { value: 'UNMAPPED', label: 'Belum dipetakan' },
];

const statusMappingOptions = [
    { value: 'MAPPED', label: 'Mapped' },
    { value: 'UNMAPPED', label: 'Unmapped' },
    { value: 'CONFLICT', label: 'Conflict' },
    { value: 'INVALID', label: 'Invalid' },
];

const periodFilter: EntityFilterDefinition = {
    key: 'periodId',
    label: 'Periode',
    type: 'period',
    width: 'w-48',
};

const prodiFilter: EntityFilterDefinition = {
    key: 'prodiId',
    label: 'Program Studi',
    type: 'prodi',
    width: 'w-56',
};

const statusDataFilter: EntityFilterDefinition = {
    key: 'dataStatus',
    label: 'Status Data',
    type: 'select',
    options: statusDataOptions,
    width: 'w-44',
};

const statusMappingFilter: EntityFilterDefinition = {
    key: 'mappingStatus',
    label: 'Status Pemetaan',
    type: 'select',
    options: statusMappingOptions,
    width: 'w-44',
};

const defaultStatCards: EntityStatDefinition[] = [
    { key: 'pddikti', label: 'Data PDDikti', source: 'pddikti', tone: 'neutral', hint: 'Jumlah data yang sudah ada di Neo Feeder' },
    { key: 'willSend', label: 'Akan Dikirim', source: 'willSend', tone: 'accent', hint: 'Belum ada di PDDikti (act Insert)' },
    { key: 'invalid', label: 'Data Tidak Valid', source: 'invalid', tone: 'danger', hint: 'Gagal validasi, tidak boleh dikirim' },
    { key: 'siakad', label: 'Data SIAKAD', source: 'total', tone: 'info', hint: 'Total baris pada SIAKAD untuk filter aktif' },
];

const defaultTabs: DetailTabKey[] = ['overview', 'comparison', 'validation', 'payload', 'history'];

export const entityDefinitions: Record<EntityKey, EntityDefinition> = {
    'perguruan-tinggi': {
        key: 'perguruan-tinggi',
        label: 'Perguruan Tinggi',
        singular: 'Perguruan Tinggi',
        group: 'institusi',
        route: 'perguruan-tinggi',
        apiPath: 'perguruan-tinggi',
        icon: 'building',
        description:
            'Profil perguruan tinggi pada PDDikti (act GetProfilPT). Data ini menjadi induk seluruh pelaporan dan tidak dikirim dari SIAKAD.',
        acts: {
            list: 'GetProfilPT',
            count: 'GetCountPerguruanTinggi',
            syncCapability: 'read-only',
            capabilityNote: 'Neo Feeder tidak menyediakan act Insert/Update untuk profil PT — hanya pembacaan (GetProfilPT).',
        },
        columns: [
            { key: 'kodePt', label: 'Kode PT', mono: true, sortable: true },
            { key: 'namaPt', label: 'Nama Perguruan Tinggi', sortable: true },
            { key: 'singkatan', label: 'Singkatan' },
            { key: 'akreditasi', label: 'Akreditasi' },
            { key: 'kota', label: 'Kota' },
            { key: 'pddiktiId', label: 'ID PDDikti', mono: true, hideable: true },
        ],
        filters: [{ key: 'search', label: 'Pencarian', type: 'search', placeholder: 'Kode / nama PT' }],
        statCards: defaultStatCards,
        requiresPeriod: false,
        requiresProdi: false,
        mappingIdentityField: 'kodePt',
        syncWeight: 1,
        detailTabs: ['overview', 'comparison', 'history'],
        searchPlaceholder: 'Cari kode atau nama perguruan tinggi',
    },

    prodi: {
        key: 'prodi',
        label: 'Program Studi',
        singular: 'Program Studi',
        group: 'institusi',
        route: 'prodi',
        apiPath: 'prodi',
        icon: 'academic-cap',
        description:
            'Pemetaan program studi SIAKAD ke program studi PDDikti. Wajib selesai sebelum entitas akademik lain disinkronkan karena hampir semua payload memuat id_prodi.',
        acts: {
            list: 'GetProdi',
            count: 'GetCountProdi',
            syncCapability: 'read-only',
            capabilityNote: 'Data prodi dibuat melalui PDDikti/Neo Feeder admin, bukan melalui Web Service. Integrator hanya memetakan.',
        },
        columns: [
            { key: 'kodeProdi', label: 'Kode SIAKAD', mono: true, sortable: true },
            { key: 'namaProdi', label: 'Program Studi SIAKAD', sortable: true },
            { key: 'jenjang', label: 'Jenjang' },
            { key: 'pddiktiLabel', label: 'Program Studi PDDIKTI' },
            { key: 'pddiktiId', label: 'ID PDDikti', mono: true },
            { key: 'mappingStatus', label: 'Pemetaan', align: 'center' },
            { key: 'totalMataKuliah', label: 'MK', align: 'right', hideable: true },
            { key: 'totalMahasiswa', label: 'Mahasiswa', align: 'right', hideable: true },
        ],
        filters: [
            { key: 'search', label: 'Pencarian', type: 'search', placeholder: 'Kode / nama prodi' },
            statusMappingFilter,
            {
                key: 'jenjang',
                label: 'Jenjang',
                type: 'select',
                options: [
                    { value: 'D3', label: 'D3' },
                    { value: 'D4', label: 'D4' },
                    { value: 'S1', label: 'S1' },
                    { value: 'S2', label: 'S2' },
                ],
                width: 'w-32',
            },
        ],
        statCards: [
            { key: 'siakad', label: 'Program Studi SIAKAD', source: 'total', tone: 'info' },
            { key: 'mapped', label: 'Terpetakan', source: 'mapped', tone: 'success' },
            { key: 'unmapped', label: 'Belum Dipetakan', source: 'unmapped', tone: 'warning' },
            { key: 'conflict', label: 'Konflik', source: 'conflict', tone: 'danger' },
        ],
        requiresPeriod: false,
        requiresProdi: false,
        mappingIdentityField: 'kodeProdi',
        syncWeight: 2,
        detailTabs: ['overview', 'comparison', 'validation', 'history'],
        searchPlaceholder: 'Cari kode atau nama program studi',
    },

    semester: {
        key: 'semester',
        label: 'Semester / Periode',
        singular: 'Semester',
        group: 'institusi',
        route: 'semester',
        apiPath: 'semester',
        icon: 'calendar',
        description:
            'Pemetaan semester SIAKAD (tahun ajaran + ganjil/genap) ke kode semester PDDikti (mis. 20251). Menentukan id_semester pada hampir semua payload.',
        acts: {
            list: 'GetSemester',
            count: undefined,
            syncCapability: 'read-only',
            capabilityNote: 'Semester adalah referensi PDDikti; SIAKAD hanya memetakan kode semester lokal ke kode PDDikti.',
        },
        columns: [
            { key: 'kode', label: 'Kode SIAKAD', mono: true },
            { key: 'namaSemester', label: 'Semester SIAKAD' },
            { key: 'tahunAjaran', label: 'Tahun Ajaran' },
            { key: 'pddiktiKode', label: 'Kode Semester PDDikti', mono: true },
            { key: 'pddiktiLabel', label: 'Nama Semester PDDIKTI' },
            { key: 'tanggalMulai', label: 'Mulai' },
            { key: 'tanggalSelesai', label: 'Selesai' },
            { key: 'mappingStatus', label: 'Pemetaan', align: 'center' },
            { key: 'status', label: 'Status', align: 'center' },
        ],
        filters: [{ key: 'search', label: 'Pencarian', type: 'search', placeholder: 'Tahun ajaran / kode' }, statusMappingFilter],
        statCards: [
            { key: 'siakad', label: 'Semester SIAKAD', source: 'total', tone: 'info' },
            { key: 'mapped', label: 'Terpetakan', source: 'mapped', tone: 'success' },
            { key: 'unmapped', label: 'Belum Dipetakan', source: 'unmapped', tone: 'warning' },
            { key: 'willSend', label: 'Perlu Tindakan', source: 'willUpdate', tone: 'accent' },
        ],
        requiresPeriod: false,
        requiresProdi: false,
        mappingIdentityField: 'kode',
        syncWeight: 3,
        detailTabs: ['overview', 'comparison', 'history'],
        searchPlaceholder: 'Cari semester atau tahun ajaran',
    },

    dosen: {
        key: 'dosen',
        label: 'Dosen',
        singular: 'Dosen',
        group: 'sivitas',
        route: 'dosen',
        apiPath: 'dosen',
        icon: 'user-tie',
        description:
            'Pemetaan dosen SIAKAD ke dosen PDDikti berdasarkan NIDN/NIDK/NIP. Biodata dosen TIDAK dikirim dari SIAKAD (tidak ada act Insert/Update biodata dosen); penulisan hanya melalui penugasan kelas.',
        acts: {
            list: 'GetListDosen',
            detail: 'DetailBiodataDosen',
            count: 'GetCountDosen',
            syncCapability: 'read-only',
            capabilityNote:
                'Web Service Neo Feeder tidak menyediakan InsertBiodataDosen/UpdateBiodataDosen. Gunakan menu Penugasan Dosen untuk mengirim relasi dosen–kelas.',
        },
        columns: [
            { key: 'nidn', label: 'NIDN', mono: true, sortable: true },
            { key: 'nama', label: 'Nama Dosen', sortable: true },
            { key: 'nidk', label: 'NIDK', mono: true, hideable: true },
            { key: 'nip', label: 'NIP', mono: true, hideable: true },
            { key: 'prodiNama', label: 'Homebase' },
            { key: 'statusKepegawaian', label: 'Kepegawaian', hideable: true },
            { key: 'pddiktiLabel', label: 'Nama PDDIKTI' },
            { key: 'pddiktiId', label: 'ID PDDikti', mono: true },
            { key: 'mappingStatus', label: 'Pemetaan', align: 'center' },
            { key: 'dataStatus', label: 'Status Data', align: 'center' },
        ],
        filters: [
            { key: 'search', label: 'Pencarian', type: 'search', placeholder: 'NIDN / nama dosen' },
            prodiFilter,
            statusMappingFilter,
            statusDataFilter,
            {
                key: 'statusKepegawaian',
                label: 'Status Kepegawaian',
                type: 'select',
                options: [
                    { value: 'tetap', label: 'Tetap' },
                    { value: 'tidak_tetap', label: 'Tidak Tetap' },
                ],
                width: 'w-40',
            },
        ],
        statCards: defaultStatCards,
        requiresPeriod: false,
        requiresProdi: true,
        mappingIdentityField: 'nidn',
        syncWeight: 4,
        detailTabs: ['overview', 'siakad', 'pddikti', 'comparison', 'validation', 'history'],
        searchPlaceholder: 'Cari NIDN, NIDK, atau nama dosen',
    },

    mahasiswa: {
        key: 'mahasiswa',
        label: 'Mahasiswa',
        singular: 'Mahasiswa',
        group: 'sivitas',
        route: 'mahasiswa',
        apiPath: 'mahasiswa',
        icon: 'users',
        description:
            'Sinkronisasi biodata mahasiswa (InsertBiodataMahasiswa / UpdateBiodataMahasiswa). Perbedaan nama tidak pernah ditimpa otomatis — masuk sebagai konflik untuk diputuskan operator.',
        acts: {
            list: 'GetListMahasiswa',
            detail: 'GetBiodataMahasiswa',
            count: 'GetCountMahasiswa',
            insert: 'InsertBiodataMahasiswa',
            update: 'UpdateBiodataMahasiswa',
            syncCapability: 'full',
            capabilityNote: 'Biodata mahasiswa dapat dikirim dan diperbarui melalui Web Service.',
        },
        columns: [
            { key: 'nim', label: 'NIM', mono: true, sortable: true },
            { key: 'nama', label: 'Nama', sortable: true },
            { key: 'prodiNama', label: 'Program Studi' },
            { key: 'angkatan', label: 'Angkatan', align: 'center', sortable: true },
            { key: 'status', label: 'Status', align: 'center' },
            { key: 'pddiktiId', label: 'ID PDDikti', mono: true },
            { key: 'dataStatus', label: 'Status Data', align: 'center' },
            { key: 'lastSyncAt', label: 'Terakhir Sinkron' },
            { key: 'conflictFields', label: 'Field Konflik', hideable: true },
        ],
        filters: [
            { key: 'search', label: 'Pencarian', type: 'search', placeholder: 'NIM atau nama mahasiswa' },
            periodFilter,
            prodiFilter,
            {
                key: 'angkatan',
                label: 'Angkatan',
                type: 'select',
                options: [
                    { value: '2021', label: '2021' },
                    { value: '2022', label: '2022' },
                    { value: '2023', label: '2023' },
                    { value: '2024', label: '2024' },
                    { value: '2025', label: '2025' },
                ],
                width: 'w-32',
            },
            {
                key: 'statusMahasiswa',
                label: 'Status Mahasiswa',
                type: 'select',
                options: [
                    { value: 'aktif', label: 'Aktif' },
                    { value: 'cuti', label: 'Cuti' },
                    { value: 'lulus', label: 'Lulus' },
                    { value: 'nonaktif', label: 'Nonaktif' },
                    { value: 'drop_out', label: 'Drop Out' },
                ],
                width: 'w-40',
            },
            statusMappingFilter,
            statusDataFilter,
        ],
        statCards: [
            { key: 'siakad', label: 'Jumlah Mahasiswa', source: 'total', tone: 'info' },
            { key: 'pddikti', label: 'Ada di PDDikti', source: 'pddikti', tone: 'neutral' },
            { key: 'synced', label: 'Sudah Sinkron', source: 'synced', tone: 'success' },
            { key: 'willSend', label: 'Belum Sinkron', source: 'willSend', tone: 'accent' },
            { key: 'willUpdate', label: 'Perlu Update', source: 'willUpdate', tone: 'warning' },
            { key: 'invalid', label: 'Tidak Valid', source: 'invalid', tone: 'danger' },
            { key: 'failed', label: 'Gagal', source: 'failed', tone: 'danger' },
            { key: 'unmapped', label: 'Belum Dipetakan', source: 'unmapped', tone: 'neutral' },
        ],
        requiresPeriod: true,
        requiresProdi: true,
        mappingIdentityField: 'nim',
        syncWeight: 5,
        detailTabs: ['overview', 'siakad', 'pddikti', 'comparison', 'validation', 'payload', 'response', 'history'],
        searchPlaceholder: 'Cari NIM atau nama mahasiswa',
    },

    'riwayat-pendidikan': {
        key: 'riwayat-pendidikan',
        label: 'Riwayat Pendidikan',
        singular: 'Riwayat Pendidikan',
        group: 'sivitas',
        route: 'riwayat-pendidikan',
        apiPath: 'riwayat-pendidikan',
        icon: 'clipboard-document-list',
        description:
            'Riwayat pendidikan mahasiswa (jenis pendaftaran, jalur masuk, periode masuk, pembiayaan). Wajib ada sebelum mahasiswa dianggap lengkap pada PDDikti.',
        acts: {
            list: 'GetListRiwayatPendidikanMahasiswa',
            count: 'GetCountRiwayatPendidikanMahasiswa',
            insert: 'InsertRiwayatPendidikanMahasiswa',
            update: 'UpdateRiwayatPendidikanMahasiswa',
            syncCapability: 'full',
            capabilityNote: 'Riwayat pendidikan dapat dikirim dan diperbarui melalui Web Service.',
        },
        columns: [
            { key: 'nim', label: 'NIM', mono: true, sortable: true },
            { key: 'nama', label: 'Nama', sortable: true },
            { key: 'prodiNama', label: 'Program Studi' },
            { key: 'jenisPendaftaran', label: 'Jenis Pendaftaran' },
            { key: 'jalurMasuk', label: 'Jalur Masuk' },
            { key: 'semesterMasuk', label: 'Periode Masuk' },
            { key: 'pembiayaan', label: 'Pembiayaan' },
            { key: 'pddiktiId', label: 'ID PDDikti', mono: true },
            { key: 'dataStatus', label: 'Status Data', align: 'center' },
        ],
        filters: [
            { key: 'search', label: 'Pencarian', type: 'search', placeholder: 'NIM / nama mahasiswa' },
            prodiFilter,
            periodFilter,
            statusDataFilter,
        ],
        statCards: defaultStatCards,
        requiresPeriod: true,
        requiresProdi: true,
        mappingIdentityField: 'nim',
        syncWeight: 6,
        detailTabs: ['overview', 'siakad', 'comparison', 'validation', 'payload', 'history'],
        searchPlaceholder: 'Cari NIM atau nama mahasiswa',
    },

    kurikulum: {
        key: 'kurikulum',
        label: 'Kurikulum',
        singular: 'Kurikulum',
        group: 'kurikulum',
        route: 'kurikulum',
        apiPath: 'kurikulum',
        icon: 'map',
        description:
            'Kurikulum per program studi beserta jumlah SKS dan mata kuliah. Dikirim sebelum mata kuliah kurikulum karena menjadi induk relasinya.',
        acts: {
            list: 'GetListKurikulum',
            detail: 'GetDetailKurikulum',
            count: 'GetCountKurikulum',
            insert: 'InsertKurikulum',
            update: 'UpdateKurikulum',
            syncCapability: 'full',
            capabilityNote: 'Kurikulum dapat dikirim dan diperbarui melalui Web Service.',
        },
        columns: [
            { key: 'kode', label: 'Kode Kurikulum', mono: true, sortable: true },
            { key: 'nama', label: 'Nama Kurikulum', sortable: true },
            { key: 'prodiNama', label: 'Program Studi' },
            { key: 'tahunMulai', label: 'Tahun Mulai', align: 'center' },
            { key: 'totalSks', label: 'Total SKS', align: 'right' },
            { key: 'jumlahMataKuliah', label: 'Jumlah MK', align: 'right' },
            { key: 'status', label: 'Status', align: 'center' },
            { key: 'pddiktiId', label: 'ID PDDikti', mono: true },
            { key: 'dataStatus', label: 'Status Data', align: 'center' },
        ],
        filters: [
            { key: 'search', label: 'Pencarian', type: 'search', placeholder: 'Kode / nama kurikulum' },
            prodiFilter,
            statusDataFilter,
        ],
        statCards: defaultStatCards,
        requiresPeriod: false,
        requiresProdi: true,
        mappingIdentityField: 'kode',
        syncWeight: 7,
        detailTabs: ['overview', 'siakad', 'comparison', 'validation', 'payload', 'history'],
        searchPlaceholder: 'Cari kode atau nama kurikulum',
    },

    'mata-kuliah': {
        key: 'mata-kuliah',
        label: 'Mata Kuliah',
        singular: 'Mata Kuliah',
        group: 'kurikulum',
        route: 'mata-kuliah',
        apiPath: 'mata-kuliah',
        icon: 'book-open',
        description:
            'Mata kuliah beserta SKS dan jenisnya. Perbedaan SKS dengan PDDikti ditandai sebagai perubahan, bukan ditimpa otomatis.',
        acts: {
            list: 'GetListMataKuliah',
            detail: 'GetDetailMataKuliah',
            count: 'GetCountMataKuliah',
            insert: 'InsertMataKuliah',
            update: 'UpdateMataKuliah',
            syncCapability: 'full',
            capabilityNote: 'Mata kuliah dapat dikirim dan diperbarui melalui Web Service.',
        },
        columns: [
            { key: 'kode', label: 'Kode MK', mono: true, sortable: true },
            { key: 'nama', label: 'Nama Mata Kuliah', sortable: true },
            { key: 'sks', label: 'SKS', align: 'right' },
            { key: 'jenis', label: 'Jenis MK' },
            { key: 'semester', label: 'Semester', align: 'center' },
            { key: 'prodiNama', label: 'Program Studi' },
            { key: 'pddiktiId', label: 'ID PDDikti', mono: true },
            { key: 'dataStatus', label: 'Status Data', align: 'center' },
        ],
        filters: [
            { key: 'search', label: 'Pencarian', type: 'search', placeholder: 'Kode / nama mata kuliah' },
            prodiFilter,
            {
                key: 'jenis',
                label: 'Jenis Mata Kuliah',
                type: 'select',
                options: [
                    { value: 'Wajib', label: 'Wajib' },
                    { value: 'Pilihan', label: 'Pilihan' },
                    { value: 'MBKM', label: 'MBKM' },
                    { value: 'Lainnya', label: 'Lainnya' },
                ],
                width: 'w-40',
            },
            statusDataFilter,
        ],
        statCards: defaultStatCards,
        requiresPeriod: false,
        requiresProdi: true,
        mappingIdentityField: 'kode',
        syncWeight: 8,
        detailTabs: ['overview', 'siakad', 'comparison', 'validation', 'payload', 'history'],
        searchPlaceholder: 'Cari kode atau nama mata kuliah',
    },

    'mata-kuliah-kurikulum': {
        key: 'mata-kuliah-kurikulum',
        label: 'Mata Kuliah Kurikulum',
        singular: 'Mata Kuliah Kurikulum',
        group: 'kurikulum',
        route: 'mata-kuliah-kurikulum',
        apiPath: 'mata-kuliah-kurikulum',
        icon: 'list-bullet',
        description:
            'Relasi mata kuliah pada kurikulum: semester penempatan, wajib/pilihan, dan SKS. Dikirim setelah kurikulum dan mata kuliah selesai dipetakan.',
        acts: {
            list: 'GetMatkulKurikulum',
            count: 'GetCountMatkulKurikulum',
            insert: 'InsertMatkulKurikulum',
            update: 'UpdateMatkulKurikulum',
            syncCapability: 'full',
            capabilityNote: 'Relasi mata kuliah–kurikulum dapat dikirim dan diperbarui.',
        },
        columns: [
            { key: 'kodeKurikulum', label: 'Kurikulum', mono: true },
            { key: 'prodiNama', label: 'Program Studi' },
            { key: 'kodeMk', label: 'Kode MK', mono: true, sortable: true },
            { key: 'namaMk', label: 'Mata Kuliah', sortable: true },
            { key: 'sks', label: 'SKS', align: 'right' },
            { key: 'semester', label: 'Semester', align: 'center' },
            { key: 'wajib', label: 'Sifat', align: 'center' },
            { key: 'pddiktiId', label: 'ID PDDikti', mono: true },
            { key: 'dataStatus', label: 'Status Data', align: 'center' },
        ],
        filters: [
            { key: 'search', label: 'Pencarian', type: 'search', placeholder: 'Kode / nama mata kuliah' },
            prodiFilter,
            {
                key: 'kurikulumId',
                label: 'Kurikulum',
                type: 'select',
                options: [],
                placeholder: 'Semua kurikulum',
                width: 'w-52',
            },
            statusDataFilter,
        ],
        statCards: defaultStatCards,
        requiresPeriod: false,
        requiresProdi: true,
        mappingIdentityField: 'kodeMk',
        syncWeight: 9,
        detailTabs: ['overview', 'siakad', 'comparison', 'validation', 'payload', 'history'],
        searchPlaceholder: 'Cari mata kuliah pada kurikulum',
    },

    kelas: {
        key: 'kelas',
        label: 'Kelas Kuliah',
        singular: 'Kelas Kuliah',
        group: 'perkuliahan',
        route: 'kelas',
        apiPath: 'kelas',
        icon: 'rectangle-stack',
        description:
            'Kelas kuliah per mata kuliah dan periode. Perlu id_prodi, id_semester, dan id_matkul yang sudah dipetakan sebelum dikirim.',
        acts: {
            list: 'GetListKelasKuliah',
            detail: 'GetDetailKelasKuliah',
            count: 'GetCountKelasKuliah',
            insert: 'InsertKelasKuliah',
            update: 'UpdateKelasKuliah',
            syncCapability: 'full',
            capabilityNote: 'Kelas kuliah dapat dikirim dan diperbarui melalui Web Service.',
        },
        columns: [
            { key: 'kodeKelas', label: 'Kode Kelas', mono: true, sortable: true },
            { key: 'namaKelas', label: 'Nama Kelas', sortable: true },
            { key: 'prodiNama', label: 'Program Studi' },
            { key: 'periodeNama', label: 'Periode' },
            { key: 'kodeMk', label: 'Mata Kuliah' },
            { key: 'sks', label: 'SKS', align: 'right' },
            { key: 'dosenPengajar', label: 'Dosen' },
            { key: 'kapasitas', label: 'Kapasitas', align: 'right' },
            { key: 'terisi', label: 'Terisi', align: 'right', hideable: true },
            { key: 'status', label: 'Status Kelas', align: 'center' },
            { key: 'pddiktiId', label: 'ID PDDikti', mono: true },
            { key: 'dataStatus', label: 'Status Data', align: 'center' },
        ],
        filters: [
            { key: 'search', label: 'Pencarian', type: 'search', placeholder: 'Kode kelas / nama kelas / mata kuliah' },
            periodFilter,
            prodiFilter,
            {
                key: 'jenisMataKuliah',
                label: 'Status Mata Kuliah',
                type: 'select',
                options: [
                    { value: 'Wajib', label: 'Wajib' },
                    { value: 'Pilihan', label: 'Pilihan' },
                    { value: 'MBKM', label: 'MBKM' },
                ],
                width: 'w-40',
            },
            {
                key: 'statusKelas',
                label: 'Status Kelas',
                type: 'select',
                options: [
                    { value: 'aktif', label: 'Aktif' },
                    { value: 'tidak_aktif', label: 'Tidak Aktif' },
                    { value: 'selesai', label: 'Selesai' },
                ],
                width: 'w-36',
            },
            statusDataFilter,
        ],
        statCards: [
            { key: 'pddikti', label: 'Jumlah Data PDDIKTI', source: 'pddikti', tone: 'neutral' },
            { key: 'willSend', label: 'Akan Dikirim', source: 'willSend', tone: 'accent' },
            { key: 'invalid', label: 'Data Tidak Valid', source: 'invalid', tone: 'danger' },
            { key: 'siakad', label: 'Jumlah Data Akademik', source: 'total', tone: 'info' },
        ],
        requiresPeriod: true,
        requiresProdi: true,
        mappingIdentityField: 'kodeKelas',
        syncWeight: 10,
        detailTabs: ['overview', 'siakad', 'pddikti', 'comparison', 'validation', 'payload', 'response', 'history'],
        searchPlaceholder: 'Cari kode kelas, nama kelas, atau mata kuliah',
    },

    'dosen-pengajar': {
        key: 'dosen-pengajar',
        label: 'Penugasan Dosen',
        singular: 'Penugasan Dosen',
        group: 'perkuliahan',
        route: 'dosen-pengajar',
        apiPath: 'dosen-pengajar',
        icon: 'identification',
        description:
            'Aktivitas mengajar dosen pada kelas kuliah (InsertDosenPengajarKelasKuliah). Ini jalur penulisan data dosen satu-satunya pada Web Service Neo Feeder.',
        acts: {
            list: 'GetDosenPengajarKelasKuliah',
            count: 'GetCountDosenPengajarKelasKuliah',
            insert: 'InsertDosenPengajarKelasKuliah',
            update: 'UpdateDosenPengajarKelasKuliah',
            syncCapability: 'full',
            capabilityNote: 'Penugasan dosen dapat dikirim dan diperbarui melalui Web Service.',
        },
        columns: [
            { key: 'kodeKelas', label: 'Kode Kelas', mono: true, sortable: true },
            { key: 'namaKelas', label: 'Nama Kelas' },
            { key: 'nim', label: 'NIDN Dosen', mono: true },
            { key: 'nama', label: 'Nama Dosen' },
            { key: 'prodiNama', label: 'Program Studi' },
            { key: 'periodeNama', label: 'Periode' },
            { key: 'peran', label: 'Peran' },
            { key: 'pddiktiId', label: 'ID PDDikti', mono: true },
            { key: 'dataStatus', label: 'Status Data', align: 'center' },
        ],
        filters: [
            { key: 'search', label: 'Pencarian', type: 'search', placeholder: 'Kode kelas / nama dosen' },
            periodFilter,
            prodiFilter,
            statusDataFilter,
        ],
        statCards: defaultStatCards,
        requiresPeriod: true,
        requiresProdi: true,
        mappingIdentityField: 'kodeKelas',
        syncWeight: 11,
        detailTabs: ['overview', 'comparison', 'validation', 'payload', 'history'],
        searchPlaceholder: 'Cari kelas atau dosen pengajar',
    },

    krs: {
        key: 'krs',
        label: 'KRS / Anggota Kelas',
        singular: 'KRS',
        group: 'perkuliahan',
        route: 'krs',
        apiPath: 'krs',
        icon: 'clipboard-document-check',
        description:
            'Anggota kelas (peserta kelas kuliah) hasil KRS yang disetujui. Memerlukan id mahasiswa, id kelas kuliah, dan periode yang valid.',
        acts: {
            list: 'GetPesertaKelasKuliah',
            count: 'GetCountPesertaKelasKuliah',
            insert: 'InsertPesertaKelasKuliah',
            update: undefined,
            syncCapability: 'full',
            capabilityNote:
                'Peserta kelas dikirim dengan InsertPesertaKelasKuliah. Tidak ada act Update — perubahan keanggotaan dilakukan dengan hapus lalu tambah (tidak dilakukan otomatis oleh integrator).',
        },
        columns: [
            { key: 'nim', label: 'NIM', mono: true, sortable: true },
            { key: 'namaMahasiswa', label: 'Nama Mahasiswa', sortable: true },
            { key: 'kodeKelas', label: 'Kelas', mono: true },
            { key: 'namaMk', label: 'Mata Kuliah' },
            { key: 'sks', label: 'SKS', align: 'right' },
            { key: 'periodeNama', label: 'Periode' },
            { key: 'statusKrs', label: 'Status KRS', align: 'center' },
            { key: 'pddiktiPesertaId', label: 'ID Peserta PDDikti', mono: true },
            { key: 'dataStatus', label: 'Status Data', align: 'center' },
        ],
        filters: [
            { key: 'search', label: 'Pencarian', type: 'search', placeholder: 'NIM / nama mahasiswa / kelas' },
            periodFilter,
            prodiFilter,
            {
                key: 'statusKrs',
                label: 'Status KRS',
                type: 'select',
                options: [
                    { value: 'draft', label: 'Draft' },
                    { value: 'disetujui', label: 'Disetujui' },
                    { value: 'ditolak', label: 'Ditolak' },
                    { value: 'terkunci', label: 'Terkunci' },
                ],
                width: 'w-36',
            },
            statusDataFilter,
        ],
        statCards: defaultStatCards,
        requiresPeriod: true,
        requiresProdi: true,
        mappingIdentityField: 'nim',
        syncWeight: 12,
        detailTabs: ['overview', 'comparison', 'validation', 'payload', 'history'],
        searchPlaceholder: 'Cari NIM, nama mahasiswa, atau kode kelas',
    },

    nilai: {
        key: 'nilai',
        label: 'Nilai Perkuliahan',
        singular: 'Nilai',
        group: 'perkuliahan',
        route: 'nilai',
        apiPath: 'nilai',
        icon: 'chart-bar',
        description:
            'Nilai akhir per mahasiswa per kelas. Hanya tersedia act Update pada Web Service: nilai baru muncul setelah mahasiswa terdaftar sebagai peserta kelas.',
        acts: {
            list: 'GetListNilaiPerkuliahanKelas',
            detail: 'GetDetailNilaiPerkuliahanKelas',
            count: 'GetCountNilaiPerkuliahanKelas',
            update: 'UpdateNilaiPerkuliahanKelas',
            syncCapability: 'update-only',
            capabilityNote:
                'Tidak ada act InsertNilaiPerkuliahanKelas. Nilai dapat dikirim hanya jika mahasiswa sudah menjadi peserta kelas di PDDikti.',
        },
        columns: [
            { key: 'nim', label: 'NIM', mono: true, sortable: true },
            { key: 'namaMahasiswa', label: 'Nama Mahasiswa', sortable: true },
            { key: 'kodeKelas', label: 'Kelas', mono: true },
            { key: 'namaMk', label: 'Mata Kuliah' },
            { key: 'sks', label: 'SKS', align: 'right' },
            { key: 'nilaiAngka', label: 'Nilai Angka', align: 'right' },
            { key: 'nilaiHuruf', label: 'Nilai Huruf', align: 'center' },
            { key: 'bobot', label: 'Bobot', align: 'right', hideable: true },
            { key: 'statusNilai', label: 'Status Nilai', align: 'center' },
            { key: 'dataStatus', label: 'Status Data', align: 'center' },
        ],
        filters: [
            { key: 'search', label: 'Pencarian', type: 'search', placeholder: 'NIM / nama / kelas' },
            periodFilter,
            prodiFilter,
            {
                key: 'statusNilai',
                label: 'Status Nilai',
                type: 'select',
                options: [
                    { value: 'draft', label: 'Draft' },
                    { value: 'final', label: 'Final' },
                    { value: 'belum_final', label: 'Belum Final' },
                ],
                width: 'w-36',
            },
            statusDataFilter,
        ],
        statCards: [
            { key: 'siakad', label: 'Data Nilai SIAKAD', source: 'total', tone: 'info' },
            { key: 'synced', label: 'Sudah Sinkron', source: 'synced', tone: 'success' },
            { key: 'willUpdate', label: 'Perlu Update', source: 'willUpdate', tone: 'warning' },
            { key: 'invalid', label: 'Tidak Valid', source: 'invalid', tone: 'danger' },
        ],
        requiresPeriod: true,
        requiresProdi: true,
        mappingIdentityField: 'nim',
        syncWeight: 13,
        detailTabs: ['overview', 'comparison', 'validation', 'payload', 'history'],
        searchPlaceholder: 'Cari NIM, nama mahasiswa, atau kelas',
    },

    'aktivitas-mahasiswa': {
        key: 'aktivitas-mahasiswa',
        label: 'Aktivitas Mahasiswa',
        singular: 'Aktivitas Mahasiswa',
        group: 'hasil',
        route: 'aktivitas',
        apiPath: 'aktivitas-mahasiswa',
        icon: 'sparkles',
        description:
            'Aktivitas mahasiswa (MBKM, magang, penelitian, pertukaran). Payload induk dikirim lebih dahulu, baru anggotanya.',
        acts: {
            list: 'GetListAktivitasMahasiswa',
            count: 'GetCountAktivitasMahasiswa',
            insert: 'InsertAktivitasMahasiswa',
            update: 'UpdateAktivitasMahasiswa',
            childInsert: 'InsertAnggotaAktivitasMahasiswa',
            syncCapability: 'full',
            capabilityNote: 'Aktivitas dan anggotanya dapat dikirim melalui Web Service.',
        },
        columns: [
            { key: 'judul', label: 'Judul Aktivitas', sortable: true },
            { key: 'kategori', label: 'Kategori' },
            { key: 'jenisAktivitas', label: 'Jenis' },
            { key: 'prodiNama', label: 'Program Studi' },
            { key: 'semesterNama', label: 'Periode' },
            { key: 'tanggalMulai', label: 'Mulai' },
            { key: 'tanggalSelesai', label: 'Selesai' },
            { key: 'jumlahAnggota', label: 'Anggota', align: 'right' },
            { key: 'pddiktiId', label: 'ID PDDikti', mono: true },
            { key: 'dataStatus', label: 'Status Data', align: 'center' },
        ],
        filters: [
            { key: 'search', label: 'Pencarian', type: 'search', placeholder: 'Judul aktivitas' },
            periodFilter,
            prodiFilter,
            {
                key: 'kategori',
                label: 'Kategori',
                type: 'select',
                options: [
                    { value: 'MBKM', label: 'MBKM' },
                    { value: 'Magang', label: 'Magang' },
                    { value: 'Penelitian', label: 'Penelitian' },
                    { value: 'Pertukaran', label: 'Pertukaran Mahasiswa' },
                    { value: 'Lainnya', label: 'Kegiatan Lainnya' },
                ],
                width: 'w-44',
            },
            statusDataFilter,
        ],
        statCards: defaultStatCards,
        requiresPeriod: true,
        requiresProdi: true,
        mappingIdentityField: 'judul',
        syncWeight: 14,
        detailTabs: ['overview', 'siakad', 'comparison', 'validation', 'payload', 'history'],
        searchPlaceholder: 'Cari judul aktivitas mahasiswa',
    },

    kelulusan: {
        key: 'kelulusan',
        label: 'Kelulusan / Status Akhir',
        singular: 'Kelulusan',
        group: 'hasil',
        route: 'kelulusan',
        apiPath: 'kelulusan',
        icon: 'academic-cap',
        description:
            'Status akhir mahasiswa (lulus / DO / pindah) beserta IPK, total SKS, dan nomor SK. Dikirim paling akhir karena menutup riwayat studi.',
        acts: {
            list: 'GetListMahasiswaLulusDO',
            detail: 'GetDetailMahasiswaLulusDO',
            count: 'GetCountMahasiswaLulusDO',
            insert: 'InsertMahasiswaLulusDO',
            update: 'UpdateMahasiswaLulusDO',
            syncCapability: 'full',
            capabilityNote: 'Status kelulusan dapat dikirim dan diperbarui melalui Web Service.',
        },
        columns: [
            { key: 'nim', label: 'NIM', mono: true, sortable: true },
            { key: 'nama', label: 'Nama', sortable: true },
            { key: 'prodiNama', label: 'Program Studi' },
            { key: 'periodeKeluar', label: 'Periode Keluar' },
            { key: 'jenisKeluar', label: 'Jenis Keluar' },
            { key: 'tanggalKeluar', label: 'Tanggal Keluar' },
            { key: 'ipk', label: 'IPK', align: 'right' },
            { key: 'totalSks', label: 'Total SKS', align: 'right' },
            { key: 'nomorSk', label: 'No. SK', mono: true, hideable: true },
            { key: 'dataStatus', label: 'Status Data', align: 'center' },
        ],
        filters: [
            { key: 'search', label: 'Pencarian', type: 'search', placeholder: 'NIM / nama mahasiswa' },
            periodFilter,
            prodiFilter,
            {
                key: 'jenisKeluar',
                label: 'Jenis Keluar',
                type: 'select',
                options: [
                    { value: 'Lulus', label: 'Lulus' },
                    { value: 'Drop Out', label: 'Drop Out' },
                    { value: 'Pindah', label: 'Pindah' },
                    { value: 'Mengundurkan Diri', label: 'Mengundurkan Diri' },
                ],
                width: 'w-48',
            },
            statusDataFilter,
        ],
        statCards: defaultStatCards,
        requiresPeriod: true,
        requiresProdi: true,
        mappingIdentityField: 'nim',
        syncWeight: 15,
        detailTabs: ['overview', 'comparison', 'validation', 'payload', 'history'],
        searchPlaceholder: 'Cari NIM atau nama mahasiswa',
    },
};

export const entityList = Object.values(entityDefinitions);

export const groupedEntities = entityList.reduce<Record<string, EntityDefinition[]>>((groups, entity) => {
    groups[entity.group] = groups[entity.group] ? [...groups[entity.group], entity] : [entity];
    return groups;
}, {});

export const entityGroupLabels: Record<EntityDefinition['group'], string> = {
    institusi: 'Institusi',
    sivitas: 'Sivitas Akademik',
    kurikulum: 'Kurikulum & Mata Kuliah',
    perkuliahan: 'Perkuliahan',
    hasil: 'Hasil Studi',
};

export const getEntityDefinition = (key: EntityKey): EntityDefinition => entityDefinitions[key];
