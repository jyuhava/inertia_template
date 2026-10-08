# Integrator PDDikti / Neo Feeder

Frontend **standalone** untuk mengintegrasikan SIAKAD dengan **PDDikti Neo Feeder**, dengan konsep dan alur kerja menyerupai ProFeeder — tetapi lebih transparan: setiap payload dapat diperiksa, setiap request tercatat, dan setiap kegagalan dapat ditelusuri.

Modul ini **tidak menggantikan** SIAKAD. SIAKAD tetap sumber data utama:

```
SIAKAD → Mapping → Validation → Transformation → Neo Feeder API → Response
   → simpan ID PDDikti → sync log
```

---

## 1. Ringkasan

| Aspek | Keterangan |
| --- | --- |
| Stack | Vue 3 + TypeScript + Vite + Vue Router + Pinia + Tailwind CSS + Axios |
| Struktur | Composition API, `<script setup>` |
| Lokasi | `/integrator` (terpisah dari frontend utama SIAKAD, tidak mengubah `resources/js`, `vite.config.js`, atau `package.json` SIAKAD) |
| Base path | `/integrator/` |
| Mode | **mock** (bawaan) atau **nyata** melalui API backend SIAKAD |

Fitur utama: koneksi & token Neo Feeder, referensi PDDikti, mapping center, data akademik per entitas, validation center, comparison engine, payload inspector, sync wizard, bulk synchronization, antrean job dengan progres, retry, log & audit, monitoring, import/export.

---

## 2. Instalasi

```bash
cd integrator
npm install
```

## 3. Menjalankan

```bash
npm run dev        # http://localhost:5174/integrator/
```

## 4. Build & pratinjau hasil build

```bash
npm run build      # hasil: integrator/dist
npm run preview    # http://localhost:4174/integrator/
npm run typecheck  # vue-tsc --noEmit
```

## 5. Deployment

Hasil build bersifat statis. Salin isi `dist/` ke sub-path `/integrator` pada web server SIAKAD, misalnya:

```nginx
location /integrator/ {
    alias /var/www/siakad/integrator/dist/;
    try_files $uri $uri/ /integrator/index.html;
}
```

Karena aplikasi memakai `history mode` (Vue Router) dengan base `/integrator/`, seluruh request pada sub-path tersebut harus dialihkan ke `index.html` (seperti contoh `try_files` di atas).

---

## 6. Konfigurasi environment

Salin `.env.example` menjadi `.env.local`:

```dotenv
VITE_APP_NAME="Integrator PDDikti"
VITE_SIAKAD_API_URL="https://sia.example.ac.id"
VITE_INTEGRATOR_API_PREFIX="/api/integrator"
VITE_MOCK_MODE="true"
VITE_MOCK_LATENCY_MS="320"
```

### Keamanan kredensial (penting)

- **Jangan pernah** menaruh `username`, `password`, atau `token` Neo Feeder pada environment frontend.
- Pada `.env.example` juga dicatat bahwa `VITE_NEOFEEDER_BASE_URL` tidak dipakai frontend — hanya dokumentasi operator.
- Frontend hanya menerima **status** koneksi, bukan kredensial.

---

## 7. Mock mode

Dengan `VITE_MOCK_MODE=true` (bawaan), seluruh endpoint dilayani **mock adapter** di dalam browser:

- tanpa backend, tanpa Neo Feeder, tanpa kredensial;
- data mock realistis (prodi TI/SI/MI/TK/IF, mata kuliah `TI101 Algoritma dan Pemrograman`, NIM pola `2021001001`, dosen dengan NIDN) — konsisten dengan seeder SIAKAD;
- simulasi kondisi nyata: sukses, gagal validasi, timeout, error server, konflik, belum dipetakan, data berubah, sudah sinkron;
- hasil simulasi **deterministik** (hash) sehingga tampilan stabil antar reload;
- latensi dapat diatur melalui `VITE_MOCK_LATENCY_MS`.

Matikan mock mode (`VITE_MOCK_MODE=false`) dan sediakan endpoint backend sesuai kontrak pada bagian 9 agar modul bekerja terhadap SIAKAD nyata.

