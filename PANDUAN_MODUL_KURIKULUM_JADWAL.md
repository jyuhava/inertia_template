# Modul Mata Kuliah, Kurikulum, dan Jadwal

Fondasi akademik baru: Mata Kuliah (master) → Kurikulum → Mata Kuliah dalam Kurikulum → Kelas Kuliah → Jadwal. Modul ini **tidak** mencakup KRS/enrollment, nilai, KHS, transkrip, atau presensi — semua itu dibangun di atas fondasi ini pada tahap berikutnya.

## Entity baru

- `kategori_mata_kuliahs`, `kelompok_mata_kuliahs` — reference data (bukan enum hardcoded).
- `mata_kuliah_prasyarats` — prasyarat many-to-many dengan nilai minimum.
- `substansi_kuliahs`, `mata_kuliah_substansi` — substansi kuliah per Neo Feeder.
- `kurikulums` — versi-aware per program studi (tidak overwrite kurikulum lama).
- `kurikulum_mata_kuliahs` — "mata kuliah X menjadi bagian dari kurikulum Y", dengan override SKS/semester/nilai minimum.
- `mata_kuliah_ekuivalensis` — mapping MK lama → MK baru.
- `ruangans` — master ruang baru (project sebelumnya hanya menyimpan `ruangan` sebagai teks bebas pada `jadwal_kuliahs`).
- `kelas_kuliahs`, `kelas_kuliah_pengajars` — kelas kuliah dan penugasan dosen pengajar (many-to-many, terpisah dari `schedules`).
- `jadwal_kelas_kuliahs` — jadwal terstruktur (`hari`, `jam_mulai`, `jam_selesai`) dengan hasMany per kelas, mendukung multi-sesi per minggu.
- `pddikti_akademik_mappings`, `pddikti_akademik_sync_logs` — mapping/sync generik (polymorphic) untuk MataKuliah, Kurikulum, KurikulumMataKuliah, dan KelasKuliah.

## Entity existing yang digunakan ulang

`mata_kuliahs`, `prodis`, `semesters` (sebagai academic period), `dosens`. Tabel `jadwal_kuliahs` lama (dipakai KRS/Penilaian/Absensi/LMS) **tidak diubah** — jadwal baru berada di `jadwal_kelas_kuliahs` yang terhubung ke `kelas_kuliahs`, bukan ke `jadwal_kuliahs`.

## Conflict detection

Deteksi bentrok ruang, kelas, dan dosen menggunakan interval overlap (`existing_start < new_end AND existing_end > new_start`), bukan perbandingan `start_time == start_time`. Diterapkan di `App\Http\Controllers\Admin\KelasKuliah\JadwalController`.

## PDDikti / Neo Feeder

Belum ada client Neo Feeder di repository. `PddiktiAkademikFeederService` hanya mencatat kegagalan konfigurasi secara jujur (`sync_status = failed`), tidak pernah mengklaim sukses. Sama seperti Modul Mahasiswa/Dosen, integrasi nyata memerlukan client/kredensial resmi sebelum method `sync()` dapat diisi.

## Setup deployment

1. Jalankan `php artisan migrate`.
2. Data reference kategori/kelompok mata kuliah otomatis terisi lewat migration seed minimal.
3. Master ruang, mata kuliah, kurikulum, kelas, dan jadwal dikelola lewat menu **Admin → Mata Kuliah / Kurikulum / Ruangan / Kelas Kuliah / Jadwal Akademik**.
