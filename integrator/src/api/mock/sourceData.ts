import type { JsonObject } from '@/types/common';
import type {
    SiakadAktivitas,
    SiakadDosen,
    SiakadKelas,
    SiakadKelulusan,
    SiakadKrs,
    SiakadKurikulum,
    SiakadKurikulumItem,
    SiakadMahasiswa,
    SiakadMataKuliah,
    SiakadNilai,
    SiakadProdi,
    SiakadPerguruanTinggi,
    SiakadSemester,
} from '@/types/siakad';
import type { SiakadDosenPengajarRow, SiakadRiwayatRow } from '@/types/rows';
import { stableHash } from '@/utils/json';

/**
 * Dataset mock SIAKAD.
 *
 * Data dibuat deterministik (seeded PRNG) dan disusun mengikuti data seeder
 * SIAKAD yang ada di repository: prodi TI/SI/MI/TK/IF, mata kuliah TI101
 * "Algoritma dan Pemrograman", NIM pola 2021001001, dan dosen dengan NIDN.
 * Tujuannya: mengembangkan UI tanpa backend aktif — bukan menggantikan SIAKAD.
 */

const mulberry32 = (seed: number): (() => number) => {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

const random = mulberry32(20260214);

const pick = <T>(items: T[]): T => items[Math.floor(random() * items.length)];
const intBetween = (min: number, max: number): number => min + Math.floor(random() * (max - min + 1));

export const mockUuid = (seed: string): string => {
    const hash = stableHash(seed);
    const part = (offset: number): string =>
        (hash ^ (offset * 2654435761)) >>> 0 ? ((hash ^ (offset * 2654435761)) >>> 0).toString(16).padStart(8, '0') : '00000000';
    return `${part(1)}-${part(2).slice(0, 4)}-${part(3).slice(0, 4)}-${part(4).slice(0, 4)}-${part(5)}${part(6).slice(0, 4)}`;
};

const FIRST_NAMES_L = [
    'Ahmad Rizki', 'Muhammad Fadli', 'Bagas', 'Yusuf', 'Hafizh', 'Rafi', 'Dimas', 'Ilham', 'Arif', 'Fajar',
    'Zulfikar', 'Rangga', 'Satria', 'Bayu', 'Naufal', 'Farhan', 'Reza', 'Andika', 'Gilang', 'Wahyu',
];
const FIRST_NAMES_P = [
    'Siti Nurhaliza', 'Aisyah', 'Nabila', 'Putri', 'Dewi', 'Rania', 'Salma', 'Anisa', 'Khadijah', 'Zahra',
    'Fitri', 'Laila', 'Hanifah', 'Mutiara', 'Syifa', 'Nadia', 'Amelia', 'Rahma', 'Alifa', 'Karina',
];
const LAST_NAMES = [
    'Pratama', 'Rahman', 'Nurhaliza', 'Saputra', 'Wijaya', 'Hidayat', 'Maulana', 'Ramadhan', 'Fauziah', 'Anggraini',
    'Salsabila', 'Permata', 'Kusuma', 'Nugroho', 'Halim', 'Syahputra', 'Mulyani', 'Ardiansyah', 'Purnama', 'Hakim',
];

const CITIES = [
    'Bogor', 'Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Semarang', 'Depok', 'Bekasi', 'Tangerang', 'Cianjur',
];
const AGAMA = ['Islam', 'Islam', 'Islam', 'Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha'];
const JALUR = ['SNBP', 'SNBT', 'Mandiri', 'Prestasi', 'Kerjasama'];
const JENIS_DAFTAR = ['Mahasiswa Baru', 'Transfer', 'Alih Jenjang', 'RPL Perolehan SKS'];
const PEMBIAYAAN = ['Mandiri', 'KIP Kuliah', 'Beasiswa Yayasan', 'Beasiswa Prestasi'];

export interface MockDataset {
    perguruanTinggi: SiakadPerguruanTinggi;
    prodi: SiakadProdi[];
    semester: SiakadSemester[];
    mahasiswa: SiakadMahasiswa[];
    dosen: SiakadDosen[];
    mataKuliah: SiakadMataKuliah[];
    kurikulum: SiakadKurikulum[];
    kurikulumItems: SiakadKurikulumItem[];
    kelas: SiakadKelas[];
    pengajar: SiakadDosenPengajarRow[];
    krs: SiakadKrs[];
    nilai: SiakadNilai[];
    riwayat: SiakadRiwayatRow[];
    aktivitas: SiakadAktivitas[];
    kelulusan: SiakadKelulusan[];
}

const PRODI_SEED: { kode: string; nama: string; jenjang: string; pddiktiKode: string }[] = [
    { kode: 'TI', nama: 'Teknik Informatika', jenjang: 'S1', pddiktiKode: '55201' },
    { kode: 'SI', nama: 'Sistem Informasi', jenjang: 'S1', pddiktiKode: '57201' },
    { kode: 'MI', nama: 'Manajemen Informatika', jenjang: 'D3', pddiktiKode: '57401' },
    { kode: 'TK', nama: 'Teknik Komputer', jenjang: 'D4', pddiktiKode: '56401' },
    { kode: 'IF', nama: 'Informatika', jenjang: 'S2', pddiktiKode: '55101' },
];

const SEMESTER_SEED: { kode: string; nama: string; tahun: string; mulai: string; selesai: string; status: string; pddikti: string | null }[] = [
    { kode: '20211', nama: '2021/2022 Ganjil', tahun: '2021/2022', mulai: '2021-09-06', selesai: '2022-01-28', status: 'selesai', pddikti: '20211' },
    { kode: '20221', nama: '2022/2023 Ganjil', tahun: '2022/2023', mulai: '2022-09-05', selesai: '2023-01-27', status: 'selesai', pddikti: '20221' },
    { kode: '20231', nama: '2023/2024 Ganjil', tahun: '2023/2024', mulai: '2023-09-04', selesai: '2024-01-26', status: 'selesai', pddikti: '20231' },
    { kode: '20232', nama: '2023/2024 Genap', tahun: '2023/2024', mulai: '2024-02-19', selesai: '2024-06-28', status: 'selesai', pddikti: '20232' },
    { kode: '20241', nama: '2024/2025 Ganjil', tahun: '2024/2025', mulai: '2024-09-02', selesai: '2025-01-24', status: 'selesai', pddikti: '20241' },
    { kode: '20242', nama: '2024/2025 Genap', tahun: '2024/2025', mulai: '2025-02-17', selesai: '2025-06-27', status: 'selesai', pddikti: '20242' },
    { kode: '20251', nama: '2025/2026 Ganjil', tahun: '2025/2026', mulai: '2025-09-01', selesai: '2026-01-23', status: 'aktif', pddikti: '20251' },
    { kode: '20252', nama: '2025/2026 Genap', tahun: '2025/2026', mulai: '2026-02-16', selesai: '2026-06-26', status: 'akan_datang', pddikti: null },
];

const MATA_KULIAH_SEED: Record<string, { kode: string; nama: string; sks: number; semester: number; jenis: string }[]> = {
    TI: [
        { kode: 'TI101', nama: 'Algoritma dan Pemrograman', sks: 3, semester: 1, jenis: 'Wajib' },
        { kode: 'TI102', nama: 'Matematika Diskrit', sks: 3, semester: 1, jenis: 'Wajib' },
        { kode: 'TI201', nama: 'Struktur Data', sks: 3, semester: 2, jenis: 'Wajib' },
        { kode: 'TI202', nama: 'Pemrograman Web', sks: 3, semester: 2, jenis: 'Wajib' },
        { kode: 'TI301', nama: 'Basis Data', sks: 3, semester: 3, jenis: 'Wajib' },
        { kode: 'TI302', nama: 'Jaringan Komputer', sks: 3, semester: 3, jenis: 'Wajib' },
        { kode: 'TI401', nama: 'Rekayasa Perangkat Lunak', sks: 3, semester: 4, jenis: 'Wajib' },
        { kode: 'TI402', nama: 'Kecerdasan Artifisial', sks: 3, semester: 4, jenis: 'Pilihan' },
        { kode: 'TI501', nama: 'Keamanan Informasi', sks: 3, semester: 5, jenis: 'Pilihan' },
        { kode: 'TI502', nama: 'Magang Industri', sks: 4, semester: 5, jenis: 'MBKM' },
    ],
    SI: [
        { kode: 'SI101', nama: 'Pengantar Sistem Informasi', sks: 3, semester: 1, jenis: 'Wajib' },
        { kode: 'SI102', nama: 'Konsep Organisasi dan Manajemen', sks: 3, semester: 1, jenis: 'Wajib' },
        { kode: 'SI201', nama: 'Analisis dan Perancangan Sistem', sks: 3, semester: 2, jenis: 'Wajib' },
        { kode: 'SI202', nama: 'Pemrograman Berorientasi Objek', sks: 3, semester: 2, jenis: 'Wajib' },
        { kode: 'SI301', nama: 'Manajemen Basis Data', sks: 3, semester: 3, jenis: 'Wajib' },
        { kode: 'SI302', nama: 'Sistem Enterprise', sks: 3, semester: 3, jenis: 'Wajib' },
        { kode: 'SI401', nama: 'Tata Kelola Teknologi Informasi', sks: 3, semester: 4, jenis: 'Wajib' },
        { kode: 'SI402', nama: 'Business Intelligence', sks: 3, semester: 4, jenis: 'Pilihan' },
    ],
    MI: [
        { kode: 'MI101', nama: 'Dasar Pemrograman', sks: 3, semester: 1, jenis: 'Wajib' },
        { kode: 'MI102', nama: 'Aplikasi Perkantoran', sks: 2, semester: 1, jenis: 'Wajib' },
        { kode: 'MI201', nama: 'Pemrograman Mobile', sks: 3, semester: 2, jenis: 'Wajib' },
        { kode: 'MI202', nama: 'Basis Data Terapan', sks: 3, semester: 2, jenis: 'Wajib' },
        { kode: 'MI301', nama: 'Administrasi Jaringan', sks: 3, semester: 3, jenis: 'Wajib' },
        { kode: 'MI302', nama: 'Desain Antarmuka Pengguna', sks: 3, semester: 3, jenis: 'Pilihan' },
    ],
    TK: [
        { kode: 'TK101', nama: 'Rangkaian Elektronika', sks: 3, semester: 1, jenis: 'Wajib' },
        { kode: 'TK102', nama: 'Arsitektur Komputer', sks: 3, semester: 1, jenis: 'Wajib' },
        { kode: 'TK201', nama: 'Sistem Tertanam', sks: 3, semester: 2, jenis: 'Wajib' },
        { kode: 'TK202', nama: 'Internet of Things', sks: 3, semester: 2, jenis: 'Wajib' },
        { kode: 'TK301', nama: 'Jaringan Sensor Nirkabel', sks: 3, semester: 3, jenis: 'Pilihan' },
    ],
    IF: [
        { kode: 'IF501', nama: 'Metodologi Penelitian Informatika', sks: 3, semester: 1, jenis: 'Wajib' },
        { kode: 'IF502', nama: 'Pembelajaran Mesin Lanjut', sks: 3, semester: 1, jenis: 'Wajib' },
        { kode: 'IF503', nama: 'Sistem Terdistribusi', sks: 3, semester: 2, jenis: 'Pilihan' },
    ],
};

const DOSEN_SEED = [
    { nama: 'Dr. Siti Aminah, M.Kom', jk: 'P', bidang: 'Rekayasa Perangkat Lunak', jabfung: 'Lektor Kepala' },
    { nama: 'Budi Santoso, S.T., M.T.', jk: 'L', bidang: 'Jaringan Komputer', jabfung: 'Lektor' },
    { nama: 'Dr. Eng. Rina Marlina, M.Sc', jk: 'P', bidang: 'Kecerdasan Artifisial', jabfung: 'Lektor Kepala' },
    { nama: 'Hendra Gunawan, S.Kom., M.Kom', jk: 'L', bidang: 'Basis Data', jabfung: 'Asisten Ahli' },
    { nama: 'Dr. Ahmad Fauzi, M.Kom', jk: 'L', bidang: 'Sistem Informasi', jabfung: 'Lektor' },
    { nama: 'Nurul Hidayah, S.Kom., M.T.', jk: 'P', bidang: 'Interaksi Manusia Komputer', jabfung: 'Asisten Ahli' },
    { nama: 'Ir. Dedi Kurniawan, M.T.', jk: 'L', bidang: 'Sistem Tertanam', jabfung: 'Lektor' },
    { nama: 'Dr. Maya Puspita, M.Kom', jk: 'P', bidang: 'Data Science', jabfung: 'Lektor' },
    { nama: 'Agus Setiawan, S.T., M.Cs', jk: 'L', bidang: 'Keamanan Informasi', jabfung: 'Asisten Ahli' },
    { nama: 'Dr. Lestari Wulandari, M.Pd', jk: 'P', bidang: 'Manajemen Pendidikan', jabfung: 'Lektor Kepala' },
    { nama: 'Fajar Nugraha, S.Kom., M.Kom', jk: 'L', bidang: 'Pemrograman Web', jabfung: 'Asisten Ahli' },
    { nama: 'Dr. Indah Permata, M.Kom', jk: 'P', bidang: 'Sistem Enterprise', jabfung: 'Lektor' },
    { nama: 'Rizal Maulana, S.Kom., M.T.', jk: 'L', bidang: 'Internet of Things', jabfung: 'Asisten Ahli' },
    { nama: 'Dr. Sri Wahyuni, M.Si', jk: 'P', bidang: 'Statistika Terapan', jabfung: 'Lektor Kepala' },
    { nama: 'Yusuf Hidayat, S.Kom., M.Kom', jk: 'L', bidang: 'Mobile Computing', jabfung: 'Asisten Ahli' },
    { nama: 'Dr. Fitri Handayani, M.Kom', jk: 'P', bidang: 'Tata Kelola TI', jabfung: 'Lektor' },
    { nama: 'Bayu Prakoso, S.T., M.T.', jk: 'L', bidang: 'Infrastruktur TI', jabfung: 'Asisten Ahli' },
    { nama: 'Dr. Anisa Rahmawati, M.Kom', jk: 'P', bidang: 'Rekayasa Data', jabfung: 'Lektor' },
];

const NILAI_HURUF: { huruf: string; bobot: number; min: number }[] = [
    { huruf: 'A', bobot: 4, min: 85 },
    { huruf: 'AB', bobot: 3.5, min: 80 },
    { huruf: 'B', bobot: 3, min: 73 },
    { huruf: 'BC', bobot: 2.5, min: 66 },
    { huruf: 'C', bobot: 2, min: 60 },
    { huruf: 'D', bobot: 1, min: 45 },
    { huruf: 'E', bobot: 0, min: 0 },
];

const toHuruf = (angka: number): { huruf: string; bobot: number } => {
    const found = NILAI_HURUF.find((item) => angka >= item.min) ?? NILAI_HURUF[NILAI_HURUF.length - 1];
    return { huruf: found.huruf, bobot: found.bobot };
};

const buildDataset = (): MockDataset => {
    const perguruanTinggi: SiakadPerguruanTinggi = {
        id: 1,
        kodePt: '213001',
        namaPt: 'Sekolah Tinggi Ilmu Tarbiyah Al Wafi',
        singkatan: 'STIT Al Wafi',
        alamat: 'Jl. Raya Ciawi No. 12, Bogor, Jawa Barat',
        telepon: '0251-8241234',
        email: 'admin@alwafi.ac.id',
        website: 'https://sia.alwafi.ac.id',
        npwp: '002345678901000',
        akreditasi: 'Baik Sekali',
        pddiktiId: mockUuid('pt-213001'),
    };

    const prodi: SiakadProdi[] = PRODI_SEED.map((seed, index) => ({
        id: index + 1,
        kodeProdi: seed.kode,
        namaProdi: seed.nama,
        jenjang: seed.jenjang,
        status: 'aktif',
        fakultas: 'Fakultas Teknologi Informasi',
        totalMataKuliah: MATA_KULIAH_SEED[seed.kode]?.length ?? 0,
        totalMahasiswa: 0,
    }));

    const semester: SiakadSemester[] = SEMESTER_SEED.map((seed, index) => ({
        id: index + 1,
        kode: seed.kode,
        namaSemester: seed.nama,
        tahunAjaran: seed.tahun,
        tanggalMulai: seed.mulai,
        tanggalSelesai: seed.selesai,
        status: seed.status,
        pddiktiKode: seed.pddikti,
        periodeId: index + 1,
        periodeNama: seed.nama,
    }));

    const mataKuliah: SiakadMataKuliah[] = [];
    let mataKuliahId = 1;
    PRODI_SEED.forEach((prodiSeed) => {
        const prodiRow = prodi.find((item) => item.kodeProdi === prodiSeed.kode);
        (MATA_KULIAH_SEED[prodiSeed.kode] ?? []).forEach((mk) => {
            const sksPraktik = mk.kode.endsWith('202') || mk.kode.endsWith('301') ? 1 : 0;
            mataKuliah.push({
                id: mataKuliahId,
                kode: mk.kode,
                nama: mk.nama,
                sks: mk.sks,
                sksTeori: mk.sks - sksPraktik,
                sksPraktik,
                jenis: mk.jenis,
                semester: mk.semester,
                prodiId: prodiRow?.id ?? 1,
                prodiNama: prodiRow?.namaProdi ?? 'Teknik Informatika',
                status: 'aktif',
                kelompok: mk.jenis === 'Wajib' ? 'Mata Kuliah Wajib' : 'Mata Kuliah Pilihan',
            });
            mataKuliahId += 1;
        });
    });

    const dosen: SiakadDosen[] = DOSEN_SEED.map((seed, index) => {
        const prodiRow = prodi[index % prodi.length];
        const nidn = `0${(index + 11).toString().padStart(2, '0')}${(1985 + (index % 8)).toString()}${(index + 1).toString().padStart(2, '0')}`;
        return {
            id: index + 1,
            nip: `${1985 + (index % 8)}${(index + 1).toString().padStart(4, '0')}${index % 2 === 0 ? '200501' : '201001'}${index + 1}`,
            nidn: index % 7 === 3 ? null : nidn,
            nidk: index % 9 === 5 ? `0${index + 30}${index}0000${index}` : null,
            nuptk: index % 3 === 0 ? `${(index + 1) * 1122334455}`.slice(0, 16) : null,
            nama: seed.nama,
            prodiId: prodiRow.id,
            prodiNama: prodiRow.namaProdi,
            jenisKelamin: seed.jk as 'L' | 'P',
            status: index % 12 === 7 ? 'nonaktif' : 'aktif',
            statusKepegawaian: index % 3 === 0 ? 'tidak_tetap' : 'tetap',
            jabatanAkademik: seed.jabfung,
            bidangKeahlian: seed.bidang,
            email: `${seed.nama
                .replace(/^(Dr\.|Ir\.|Dr\. Eng\.)\s*/i, '')
                .split(' ')[0]
                .toLowerCase()}@alwafi.ac.id`,
            noHp: `0812${(30000000 + index * 137).toString().slice(0, 8)}`,
            agama: 'Islam',
            tempatLahir: pick(CITIES),
            tanggalLahir: `${1968 + (index % 20)}-${(1 + (index % 12)).toString().padStart(2, '0')}-${(1 + (index % 27)).toString().padStart(2, '0')}`,
        };
    });

    const mahasiswa: SiakadMahasiswa[] = [];
    let mahasiswaId = 1;
    PRODI_SEED.forEach((prodiSeed, prodiIndex) => {
        const prodiRow = prodi.find((item) => item.kodeProdi === prodiSeed.kode)!;
        const angkatanList = prodiSeed.jenjang === 'S2' ? ['2024', '2025'] : ['2021', '2022', '2023', '2024', '2025'];
        angkatanList.forEach((angkatan) => {
            const jumlah = prodiSeed.jenjang === 'S2' ? intBetween(3, 5) : intBetween(6, 10);
            for (let index = 0; index < jumlah; index += 1) {
                const isLaki = random() > 0.45;
                const nama = `${pick(isLaki ? FIRST_NAMES_L : FIRST_NAMES_P)} ${pick(LAST_NAMES)}`;
                const nim = `${angkatan}${(prodiIndex + 1).toString().padStart(2, '0')}${(index + 1).toString().padStart(3, '0')}`;
                const statusRoll = random();
                const status =
                    statusRoll > 0.87 ? 'cuti' : statusRoll > 0.8 ? 'nonaktif' : 'aktif';
                mahasiswa.push({
                    id: mahasiswaId,
                    nim,
                    nama,
                    prodiId: prodiRow.id,
                    prodiNama: prodiRow.namaProdi,
                    angkatan,
                    jenisKelamin: isLaki ? 'L' : 'P',
                    tempatLahir: pick(CITIES),
                    tanggalLahir: `${Number(angkatan) - 18}-${(1 + (index % 12)).toString().padStart(2, '0')}-${(1 + intBetween(1, 27)).toString().padStart(2, '0')}`,
                    agama: pick(AGAMA),
                    kewarganegaraan: 'Indonesia',
                    alamat: `Jl. ${pick(['Merdeka', 'Dago', 'Sudirman', 'Pajajaran', 'Kartini', 'Diponegoro'])} No. ${intBetween(1, 180)}, ${pick(CITIES)}`,
                    noHp: `08${intBetween(11, 99)}${intBetween(1000000, 9999999)}`,
                    email: `${nama.toLowerCase().replace(/\s+/g, '.')}@student.alwafi.ac.id`,
                    nik: random() > 0.12 ? `${(32 + (index % 8)).toString()}${intBetween(10, 99)}${intBetween(1000000000000, 9999999999999)}`.slice(0, 16) : null,
                    nisn: random() > 0.2 ? `00${intBetween(10000000, 99999999)}` : null,
                    status,
                    semesterMasuk: angkatan === '2025' ? '20251' : `${angkatan}1`,
                    jalurMasuk: pick(JALUR),
                    jenisPendaftaran: pick(JENIS_DAFTAR),
                    pembiayaan: pick(PEMBIAYAAN),
                    tanggalMasuk: `${angkatan}-09-0${intBetween(1, 9)}`,
                });
                mahasiswaId += 1;
            }
        });
    });

    prodi.forEach((item) => {
        item.totalMahasiswa = mahasiswa.filter((mhs) => mhs.prodiId === item.id).length;
    });

    const kurikulum: SiakadKurikulum[] = [];
    const kurikulumItems: SiakadKurikulumItem[] = [];
    let kurikulumId = 1;
    let itemId = 1;
    prodi.forEach((prodiRow, index) => {
        const tahunList = prodiRow.jenjang === 'S2' ? ['2024'] : ['2023', '2025'];
        tahunList.forEach((tahun, tahunIndex) => {
            const kode = `${prodiRow.kodeProdi}-${tahun}`;
            const mkProdi = mataKuliah.filter((mk) => mk.prodiId === prodiRow.id);
            kurikulum.push({
                id: kurikulumId,
                kode,
                nama: `Kurikulum ${prodiRow.namaProdi} ${tahun}`,
                prodiId: prodiRow.id,
                prodiNama: prodiRow.namaProdi,
                tahunMulai: tahun,
                tahunSelesai: String(Number(tahun) + 4),
                totalSks: mkProdi.reduce((total, mk) => total + mk.sks, 0),
                jumlahMataKuliah: mkProdi.length,
                status: tahunIndex === tahunList.length - 1 ? 'aktif' : 'diarsipkan',
                semesterMulai: `${tahun}1`,
            });
            mkProdi.forEach((mk) => {
                kurikulumItems.push({
                    id: itemId,
                    kurikulumId,
                    kodeKurikulum: kode,
                    mataKuliahId: mk.id,
                    kodeMk: mk.kode,
                    namaMk: mk.nama,
                    sks: mk.sks,
                    semester: mk.semester,
                    wajib: mk.jenis === 'Wajib',
                    prodiId: prodiRow.id,
                    prodiNama: prodiRow.namaProdi,
                    pddiktiId: null,
                });
                itemId += 1;
            });
            kurikulumId += 1;
        });
        if (index === 2) {
            // satu prodi sengaja tanpa kurikulum lengkap untuk memicu validasi
        }
    });

    const activeSemester = semester.find((item) => item.status === 'aktif') ?? semester[semester.length - 1];
    const kelas: SiakadKelas[] = [];
    const pengajar: SiakadDosenPengajarRow[] = [];
    let kelasId = 1;
    let pengajarId = 1;
    prodi.forEach((prodiRow) => {
        const mkAktif = mataKuliah.filter((mk) => mk.prodiId === prodiRow.id && mk.semester <= 5);
        mkAktif.forEach((mk) => {
            const jumlahKelas = mk.semester <= 2 ? 2 : 1;
            for (let index = 0; index < jumlahKelas; index += 1) {
                const namaKelas = `${mk.kode}-${String.fromCharCode(65 + index)}`;
                const dosenUtama = dosen.filter((d) => d.prodiId === prodiRow.id)[index % Math.max(1, dosen.filter((d) => d.prodiId === prodiRow.id).length)];
                const kapasitas = intBetween(25, 45);
                const terisi = intBetween(12, kapasitas);
                kelas.push({
                    id: kelasId,
                    kodeKelas: namaKelas,
                    namaKelas,
                    mataKuliahId: mk.id,
                    kodeMk: mk.kode,
                    namaMk: mk.nama,
                    sks: mk.sks,
                    prodiId: prodiRow.id,
                    prodiNama: prodiRow.namaProdi,
                    semesterId: activeSemester.id,
                    semesterNama: activeSemester.namaSemester,
                    periodeNama: activeSemester.namaSemester,
                    kurikulumId: kurikulum.find((k) => k.prodiId === prodiRow.id)?.id ?? null,
                    kapasitas,
                    terisi,
                    tipeKelas: index === 0 ? 'Reguler' : 'Karyawan',
                    status: index === 0 ? 'aktif' : random() > 0.7 ? 'tidak_aktif' : 'aktif',
                    dosenPengajar: dosenUtama ? [dosenUtama.nama] : [],
                    jumlahDosen: dosenUtama ? 1 : 0,
                });

                if (dosenUtama) {
                    pengajar.push({
                        id: pengajarId,
                        kelasId,
                        kodeKelas: namaKelas,
                        namaKelas,
                        dosenId: dosenUtama.id,
                        nim: dosenUtama.nidn ?? dosenUtama.nip ?? '-',
                        nama: dosenUtama.nama,
                        prodiId: prodiRow.id,
                        prodiNama: prodiRow.namaProdi,
                        semesterId: activeSemester.id,
                        periodeNama: activeSemester.namaSemester,
                        peran: index === 0 ? 'Pengajar Utama' : 'Pengajar Pendamping',
                        localId: '',
                        mappingStatus: 'UNMAPPED',
                        dataStatus: 'UNMAPPED',
                        pddiktiId: null,
                        pddiktiLabel: null,
                        lastSyncAt: null,
                        lastAction: null,
                        issues: 0,
                        conflictFields: [],
                    });
                    pengajarId += 1;
                }
                kelasId += 1;
            }
        });
    });

    const krs: SiakadKrs[] = [];
    let krsId = 1;
    kelas.forEach((kelasRow) => {
        const kandidat = mahasiswa.filter((mhs) => mhs.prodiId === kelasRow.prodiId && mhs.status !== 'nonaktif');
        const jumlah = Math.min(kandidat.length, intBetween(4, 9));
        const dipakai = new Set<number>();
        for (let index = 0; index < jumlah; index += 1) {
            let pilih = Math.floor(random() * kandidat.length);
            let guard = 0;
            while (dipakai.has(kandidat[pilih]?.id) && guard < 20) {
                pilih = Math.floor(random() * kandidat.length);
                guard += 1;
            }
            const mhs = kandidat[pilih];
            if (!mhs || dipakai.has(mhs.id)) continue;
            dipakai.add(mhs.id);
            const statusKrs = random() > 0.18 ? 'disetujui' : random() > 0.4 ? 'draft' : 'terkunci';
            krs.push({
                id: krsId,
                mahasiswaId: mhs.id,
                nim: mhs.nim,
                namaMahasiswa: mhs.nama,
                kelasId: kelasRow.id,
                kodeKelas: kelasRow.kodeKelas,
                kodeMk: kelasRow.kodeMk,
                namaMk: kelasRow.namaMk,
                sks: kelasRow.sks,
                prodiNama: kelasRow.prodiNama,
                periodeNama: kelasRow.periodeNama,
                statusKrs,
                pddiktiPesertaId: null,
            });
            krsId += 1;
        }
    });

    const nilai: SiakadNilai[] = [];
    let nilaiId = 1;
    krs.forEach((krsRow) => {
        if (krsRow.statusKrs === 'draft') return;
        if (random() > 0.85) return;
        const angka = intBetween(48, 98);
        const { huruf, bobot } = toHuruf(angka);
        const final = random() > 0.25;
        nilai.push({
            id: nilaiId,
            mahasiswaId: krsRow.mahasiswaId,
            nim: krsRow.nim,
            namaMahasiswa: krsRow.namaMahasiswa,
            kelasId: krsRow.kelasId,
            kodeKelas: krsRow.kodeKelas,
            kodeMk: krsRow.kodeMk,
            namaMk: krsRow.namaMk,
            sks: krsRow.sks,
            nilaiAngka: final ? angka : null,
            nilaiHuruf: final ? huruf : null,
            bobot: final ? bobot : null,
            prodiNama: krsRow.prodiNama,
            periodeNama: krsRow.periodeNama,
            statusNilai: final ? 'final' : 'draft',
        });
        nilaiId += 1;
    });

    const riwayat: SiakadRiwayatRow[] = mahasiswa.map((mhs, index) => {
        const semesterMasuk = semester.find((item) => item.kode === mhs.semesterMasuk) ?? activeSemester;
        return {
            id: index + 1,
            mahasiswaId: mhs.id,
            nim: mhs.nim,
            nama: mhs.nama,
            prodiId: mhs.prodiId,
            prodiNama: mhs.prodiNama,
            semesterId: semesterMasuk.id,
            jenisPendaftaran: mhs.jenisPendaftaran,
            jalurMasuk: mhs.jalurMasuk,
            semesterMasuk: mhs.semesterMasuk,
            pembiayaan: mhs.pembiayaan,
            biayaMasuk: mhs.pembiayaan === 'KIP Kuliah' ? 0 : intBetween(2500000, 7500000),
            tanggalMasuk: mhs.tanggalMasuk,
            localId: '',
            mappingStatus: 'UNMAPPED',
            dataStatus: 'UNMAPPED',
            pddiktiId: null,
            pddiktiLabel: null,
            lastSyncAt: null,
            lastAction: null,
            issues: 0,
            conflictFields: [],
        };
    });

    const aktivitas: SiakadAktivitas[] = [
        {
            id: 1,
            judul: 'Magang MBKM di PT Telkom Indonesia',
            kategori: 'MBKM',
            jenisAktivitas: 'Magang/Praktik Kerja',
            semesterNama: activeSemester.namaSemester,
            prodiNama: 'Teknik Informatika',
            tanggalMulai: '2025-09-15',
            tanggalSelesai: '2026-01-15',
            lokasi: 'Jakarta Selatan',
            jumlahAnggota: 3,
            anggota: [],
            statusAktivitas: 'berjalan',
        },
        {
            id: 2,
            judul: 'Studi Independen Data Analytics',
            kategori: 'MBKM',
            jenisAktivitas: 'Studi Independen',
            semesterNama: activeSemester.namaSemester,
            prodiNama: 'Sistem Informasi',
            tanggalMulai: '2025-09-20',
            tanggalSelesai: '2026-01-20',
            lokasi: 'Daring',
            jumlahAnggota: 4,
            anggota: [],
            statusAktivitas: 'berjalan',
        },
        {
            id: 3,
            judul: 'Penelitian Dosen dan Mahasiswa: Sistem Rekomendasi Beasiswa',
            kategori: 'Penelitian',
            jenisAktivitas: 'Penelitian',
            semesterNama: activeSemester.namaSemester,
            prodiNama: 'Informatika',
            tanggalMulai: '2025-10-01',
            tanggalSelesai: '2026-03-01',
            lokasi: 'Laboratorium Komputasi',
            jumlahAnggota: 2,
            anggota: [],
            statusAktivitas: 'berjalan',
        },
        {
            id: 4,
            judul: 'Pertukaran Mahasiswa Merdeka Universitas Hasanuddin',
            kategori: 'Pertukaran',
            jenisAktivitas: 'Pertukaran Mahasiswa',
            semesterNama: '2024/2025 Genap',
            prodiNama: 'Teknik Informatika',
            tanggalMulai: '2025-02-17',
            tanggalSelesai: '2025-06-20',
            lokasi: 'Makassar',
            jumlahAnggota: 2,
            anggota: [],
            statusAktivitas: 'selesai',
        },
        {
            id: 5,
            judul: 'Asistensi Mengajar di SMK Negeri 1 Bogor',
            kategori: 'MBKM',
            jenisAktivitas: 'Asistensi Mengajar',
            semesterNama: '2024/2025 Ganjil',
            prodiNama: 'Manajemen Informatika',
            tanggalMulai: '2024-09-10',
            tanggalSelesai: '2025-01-10',
            lokasi: 'Bogor',
            jumlahAnggota: 3,
            anggota: [],
            statusAktivitas: 'selesai',
        },
    ];

    aktivitas.forEach((item) => {
        const kandidat = mahasiswa.filter((mhs) => mhs.prodiNama === item.prodiNama && mhs.status === 'aktif').slice(0, item.jumlahAnggota);
        item.anggota = kandidat.map((mhs) => ({ mahasiswaId: mhs.id, nim: mhs.nim, nama: mhs.nama }));
        item.jumlahAnggota = item.anggota.length;
    });

    const kelulusan: SiakadKelulusan[] = mahasiswa
        .filter((mhs) => mhs.angkatan === '2021' && mhs.status === 'aktif')
        .slice(0, 8)
        .map((mhs, index) => {
            const ipk = Number((3.05 + (index % 9) * 0.1).toFixed(2));
            return {
                id: index + 1,
                mahasiswaId: mhs.id,
                nim: mhs.nim,
                nama: mhs.nama,
                prodiNama: mhs.prodiNama,
                periodeKeluar: '20251',
                jenisKeluar: 'Lulus',
                tanggalKeluar: `2025-10-${(10 + index).toString().padStart(2, '0')}`,
                nomorSk: index % 3 === 0 ? null : `SK/STIT-AW/${1000 + index}/2025`,
                ipk,
                totalSks: 144 + (index % 4) * 2,
                statusMahasiswa: 'lulus',
                judulSkripsi: pick([
                    'Sistem Informasi Pelayanan Akademik Berbasis Web',
                    'Klasifikasi Penerima Beasiswa Menggunakan Metode Naive Bayes',
                    'Pengembangan Aplikasi Absensi Berbasis QR Code',
                    'Analisis Keamanan Jaringan Wireless Kampus',
                    'Sistem Rekomendasi Mata Kuliah Pilihan',
                ]),
            };
        });

    return {
        perguruanTinggi,
        prodi,
        semester,
        mahasiswa,
        dosen,
        mataKuliah,
        kurikulum,
        kurikulumItems,
        kelas,
        pengajar,
        krs,
        nilai,
        riwayat,
        aktivitas,
        kelulusan,
    };
};

export const dataset: MockDataset = buildDataset();

/** Data pihak PDDikti (hasil GetList* dari Neo Feeder), disimulasikan deterministik. */
export const buildPddiktiMirror = (): Record<string, Record<string, JsonObject>> => {
    const mirror: Record<string, Record<string, JsonObject>> = {
        prodi: {},
        semester: {},
        dosen: {},
        mahasiswa: {},
        'riwayat-pendidikan': {},
        kurikulum: {},
        'mata-kuliah': {},
        'mata-kuliah-kurikulum': {},
        kelas: {},
        'dosen-pengajar': {},
        krs: {},
        nilai: {},
        'aktivitas-mahasiswa': {},
        kelulusan: {},
    };

    const exists = (key: string, ratio: number, offset = 0): boolean => (stableHash(key) % 1000) / 1000 < ratio + offset;

    // Program studi: seluruh prodi ada, dua di antaranya dengan nama berbeda (konflik potensial).
    dataset.prodi.forEach((prodi) => {
        if (prodi.kodeProdi === 'IF') return; // satu prodi sengaja belum ada di PDDIKTI
        mirror.prodi[String(prodi.id)] = {
            id_prodi: mockUuid(`prodi-${prodi.kodeProdi}`),
            kode_program_studi: prodi.kodeProdi === 'TI' ? '55201' : prodi.kodeProdi === 'SI' ? '57201' : prodi.kodeProdi === 'MI' ? '57401' : '56401',
            nama_program_studi: prodi.kodeProdi === 'TK' ? 'Teknik Komputer dan Jaringan' : prodi.namaProdi,
            nama_jenjang_pendidikan: prodi.jenjang,
            nama_fakultas: prodi.fakultas ?? 'Fakultas Teknologi Informasi',
        };
    });

    dataset.semester.forEach((semester) => {
        if (!semester.pddiktiKode) return;
        mirror.semester[String(semester.id)] = {
            id_semester: semester.pddiktiKode,
            nama_semester: semester.namaSemester,
            tahun_ajaran: semester.tahunAjaran,
            tanggal_mulai: semester.tanggalMulai,
            tanggal_selesai: semester.tanggalSelesai,
        };
    });

    dataset.dosen.forEach((dosen) => {
        const key = `dosen-${dosen.nidn ?? dosen.id}`;
        if (!dosen.nidn || !exists(key, 0.85)) return;
        mirror.dosen[String(dosen.id)] = {
            id_dosen: mockUuid(key),
            id_registrasi_dosen: mockUuid(`reg-${dosen.nidn}`),
            nidn: dosen.nidn,
            nama_dosen: dosen.nama,
            jenis_kelamin: dosen.jenisKelamin,
            tempat_lahir: dosen.tempatLahir,
            tanggal_lahir: dosen.tanggalLahir,
            email: stableHash(key) % 5 === 0 ? `${dosen.nidn}@pddikti.example` : dosen.email,
            handphone: dosen.noHp,
            nama_status_pegawai: dosen.statusKepegawaian === 'tetap' ? 'PNS/PPPK' : 'Non PNS',
            nama_jabatan_akademik: dosen.jabatanAkademik,
        };
    });

    dataset.mahasiswa.forEach((mhs) => {
        const key = `mhs-${mhs.nim}`;
        if (!exists(key, 0.78)) return;
        const ubahEmail = stableHash(`${key}-email`) % 100 < 18;
        const konflikNama = stableHash(`${key}-nama`) % 100 < 5;
        mirror.mahasiswa[String(mhs.id)] = {
            id_mahasiswa: mockUuid(key),
            nim: mhs.nim,
            nama_mahasiswa: konflikNama ? `${mhs.nama} (PDDikti)` : mhs.nama,
            nik: mhs.nik,
            nisn: mhs.nisn,
            jenis_kelamin: mhs.jenisKelamin,
            tempat_lahir: mhs.tempatLahir,
            tanggal_lahir: mhs.tanggalLahir,
            id_agama: mhs.agama === 'Islam' ? '1' : mhs.agama === 'Kristen' ? '2' : mhs.agama === 'Katolik' ? '3' : mhs.agama === 'Hindu' ? '4' : '5',
            nama_agama: mhs.agama,
            kewarganegaraan: mhs.kewarganegaraan,
            jalan: mhs.alamat,
            handphone: ubahEmail ? `0899${mhs.noHp.slice(4)}` : mhs.noHp,
            email: ubahEmail ? `pddikti.${mhs.nim}@mail.example` : mhs.email,
            id_prodi: mirror.prodi[String(mhs.prodiId)]?.id_prodi ?? null,
        };
    });

    dataset.riwayat.forEach((riwayat) => {
        const key = `riwayat-${riwayat.nim}`;
        if (!exists(key, 0.65)) return;
        mirror['riwayat-pendidikan'][String(riwayat.id)] = {
            id_registrasi_mahasiswa: mockUuid(key),
            nim: riwayat.nim,
            id_jenis_daftar: String(1 + (stableHash(`${key}-jd`) % 4)),
            id_jalur_daftar: String(1 + (stableHash(`${key}-jm`) % 5)),
            id_periode_masuk: riwayat.semesterMasuk,
            tanggal_daftar: riwayat.tanggalMasuk,
            id_prodi: mirror.prodi[String(riwayat.prodiId)]?.id_prodi ?? null,
            id_pembiayaan: String(1 + (stableHash(`${key}-pb`) % 4)),
            nama_jenis_daftar: riwayat.jenisPendaftaran,
            nama_jalur_masuk: riwayat.jalurMasuk,
        };
    });

    dataset.mataKuliah.forEach((mk) => {
        const key = `mk-${mk.kode}`;
        if (!exists(key, 0.88)) return;
        const sks = stableHash(`${key}-sks`) % 100 < 12 ? Math.max(2, mk.sks - 1) : mk.sks;
        mirror['mata-kuliah'][String(mk.id)] = {
            id_matkul: mockUuid(key),
            kode_mata_kuliah: mk.kode,
            nama_mata_kuliah: stableHash(`${key}-nm`) % 100 < 8 ? `${mk.nama} (Revisi)` : mk.nama,
            sks_mata_kuliah: sks,
            sks_tatap_muka: mk.sksTeori,
            sks_praktek: mk.sksPraktik,
            id_prodi: mirror.prodi[String(mk.prodiId)]?.id_prodi ?? null,
            jenis_mata_kuliah: mk.jenis,
        };
    });

    dataset.kurikulum.forEach((kurikulum) => {
        const key = `kur-${kurikulum.kode}`;
        if (!exists(key, 0.8)) return;
        mirror.kurikulum[String(kurikulum.id)] = {
            id_kurikulum: mockUuid(key),
            kode_kurikulum: kurikulum.kode,
            nama_kurikulum: kurikulum.nama,
            id_prodi: mirror.prodi[String(kurikulum.prodiId)]?.id_prodi ?? null,
            id_semester: kurikulum.semesterMulai,
            jumlah_sks_wajib: kurikulum.totalSks,
            jumlah_sks_pilihan: Math.round(kurikulum.totalSks * 0.15),
        };
    });

    dataset.kurikulumItems.forEach((item) => {
        const key = `mk-kur-${item.kodeMk}-${item.id}`;
        if (!exists(key, 0.55)) return;
        const kurikulum = dataset.kurikulum.find((k) => k.id === item.kurikulumId);
        const mk = dataset.mataKuliah.find((m) => m.kode === item.kodeMk);
        mirror['mata-kuliah-kurikulum'][String(item.id)] = {
            id_matkul_kurikulum: mockUuid(key),
            id_kurikulum: mirror.kurikulum[String(kurikulum?.id ?? '')]?.id_kurikulum ?? null,
            id_matkul: mirror['mata-kuliah'][String(mk?.id ?? '')]?.id_matkul ?? null,
            kode_mata_kuliah: item.kodeMk,
            nama_mata_kuliah: item.namaMk,
            sks_mata_kuliah: item.sks,
            semester: item.semester,
            apakah_wajib: item.wajib ? '1' : '0',
            kode_kurikulum: kurikulum?.kode ?? null,
        };
    });

    dataset.kelas.forEach((kelas) => {
        const key = `kelas-${kelas.kodeKelas}-${kelas.semesterId}`;
        if (!exists(key, 0.62)) return;
        const ubahNama = stableHash(`${key}-nm`) % 100 < 15;
        mirror.kelas[String(kelas.id)] = {
            id_kelas_kuliah: mockUuid(key),
            nama_kelas_kuliah: ubahNama ? `${kelas.namaKelas} PDDIKTI` : kelas.namaKelas,
            kode_mata_kuliah: kelas.kodeMk,
            id_matkul: mirror['mata-kuliah'][String(kelas.mataKuliahId)]?.id_matkul ?? null,
            id_prodi: mirror.prodi[String(kelas.prodiId)]?.id_prodi ?? null,
            id_semester: dataset.semester.find((item) => item.id === kelas.semesterId)?.pddiktiKode ?? null,
            sks_mk: kelas.sks,
            kapasitas: stableHash(`${key}-kap`) % 100 < 10 ? kelas.kapasitas + 5 : kelas.kapasitas,
            lingkup: kelas.tipeKelas,
            mode: 'Blended',
        };
    });

    dataset.pengajar.forEach((pengajar) => {
        const key = `pengajar-${pengajar.kodeKelas}-${pengajar.dosenId}`;
        if (!exists(key, 0.5)) return;
        mirror['dosen-pengajar'][String(pengajar.id)] = {
            id_aktivitas_mengajar: mockUuid(key),
            id_registrasi_dosen: mirror.dosen[String(pengajar.dosenId)]?.id_registrasi_dosen ?? null,
            nidn: pengajar.nim,
            nama_dosen: pengajar.nama,
            nama_kelas_kuliah: pengajar.kodeKelas,
            id_kelas_kuliah: mirror.kelas[String(pengajar.kelasId)]?.id_kelas_kuliah ?? null,
            id_prodi: mirror.prodi[String(pengajar.prodiId)]?.id_prodi ?? null,
            id_semester: '20251',
        };
    });

    dataset.krs.forEach((krs) => {
        const key = `peserta-${krs.nim}-${krs.kodeKelas}`;
        if (!exists(key, 0.58)) return;
        mirror.krs[String(krs.id)] = {
            id_peserta_kelas_kuliah: mockUuid(key),
            id_registrasi_mahasiswa: mirror.mahasiswa[String(krs.mahasiswaId)]?.id_registrasi_mahasiswa ?? mirrorUuidForRegistration(krs.nim),
            nim: krs.nim,
            nama_mahasiswa: krs.namaMahasiswa,
            nama_kelas_kuliah: krs.kodeKelas,
            id_kelas_kuliah: mirror.kelas[String(krs.kelasId)]?.id_kelas_kuliah ?? null,
            id_prodi: null,
            id_semester: '20251',
        };
    });

    dataset.nilai.forEach((nilai) => {
        const key = `nilai-${nilai.nim}-${nilai.kodeKelas}`;
        const peserta = mirror.krs[String(nilai.id)];
        if (!peserta) return;
        if (nilai.statusNilai !== 'final') return;
        const beda = stableHash(`${key}-na`) % 100 < 20;
        mirror.nilai[String(nilai.id)] = {
            id_nilai_perkuliahan_kelas: mockUuid(key),
            id_registrasi_mahasiswa: peserta.id_registrasi_mahasiswa,
            id_kelas_kuliah: peserta.id_kelas_kuliah,
            nim: nilai.nim,
            nama_mahasiswa: nilai.namaMahasiswa,
            nama_kelas_kuliah: nilai.kodeKelas,
            nilai_angka: beda ? Math.max(40, (nilai.nilaiAngka ?? 75) - 5) : nilai.nilaiAngka,
            nilai_huruf: nilai.nilaiHuruf,
            nilai_indeks: nilai.bobot,
        };
    });

    dataset.aktivitas.forEach((aktivitas) => {
        const key = `akt-${aktivitas.id}`;
        if (!exists(key, 0.45)) return;
        mirror['aktivitas-mahasiswa'][String(aktivitas.id)] = {
            id_aktivitas: mockUuid(key),
            judul: aktivitas.judul,
            id_jenis_aktivitas: String(1 + (stableHash(`${key}-ja`) % 6)),
            id_kategori_kegiatan: String(1 + (stableHash(`${key}-kk`) % 4)),
            id_semester: '20251',
            tanggal_mulai: aktivitas.tanggalMulai,
            tanggal_selesai: aktivitas.tanggalSelesai,
            lokasi: aktivitas.lokasi,
            jumlah_anggota: aktivitas.jumlahAnggota,
        };
    });

    dataset.kelulusan.forEach((kelulusan) => {
        const key = `lulus-${kelulusan.nim}`;
        if (!exists(key, 0.3)) return;
        mirror.kelulusan[String(kelulusan.id)] = {
            id_registrasi_mahasiswa: mirrorUuidForRegistration(kelulusan.nim),
            nim: kelulusan.nim,
            nama_mahasiswa: kelulusan.nama,
            id_jenis_keluar: '1',
            nama_jenis_keluar: 'Lulus',
            tanggal_keluar: kelulusan.tanggalKeluar,
            id_periode_keluar: kelulusan.periodeKeluar,
            ipk: kelulusan.ipk,
            total_sks: kelulusan.totalSks,
            sk_yudisium: kelulusan.nomorSk,
        };
    });

    return mirror;
};

/** ID registrasi mahasiswa dipakai pada banyak payload relasi. */
export const mirrorUuidForRegistration = (nim: string): string => mockUuid(`riwayat-${nim}`);

export const pddiktiMirror = buildPddiktiMirror();
