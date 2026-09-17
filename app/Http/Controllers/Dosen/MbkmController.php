<?php

namespace App\Http\Controllers\Dosen;

use App\Http\Controllers\Controller;
use App\Models\MbkmActivity;
use App\Services\Mbkm\MbkmExecutionService;
use Illuminate\Http\Request;

class MbkmController extends Controller
{
    public function activities(Request $request)
    {
        $dosen = $request->user()->dosen()->firstOrFail();

        return response()->json(MbkmActivity::whereHas('placement.supervisors', fn ($q) => $q->where('dosen_id', $dosen->id))->latest('activity_date')->get());
    }

    public function approveActivity(Request $request, MbkmActivity $activity, MbkmExecutionService $service)
    {
        $dosen = $request->user()->dosen()->firstOrFail();
        abort_unless($activity->placement->supervisors()->where('dosen_id', $dosen->id)->exists(), 403);
        $service->approveActivity($activity, $request->user());

        return back()->with('message', 'Aktivitas MBKM disetujui.');
    }
}
