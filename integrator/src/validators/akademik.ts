import type { EntityValidator } from './common';
import { issue, isEmpty, requireField, requireMappedEntity, requireReference, str } from './common';

/** Validator entitas akademik: prodi, semester, kurikulum, mata kuliah, matkul kurikulum. */

export const validateProdi: EntityValidator = (row, ctx) => {
    const id = str(row.localId || row.id);
    const label = `${str(row.kodeProdi)} — ${str(row.namaProdi)}`;
    const issues = [...requireField(ctx, row, id, label, 'kodeProdi', 'Kode program studi'), ...requireField(ctx, row, id, label, 'namaProdi', 'Nama program studi')];

    if (ctx.resolveExternalId('prodi', row.id as number) === null) {
        issues.push(
            issue(ctx.entity, id, label, 'error', 'PRODI_UNMAPPED', 'Program studi belum dipetakan ke program studi PDDikti.', {
                remediation: 'Gunakan pencocokan otomatis atau pilih prodi PDDikti secara manual pada Mapping Center.',
            }),
        );
    }

    if (isEmpty(row.jenjang)) {
        issues.push(issue(ctx.entity, id, label, 'warning', 'PRODI_JENJANG_MISSING', 'Jenjang pendidikan belum diisi.', { field: 'jenjang' }));
    }

    if (str(row.totalMataKuliah) === '0') {
        issues.push(issue(ctx.entity, id, label, 'info', 'PRODI_NO_COURSE', 'Program studi belum memiliki mata kuliah aktif.'));
    }

    return issues;
};

export const validateSemester: EntityValidator = (row, ctx) => {
    const id = str(row.localId || row.id);
    const label = str(row.namaSemester);
    const issues = [...requireField(ctx, row, id, label, 'kode', 'Kode semester'), ...requireField(ctx, row, id, label, 'tahunAjaran', 'Tahun ajaran')];

    if (ctx.resolveExternalId('semester', row.id as number) === null) {
        issues.push(
            issue(ctx.entity, id, label, 'error', 'SEMESTER_UNMAPPED', 'Semester belum dipetakan ke kode semester PDDikti (contoh format: 20251).', {
                remediation: 'Petakan semester pada menu Pemetaan → Semester.',
            }),
        );
    }

    if (isEmpty(row.tanggalMulai) || isEmpty(row.tanggalSelesai)) {
        issues.push(issue(ctx.entity, id, label, 'warning', 'SEMESTER_DATE_MISSING', 'Tanggal mulai/selesai semester belum lengkap.', { field: 'tanggalMulai' }));
    }

    return issues;
};

export const validateKurikulum: EntityValidator = (row, ctx) => {
    const id = str(row.localId || row.id);
    const label = `${str(row.kode)} — ${str(row.nama)}`;
    const issues = [
        ...requireField(ctx, row, id, label, 'kode', 'Kode kurikulum'),
        ...requireField(ctx, row, id, label, 'nama', 'Nama kurikulum'),
        ...requireMappedEntity(ctx, row, id, label, 'prodi', 'Program Studi', 'id_prodi', row.prodiId as number | null),
    ];

    if (isEmpty(row.totalSks) || Number(row.totalSks) === 0) {
        issues.push(issue(ctx.entity, id, label, 'error', 'KUR_SKS_ZERO', 'Total SKS kurikulum nol sehingga payload jumlah_sks_wajib tidak valid.', { field: 'totalSks' }));
    }

    if (Number(row.jumlahMataKuliah) === 0) {
        issues.push(
            issue(ctx.entity, id, label, 'error', 'KUR_NO_COURSE', 'Kurikulum belum memiliki mata kuliah.', {
                remediation: 'Tambahkan mata kuliah pada kurikulum di SIAKAD.',
            }),
        );
    }

    if (isEmpty(row.semesterMulai)) {
        issues.push(issue(ctx.entity, id, label, 'warning', 'KUR_SEMESTER_MISSING', 'Semester mulai kurikulum belum ditentukan.', { field: 'semesterMulai' }));
    } else if (!ctx.semesterCodes.has(str(row.semesterMulai))) {
        issues.push(issue(ctx.entity, id, label, 'warning', 'KUR_SEMESTER_UNMAPPED', `Semester mulai "${str(row.semesterMulai)}" belum dipetakan.`, { field: 'semesterMulai' }));
    }

    if (str(row.status) !== 'aktif') {
        issues.push(issue(ctx.entity, id, label, 'info', 'KUR_ARCHIVED', 'Kurikulum tidak berstatus aktif. Pastikan memang perlu dilaporkan.'));
    }

    return issues;
};

