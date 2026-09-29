import type { JsonObject, JsonValue } from '@/types/common';
import type { ConnectionProfile, EntityKey, MappingStatus, NeoFeederConnectionStatus, SyncJob, SyncLogEntry } from '@/types/integration';
import type { MappingRecord } from '@/types/mapping';
import type { NeoFeederDictionaryResponse } from '@/types/neofeeder';
import type { ReferenceItem, ReferenceKey } from '@/types/reference';
import { dataset, mockUuid, pddiktiMirror } from './sourceData';
import { stableHash } from '@/utils/json';

/**
 * State mock integrator (in-memory, deterministik).
 *
 * Menyimulasikan apa yang pada produksi disimpan backend SIAKAD:
 *  - profil koneksi (password hanya berupa flag `passwordConfigured`)
 *  - status & token Neo Feeder (token TIDAK pernah dikirim ke frontend)
 *  - mapping persistent (memetakan id lokal -> id PDDikti)
 *  - job sinkronisasi + log
 *  - referensi PDDikti
 */

export interface MockTokenState {
    /** token hanya hidup di dalam mock (mensimulasikan penyimpanan backend) */
    value: string | null;
    issuedAt: string | null;
    expiresAt: string | null;
    refreshes: string[];
}

export interface MockState {
    connection: ConnectionProfile;
    status: NeoFeederConnectionStatus;
    token: MockTokenState;
    dictionary: NeoFeederDictionaryResponse | null;
    mappings: Record<EntityKey, Record<string, MappingRecord>>;
    references: Partial<Record<ReferenceKey, ReferenceItem[]>>;
    jobs: SyncJob[];
    logs: SyncLogEntry[];
    connectionEvents: { at: string; action: string; status: string; message: string }[];
    autoMapRuns: { at: string; entity: EntityKey; matched: number; skipped: number; conflicts: number }[];
}

const daysAgo = (days: number, hour = 9): string => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    date.setHours(hour, 12, 0, 0);
    return date.toISOString();
};

const minutesAgo = (minutes: number): string => new Date(Date.now() - minutes * 60_000).toISOString();

