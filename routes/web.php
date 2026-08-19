<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Admin routes
Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\Admin\DashboardController::class, 'index'])->name('dashboard');
    
    // Mahasiswa CRUD routes
    Route::resource('mahasiswa', \App\Http\Controllers\Admin\MahasiswaController::class);
    Route::get('mahasiswa-export', [\App\Http\Controllers\Admin\MahasiswaController::class, 'export'])->name('mahasiswa.export');
    Route::put('mahasiswa/{mahasiswa}/reset-password', [\App\Http\Controllers\Admin\MahasiswaController::class, 'resetPassword'])->name('mahasiswa.reset-password');
    
    // Bulk Import Mahasiswa routes
    Route::prefix('bulk-mahasiswa')->name('bulk-mahasiswa.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\BulkMahasiswaController::class, 'index'])->name('index');
        Route::post('/import', [\App\Http\Controllers\Admin\BulkMahasiswaController::class, 'import'])->name('import');
        Route::get('/template', [\App\Http\Controllers\Admin\BulkMahasiswaController::class, 'downloadTemplate'])->name('template');
    });
    
    // Prodi CRUD routes
    Route::resource('prodi', \App\Http\Controllers\Admin\ProdiController::class);
    
    // Dosen CRUD routes
    Route::resource('dosen', \App\Http\Controllers\Admin\DosenController::class);
    Route::put('dosen/{dosen}/reset-password', [\App\Http\Controllers\Admin\DosenController::class, 'resetPassword'])->name('dosen.reset-password');
    
    // Tahun Ajaran CRUD routes
    Route::resource('tahun-ajaran', \App\Http\Controllers\Admin\TahunAjaranController::class);
    
    // Semester CRUD routes
    Route::resource('semester', \App\Http\Controllers\Admin\SemesterController::class);
    
    // Mata Kuliah CRUD routes
    Route::resource('mata-kuliah', \App\Http\Controllers\Admin\MataKuliahController::class);
    
    // Jadwal Kuliah CRUD routes
    Route::resource('jadwal-kuliah', \App\Http\Controllers\Admin\JadwalKuliahController::class);
    
    // Periode KRS CRUD routes
    Route::resource('periode-krs', \App\Http\Controllers\Admin\PeriodeKrsController::class);
    Route::post('periode-krs/{periodeKrs}/activate', [\App\Http\Controllers\Admin\PeriodeKrsController::class, 'activate'])->name('periode-krs.activate');
    Route::post('periode-krs/{periodeKrs}/deactivate', [\App\Http\Controllers\Admin\PeriodeKrsController::class, 'deactivate'])->name('periode-krs.deactivate');
    
    // KHS Student List (for Sidebar)
    Route::get('/khs', [\App\Http\Controllers\Admin\KhsController::class, 'studentList'])->name('khs.student-list');

    // KHS Admin Routes
    Route::prefix('mahasiswa/{mahasiswa}/khs')->name('mahasiswa.khs.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\KhsController::class, 'index'])->name('index');
        Route::get('/{periodeKrs}', [\App\Http\Controllers\Admin\KhsController::class, 'show'])->name('show');
        Route::get('/{periodeKrs}/print', [\App\Http\Controllers\Admin\KhsController::class, 'print'])->name('print');
    });

    // LMS Admin Routes
    Route::prefix('lms-courses')->name('lms-courses.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\LmsCourseController::class, 'index'])->name('index');
        Route::get('/{lmsCourse}', [\App\Http\Controllers\Admin\LmsCourseController::class, 'show'])->name('show');
    });

    // KRS Management routes
    Route::prefix('krs')->name('krs.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\KrsController::class, 'index'])->name('index');
        Route::get('/mahasiswa/{mahasiswa}', [\App\Http\Controllers\Admin\KrsController::class, 'show'])->name('show');
        Route::patch('/{krs}/approve', [\App\Http\Controllers\Admin\KrsController::class, 'approve'])->name('approve');
        Route::patch('/{krs}/reject', [\App\Http\Controllers\Admin\KrsController::class, 'reject'])->name('reject');
        Route::post('/bulk-approve', [\App\Http\Controllers\Admin\KrsController::class, 'bulkApprove'])->name('bulk-approve');
        Route::post('/bulk-reject', [\App\Http\Controllers\Admin\KrsController::class, 'bulkReject'])->name('bulk-reject');
    });
    
    // User Management routes
    Route::prefix('user-management')->name('user-management.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\UserManagementController::class, 'index'])->name('index');
        Route::get('/{user}/reset-password', [\App\Http\Controllers\Admin\UserManagementController::class, 'showResetPasswordForm'])->name('reset-password.form');
        Route::put('/{user}/reset-password', [\App\Http\Controllers\Admin\UserManagementController::class, 'resetPassword'])->name('reset-password');
        Route::post('/bulk-reset-password', [\App\Http\Controllers\Admin\UserManagementController::class, 'bulkResetPassword'])->name('bulk-reset-password');
        Route::put('/{user}/generate-password', [\App\Http\Controllers\Admin\UserManagementController::class, 'generateRandomPassword'])->name('generate-password');
        Route::put('/{user}/toggle-status', [\App\Http\Controllers\Admin\UserManagementController::class, 'toggleStatus'])->name('toggle-status');
        Route::get('/export', [\App\Http\Controllers\Admin\UserManagementController::class, 'export'])->name('export');
    });

    // PMB Management routes
    Route::resource('periode-pmb', \App\Http\Controllers\Admin\PeriodePmbController::class);
    Route::post('periode-pmb/{periodePmb}/activate', [\App\Http\Controllers\Admin\PeriodePmbController::class, 'activate'])->name('periode-pmb.activate');
    Route::post('periode-pmb/{periodePmb}/deactivate', [\App\Http\Controllers\Admin\PeriodePmbController::class, 'deactivate'])->name('periode-pmb.deactivate');
    
    Route::resource('dokumen-pmb', \App\Http\Controllers\Admin\DokumenPmbController::class);
    Route::post('dokumen-pmb/{dokumenPmb}/toggle-status', [\App\Http\Controllers\Admin\DokumenPmbController::class, 'toggleStatus'])->name('dokumen-pmb.toggle-status');
    
    Route::prefix('calon-mahasiswa')->name('calon-mahasiswa.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\CalonMahasiswaController::class, 'index'])->name('index');
        Route::get('/dokumen/{uploadId}/download', [\App\Http\Controllers\Admin\CalonMahasiswaController::class, 'downloadDokumen'])->name('download-dokumen');
        Route::get('/{calonMahasiswa}', [\App\Http\Controllers\Admin\CalonMahasiswaController::class, 'show'])->name('show');
        Route::put('/{calonMahasiswa}/status', [\App\Http\Controllers\Admin\CalonMahasiswaController::class, 'updateStatus'])->name('update-status');
        Route::post('/{calonMahasiswa}/convert', [\App\Http\Controllers\Admin\CalonMahasiswaController::class, 'convertToMahasiswa'])->name('convert');
        Route::post('/bulk-update-status', [\App\Http\Controllers\Admin\CalonMahasiswaController::class, 'bulkUpdateStatus'])->name('bulk-update-status');
        Route::get('/export/csv', [\App\Http\Controllers\Admin\CalonMahasiswaController::class, 'export'])->name('export');
    });
});

