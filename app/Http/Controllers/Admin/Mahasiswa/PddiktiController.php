<?php

namespace App\Http\Controllers\Admin\Mahasiswa;

use App\Http\Controllers\Controller;
use App\Models\Mahasiswa;
use App\Services\Pddikti\PddiktiFeederService;
use Illuminate\Http\Request;

class PddiktiController extends Controller
{
    public function __construct(private PddiktiFeederService $pddikti)
    {
    }

    /**
     * Manually set/update the PDDikti mapping identifiers.
     */
    public function updateMapping(Request $request, Mahasiswa $mahasiswa)
    {
        $validated = $request->validate([
            'pddikti_id' => 'nullable|string|max:255',
            'pddikti_nim' => 'nullable|string|max:50',
        ]);

        $mapping = $mahasiswa->pddiktiMapping()->firstOrCreate([], ['status_mapping' => 'unmapped']);
        $mapping->update([
            ...$validated,
            'status_mapping' => $validated['pddikti_id'] ? 'mapped' : 'unmapped',
        ]);

        return back()->with('success', 'Mapping PDDikti berhasil diperbarui!');
    }

    /**
     * Trigger a sync attempt. No real Neo Feeder client exists yet, so this
     * always reports the honest "not configured" outcome via the sync log.
     */
    public function sync(Mahasiswa $mahasiswa)
    {
        $log = $this->pddikti->sync($mahasiswa);

        return back()->with(
            $log->status === 'success' ? 'success' : 'error',
            $log->message
        );
    }
}
