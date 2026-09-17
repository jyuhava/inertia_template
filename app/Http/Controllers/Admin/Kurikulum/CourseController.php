<?php

namespace App\Http\Controllers\Admin\Kurikulum;

use App\Http\Controllers\Controller;
use App\Models\Kurikulum;
use App\Models\KurikulumMataKuliah;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CourseController extends Controller
{
    private function validateItem(Request $request, Kurikulum $kurikulum, ?KurikulumMataKuliah $item = null): array
    {
        return $request->validate([
            'mata_kuliah_id' => [
                'required', 'exists:mata_kuliahs,id',
                Rule::unique('kurikulum_mata_kuliahs', 'mata_kuliah_id')
                    ->where('kurikulum_id', $kurikulum->id)
                    ->ignore($item?->id),
            ],
            'semester' => 'required|integer|min:1|max:14',
            'kelompok_mata_kuliah_id' => 'nullable|exists:kelompok_mata_kuliahs,id',
            'is_wajib' => 'boolean',
            'sks_override' => 'nullable|numeric|min:0|max:24',
            'sks_teori_override' => 'nullable|numeric|min:0|max:24',
            'sks_praktik_override' => 'nullable|numeric|min:0|max:24',
            'sks_lapangan_override' => 'nullable|numeric|min:0|max:24',
            'nilai_minimum' => 'nullable|string|max:5',
            'sort_order' => 'nullable|integer|min:0',
        ]);
    }

    public function store(Request $request, Kurikulum $kurikulum)
    {
        if ($kurikulum->status === 'arsip') {
            return back()->with('error', 'Kurikulum yang sudah diarsipkan tidak dapat diubah.');
        }

        $kurikulum->kurikulumMataKuliahs()->create($this->validateItem($request, $kurikulum));

        return back()->with('success', 'Mata kuliah berhasil ditambahkan ke kurikulum.');
    }

    public function update(Request $request, Kurikulum $kurikulum, KurikulumMataKuliah $item)
    {
        abort_unless($item->kurikulum_id === $kurikulum->id, 404);
        if ($kurikulum->status === 'arsip') {
            return back()->with('error', 'Kurikulum yang sudah diarsipkan tidak dapat diubah.');
        }

        $item->update($this->validateItem($request, $kurikulum, $item));

        return back()->with('success', 'Mata kuliah kurikulum berhasil diperbarui.');
    }

    public function destroy(Kurikulum $kurikulum, KurikulumMataKuliah $item)
    {
        abort_unless($item->kurikulum_id === $kurikulum->id, 404);
        if ($kurikulum->status === 'arsip') {
            return back()->with('error', 'Kurikulum yang sudah diarsipkan tidak dapat diubah.');
        }

        $item->delete();

        return back()->with('success', 'Mata kuliah berhasil dihapus dari kurikulum.');
    }
}
