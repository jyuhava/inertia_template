<?php

namespace App\Console\Commands;

use App\Models\MataKuliah;
use App\Models\JadwalKuliah;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DeleteAllMataKuliah extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mata-kuliah:delete-all {--force : Force delete without confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete all mata kuliah from database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Count existing data
        $mataKuliahCount = MataKuliah::count();
        $jadwalCount = JadwalKuliah::count();

        if ($mataKuliahCount === 0) {
            $this->info('Tidak ada mata kuliah yang ditemukan.');
            return;
        }

        $this->info("Ditemukan {$mataKuliahCount} mata kuliah dan {$jadwalCount} jadwal kuliah.");

        // Ask for confirmation unless --force is used
        if (!$this->option('force')) {
            if (!$this->confirm('Apakah Anda yakin ingin menghapus SEMUA mata kuliah? Ini akan menghapus semua jadwal kuliah terkait juga!')) {
                $this->info('Operasi dibatalkan.');
                return;
            }
        }

        try {
            DB::beginTransaction();

            // Delete jadwal kuliah first (because of foreign key constraint)
            if ($jadwalCount > 0) {
                JadwalKuliah::truncate();
                $this->info("✓ Berhasil menghapus {$jadwalCount} jadwal kuliah.");
            }

            // Delete mata kuliah
            MataKuliah::truncate();
            $this->info("✓ Berhasil menghapus {$mataKuliahCount} mata kuliah.");

            DB::commit();

            $this->info('');
            $this->info('🎉 Semua mata kuliah berhasil dihapus!');
            $this->warn('⚠️  Jangan lupa untuk menjalankan seeder jika diperlukan:');
            $this->line('   php artisan db:seed --class=MataKuliahSeeder');

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("❌ Terjadi kesalahan: {$e->getMessage()}");
            return 1;
        }

        return 0;
    }
}
