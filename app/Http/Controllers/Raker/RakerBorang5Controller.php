<?php

namespace App\Http\Controllers\Raker;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Raker\Concerns\ManagesBorang;
use App\Models\RakerBorang5Need;

class RakerBorang5Controller extends Controller
{
    use ManagesBorang;

    protected function modelClass(): string
    {
        return RakerBorang5Need::class;
    }

    protected function submissionLabel(): string
    {
        return 'Kebutuhan';
    }

    protected function rules(): array
    {
        return [
            'program_source_id' => 'nullable|integer',
            'program_name' => 'required|string|max:255',
            'need_type' => 'nullable|in:Sarana,Prasarana,SDM',
            'need_details' => 'nullable|string',
            'main_specifications' => 'nullable|string',
            'quantity' => 'nullable|string|max:255',
            'status' => 'nullable|in:Ada,Belum Ada',
            'pic_names' => 'nullable|array',
            'pic_names.*' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ];
    }
}