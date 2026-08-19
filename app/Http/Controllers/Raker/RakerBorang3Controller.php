<?php

namespace App\Http\Controllers\Raker;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Raker\Concerns\ManagesBorang;
use App\Models\RakerBorang3Risk;

class RakerBorang3Controller extends Controller
{
    use ManagesBorang;

    protected function modelClass(): string
    {
        return RakerBorang3Risk::class;
    }

    protected function submissionLabel(): string
    {
        return 'Analisis Risiko';
    }

    protected function rules(): array
    {
        return [
            'program_source_type' => 'nullable|in:existing,new',
            'program_source_id' => 'nullable|integer',
            'program_name' => 'required|string|max:255',
            'main_risk' => 'nullable|string',
            'cause' => 'nullable|string',
            'impact' => 'nullable|string',
            'risk_level' => 'nullable|in:Tinggi,Sedang,Rendah',
            'mitigation_strategy' => 'nullable|string',
            'pic_names' => 'nullable|array',
            'pic_names.*' => 'nullable|string|max:255',
            'additional_notes' => 'nullable|string',
        ];
    }
}