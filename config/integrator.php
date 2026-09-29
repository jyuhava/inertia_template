<?php

/*
|--------------------------------------------------------------------------
| Konfigurasi Modul Integrator PDDikti / Neo Feeder
|--------------------------------------------------------------------------
|
| Kredensial Neo Feeder hanya dikelola backend (environment atau ciphertext
| terenkripsi dengan APP_KEY) dan tidak pernah dikirim kembali ke frontend.
| Frontend integrator hanya menerima profil koneksi tanpa password dan status.
|
| Cara kerja sumber nilai:
|   - Nilai env (NEOFEEDER_*) dipakai sebagai default.
|   - Operator boleh menyimpan override non-rahasia (base URL, username,
|     timeout, dsb.) lewat PUT /api/integrator/connection; override disimpan
|     pada tabel integrator_settings.
|   - Password operator yang dikirim ke endpoint disimpan terenkripsi dengan
|     APP_KEY; token hanya berada di cache terenkripsi dan tidak pernah
|     dikirim ke frontend atau ditulis ke log.
|
*/

return [

    'enabled' => env('INTEGRATOR_ENABLED', true),

    'neofeeder' => [
        // Contoh: https://feeder-pddikti.example.ac.id
        'base_url' => env('NEOFEEDER_BASE_URL'),
        // Path endpoint Web Service bila berbeda dari base_url.
        'web_service_url' => env('NEOFEEDER_WS_URL'),
        'username' => env('NEOFEEDER_USERNAME'),
        'password' => env('NEOFEEDER_PASSWORD'),
        'version' => env('NEOFEEDER_VERSION', '3.0'),
        'sandbox' => (bool) env('NEOFEEDER_SANDBOX', false),
        'timeout_seconds' => (int) env('NEOFEEDER_TIMEOUT', 30),
        'retry_count' => (int) env('NEOFEEDER_RETRY', 2),
        'retry_delay_ms' => (int) env('NEOFEEDER_RETRY_DELAY', 500),
        'proxy' => env('NEOFEEDER_PROXY'),
        'use_proxy' => (bool) env('NEOFEEDER_USE_PROXY', false),
        // Pengiriman perubahan dinonaktifkan sampai schema resmi diverifikasi.
        'allow_write' => (bool) env('INTEGRATOR_ALLOW_WRITE', false),
        // Explicit per-act allowlist, empty by default while payload mapping is being verified.
        'verified_write_acts' => array_values(array_filter(array_map('trim', explode(',', (string) env('INTEGRATOR_VERIFIED_WRITE_ACTS', ''))))),
        // Umur token Feeder sebelum dianggap perlu di-refresh (detik).
        'token_ttl' => (int) env('NEOFEEDER_TOKEN_TTL', 60 * 60 * 23),
    ],

    'sync' => [
        // Batas item per job (harus sama dengan appConfig.maxBulkItemsPerJob frontend).
        'max_items_per_job' => (int) env('INTEGRATOR_MAX_ITEMS_PER_JOB', 500),
        'max_attempts' => 5,
        // 'sync' = eksekusi dalam request (skeleton); ganti 'queue' + JOB untuk produksi.
        'mode' => env('INTEGRATOR_SYNC_MODE', 'sync'),
        'queue' => env('INTEGRATOR_SYNC_QUEUE', 'default'),
    ],

    /*
    | Data institusi — sumber entity "perguruan-tinggi" pada integrator.
    | PDDikti tidak menyediakan act Insert/Update profil PT, jadi data ini
    | hanya dibaca dan dipetakan (id_perguruan_tinggi = kode PT di PDDikti).
    */
    'institusi' => [
        'kode_pt' => env('INSTITUSI_KODE_PT'),
        'nama_pt' => env('INSTITUSI_NAMA_PT'),
        'singkatan' => env('INSTITUSI_SINGKATAN'),
        'alamat' => env('INSTITUSI_ALAMAT'),
        'telepon' => env('INSTITUSI_TELEPON'),
        'email' => env('INSTITUSI_EMAIL'),
        'website' => env('INSTITUSI_WEBSITE'),
        'npwp' => env('INSTITUSI_NPWP'),
        'akreditasi' => env('INSTITUSI_AKREDITASI'),
    ],

    /*
    | Peta lokal -> ID referensi PDDikti harus diisi hanya setelah operator
    | memverifikasi ID dari dictionary Neo Feeder yang terpasang. Tidak ada
    | ID agama/jenis daftar yang diasumsikan di source code. Referensi yang
    | belum dipetakan memblokir payload dan tampil sebagai skippedFields.
    */
    'reference_map' => [
        'agama' => [],
        'jenis-pendaftaran' => [],
        'jalur-masuk' => [],
        'pembiayaan' => [],
        'jenis-keluar' => [],
        'jenis-aktivitas-mahasiswa' => [],
        'kategori-kegiatan' => [],
        // PDDikti menggunakan kode L/P langsung, bukan ID referensi numeric.
        'jenis-kelamin' => ['L' => 'L', 'P' => 'P'],
    ],

    // Role SIAKAD yang boleh memakai modul integrator.
    'roles' => ['admin'],

    // Permission yang dikirim ke frontend pada GET /session.
    'permissions' => [
        'integrator.view',
        'integrator.mapping.manage',
        'integrator.sync.run',
        'integrator.connection.manage',
        'integrator.logs.view',
        'integrator.import.run',
    ],
];
