<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Survey;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SurveyController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Surveys/Index', ['surveys' => Survey::withCount('questions')->latest()->get(), 'periods' => \App\Models\PeriodeKrs::orderByDesc('id')->get(['id', 'nama_periode'])]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate(['title' => 'required|string|max:255', 'description' => 'nullable|string', 'periode_krs_id' => 'nullable|exists:periode_krs,id', 'survey_type' => 'required|string|max:40', 'start_at' => 'nullable|date', 'end_at' => 'nullable|date|after:start_at', 'is_required' => 'boolean']);
        Survey::create($data + ['status' => 'draft']);

        return back()->with('success', 'Survey dibuat sebagai draft.');
    }

    public function publish(Survey $survey): RedirectResponse
    {
        $survey->update(['status' => 'published']);

        return back()->with('success', 'Survey dipublikasikan.');
    }

    public function question(Request $request, Survey $survey): RedirectResponse
    {
        $data = $request->validate(['question' => 'required|string', 'question_type' => 'required|in:single_choice,multiple_choice,rating,text,textarea', 'is_required' => 'boolean', 'options' => 'array']);
        $question = $survey->questions()->create($data + ['sort_order' => $survey->questions()->count() + 1]);
        foreach ($data['options'] ?? [] as $i => $option) {
            $question->options()->create(['label' => $option, 'value' => $option, 'sort_order' => $i + 1]);
        }

        return back()->with('success', 'Pertanyaan ditambahkan.');
    }

    public function target(Request $request, Survey $survey): RedirectResponse
    {
        $data = $request->validate(['target_type' => 'required|in:all,prodi,mahasiswa', 'target_id' => 'nullable|integer']);
        if ($data['target_type'] !== 'all' && empty($data['target_id'])) {
            return back()->withErrors(['target_id' => 'Target harus dipilih.']);
        } $survey->targets()->firstOrCreate($data);

        return back()->with('success', 'Target survey ditambahkan.');
    }
}
