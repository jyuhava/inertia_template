# Modul Dosen

Modul ini mengelola master dosen dan riwayat administrasinya. Modul tidak mencakup pengampu mata kuliah, jadwal, penilaian, BKD, atau aktivitas SISTER.

## Cakupan data

- Biodata dan identifier: NIP/kode internal, NIK, NIDN, NIDK, NUPTK, NPWP, gelar, kontak, dan kewarganegaraan.
- Kepegawaian dasar: jenis/status kepegawaian, nomor pegawai, masa mulai, status dosen, status PNS, dan unit kerja.
- Alamat KTP dan domisili, status dosen, homebase Prodi, pendidikan, jabatan akademik, pangkat/golongan, sertifikasi, dan dokumen.
- Seluruh perubahan status, homebase, pendidikan, dan jabatan disimpan sebagai riwayat.

## PDDikti / Neo Feeder

Sistem menyediakan mapping (`pddikti_id` dan `id_registrasi_dosen`) serta log sinkronisasi terpisah untuk dosen. Belum ada client atau kredensial Neo Feeder di repository; tombol sinkronisasi akan mencatat kegagalan konfigurasi secara jujur, bukan mengirim data atau mengklaim sukses.

Untuk mengaktifkan integrasi, implementasikan client resmi dan kontrak layanan yang tervalidasi pada `App\Services\Pddikti\PddiktiDosenFeederService`, lalu tambahkan pengujian respons sukses/gagal terhadap client tersebut. Jangan menaruh kredensial dalam source code atau log.

## Setup deployment

1. Jalankan `php artisan migrate`.
2. Pastikan disk `public` dapat ditulis dan jalankan `php artisan storage:link` bila dokumen/foto disajikan dari storage publik.
3. Kelola data lewat menu **Admin → Dosen**. Aksesnya mengikuti middleware aplikasi yang ada: `auth`, `verified`, dan `role:admin`.
