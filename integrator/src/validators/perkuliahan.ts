import type { EntityValidator } from './common';
import { issue, isEmpty, requireField, requireMappedEntity, requireReference, str } from './common';

/** Validator entitas perkuliahan: kelas, penugasan dosen, KRS/peserta, nilai. */

export const validateKelas: EntityValidator = (row, ctx) => {
    const id = str(row.localId || row.id);
    const label = `${str(row.kodeKelas)} — ${str(row.namaMk)}`;
    const issues = [
        ...requireField(ctx, row, id, label, 'namaKelas', 'Nama kelas'),
        ...requireMappedEntity(ctx, row, id, label, 'prodi', 'Program Studi', 'id_prodi', row.prodiId as number | null),
        ...requireMappedEntity(ctx, row, id, label, 'semester', 'Semester', 'id_semester', row.semesterId as number | null),
        ...requireMappedEntity(ctx, row, id, label, 'mata-kuliah', 'Mata Kuliah', 'id_matkul', row.mataKuliahId as number | null),
    ];

    const sks = Number(row.sks);
    if (!Number.isFinite(sks) || sks <= 0) {
        issues.push(issue(ctx.entity, id, label, 'error', 'KELAS_SKS_INVALID', 'SKS kelas kuliah tidak valid.', { field: 'sks' }));
    }

    const kapasitas = Number(row.kapasitas);
    if (!Number.isFinite(kapasitas) || kapasitas <= 0) {
        issues.push(issue(ctx.entity, id, label, 'error', 'KELAS_KAPASITAS_INVALID', 'Kapasitas kelas harus lebih besar dari 0.', { field: 'kapasitas' }));
    } else if (Number(row.terisi) > kapasitas) {
        issues.push(
            issue(ctx.entity, id, label, 'warning', 'KELAS_OVER_CAPACITY', `Jumlah peserta (${str(row.terisi)}) melebihi kapasitas kelas (${kapasitas}).`, {
                field: 'kapasitas',
                remediation: 'Sesuaikan kapasitas kelas pada SIAKAD.',
            }),
        );
    }

    if (str(row.namaKelas).length > 20) {
        issues.push(issue(ctx.entity, id, label, 'warning', 'KELAS_NAMA_LENGTH', 'Nama kelas cukup panjang; pastikan diterima oleh Neo Feeder versi terpasang.', { field: 'namaKelas' }));
    }

    if (Number(row.jumlahDosen) === 0) {
        issues.push(
            issue(ctx.entity, id, label, 'warning', 'KELAS_NO_LECTURER', 'Kelas belum memiliki dosen pengajar sehingga penugasan dosen tidak dapat dikirim.', {
                remediation: 'Tetapkan dosen pengajar pada kelas di SIAKAD.',
            }),
        );
    }

    if (str(row.status) !== 'aktif') {
        issues.push(issue(ctx.entity, id, label, 'info', 'KELAS_INACTIVE', 'Kelas berstatus tidak aktif.'));
    }

    return issues;
};

export const validateDosenPengajar: EntityValidator = (row, ctx) => {
    const id = str(row.localId || row.id);
    const label = `${str(row.kodeKelas)} → ${str(row.nama)}`;
    const issues = [
        ...requireMappedEntity(ctx, row, id, label, 'kelas', 'Kelas Kuliah', 'id_kelas_kuliah', row.kelasId as number | null),
        ...requireMappedEntity(ctx, row, id, label, 'dosen', 'Dosen', 'id_registrasi_dosen', row.dosenId as number | null),
        ...requireMappedEntity(ctx, row, id, label, 'semester', 'Semester', 'id_semester', row.semesterId as number | null),
    ];

    if (isEmpty(row.peran)) {
        issues.push(issue(ctx.entity, id, label, 'warning', 'PENGAJAR_PERAN_MISSING', 'Peran dosen pada kelas belum ditentukan.', { field: 'peran' }));
    }

    return issues;
};

