<?php

use App\Http\Controllers\Integrator\ConnectionController;
use App\Http\Controllers\Integrator\DashboardController;
use App\Http\Controllers\Integrator\EntityController;
use App\Http\Controllers\Integrator\ImportController;
use App\Http\Controllers\Integrator\LogController;
use App\Http\Controllers\Integrator\MappingController;
use App\Http\Controllers\Integrator\MonitoringController;
use App\Http\Controllers\Integrator\NeoFeederController;
use App\Http\Controllers\Integrator\PeriodController;
use App\Http\Controllers\Integrator\ReferenceController;
use App\Http\Controllers\Integrator\SessionController;
use App\Http\Controllers\Integrator\SyncController;
use App\Http\Controllers\Integrator\ValidationController;
use App\Services\Integrator\IntegratorEntityRegistry;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Modul Integrator PDDikti / Neo Feeder
|--------------------------------------------------------------------------
|
| Kontrak endpoint ini mengikuti integrator/src/api/siakad.ts pada folder
| frontend integrator (branch pddikti). Semua response memakai kunci
| camelCase sesuai tipe TypeScript di integrator/src/types/*.
|
| Auth: Sanctum SPA (session cookie). Frontend integrator dipasang pada
| sub-path /integrator di domain yang sama dengan SIAKAD, sehingga cukup
| SANCTUM_STATEFUL_DOMAINS berisi domain SIAKAD.
|
*/

Route::prefix('integrator')
    ->middleware(['auth:sanctum', 'can:integrator-access'])
    ->group(function (): void {

        // ------------------------------------------------------------------
        // Sesi, dashboard, periode, referensi
        // ------------------------------------------------------------------
        Route::get('session', [SessionController::class, 'show'])->name('integrator.session');
        Route::get('dashboard/summary', [DashboardController::class, 'summary'])->name('integrator.dashboard');
        Route::get('periods', [PeriodController::class, 'periods'])->name('integrator.periods');
        Route::get('prodi-options', [PeriodController::class, 'prodiOptions'])->name('integrator.prodi-options');

        Route::get('references', [ReferenceController::class, 'summary'])->name('integrator.references.summary');
        Route::get('references/{key}', [ReferenceController::class, 'list'])->name('integrator.references.list');

        // ------------------------------------------------------------------
        // Koneksi Neo Feeder
        // ------------------------------------------------------------------
        Route::get('connection', [ConnectionController::class, 'show'])->name('integrator.connection.show');
        Route::put('connection', [ConnectionController::class, 'save'])->name('integrator.connection.save');
        Route::post('connection/test', [ConnectionController::class, 'test'])->name('integrator.connection.test');
        Route::post('connection/authenticate', [ConnectionController::class, 'authenticate'])->name('integrator.connection.authenticate');
        Route::post('connection/token/refresh', [ConnectionController::class, 'refreshToken'])->name('integrator.connection.token-refresh');
        Route::post('connection/dictionary/sync', [ConnectionController::class, 'syncDictionary'])->name('integrator.connection.dictionary');

        // Generic Feeder transport: secrets are added by the backend, never by the browser.
        Route::post('neofeeder/token', [NeoFeederController::class, 'token'])->name('integrator.neofeeder.token');
        Route::post('neofeeder/test', [NeoFeederController::class, 'test'])->name('integrator.neofeeder.test');
        Route::post('neofeeder/call', [NeoFeederController::class, 'call'])->name('integrator.neofeeder.call');
        Route::get('neofeeder/dictionary', [NeoFeederController::class, 'dictionary'])->name('integrator.neofeeder.dictionary');

        // ------------------------------------------------------------------
        // Mapping SIAKAD <-> PDDikti
        // ------------------------------------------------------------------
        Route::get('mapping', [MappingController::class, 'summary'])->name('integrator.mapping.summary');
        Route::get('mapping/{entity}', [MappingController::class, 'list'])->name('integrator.mapping.list');
        Route::post('mapping/{entity}', [MappingController::class, 'save'])->name('integrator.mapping.save');
        Route::post('mapping/{entity}/bulk', [MappingController::class, 'bulk'])->name('integrator.mapping.bulk');
        Route::post('mapping/{entity}/unmap', [MappingController::class, 'unmap'])->name('integrator.mapping.unmap');
        Route::post('mapping/{entity}/auto', [MappingController::class, 'auto'])->name('integrator.mapping.auto');
        Route::get('mapping/{entity}/candidates', [MappingController::class, 'candidates'])->name('integrator.mapping.candidates');

        // ------------------------------------------------------------------
        // Validasi, sinkronisasi, log, monitoring, impor
        // ------------------------------------------------------------------
        Route::get('validation/summary', [ValidationController::class, 'summary'])->name('integrator.validation.summary');
        Route::get('validation/issues', [ValidationController::class, 'issues'])->name('integrator.validation.issues');

        Route::get('sync/order', [SyncController::class, 'order'])->name('integrator.sync.order');
        Route::get('sync/jobs', [SyncController::class, 'index'])->name('integrator.sync.jobs');
        Route::post('sync/jobs', [SyncController::class, 'store'])->name('integrator.sync.jobs.store');
        Route::get('sync/jobs/{id}', [SyncController::class, 'show'])->name('integrator.sync.jobs.show');
        Route::post('sync/jobs/{id}/run', [SyncController::class, 'run'])->name('integrator.sync.jobs.run');
        Route::post('sync/jobs/{id}/retry-failed', [SyncController::class, 'retryFailed'])->name('integrator.sync.jobs.retry');
        Route::post('sync/jobs/{id}/cancel', [SyncController::class, 'cancel'])->name('integrator.sync.jobs.cancel');

        Route::get('logs', [LogController::class, 'index'])->name('integrator.logs.index');
        Route::get('logs/{id}', [LogController::class, 'show'])->name('integrator.logs.show');
        Route::get('monitoring', [MonitoringController::class, 'summary'])->name('integrator.monitoring');
        Route::post('import/preview', [ImportController::class, 'preview'])->name('integrator.import.preview');

        // ------------------------------------------------------------------
        // Entitas akademik (dinamis, diletakkan terakhir agar tidak menimpa
        // route spesifik di atas). Kunci entity dibatasi regex daftar resmi.
        // ------------------------------------------------------------------
        $entityPattern = implode('|', array_map(
            fn (string $key): string => preg_quote($key, '/'),
            array_keys(IntegratorEntityRegistry::definitions()),
        ));

        Route::get('{entity}', [EntityController::class, 'index'])
            ->where('entity', $entityPattern)->name('integrator.entities.index');
        Route::get('{entity}/{id}', [EntityController::class, 'show'])
            ->where('entity', $entityPattern)->whereNumber('id')->name('integrator.entities.show');
        Route::post('{entity}/preview', [EntityController::class, 'preview'])
            ->where('entity', $entityPattern)->name('integrator.entities.preview');
        Route::post('{entity}/validate', [EntityController::class, 'validate'])
            ->where('entity', $entityPattern)->name('integrator.entities.validate');
        Route::post('{entity}/compare', [EntityController::class, 'compare'])
            ->where('entity', $entityPattern)->name('integrator.entities.compare');
    });
