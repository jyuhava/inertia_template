<?php

namespace App\Http\Controllers\Admin\Dosen;

use App\Http\Controllers\Controller;
use App\Models\Dosen;
use App\Services\Pddikti\PddiktiDosenFeederService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PddiktiController extends Controller
{
    public function updateMapping(Request $request, Dosen $dosen)
    {
        $mapping = $dosen->pddiktiMapping;
        $data = $request->validate([
            'pddikti_id' => ['nullable', 'string', 'max:100', Rule::unique('pddikti_dosen_mappings', 'pddikti_id')->ignore($mapping?->id)],
            'id_registrasi_dosen' => ['nullable', 'string', 'max:100', Rule::unique('pddikti_dosen_mappings', 'id_registrasi_dosen')->ignore($mapping?->id)],
            'status_mapping' => 'required|in:unmapped,mapped,error',
        ]);
        $dosen->pddiktiMapping()->updateOrCreate([], $data);

        return back()->with('success', 'Mapping PDDikti diperbarui.');
    }

    public function sync(Dosen $dosen, PddiktiDosenFeederService $feeder)
    {
        $log = $feeder->sync($dosen);

        return back()->with($log->status === 'success' ? 'success' : 'error', $log->message);
    }
}
