<?php

namespace App\Services\Mbkm;

use App\Models\Mahasiswa;
use App\Models\MbkmApplication;
use App\Models\MbkmProgram;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MbkmApplicationService
{
    public function __construct(private MbkmEligibilityService $eligibility) {}

    /** @throws ValidationException */
    public function getOrCreateDraft(Mahasiswa $mahasiswa, MbkmProgram $program, array $attributes = [], ?User $actor = null): MbkmApplication
    {
        return DB::transaction(function () use ($mahasiswa, $program, $attributes, $actor) {
            $program = MbkmProgram::with('targets')->lockForUpdate()->findOrFail($program->id);
            $this->ensureEligible($mahasiswa, $program);

            $application = MbkmApplication::firstOrCreate(
                ['mbkm_program_id' => $program->id, 'mahasiswa_id' => $mahasiswa->id],
                [
                    'application_number' => "MBKM-{$program->id}-{$mahasiswa->id}",
                    'status' => 'draft',
                    'motivation' => $attributes['motivation'] ?? null,
                    'notes' => $attributes['notes'] ?? null,
                ],
            );

            if ($application->wasRecentlyCreated) {
                $this->audit($application, 'APPLICATION_CREATED', null, ['status' => 'draft'], $actor);
            }

            return $application;
        });
    }

    /** @throws ValidationException */
    public function submit(MbkmApplication $application, ?User $actor = null): MbkmApplication
    {
        return DB::transaction(function () use ($application, $actor) {
            $application = MbkmApplication::with(['program.targets', 'mahasiswa'])->lockForUpdate()->findOrFail($application->id);

            if ($application->status !== 'draft') {
                throw ValidationException::withMessages(['application' => 'Hanya pendaftaran MBKM berstatus draft yang dapat diajukan.']);
            }

            $this->ensureEligible($application->mahasiswa, $application->program);

            $before = ['status' => $application->status, 'submitted_at' => $application->submitted_at];
            $application->update(['status' => 'submitted', 'submitted_at' => now()]);
            $this->audit($application, 'APPLICATION_SUBMITTED', $before, ['status' => 'submitted', 'submitted_at' => $application->submitted_at], $actor);

            return $application->fresh();
        });
    }

    private function ensureEligible(Mahasiswa $mahasiswa, MbkmProgram $program): void
    {
        $problems = $this->eligibility->validate($mahasiswa, $program);

        if ($problems !== []) {
            throw ValidationException::withMessages(['eligibility' => $problems]);
        }
    }

    private function audit(MbkmApplication $application, string $action, ?array $before, ?array $after, ?User $actor): void
    {
        $application->audits()->create([
            'user_id' => $actor?->id ?? auth()->id(),
            'action' => $action,
            'before' => $before,
            'after' => $after,
        ]);
    }
}
