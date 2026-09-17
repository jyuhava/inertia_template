<?php

namespace App\Services;

use App\Models\Mahasiswa;
use App\Models\ObeAssessmentScore;
use App\Models\ObeCpl;
use App\Models\ObeCpmk;

class ObeAchievementService
{
    public function cpmkAchievement(ObeCpmk $cpmk, Mahasiswa $mahasiswa): array
    {
        $cpmk->loadMissing('assessmentMappings.assessment', 'subCpmks.assessmentMappings.assessment');
        $mappings = $cpmk->assessmentMappings->concat($cpmk->subCpmks->flatMap->assessmentMappings)
            ->filter(fn ($mapping) => $mapping->assessment?->status === 'aktif');
        $weightTotal = (float) $mappings->sum('weight');
        $weightedScore = 0.0;
        $evidence = 0;

        foreach ($mappings as $mapping) {
            $score = ObeAssessmentScore::with('penilaian')
                ->where('assessment_id', $mapping->assessment_id)
                ->where('mahasiswa_id', $mahasiswa->id)
                ->first();

            $value = $score?->score ?? $score?->penilaian?->nilai_akhir;
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
        return ObeCpl::where('kurikulum_id', $kurikulumId)->orderBy('sequence')->get()
            ->map(fn (ObeCpl $cpl) => $this->cplAchievement($cpl, $mahasiswa, $threshold))->all();
    }
}
