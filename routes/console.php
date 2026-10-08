<?php

use App\Services\AdminDashboardStats;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Panaskan cache statistik dashboard admin tiap 10 menit agar pengunjung
// tidak pernah kena hitungan cold (compile ~44 query ke DB remote).
Schedule::call(fn () => AdminDashboardStats::refresh())->everyTenMinutes();