export const validateMataKuliah: EntityValidator = (row, ctx) => {
    const id = str(row.localId || row.id);
    const label = `${str(row.kode)} — ${str(row.nama)}`;
    const issues = [
        ...requireField(ctx, row, id, label, 'kode', 'Kode mata kuliah'),
        ...requireField(ctx, row, id, label, 'nama', 'Nama mata kuliah'),
        ...requireMappedEntity(ctx, row, id, label, 'prodi', 'Program Studi', 'id_prodi', row.prodiId as number | null),
    ];

    const sks = Number(row.sks);
    if (!Number.isFinite(sks) || sks <= 0) {
        issues.push(issue(ctx.entity, id, label, 'error', 'MK_SKS_INVALID', 'SKS mata kuliah harus lebih besar dari 0.', { field: 'sks' }));
    } else if (sks > 24) {
        issues.push(issue(ctx.entity, id, label, 'error', 'MK_SKS_MAX', 'SKS mata kuliah melebihi batas 24 SKS pada Neo Feeder.', { field: 'sks' }));
    }

    const teori = Number(row.sksTeori ?? 0);
    const praktik = Number(row.sksPraktik ?? 0);
    if (teori + praktik !== sks) {
        issues.push(
            issue(ctx.entity, id, label, 'warning', 'MK_SKS_DECOMPOSITION', `Komposisi SKS (tatap muka ${teori} + praktik ${praktik}) tidak sama dengan total SKS ${sks}.`, {
                field: 'sksTeori',
                remediation: 'Sesuaikan komposisi SKS teori/praktik pada data SIAKAD.',
            }),
        );
    }

    if (str(row.kode).length > 20) {
        issues.push(issue(ctx.entity, id, label, 'error', 'MK_KODE_LENGTH', 'Kode mata kuliah melebihi 20 karakter.', { field: 'kode' }));
    }

    if (isEmpty(row.jenis)) {
        issues.push(issue(ctx.entity, id, label, 'warning', 'MK_JENIS_MISSING', 'Jenis mata kuliah (wajib/pilihan) belum diisi.', { field: 'jenis' }));
    }

    return issues;
};

export const validateMataKuliahKurikulum: EntityValidator = (row, ctx) => {
    const id = str(row.localId || row.id);
    const label = `${str(row.kodeKurikulum)} → ${str(row.kodeMk)}`;
    const issues = [
        ...requireMappedEntity(ctx, row, id, label, 'kurikulum', 'Kurikulum', 'id_kurikulum', row.kurikulumId as number | null),
        ...requireMappedEntity(ctx, row, id, label, 'mata-kuliah', 'Mata Kuliah', 'id_matkul', row.mataKuliahId as number | null),
    ];

    const semester = Number(row.semester);
    if (!Number.isFinite(semester) || semester < 1) {
        issues.push(issue(ctx.entity, id, label, 'error', 'MKK_SEMESTER_INVALID', 'Semester penempatan mata kuliah tidak valid.', { field: 'semester' }));
    } else if (semester > 8) {
        issues.push(issue(ctx.entity, id, label, 'error', 'MKK_SEMESTER_MAX', 'Semester penempatan maksimal 8 pada Neo Feeder.', { field: 'semester' }));
    }

    if (Number(row.sks) <= 0) {
        issues.push(issue(ctx.entity, id, label, 'error', 'MKK_SKS_INVALID', 'SKS relasi mata kuliah–kurikulum tidak valid.', { field: 'sks' }));
    }

    return issues;
};
