<?php

namespace App\Console\Commands;

use App\Models\Mahasiswa;
use App\Models\User;
use App\Models\Krs;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DeleteAllMahasiswa extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mahasiswa:delete-all {--force : Force delete without confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete all mahasiswa and their user accounts from database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Count existing data
        $mahasiswaCount = Mahasiswa::count();
        $userMahasiswaCount = User::where('role', 'mahasiswa')->count();
        $krsCount = Krs::count();

        if ($mahasiswaCount === 0) {
            $this->info('Tidak ada mahasiswa yang ditemukan.');
            return;
        }

        $this->info("Ditemukan {$mahasiswaCount} mahasiswa, {$userMahasiswaCount} user mahasiswa, dan {$krsCount} data KRS.");

        // Ask for confirmation unless --force is used
        if (!$this->option('force')) {
            if (!$this->confirm('Apakah Anda yakin ingin menghapus SEMUA mahasiswa? Ini akan menghapus akun user dan data KRS terkait juga!')) {
                $this->info('Operasi dibatalkan.');
                return;
            }
        }

        try {
            DB::beginTransaction();

            // Delete KRS data first (because of foreign key constraint)
            if ($krsCount > 0) {
                Krs::truncate();
                $this->info("✓ Berhasil menghapus {$krsCount} data KRS.");
            }

            // Get all mahasiswa user IDs before deleting
            $mahasiswaUserIds = Mahasiswa::pluck('user_id')->toArray();

            // Delete mahasiswa records
            Mahasiswa::truncate();
            $this->info("✓ Berhasil menghapus {$mahasiswaCount} data mahasiswa.");

            // Delete user accounts
            if (!empty($mahasiswaUserIds)) {
                $deletedUsers = User::whereIn('id', $mahasiswaUserIds)->delete();
                $this->info("✓ Berhasil menghapus {$deletedUsers} akun user mahasiswa.");
            }

            DB::commit();

            $this->info('');
            $this->info('🎉 Semua mahasiswa berhasil dihapus!');
            $this->warn('⚠️  Jangan lupa untuk menjalankan seeder jika diperlukan:');
            $this->line('   php artisan db:seed --class=MahasiswaSeeder');

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("❌ Terjadi kesalahan: {$e->getMessage()}");
            return 1;
        }

        return 0;
    }
}