// Mahasiswa routes
Route::middleware(['auth', 'verified', 'role:mahasiswa'])->prefix('mahasiswa')->name('mahasiswa.')->group(function () {
    // Surat Komitmen routes (tidak perlu middleware komitmen)
    Route::prefix('surat-komitmen')->name('surat-komitmen.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Mahasiswa\SuratKomitmenController::class, 'index'])->name('index');
        Route::get('/download', [\App\Http\Controllers\Mahasiswa\SuratKomitmenController::class, 'download'])->name('download');
        Route::post('/upload', [\App\Http\Controllers\Mahasiswa\SuratKomitmenController::class, 'upload'])->name('upload');
        Route::delete('/delete', [\App\Http\Controllers\Mahasiswa\SuratKomitmenController::class, 'delete'])->name('delete');
    });

    // Routes yang memerlukan surat komitmen
    Route::middleware([\App\Http\Middleware\CheckSuratKomitmen::class])->group(function () {        
        Route::get('/dashboard', [\App\Http\Controllers\Mahasiswa\DashboardController::class, 'index'])->name('dashboard');
        
        // KRS routes
        Route::get('/krs', [\App\Http\Controllers\KrsController::class, 'index'])->name('krs.index');
        Route::post('/krs', [\App\Http\Controllers\KrsController::class, 'store'])->name('krs.store');
        Route::delete('/krs/{krs}', [\App\Http\Controllers\KrsController::class, 'destroy'])->name('krs.destroy');
        Route::get('/krs/print', [\App\Http\Controllers\KrsController::class, 'print'])->name('krs.print');
        
        // KHS routes
        Route::get('/khs', [\App\Http\Controllers\Mahasiswa\KhsController::class, 'index'])->name('khs.index');
        Route::get('/khs/{periodeKrs}', [\App\Http\Controllers\Mahasiswa\KhsController::class, 'show'])->name('khs.show');
        Route::get('/khs/{periodeKrs}/cetak', [\App\Http\Controllers\Mahasiswa\KhsController::class, 'cetakKhs'])->name('khs.cetak');
        
        // Absensi routes
        Route::get('/absensi', [\App\Http\Controllers\Mahasiswa\AbsensiController::class, 'index'])->name('absensi.index');
        Route::get('/absensi/{jadwalKuliah}', [\App\Http\Controllers\Mahasiswa\AbsensiController::class, 'show'])->name('absensi.show');
        
        // LMS Routes
        Route::prefix('lms')->name('lms.')->group(function () {
             Route::get('/', [\App\Http\Controllers\Mahasiswa\LmsStudentController::class, 'index'])->name('index');
             Route::get('/{lmsCourse}', [\App\Http\Controllers\Mahasiswa\LmsStudentController::class, 'show'])->name('show');
             Route::get('/materials/{material}', [\App\Http\Controllers\Mahasiswa\LmsStudentController::class, 'showMaterial'])->name('materials.show');
             Route::post('/materials/{material}/toggle', [\App\Http\Controllers\Mahasiswa\LmsStudentController::class, 'toggleProgress'])->name('materials.toggle');
             Route::post('/materials/{material}/assistant', [\App\Http\Controllers\Mahasiswa\LmsStudentController::class, 'askMaterialAssistant'])->name('materials.assistant');
             Route::post('/assignments/{assignment}/submit', [\App\Http\Controllers\Mahasiswa\LmsStudentController::class, 'submitAssignment'])->name('assignments.submit');
             Route::get('/forums/{forum}', [\App\Http\Controllers\Mahasiswa\LmsStudentController::class, 'showForum'])->name('forums.show');
             Route::get('/forum-threads/{thread}', [\App\Http\Controllers\Mahasiswa\LmsStudentController::class, 'showForumThread'])->name('forums.threads.show');
             Route::post('/forum-threads/{thread}/replies', [\App\Http\Controllers\Mahasiswa\LmsStudentController::class, 'storeForumReply'])->name('forums.replies.store');
        });
    });
});