const LABELS: Record<EntityKey, (row: Record<string, unknown>) => { code: string; label: string; meta: Record<string, string | number | null> }> = {
    'perguruan-tinggi': (row) => ({
        code: String(row.kodePt ?? ''),
        label: String(row.namaPt ?? ''),
        meta: { kode: String(row.kodePt ?? ''), singkatan: String(row.singkatan ?? '') as string },
    }),
    prodi: (row) => ({
        code: String(row.kodeProdi ?? ''),
        label: String(row.namaProdi ?? ''),
        meta: { jenjang: String(row.jenjang ?? ''), mahasiswa: Number(row.totalMahasiswa ?? 0), mataKuliah: Number(row.totalMataKuliah ?? 0) },
    }),
    semester: (row) => ({
        code: String(row.kode ?? ''),
        label: String(row.namaSemester ?? ''),
        meta: { tahunAjaran: String(row.tahunAjaran ?? ''), status: String(row.status ?? '') },
    }),
    dosen: (row) => ({
        code: String(row.nidn ?? row.nidk ?? row.nip ?? ''),
        label: String(row.nama ?? ''),
        meta: { prodi: String(row.prodiNama ?? ''), kepegawaian: String(row.statusKepegawaian ?? '') },
    }),
    mahasiswa: (row) => ({
        code: String(row.nim ?? ''),
        label: String(row.nama ?? ''),
        meta: { prodi: String(row.prodiNama ?? ''), angkatan: String(row.angkatan ?? ''), status: String(row.status ?? '') },
    }),
    'riwayat-pendidikan': (row) => ({
        code: String(row.nim ?? ''),
        label: `${String(row.nim ?? '')} — ${String(row.nama ?? '')}`,
        meta: { periodeMasuk: String(row.semesterMasuk ?? ''), jalur: String(row.jalurMasuk ?? '') },
    }),
    kurikulum: (row) => ({
        code: String(row.kode ?? ''),
        label: String(row.nama ?? ''),
        meta: { prodi: String(row.prodiNama ?? ''), totalSks: Number(row.totalSks ?? 0) },
    }),
    'mata-kuliah': (row) => ({
        code: String(row.kode ?? ''),
        label: String(row.nama ?? ''),
        meta: { prodi: String(row.prodiNama ?? ''), sks: Number(row.sks ?? 0), jenis: String(row.jenis ?? '') },
    }),
    'mata-kuliah-kurikulum': (row) => ({
        code: `${String(row.kodeKurikulum ?? '')}/${String(row.kodeMk ?? '')}`,
        label: `${String(row.kodeMk ?? '')} — ${String(row.namaMk ?? '')}`,
        meta: { kurikulum: String(row.kodeKurikulum ?? ''), semester: Number(row.semester ?? 0) },
    }),
    kelas: (row) => ({
        code: String(row.kodeKelas ?? ''),
        label: `${String(row.kodeKelas ?? '')} — ${String(row.namaMk ?? '')}`,
        meta: { prodi: String(row.prodiNama ?? ''), periode: String(row.periodeNama ?? ''), kapasitas: Number(row.kapasitas ?? 0) },
    }),
    'dosen-pengajar': (row) => ({
        code: `${String(row.kodeKelas ?? '')}|${String(row.nim ?? '')}`,
        label: `${String(row.nama ?? '')} — ${String(row.kodeKelas ?? '')}`,
        meta: { peran: String(row.peran ?? ''), periode: String(row.periodeNama ?? '') },
    }),
    krs: (row) => ({
        code: `${String(row.nim ?? '')}/${String(row.kodeKelas ?? '')}`,
        label: `${String(row.nim ?? '')} — ${String(row.namaMk ?? '')}`,
        meta: { kelas: String(row.kodeKelas ?? ''), statusKrs: String(row.statusKrs ?? '') },
    }),
    nilai: (row) => ({
        code: `${String(row.nim ?? '')}/${String(row.kodeKelas ?? '')}`,
        label: `${String(row.nim ?? '')} — ${String(row.namaMk ?? '')}`,
        meta: { nilaiHuruf: String(row.nilaiHuruf ?? '-'), status: String(row.statusNilai ?? '') },
    }),
    'aktivitas-mahasiswa': (row) => ({
        code: `AKT-${String(row.id ?? '')}`,
        label: String(row.judul ?? ''),
        meta: { kategori: String(row.kategori ?? ''), jenis: String(row.jenisAktivitas ?? '') },
    }),
    kelulusan: (row) => ({
        code: String(row.nim ?? ''),
        label: `${String(row.nim ?? '')} — ${String(row.nama ?? '')}`,
        meta: { jenisKeluar: String(row.jenisKeluar ?? ''), periode: String(row.periodeKeluar ?? '') },
    }),
};

const entityRows = (entity: EntityKey): Record<string, unknown>[] => {
    switch (entity) {
        case 'perguruan-tinggi':
            return [dataset.perguruanTinggi as unknown as Record<string, unknown>];
        case 'prodi':
            return dataset.prodi as unknown as Record<string, unknown>[];
        case 'semester':
            return dataset.semester as unknown as Record<string, unknown>[];
        case 'dosen':
            return dataset.dosen as unknown as Record<string, unknown>[];
        case 'mahasiswa':
            return dataset.mahasiswa as unknown as Record<string, unknown>[];
        case 'riwayat-pendidikan':
            return dataset.riwayat as unknown as Record<string, unknown>[];
        case 'kurikulum':
            return dataset.kurikulum as unknown as Record<string, unknown>[];
        case 'mata-kuliah':
            return dataset.mataKuliah as unknown as Record<string, unknown>[];
        case 'mata-kuliah-kurikulum':
            return dataset.kurikulumItems as unknown as Record<string, unknown>[];
        case 'kelas':
            return dataset.kelas as unknown as Record<string, unknown>[];
        case 'dosen-pengajar':
            return dataset.pengajar as unknown as Record<string, unknown>[];
        case 'krs':
            return dataset.krs as unknown as Record<string, unknown>[];
        case 'nilai':
            return dataset.nilai as unknown as Record<string, unknown>[];
        case 'aktivitas-mahasiswa':
            return dataset.aktivitas as unknown as Record<string, unknown>[];
        case 'kelulusan':
            return dataset.kelulusan as unknown as Record<string, unknown>[];
        default:
            return [];
    }
};

