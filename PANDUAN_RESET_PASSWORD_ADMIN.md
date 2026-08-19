# 🔐 PANDUAN FITUR RESET PASSWORD UNTUK ADMIN

## 📋 Deskripsi Fitur

Fitur Reset Password memungkinkan admin untuk:
- Mereset password user (mahasiswa dan dosen)
- Generate password random untuk user
- Manajemen user secara terpusat
- Reset password secara bulk/massal
- Toggle status user (aktif/nonaktif)

---

## 🚀 Cara Menggunakan Fitur Reset Password

### 1. **Akses Manajemen User**

#### Melalui Menu Utama:
1. Login sebagai admin
2. Dari dashboard admin, cari menu **"Manajemen User"** atau **"User Management"**
3. Klik untuk masuk ke halaman daftar semua user

#### Melalui Detail Mahasiswa/Dosen:
1. Buka halaman **Admin → Mahasiswa** atau **Admin → Dosen**
2. Klik **"Lihat"** pada mahasiswa/dosen yang ingin direset passwordnya
3. Di halaman detail, klik tombol **"Reset Password"** (tombol merah)

---

### 2. **Reset Password Individual**

#### Metode 1: Dari Halaman User Management
1. **Akses**: Admin → User Management
2. **Cari User**: Gunakan search box atau filter berdasarkan role
3. **Pilih Metode**:
   - **🔑 Manual**: Klik ikon kunci → masukkan password baru manual
   - **🔄 Generate**: Klik ikon refresh → sistem generate password random

#### Metode 2: Dari Detail Mahasiswa/Dosen
1. **Akses**: Admin → Mahasiswa/Dosen → Detail
2. **Klik "Reset Password"**: Tombol merah di pojok kanan atas
3. **Isi Form**:
   - Password baru (minimal 8 karakter)
   - Konfirmasi password
4. **Submit**: Klik "Reset Password"

#### Langkah Detail Reset Password Manual:
1. **Masukkan Password Baru**:
   - Minimal 8 karakter
   - Kombinasi huruf, angka, dan simbol (disarankan)
   - Hindari password yang mudah ditebak
2. **Konfirmasi Password**: Ketik ulang password yang sama
3. **Klik "Reset Password"**
4. **Password Berhasil Direset**: User akan otomatis logout dari semua sesi

---

### 3. **Generate Password Random**

#### Fitur Auto-Generate:
1. **Dari User Management**: Klik ikon 🔄 (refresh) pada baris user
2. **Konfirmasi**: Sistem akan menanyakan konfirmasi
3. **Password Otomatis**: Sistem generate password 8 karakter (alphanumeric)
4. **Catat Password**: Password baru akan ditampilkan di notifikasi
5. **Informasikan ke User**: Berikan password baru melalui saluran yang aman

#### Keunggulan Generate Random:
- ✅ Password sulit ditebak
- ✅ Memenuhi standar keamanan
- ✅ Cepat dan efisien
- ✅ Tidak perlu memikirkan password

---

### 4. **Reset Password Massal/Bulk**

#### Cara Bulk Reset:
1. **Pilih Multiple Users**:
   - Centang checkbox di sebelah kiri nama user
   - Atau gunakan "Select All" untuk pilih semua
2. **Bulk Actions Menu**: Akan muncul menu aksi di atas tabel
3. **Klik "Reset Password"**
4. **Masukkan Password Baru**:
   - Password yang sama akan diterapkan ke semua user yang dipilih
   - Masukkan password dan konfirmasi
5. **Konfirmasi**: Klik OK untuk melanjutkan
6. **Selesai**: Semua user terpilih akan memiliki password yang sama

#### Tips Bulk Reset:
- **Gunakan password sementara** yang mudah diingat
- **Instruksikan user** untuk mengganti password setelah login pertama
- **Catat user yang direset** untuk follow-up

---

### 5. **Toggle Status User**

#### Aktifkan/Nonaktifkan User:
1. **Dari User Management**: Klik ikon 👁️ (mata) pada baris user
2. **Konfirmasi Perubahan**: Sistem akan menanyakan konfirmasi
3. **Status Berubah**:
   - **Aktif → Nonaktif**: User tidak bisa login
   - **Nonaktif → Aktif**: User bisa login kembali

#### Catatan Penting:
- Status user berbeda dengan status password
- User nonaktif tetap memiliki data di sistem
- Fitur ini tidak menghapus data user

---

## 📊 Dashboard User Management

### Informasi yang Ditampilkan:
- **Total User**: Jumlah semua user dalam sistem
- **Total Mahasiswa**: Jumlah user dengan role mahasiswa
- **Total Dosen**: Jumlah user dengan role dosen  
- **Total Admin**: Jumlah user dengan role admin

