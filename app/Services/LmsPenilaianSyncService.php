<?php

namespace App\Services;

use App\Models\Krs;
use App\Models\LmsAssignment;
use App\Models\Penilaian;
use App\Models\PeriodeKrs;

class LmsPenilaianSyncService
{
    public function syncForMahasiswa(int $jadwalKuliahId, int $mahasiswaId): ?Penilaian
    {
        $periodeKrsId = $this->resolvePeriodeKrsId($jadwalKuliahId, $mahasiswaId);
        if (! $periodeKrsId) {
            return null;
        }

        $assignments = LmsAssignment::query()
            ->select(['id', 'komponen', 'bobot_komponen'])
            ->whereHas('chapter.course', function ($query) use ($jadwalKuliahId) {
                $query->where('jadwal_kuliah_id', $jadwalKuliahId);
            })
            ->with(['submissions' => function ($query) use ($mahasiswaId) {
                $query->select(['id', 'lms_assignment_id', 'mahasiswa_id', 'grade'])
                    ->where('mahasiswa_id', $mahasiswaId)
                    ->whereNotNull('grade');
            }])
            ->get();

        $components = [
            'harian' => ['sum' => 0.0, 'weight' => 0.0],
            'uts' => ['sum' => 0.0, 'weight' => 0.0],
            'uas' => ['sum' => 0.0, 'weight' => 0.0],
        ];

        foreach ($assignments as $assignment) {
            $submission = $assignment->submissions->first();
            if (! $submission || $submission->grade === null) {
                continue;
            }

            $komponen = $assignment->komponen ?: 'harian';
            if (! isset($components[$komponen])) {
                continue;
            }

            $weight = max((float) ($assignment->bobot_komponen ?? 1), 0.01);
            $grade = max(min((float) $submission->grade, 100), 0);

            $components[$komponen]['sum'] += $grade * $weight;
            $components[$komponen]['weight'] += $weight;
        }

        $nilaiTugas = $this->computeWeighted($components['harian']);
        $nilaiUts = $this->computeWeighted($components['uts']);
        $nilaiUas = $this->computeWeighted($components['uas']);

        $penilaian = Penilaian::firstOrCreate([
            'mahasiswa_id' => $mahasiswaId,
            'jadwal_kuliah_id' => $jadwalKuliahId,
            'periode_krs_id' => $periodeKrsId,
        ]);

        $penilaian->update([
            'nilai_tugas' => $nilaiTugas,
            'nilai_uts' => $nilaiUts,
            'nilai_uas' => $nilaiUas,
        ]);

        $penilaian->updateNilaiAkhir();

        return $penilaian->refresh();
    }

    private function resolvePeriodeKrsId(int $jadwalKuliahId, int $mahasiswaId): ?int
    {
        $activePeriodeId = PeriodeKrs::query()->aktif()->value('id');

        if ($activePeriodeId) {
            $activeKrsExists = Krs::query()
                ->where('mahasiswa_id', $mahasiswaId)
                ->where('jadwal_kuliah_id', $jadwalKuliahId)
                ->where('periode_krs_id', $activePeriodeId)
                ->whereIn('status', ['diambil', 'disetujui'])
                ->exists();

            if ($activeKrsExists) {
                return $activePeriodeId;
            }
        }

        $latestKrsPeriod = Krs::query()
            ->where('mahasiswa_id', $mahasiswaId)
            ->where('jadwal_kuliah_id', $jadwalKuliahId)
            ->whereIn('status', ['diambil', 'disetujui'])
            ->latest('id')
            ->value('periode_krs_id');

        if ($latestKrsPeriod) {
            return (int) $latestKrsPeriod;
        }

        return Penilaian::query()
            ->where('mahasiswa_id', $mahasiswaId)
            ->where('jadwal_kuliah_id', $jadwalKuliahId)
            ->latest('id')
            ->value('periode_krs_id');
    }

    private function computeWeighted(array $component): ?float
    {
        if (($component['weight'] ?? 0) <= 0) {
            return null;
        }

        return round($component['sum'] / $component['weight'], 2);
    }
}
