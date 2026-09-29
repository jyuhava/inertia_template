import type { JsonObject, JsonValue } from './common';
import type { DataStatus, MappingStatus, EntityKey } from './integration';

/** Baris tabel SIAKAD yang sudah dilengkapi metadata integrasi. */
export interface IntegrationMeta {
    /** id baris pada SIAKAD */
    localId: string;
    mappingStatus: MappingStatus;
    dataStatus: DataStatus;
    pddiktiId: string | null;
    /** label PDDIKTI (dipakai pada kolom comparison & mapping) */
    pddiktiLabel: string | null;
    lastSyncAt: string | null;
    lastAction: 'INSERT' | 'UPDATE' | 'SKIP' | null;
    issues: number;
    conflictFields: string[];
}

export interface SiakadProdi {
    id: number;
    kodeProdi: string;
    namaProdi: string;
    jenjang: string;
    status: string;
    fakultas?: string | null;
    totalMataKuliah: number;
    totalMahasiswa: number;
}

export interface SiakadSemester {
    id: number;
    kode: string;
    namaSemester: string;
    tahunAjaran: string;
    tanggalMulai: string;
    tanggalSelesai: string;
    status: string;
    /** kode semester pada PDDikti, mis. 20251 */
    pddiktiKode: string | null;
    periodeId: number | null;
    periodeNama: string | null;
}

export interface SiakadMahasiswa {
    id: number;
    nim: string;
    nama: string;
    prodiId: number;
    prodiNama: string;
    angkatan: string;
    jenisKelamin: 'L' | 'P';
    tempatLahir: string;
    tanggalLahir: string;
    agama: string;
    kewarganegaraan: string;
    alamat: string;
    noHp: string;
    email: string;
    nik: string | null;
    nisn: string | null;
    status: string;
    semesterMasuk: string | null;
    jalurMasuk: string | null;
    jenisPendaftaran: string | null;
    pembiayaan: string | null;
    tanggalMasuk: string | null;
}

export interface SiakadMahasiswaRow extends SiakadMahasiswa, IntegrationMeta {
    lastSyncMessage?: string | null;
}

export interface SiakadDosen {
    id: number;
    nip: string | null;
    nidn: string | null;
    nidk: string | null;
    nuptk: string | null;
    nama: string;
    prodiId: number | null;
    prodiNama: string | null;
    jenisKelamin: 'L' | 'P';
    status: string;
    statusKepegawaian: string | null;
    jabatanAkademik: string | null;
    bidangKeahlian: string | null;
    email: string | null;
    noHp: string | null;
    agama: string | null;
    tempatLahir: string | null;
    tanggalLahir: string | null;
}

export interface SiakadDosenRow extends SiakadDosen, IntegrationMeta {}

export interface SiakadMataKuliah {
    id: number;
    kode: string;
    nama: string;
    sks: number;
    sksTeori: number;
    sksPraktik: number;
    jenis: string;
    semester: number;
    prodiId: number;
    prodiNama: string;
    status: string;
    kelompok?: string | null;
}

export interface SiakadMataKuliahRow extends SiakadMataKuliah, IntegrationMeta {}

export interface SiakadKurikulum {
    id: number;
    kode: string;
    nama: string;
    prodiId: number;
    prodiNama: string;
    tahunMulai: string;
    tahunSelesai: string | null;
    totalSks: number;
    jumlahMataKuliah: number;
    status: string;
    semesterMulai: string | null;
}

export interface SiakadKurikulumRow extends SiakadKurikulum, IntegrationMeta {}

export interface SiakadKurikulumItem {
    id: number;
    kurikulumId: number;
    kodeKurikulum: string;
    mataKuliahId: number;
    kodeMk: string;
    namaMk: string;
    sks: number;
    semester: number;
    wajib: boolean;
    prodiId: number;
    prodiNama: string;
    pddiktiId: string | null;
}

export interface SiakadKelas {
    id: number;
    kodeKelas: string;
    namaKelas: string;
    mataKuliahId: number;
    kodeMk: string;
    namaMk: string;
    sks: number;
    prodiId: number;
    prodiNama: string;
    semesterId: number;
    semesterNama: string;
    periodeNama: string;
    kurikulumId: number | null;
    kapasitas: number;
    terisi: number;
    tipeKelas: string;
    status: string;
    dosenPengajar: string[];
    jumlahDosen: number;
}

export interface SiakadKelasRow extends SiakadKelas, IntegrationMeta {}

export interface SiakadKrs {
    id: number;
    mahasiswaId: number;
    nim: string;
    namaMahasiswa: string;
    kelasId: number | null;
    kodeKelas: string | null;
    kodeMk: string | null;
    namaMk: string | null;
    sks: number;
    prodiNama: string;
    periodeNama: string;
    statusKrs: string;
    /** true bila mahasiswa sudah menjadi peserta kelas di PDDikti */
    pddiktiPesertaId: string | null;
}

export interface SiakadKrsRow extends SiakadKrs, IntegrationMeta {}

export interface SiakadNilai {
    id: number;
    mahasiswaId: number;
    nim: string;
    namaMahasiswa: string;
    kelasId: number | null;
    kodeKelas: string | null;
    kodeMk: string | null;
    namaMk: string | null;
    sks: number;
    nilaiAngka: number | null;
    nilaiHuruf: string | null;
    bobot: number | null;
    prodiNama: string;
    periodeNama: string;
    statusNilai: string;
}

export interface SiakadNilaiRow extends SiakadNilai, IntegrationMeta {}

export interface SiakadAktivitas {
    id: number;
    judul: string;
    kategori: string;
    jenisAktivitas: string;
    semesterNama: string;
    prodiNama: string;
    tanggalMulai: string;
    tanggalSelesai: string;
    lokasi: string | null;
    jumlahAnggota: number;
    anggota: { mahasiswaId: number; nim: string; nama: string }[];
    statusAktivitas: string;
}

export interface SiakadAktivitasRow extends SiakadAktivitas, IntegrationMeta {}

export interface SiakadKelulusan {
    id: number;
    mahasiswaId: number;
    nim: string;
    nama: string;
    prodiNama: string;
    periodeKeluar: string;
    jenisKeluar: string;
    tanggalKeluar: string;
    nomorSk: string | null;
    ipk: number;
    totalSks: number;
    statusMahasiswa: string;
    judulSkripsi: string | null;
}

export interface SiakadKelulusanRow extends SiakadKelulusan, IntegrationMeta {}

export interface SiakadPerguruanTinggi {
    id: number;
    kodePt: string;
    namaPt: string;
    singkatan: string;
    alamat: string;
    telepon: string;
    email: string;
    website: string;
    npwp: string;
    akreditasi: string;
    pddiktiId: string | null;
}

/** Detail satu baris: gabungan data lokal, data PDDIKTI, terjemahan field, dsb. */
export interface EntityDetail {
    entity: EntityKey;
    local: JsonObject;
    remote: JsonObject | null;
    comparison: import('./integration').ComparisonRow[];
    mappingStatus: MappingStatus;
    dataStatus: DataStatus;
    pddiktiId: string | null;
    issues: import('./integration').ValidationIssue[];
    dependencies: import('./integration').DependencyCheckResult;
    payload: import('./integration').PayloadPreviewItem | null;
    history: import('./integration').SyncLogEntry[];
    /** konteks payload mentah terakhir, token selalu disensor */
    rawLast: { request: JsonValue | null; response: JsonValue | null };
    fields: { key: string; label: string; pddiktiField: string | null; value: JsonValue }[];
}
