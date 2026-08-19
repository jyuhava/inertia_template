# Database Seeders Documentation - SIAKAD

## Overview
Dokumentasi ini menjelaskan tentang database seeders yang tersedia dalam sistem SIAKAD.

## Available Seeders

### 1. AdminSeeder
Membuat akun administrator untuk sistem.

**Data yang dibuat:**
- 2 akun admin
  - admin@siakad.com (password: password)
  - superadmin@siakad.com (password: password)

### 2. ProdiSeeder
Membuat data program studi.

**Data yang dibuat:**
- 5 Program Studi:
  - Teknik Informatika (TI) - S1
  - Sistem Informasi (SI) - S1
  - Manajemen Informatika (MI) - D3
  - Teknik Komputer (TK) - D4
  - Informatika (IF) - S2

### 3. DosenSeeder
Membuat data dosen pengajar.

### 4. MahasiswaSeeder
Membuat data mahasiswa dengan berbagai status dan angkatan.

**Data yang dibuat:**
- Total: 22 mahasiswa
- Distribusi berdasarkan status:
  - Aktif: 19 mahasiswa
  - Lulus: 2 mahasiswa (alumni)
  - Nonaktif: 1 mahasiswa (cuti)
  
- Distribusi berdasarkan angkatan:
  - 2019: 2 mahasiswa (alumni)
  - 2020: 1 mahasiswa (nonaktif)
  - 2021: 5 mahasiswa
  - 2022: 7 mahasiswa
  - 2023: 7 mahasiswa
  
- Distribusi berdasarkan program studi:
  - Teknik Informatika: 11 mahasiswa
  - Sistem Informasi: 7 mahasiswa
  - Manajemen Informatika: 2 mahasiswa
  - Teknik Komputer: 2 mahasiswa

**Default Password:**
- Semua mahasiswa: `password123`

**Sample Login Credentials:**
```
Email: ahmad.rizki@student.siakad.com
Password: password123

Email: siti.nurhaliza@student.siakad.com
Password: password123

Email: dewi.kartika@student.siakad.com
Password: password123
```

### 5. TahunAjaranSeeder
Membuat data tahun ajaran akademik.

### 6. MataKuliahSeeder
Membuat data mata kuliah untuk setiap program studi.

## How to Run Seeders

### Run All Seeders
```bash
php artisan db:seed
```

### Run Specific Seeder
```bash
php artisan db:seed --class=MahasiswaSeeder
```

### Fresh Migration with Seeders
```bash
php artisan migrate:fresh --seed
```

## Seeder Dependencies

Urutan eksekusi seeder penting karena ada dependencies:

1. **AdminSeeder** - Tidak ada dependency
2. **ProdiSeeder** - Tidak ada dependency
3. **DosenSeeder** - Memerlukan User (untuk akun dosen)
4. **MahasiswaSeeder** - Memerlukan:
   - ProdiSeeder (untuk relasi program studi)
5. **TahunAjaranSeeder** - Tidak ada dependency
6. **MataKuliahSeeder** - Memerlukan:
   - ProdiSeeder (untuk relasi program studi)

## Features of MahasiswaSeeder

### Smart Features:
1. **Duplicate Prevention**: Seeder akan skip jika email atau NIM sudah ada
2. **Prodi Validation**: Memastikan program studi ada sebelum membuat mahasiswa
3. **Realistic Data**: 
   - NIM dengan format tahun masuk (2021001001)
   - Email dengan domain @student.siakad.com
   - Data personal yang realistis (nama, alamat, tanggal lahir)
   - Berbagai kota asal di Indonesia

### Data Variety:
- **Jenis Kelamin**: Laki-laki (L) dan Perempuan (P)
- **Status**: Aktif, Nonaktif (cuti), dan Lulus (alumni)
- **Angkatan**: 2019-2023
- **Program Studi**: Semua prodi yang tersedia

## Testing Data

Seeder ini ideal untuk:
- Development environment
- Testing environment
- Demo purposes
- Initial system setup

## Security Notes

⚠️ **IMPORTANT**: 
- Jangan gunakan password default di production
- Ganti semua password setelah deployment
- Password default hanya untuk development/testing

## Troubleshooting

### Error: Prodi not found
**Solution**: Jalankan ProdiSeeder terlebih dahulu
```bash
php artisan db:seed --class=ProdiSeeder
```

### Error: Duplicate email/NIM
**Solution**: Seeder akan otomatis skip data yang sudah ada dan melanjutkan ke data berikutnya

### Error: Foreign key constraint
**Solution**: Pastikan urutan seeder sesuai dengan dependencies
```bash
php artisan migrate:fresh --seed
```

## Additional Information

### Email Format
- Admin: `[name]@siakad.com`
- Mahasiswa: `[name]@student.siakad.com`
- Dosen: `[name]@dosen.siakad.com`

### NIM Format
- Format: `[tahun][kode_prodi][nomor_urut]`
- Contoh: `2023001001`
  - 2023: Tahun masuk
  - 001: Kode internal prodi
  - 001: Nomor urut mahasiswa

### Default Passwords
- Admin: `password`
- Mahasiswa: `password123`
- Dosen: (check DosenSeeder)

## Contributing

Jika ingin menambah data seeder:
1. Edit file seeder yang sesuai
2. Tambahkan data baru dalam array
3. Jalankan seeder dengan `--class` flag untuk testing
4. Commit changes dengan pesan yang deskriptif
