<?php

namespace App\Console\Commands;

use App\Models\PeriodeKrs;
use App\Models\Krs;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DeleteAllPeriodeKrs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'periode-krs:delete-all {--force : Force delete without confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete all periode KRS from database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Count existing data
        $periodeKrsCount = PeriodeKrs::count();
        $krsCount = Krs::count();

        if ($periodeKrsCount === 0) {
            $this->info('Tidak ada periode KRS yang ditemukan.');
            return;
        }

        $this->info("Ditemukan {$periodeKrsCount} periode KRS dan {$krsCount} data KRS mahasiswa.");

        // Ask for confirmation unless --force is used
        if (!$this->option('force')) {
            if (!$this->confirm('Apakah Anda yakin ingin menghapus SEMUA periode KRS? Ini akan menghapus semua data KRS mahasiswa terkait juga!')) {
                $this->info('Operasi dibatalkan.');
                return;
            }
        }

        try {
            DB::beginTransaction();

            // Delete KRS data first (because of foreign key constraint)
            if ($krsCount > 0) {
                Krs::truncate();
                $this->info("✓ Berhasil menghapus {$krsCount} data KRS mahasiswa.");
            }

            // Delete periode KRS
            PeriodeKrs::truncate();
            $this->info("✓ Berhasil menghapus {$periodeKrsCount} periode KRS.");

            DB::commit();

            $this->info('');
            $this->info('🎉 Semua periode KRS berhasil dihapus!');
            $this->warn('⚠️  Jangan lupa untuk menjalankan seeder jika diperlukan:');
            $this->line('   php artisan db:seed --class=PeriodeKrsSeeder');

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("❌ Terjadi kesalahan: {$e->getMessage()}");
            return 1;
        }

        return 0;
    }
}