---

## 8. Arsitektur

```
integrator/
├── index.html
├── package.json · vite.config.ts · tsconfig.json · tailwind.config.js · postcss.config.js
├── .env.example · README.md
└── src/
    ├── api/                 # kontrak HTTP (satu-satunya lapisan yang menyentuh axios)
    │   ├── http.ts          # instance axios + mock adapter + normalisasi error
    │   ├── siakad.ts        # endpoint /api/integrator/*
    │   ├── neofeeder.ts     # endpoint proxy /api/integrator/neofeeder/*
    │   └── mock/            # implementasi mock: dataset, state, simulator WS, handler, runner job
    ├── components/          # komponen generik (DataTable, FilterPanel, PayloadViewer, …)
    ├── composables/         # useEntityTable, useToast, useClipboard, useDebounce, useAsyncAction
    ├── config/              # registry entitas, field map, referensi, dependency, sync order, app config
    ├── layouts/             # AppLayout + Sidebar + TopBar + Breadcrumbs
    ├── router/              # definisi rute (termasuk rute per entitas)
    ├── services/            # logika domain: StatusEngine, Mapping, Validation, Compare, Sync, Dependency,
    │                        # Export, Import, Reference, Transform, NeoFeederClient, ActRegistry, SchemaAdapter
    ├── stores/              # Pinia: auth, ui, connection, period, reference, mapping, validation, sync, dashboard, logs
    ├── types/               # tipe SIAKAD, integrasi, mapping, referensi, Neofeeder, UI
    ├── utils/               # format, status, error, csv, download, json
    ├── validators/          # validator per domain (sivitas, akademik, perkuliahan, hasil)
    └── views/               # Dashboard, Connection, References, Mapping, Entities, Validation, Sync, Logs, Panduan
```

### Prinsip arsitektur

1. **Komponen tidak memanggil axios.** Alur wajib: `view/component → store → service → api`.
2. **Satu registry `act`.** Nama act Neo Feeder hanya ada di `services/neofeeder/ActRegistry.ts`.
3. **Satu engine status.** Perbandingan & penentuan status (`NEW/CHANGED/SYNCED/INVALID/CONFLICT`) memakai `services/StatusEngine.ts` — engine yang sama dipakai backend mock dan dry-run frontend.
4. **Satu adapter versi.** Perbedaan antar versi Neo Feeder ditangani `SchemaAdapter` (mis. `handphone` wajib sejak 3.0; `nomor_ijazah` sejak 3.1).
5. **Abstraksi API.** `SIAKAD API` (sumber data) dan `Neo Feeder API` (target) terpisah; mapping/validation/sync service berada di antaranya.

### Alur data internal

```
SIAKAD data → fetch → normalize → mapping → compare → validation
   → determine action (NEW/CHANGED/SYNCED/INVALID/CONFLICT)
   → generate payload → preview → konfirmasi operator → kirim ke Neo Feeder
   → normalize response → simpan ID PDDikti → simpan log → perbarui UI
```

---

## 9. Kontrak API backend SIAKAD

Modul ini mengasumsikan backend SIAKAD menyediakan endpoint berikut (prefix `VITE_INTEGRATOR_API_PREFIX`). Seluruh endpoint memakai sesi SIAKAD (`auth` + `role:admin`).

