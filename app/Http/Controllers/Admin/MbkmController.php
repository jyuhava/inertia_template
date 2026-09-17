<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MbkmApplication;
use App\Models\MbkmRecognition;
use App\Services\Mbkm\MbkmExecutionService;

class MbkmController extends Controller
{
    public function applications()
    {
        return response()->json(MbkmApplication::with(['mahasiswa', 'program'])->latest()->paginate());
    }

    public function accept(MbkmApplication $application, MbkmExecutionService $service)
    {
        $service->accept($application, request()->user());

        return back()->with('message', 'Peserta MBKM diterima.');
    }

    public function approveRecognition(MbkmRecognition $recognition, MbkmExecutionService $service)
    {
        $service->approveRecognition($recognition, request()->user());

        return back()->with('message', 'Rekognisi MBKM disetujui.');
    }
}
