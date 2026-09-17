# Modul KRS / Student Enrollment

Mahasiswa mendaftar **kelas kuliah** (bukan mata kuliah master langsung): `Mahasiswa → KRS (header) → KRS Item (detail) → Kelas Kuliah → Mata Kuliah`. Modul ini dibangun sepenuhnya di atas fondasi Mata Kuliah/Kurikulum/Kelas Kuliah/Jadwal dan **tidak mengubah** modul KRS lama (`krs` + `jadwal_kuliahs`) yang masih dipakai Penilaian/Absensi/LMS.

## Entity baru

- `student_course_registrations` — KRS header: mahasiswa, periode, kurikulum (snapshot konteks kurikulum saat KRS dibuat), status lifecycle, submitted/approved/rejected/locked timestamps.
- `student_course_registration_items` — detail: kelas kuliah, mata kuliah, mapping kurikulum-mata-kuliah (jika ada), SKS snapshot, status (active/cancelled — item yang dibatalkan tidak dihapus agar histori tetap ada).
- `student_course_registration_audits` — audit trail setiap perubahan (dibuat, mata kuliah ditambah/dihapus, diajukan, disetujui, ditolak, direvisi, dikunci, dibuka kembali oleh admin) dengan before/after/reason/user.
- `student_advisors` — dosen pembimbing akademik (PA), belum ada sebelumnya; menggunakan ulang `mahasiswas` dan `dosens`.
- Kolom baru pada `periode_krs` (bukan tabel baru): `krs_status` (draft/open/closed — terpisah dari `status` aktif/tidak_aktif lama), `revisi_mulai`, `revisi_selesai`, `wajib_persetujuan_pa`, `maksimal_sks`, `minimal_sks`.
- Mapping/sync PDDikti KRS memakai ulang tabel generik `pddikti_akademik_mappings`/`pddikti_akademik_sync_logs` dari Modul Kurikulum, dengan `entity_type = StudentCourseRegistration::class`.

## Alur

1. Admin membuka periode KRS (`krs_status = open`) — divalidasi dulu: kelas kuliah, kurikulum aktif, dan prodi aktif harus tersedia.
2. Mahasiswa membuka KRS → sistem otomatis membuat draft KRS dan menentukan kurikulum aktif prodi mahasiswa.
3. Mahasiswa memilih kelas kuliah yang tersedia pada periode/kurikulum yang sesuai.
4. Setiap penambahan kelas divalidasi ulang di server: status periode, status mahasiswa, status kelas, kapasitas (dengan row-lock untuk mencegah race condition), duplikat kelas/mata kuliah, prasyarat, **interval-overlap conflict jadwal**, dan batas SKS (diambil dari `periode_krs`, tidak di-hardcode).
5. Mahasiswa mengajukan KRS → divalidasi ulang penuh sebelum status berubah ke `submitted`.
6. Dosen PA (jika ditugaskan) atau Admin me-review: approve/reject/request revision.
7. KRS yang disetujui dapat dikunci admin (`locked`); setelah terkunci mahasiswa tidak bisa mengubah kecuali admin melakukan override (`unlock`) yang selalu tercatat di audit trail dengan alasan.

## PDDikti / Neo Feeder

Tidak ada client Neo Feeder di repository. Sinkronisasi KRS hanya diizinkan untuk status `approved`/`locked` (KRS final, bukan draft), dan `PddiktiAkademikFeederService` selalu mencatat kegagalan konfigurasi secara jujur — tidak pernah mengklaim sukses.

## Otorisasi

- Mahasiswa hanya dapat melihat/mengubah KRS miliknya sendiri.
- Dosen PA hanya dapat me-review mahasiswa yang benar-benar dibimbingnya (`student_advisors` aktif).
- Admin memiliki akses penuh: list/filter/approve/reject/revision/lock/unlock/cancel/bulk-approve (bulk approve tetap memvalidasi ulang setiap KRS satu per satu, tidak melakukan mass update buta).

## Setup deployment

1. Jalankan `php artisan migrate`.
2. Tetapkan dosen pembimbing akademik lewat **Admin → Dosen Pembimbing Akademik** sebelum mengaktifkan `wajib_persetujuan_pa`.
3. Buka KRS lewat **Admin → Periode KRS → Buka KRS** setelah kelas kuliah dan kurikulum aktif siap.