| Metode | Endpoint | Fungsi |
| --- | --- | --- |
| GET | `/session` | Sesi operator (id, name, email, role, permissions, mockMode) |
| GET | `/dashboard/summary` | Ringkasan status per entitas |
| GET/PUT | `/connection` | Profil koneksi (tanpa kredensial) |
| POST | `/connection/test` \| `/authenticate` \| `/token/refresh` \| `/dictionary/sync` | Uji koneksi, autentikasi, refresh token, sinkronisasi dictionary |
| GET | `/references`, `/references/{key}` | Referensi PDDikti |
| GET | `/periods`, `/prodi-options` | Periode & program studi untuk filter global |
| GET | `/mapping`, `/mapping/{entity}` | Statistik & daftar pemetaan |
| POST | `/mapping/{entity}` \| `/bulk` \| `/unmap` \| `/auto` | Simpan, massal, lepas, cocokkan otomatis |
| GET | `/mapping/{entity}/candidates` | Kandidat pasangan PDDikti |
| GET | `/{entity}`, `/{entity}/{id}` | Daftar & detail data (termasuk status integrasi) |
| POST | `/{entity}/preview` \| `/validate` \| `/compare` | Pratinjau payload, validasi, perbandingan |
| GET | `/validation/summary`, `/validation/issues` | Validation Center |
| GET | `/sync/order` | Urutan sinkronisasi dependency-aware |
| GET/POST | `/sync/jobs` | Daftar & pembuatan job |
| GET | `/sync/jobs/{id}` | Status job (progres polling) |
| POST | `/sync/jobs/{id}/run` \| `/retry-failed` \| `/cancel` | Jalankan, retry, batalkan |
| GET | `/logs`, `/logs/{id}` | Audit trail |
| GET | `/monitoring` | Ringkasan monitoring |
| POST | `/import/preview` | Pratinjau import (tanpa sinkronisasi) |
| POST/GET | `/neofeeder/call`, `/neofeeder/token`, `/neofeeder/test`, `/neofeeder/dictionary` | Proxy Web Service; backend yang menambahkan token |

`{entity}`: `perguruan-tinggi`, `prodi`, `semester`, `dosen`, `mahasiswa`, `riwayat-pendidikan`, `kurikulum`, `mata-kuliah`, `mata-kuliah-kurikulum`, `kelas`, `dosen-pengajar`, `krs`, `nilai`, `aktivitas-mahasiswa`, `kelulusan`.

### Status backend Laravel

Skeleton backend kontrak `/api/integrator/*` kini tersedia pada repository Laravel:

- `routes/api.php` mendaftarkan seluruh endpoint `siakadApi` beserta transport `/neofeeder/*`.
- Controller berada di `app/Http/Controllers/Integrator`; domain services berada di `app/Services/Integrator`.
- API memakai sesi Sanctum (`auth:sanctum`) dan Gate `integrator-access` (default hanya role `admin`). Atur domain stateful Sanctum sesuai host deployment.
- Migrasi menambah tabel job/item, setting, event audit, dan kolom metadata mapping secara aditif.
- Jalankan `php artisan migrate`, kemudian `php artisan test tests/Feature/Integrator/IntegratorApiTest.php`.

**Penulisan ke Feeder dinonaktifkan secara default** (`INTEGRATOR_ALLOW_WRITE=false`). DRY RUN hanya memvalidasi/meninjau lalu menandai item dilewati; tidak ada request tulis dan tidak ada hitungan sukses palsu. Bila opsi write diaktifkan, backend tetap mensyaratkan act dan field record terverifikasi pada dictionary Neo Feeder yang tersimpan, serta act harus masuk allowlist eksplisit `INTEGRATOR_VERIFIED_WRITE_ACTS`. Aktifkan hanya setelah uji sandbox dan verifikasi skema versi Feeder yang benar-benar dipakai.

Password operator dikirim hanya melalui API backend terautentikasi dan disimpan terenkripsi dengan `APP_KEY`; password tidak dikembalikan ke browser. Token berada di cache backend terenkripsi. Payload/response yang dicatat disanitasi. Jangan pernah menambahkan rahasia dengan prefix `VITE_`.

Konfigurasi backend tersedia pada root `.env.example` (`NEOFEEDER_*`, `INTEGRATOR_*`, dan `INSTITUSI_*`). Mode mock frontend tetap default; gunakan `VITE_MOCK_MODE=false` setelah host, sesi Sanctum, database, dan migrasi backend disiapkan.

#### Batasan skeleton

