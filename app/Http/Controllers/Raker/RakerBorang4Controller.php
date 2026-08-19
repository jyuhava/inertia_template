<?php

namespace App\Http\Controllers\Raker;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Raker\Concerns\ManagesBorang;
use App\Models\RakerBorang4Timeline;

class RakerBorang4Controller extends Controller
{
    use ManagesBorang;

    protected function modelClass(): string
    {
        return RakerBorang4Timeline::class;
    }

    protected function submissionLabel(): string
    {
        return 'Timeline';
    }

    protected function rules(): array
    {
        return [
            'program_source_id' => 'nullable|integer',
            'program_name' => 'required|string|max:255',
            'jan' => 'nullable|string',
            'feb' => 'nullable|string',
            'mar' => 'nullable|string',
            'apr' => 'nullable|string',
            'may' => 'nullable|string',
            'jun' => 'nullable|string',
            'jul' => 'nullable|string',
            'aug' => 'nullable|string',
            'sep' => 'nullable|string',
            'oct' => 'nullable|string',
            'nov' => 'nullable|string',
            'dec' => 'nullable|string',
            'main_milestone' => 'nullable|string',
        ];
    }
}