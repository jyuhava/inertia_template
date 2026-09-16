<?php

namespace App\Http\Controllers\Dosen\Lpm;

use App\Http\Controllers\Controller;
use App\Models\LpmOutput;
use App\Models\LpmProposal;
use App\Models\LpmReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SubmissionController extends Controller
{
    public function uploadReport(Request $request, LpmProposal $proposal)
    {
        $ketua = $proposal->ketua_user_id === $request->user()->id;
        $member = $proposal->members()->where('user_id', $request->user()->id)->exists();
        if (! $ketua && ! $member) {
            abort(403);
        }

        $request->validate([
            'jenis' => 'required|in:kemajuan,akhir',
            'file' => 'required|file|mimes:pdf,doc,docx|max:20480',
            'catatan' => 'nullable|string',
        ]);

        $path = $request->file('file')->store('lpm/reports', 'public');

        LpmReport::create([
            'proposal_id' => $proposal->id,
            'jenis' => $request->jenis,
            'file_path' => $path,
            'catatan' => $request->catatan,
            'status_validasi' => 'menunggu',
            'uploaded_by' => $request->user()->id,
        ]);

        $target = $request->jenis === 'kemajuan' ? 'progress_report' : 'final_report';
        if (in_array($proposal->status, ['ongoing', 'progress_report', 'final_report'])) {
            $proposal->update(['status' => $target]);
        }

        return back()->with('success', 'Laporan '.($request->jenis === 'kemajuan' ? 'kemajuan' : 'akhir').' berhasil diunggah.');
    }

    public function storeOutput(Request $request, LpmProposal $proposal)
    {
        $ketua = $proposal->ketua_user_id === $request->user()->id;
        $member = $proposal->members()->where('user_id', $request->user()->id)->exists();
        if (! $ketua && ! $member) {
            abort(403);
        }

        $request->validate([
            'jenis_luaran' => 'required|string|max:255',
            'judul' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'bukti' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png,zip|max:20480',
        ]);

        LpmOutput::create([
            'proposal_id' => $proposal->id,
            'jenis_luaran' => $request->jenis_luaran,
            'judul' => $request->judul,
            'deskripsi' => $request->deskripsi,
            'bukti_path' => $request->hasFile('bukti')
                ? $request->file('bukti')->store('lpm/outputs', 'public')
                : null,
            'status_validasi' => 'menunggu',
            'created_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Luaran berhasil dilaporkan dan menunggu validasi.');
    }

    public function updateOutput(Request $request, LpmOutput $output)
    {
        $proposal = $output->proposal;
        $ketua = $proposal->ketua_user_id === $request->user()->id;
        $member = $proposal->members()->where('user_id', $request->user()->id)->exists();
        if (! $ketua && ! $member) {
            abort(403);
        }

        $request->validate([
            'jenis_luaran' => 'required|string|max:255',
            'judul' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
        ]);

        $output->update($request->only(['jenis_luaran', 'judul', 'deskripsi']));

        return back()->with('success', 'Luaran diperbarui.');
    }
}