// Dosen routes
Route::middleware(['auth', 'verified', 'role:dosen'])->prefix('dosen')->name('dosen.')->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\Dosen\DosenController::class, 'dashboard'])->name('dashboard');
    Route::get('/jadwal', [\App\Http\Controllers\Dosen\DosenController::class, 'jadwal'])->name('jadwal');
    Route::get('/mahasiswa/{jadwalKuliah}', [\App\Http\Controllers\Dosen\DosenController::class, 'mahasiswa'])->name('mahasiswa');
    Route::get('/penilaian/{jadwalKuliah}', [\App\Http\Controllers\Dosen\DosenController::class, 'penilaian'])->name('penilaian');
    Route::put('/penilaian/{penilaian}', [\App\Http\Controllers\Dosen\DosenController::class, 'updatePenilaian'])->name('penilaian.update');
    Route::post('/penilaian/{jadwalKuliah}/finalisasi', [\App\Http\Controllers\Dosen\DosenController::class, 'finalisasiNilai'])->name('penilaian.finalisasi');
    
    // Absensi routes
    Route::get('/absensi/{jadwalKuliah}', [\App\Http\Controllers\Dosen\AbsensiController::class, 'index'])->name('absensi.index');
    Route::post('/absensi/{jadwalKuliah}/pertemuan', [\App\Http\Controllers\Dosen\AbsensiController::class, 'createPertemuan'])->name('absensi.pertemuan.create');
    Route::put('/absensi/{jadwalKuliah}/update', [\App\Http\Controllers\Dosen\AbsensiController::class, 'updateAbsensi'])->name('absensi.update');
    Route::delete('/absensi/{jadwalKuliah}/pertemuan', [\App\Http\Controllers\Dosen\AbsensiController::class, 'deletePertemuan'])->name('absensi.pertemuan.delete');
    Route::get('/absensi/{jadwalKuliah}/rekap', [\App\Http\Controllers\Dosen\AbsensiController::class, 'rekap'])->name('absensi.rekap');
    
    // LMS Login route for dosen
    Route::get('/lms-login', [\App\Http\Controllers\LmsLoginController::class, 'redirectToLms'])->name('lms.login');

    // LMS Dosen Routes
    Route::prefix('lms')->name('lms.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Dosen\LmsCourseController::class, 'index'])->name('index');
        Route::post('/', [\App\Http\Controllers\Dosen\LmsCourseController::class, 'store'])->name('store');
        Route::get('/{lmsCourse}', [\App\Http\Controllers\Dosen\LmsCourseController::class, 'show'])->name('show');

        // Content
        Route::post('/{lmsCourse}/chapters', [\App\Http\Controllers\Dosen\LmsContentController::class, 'storeChapter'])->name('chapters.store');
        Route::put('/chapters/{chapter}', [\App\Http\Controllers\Dosen\LmsContentController::class, 'updateChapter'])->name('chapters.update');
        Route::delete('/chapters/{chapter}', [\App\Http\Controllers\Dosen\LmsContentController::class, 'deleteChapter'])->name('chapters.delete');
        Route::post('/chapters/{chapter}/forums', [\App\Http\Controllers\Dosen\LmsContentController::class, 'storeForum'])->name('forums.store');
        Route::put('/forums/{forum}', [\App\Http\Controllers\Dosen\LmsContentController::class, 'updateForum'])->name('forums.update');
        Route::delete('/forums/{forum}', [\App\Http\Controllers\Dosen\LmsContentController::class, 'deleteForum'])->name('forums.delete');
        Route::get('/forums/{forum}', [\App\Http\Controllers\Dosen\LmsContentController::class, 'showForum'])->name('forums.show');
        Route::post('/forums/{forum}/threads', [\App\Http\Controllers\Dosen\LmsContentController::class, 'storeForumThread'])->name('forums.threads.store');
        Route::get('/forum-threads/{thread}', [\App\Http\Controllers\Dosen\LmsContentController::class, 'showForumThread'])->name('forums.threads.show');
        Route::put('/forum-threads/{thread}', [\App\Http\Controllers\Dosen\LmsContentController::class, 'updateForumThread'])->name('forums.threads.update');
        Route::delete('/forum-threads/{thread}', [\App\Http\Controllers\Dosen\LmsContentController::class, 'deleteForumThread'])->name('forums.threads.delete');
        Route::post('/forum-threads/{thread}/replies', [\App\Http\Controllers\Dosen\LmsContentController::class, 'storeForumReply'])->name('forums.replies.store');
        Route::put('/forum-replies/{reply}', [\App\Http\Controllers\Dosen\LmsContentController::class, 'updateForumReply'])->name('forums.replies.update');
        Route::delete('/forum-replies/{reply}', [\App\Http\Controllers\Dosen\LmsContentController::class, 'deleteForumReply'])->name('forums.replies.delete');

        Route::get('/chapters/{chapter}/materials/create', [\App\Http\Controllers\Dosen\LmsContentController::class, 'createMaterial'])->name('materials.create');
        Route::post('/chapters/{chapter}/materials', [\App\Http\Controllers\Dosen\LmsContentController::class, 'storeMaterial'])->name('materials.store');
        Route::post('/chapters/{chapter}/materials/generate', [\App\Http\Controllers\Dosen\LmsContentController::class, 'generateMaterialDraft'])->name('materials.generate');
        Route::get('/materials/{material}/view', [\App\Http\Controllers\Dosen\LmsContentController::class, 'showMaterial'])->name('materials.show');
        Route::get('/materials/{material}/edit', [\App\Http\Controllers\Dosen\LmsContentController::class, 'editMaterial'])->name('materials.edit');
        Route::put('/materials/{material}', [\App\Http\Controllers\Dosen\LmsContentController::class, 'updateMaterial'])->name('materials.update');
        Route::post('/materials/{material}/assistant', [\App\Http\Controllers\Dosen\LmsContentController::class, 'askMaterialAssistant'])->name('materials.assistant');
        Route::delete('/materials/{material}', [\App\Http\Controllers\Dosen\LmsContentController::class, 'deleteMaterial'])->name('materials.delete');

        Route::get('/chapters/{chapter}/assignments/create', [\App\Http\Controllers\Dosen\LmsContentController::class, 'createAssignment'])->name('assignments.create');
        Route::post('/chapters/{chapter}/assignments', [\App\Http\Controllers\Dosen\LmsContentController::class, 'storeAssignment'])->name('assignments.store');
        Route::get('/assignments/{assignment}/edit', [\App\Http\Controllers\Dosen\LmsContentController::class, 'editAssignment'])->name('assignments.edit');
        Route::get('/assignments/{assignment}/grading', [\App\Http\Controllers\Dosen\LmsContentController::class, 'gradingAssignment'])->name('assignments.grading');
        Route::put('/assignments/{assignment}', [\App\Http\Controllers\Dosen\LmsContentController::class, 'updateAssignment'])->name('assignments.update');
        Route::put('/submissions/{submission}/grading', [\App\Http\Controllers\Dosen\LmsContentController::class, 'updateSubmissionGrade'])->name('submissions.grade');
        Route::delete('/assignments/{assignment}', [\App\Http\Controllers\Dosen\LmsContentController::class, 'deleteAssignment'])->name('assignments.delete');
    });
});