const MAPPING_EXTERNAL_ID_FIELD: Partial<Record<EntityKey, string>> = {
    'perguruan-tinggi': 'id_perguruan_tinggi',
    prodi: 'id_prodi',
    semester: 'id_semester',
    dosen: 'id_dosen',
    mahasiswa: 'id_mahasiswa',
    'riwayat-pendidikan': 'id_registrasi_mahasiswa',
    kurikulum: 'id_kurikulum',
    'mata-kuliah': 'id_matkul',
    'mata-kuliah-kurikulum': 'id_matkul_kurikulum',
    kelas: 'id_kelas_kuliah',
    'dosen-pengajar': 'id_aktivitas_mengajar',
    krs: 'id_peserta_kelas_kuliah',
    nilai: 'id_nilai_perkuliahan_kelas',
    'aktivitas-mahasiswa': 'id_aktivitas',
    kelulusan: 'id_registrasi_mahasiswa',
};

const externalLabelField = (remote: JsonObject): string =>
    String(remote.nama_mahasiswa ?? remote.nama_program_studi ?? remote.nama_kelas_kuliah ?? remote.nama_dosen ?? remote.nama_mata_kuliah ?? remote.judul ?? remote.nim ?? '');

export const buildInitialMappings = (): Record<EntityKey, Record<string, MappingRecord>> => {
    const mappings = {} as Record<EntityKey, Record<string, MappingRecord>>;

    (Object.keys(LABELS) as EntityKey[]).forEach((entity) => {
        const rows = entityRows(entity);
        mappings[entity] = {};

        rows.forEach((row) => {
            const localId = String(row.localId || row.id);
            const { code, label, meta } = LABELS[entity](row);
            const remote = pddiktiMirror[entity]?.[localId] ?? null;
            const idField = MAPPING_EXTERNAL_ID_FIELD[entity] ?? 'id';
            const externalId = remote ? String(remote[idField] ?? '') || null : null;
            const hash = stableHash(`${entity}-${localId}`) % 100;

            let status: MappingStatus = externalId ? 'MAPPED' : 'UNMAPPED';
            if (externalId && hash < 4) status = 'CONFLICT';
            if (externalId && hash >= 4 && hash < 6) status = 'INVALID';

            mappings[entity][localId] = {
                entity,
                localId,
                localCode: code,
                localLabel: label,
                localMeta: meta,
                externalId: status === 'UNMAPPED' ? null : externalId,
                externalCode:
                    status === 'MAPPED'
                        ? entity === 'semester'
                            ? String(remote?.id_semester ?? '')
                            : String(remote?.kode_program_studi ?? remote?.kode_mata_kuliah ?? remote?.kode_kurikulum ?? remote?.nidn ?? remote?.nim ?? '')
                        : null,
                externalLabel: status === 'MAPPED' && remote ? externalLabelField(remote) || label : null,
                mappingType: status === 'MAPPED' ? (entity === 'nilai' || entity === 'krs' ? 'manual' : 'by-identity') : null,
                status,
                confidence: status === 'MAPPED' ? 0.9 + (hash % 10) / 100 : status === 'CONFLICT' ? 0.55 : null,
                lastSyncedAt: status === 'MAPPED' && hash < 70 ? daysAgo((hash % 20) + 1) : null,
                lastMessage:
                    status === 'CONFLICT'
                        ? 'Ditemukan lebih dari satu kandidat PDDikti yang mirip. Perlu keputusan operator.'
                        : status === 'INVALID'
                          ? 'Data identitas lokal tidak lengkap untuk pencocokan.'
                          : null,
            };
        });
    });

    return mappings;
};

const referenceItem = (id: string, name: string, extra: Partial<ReferenceItem> = {}): ReferenceItem => ({
    id,
    name,
    active: true,
    ...extra,
});

