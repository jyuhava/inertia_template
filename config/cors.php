<?php

/**
 * Konfigurasi CORS.
 *
 * Integrator PDDikti dijalankan pada subdomain terpisah (mis.
 * feeder.alwafi.ac.id) sementara API-nya dilayani domain utama SIAKAD
 * (siakad.alwafi.ac.id). Karena memakai Sanctum SPA auth berbasis session
 * cookie, header CORS WAJIB:
 *   - mengizinkan origin secara spesifik (bukan "*"), dan
 *   - mengaktifkan credentials,
 * karena kombinasi "*" + credentials ditolak browser.
 *
 * Daftar origin diambil dari SIAKAD_CORS_ORIGINS (pisahkan dengan koma).
 */

$origins = array_values(array_filter(array_map(
    'trim',
    explode(',', (string) env('SIAKAD_CORS_ORIGINS', ''))
)));

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => $origins,

    'allowed_origins_patterns' => [],

    /*
    | Daftar ini harus memuat SETIAP header kustom yang dikirim frontend
    | integrator. Header yang tidak terdaftar di sini tidak akan pernah
    | sampai ke backend: browser memblokirnya pada tahap preflight dengan
    | "Request header field X is not allowed by Access-Control-Allow-Headers".
    |
    | Saat ini frontend mengirim:
    |   X-Requested-With   -> penanda request AJAX
    |   X-Integrator-Client -> penanda klien integrator
    |   X-CSRF-TOKEN       -> token CSRF pada request yang mengubah data
    | dan bawaan browser: Accept, Content-Type, Origin.
    */
    'allowed_headers' => [
        'Accept',
        'Authorization',
        'Content-Type',
        'Origin',
        'X-CSRF-TOKEN',
        'X-Integrator-Client',
        'X-Requested-With',
        'X-XSRF-TOKEN',
    ],

    'exposed_headers' => [],

    'max_age' => 3600,

    // Wajib true agar cookie sesi Sanctum ikut terkirim lintas domain.
    'supports_credentials' => true,

];
