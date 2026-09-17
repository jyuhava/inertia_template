<?php

namespace App\Http\Controllers\Mahasiswa;

use App\Http\Controllers\Controller;
use App\Models\MbkmApplication;
use App\Models\MbkmPlacement;
use App\Models\MbkmProgram;
use App\Services\Mbkm\MbkmApplicationService;
use App\Services\Mbkm\MbkmExecutionService;
use Illuminate\Http\Request;

class MbkmController extends Controller
{
    private function mahasiswa(Request $request)
    {
        return $request->user()->mahasiswa()->firstOrFail();
    }

    public function index(Request $request)
    {
        return response()->json($this->mahasiswa($request)->mbkmApplications()->with('program')->latest()->get());
    }

    public function store(Request $request, MbkmProgram $program, MbkmApplicationService $service)
    {
        $data = $request->validate(['motivation' => 'nullable|string', 'notes' => 'nullable|string']);
        $application = $service->getOrCreateDraft($this->mahasiswa($request), $program, $data, $request->user());

        return response()->json($application, 201);
    }

    public function submit(Request $request, MbkmApplication $application, MbkmApplicationService $service)
    {
        abort_unless($application->mahasiswa_id === $this->mahasiswa($request)->id, 403);
        $service->submit($application, $request->user());

        return back()->with('message', 'Pendaftaran MBKM diajukan.');
    }

    public function storeActivity(Request $request, MbkmPlacement $placement, MbkmExecutionService $service)
    {
        abort_unless($placement->participant->mahasiswa_id === $this->mahasiswa($request)->id, 403);
        $data = $request->validate(['activity_date' => 'required|date', 'title' => 'required|string|max:255', 'description' => 'nullable|string', 'hours' => 'required|numeric|min:0|max:24']);

        return response()->json($service->submitActivity($placement, $data), 201);
    }
}