const buildReferences = (): Partial<Record<ReferenceKey, ReferenceItem[]>> => {
    const agamaLocal = ['Islam', 'Islam', 'Islam', 'Kristen', 'Hindu', 'Buddha'];
    const pembiayaanLocal = ['Mandiri', 'KIP Kuliah', 'Beasiswa Yayasan'];
    const jalurLocal = ['SNBP', 'SNBT', 'Mandiri', 'Prestasi'];
    const jenisDaftarLocal = ['Mahasiswa Baru', 'Transfer', 'Alih Jenjang'];
    const statusMhsLocal = ['aktif', 'cuti', 'nonaktif', 'lulus'];

    return {
        'perguruan-tinggi': [
            referenceItem(dataset.perguruanTinggi.pddiktiId ?? dataset.perguruanTinggi.kodePt, dataset.perguruanTinggi.namaPt, {
                code: dataset.perguruanTinggi.kodePt,
                description: dataset.perguruanTinggi.singkatan,
                usedBySiakad: 1,
                localValue: dataset.perguruanTinggi.kodePt,
            }),
        ],
        'program-studi': Object.values(pddiktiMirror.prodi).map((item) => {
            const kode = String(item.kode_program_studi ?? '');
            const local = dataset.prodi.find((prodi) => prodi.kodeProdi === 'TI' ? kode === '55201' : prodi.kodeProdi === 'SI' ? kode === '57201' : prodi.kodeProdi === 'MI' ? kode === '57401' : kode === '56401');
            return referenceItem(String(item.id_prodi ?? ''), String(item.nama_program_studi ?? ''), {
                code: kode,
                description: String(item.nama_jenjang_pendidikan ?? ''),
                usedBySiakad: local ? dataset.mahasiswa.filter((mhs) => mhs.prodiId === local.id).length : 0,
                localValue: local?.kodeProdi ?? null,
            });
        }),
        semester: dataset.semester
            .filter((item) => item.pddiktiKode)
            .map((item) =>
                referenceItem(String(item.pddiktiKode), item.namaSemester, {
                    code: String(item.pddiktiKode),
                    description: `${item.tanggalMulai} s.d. ${item.tanggalSelesai}`,
                    usedBySiakad: dataset.kelas.filter((kelas) => kelas.semesterId === item.id).length,
                    localValue: item.kode,
                }),
            ),
        'tahun-ajaran': Array.from(new Set(dataset.semester.map((item) => item.tahunAjaran))).map((tahun) =>
            referenceItem(tahun.replace('/', ''), tahun, { code: tahun, usedBySiakad: dataset.semester.filter((item) => item.tahunAjaran === tahun).length }),
        ),
        periode: [
            referenceItem('20251', '2025/2026 Ganjil', { code: '20251', description: 'Periode pelaporan aktif', usedBySiakad: dataset.kelas.length }),
            referenceItem('20242', '2024/2025 Genap', { code: '20242', usedBySiakad: 0 }),
            referenceItem('20241', '2024/2025 Ganjil', { code: '20241', usedBySiakad: 0 }),
        ],
        'jenjang-pendidikan': ['D3', 'D4', 'S1', 'S2', 'S3'].map((kode, index) =>
            referenceItem(String(index + 1), kode, { code: kode, usedBySiakad: dataset.prodi.filter((prodi) => prodi.jenjang === kode).length }),
        ),
        'bentuk-pendidikan': ['Akademik', 'Vokasi', 'Profesi'].map((nama, index) => referenceItem(String(index + 1), nama, { code: String(index + 1) })),
        agama: ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'].map((nama, index) =>
            referenceItem(String(index + 1), nama, {
                code: String(index + 1),
                usedBySiakad: dataset.mahasiswa.filter((mhs) => mhs.agama === nama).length,
                localValue: agamaLocal.includes(nama) ? nama : null,
            }),
        ),
        'jenis-kelamin': [
            referenceItem('L', 'Laki-laki', { code: 'L', usedBySiakad: dataset.mahasiswa.filter((mhs) => mhs.jenisKelamin === 'L').length, localValue: 'L' }),
            referenceItem('P', 'Perempuan', { code: 'P', usedBySiakad: dataset.mahasiswa.filter((mhs) => mhs.jenisKelamin === 'P').length, localValue: 'P' }),
        ],
        'status-mahasiswa': ['Aktif', 'Cuti', 'Lulus', 'Putus Studi', 'Nonaktif'].map((nama, index) =>
            referenceItem(String(index + 1), nama, {
                code: String(index + 1),
                usedBySiakad: dataset.mahasiswa.filter((mhs) => mhs.status.toLowerCase().startsWith(nama.toLowerCase().slice(0, 4))).length,
                localValue: statusMhsLocal.includes(nama.toLowerCase()) ? nama.toLowerCase() : null,
            }),
        ),
        'jenis-pendaftaran': ['Mahasiswa Baru', 'Transfer', 'Alih Jenjang', 'RPL Perolehan SKS', 'Re-entry'].map((nama, index) =>
            referenceItem(String(index + 1), nama, {
                code: String(index + 1),
                usedBySiakad: dataset.mahasiswa.filter((mhs) => mhs.jenisPendaftaran === nama).length,
                localValue: jenisDaftarLocal.includes(nama) ? nama : null,
            }),
        ),
        'jalur-masuk': ['SNBP', 'SNBT', 'Mandiri', 'Prestasi', 'Kerjasama'].map((nama, index) =>
            referenceItem(String(index + 1), nama, {
                code: String(index + 1),
                usedBySiakad: dataset.mahasiswa.filter((mhs) => mhs.jalurMasuk === nama).length,
                localValue: jalurLocal.includes(nama) ? nama : null,
            }),
        ),
        'jenis-keluar': ['Lulus', 'Putus Studi', 'Pindah', 'Mengundurkan Diri', 'Meninggal Dunia'].map((nama, index) =>
            referenceItem(String(index + 1), nama, { code: String(index + 1), usedBySiakad: dataset.kelulusan.filter((item) => item.jenisKeluar === nama).length, localValue: nama }),
        ),
        'jenis-tinggal': ['Bersama Orang Tua', 'Kost', 'Asrama', 'Wali'].map((nama, index) => referenceItem(String(index + 1), nama, { code: String(index + 1) })),
        pembiayaan: ['Mandiri', 'KIP Kuliah', 'Beasiswa Yayasan', 'Beasiswa Prestasi', 'Beasiswa Pemerintah'].map((nama, index) =>
            referenceItem(String(index + 1), nama, {
                code: String(index + 1),
                usedBySiakad: dataset.mahasiswa.filter((mhs) => mhs.pembiayaan === nama).length,
                localValue: pembiayaanLocal.includes(nama) ? nama : null,
            }),
        ),
        'kebutuhan-khusus': ['Tidak Ada', 'Tunanetra', 'Tunarungu', 'Tunadaksa'].map((nama, index) => referenceItem(String(index + 1), nama, { code: String(index + 1) })),
        'alat-transportasi': ['Jalan Kaki', 'Sepeda', 'Sepeda Motor', 'Mobil', 'Angkutan Umum'].map((nama, index) => referenceItem(String(index + 1), nama, { code: String(index + 1) })),
        pekerjaan: ['Tidak Bekerja', 'Petani', 'Pedagang', 'PNS', 'TNI/Polri', 'Karyawan Swasta', 'Wiraswasta', 'Guru', 'Buruh'].map((nama, index) => referenceItem(String(index + 1), nama, { code: String(index + 1) })),
        penghasilan: ['< 1 juta', '1 - 2 juta', '2 - 5 juta', '5 - 10 juta', '> 10 juta'].map((nama, index) => referenceItem(String(index + 1), nama, { code: String(index + 1) })),
        'status-kepegawaian': ['PNS/PPPK', 'Non PNS', 'Yayasan'].map((nama, index) =>
            referenceItem(String(index + 1), nama, {
                code: String(index + 1),
                usedBySiakad: dataset.dosen.filter((dosen) => (dosen.statusKepegawaian === 'tetap' ? nama === 'PNS/PPPK' : nama === 'Non PNS')).length,
                localValue: nama === 'PNS/PPPK' ? 'tetap' : nama === 'Non PNS' ? 'tidak_tetap' : null,
            }),
        ),
        'ikatan-kerja': ['Diperbantukan', 'Tetap', 'Kontrak'].map((nama, index) => referenceItem(String(index + 1), nama, { code: String(index + 1) })),
        'jabatan-fungsional': ['Asisten Ahli', 'Lektor', 'Lektor Kepala', 'Guru Besar', 'Tenaga Pengajar'].map((nama, index) =>
            referenceItem(String(index + 1), nama, { code: String(index + 1), usedBySiakad: dataset.dosen.filter((dosen) => dosen.jabatanAkademik === nama).length }),
        ),
        'pangkat-golongan': ['III/a', 'III/b', 'III/c', 'III/d', 'IV/a', 'IV/b'].map((nama, index) => referenceItem(String(index + 1), nama, { code: nama })),
        'jenis-sertifikasi': ['Sertifikasi Dosen', 'Sertifikasi Profesi', 'Sertifikasi Kompetensi'].map((nama, index) => referenceItem(String(index + 1), nama, { code: String(index + 1) })),
        'kategori-kegiatan': ['MBKM', 'Magang', 'Penelitian', 'Pertukaran', 'Pengabdian'].map((nama, index) =>
            referenceItem(String(index + 1), nama, { code: String(index + 1), usedBySiakad: dataset.aktivitas.filter((item) => item.kategori === nama).length, localValue: nama }),
        ),
        'jenis-aktivitas-mahasiswa': [
            'Magang/Praktik Kerja',
            'Studi Independen',
            'Pertukaran Mahasiswa',
            'Asistensi Mengajar',
            'Penelitian',
            'Kewirausahaan',
        ].map((nama, index) => referenceItem(String(index + 1), nama, { code: String(index + 1), usedBySiakad: dataset.aktivitas.filter((item) => item.jenisAktivitas === nama).length })),
        'skala-nilai': [
            { huruf: 'A', min: 85, max: 100, bobot: 4 },
            { huruf: 'AB', min: 80, max: 84, bobot: 3.5 },
            { huruf: 'B', min: 73, max: 79, bobot: 3 },
            { huruf: 'BC', min: 66, max: 72, bobot: 2.5 },
            { huruf: 'C', min: 60, max: 65, bobot: 2 },
            { huruf: 'D', min: 45, max: 59, bobot: 1 },
            { huruf: 'E', min: 0, max: 44, bobot: 0 },
        ].map((item, index) =>
            referenceItem(String(index + 1), item.huruf, {
                code: item.huruf,
                description: `${item.min} – ${item.max} (bobot ${item.bobot})`,
                usedBySiakad: dataset.nilai.filter((nilai) => nilai.nilaiHuruf === item.huruf).length,
                localValue: item.huruf,
                extra: { bobot: item.bobot, nilai_min: item.min, nilai_max: item.max, id_prodi: pddiktiMirror.prodi['1']?.id_prodi ?? null },
            }),
        ),
        wilayah: [
            { id: '32', nama: 'Jawa Barat' },
            { id: '3201', nama: 'Kabupaten Bogor' },
            { id: '3201100', nama: 'Kecamatan Ciawi' },
            { id: '3201100001', nama: 'Desa Banjarwangi' },
            { id: '31', nama: 'DKI Jakarta' },
            { id: '3174', nama: 'Kota Jakarta Selatan' },
        ].map((item) => referenceItem(item.id, item.nama, { code: item.id })),
        negara: [
            { id: 'ID', nama: 'Indonesia' },
            { id: 'MY', nama: 'Malaysia' },
            { id: 'SG', nama: 'Singapura' },
            { id: 'EG', nama: 'Mesir' },
        ].map((item) => referenceItem(item.id, item.nama, { code: item.id, usedBySiakad: item.id === 'ID' ? dataset.mahasiswa.length : 0 })),
        'level-wilayah': [
            { id: '1', nama: 'Provinsi' },
            { id: '2', nama: 'Kabupaten/Kota' },
            { id: '3', nama: 'Kecamatan' },
            { id: '4', nama: 'Desa/Kelurahan' },
        ].map((item) => referenceItem(item.id, item.nama, { code: item.id })),
        fakultas: [referenceItem(mockUuid('fakultas-fti'), 'Fakultas Teknologi Informasi', { code: 'FTI', usedBySiakad: dataset.prodi.length })],
    };
};

