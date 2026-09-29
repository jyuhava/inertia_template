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

    'allowed_headers' => [
        'Accept',
        'Authorization',
        'Content-Type',
        'Origin',
        'X-CSRF-TOKEN',
        'X-Requested-With',
        'X-XSRF-TOKEN',
    ],

    'exposed_headers' => [],

    'max_age' => 3600,

    // Wajib true agar cookie sesi Sanctum ikut terkirim lintas domain.
    'supports_credentials' => true,

];
