# MEMORY.md — Proyek SIAKAD STIT Al Wafi

## Stack
- Laravel + Inertia + **React 18 (JSX)** + Tailwind CSS 3 + Vite. **Bukan Vue** (file `.vue` sisa, tidak dipakai).
- Semua halaman (admin, dosen, mahasiswa) memakai `resources/js/Layouts/AdminLayout.jsx`.
- `window.route()` di `resources/js/app.jsx` adalah helper route manual; Ziggy juga tersedia via `@routes`.
- DB: SQLite (`database/database.sqlite`). Seeder memakai password default `password`.

## Konvensi desain (hasil redesain 2026-09-16)
- Tema berwarna per role untuk hero:
  - Mahasiswa: indigo → violet → fuchsia
  - Dosen: emerald → teal → cyan
  - Admin: slate → indigo
- Hero memakai `rounded-2xl` + `shadow-lg shadow-<warna>-500/20`, padding `p-4 sm:p-5` (compact).
- Tiap halaman mendefinisikan `Box` lokal; varian `black` = hero gradien. Jangan pakai `black` untuk elemen kecil.
- Varian `dark` dipertahankan gelap (dipakai untuk panel/kotak di latar terang, mis. "Preview Real-time").
- Tabel ≥5 kolom memakai `table-cards` + `data-label` per `<td>` → otomatis jadi daftar kartu di <768px.
- Halaman cetak (`*Cetak*`, `*Print*`) tidak boleh memakai `table-cards`.
- Gunakan `.pb-mobile-nav` untuk konten yang bisa tertutup bottom nav; `.safe-top`/`.safe-bottom` untuk notch.

## Aturan kerja
- **DILARANG** memakai perintah `git` apa pun (lihat memory user). Pulihkan dengan Edit/Write, bukan git.
- Backup dulu sebelum transformasi massal: `cp -R resources/js /tmp/siakad-backup/js-<timestamp>`.
- `npm run build` tidak bisa jalan di sandbox (Vite membaca `.env`). Verifikasi sintaks dengan esbuild per file.
- Pakai tool `Grep`, bukan `grep` Bash dengan alternasi `\|` (sering gagal di lingkungan ini).
