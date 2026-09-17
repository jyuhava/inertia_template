<?php

namespace App\Http\Controllers\Admin\Obe;

use App\Http\Controllers\Controller;
use App\Models\ObeTaxonomyLevel;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TaxonomyController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Obe/Taxonomy/Index', [
            'taxonomyLevels' => ObeTaxonomyLevel::orderBy('category')->orderBy('sequence')->get(),
        ]);
    }

    public function store(Request $request)
    {
        ObeTaxonomyLevel::create($request->validate($this->rules()));

        return back()->with('success', 'Level taksonomi berhasil ditambahkan.');
    }

    public function update(Request $request, ObeTaxonomyLevel $taxonomyLevel)
    {
        $taxonomyLevel->update($request->validate($this->rules($taxonomyLevel)));

        return back()->with('success', 'Level taksonomi berhasil diperbarui.');
    }

    public function destroy(ObeTaxonomyLevel $taxonomyLevel)
    {
        $taxonomyLevel->update(['status' => 'nonaktif']);

        return back()->with('success', 'Level taksonomi berhasil dinonaktifkan.');
    }

    private function rules(?ObeTaxonomyLevel $taxonomyLevel = null): array
    {
        return [
            'code' => ['required', 'string', 'max:30', Rule::unique('obe_taxonomy_levels')->ignore($taxonomyLevel?->id)],
            'name' => ['required', 'string', 'max:255'], 'category' => ['nullable', 'string', 'max:100'], 'description' => ['nullable', 'string'],
            'sequence' => ['nullable', 'integer', 'min:0'], 'status' => ['nullable', 'in:aktif,nonaktif'],
        ];
    }
}
