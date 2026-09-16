<?php

namespace App\Http\Controllers\Admin\Lpm;

use App\Http\Controllers\Controller;
use App\Models\LpmProgram;
use App\Models\LpmReviewCriterion;
use App\Models\LpmReviewScheme;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ProgramController extends Controller
{
    public function index(Request $request)
    {
        $query = LpmProgram::withCount('proposals')->orderBy('created_at', 'desc');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nama_program', 'like', "%{$search}%")
                  ->orWhere('skema', 'like', "%{$search}%")
                  ->orWhere('tahun_anggaran', 'like', "%{$search}%");
            });
        }

        $programs = $query->paginate(10)->withQueryString();

        return Inertia::render('Admin/Lpm/Programs/Index', [
            'programs' => $programs,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Lpm/Programs/Form', [
            'program' => null,
            'defaultCriteria' => [
                'Permasalahan mitra',
                'Solusi yang ditawarkan',
                'Metode pelaksanaan',
                'Luaran yang dihasilkan',
                'Kompetensi tim',
                'RAB / anggaran',
                'Jadwal pelaksanaan',
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateProgram($request);

        $program = LpmProgram::create([
            ...$data,
            'created_by' => $request->user()->id,
        ]);

        $this->saveScheme($program, $request);

        return redirect()->route('admin.lpm.programs.index')
            ->with('success', 'Program pengabdian berhasil dibuat.');
    }

    public function edit(LpmProgram $program)
    {
        $program->load('reviewScheme.criteria');

        return Inertia::render('Admin/Lpm/Programs/Form', [
            'program' => $program,
            'defaultCriteria' => [],
        ]);
    }

    public function update(Request $request, LpmProgram $program)
    {
        $data = $this->validateProgram($request);
        $program->update($data);
        $this->saveScheme($program, $request);

        return redirect()->route('admin.lpm.programs.index')
            ->with('success', 'Program pengabdian berhasil diperbarui.');
    }

    public function destroy(LpmProgram $program)
    {
        if ($program->proposals()->count() > 0) {
            return redirect()->route('admin.lpm.programs.index')
                ->with('error', 'Program tidak dapat dihapus karena masih memiliki proposal.');
        }

        $program->delete();

        return redirect()->route('admin.lpm.programs.index')
            ->with('success', 'Program pengabdian berhasil dihapus.');
    }

    public function activate(LpmProgram $program)
    {
        $today = now()->toDateString();
        if ($today < $program->tanggal_buka->toDateString()) {
            return back()->with('error', 'Tanggal buka program belum dimulai.');
        }

        $program->update(['status' => 'aktif']);

        return back()->with('success', 'Program dibuka untuk penerimaan proposal.');
    }

    public function close(LpmProgram $program)
    {
        $program->update(['status' => 'ditutup']);

        return back()->with('success', 'Program ditutup.');
    }

    public function reopen(LpmProgram $program)
    {
        $program->update(['status' => 'aktif']);

        return back()->with('success', 'Program dibuka kembali.');
    }

    public function finalize(LpmProgram $program)
    {
        $program->update(['status' => 'selesai']);

        return back()->with('success', 'Program ditandai selesai.');
    }

    public function downloadTemplate(LpmProgram $program)
    {
        if (! $program->template_proposal || ! Storage::disk('public')->exists($program->template_proposal)) {
            return back()->with('error', 'Template proposal belum tersedia.');
        }

        return Storage::disk('public')->download($program->template_proposal);
    }

    protected function validateProgram(Request $request): array
    {
        return $request->validate([
            'nama_program' => 'required|string|max:255',
            'skema' => 'required|string|max:255',
            'tahun_anggaran' => 'nullable|string|max:10',
            'tanggal_buka' => 'required|date',
            'tanggal_tutup' => 'required|date|after_or_equal:tanggal_buka',
            'pagu_dana' => 'required|numeric|min:0',
            'maksimal_dana' => 'required|numeric|min:0',
            'sumber_dana' => 'nullable|string|max:255',
            'persyaratan' => 'nullable|string',
            'status' => ['required', Rule::in(['draft', 'aktif', 'ditutup', 'selesai'])],
        ]);
    }

    protected function saveScheme(LpmProgram $program, Request $request): void
    {
        $request->validate([
            'review_scheme.minimum_score' => 'nullable|integer|between:0,100',
            'review_scheme.reviewer_count' => 'nullable|integer|between:1,5',
            'review_scheme.criteria' => 'nullable|array',
            'review_scheme.criteria.*.nama_kriteria' => 'required|string|max:255',
            'review_scheme.criteria.*.bobot' => 'required|integer|min:1|max:100',
        ]);

        $schemeInput = $request->input('review_scheme', []);
        $scheme = LpmReviewScheme::updateOrCreate(
            ['program_id' => $program->id],
            [
                'nama' => 'Skema Review '.$program->nama_program,
                'minimum_score' => $schemeInput['minimum_score'] ?? 70,
                'reviewer_count' => $schemeInput['reviewer_count'] ?? 2,
                'aktif' => true,
            ]
        );

        $criteriaInput = $schemeInput['criteria'] ?? [];
        $keptIds = [];
        foreach ($criteriaInput as $index => $item) {
            $criterion = LpmReviewCriterion::updateOrCreate(
                ['id' => $item['id'] ?? null, 'scheme_id' => $scheme->id],
                [
                    'nama_kriteria' => $item['nama_kriteria'],
                    'bobot' => $item['bobot'],
                    'urutan' => $index,
                ]
            );
            $keptIds[] = $criterion->id;
        }
        LpmReviewCriterion::where('scheme_id', $scheme->id)
            ->whereNotIn('id', $keptIds)
            ->delete();
    }
}