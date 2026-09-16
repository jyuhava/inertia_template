<?php

namespace App\Http\Controllers\Admin\Kurikulum;

use App\Http\Controllers\Controller;
use App\Models\Kurikulum;
use App\Services\Pddikti\PddiktiAkademikFeederService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PddiktiController extends Controller
{
    public function updateMapping(Request $request, Kurikulum $kurikulum)
    {
        $mapping = $kurikulum->pddiktiMapping;
        $data = $request->validate([
            'external_id' => ['nullable', 'string', 'max:100', Rule::unique('pddikti_akademik_mappings', 'external_id')->ignore($mapping?->id)],
            'sync_status' => 'required|in:not_synced,pending,synced,failed',
        ]);

        $kurikulum->pddiktiMapping()->updateOrCreate(
            ['entity_type' => Kurikulum::class, 'entity_id' => $kurikulum->id],
            $data
        );

        return back()->with('success', 'Mapping PDDikti kurikulum diperbarui.');
    }

    public function sync(Kurikulum $kurikulum, PddiktiAkademikFeederService $feeder)
    {
        $log = $feeder->sync($kurikulum);

        return back()->with($log->status === 'success' ? 'success' : 'error', $log->message);
    }
}
