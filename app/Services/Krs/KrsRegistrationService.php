<?php

namespace App\Services\Krs;

use App\Models\KelasKuliah;
use App\Models\Mahasiswa;
use App\Models\PeriodeKrs;
use App\Models\StudentCourseRegistration;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Transactional core of the KRS/enrollment workflow. Every mutating
 * operation runs inside DB::transaction and re-validates server-side —
 * frontend validation is never trusted alone.
 */
class KrsRegistrationService
{
    public function __construct(
        private KrsValidationService $validator,
        private KrsAuditService $audit,
    ) {}

    public function getOrCreateDraft(Mahasiswa $mahasiswa, PeriodeKrs $periode): StudentCourseRegistration
    {
        return DB::transaction(function () use ($mahasiswa, $periode) {
            $registration = StudentCourseRegistration::firstOrCreate(
                ['mahasiswa_id' => $mahasiswa->id, 'periode_krs_id' => $periode->id],
                ['kurikulum_id' => $this->resolveCurriculum($mahasiswa)?->id, 'status' => 'draft']
            );

            if ($registration->wasRecentlyCreated) {
                $this->audit->log($registration, 'KRS_CREATED', null, ['status' => 'draft']);
            }

            return $registration;
        });
    }

    /**
     * Resolve the student's applicable curriculum: the active curriculum
     * for their prodi. If curriculum is derivable from the kelas_kuliah at
     * add-time, we still snapshot it here on the header because a
     * student's curriculum context does not change per course within one
     * KRS — avoiding redundant storage per item while keeping header-level
     * curriculum context available for reporting/PDDikti.
     */
    public function resolveCurriculum(Mahasiswa $mahasiswa)
    {
        return \App\Models\Kurikulum::where('prodi_id', $mahasiswa->prodi_id)
            ->where('status', 'aktif')
            ->latest('created_at')
            ->first();
    }

    /**
     * Add one kelas_kuliah to the draft/revision registration. Uses a
     * pessimistic lock on the kelas_kuliah row so two concurrent requests
     * for the last seat cannot both succeed.
     *
     * @throws ValidationException
     */
    public function addClass(StudentCourseRegistration $registration, int $kelasKuliahId): StudentCourseRegistration
    {
        return DB::transaction(function () use ($registration, $kelasKuliahId) {
            if (! $registration->canBeEdited()) {
                throw ValidationException::withMessages(['registration' => 'KRS ini tidak dapat diedit pada status saat ini.']);
            }

            $kelasKuliah = KelasKuliah::with(['mataKuliah.prasyarats', 'jadwals'])->lockForUpdate()->findOrFail($kelasKuliahId);

            $problems = $this->validator->validateAddClass($registration->fresh(), $kelasKuliah);
            if (! empty($problems)) {
                throw ValidationException::withMessages(['class' => $problems]);
            }

            $item = $registration->items()->create([
                'kelas_kuliah_id' => $kelasKuliah->id,
                'mata_kuliah_id' => $kelasKuliah->mata_kuliah_id,
                'kurikulum_mata_kuliah_id' => $this->findCurriculumCourseId($registration, $kelasKuliah),
                'sks_snapshot' => $kelasKuliah->mataKuliah->sks,
                'status' => 'active',
            ]);

            $this->audit->log($registration, 'COURSE_ADDED', null, ['kelas_kuliah_id' => $kelasKuliah->id, 'item_id' => $item->id]);

            return $registration->fresh('items');
        });
    }

    private function findCurriculumCourseId(StudentCourseRegistration $registration, KelasKuliah $kelasKuliah): ?int
    {
        if (! $registration->kurikulum_id) {
            return null;
        }

        return \App\Models\KurikulumMataKuliah::where('kurikulum_id', $registration->kurikulum_id)
            ->where('mata_kuliah_id', $kelasKuliah->mata_kuliah_id)
            ->value('id');
    }

    public function removeClass(StudentCourseRegistration $registration, int $itemId): StudentCourseRegistration
    {
        return DB::transaction(function () use ($registration, $itemId) {
            if (! $registration->canBeEdited()) {
                throw ValidationException::withMessages(['registration' => 'KRS ini tidak dapat diedit pada status saat ini.']);
            }

            $item = $registration->items()->where('status', 'active')->findOrFail($itemId);
            $item->update(['status' => 'cancelled']);

            $this->audit->log($registration, 'COURSE_REMOVED', ['item_id' => $item->id], null);

            return $registration->fresh('items');
        });
    }

