<?php

namespace App\Http\Controllers\Dosen\Lpm;

use App\Http\Controllers\Controller;
use App\Models\LpmProposal;
use App\Models\LpmReview;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReviewController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $reviews = LpmReview::with(['proposal.program', 'proposal.ketua'])
            ->where('reviewer_user_id', $user->id)
            ->orderBy('updated_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Dosen/Lpm/Reviews', [
            'reviews' => $reviews,
        ]);
    }

    public function edit(Request $request, LpmReview $review)
    {
        if ($review->reviewer_user_id !== $request->user()->id) {
            abort(403);
        }

        $review->load(['proposal.program.reviewScheme.criteria', 'proposal.ketua', 'proposal.members.user', 'proposal.documents']);

        return Inertia::render('Dosen/Lpm/Review', [
            'review' => $review,
        ]);
    }

    public function update(Request $request, LpmReview $review)
    {
        if ($review->reviewer_user_id !== $request->user()->id) {
            abort(403);
        }
        if ($review->status === 'submitted') {
            return back()->with('error', 'Review sudah dikirim dan tidak dapat diubah.');
        }

        $criteria = $review->proposal->program->reviewScheme->criteria;

        $request->validate([
            'scores' => 'required|array',
            'scores.*' => 'required|numeric|between:0,100',
            'catatan' => 'nullable|string',
        ]);

        $totalScore = 0;
        $bobotTotal = $criteria->sum('bobot') ?: 100;
        foreach ($criteria as $criterion) {
            $score = (float) $request->input('scores.'.$criterion->id, 0);
            $totalScore += $score * ($criterion->bobot / $bobotTotal);
        }
        $totalScore = round($totalScore, 2);

        $minimum = $review->proposal->program->reviewScheme->minimum_score ?? 70;
        $kesimpulan = $totalScore >= $minimum ? 'lolos' : 'gagal';

        $review->update([
            'scores' => $request->scores,
            'total_score' => $totalScore,
            'kesimpulan' => $kesimpulan,
            'catatan' => $request->catatan,
            'status' => 'submitted',
        ]);

        return redirect()->route('dosen.lpm.reviews.index')
            ->with('success', 'Penilaian dikirim. Skor akhir: '.$totalScore);
    }

    public function destroy(Request $request, LpmReview $review)
    {
        if ($review->reviewer_user_id !== $request->user()->id) {
            abort(403);
        }
        if ($review->status === 'submitted') {
            return back()->with('error', 'Review sudah dikirim.');
        }

        $proposal = $review->proposal;

        // Hanya reset ke admin_approved bila masih di tahap review substansi
        if (in_array($proposal->status, ['under_substance_review', 'admin_approved'])) {
            $proposal->update(['status' => 'admin_approved']);
        }
        $review->delete();

        return back()->with('success', 'Review dibatalkan.');
    }
}