### Filter dan Pencarian:
- **Search**: Cari berdasarkan nama atau email
- **Filter Role**: Tampilkan hanya admin/mahasiswa/dosen
- **Export**: Download data user ke CSV

### Informasi Per User:
- **Identitas**: Nama, email, role
- **Info Tambahan**: NIM/NIP, prodi/bidang keahlian
- **Status**: Aktif/nonaktif/lulus/pensiun
- **Aksi**: Reset password, generate password, toggle status

---

## ⚠️ Hal Penting yang Harus Diperhatikan

### Keamanan:
1. **Password Baru Harus Kuat**:
   - Minimal 8 karakter
   - Kombinasi huruf besar, kecil, angka
   - Hindari informasi pribadi (nama, tanggal lahir)

2. **Penyampaian Password**:
   - Jangan kirim via email biasa
   - Gunakan saluran komunikasi yang aman
   - Berikan secara langsung jika memungkinkan
   - Instruksikan untuk mengganti password setelah login pertama

3. **Dokumentasi**:
   - Catat kapan password direset
   - Catat alasan reset password
   - Monitor aktivitas login setelah reset

### Prosedur yang Disarankan:
1. **Verifikasi Identitas**: Pastikan request reset dari user yang sah
2. **Alasan Reset**: Catat alasan (lupa password, compromise, dll)
3. **Password Sementara**: Berikan password sementara yang aman
4. **Follow-up**: Pastikan user berhasil login dengan password baru
5. **Edukasi**: Ingatkan user untuk menjaga keamanan password

---

## 🔍 Troubleshooting

### Masalah Umum:

#### Q: Password tidak bisa direset?
**A:**
- Pastikan koneksi internet stabil
- Refresh halaman dan coba lagi
- Periksa format password (minimal 8 karakter)
- Pastikan konfirmasi password sama

#### Q: User masih tidak bisa login setelah reset?
**A:**
- Periksa status user (harus aktif)
- Pastikan email user sudah verified
- Cek apakah ada spasi di awal/akhir password
- Minta user clear browser cache

#### Q: Generate password tidak muncul?
**A:**
- Periksa pop-up blocker browser
- Coba refresh halaman
- Gunakan metode manual reset password

#### Q: Bulk reset tidak berfungsi?
**A:**
- Pastikan sudah memilih minimal 1 user
- Periksa koneksi internet
- Coba reset satu per satu jika masalah berlanjut

#### Q: Status user tidak berubah?
**A:**
- Refresh halaman setelah toggle
- Periksa apakah user memiliki data terkait yang mencegah perubahan status
- Hubungi IT support jika masalah berlanjut

---

## 📈 Best Practices

### Untuk Admin:
1. **Regular Password Policy**:
   - Atur kebijakan reset password berkala
   - Edukasi user tentang password yang kuat
   - Monitor login yang mencurigakan

2. **Dokumentasi Reset**:
   - Catat setiap reset password
   - Simpan alasan dan tanggal reset
   - Follow-up dengan user setelah reset

3. **Keamanan Sistem**:
   - Jangan berikan akses reset password ke sembarang orang
   - Gunakan fitur ini hanya untuk keperluan yang sah
   - Monitor log aktivitas reset password

### Untuk User (Mahasiswa/Dosen):
1. **Setelah Menerima Password Baru**:
   - Login sesegera mungkin
   - Ganti password dengan yang mudah diingat tapi aman
   - Jangan bagikan password ke orang lain

2. **Maintenance Password**:
   - Ganti password secara berkala
   - Gunakan password yang unik untuk setiap sistem
   - Aktifkan two-factor authentication jika tersedia

---

## 🎯 Fitur Tambahan

### Export Data User:
- **Format**: CSV (Excel compatible)
- **Data**: Nama, email, role, NIM/NIP, status, dll
- **Filter**: Bisa export berdasarkan role atau pencarian
- **Kegunaan**: Backup data, laporan, analisis

### Statistik Dashboard:
- **Real-time Count**: Jumlah user per kategori
- **Visual**: Kartu statistik yang mudah dibaca
- **Update Otomatis**: Data selalu up-to-date

---

**⚡ Tips Cepat:**
- Gunakan Ctrl+F untuk pencarian cepat di halaman
- Bookmark halaman User Management untuk akses cepat
- Gunakan fitur export untuk backup data berkala
- Selalu konfirmasi dengan user setelah reset password

---

**© 2025 SIAKAD Al-Wafi - Fitur Reset Password Admin**

*Panduan ini dapat berubah sesuai update sistem. Selalu gunakan fitur ini dengan bijak dan sesuai kebijakan institusi.*