const seededLogs = (): SyncLogEntry[] => {
    const logs: SyncLogEntry[] = [];
    const mahasiswaSampel = dataset.mahasiswa.slice(0, 12);
    const kelasSampel = dataset.kelas.slice(0, 8);

    mahasiswaSampel.forEach((mhs, index) => {
        const failed = index % 5 === 2;
        logs.push({
            id: `log-seed-${index + 1}`,
            requestId: `req-${mockUuid(`log-${mhs.nim}`).slice(0, 12)}`,
            entity: 'mahasiswa',
            localId: String(mhs.id),
            localLabel: `${mhs.nim} — ${mhs.nama}`,
            pddiktiId: pddiktiMirror.mahasiswa[String(mhs.id)]?.id_mahasiswa ? String(pddiktiMirror.mahasiswa[String(mhs.id)].id_mahasiswa) : null,
            act: index % 3 === 0 ? 'InsertBiodataMahasiswa' : 'UpdateBiodataMahasiswa',
            action: index % 3 === 0 ? 'INSERT' : 'UPDATE',
            payload: {
                act: index % 3 === 0 ? 'InsertBiodataMahasiswa' : 'UpdateBiodataMahasiswa',
                token: '[HIDDEN]',
                record: {
                    nama_mahasiswa: mhs.nama,
                    jenis_kelamin: mhs.jenisKelamin,
                    tanggal_lahir: mhs.tanggalLahir,
                    id_agama: '1',
                    handphone: mhs.noHp,
                    email: mhs.email,
                },
            },
            response: failed
                ? { error_code: 400, error_desc: 'NIK tidak boleh kosong', data: [] }
                : { error_code: 0, error_desc: '', data: [{ id_mahasiswa: String(pddiktiMirror.mahasiswa[String(mhs.id)]?.id_mahasiswa ?? '') }] },
            httpStatus: failed ? 200 : 200,
            neoFeederCode: failed ? 400 : 0,
            neoFeederMessage: failed ? 'NIK tidak boleh kosong' : 'Sukses',
            status: failed ? 'failed' : 'success',
            errorCategory: failed ? 'VALIDATION_ERROR' : null,
            durationMs: 380 + index * 27,
            attempt: failed ? 2 : 1,
            user: 'Admin Akademik',
            jobId: null,
            createdAt: minutesAgo(160 - index * 7),
        });
    });

    kelasSampel.forEach((kelas, index) => {
        const failed = index % 4 === 3;
        logs.push({
            id: `log-seed-kelas-${index + 1}`,
            requestId: `req-${mockUuid(`log-kelas-${kelas.kodeKelas}`).slice(0, 12)}`,
            entity: 'kelas',
            localId: String(kelas.id),
            localLabel: `${kelas.kodeKelas} — ${kelas.namaMk}`,
            pddiktiId: pddiktiMirror.kelas[String(kelas.id)]?.id_kelas_kuliah ? String(pddiktiMirror.kelas[String(kelas.id)].id_kelas_kuliah) : null,
            act: index % 2 === 0 ? 'InsertKelasKuliah' : 'UpdateKelasKuliah',
            action: index % 2 === 0 ? 'INSERT' : 'UPDATE',
            payload: {
                act: index % 2 === 0 ? 'InsertKelasKuliah' : 'UpdateKelasKuliah',
                token: '[HIDDEN]',
                record: {
                    id_prodi: pddiktiMirror.prodi[String(kelas.prodiId)]?.id_prodi ?? null,
                    id_semester: '20251',
                    nama_kelas_kuliah: kelas.namaKelas,
                    id_matkul: pddiktiMirror['mata-kuliah'][String(kelas.mataKuliahId)]?.id_matkul ?? null,
                    sks_mk: kelas.sks,
                    kapasitas: kelas.kapasitas,
                },
            },
            response: failed
                ? { error_code: 500, error_desc: 'Gateway timeout saat menghubungi server PDDikti', data: [] }
                : { error_code: 0, error_desc: '', data: [{ id_kelas_kuliah: String(pddiktiMirror.kelas[String(kelas.id)]?.id_kelas_kuliah ?? '') }] },
            httpStatus: failed ? 504 : 200,
            neoFeederCode: failed ? 500 : 0,
            neoFeederMessage: failed ? 'Gateway timeout saat menghubungi server PDDikti' : 'Sukses',
            status: failed ? 'failed' : 'success',
            errorCategory: failed ? 'TIMEOUT' : null,
            durationMs: failed ? 12_400 : 540 + index * 33,
            attempt: failed ? 3 : 1,
            user: 'Admin Akademik',
            jobId: null,
            createdAt: minutesAgo(95 - index * 5),
        });
    });

    return logs.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
};