    /**
     * @throws ValidationException
     */
    public function submit(StudentCourseRegistration $registration): StudentCourseRegistration
    {
        return DB::transaction(function () use ($registration) {
            $registration = StudentCourseRegistration::with('items', 'periodeKrs')->lockForUpdate()->findOrFail($registration->id);

            if (! $registration->canBeEdited()) {
                throw ValidationException::withMessages(['registration' => 'KRS ini tidak dapat diajukan pada status saat ini.']);
            }

            $problems = $this->validator->validateForSubmit($registration);
            if (! empty($problems)) {
                throw ValidationException::withMessages(['submit' => $problems]);
            }

            $before = ['status' => $registration->status];
            $registration->update(['status' => 'submitted', 'submitted_at' => now()]);
            $this->audit->log($registration, 'KRS_SUBMITTED', $before, ['status' => 'submitted']);

            return $registration->fresh();
        });
    }

    public function approve(StudentCourseRegistration $registration, User $approver): StudentCourseRegistration
    {
        return DB::transaction(function () use ($registration, $approver) {
            $registration = StudentCourseRegistration::lockForUpdate()->findOrFail($registration->id);
            if (! in_array($registration->status, ['submitted'], true)) {
                throw ValidationException::withMessages(['registration' => 'Hanya KRS berstatus diajukan yang dapat disetujui.']);
            }

            $before = ['status' => $registration->status];
            $registration->update(['status' => 'approved', 'approved_at' => now(), 'approved_by' => $approver->id]);
            $this->audit->log($registration, 'KRS_APPROVED', $before, ['status' => 'approved'], null, $approver->id);

            return $registration->fresh();
        });
    }

    public function reject(StudentCourseRegistration $registration, User $approver, string $reason): StudentCourseRegistration
    {
        return DB::transaction(function () use ($registration, $approver, $reason) {
            $registration = StudentCourseRegistration::lockForUpdate()->findOrFail($registration->id);
            if (! in_array($registration->status, ['submitted'], true)) {
                throw ValidationException::withMessages(['registration' => 'Hanya KRS berstatus diajukan yang dapat ditolak.']);
            }

            $before = ['status' => $registration->status];
            $registration->update(['status' => 'rejected', 'rejected_at' => now(), 'rejected_by' => $approver->id, 'rejection_reason' => $reason]);
            $this->audit->log($registration, 'KRS_REJECTED', $before, ['status' => 'rejected'], $reason, $approver->id);

            return $registration->fresh();
        });
    }

    public function requestRevision(StudentCourseRegistration $registration, User $approver, string $reason): StudentCourseRegistration
    {
        return DB::transaction(function () use ($registration, $approver, $reason) {
            $registration = StudentCourseRegistration::lockForUpdate()->findOrFail($registration->id);
            if (! in_array($registration->status, ['submitted'], true)) {
                throw ValidationException::withMessages(['registration' => 'Hanya KRS berstatus diajukan yang dapat diminta revisi.']);
            }

            $before = ['status' => $registration->status];
            $registration->update(['status' => 'revision', 'rejection_reason' => $reason]);
            $this->audit->log($registration, 'KRS_REVISION_REQUESTED', $before, ['status' => 'revision'], $reason, $approver->id);

            return $registration->fresh();
        });
    }

    public function lock(StudentCourseRegistration $registration, ?User $actor = null): StudentCourseRegistration
    {
        return DB::transaction(function () use ($registration, $actor) {
            $registration = StudentCourseRegistration::lockForUpdate()->findOrFail($registration->id);
            if ($registration->status !== 'approved') {
                throw ValidationException::withMessages(['registration' => 'Hanya KRS yang sudah disetujui dapat dikunci.']);
            }

            $before = ['status' => $registration->status];
            $registration->update(['status' => 'locked', 'locked_at' => now()]);
            $this->audit->log($registration, 'KRS_LOCKED', $before, ['status' => 'locked'], null, $actor?->id);

            return $registration->fresh();
        });
    }

    /**
     * Admin override for a locked registration. Every field change is
     * captured before/after per the audit requirement — this method never
     * mutates directly without logging.
     */
    public function adminOverrideUnlock(StudentCourseRegistration $registration, User $admin, string $reason): StudentCourseRegistration
    {
        return DB::transaction(function () use ($registration, $admin, $reason) {
            $registration = StudentCourseRegistration::lockForUpdate()->findOrFail($registration->id);
            $before = ['status' => $registration->status, 'locked_at' => $registration->locked_at];
            $registration->update(['status' => 'approved', 'locked_at' => null]);
            $this->audit->log($registration, 'KRS_ADMIN_UNLOCK', $before, ['status' => 'approved'], $reason, $admin->id);

            return $registration->fresh();
        });
    }

    public function cancel(StudentCourseRegistration $registration, ?User $actor = null, ?string $reason = null): StudentCourseRegistration
    {
        return DB::transaction(function () use ($registration, $actor, $reason) {
            $registration = StudentCourseRegistration::lockForUpdate()->findOrFail($registration->id);
            $before = ['status' => $registration->status];
            $registration->update(['status' => 'cancelled']);
            $this->audit->log($registration, 'KRS_CANCELLED', $before, ['status' => 'cancelled'], $reason, $actor?->id);

            return $registration->fresh();
        });
    }
}
