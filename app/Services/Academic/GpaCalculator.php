<?php

namespace App\Services\Academic;

use Illuminate\Support\Collection;

class GpaCalculator
{
    public function calculate(Collection $items): array
    {
        $credits = (float) $items->sum('credits');
        $qualityPoints = (float) $items->sum(fn ($item) => (float) $item->credits * (float) $item->grade_point);

        return ['credits' => $credits, 'quality_points' => $qualityPoints, 'gpa' => $credits > 0 ? round($qualityPoints / $credits, 2) : null];
    }
}