export const mockState: MockState = {
    connection: {
        baseUrl: 'http://10.10.20.15:8082',
        webServiceUrl: 'http://10.10.20.15:8082/ws/live2.php',
        username: 'operator.siakad',
        passwordConfigured: true,
        timeoutSeconds: 30,
        retryCount: 2,
        active: true,
        useProxy: true,
    },
    status: {
        status: 'CONNECTED',
        serverVersion: '3.1',
        apiStatus: 'aktif',
        lastConnectedAt: minutesAgo(12),
        lastSuccessfulRequestAt: minutesAgo(9),
        tokenExpiresAt: new Date(Date.now() + 42 * 60_000).toISOString(),
        message: null,
    },
    token: {
        value: mockUuid('mock-token'),
        issuedAt: minutesAgo(48),
        expiresAt: new Date(Date.now() + 42 * 60_000).toISOString(),
        refreshes: [minutesAgo(48), minutesAgo(300), daysAgo(1, 8)],
    },
    dictionary: null,
    mappings: buildInitialMappings(),
    references: buildReferences(),
    jobs: [],
    logs: seededLogs(),
    connectionEvents: [
        { at: minutesAgo(48), action: 'Autentikasi', status: 'CONNECTED', message: 'Token diperoleh dari Web Service Neo Feeder.' },
        { at: minutesAgo(160), action: 'Uji koneksi', status: 'CONNECTED', message: 'Web service merespons dalam 214 ms.' },
        { at: daysAgo(1, 15), action: 'Uji koneksi', status: 'TIMEOUT', message: 'Tidak ada respons dalam 30 detik.' },
    ],
    autoMapRuns: [],
};

