import type { EntityValidator } from './common';
import { digitsOnly, issue, isEmpty, maxLength, requireField, requireMappedEntity, requireReference, str } from './common';

/** Validator sivitas akademik: mahasiswa, dosen, riwayat pendidikan. */

export const validateMahasiswa: EntityValidator = (row, ctx) => {
    const id = str(row.localId || row.id);
    const label = `${str(row.nim)} — ${str(row.nama)}`;
    const issues = [
        ...requireField(ctx, row, id, label, 'nim', 'NIM'),
        ...requireField(ctx, row, id, label, 'nama', 'Nama mahasiswa'),
        ...requireField(ctx, row, id, label, 'jenisKelamin', 'Jenis kelamin'),
        ...requireField(ctx, row, id, label, 'tempatLahir', 'Tempat lahir'),
        ...requireField(ctx, row, id, label, 'tanggalLahir', 'Tanggal lahir'),
        ...requireMappedEntity(ctx, row, id, label, 'prodi', 'Program Studi', 'id_prodi', row.prodiId as number | null),
        ...requireReference(ctx, row, id, label, 'agama', 'agama', 'Agama'),
        ...requireField(ctx, row, id, label, 'noHp', 'Nomor HP'),
    ];

    const nim = str(row.nim);
    if (!isEmpty(nim) && !digitsOnly(nim)) {
        issues.push(
            issue(ctx.entity, id, label, 'error', 'MHS_NIM_FORMAT', 'NIM harus berupa angka.', {
                field: 'nim',
                remediation: 'Perbaiki format NIM pada data SIAKAD.',
            }),
        );
    }

    if (nim.length > 16) {
        issues.push(issue(ctx.entity, id, label, 'error', 'MHS_NIM_LENGTH', 'NIM melebihi 16 karakter yang diizinkan Neo Feeder.', { field: 'nim' }));
    }

    if (!maxLength(row.nama, 100)) {
        issues.push(issue(ctx.entity, id, label, 'error', 'MHS_NAMA_LENGTH', 'Nama mahasiswa melebihi 100 karakter.', { field: 'nama' }));
    }

    const nik = str(row.nik);
    if (isEmpty(nik)) {
        issues.push(
            issue(ctx.entity, id, label, 'warning', 'MHS_NIK_MISSING', 'NIK belum tersedia. Sebagian versi Neo Feeder mewajibkan NIK pada biodata mahasiswa.', {
                field: 'nik',
                remediation: 'Lengkapi NIK pada data SIAKAD bila kebijakan integrasi mewajibkan.',
            }),
        );
    } else if (!digitsOnly(nik, 16)) {
        issues.push(issue(ctx.entity, id, label, 'error', 'MHS_NIK_FORMAT', 'NIK harus 16 digit angka.', { field: 'nik' }));
    }

    const email = str(row.email);
    if (isEmpty(email)) {
        issues.push(issue(ctx.entity, id, label, 'warning', 'MHS_EMAIL_MISSING', 'Email belum tersedia sehingga UpdateBiodataMahasiswa tidak dapat mengirim field email.', { field: 'email' }));
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        issues.push(issue(ctx.entity, id, label, 'error', 'MHS_EMAIL_FORMAT', 'Format email tidak valid.', { field: 'email' }));
    }

    const noHp = str(row.noHp);
    if (!isEmpty(noHp) && !/^08\d{7,13}$/.test(noHp.replace(/[\s-]/g, ''))) {
        issues.push(issue(ctx.entity, id, label, 'warning', 'MHS_HP_FORMAT', 'Nomor HP tidak mengikuti format Indonesia (08xxxxxxxxxx).', { field: 'noHp' }));
    }

    const kewarganegaraan = str(row.kewarganegaraan);
    if (!isEmpty(kewarganegaraan) && kewarganegaraan !== 'Indonesia') {
        issues.push(issue(ctx.entity, id, label, 'info', 'MHS_WNA', 'Mahasiswa asing: pastikan referensi negara tersedia pada PDDikti.', { field: 'kewarganegaraan' }));
    }

    if (isEmpty(row.alamat)) {
        issues.push(issue(ctx.entity, id, label, 'warning', 'MHS_ALAMAT_MISSING', 'Alamat kosong. Field jalan tidak akan dikirim pada payload.', { field: 'alamat' }));
    }

    return issues;
};

