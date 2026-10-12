<?php

namespace App\Services;

use App\Models\Mahasiswa;
use App\Models\ObeAssessmentScore;
use App\Models\ObeCpl;
use App\Models\ObeCpmk;

class ObeAchievementService
{
    /**
     * Cache skor mahasiswa untuk satu request, dikunci lebih dulu per mahasiswa
     * lalu per assessment_id.
     *
     * Service ini di-resolve ulang oleh container pada tiap pemanggilan (tidak
     * di-bind sebagai singleton), jadi cache ini tidak bertahan antar request.
     *
     * @var array<int, array<int, float|int|string|null>>
     */
    private array $scoreCache = [];

    public function cpmkAchievement(ObeCpmk $cpmk, Mahasiswa $mahasiswa): array
    {
        $cpmk->loadMissing('assessmentMappings.assessment', 'subCpmks.assessmentMappings.assessment');
        $mappings = $cpmk->assessmentMappings->concat($cpmk->subCpmks->flatMap->assessmentMappings)
            ->filter(fn ($mapping) => $mapping->assessment?->status === 'aktif');
        $weightTotal = (float) $mappings->sum('weight');
        $weightedScore = 0.0;
        $evidence = 0;

        $scores = $this->scoresFor($mahasiswa, $mappings->pluck('assessment_id')->all());

        foreach ($mappings as $mapping) {
            $value = $scores[(int) $mapping->assessment_id] ?? null;

            if ($value === null || $mapping->assessment->max_score <= 0) {
                continue;
            }

            $weightedScore += min(100, max(0, ((float) $value / $mapping->assessment->max_score) * 100)) * $mapping->weight;
            $evidence++;
        }

        return [
            'cpmk_id' => $cpmk->id,
            'achievement' => $weightTotal > 0 ? round($weightedScore / $weightTotal, 2) : null,
            'evidence_count' => $evidence,
            'assessment_count' => $mappings->count(),
            'complete' => $mappings->isNotEmpty() && $evidence === $mappings->count(),
        ];
    }

    public function cplAchievement(ObeCpl $cpl, Mahasiswa $mahasiswa, float $threshold = 70): array
    {
        $cpl->loadMissing('cpmkMappings.cpmk');
        $weightTotal = 0.0;
        $weightedAchievement = 0.0;
        $missingEvidence = 0;

        foreach ($cpl->cpmkMappings as $mapping) {
            if (! $mapping->cpmk) {
                continue;
            }

            $achievement = $this->cpmkAchievement($mapping->cpmk, $mahasiswa);
            if ($achievement['achievement'] === null) {
                $missingEvidence++;

                continue;
            }

            $weightTotal += $mapping->weight;
            $weightedAchievement += $achievement['achievement'] * $mapping->weight;
        }

        $value = $weightTotal > 0 ? round($weightedAchievement / $weightTotal, 2) : null;

        return [
            'cpl_id' => $cpl->id,
            'achievement' => $value,
            'threshold' => $threshold,
            'achieved' => $value !== null && $value >= $threshold,
            'gap' => $value === null ? $threshold : round(max(0, $threshold - $value), 2),
            'missing_cpmk_evidence' => $missingEvidence,
        ];
    }

    public function gapReport(int $kurikulumId, Mahasiswa $mahasiswa, float $threshold = 70): array
    {
        // Muat seluruh pohon CPL -> CPMK -> assessment sekaligus di depan.
        // Sebelumnya setiap instance CPMK memanggil loadMissing() sendiri, sehingga
        // relasi yang sama diambil ulang berkali-kali.
        $cpls = ObeCpl::with([
            'cpmkMappings.cpmk.assessmentMappings.assessment',
            'cpmkMappings.cpmk.subCpmks.assessmentMappings.assessment',
        ])
            ->where('kurikulum_id', $kurikulumId)
            ->orderBy('sequence')
            ->get();

        // Isi cache skor sekali untuk seluruh assessment yang relevan, sehingga
        // pemanggilan scoresFor() dari cpmkAchievement() tidak lagi menembak
        // query per mapping.
        $this->scoresFor($mahasiswa, $cpls
            ->flatMap(fn (ObeCpl $cpl) => $cpl->cpmkMappings)
            ->map(fn ($mapping) => $mapping->cpmk)
            ->filter()
            ->flatMap(fn (ObeCpmk $cpmk) => $cpmk->assessmentMappings
                ->concat($cpmk->subCpmks->flatMap->assessmentMappings))
            ->pluck('assessment_id')
            ->all());

        return $cpls->map(fn (ObeCpl $cpl) => $this->cplAchievement($cpl, $mahasiswa, $threshold))->all();
    }

    /**
     * Nilai mahasiswa untuk sekumpulan assessment, diambil dalam satu query per
     * kelompok id dan disimpan di cache request ini.
     *
     * Tabel obe_assessment_scores punya unique(assessment_id, mahasiswa_id)
     * sehingga paling banyak satu baris per pasangan — keyBy() setara dengan
     * first().
     *
     * @param  array<int, mixed>  $assessmentIds
     * @return array<int, float|int|string|null>
     */
    private function scoresFor(Mahasiswa $mahasiswa, array $assessmentIds): array
    {
        $ids = array_values(array_unique(array_filter(
            array_map(fn ($id) => (int) $id, $assessmentIds),
            fn ($id) => $id > 0
        )));

        if ($ids === []) {
            return [];
        }

        $cached = $this->scoreCache[$mahasiswa->id] ?? [];
        $missing = array_values(array_diff($ids, array_keys($cached)));

        if ($missing !== []) {
            $rows = ObeAssessmentScore::with('penilaian')
                ->where('mahasiswa_id', $mahasiswa->id)
                ->whereIn('assessment_id', $missing)
                ->get();

            foreach ($rows as $row) {
                $cached[(int) $row->assessment_id] = $row->score ?? $row->penilaian?->nilai_akhir;
            }

            $this->scoreCache[$mahasiswa->id] = $cached;
        }

        return array_intersect_key($cached, array_flip($ids));
    }
}