/** Baris entitas yang sudah dilengkapi metadata mapping untuk kebutuhan list/detail. */
export const entityMetaRow = (entity: EntityKey, localId: string, remote: JsonObject | null): {
    mappingStatus: MappingStatus;
    pddiktiId: string | null;
    lastSyncAt: string | null;
    lastAction: 'INSERT' | 'UPDATE' | null;
} => {
    const record = mockState.mappings[entity]?.[localId];
    const lastLog = mockState.logs.find((log) => log.entity === entity && log.localId === localId);
    return {
        mappingStatus: record?.status ?? 'UNMAPPED',
        pddiktiId: record?.externalId ?? null,
        lastSyncAt: record?.lastSyncedAt ?? lastLog?.createdAt ?? null,
        lastAction: lastLog && lastLog.action !== 'SKIP' ? lastLog.action : null,
    };
};

export const resetMockState = (): void => {
    mockState.jobs = [];
    mockState.logs = seededLogs();
    mockState.mappings = buildInitialMappings();
    mockState.dictionary = null;
    mockState.autoMapRuns = [];
};

/** Utilitas untuk mock: tanggal ISO relatif terhadap sekarang. */
export const isoNow = (): string => new Date().toISOString();

/* --------------------------------------------------------------------------
 * Persistensi state mock (sessionStorage)
 * --------------------------------------------------------------------------
 * Menyimulasikan sifat "persistent" pada produksi (mapping & job tersimpan di
 * backend). Hanya data non-sensitif yang disimpan: token TIDAK pernah
 * dipersist — nilainya selalu dibuang sebelum serialisasi.
 */