export const validateDosen: EntityValidator = (row, ctx) => {
    const id = str(row.localId || row.id);
    const label = `${str(row.nidn || row.nip) || 'Tanpa NIDN'} — ${str(row.nama)}`;
    const issues = [...requireField(ctx, row, id, label, 'nama', 'Nama dosen')];

    if (isEmpty(row.nidn) && isEmpty(row.nidk)) {
        issues.push(
            issue(ctx.entity, id, label, 'critical', 'DSN_NIDN_MISSING', 'NIDN dan NIDK kosong sehingga dosen tidak dapat dipetakan ke PDDikti.', {
                field: 'nidn',
                remediation: 'Lengkapi NIDN/NIDK pada data SIAKAD.',
            }),
        );
    }

    if (isEmpty(row.nidn)) {
        issues.push(issue(ctx.entity, id, label, 'warning', 'DSN_NIDN_EMPTY', 'NIDN kosong; pemetaan hanya dapat memakai NIDK atau nama.', { field: 'nidn' }));
    }

    if (isEmpty(row.prodiId)) {
        issues.push(issue(ctx.entity, id, label, 'warning', 'DSN_HOMEBASE_MISSING', 'Homebase program studi belum ditentukan.', { field: 'prodiId' }));
    } else if (ctx.resolveExternalId('prodi', row.prodiId as number) === null) {
        issues.push(issue(ctx.entity, id, label, 'warning', 'DSN_HOMEBASE_UNMAPPED', 'Program studi homebase belum dipetakan ke PDDikti.', { field: 'prodiId' }));
    }

    issues.push(
        issue(
            ctx.entity,
            id,
            label,
            'info',
            'DSN_READ_ONLY',
            'Biodata dosen tidak dapat dikirim melalui Web Service Neo Feeder (tidak ada act Insert/Update biodata dosen). Integrator hanya memetakan dan membandingkan.',
        ),
    );

    if (isEmpty(row.email)) {
        issues.push(issue(ctx.entity, id, label, 'warning', 'DSN_EMAIL_MISSING', 'Email dosen belum tersedia.', { field: 'email' }));
    }

    return issues;
};

export const validateRiwayatPendidikan: EntityValidator = (row, ctx) => {
    const id = str(row.localId || row.id);
    const label = `${str(row.nim)} — ${str(row.nama)}`;
    const issues = [
        ...requireMappedEntity(ctx, row, id, label, 'mahasiswa', 'Mahasiswa', 'id_registrasi_mahasiswa', row.mahasiswaId as number | null),
        ...requireMappedEntity(ctx, row, id, label, 'prodi', 'Program Studi', 'id_prodi', row.prodiId as number | null),
        ...requireReference(ctx, row, id, label, 'jenisPendaftaran', 'jenis-pendaftaran', 'Jenis pendaftaran'),
        ...requireReference(ctx, row, id, label, 'jalurMasuk', 'jalur-masuk', 'Jalur masuk'),
        ...requireReference(ctx, row, id, label, 'pembiayaan', 'pembiayaan', 'Jenis pembiayaan'),
    ];

    const periode = str(row.semesterMasuk);
    if (isEmpty(periode)) {
        issues.push(issue(ctx.entity, id, label, 'error', 'RPD_PERIODE_MISSING', 'Periode masuk belum ditentukan.', { field: 'semesterMasuk' }));
    } else if (!ctx.semesterCodes.has(periode)) {
        issues.push(
            issue(ctx.entity, id, label, 'error', 'RPD_PERIODE_UNMAPPED', `Periode masuk "${periode}" belum dipetakan ke kode semester PDDikti.`, {
                field: 'semesterMasuk',
                remediation: 'Petakan semester pada menu Pemetaan → Semester.',
            }),
        );
    }

    if (isEmpty(row.tanggalMasuk)) {
        issues.push(issue(ctx.entity, id, label, 'warning', 'RPD_TANGGAL_MISSING', 'Tanggal masuk kosong sehingga field tanggal_daftar tidak dikirim.', { field: 'tanggalMasuk' }));
    }

    return issues;
};
