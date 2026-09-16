<?php

namespace App\Http\Controllers\Dosen\Lpm;

use App\Http\Controllers\Controller;
use App\Models\Dosen;
use App\Models\LpmProgram;
use App\Models\LpmProposal;
use App\Models\LpmProposalDocument;
use App\Models\LpmProposalMember;
use App\Models\LpmReview;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProposalController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $dosen = Dosen::where('user_id', $user->id)->first();

        $query = LpmProposal::with(['program', 'members.user'])
            ->where('ketua_user_id', $user->id)
            ->orderBy('updated_at', 'desc');

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        return Inertia::render('Dosen/Lpm/Index', [
            'proposals' => $query->paginate(10)->withQueryString(),
            'filters' => $request->only(['search', 'status']),
            'dosen' => $dosen,
            'statusOptions' => LpmProposal::STATUSES,
        ]);
    }

    public function create(Request $request)
    {
        $programs = LpmProgram::aktif()
            ->where('tanggal_tutup', '>=', now()->toDateString())
            ->withCount('proposals')
            ->orderBy('tanggal_tutup')
            ->get()
            ->map(fn ($p) => [
                ...$p->toArray(),
                'is_terbuka' => $p->isTerbuka(),
            ]);

        $dosen = Dosen::where('user_id', $request->user()->id)->first();

        return Inertia::render('Dosen/Lpm/Form', [
            'programs' => $programs,
            'proposal' => null,
            'members' => [],
            'documents' => [],
            'dosen' => $dosen,
            'dosenList' => User::where('role', 'dosen')->with('dosen')->get()->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->dosen?->nama_lengkap ?? $u->name,
                'email' => $u->email,
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateProposal($request);

        $exists = LpmProposal::where('program_id', $data['program_id'])
            ->where('ketua_user_id', $request->user()->id)
            ->whereIn('status', ['draft', 'submitted', 'under_admin_review', 'under_substance_review', 'revision'])
            ->exists();

        if ($exists) {
            return back()->with('error', 'Anda masih memiliki proposal aktif di program ini.');
        }

        $proposal = LpmProposal::create([
            ...$data,
            'ketua_user_id' => $request->user()->id,
            'created_by' => $request->user()->id,
            'status' => 'draft',
        ]);

        $this->syncMembers($proposal, $request->input('members', []));

        return redirect()->route('dosen.lpm.proposals.edit', $proposal->id)
            ->with('success', 'Proposal dibuat. Silakan lengkapi dokumen lalu ajukan.');
    }

    public function edit(Request $request, LpmProposal $proposal)
    {
        $user = $request->user();
        if ($proposal->ketua_user_id !== $user->id) {
            abort(403, 'Anda bukan ketua proposal ini.');
        }

        $proposal->load(['program', 'members.user', 'documents.uploader']);

        // Non-ketua member yang belum setujui bisa konfirmasi
        $memberRow = LpmProposalMember::where('proposal_id', $proposal->id)
            ->where('user_id', $user->id)
            ->first();

        $programs = LpmProgram::aktif()
            ->where('tanggal_tutup', '>=', now()->toDateString())
            ->withCount('proposals')
            ->orderBy('tanggal_tutup')
            ->get()
            ->map(fn ($p) => [
                ...$p->toArray(),
                'is_terbuka' => $p->isTerbuka(),
            ]);

        $dosen = Dosen::where('user_id', $user->id)->first();

        return Inertia::render('Dosen/Lpm/Form', [
            'programs' => $programs,
            'proposal' => [
                ...$proposal->toArray(),
                'is_ketua' => $proposal->ketua_user_id === $user->id,
                'can_edit' => in_array($proposal->status, ['draft', 'returned', 'revision']),
            ],
            'members' => $proposal->members,
            'documents' => $proposal->documents,
            'dosen' => $dosen,
            'memberRow' => $memberRow,
            'dosenList' => User::where('role', 'dosen')->with('dosen')->get()->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->dosen?->nama_lengkap ?? $u->name,
                'email' => $u->email,
            ]),
        ]);
    }

    public function update(Request $request, LpmProposal $proposal)
    {
        if (! in_array($proposal->status, ['draft', 'returned', 'revision'])) {
            return back()->with('error', 'Proposal tidak dapat diubah pada status ini.');
        }

        $data = $this->validateProposal($request);
        $proposal->update($data);
        $this->syncMembers($proposal, $request->input('members', []));

        return back()->with('success', 'Proposal berhasil disimpan.');
    }

    public function submit(Request $request, LpmProposal $proposal)
    {
        if (! in_array($proposal->status, ['draft', 'returned', 'revision'])) {
            return back()->with('error', 'Proposal tidak dapat diajukan pada status ini.');
        }

        if ($proposal->documents()->count() === 0) {
            return back()->with('error', 'Proposal wajib memiliki minimal satu dokumen pendukung.');
        }

        $proposal->update([
            'status' => 'submitted',
            'tanggal_submit' => now(),
            'versi' => DB::raw('versi + 1'),
            'alasan_verifikasi' => $request->input('catatan', null),
        ]);

        // Notifikasi anggota untuk persetujuan (opsional, cukup tersimpan erat)
        return redirect()->route('dosen.lpm.proposals.edit', $proposal->id)
            ->with('success', 'Proposal berhasil diajukan ke LPM.');
    }

    public function uploadDocument(Request $request, LpmProposal $proposal)
    {
        if (! in_array($proposal->status, ['draft', 'returned', 'revision'])) {
            return back()->with('error', 'Dokumen hanya bisa dilampirkan sebelum diserahkan.');
        }

        $request->validate([
            'jenis' => 'required|string|max:100',
            'file' => 'required|file|mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png|max:10240',
        ]);

        $path = $request->file('file')->store('lpm/documents', 'public');

        LpmProposalDocument::create([
            'proposal_id' => $proposal->id,
            'jenis' => $request->jenis,
            'nama_file' => $request->file('file')->getClientOriginalName(),
            'path' => $path,
            'uploaded_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Dokumen berhasil diunggah.');
    }

    public function destroyDocument(LpmProposalDocument $document)
    {
        $proposal = $document->proposal;
        if (request()->user()->id !== $proposal->ketua_user_id) {
            abort(403);
        }
        if (! in_array($proposal->status, ['draft', 'returned', 'revision'])) {
            return back()->with('error', 'Dokumen tidak dapat dihapus pada status ini.');
        }

        Storage::disk('public')->delete($document->path);
        $document->delete();

        return back()->with('success', 'Dokumen dihapus.');
    }

    public function confirmMembership(Request $request, LpmProposal $proposal)
    {
        $member = LpmProposalMember::where('proposal_id', $proposal->id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $request->validate([
            'setuju' => 'required|boolean',
        ]);

        $member->update([
            'status_persetujuan' => $request->setuju ? 'menyetujui' : 'menolak',
        ]);

        return back()->with('success', $request->setuju ? 'Keanggotaan disetujui.' : 'Keanggotaan ditolak.');
    }

    public function show(Request $request, LpmProposal $proposal)
    {
        $proposal->load([
            'program',
            'ketua',
            'creator',
            'members.user',
            'documents.uploader',
            'reviews.reviewer',
            'contract',
            'activities',
            'reports.uploader',
            'outputs.creator',
            'program.reviewScheme.criteria',
        ]);

        $isReviewer = LpmReview::where('proposal_id', $proposal->id)
            ->where('reviewer_user_id', $request->user()->id)
            ->exists();

        return Inertia::render('Dosen/Lpm/Show', [
            'proposal' => $proposal,
            'isReviewer' => $isReviewer,
            'isKetua' => $proposal->ketua_user_id === $request->user()->id,
        ]);
    }

    protected function validateProposal(Request $request): array
    {
        return $request->validate([
            'program_id' => 'required|exists:lpm_programs,id',
            'judul' => 'required|string|max:255',
            'ringkasan' => 'nullable|string',
            'mitra' => 'nullable|string',
            'permasalahan' => 'nullable|string',
            'solusi' => 'nullable|string',
            'metode' => 'nullable|string',
            'jadwal' => 'nullable|array',
            'jadwal.*.kegiatan' => 'required|string',
            'jadwal.*.bulan' => 'required|string|max:20',
            'rab' => 'nullable|array',
            'rab.*.uraian' => 'required|string',
            'rab.*.harga_satuan' => 'required|numeric|min:0',
            'rab.*.jumlah' => 'required|integer|min:1',
            'luaran_target' => 'nullable|array',
            'luaran_target.*.jenis' => 'required|string',
            'luaran_target.*.keterangan' => 'nullable|string',
        ]);
    }

    protected function syncMembers(LpmProposal $proposal, array $members): void
    {
        $keptIds = [];
        foreach ($members as $item) {
            if (empty($item['user_id'])) {
                continue;
            }
            $member = LpmProposalMember::updateOrCreate(
                ['proposal_id' => $proposal->id, 'user_id' => $item['user_id']],
                [
                    'peran' => $item['peran'] ?? 'anggota',
                    'status_persetujuan' => $item['status_persetujuan'] ?? 'menunggu',
                ]
            );
            $keptIds[] = $member->id;
        }
        LpmProposalMember::where('proposal_id', $proposal->id)
            ->whereNotIn('id', $keptIds)
            ->delete();
    }
}