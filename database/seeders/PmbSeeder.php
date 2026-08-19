<?php

namespace Database\Seeders;

use App\Models\PeriodePmb;
use App\Models\DokumenPmb;
use Illuminate\Database\Seeder;

class PmbSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Periode PMB
        PeriodePmb::create([
            'nama_periode' => 'PMB Tahun Akademik 2025/2026',
            'tahun_akademik' => '2025/2026',
            'tanggal_buka' => '2025-01-01',
            'tanggal_tutup' => '2025-08-31',
            'biaya_pendaftaran' => 150000,
            'kuota_total' => 500,
            'persyaratan' => "1. Lulusan SMA/MA/SMK/Sederajat\n2. Nilai rata-rata rapor minimal 7.0\n3. Tidak buta warna (untuk prodi tertentu)\n4. Sehat jasmani dan rohani",
            'keterangan' => 'Periode Penerimaan Mahasiswa Baru untuk Tahun Akademik 2025/2026',
            'status' => 'aktif',
        ]);

        // Create Dokumen PMB
        $dokumenList = [
            [
                'nama_dokumen' => 'Foto Diri',
                'kode_dokumen' => 'FOTO',
                'deskripsi' => 'Pas foto terbaru ukuran 4x6 cm dengan latar belakang merah',
                'jenis_file' => 'jpg',
                'max_size_kb' => 1024,
                'wajib' => true,
                'urutan' => 1,
            ],
            [
                'nama_dokumen' => 'Kartu Tanda Penduduk (KTP)',
                'kode_dokumen' => 'KTP',
                'deskripsi' => 'Fotocopy KTP yang masih berlaku',
                'jenis_file' => 'pdf',
                'max_size_kb' => 2048,
                'wajib' => true,
                'urutan' => 2,
            ],
            [
                'nama_dokumen' => 'Ijazah',
                'kode_dokumen' => 'IJAZAH',
                'deskripsi' => 'Fotocopy ijazah SMA/MA/SMK yang telah dilegalisir',
                'jenis_file' => 'pdf',
                'max_size_kb' => 3072,
                'wajib' => true,
                'urutan' => 3,
            ],
            [
                'nama_dokumen' => 'Transkrip Nilai',
                'kode_dokumen' => 'TRANSKRIP',
                'deskripsi' => 'Fotocopy transkrip nilai atau rapor yang telah dilegalisir',
                'jenis_file' => 'pdf',
                'max_size_kb' => 3072,
                'wajib' => true,
                'urutan' => 4,
            ],
            [
                'nama_dokumen' => 'Kartu Keluarga (KK)',
                'kode_dokumen' => 'KK',
                'deskripsi' => 'Fotocopy Kartu Keluarga',
                'jenis_file' => 'pdf',
                'max_size_kb' => 2048,
                'wajib' => true,
                'urutan' => 5,
            ],
            [
                'nama_dokumen' => 'Akta Kelahiran',
                'kode_dokumen' => 'AKTA',
                'deskripsi' => 'Fotocopy Akta Kelahiran',
                'jenis_file' => 'pdf',
                'max_size_kb' => 2048,
                'wajib' => false,
                'urutan' => 6,
            ],
            [
                'nama_dokumen' => 'Sertifikat Prestasi',
                'kode_dokumen' => 'PRESTASI',
                'deskripsi' => 'Sertifikat prestasi akademik atau non-akademik (jika ada)',
                'jenis_file' => 'pdf',
                'max_size_kb' => 2048,
                'wajib' => false,
                'urutan' => 7,
            ],
            [
                'nama_dokumen' => 'Surat Keterangan Sehat',
                'kode_dokumen' => 'SEHAT',
                'deskripsi' => 'Surat keterangan sehat dari dokter',
                'jenis_file' => 'pdf',
                'max_size_kb' => 2048,
                'wajib' => true,
                'urutan' => 8,
            ],
            [
                'nama_dokumen' => 'Surat Keterangan Tidak Buta Warna',
                'kode_dokumen' => 'BUTA_WARNA',
                'deskripsi' => 'Surat keterangan tidak buta warna dari dokter (untuk prodi tertentu)',
                'jenis_file' => 'pdf',
                'max_size_kb' => 2048,
                'wajib' => false,
                'urutan' => 9,
            ],
        ];

        foreach ($dokumenList as $dokumen) {
            DokumenPmb::create($dokumen);
        }

        $this->command->info('PMB seeders created successfully!');
        $this->command->info('- 1 Periode PMB (Aktif)');
        $this->command->info('- ' . count($dokumenList) . ' Dokumen PMB');
    }
}
