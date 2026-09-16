<?php

namespace App\Http\Controllers\Admin\MataKuliah;

use App\Http\Controllers\Controller;
use App\Models\MataKuliah;
use App\Services\Pddikti\PddiktiAkademikFeederService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PddiktiController extends Controller
{
    public function updateMapping(Request $request, MataKuliah $mataKuliah)
    {
        $mapping = $mataKuliah->pddiktiMapping;
        $data = $request->validate([
            'external_id' => ['nullable', 'string', 'max:100', Rule::unique('pddikti_akademik_mappings', 'external_id')->ignore($mapping?->id)],
            'sync_status' => 'required|in:not_synced,pending,synced,failed',
        ]);

        $mataKuliah->pddiktiMapping()->updateOrCreate(
            ['entity_type' => MataKuliah::class, 'entity_id' => $mataKuliah->id],
            $data
        );

        return back()->with('success', 'Mapping PDDikti mata kuliah diperbarui.');
    }

    public function sync(MataKuliah $mataKuliah, PddiktiAkademikFeederService $feeder)
    {
        $log = $feeder->sync($mataKuliah);

        return back()->with($log->status === 'success' ? 'success' : 'error', $log->message);
    }
}
