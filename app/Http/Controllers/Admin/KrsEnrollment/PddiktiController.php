<?php

namespace App\Http\Controllers\Admin\KrsEnrollment;

use App\Http\Controllers\Controller;
use App\Models\StudentCourseRegistration;
use App\Services\Pddikti\PddiktiAkademikFeederService;

class PddiktiController extends Controller
{
    /**
     * Only approved/locked KRS is eligible for PDDikti reporting — Neo
     * Feeder reports finalized enrollment, not drafts.
     */
    public function sync(StudentCourseRegistration $registration, PddiktiAkademikFeederService $feeder)
    {
        if (! in_array($registration->status, ['approved', 'locked'], true)) {
            return back()->with('error', 'Hanya KRS yang sudah disetujui/dikunci yang dapat dilaporkan ke PDDikti.');
        }

        $log = $feeder->sync($registration, 'SYNC_KRS');

        return back()->with($log->status === 'success' ? 'success' : 'error', $log->message);
    }
}
