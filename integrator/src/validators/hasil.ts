import type { EntityValidator } from './common';
import { issue, isEmpty, requireField, requireMappedEntity, str } from './common';

/** Validator entitas hasil studi: aktivitas mahasiswa dan kelulusan. */

export const validateAktivitas: EntityValidator = (row, ctx) => {
    const id = str(row.localId || row.id);
    const label = str(row.judul);
    const issues = [...requireField(ctx, row, id, label, 'judul', 'Judul aktivitas')];

    const judul = str(row.judul);
    if (!isEmpty(judul) && judul.length > 200) {
        issues.push(issue(ctx.entity, id, label, 'error', 'AKT_JUDUL_LENGTH', 'Judul aktivitas melebihi 200 karakter.', { field: 'judul' }));
    }

    if (isEmpty(row.jenisAktivitas)) {
        issues.push(
            issue(ctx.entity, id, label, 'error', 'AKT_JENIS_MISSING', 'Jenis aktivitas belum ditentukan sehingga id_jenis_aktivitas tidak dapat dikirim.', {
                field: 'jenisAktivitas',
                remediation: 'Pilih jenis aktivitas (mis. Magang, Studi Independen) pada data SIAKAD.',
            }),
        );
    }

    if (isEmpty(row.kategori)) {
        issues.push(issue(ctx.entity, id, label, 'error', 'AKT_KATEGORI_MISSING', 'Kategori kegiatan belum ditentukan.', { field: 'kategori' }));
    }

    if (isEmpty(row.tanggalMulai) || isEmpty(row.tanggalSelesai)) {
        issues.push(issue(ctx.entity, id, label, 'error', 'AKT_TANGGAL_MISSING', 'Tanggal mulai dan tanggal selesai aktivitas wajib diisi.', { field: 'tanggalMulai' }));
    } else if (new Date(str(row.tanggalMulai)) > new Date(str(row.tanggalSelesai))) {
        issues.push(
            issue(ctx.entity, id, label, 'error', 'AKT_TANGGAL_INVALID', 'Tanggal mulai tidak boleh melebihi tanggal selesai (aturan Neo Feeder).', {
                field: 'tanggalMulai',
            }),
        );
    }

    if (Number(row.jumlahAnggota) === 0) {
        issues.push(
            issue(ctx.entity, id, label, 'warning', 'AKT_TANPA_ANGGOTA', 'Aktivitas belum memiliki anggota mahasiswa sehingga InsertAnggotaAktivitasMahasiswa tidak dijalankan.', {
                remediation: 'Tambahkan anggota aktivitas pada SIAKAD.',
            }),
        );
    }

    if (isEmpty(row.semesterNama)) {
        issues.push(issue(ctx.entity, id, label, 'warning', 'AKT_SEMESTER_MISSING', 'Semester aktivitas belum ditentukan.', { field: 'semesterNama' }));
    }

    return issues;
};

export const validateKelulusan: EntityValidator = (row, ctx) => {
    const id = str(row.localId || row.id);
    const label = `${str(row.nim)} — ${str(row.nama)}`;
    const issues = [...requireMappedEntity(ctx, row, id, label, 'mahasiswa', 'Mahasiswa', 'id_registrasi_mahasiswa', row.mahasiswaId as number | null)];

    if (isEmpty(row.jenisKeluar)) {
        issues.push(issue(ctx.entity, id, label, 'error', 'LULUS_JENIS_MISSING', 'Jenis keluar belum ditentukan (id_jenis_keluar wajib).', { field: 'jenisKeluar' }));
    }

    if (isEmpty(row.tanggalKeluar)) {
        issues.push(issue(ctx.entity, id, label, 'error', 'LULUS_TANGGAL_MISSING', 'Tanggal keluar wajib diisi.', { field: 'tanggalKeluar' }));
    }

    const periode = str(row.periodeKeluar);
    if (isEmpty(periode)) {
        issues.push(issue(ctx.entity, id, label, 'error', 'LULUS_PERIODE_MISSING', 'Periode keluar belum ditentukan.', { field: 'periodeKeluar' }));
    } else if (!ctx.semesterCodes.has(periode)) {
        issues.push(
            issue(ctx.entity, id, label, 'error', 'LULUS_PERIODE_UNMAPPED', `Periode keluar "${periode}" belum dipetakan ke semester PDDikti.`, {
                field: 'periodeKeluar',
                remediation: 'Petakan semester pada menu Pemetaan → Semester.',
            }),
        );
    }

    const ipk = Number(row.ipk);
    if (!Number.isFinite(ipk) || ipk <= 0 || ipk > 4) {
        issues.push(issue(ctx.entity, id, label, 'error', 'LULUS_IPK_INVALID', 'IPK harus berada pada rentang 0–4.', { field: 'ipk' }));
    }

    const totalSks = Number(row.totalSks);
    if (!Number.isFinite(totalSks) || totalSks < 100) {
        issues.push(
            issue(ctx.entity, id, label, 'warning', 'LULUS_SKS_LOW', `Total SKS ${str(row.totalSks)} belum mencapai syarat kelulusan umum (≥ 100 SKS).`, {
                field: 'totalSks',
            }),
        );
    }

    if (isEmpty(row.nomorSk)) {
        issues.push(
            issue(ctx.entity, id, label, 'warning', 'LULUS_SK_MISSING', 'Nomor SK yudisium belum tersedia. Field sk_yudisium tidak akan dikirim.', {
                field: 'nomorSk',
                remediation: 'Lengkapi nomor SK pada data kelulusan SIAKAD.',
            }),
        );
    }

    if (str(row.jenisKeluar) === 'Lulus' && isEmpty(row.judulSkripsi)) {
        issues.push(issue(ctx.entity, id, label, 'info', 'LULUS_JUDUL_KOSONG', 'Judul skripsi/tugas akhir kosong.'));
    }

    return issues;
};
