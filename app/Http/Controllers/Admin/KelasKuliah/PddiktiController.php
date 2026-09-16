<?php

namespace App\Http\Controllers\Admin\KelasKuliah;

use App\Http\Controllers\Controller;
use App\Models\KelasKuliah;
use App\Services\Pddikti\PddiktiAkademikFeederService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PddiktiController extends Controller
{
    public function updateMapping(Request $request, KelasKuliah $kelasKuliah)
    {
        $mapping = $kelasKuliah->pddiktiMapping;
        $data = $request->validate([
            'external_id' => ['nullable', 'string', 'max:100', Rule::unique('pddikti_akademik_mappings', 'external_id')->ignore($mapping?->id)],
            'sync_status' => 'required|in:not_synced,pending,synced,failed',
        ]);

        $kelasKuliah->pddiktiMapping()->updateOrCreate(
            ['entity_type' => KelasKuliah::class, 'entity_id' => $kelasKuliah->id],
            $data
        );

        return back()->with('success', 'Mapping PDDikti kelas kuliah diperbarui.');
    }

    public function sync(KelasKuliah $kelasKuliah, PddiktiAkademikFeederService $feeder)
    {
        $log = $feeder->sync($kelasKuliah);

        return back()->with($log->status === 'success' ? 'success' : 'error', $log->message);
    }
}