- `aktivitas-mahasiswa` dan `kelulusan` belum memiliki sumber model SIAKAD pada registry backend; endpoint mengembalikan daftar kosong dengan catatan bahwa sumber belum tersedia.
- Referensi PDDikti hanya dibaca bila act terverifikasi pada dictionary. ID referensi yang belum dipetakan ditandai pada preview, bukan ditebak.
- Comparison berstatus `UNVERIFIED` bila belum ada snapshot remote yang dapat dibandingkan. Mapping bukan bukti bahwa data lokal dan remote sudah sama.
- Tidak ada route delete atau operasi hapus data PDDikti pada Integrator.

### Pemetaan ke struktur SIAKAD yang sudah ada

Backend membaca model dan tabel akademik SIAKAD sebagai sumber data; ia tidak mengubah baris akademik:

- `mahasiswas`, `dosens`, `prodis`, `semesters`, `mata_kuliahs`, `kurikulums`, `kelas_kuliahs`, `student_course_registration_items`, dan `penilaians` menjadi sumber baca.
- Mapping mahasiswa/dosen/akademik tetap memakai `pddikti_mahasiswa_mappings`, `pddikti_dosen_mappings`, dan `pddikti_akademik_mappings`.
- `integrator_sync_jobs`, `integrator_sync_job_items`, dan `integrator_audit_events` menyimpan eksekusi job dan audit operator.
- Service legacy `App\Services\Pddikti\*` tetap merupakan boundary terpisah; integrasi baru menggunakan adapter `NeoFeederClient` pada `app/Services/Integrator`.

---

## 10. Batasan Web Service Neo Feeder yang dihormati

Berdasarkan daftar act Web Service Neo Feeder yang terverifikasi (211 act pada dokumentasi Postman PDDikti Feeder / dictionary Neo Feeder):

| Entitas | Kapabilitas | Alasan |
| --- | --- | --- |
| Perguruan tinggi, Prodi, Semester | baca + petakan | tidak ada act Insert/Update; dibuat melalui PDDikti admin |
| Dosen | baca + petakan | **tidak ada** `InsertBiodataDosen`/`UpdateBiodataDosen` |
| Penugasan dosen | kirim + update | `InsertDosenPengajarKelasKuliah` |
| Mahasiswa | kirim + update | `InsertBiodataMahasiswa` / `UpdateBiodataMahasiswa` |
| Riwayat pendidikan | kirim + update | `Insert/UpdateRiwayatPendidikanMahasiswa` |
| Kurikulum, Mata kuliah, Matkul kurikulum | kirim + update | `Insert/Update*` terkait |
| Kelas kuliah | kirim + update | `Insert/UpdateKelasKuliah` |
| KRS / peserta kelas | kirim | `InsertPesertaKelasKuliah` (tidak ada Update) |
| Nilai | **update saja** | tidak ada `InsertNilaiPerkuliahanKelas`; nilai lahir dari peserta kelas |
| Aktivitas mahasiswa | kirim + update | `Insert/UpdateAktivitasMahasiswa` (+ anggota) |
| Kelulusan | kirim + update | `Insert/UpdateMahasiswaLulusDO` |

Operasi **hapus tidak diekspos** pada antarmuka operator (kebijakan *never delete*).

---

## 11. Arti status

| Status | Arti | Tindakan |
| --- | --- | --- |
| `UNMAPPED` | belum punya pasangan ID PDDikti | petakan |
| `MAPPED` | sudah punya ID, belum pernah dikirim | kirim bila berubah |
| `NEW` | belum ada di PDDikti | Insert |
| `CHANGED` | ada di PDDikti, ada field berbeda | Update |
| `SYNCED` | identik | tidak ada tindakan |
| `INVALID` | gagal validasi | perbaiki data SIAKAD |
| `CONFLICT` | field identitas berbeda | putuskan manual |
| `FAILED` | pengiriman gagal | retry bila teknis |
| `SYNCING` | sedang dikirim | tunggu |

Perbedaan **tidak pernah** ditimpa otomatis. Field identitas (NIM, NIDN, kode MK, dll) selalu masuk kategori konflik untuk diputuskan operator.

---

## 12. Urutan sinkronisasi

