<?php

namespace App\Http\Controllers\Admin\Lpm;

use App\Http\Controllers\Controller;
use App\Models\LpmActivity;
use App\Models\LpmContract;
use App\Models\LpmOutput;
use App\Models\LpmProgram;
use App\Models\LpmProposal;
use App\Models\LpmReport;
use App\Models\LpmReview;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProposalController extends Controller
{
    public function index(Request $request)
    {
        $query = LpmProposal::with(['program', 'ketua', 'members.user'])
            ->orderBy('updated_at', 'desc');

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('program') && $request->program) {
            $query->where('program_id', $request->program);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('judul', 'like', "%{$search}%");
        }

        return Inertia::render('Admin/Lpm/Proposals/Index', [
            'proposals' => $query->paginate(10)->withQueryString(),
            'programs' => LpmProgram::orderBy('nama_program')->get(['id', 'nama_program', 'skema']),
            'filters' => $request->only(['search', 'status', 'program']),
            'statusOptions' => LpmProposal::STATUSES,
        ]);
    }

    public function show(LpmProposal $proposal)
    {
        $proposal->load([
            'program.reviewScheme.criteria',
            'ketua',
            'creator',
            'members.user',
            'documents.uploader',
            'reviews.reviewer',
            'contract',
            'activities.creator',
            'reports.uploader',
            'outputs.creator',
        ]);

        $reviewableReviewers = User::where('role', 'dosen')
            ->with('dosen')
            ->get()
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->dosen?->nama_lengkap ?? $u->name,
                'assigned' => LpmReview::where('proposal_id', $proposal->id)
                    ->where('reviewer_user_id', $u->id)
                    ->exists(),
            ]);

        $reviewPassedCount = $proposal->reviews->where('status', 'submitted')->where('kesimpulan', 'lolos')->count();
        $totalSubmittedReviews = $proposal->reviews->where('status', 'submitted')->count();
        $minScore = $proposal->program?->reviewScheme?->minimum_score ?? 70;
        $averageScore = $proposal->averageReviewScore();

        $progress = match ($proposal->status) {
            'draft' => 5,
            'submitted', 'under_admin_review' => 15,
            'returned', 'revision' => 10,
            'admin_approved' => 25,
            'under_substance_review' => 35,
            'passed', 'failed' => 50,
            'funded' => 60,
            'contracted' => 65,
            'ongoing' => 75,
            'progress_report' => 85,
            'final_report' => 90,
            'output_validation' => 95,
            'completed' => 100,
            default => 0,
        };

        return Inertia::render('Admin/Lpm/Proposals/Show', [
            'proposal' => $proposal,
            'reviewableReviewers' => $reviewableReviewers,
            'reviewSummary' => [
                'submitted' => $totalSubmittedReviews,
                'passed' => $reviewPassedCount,
                'average' => $averageScore,
                'minimum' => $minScore,
                'progress' => $progress,
            ],
        ]);
    }

    public function verifyApprove(Request $request, LpmProposal $proposal)
    {
        if ($proposal->status !== 'submitted') {
            return back()->with('error', 'Status proposal tidak sesuai.');
        }

        $proposal->update([
            'status' => 'under_admin_review',
            'alasan_verifikasi' => $request->input('catatan', null),
        ]);

        return back()->with('success', 'Proposal masuk verifikasi administrasi.');
    }

    public function verifyReturn(Request $request, LpmProposal $proposal)
    {
        if ($proposal->status !== 'submitted' && $proposal->status !== 'under_admin_review') {
            return back()->with('error', 'Status proposal tidak sesuai.');
        }

        $request->validate(['catatan' => 'required|string']);

        $proposal->update([
            'status' => 'returned',
            'alasan_verifikasi' => $request->catatan,
        ]);

        return back()->with('success', 'Proposal dikembalikan ke ketua untuk diperbaiki.');
    }

    public function verifyApproveAdmin(Request $request, LpmProposal $proposal)
    {
        if ($proposal->status !== 'under_admin_review') {
            return back()->with('error', 'Status proposal tidak sesuai.');
        }

        $proposal->update([
            'status' => 'admin_approved',
            'alasan_verifikasi' => $request->input('catatan', null),
        ]);

        return back()->with('success', 'Verifikasi administrasi disetujui. Proposal siap direview.');
    }

    public function reject(Request $request, LpmProposal $proposal)
    {
        if (! in_array($proposal->status, ['submitted', 'under_admin_review', 'under_substance_review'])) {
            return back()->with('error', 'Status proposal tidak sesuai.');
        }

        $request->validate(['catatan' => 'required|string']);

        $proposal->update([
            'status' => 'rejected',
            'alasan_verifikasi' => $request->catatan,
        ]);

        return back()->with('success', 'Proposal ditolak.');
    }

    public function assignReviewers(Request $request, LpmProposal $proposal)
    {
        if ($proposal->status !== 'admin_approved') {
            return back()->with('error', 'Proposal belum lolos verifikasi administrasi.');
        }

        $request->validate([
            'reviewers' => 'required|array|min:1',
            'reviewers.*' => 'exists:users,id',
        ]);

        foreach ($request->reviewers as $userId) {
            LpmReview::firstOrCreate([
                'proposal_id' => $proposal->id,
                'reviewer_user_id' => $userId,
            ], [
                'status' => 'draft',
            ]);
        }
        LpmReview::where('proposal_id', $proposal->id)
            ->whereNotIn('reviewer_user_id', $request->reviewers)
            ->where('status', 'draft')
            ->delete();

        $proposal->update([
            'status' => 'under_substance_review',
            'alasan_verifikasi' => null,
        ]);

        return back()->with('success', 'Reviewer ditugaskan. Proposal menunggu penilaian.');
    }

    public function decideReview(Request $request, LpmProposal $proposal)
    {
        if ($proposal->status !== 'under_substance_review') {
            return back()->with('error', 'Status proposal tidak sesuai.');
        }

        $request->validate([
            'keputusan' => 'required|in:passed,failed,revision',
            'catatan' => 'nullable|string',
        ]);

        $proposal->update([
            'status' => $request->keputusan === 'revision' ? 'revision' : $request->keputusan,
            'alasan_verifikasi' => $request->catatan,
        ]);

        $msg = $request->keputusan === 'passed' ? 'Proposal dinyatakan lulus seleksi.' : ($request->keputusan === 'failed' ? 'Proposal dinyatakan tidak lulus.' : 'Proposal dikembalikan untuk revisi substansi.');

        return back()->with('success', $msg);
    }

    public function fund(Request $request, LpmProposal $proposal)
    {
        if ($proposal->status !== 'passed') {
            return back()->with('error', 'Proposal belum lulus seleksi.');
        }

        $proposal->update(['status' => 'funded']);

        return back()->with('success', 'Proposal ditetapkan sebagai penerima dana.');
    }

    public function storeContract(Request $request, LpmProposal $proposal)
    {
        if ($proposal->status !== 'funded') {
            return back()->with('error', 'Proposal belum ditetapkan.');
        }

        $request->validate([
            'nomor_kontrak' => 'required|string|max:100',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'dana_disetujui' => 'required|numeric|min:0',
            'kesepakatan' => 'nullable|string',
            'file_kontrak' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
        ]);

        $filePath = $proposal->contract?->file_kontrak;
        if ($request->hasFile('file_kontrak')) {
            if ($filePath) {
                Storage::disk('public')->delete($filePath);
            }
            $filePath = $request->file('file_kontrak')->store('lpm/contracts', 'public');
        }

        LpmContract::updateOrCreate(
            ['proposal_id' => $proposal->id],
            [
                'nomor_kontrak' => $request->nomor_kontrak,
                'tanggal_mulai' => $request->tanggal_mulai,
                'tanggal_selesai' => $request->tanggal_selesai,
                'dana_disetujui' => $request->dana_disetujui,
                'kesepakatan' => $request->kesepakatan,
                'file_kontrak' => $filePath,
                'disetujui_oleh' => $request->user()->id,
            ]
        );

        $proposal->update(['status' => 'contracted']);

        return back()->with('success', 'Kontrak disimpan dan kegiatan resmi terbentuk.');
    }

    public function startOngoing(Request $request, LpmProposal $proposal)
    {
        if ($proposal->status !== 'contracted') {
            return back()->with('error', 'Proposal belum terkontrak.');
        }

        $proposal->update(['status' => 'ongoing']);

        return back()->with('success', 'Kegiatan pengabdian mulai berjalan.');
    }

    public function storeActivity(Request $request, LpmProposal $proposal)
    {
        $request->validate([
            'nama_kegiatan' => 'required|string|max:255',
            'tanggal' => 'nullable|date',
            'deskripsi' => 'nullable|string',
            'dokumentasi' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:10240',
        ]);

        $dokumentasi = $request->hasFile('dokumentasi')
            ? $request->file('dokumentasi')->store('lpm/activities', 'public')
            : null;

        LpmActivity::create([
            'proposal_id' => $proposal->id,
            'nama_kegiatan' => $request->nama_kegiatan,
            'tanggal' => $request->tanggal,
            'deskripsi' => $request->deskripsi,
            'dokumentasi' => $dokumentasi,
            'created_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Kegiatan tersimpan.');
    }

    /* ---------- Laporan (kemajuan / akhir) ---------- */

    public function validateReport(Request $request, LpmReport $report)
    {
        $request->validate([
            'status' => 'required|in:valid,ditolak',
            'catatan' => 'nullable|string',
        ]);

        $report->update([
            'status_validasi' => $request->status,
            'catatan_validasi' => $request->catatan,
            'tanggal_verifikasi' => now(),
            'diverifikasi_oleh' => $request->user()->id,
        ]);

        if ($request->status === 'valid') {
            $proposal = $report->proposal;
            if ($report->jenis === 'kemajuan' && $proposal->status === 'progress_report') {
                $proposal->update(['status' => 'ongoing']);
            } elseif ($report->jenis === 'akhir' && $proposal->status === 'final_report') {
                $proposal->update(['status' => 'output_validation']);
            }
        }

        return back()->with('success', 'Validasi laporan disimpan.');
    }

    /* ---------- Luaran ---------- */

    public function validateOutput(Request $request, LpmOutput $output)
    {
        $request->validate([
            'status' => 'required|in:valid,ditolak',
            'catatan' => 'nullable|string',
        ]);

        $output->update([
            'status_validasi' => $request->status,
            'catatan_validasi' => $request->catatan,
            'tanggal_verifikasi' => now(),
            'diverifikasi_oleh' => $request->user()->id,
        ]);

        if ($request->status === 'valid') {
            $proposal = $output->proposal;
            $allValid = $proposal->outputs()->where('status_validasi', '!=', 'valid')->doesntExist();
            if ($allValid && $proposal->status === 'output_validation') {
                $proposal->update(['status' => 'completed']);
            }
        }

        return back()->with('success', 'Validasi luaran disimpan.');
    }
}