const PERSIST_KEY = 'integrator.mock-state.v1';
const PERSIST_VERSION = 1;
const MAX_PERSISTED_LOGS = 200;

interface PersistedShape {
    version: number;
    savedAt: string;
    connection: MockState['connection'];
    status: MockState['status'];
    dictionary: MockState['dictionary'];
    mappings: MockState['mappings'];
    jobs: MockState['jobs'];
    logs: MockState['logs'];
    connectionEvents: MockState['connectionEvents'];
    autoMapRuns: MockState['autoMapRuns'];
}

let persistTimer: number | null = null;
let restored = false;

export const persistMockState = (): void => {
    if (typeof window === 'undefined') return;
    if (persistTimer !== null) window.clearTimeout(persistTimer);

    persistTimer = window.setTimeout(() => {
        persistTimer = null;
        try {
            const shape: PersistedShape = {
                version: PERSIST_VERSION,
                savedAt: isoNow(),
                connection: mockState.connection,
                status: mockState.status,
                dictionary: mockState.dictionary,
                mappings: mockState.mappings,
                jobs: mockState.jobs.slice(0, 20),
                logs: mockState.logs.slice(0, MAX_PERSISTED_LOGS),
                connectionEvents: mockState.connectionEvents.slice(0, 20),
                autoMapRuns: mockState.autoMapRuns.slice(0, 20),
            };
            window.sessionStorage.setItem(PERSIST_KEY, JSON.stringify(shape));
        } catch {
            /* kuota penuh / private mode — abaikan */
        }
    }, 250);
};

export const restoreMockState = (): void => {
    if (restored || typeof window === 'undefined') return;
    restored = true;

    try {
        const raw = window.sessionStorage.getItem(PERSIST_KEY);
        if (!raw) return;
        const shape = JSON.parse(raw) as PersistedShape;
        if (shape.version !== PERSIST_VERSION) return;

        mockState.connection = shape.connection;
        mockState.status = shape.status;
        mockState.dictionary = shape.dictionary;
        mockState.mappings = shape.mappings;
        mockState.jobs = shape.jobs;
        mockState.logs = shape.logs;
        mockState.connectionEvents = shape.connectionEvents;
        mockState.autoMapRuns = shape.autoMapRuns;
        // Token tidak pernah dipersist: sesi mock selalu memakai token baru.
        mockState.token = {
            value: mockUuid(`token-restored-${Date.now()}`),
            issuedAt: isoNow(),
            expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
            refreshes: [isoNow()],
        };
    } catch {
        /* data rusak — abaikan dan pakai state awal */
    }
};

export const clearPersistedMockState = (): void => {
    if (typeof window === 'undefined') return;
    try {
        window.sessionStorage.removeItem(PERSIST_KEY);
    } catch {
        /* abaikan */
    }
};
