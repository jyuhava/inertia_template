<?php

namespace App\Services\Academic;

use App\Models\Mahasiswa;
use App\Models\PeriodeKrs;
use App\Models\Survey;

class KhsAccessService
{
    public function requiredSurveys(Mahasiswa $mahasiswa, PeriodeKrs $periode)
    {
        return Survey::where('periode_krs_id', $periode->id)->where('is_required', true)->where('status', 'published')->with('targets')
            ->get()->filter(fn ($survey) => $survey->isOpen() && $this->isTargeted($survey, $mahasiswa));
    }

    public function isTargeted(Survey $survey, Mahasiswa $mahasiswa): bool
    {
        return $survey->targets->isEmpty() || $survey->targets->contains(fn ($target) => $target->target_type === 'all' || ($target->target_type === 'prodi' && $target->target_id === $mahasiswa->prodi_id) || ($target->target_type === 'mahasiswa' && $target->target_id === $mahasiswa->id));
    }

    public function canAccess(Mahasiswa $mahasiswa, PeriodeKrs $periode): bool
    {
        return $this->requiredSurveys($mahasiswa, $periode)->every(fn ($survey) => $survey->responses()->where('mahasiswa_id', $mahasiswa->id)->whereNotNull('submitted_at')->exists());
    }
}
