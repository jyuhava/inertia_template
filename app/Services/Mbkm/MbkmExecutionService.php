<?php

namespace App\Services\Mbkm;

use App\Models\MbkmActivity;
use App\Models\MbkmApplication;
use App\Models\MbkmParticipant;
use App\Models\MbkmPlacement;
use App\Models\MbkmRecognition;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MbkmExecutionService
{
    public function accept(MbkmApplication $application, ?User $actor = null): MbkmParticipant
    {
        return DB::transaction(function () use ($application, $actor) {
            $application = MbkmApplication::lockForUpdate()->findOrFail($application->id);
            if (! in_array($application->status, ['submitted', 'accepted'], true)) {
                throw ValidationException::withMessages(['application' => 'Hanya pendaftaran yang diajukan dapat diterima.']);
            }
            $participant = MbkmParticipant::firstOrCreate(['mbkm_application_id' => $application->id], [
                'mahasiswa_id' => $application->mahasiswa_id, 'status' => 'accepted', 'accepted_at' => today(),
            ]);
            if ($application->status !== 'accepted') {
                $application->update(['status' => 'accepted']);
            }
            $application->audits()->create(['user_id' => $actor?->id ?? auth()->id(), 'action' => 'APPLICATION_ACCEPTED', 'after' => ['participant_id' => $participant->id]]);

            return $participant;
        });
    }

    public function submitActivity(MbkmPlacement $placement, array $attributes): MbkmActivity
    {
        return DB::transaction(function () use ($placement, $attributes) {
            if (! in_array($placement->status, ['active', 'planned'], true)) {
                throw ValidationException::withMessages(['placement' => 'Penempatan tidak aktif.']);
            }

            return $placement->activities()->create(array_merge($attributes, ['status' => 'submitted']));
        });
    }

    public function approveActivity(MbkmActivity $activity, User $actor): MbkmActivity
    {
        $activity->update(['status' => 'approved', 'approved_by' => $actor->id, 'approved_at' => now()]);

        return $activity->fresh();
    }

    public function approveRecognition(MbkmRecognition $recognition, User $actor): MbkmRecognition
    {
        if ($recognition->participant->mahasiswa_id !== optional($recognition->krs)->mahasiswa_id && $recognition->krs_id) {
            throw ValidationException::withMessages(['krs_id' => 'KRS harus milik peserta MBKM.']);
        }
        $recognition->update(['status' => 'approved', 'approved_by' => $actor->id, 'approved_at' => now()]);

        return $recognition->fresh();
    }
}
