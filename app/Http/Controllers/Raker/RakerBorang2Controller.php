<?php

namespace App\Http\Controllers\Raker;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Raker\Concerns\ManagesBorang;
use App\Models\RakerBorang2NewProgram;

class RakerBorang2Controller extends Controller
{
    use ManagesBorang;

    protected function modelClass(): string
    {
        return RakerBorang2NewProgram::class;
    }

    protected function submissionLabel(): string
    {
        return 'Program Kerja Baru';
    }

    protected function rules(): array
    {
        return [
            'program_name' => 'required|string|max:255',
            'main_pillar' => 'nullable|array',
            'main_pillar.*' => 'nullable|string|max:255',
            'supporting_pillar' => 'nullable|array',
            'supporting_pillar.*' => 'nullable|string|max:255',
            'target_audience' => 'nullable|string',
            'main_output' => 'nullable|string',
            'success_indicator' => 'nullable|string',
            'pic_names' => 'nullable|array',
            'pic_names.*' => 'nullable|string|max:255',
            'estimated_duration' => 'nullable|string|max:255',
            'priority' => 'nullable|integer|min:1',
        ];
    }
}