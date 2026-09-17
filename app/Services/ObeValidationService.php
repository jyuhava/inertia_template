<?php

namespace App\Services;

use App\Models\Dosen;
use App\Models\KelasKuliah;
use App\Models\Kurikulum;
use App\Models\MataKuliah;
use App\Models\ObeAssessment;
use App\Models\ObeCpl;
use App\Models\ObeCpmk;
use App\Models\ObeSubCpmk;
use Illuminate\Validation\ValidationException;

class ObeValidationService
{
    public function assertCplBelongsToCurriculum(ObeCpl $cpl, Kurikulum $kurikulum): void
    {
        if ($cpl->kurikulum_id !== $kurikulum->id || $cpl->prodi_id !== $kurikulum->prodi_id) {
            $this->reject('cpl_id', 'CPL harus berasal dari program studi dan kurikulum yang sama.');
        }
    }

    public function assertCpmkBelongsToCurriculum(ObeCpmk $cpmk, Kurikulum $kurikulum): void
    {
        $cpmk->loadMissing('mataKuliah');

        if ($cpmk->kurikulum_id !== $kurikulum->id || $cpmk->mataKuliah?->prodi_id !== $kurikulum->prodi_id) {
            $this->reject('cpmk_id', 'CPMK harus berasal dari mata kuliah, program studi, dan kurikulum yang sama.');
        }
    }

    public function assertCplCourseMapping(ObeCpl $cpl, MataKuliah $mataKuliah, Kurikulum $kurikulum): void
    {
        $this->assertCplBelongsToCurriculum($cpl, $kurikulum);

        if ($mataKuliah->prodi_id !== $kurikulum->prodi_id) {
            $this->reject('mata_kuliah_id', 'Mata kuliah harus berasal dari program studi CPL.');
        }

        if (! $kurikulum->kurikulumMataKuliahs()->where('mata_kuliah_id', $mataKuliah->id)->exists()) {
            $this->reject('mata_kuliah_id', 'Mata kuliah belum terdaftar dalam kurikulum CPL.');
        }
    }

    public function assertCpmkCplMapping(ObeCpmk $cpmk, ObeCpl $cpl): void
    {
        $cpmk->loadMissing('kurikulum', 'mataKuliah');
        $cpl->loadMissing('kurikulum');

        if ($cpmk->kurikulum_id !== $cpl->kurikulum_id || $cpmk->mataKuliah?->prodi_id !== $cpl->prodi_id) {
            $this->reject('cpl_id', 'Mapping CPMK ke CPL lintas program studi atau kurikulum tidak diizinkan.');
        }
    }

    public function assertAssessmentMapping(ObeAssessment $assessment, ?ObeCpmk $cpmk, ?ObeSubCpmk $subCpmk): void
    {
        if (($cpmk === null && $subCpmk === null) || ($cpmk !== null && $subCpmk !== null)) {
            $this->reject('mapping', 'Pilih tepat satu CPMK atau Sub-CPMK untuk pemetaan assessment.');
        }

        $target = $cpmk ?? $subCpmk?->cpmk;
        $target?->loadMissing('mataKuliah');

        if (! $target || $target->mata_kuliah_id !== $assessment->mata_kuliah_id) {
            $this->reject('cpmk_id', 'CPMK harus berasal dari mata kuliah assessment yang sama.');
        }

        if ($subCpmk && $subCpmk->obe_cpmk_id !== $target->id) {
            $this->reject('sub_cpmk_id', 'Sub-CPMK tidak sesuai dengan CPMK induknya.');
        }

        if ($assessment->kelas_kuliah_id) {
            $assessment->loadMissing('kelasKuliah');
            if ($assessment->kelasKuliah?->mata_kuliah_id !== $assessment->mata_kuliah_id) {
                $this->reject('kelas_kuliah_id', 'Kelas kuliah tidak sesuai dengan mata kuliah assessment.');
            }
        }
    }

    public function assertDosenCanReadClass(Dosen $dosen, KelasKuliah $kelasKuliah): void
    {
        $kelasKuliah->loadMissing('mataKuliah');
        $homebaseProdiId = $dosen->homebaseAktif?->prodi_id;
        $teachesClass = $dosen->kelasKuliahs()->where('kelas_kuliahs.id', $kelasKuliah->id)->wherePivot('status', 'aktif')->exists();

        if (! $teachesClass || ! $homebaseProdiId || $kelasKuliah->mataKuliah?->prodi_id !== $homebaseProdiId) {
            $this->reject('kelas_kuliah_id', 'Anda tidak memiliki akses ke kelas atau program studi ini.');
        }
    }

    private function reject(string $field, string $message): never
    {
        throw ValidationException::withMessages([$field => $message]);
    }
}
