<?php

namespace App\Http\Controllers\Raker\Concerns;

use App\Models\RakerSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

trait ManagesBorang
{
    abstract protected function modelClass(): string;

    abstract protected function rules(): array;

    protected function submissionLabel(): string
    {
        return 'Borang';
    }

    private function authorizeBorang(RakerSubmission $submission): void
    {
        $user = Auth::user();

        if ($user->role === 'mahasiswa') {
            abort(403, 'Akses tidak diizinkan.');
        }

        if ($submission->user_id !== Auth::id() && ! $user->isAdmin()) {
            abort(403, 'Anda tidak memiliki akses ke submission ini.');
        }

        if ($submission->status === 'submitted' && ! $user->isAdmin()) {
            abort(403, 'Submission sudah dikunci dan tidak dapat diubah.');
        }
    }

    public function store(Request $request, RakerSubmission $submission)
    {
        $this->authorizeBorang($submission);

        $model = $this->modelClass();
        $data = $request->validate($this->rules());

        $data['submission_id'] = $submission->id;
        $data['order_index'] = $model::where('submission_id', $submission->id)->max('order_index') + 1;

        $this->mutateData($data, $request);

        $model::create($data);

        return back()->with('success', $this->submissionLabel().' berhasil disimpan.');
    }

    public function update(Request $request, $item)
    {
        $model = $this->modelClass();
        $record = $model::findOrFail($item);

        $this->authorizeBorang($record->submission);

        $data = $request->validate($this->rules());
        $this->mutateData($data, $request);

        $record->update($data);

        return back()->with('success', $this->submissionLabel().' berhasil diperbarui.');
    }

    public function destroy($item)
    {
        $model = $this->modelClass();
        $record = $model::findOrFail($item);

        $this->authorizeBorang($record->submission);

        $record->delete();

        return back()->with('success', $this->submissionLabel().' berhasil dihapus.');
    }

    public function reorder(Request $request, RakerSubmission $submission)
    {
        $this->authorizeBorang($submission);

        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|integer',
            'items.*.order_index' => 'required|integer',
        ]);

        $model = $this->modelClass();

        foreach ($validated['items'] as $row) {
            $model::where('id', $row['id'])
                ->where('submission_id', $submission->id)
                ->update(['order_index' => $row['order_index']]);
        }

        return back()->with('success', 'Urutan '.$this->submissionLabel().' diperbarui.');
    }

    protected function mutateData(array &$data, Request $request): void
    {
        //
    }
}