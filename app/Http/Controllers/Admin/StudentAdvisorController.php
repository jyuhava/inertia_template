<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Dosen;
use App\Models\Mahasiswa;
use App\Models\StudentAdvisor;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudentAdvisorController extends Controller
{
    public function index(Request $request)
    {
        $query = StudentAdvisor::with('mahasiswa.prodi', 'dosen');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('mahasiswa', fn ($q) => $q->where('nama_lengkap', 'like', "%{$search}%")->orWhere('nim', 'like', "%{$search}%"));
        }

        return Inertia::render('Admin/StudentAdvisor/Index', [
            'advisors' => $query->orderByDesc('created_at')->paginate(20)->withQueryString(),
            'filters' => $request->only(['search']),
            'mahasiswas' => Mahasiswa::where('status', 'aktif')->orderBy('nama_lengkap')->get(['id', 'nim', 'nama_lengkap']),
            'dosens' => Dosen::where('status', 'aktif')->orderBy('nama_lengkap')->get(['id', 'nama_lengkap']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'mahasiswa_id' => 'required|exists:mahasiswas,id',
            'dosen_id' => 'required|exists:dosens,id',
            'tanggal_mulai' => 'required|date',
        ]);

        StudentAdvisor::where('mahasiswa_id', $data['mahasiswa_id'])->where('status', 'aktif')->update(['status' => 'nonaktif', 'tanggal_selesai' => $data['tanggal_mulai']]);
        StudentAdvisor::create($data + ['status' => 'aktif']);

        return back()->with('success', 'Dosen pembimbing akademik berhasil ditetapkan.');
    }

    public function destroy(StudentAdvisor $advisor)
    {
        $advisor->update(['status' => 'nonaktif', 'tanggal_selesai' => now()]);

        return back()->with('success', 'Penugasan pembimbing akademik berhasil diakhiri.');
    }
}
