<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\PeriodeKrs;
use App\Models\TahunAjaran;
use App\Models\Semester;
use Carbon\Carbon;

class PeriodeKrsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get tahun ajaran dan semester yang sudah ada
        $tahunAjaran = TahunAjaran::first();
        $semesterGanjil = Semester::where('nama_semester', 'Ganjil')->first();
        $semesterGenap = Semester::where('nama_semester', 'Genap')->first();

        if (!$tahunAjaran || !$semesterGanjil || !$semesterGenap) {
            $this->command->error('Pastikan data tahun ajaran dan semester sudah ada sebelum menjalankan seeder ini.');
            return;
        }

        // Periode KRS Ganjil (Aktif)
        PeriodeKrs::create([
            'nama_periode' => 'KRS Ganjil 2024/2025',
            'tahun_ajaran_id' => $tahunAjaran->id,
            'semester_id' => $semesterGanjil->id,
            'tanggal_mulai' => Carbon::now()->subDays(5)->toDateString(), // 5 hari lalu
            'tanggal_selesai' => Carbon::now()->addDays(10)->toDateString(), // 10 hari ke depan
            'status' => 'aktif',
            'keterangan' => 'Periode KRS untuk semester ganjil tahun ajaran 2024/2025. Mahasiswa dapat mengambil mata kuliah sesuai dengan kurikulum yang berlaku.'
        ]);

        // Periode KRS Genap (Tidak Aktif - untuk semester depan)
        PeriodeKrs::create([
            'nama_periode' => 'KRS Genap 2024/2025',
            'tahun_ajaran_id' => $tahunAjaran->id,
            'semester_id' => $semesterGenap->id,
            'tanggal_mulai' => Carbon::now()->addMonths(4)->toDateString(), // 4 bulan ke depan
            'tanggal_selesai' => Carbon::now()->addMonths(4)->addDays(14)->toDateString(), // 4 bulan + 14 hari
            'status' => 'tidak_aktif',
            'keterangan' => 'Periode KRS untuk semester genap tahun ajaran 2024/2025. Periode ini akan diaktifkan menjelang semester genap.'
        ]);

        $this->command->info('Periode KRS seeder berhasil dijalankan!');
        $this->command->info('- Periode KRS Ganjil 2024/2025: AKTIF');
        $this->command->info('- Periode KRS Genap 2024/2025: TIDAK AKTIF');
    }
}
