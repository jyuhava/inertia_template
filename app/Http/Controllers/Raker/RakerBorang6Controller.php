<?php

namespace App\Http\Controllers\Raker;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Raker\Concerns\ManagesBorang;
use App\Models\RakerBorang6Budget;
use Illuminate\Http\Request;

class RakerBorang6Controller extends Controller
{
    use ManagesBorang;

    protected function modelClass(): string
    {
        return RakerBorang6Budget::class;
    }

    protected function submissionLabel(): string
    {
        return 'Anggaran';
    }

    protected function rules(): array
    {
        return [
            'program_source_id' => 'nullable|integer',
            'program_name' => 'required|string|max:255',
            'cost_component' => 'nullable|string',
            'volume' => 'nullable|numeric|min:0',
            'unit' => 'nullable|string|max:255',
            'unit_price' => 'nullable|integer|min:0',
            'total_price' => 'nullable|integer|min:0',
            'funding_source' => 'nullable|string|max:255',
            'priority' => 'nullable|integer|min:1',
            'notes' => 'nullable|string',
        ];
    }

    protected function mutateData(array &$data, Request $request): void
    {
        $volume = $data['volume'] ?? null;
        $unitPrice = $data['unit_price'] ?? null;

        if ($volume !== null && $unitPrice !== null) {
            $data['total_price'] = (int) round((float) $volume * (float) $unitPrice);
        } elseif ($volume === null || $unitPrice === null) {
            $data['total_price'] = null;
        }
    }
}