```
1 Perguruan Tinggi → 2 Prodi → 3 Semester → 4 Dosen → 5 Mahasiswa
→ 6 Riwayat Pendidikan → 7 Kurikulum → 8 Mata Kuliah → 9 Matkul Kurikulum
→ 10 Kelas Kuliah → 11 Penugasan Dosen → 12 KRS/Anggota → 13 Nilai
→ 14 Aktivitas Mahasiswa → 15 Kelulusan
```

Bila entitas induk belum dipetakan atau gagal, entitas turunannya **diblokir** dengan pesan seperti:

> "Data tidak dapat dikirim karena Mata Kuliah belum memiliki ID PDDIKTI."

---

## 13. Perintah CLI singkat

```bash
npm run dev         # pengembangan
npm run typecheck   # pemeriksaan tipe (vue-tsc)
npm run build       # build produksi
npm run preview     # pratinjau build
```

---

## 14. Menambah entitas baru

1. Tambahkan kunci pada `types/integration.ts` (`EntityKey`).
2. Definisikan entitas pada `config/entities.ts` (kolom, filter, kartu statistik, act, kapabilitas).
3. Tambahkan baris `fieldMaps` pada `config/fieldMaps.ts` (perbandingan field).
4. Tambahkan dependency pada `config/dependencies.ts` dan urutan pada `config/syncOrder.ts`.
5. Tambahkan validator pada `validators/` dan daftarkan di `validators/index.ts`.
6. Tambahkan act pada `services/neofeeder/ActRegistry.ts` (nama act diambil dari dictionary Neo Feeder — jangan dikarang).

---

## 15. Menyesuaikan versi Neo Feeder

Semua perbedaan antar versi berada di `services/neofeeder/SchemaAdapter.ts`:

- `minimumVersionByAct` — act yang baru tersedia sejak versi tertentu;
- `fieldOverrides` — penyesuaian nama field;
- `requiredFields` — field yang menjadi wajib pada versi tertentu.

Jalankan **Sinkronkan Dictionary** pada halaman Koneksi untuk memverifikasi nama field terhadap versi yang terpasang. Selama dictionary belum tersinkron, field dari act dengan schema dasar ditandai **"belum diverifikasi"** pada Payload Inspector.

---

## 16. Keamanan

- Password/token Neo Feeder hanya dikelola backend; frontend menampilkan status saja.
- Token tidak pernah ditulis ke `localStorage`, `console.log`, payload, atau berkas ekspor — selalu disensor menjadi `[HIDDEN]`.
- `localStorage` hanya menyimpan preferensi non-sensitif (sidebar, page size, periode terakhir).
- Seluruh request yang membutuhkan secret dikirim melalui backend (`/neofeeder/*`).
- Operasi hapus ke PDDikti tidak tersedia.
- Pesan kesalahan ditampilkan dalam bahasa manusiawi; detail teknis hanya tersedia pada bagian yang dapat dibuka.

---

## 17. Troubleshooting

| Gejala | Penyebab umum | Penanganan |
| --- | --- | --- |
| "Sesi operator tidak tersedia" | endpoint `/session` belum ada / sesi SIAKAD habis | login ulang pada SIAKAD, implementasikan `/session` |
| "Neo Feeder tidak dapat dihubungi" | web service mati / jaringan / URL salah | periksa URL pada halaman Koneksi, jalankan Uji Koneksi |
| "Token tidak valid" | token kedaluwarsa | Autentikasi / Refresh Token |
| Data tampil "belum diverifikasi" | dictionary act belum disinkronkan | Sinkronkan Dictionary |
| Sinkronisasi diblokir | dependency belum dipetakan | selesaikan Mapping Center |
| Retry tidak berpengaruh | kegagalan validasi (bukan teknis) | perbaiki data SIAKAD |
| Tabel kosong | mock mode mati & endpoint belum tersedia | aktifkan `VITE_MOCK_MODE=true` atau implementasikan endpoint |

---

## 18. Lisensi & kepemilikan

Modul ini merupakan bagian dari proyek SIAKAD. Data akademik yang diproses bersifat rahasia: jangan mengekspor data mahasiswa/dosen ke sistem di luar kewenangan pelaporan PDDikti.
