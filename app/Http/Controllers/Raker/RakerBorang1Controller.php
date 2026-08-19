<?php

namespace App\Http\Controllers\Raker;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Raker\Concerns\ManagesBorang;
use App\Models\RakerBorang1ExistingProgram;

class RakerBorang1Controller extends Controller
{
    use ManagesBorang;

    protected function modelClass(): string
    {
        return RakerBorang1ExistingProgram::class;
    }

    protected function submissionLabel(): string
    {
        return 'Program Kerja Lama';
    }

    protected function rules(): array
    {
        return [
            'program_name' => 'required|string|max:255',
            'unit' => 'nullable|string|max:255',
            'pic_names' => 'nullable|array',
            'pic_names.*' => 'nullable|string|max:255',
            'pillars' => 'nullable|array',
            'pillars.*' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'policy_alignment' => 'nullable|in:Sangat Sesuai,Cukup Sesuai,Perlu Penyesuaian',
            'improvement_notes' => 'nullable|string',
        ];
    }
}