# DosenBaruSeeder Documentation

## Overview
Seeder khusus untuk dosen-dosen baru berdasarkan jadwal perkuliahan semester 1 prodi MPI STIT AL-WAFI BOGOR.

## Data yang Dibuat
Total: **8 dosen baru** dengan akun user masing-masing

### Daftar Dosen Baru:

1. **Ust. Yusuf Abdullah, M.Pd.**
   - Email: yusuf.abdullah@stit-alwafi.ac.id
   - Bidang Keahlian: Al-Quran & Ulumul Quran
   - Mata Kuliah: Al-Quran & Ulumul Quran

2. **Dr. Ali Saman Hasan, MA**
   - Email: ali.saman@stit-alwafi.ac.id
   - Bidang Keahlian: Ilmu Kepesantrenan
   - Mata Kuliah: Ilmu Kepesantrenan

3. **Usth. Dr. Ananingtyas**
   - Email: ananingtyas@stit-alwafi.ac.id
   - Bidang Keahlian: Filsafat Umum
   - Mata Kuliah: Filsafat Umum

4. **Usth. Fortin Sri Haryani**
   - Email: fortin.sri@stit-alwafi.ac.id
   - Bidang Keahlian: Ilmu Manajemen
   - Mata Kuliah: Ilmu Manajemen

5. **Ust. Muh. Bakri Rahimin, Lc, ME**
   - Email: bakri.rahimin@stit-alwafi.ac.id
   - Bidang Keahlian: Ulumul Hadits, Ekonomi Islam
   - Mata Kuliah: Ulumul Hadits

6. **Ust. Marullah MZ, M.Ag.**
   - Email: marullah.mz@stit-alwafi.ac.id
   - Bidang Keahlian: Akidah dan Adab
   - Mata Kuliah: Akidah dan Adab

7. **Ust. Zikra Juninawan, Lc, MA**
   - Email: zikra.juninawan@stit-alwafi.ac.id
   - Bidang Keahlian: Pancasila, Studi Islam
   - Mata Kuliah: Pancasila

8. **Ust. Nandang**
   - Email: nandang@stit-alwafi.ac.id
   - Bidang Keahlian: Sosiologi dan Antropologi
   - Mata Kuliah: Sosiologi dan Antropologi

## Informasi Login
- **Password default**: `password` (untuk semua dosen)
- **Role**: `dosen`
- Domain email: `@stit-alwafi.ac.id`

## Jadwal Mengajar
Berdasarkan jadwal perkuliahan semester 1 prodi MPI:
- **Hari**: Sabtu dan Ahad
- **Waktu**: 08.00 - 18.00 (4 sesi per hari)
- **Lokasi**: STIT AL-WAFI BOGOR

## Usage
```bash
# Menjalankan seeder khusus dosen baru
php artisan db:seed --class=DosenBaruSeeder

# Atau melalui DatabaseSeeder (sudah termasuk)
php artisan db:seed
```

## Dependencies
- Memerlukan tabel `users` dan `dosens` sudah ter-migrate
- Seeder ini independen dan bisa dijalankan terpisah dari DosenSeeder yang lama
