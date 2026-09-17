<?php

namespace App\Services\Thesis;

use App\Models\Mahasiswa;
use App\Models\StudentStudyResultItem;
use App\Models\ThesisSetting;

class ThesisEligibilityService
{
    /** Return all unmet requirements; absent prodi settings intentionally mean zero thresholds. */
    public function validate(Mahasiswa $mahasiswa): array
    {
        $setting = ThesisSetting::where('prodi_id', $mahasiswa->prodi_id)->first();
        $minimumCredits = (float) ($setting?->minimum_credits ?? 0);
        $minimumGpa = (float) ($setting?->minimum_gpa ?? 0);
        $summary = $this->academicSummary($mahasiswa);
        $problems = [];

        if ($mahasiswa->status !== 'aktif') {
            $problems[] = 'Mahasiswa harus berstatus aktif untuk mengajukan tugas akhir.';
        }
        if ($summary['credits'] < $minimumCredits) {
            $problems[] = "Total SKS lulus {$summary['credits']} belum memenuhi minimal {$minimumCredits} SKS.";
        }
        if ($summary['gpa'] < $minimumGpa) {
            $problems[] = "IPK {$summary['gpa']} belum memenuhi minimal {$minimumGpa}.";
        }

        return $problems;
    }

    public function academicSummary(Mahasiswa $mahasiswa): array
    {
        $items = StudentStudyResultItem::query()
            ->whereHas('studyResult', fn ($query) => $query->where('mahasiswa_id', $mahasiswa->id)->whereIn('status', ['published', 'locked']))
            ->get(['credits', 'grade_point']);
        $credits = (float) $items->where('grade_point', '>', 0)->sum('credits');
        $attempted = (float) $items->sum('credits');
        $qualityPoints = (float) $items->sum(fn ($item) => (float) $item->credits * (float) $item->grade_point);

        return ['credits' => $credits, 'gpa' => $attempted > 0 ? round($qualityPoints / $attempted, 2) : 0.0];
    }
}