export const validateKrs: EntityValidator = (row, ctx) => {
    const id = str(row.localId || row.id);
    const label = `${str(row.nim)} — ${str(row.kodeKelas)}`;
    const issues = [
        ...requireMappedEntity(ctx, row, id, label, 'mahasiswa', 'Mahasiswa', 'id_registrasi_mahasiswa', row.mahasiswaId as number | null),
        ...requireMappedEntity(ctx, row, id, label, 'kelas', 'Kelas Kuliah', 'id_kelas_kuliah', row.kelasId as number | null),
    ];

    if (isEmpty(row.kodeKelas)) {
        issues.push(issue(ctx.entity, id, label, 'error', 'KRS_KELAS_MISSING', 'KRS belum terhubung ke kelas kuliah pada periode yang dilaporkan.', { field: 'kodeKelas' }));
    }

    const status = str(row.statusKrs);
    if (status !== 'disetujui' && status !== 'terkunci') {
        issues.push(
            issue(ctx.entity, id, label, 'error', 'KRS_STATUS_INVALID', `KRS berstatus "${status}" belum disetujui sehingga tidak boleh dikirim ke PDDikti.`, {
                field: 'statusKrs',
                remediation: 'Selesaikan persetujuan KRS pada SIAKAD.',
            }),
        );
    }

    if (Number(row.sks) <= 0) {
        issues.push(issue(ctx.entity, id, label, 'warning', 'KRS_SKS_INVALID', 'SKS mata kuliah pada KRS tidak valid.', { field: 'sks' }));
    }

    if (isEmpty(row.pddiktiPesertaId)) {
        issues.push(
            issue(ctx.entity, id, label, 'info', 'KRS_PESERTA_NEW', 'Mahasiswa belum terdaftar sebagai peserta kelas di PDDikti. Akan dikirim dengan InsertPesertaKelasKuliah.'),
        );
    }

    return issues;
};

export const validateNilai: EntityValidator = (row, ctx) => {
    const id = str(row.localId || row.id);
    const label = `${str(row.nim)} — ${str(row.kodeKelas)}`;
    const issues = [
        ...requireMappedEntity(ctx, row, id, label, 'mahasiswa', 'Mahasiswa', 'id_registrasi_mahasiswa', row.mahasiswaId as number | null),
        ...requireMappedEntity(ctx, row, id, label, 'kelas', 'Kelas Kuliah', 'id_kelas_kuliah', row.kelasId as number | null),
        ...requireMappedEntity(
            ctx,
            row,
            id,
            label,
            'krs',
            'Keanggotaan Kelas (KRS)',
            'id_peserta_kelas_kuliah',
            `${String(row.mahasiswaId ?? '')}:${String(row.kelasId ?? '')}`,
        ),
        ...requireReference(ctx, row, id, label, 'nilaiHuruf', 'skala-nilai', 'Skala nilai'),
    ];

    const angka = Number(row.nilaiAngka);
    if (!Number.isFinite(angka)) {
        issues.push(issue(ctx.entity, id, label, 'error', 'NILAI_ANGKA_MISSING', 'Nilai angka belum diisi.', { field: 'nilaiAngka' }));
    } else if (angka < 0 || angka > 100) {
        issues.push(issue(ctx.entity, id, label, 'error', 'NILAI_ANGKA_RANGE', 'Nilai angka harus berada pada rentang 0–100.', { field: 'nilaiAngka' }));
    }

    if (isEmpty(row.nilaiHuruf)) {
        issues.push(issue(ctx.entity, id, label, 'error', 'NILAI_HURUF_MISSING', 'Nilai huruf belum diisi; skala nilai prodi diperlukan Neo Feeder.', { field: 'nilaiHuruf' }));
    }

    if (str(row.statusNilai) !== 'final') {
        issues.push(
            issue(ctx.entity, id, label, 'error', 'NILAI_NOT_FINAL', 'Nilai belum difinalkan oleh dosen sehingga tidak boleh dikirim ke PDDikti.', {
                field: 'statusNilai',
                remediation: 'Lakukan finalisasi nilai pada modul penilaian SIAKAD.',
            }),
        );
    }

    return issues;
};
