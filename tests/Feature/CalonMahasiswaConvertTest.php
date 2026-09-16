<?php

namespace Tests\Feature;

use App\Models\CalonMahasiswa;
use App\Models\PeriodePmb;
use App\Models\Prodi;
use App\Models\User;
use App\Models\Mahasiswa;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CalonMahasiswaConvertTest extends TestCase
{
    use RefreshDatabase;

    public function test_calon_mahasiswa_with_any_status_can_be_converted_to_mahasiswa(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $prodi = Prodi::create([
            'kode_prodi' => 'PAI',
            'nama_prodi' => 'Pendidikan Agama Islam',
            'jenjang' => 'S1',
            'status' => 'aktif',
        ]);

        $periode = PeriodePmb::create([
            'nama_periode' => 'PMB 2024/2025',
            'tahun_akademik' => '2024/2025',
            'tanggal_buka' => '2024-01-01',
            'tanggal_tutup' => '2024-12-31',
            'status' => 'aktif',
        ]);

        $testStatuses = ['draft', 'submitted', 'verified', 'rejected', 'accepted'];

        foreach ($testStatuses as $index => $status) {
            $calon = CalonMahasiswa::create([
                'no_pendaftaran' => 'PMB2024000' . ($index + 1),
                'nik' => '320101234567000' . ($index + 1),
                'periode_pmb_id' => $periode->id,
                'prodi_pilihan_1' => $prodi->id,
                'nama_lengkap' => 'Calon ' . ucfirst($status),
                'email' => "calon_{$status}@example.com",
                'jenis_kelamin' => 'L',
                'tempat_lahir' => 'Bogor',
                'tanggal_lahir' => '2005-01-01',
                'agama' => 'Islam',
                'alamat' => 'Bogor',
                'no_hp' => '08123456789',
                'nama_ayah' => 'Ayah',
                'pekerjaan_ayah' => 'Wiraswasta',
                'nama_ibu' => 'Ibu',
                'pekerjaan_ibu' => 'Ibu Rumah Tangga',
                'no_hp_ortu' => '08123456788',
                'asal_sekolah' => 'SMA 1 Bogor',
                'tahun_lulus' => '2023',
                'status_pendaftaran' => $status,
            ]);

            $response = $this->actingAs($admin)
                ->post(route('admin.calon-mahasiswa.convert', $calon->id));

            $response->assertSessionHas('success');

            // Verify Mahasiswa record is created
            $calon->refresh();
            $this->assertEquals('accepted', $calon->status_pendaftaran);
            $this->assertNotNull($calon->user_id);

            $mahasiswa = Mahasiswa::where('user_id', $calon->user_id)->first();
            $this->assertNotNull($mahasiswa);
            $this->assertNotEmpty($mahasiswa->nim);
            $this->assertEquals('aktif', $mahasiswa->status);
            $this->assertEquals($prodi->id, $mahasiswa->prodi_id);
            $this->assertEquals($calon->nama_lengkap, $mahasiswa->nama_lengkap);
        }
    }
}
