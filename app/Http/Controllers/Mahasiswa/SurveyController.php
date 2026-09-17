<?php

namespace App\Http\Controllers\Mahasiswa;

use App\Http\Controllers\Controller;
use App\Models\Survey;
use App\Models\SurveyResponse;
use App\Services\Academic\KhsAccessService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SurveyController extends Controller
{
    private function mahasiswa(Request $request)
    {
        return $request->user()->mahasiswa ?? \App\Models\Mahasiswa::where('user_id', $request->user()->id)->firstOrFail();
    }

    public function index(Request $request, KhsAccessService $access)
    {
        $student = $this->mahasiswa($request);
        $surveys = Survey::with(['questions.options', 'targets'])->where('status', 'published')->get()->filter(fn ($survey) => $survey->isOpen() && $access->isTargeted($survey, $student))->values();

        return Inertia::render('Mahasiswa/Surveys/Index', ['surveys' => $surveys, 'completedIds' => $student->surveyResponses()->whereNotNull('submitted_at')->pluck('survey_id')]);
    }

    public function submit(Request $request, Survey $survey, KhsAccessService $access): RedirectResponse
    {
        $student = $this->mahasiswa($request);
        $survey->load('targets');
        abort_unless($survey->isOpen() && $access->isTargeted($survey, $student), 403);
        $questions = $survey->questions()->with('options')->get();
        $rules = [];
        foreach ($questions as $question) {
            if ($question->is_required) {
                $rules['answers.'.$question->id] = $question->question_type === 'multiple_choice' ? 'required|array|min:1' : 'required';
            }
        } $data = $request->validate($rules);
        $response = SurveyResponse::firstOrCreate(['survey_id' => $survey->id, 'mahasiswa_id' => $student->id]);
        if ($response->submitted_at) {
            return back()->with('error', 'Survey sudah dikirim.');
        } foreach ($questions as $question) {
            $answer = $data['answers'][$question->id] ?? null;
            $response->answers()->updateOrCreate(['survey_question_id' => $question->id], ['answer' => is_array($answer) ? json_encode($answer) : $answer]);
        } $response->update(['submitted_at' => now()]);

        return redirect()->route('mahasiswa.surveys.index')->with('success', 'Terima kasih, survey telah dikirim.');
    }
}
