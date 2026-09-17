<?php

namespace App\Http\Controllers\Admin\Obe;

use App\Http\Controllers\Controller;
use App\Models\Kurikulum;
use App\Models\ObeCpl;
use App\Services\ObeValidationService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CplController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Admin/Obe/Cpl/Index', [
            'cpls' => ObeCpl::with(['prodi', 'kurikulum'])->when($request->kurikulum_id, fn ($q, $id) => $q->where('kurikulum_id', $id))->orderBy('sequence')->paginate(15)->withQueryString(),
            'kurikulums' => Kurikulum::orderBy('nama')->get(['id', 'prodi_id', 'kode', 'nama']),
        ]);
    }

    public function store(Request $request, ObeValidationService $validation)
    {
        $data = $request->validate([
            'prodi_id' => ['required', 'exists:prodis,id'], 'kurikulum_id' => ['required', 'exists:kurikulums,id'],
            'code' => ['required', 'string', 'max:50', Rule::unique('obe_cpl')->where(fn ($q) => $q->where('kurikulum_id', $request->integer('kurikulum_id')))],
            'name' => ['required', 'string', 'max:255'], 'description' => ['nullable', 'string'], 'domain' => ['nullable', 'string', 'max:100'],
            'sequence' => ['nullable', 'integer', 'min:0'], 'status' => ['nullable', 'in:aktif,nonaktif'],
        ]);
        $kurikulum = Kurikulum::findOrFail($data['kurikulum_id']);
        if ($kurikulum->prodi_id !== (int) $data['prodi_id']) {
            abort(422, 'CPL harus menggunakan program studi dari kurikulum yang dipilih.');
        }

        $cpl = ObeCpl::create($data + ['created_by' => $request->user()->id]);
        $cpl->audits()->create(['user_id' => $request->user()->id, 'action' => 'created', 'after' => $cpl->toArray()]);

        return back()->with('success', 'CPL berhasil ditambahkan.');
    }

    public function update(Request $request, ObeCpl $cpl)
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:50', Rule::unique('obe_cpl')->where(fn ($q) => $q->where('kurikulum_id', $cpl->kurikulum_id))->ignore($cpl->id)],
            'name' => ['required', 'string', 'max:255'], 'description' => ['nullable', 'string'], 'domain' => ['nullable', 'string', 'max:100'],
            'sequence' => ['nullable', 'integer', 'min:0'], 'status' => ['nullable', 'in:aktif,nonaktif'],
        ]);
        $before = $cpl->toArray();
        $cpl->update($data);
        $this->audit($cpl, 'updated', $before, $cpl->fresh()->toArray(), $request->user()->id);

        return back()->with('success', 'CPL berhasil diperbarui.');
    }

    public function destroy(Request $request, ObeCpl $cpl)
    {
        $before = $cpl->toArray();
        $cpl->update(['status' => 'nonaktif']);
        $this->audit($cpl, 'deactivated', $before, $cpl->fresh()->toArray(), $request->user()->id);

        return back()->with('success', 'CPL berhasil dinonaktifkan.');
    }

    private function audit(ObeCpl $model, string $action, array $before, array $after, int $userId): void
    {
        $model->audits()->create(compact('action', 'before', 'after') + ['user_id' => $userId]);
    }
}