// PMB Public routes
Route::prefix('pmb')->name('pmb.')->group(function () {
    Route::get('/', [\App\Http\Controllers\Pmb\PendaftaranController::class, 'index'])->name('index');
    Route::get('/daftar', [\App\Http\Controllers\Pmb\PendaftaranController::class, 'create'])->name('create');
    Route::post('/daftar', [\App\Http\Controllers\Pmb\PendaftaranController::class, 'store'])->name('store');
    Route::get('/cek-status', [\App\Http\Controllers\Pmb\PendaftaranController::class, 'showStatusForm'])->name('status.form');
    Route::post('/cek-status', [\App\Http\Controllers\Pmb\PendaftaranController::class, 'checkStatus'])->name('status.check');
});

// Calon Mahasiswa routes
Route::middleware(['auth', 'verified', 'role:calon_mahasiswa'])->prefix('calon-mahasiswa')->name('calon-mahasiswa.')->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\CalonMahasiswa\DashboardController::class, 'index'])->name('dashboard');
    Route::put('/profile', [\App\Http\Controllers\CalonMahasiswa\DashboardController::class, 'updateProfile'])->name('profile.update');
    Route::post('/dokumen/upload', [\App\Http\Controllers\CalonMahasiswa\DashboardController::class, 'uploadDokumen'])->name('dokumen.upload');
    Route::delete('/dokumen/{uploadDokumen}', [\App\Http\Controllers\CalonMahasiswa\DashboardController::class, 'deleteDokumen'])->name('dokumen.delete');
    Route::get('/dokumen/{uploadDokumen}/download', [\App\Http\Controllers\CalonMahasiswa\DashboardController::class, 'downloadDokumen'])->name('dokumen.download');
    Route::post('/submit', [\App\Http\Controllers\CalonMahasiswa\DashboardController::class, 'submit'])->name('submit');
});

// Default dashboard route (redirects based on role)
Route::get('/dashboard', function () {
    $user = auth()->user();
    
    if ($user->isAdmin()) {
        return redirect()->route('admin.dashboard');
    } elseif ($user->isMahasiswa()) {
        // Check if mahasiswa has uploaded surat komitmen
        $mahasiswa = $user->mahasiswa;
        if (!$mahasiswa || !$mahasiswa->hasUploadedKomitmen()) {
            return redirect()->route('mahasiswa.surat-komitmen.index')
                ->with('warning', 'Anda harus mengupload surat komitmen terlebih dahulu.');
        }
        return redirect()->route('mahasiswa.dashboard');
    } elseif ($user->isDosen()) {
        return redirect()->route('dosen.dashboard');
    } elseif ($user->isCalonMahasiswa()) {
        return redirect()->route('calon-mahasiswa.dashboard');
    }
    
    return redirect('/');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // CKEditor Image Upload
    Route::post('/upload/ckeditor', [\App\Http\Controllers\UploadController::class, 'ckeditorUpload'])->name('upload.ckeditor');
});

require __DIR__.'/auth.php';
