<?php

namespace App\Services\Thesis;

use App\Models\Dosen;
use App\Models\Mahasiswa;
use App\Models\StudentCourseRegistrationItem;
use App\Models\StudentStudyResult;
use App\Models\Thesis;
use App\Models\ThesisDocument;
use App\Models\ThesisEvent;
use App\Models\ThesisRevision;
use App\Models\ThesisSupervisor;
use App\Models\ThesisType;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ThesisService
{
    public function __construct(private ThesisEligibilityService $eligibility, private ThesisAuditService $audit) {}

    public function create(Mahasiswa $mahasiswa, ThesisType $type, ?int $semesterId = null, ?int $kurikulumId = null, ?User $actor = null): Thesis
    {
        return DB::transaction(function () use ($mahasiswa, $type, $semesterId, $kurikulumId, $actor) {
            $this->ensureEligible($mahasiswa);
            if ($type->is_active === false || ($type->prodi_id !== null && (int) $type->prodi_id !== (int) $mahasiswa->prodi_id)) {
                throw ValidationException::withMessages(['thesis_type_id' => 'Jenis tugas akhir tidak tersedia untuk Program Studi Anda.']);
            }
            if ($mahasiswa->theses()->whereNotIn('status', ['completed', 'cancelled', 'withdrawn'])->exists()) {
                throw ValidationException::withMessages(['thesis' => 'Mahasiswa masih memiliki tugas akhir yang aktif.']);
            }
            $thesis = Thesis::create(['mahasiswa_id' => $mahasiswa->id, 'prodi_id' => $mahasiswa->prodi_id, 'semester_id' => $semesterId, 'kurikulum_id' => $kurikulumId, 'thesis_type_id' => $type->id, 'status' => 'draft']);
            $this->audit->log($thesis, 'THESIS_CREATED', null, ['status' => 'draft'], null, $actor?->id);

            return $thesis;
        });
    }

    public function submitTitle(Thesis $thesis, array $attributes, ?User $actor = null): \App\Models\ThesisTitleSubmission
    {
        return DB::transaction(function () use ($thesis, $attributes, $actor) {
            $thesis = Thesis::lockForUpdate()->findOrFail($thesis->id);
            if (! in_array($thesis->status, ['draft', 'submitted', 'title_revision'], true)) {
                throw ValidationException::withMessages(['thesis' => 'Judul tidak dapat diajukan pada tahap tugas akhir saat ini.']);
            }
            $submission = $thesis->titleSubmissions()->create(array_merge($attributes, [
                'version' => ((int) $thesis->titleSubmissions()->max('version')) + 1,
                'status' => 'submitted',
            ]));
            $before = ['status' => $thesis->status];
            $thesis->update(['status' => 'under_review']);
            $this->audit->log($submission, 'TITLE_SUBMITTED', null, ['version' => $submission->version, 'title' => $submission->title], null, $actor?->id);
            $this->audit->log($thesis, 'TITLE_SENT_FOR_REVIEW', $before, ['status' => 'under_review'], null, $actor?->id);

            return $submission;
        });
    }

    /** Similar titles are review assistance, never an automatic rejection. */
    public function similarTitles(Thesis $thesis, string $title): array
    {
        $terms = collect(preg_split('/\s+/', mb_strtolower($title)))->filter(fn ($term) => mb_strlen($term) >= 4)->take(3);
        if ($terms->isEmpty()) {
            return [];
        }

        return Thesis::query()->whereKeyNot($thesis->id)->whereNotNull('title')
            ->where(function ($query) use ($terms) {
                foreach ($terms as $term) {
                    $query->orWhereRaw('LOWER(title) LIKE ?', ['%'.$term.'%']);
                }
            })->limit(5)->pluck('title')->all();
    }

    public function reviewTitle(\App\Models\ThesisTitleSubmission $submission, string $decision, ?string $comment, ?string $selectedTitle, User $actor): Thesis
    {
        return DB::transaction(function () use ($submission, $decision, $comment, $selectedTitle, $actor) {
            $submission = $submission->newQuery()->with('thesis')->lockForUpdate()->findOrFail($submission->id);
            if ($submission->status !== 'submitted') {
                throw ValidationException::withMessages(['title_submission' => 'Pengajuan judul ini sudah ditinjau.']);
            }
            $thesis = $submission->thesis;
            $before = ['status' => $thesis->status, 'title' => $thesis->title];
            $data = ['status' => $decision, 'review_comment' => $comment, 'reviewed_by' => $actor->id, 'reviewed_at' => now()];
            if ($decision === 'approved') {
                $candidateTitles = array_filter(array_merge([$submission->title], $submission->alternate_titles ?? []));
                $selectedTitle ??= $submission->title;
                if (! in_array($selectedTitle, $candidateTitles, true)) {
                    throw ValidationException::withMessages(['selected_title' => 'Judul yang dipilih harus berasal dari usulan mahasiswa.']);
                }
                $data['status'] = 'approved';
                $thesis->update(['title' => $selectedTitle, 'status' => 'title_approved']);
            } else {
                $thesis->update(['status' => 'title_revision']);
            }
            $submission->update($data);
            $this->audit->log($submission, 'TITLE_REVIEWED', ['status' => 'submitted'], ['status' => $data['status']], $comment, $actor->id);
            $this->audit->log($thesis, 'TITLE_STATUS_CHANGED', $before, ['status' => $thesis->status, 'title' => $thesis->title], $comment, $actor->id);

            return $thesis->fresh();
        });
    }

    public function proposeSupervisor(Thesis $thesis, int $dosenId, string $role, User $actor): ThesisSupervisor
    {
        return $this->assignSupervisor($thesis, $dosenId, $role, $actor, false);
    }

    public function assignSupervisor(Thesis $thesis, int $dosenId, string $role, User $actor, bool $activate = true): ThesisSupervisor
    {
        if (! in_array($role, ['pembimbing_1', 'pembimbing_2'], true)) {
            throw ValidationException::withMessages(['role' => 'Peran pembimbing tidak valid.']);
        }

        return DB::transaction(function () use ($thesis, $dosenId, $role, $actor, $activate) {
            $thesis = Thesis::lockForUpdate()->findOrFail($thesis->id);
            $dosen = Dosen::lockForUpdate()->findOrFail($dosenId);
            if ($dosen->status !== 'aktif') {
                throw ValidationException::withMessages(['dosen_id' => 'Dosen pembimbing harus berstatus aktif.']);
            }
            $capacity = $thesis->prodi->thesisSetting?->supervisor_capacity;
            if ($capacity !== null && $dosen->thesisSupervisors()->whereIn('status', ['proposed', 'approved', 'active'])->count() >= $capacity) {
                throw ValidationException::withMessages(['dosen_id' => 'Kuota bimbingan dosen sudah penuh.']);
            }
            $thesis->supervisors()->where('role', $role)->whereIn('status', ['proposed', 'approved', 'active'])->update(['status' => 'replaced', 'ended_at' => now()]);
            $supervisor = $thesis->supervisors()->create(['dosen_id' => $dosen->id, 'role' => $role, 'status' => $activate ? 'active' : 'proposed', 'appointed_at' => now(), 'appointed_by' => $actor->id]);
            if ($thesis->status === 'title_approved') {
                $thesis->update(['status' => 'supervisor_assignment']);
            }
            $this->audit->log($supervisor, $activate ? 'SUPERVISOR_ASSIGNED' : 'SUPERVISOR_PROPOSED', null, ['dosen_id' => $dosen->id, 'role' => $role], null, $actor->id);

            return $supervisor;
        });
    }

    public function approveSupervisor(ThesisSupervisor $supervisor, Dosen $dosen, User $actor): ThesisSupervisor
    {
        return DB::transaction(function () use ($supervisor, $dosen, $actor) {
            $supervisor = ThesisSupervisor::lockForUpdate()->findOrFail($supervisor->id);
            if ($supervisor->dosen_id !== $dosen->id || $supervisor->status !== 'proposed') {
                throw ValidationException::withMessages(['supervisor' => 'Usulan pembimbing tidak dapat disetujui.']);
            }
            $supervisor->update(['status' => 'active', 'appointed_at' => now()]);
            $this->audit->log($supervisor, 'SUPERVISOR_APPROVED', ['status' => 'proposed'], ['status' => 'active'], null, $actor->id);

            return $supervisor->fresh();
        });
    }

    public function submitSession(Thesis $thesis, Mahasiswa $mahasiswa, int $supervisorId, array $attributes, ?User $actor = null): \App\Models\ThesisSupervisionSession
    {
        if ($thesis->mahasiswa_id !== $mahasiswa->id) {
            throw ValidationException::withMessages(['thesis' => 'Tugas akhir bukan milik mahasiswa.']);
        }
        $supervisor = $thesis->activeSupervisors()->find($supervisorId);
        if (! $supervisor) {
            throw ValidationException::withMessages(['thesis_supervisor_id' => 'Pembimbing tidak aktif pada tugas akhir ini.']);
        }
        $session = $thesis->sessions()->create(array_merge($attributes, ['thesis_supervisor_id' => $supervisor->id, 'status' => 'submitted']));
        $this->audit->log($session, 'SUPERVISION_SUBMITTED', null, ['meeting_date' => $session->meeting_date?->toDateString()], null, $actor?->id);

        return $session;
    }

    public function reviewSession(\App\Models\ThesisSupervisionSession $session, Dosen $dosen, string $feedback, string $status, User $actor): \App\Models\ThesisSupervisionSession
    {
        $session->loadMissing('supervisor');
        if ($session->supervisor->dosen_id !== $dosen->id || $session->supervisor->status !== 'active') {
            throw ValidationException::withMessages(['session' => 'Anda bukan pembimbing aktif untuk sesi ini.']);
        }
        if (! in_array($status, ['reviewed', 'revision'], true)) {
            throw ValidationException::withMessages(['status' => 'Status review bimbingan tidak valid.']);
        }
        $before = ['status' => $session->status];
        $session->update(['feedback' => $feedback, 'status' => $status, 'reviewed_by' => $actor->id, 'reviewed_at' => now()]);
        $this->audit->log($session, 'SUPERVISION_REVIEWED', $before, ['status' => $status], $feedback, $actor->id);

        return $session->fresh();
    }

    public function uploadDocument(Thesis $thesis, string $type, string $path, ?string $originalName, User $actor): ThesisDocument
    {
        return DB::transaction(function () use ($thesis, $type, $path, $originalName, $actor) {
            $version = ((int) $thesis->documents()->where('type', $type)->max('version')) + 1;
            $document = $thesis->documents()->create(['type' => $type, 'version' => $version, 'file_path' => $path, 'original_name' => $originalName, 'uploaded_by' => $actor->id]);
            if ($type === 'proposal' && in_array($thesis->status, ['supervisor_assignment', 'title_approved'], true)) {
                $thesis->update(['status' => 'proposal']);
            }
            $this->audit->log($document, 'DOCUMENT_UPLOADED', null, ['type' => $type, 'version' => $version], null, $actor->id);

            return $document;
        });
    }

    public function reviewProposal(Thesis $thesis, Dosen $dosen, string $decision, ?string $comment, User $actor): Thesis
    {
        if (! $thesis->activeSupervisors()->where('dosen_id', $dosen->id)->exists()) {
            throw ValidationException::withMessages(['thesis' => 'Anda bukan pembimbing aktif tugas akhir ini.']);
        }
        if (! in_array($decision, ['approved', 'revision', 'rejected'], true)) {
            throw ValidationException::withMessages(['decision' => 'Keputusan proposal tidak valid.']);
        }
        $before = ['status' => $thesis->status];
        $thesis->update(['status' => $decision === 'approved' ? 'proposal_approved' : 'proposal']);
        $this->audit->log($thesis, 'PROPOSAL_REVIEWED', $before, ['status' => $thesis->status], $comment, $actor->id);

        return $thesis->fresh();
    }

    public function scheduleEvent(Thesis $thesis, string $kind, Carbon|string $scheduledAt, Carbon|string|null $endsAt, array $examinerIds, User $actor): ThesisEvent
    {
        if (! in_array($kind, ['seminar_proposal', 'result_seminar', 'defense'], true)) {
            throw ValidationException::withMessages(['kind' => 'Jenis kegiatan tugas akhir tidak valid.']);
        }
        $start = Carbon::parse($scheduledAt);
        $end = $endsAt ? Carbon::parse($endsAt) : $start->copy()->addHours(2);
        if ($end->lte($start)) {
            throw ValidationException::withMessages(['ends_at' => 'Waktu selesai harus setelah waktu mulai.']);
        }
        $examinerIds = array_values(array_unique(array_map('intval', $examinerIds)));
        if (count($examinerIds) !== Dosen::whereIn('id', $examinerIds)->count()) {
            throw ValidationException::withMessages(['examiner_ids' => 'Penguji tidak ditemukan.']);
        }

        return DB::transaction(function () use ($thesis, $kind, $start, $end, $examinerIds, $actor) {
            $candidates = ThesisEvent::whereNotIn('status', ['cancelled'])->where('scheduled_at', '<', $end)->get();
            foreach ($candidates as $event) {
                $eventEnd = $event->ends_at ?? $event->scheduled_at->copy()->addHours(2);
                if ($event->scheduled_at->lt($end) && $eventEnd->gt($start) && array_intersect($examinerIds, $event->examiner_ids ?? [])) {
                    throw ValidationException::withMessages(['scheduled_at' => 'Jadwal penguji bentrok dengan seminar atau sidang lain.']);
                }
            }
            $event = $thesis->events()->create(['kind' => $kind, 'scheduled_at' => $start, 'ends_at' => $end, 'examiner_ids' => $examinerIds, 'scheduled_by' => $actor->id]);
            $status = ['seminar_proposal' => 'seminar_proposal', 'result_seminar' => 'result_seminar', 'defense' => 'thesis_defense'][$kind];
            $thesis->update(['status' => $status]);
            $this->audit->log($event, 'EVENT_SCHEDULED', null, ['kind' => $kind, 'scheduled_at' => $start->toDateTimeString()], null, $actor->id);

            return $event;
        });
    }

    public function submitRevision(Thesis $thesis, array $items, ?User $actor = null): ThesisRevision
    {
        if ($items === []) {
            throw ValidationException::withMessages(['items' => 'Minimal satu butir revisi harus diisi.']);
        }

        return DB::transaction(function () use ($thesis, $items, $actor) {
            $revision = $thesis->revisions()->create(['items' => array_values($items), 'status' => 'submitted']);
            $thesis->update(['status' => 'revision']);
            $this->audit->log($revision, 'REVISION_SUBMITTED', null, ['items' => $items], null, $actor?->id);

            return $revision;
        });
    }

    public function reviewRevision(ThesisRevision $revision, string $decision, ?string $comment, User $actor): Thesis
    {
        if (! in_array($decision, ['verified', 'revision'], true)) {
            throw ValidationException::withMessages(['decision' => 'Keputusan revisi tidak valid.']);
        }

        return DB::transaction(function () use ($revision, $decision, $comment, $actor) {
            $revision = ThesisRevision::with('thesis')->lockForUpdate()->findOrFail($revision->id);
            if ($revision->status !== 'submitted') {
                throw ValidationException::withMessages(['revision' => 'Revisi ini sudah ditinjau.']);
            }
            $revision->update(['status' => $decision, 'review_comment' => $comment, 'reviewed_by' => $actor->id, 'reviewed_at' => now()]);
            $revision->thesis->update(['status' => $decision === 'verified' ? 'revision_verified' : 'revision']);
            $this->audit->log($revision, 'REVISION_REVIEWED', ['status' => 'submitted'], ['status' => $decision], $comment, $actor->id);

            return $revision->thesis->fresh();
        });
    }

    public function finalize(Thesis $thesis, string $grade, float $gradePoint, User $actor): Thesis
    {
        return DB::transaction(function () use ($thesis, $grade, $gradePoint, $actor) {
            $thesis = Thesis::with('type')->lockForUpdate()->findOrFail($thesis->id);
            if ($thesis->status !== 'revision_verified') {
                throw ValidationException::withMessages(['thesis' => 'Revisi tugas akhir harus diverifikasi sebelum finalisasi.']);
            }
            if (! $thesis->documents()->where('type', 'final')->exists()) {
                throw ValidationException::withMessages(['document' => 'Dokumen akhir harus diunggah sebelum finalisasi.']);
            }
            $before = ['status' => $thesis->status, 'final_grade' => $thesis->final_grade];
            $thesis->update(['status' => 'completed', 'final_grade' => $grade, 'final_grade_point' => $gradePoint, 'grade_locked_at' => now(), 'completed_at' => now(), 'finalized_at' => now()]);
            $this->syncStudyResult($thesis);
            $this->audit->log($thesis, 'THESIS_FINALIZED', $before, ['status' => 'completed', 'final_grade' => $grade, 'grade_locked_at' => $thesis->grade_locked_at], null, $actor->id);

            return $thesis->fresh();
        });
    }

    private function syncStudyResult(Thesis $thesis): void
    {
        $courseId = $thesis->type?->mata_kuliah_id;
        if (! $courseId) {
            return;
        }
        $item = StudentCourseRegistrationItem::with('registration')->where('mata_kuliah_id', $courseId)
            ->where('status', 'active')
            ->whereHas('registration', fn ($query) => $query->where('mahasiswa_id', $thesis->mahasiswa_id)->whereIn('status', ['approved', 'locked'])->when($thesis->semester_id, fn ($q) => $q->whereHas('periodeKrs', fn ($p) => $p->where('semester_id', $thesis->semester_id))))
            ->latest()->first();
        if (! $item) {
            return;
        }
        $result = StudentStudyResult::firstOrCreate(['mahasiswa_id' => $thesis->mahasiswa_id, 'periode_krs_id' => $item->registration->periode_krs_id], ['kurikulum_id' => $thesis->kurikulum_id, 'status' => 'draft']);
        if ($result->status === 'locked') {
            throw ValidationException::withMessages(['study_result' => 'KHS terkait sudah dikunci dan tidak dapat diperbarui.']);
        }
        $resultItem = $result->items()->firstOrNew(['registration_item_id' => $item->id]);
        $resultItem->fill(['mata_kuliah_id' => $item->mata_kuliah_id, 'kelas_kuliah_id' => $item->kelas_kuliah_id, 'credits' => $item->sks_snapshot, 'grade' => $thesis->final_grade, 'grade_point' => $thesis->final_grade_point, 'status' => $result->status === 'published' ? 'published' : 'locked']);
        $resultItem->save();
        $items = $result->items()->get();
        $credits = (float) $items->sum('credits');
        $qualityPoints = (float) $items->sum(fn ($studyItem) => (float) $studyItem->credits * (float) $studyItem->grade_point);
        $result->update(['total_courses' => $items->count(), 'total_credits' => $credits, 'earned_credits' => (float) $items->where('grade_point', '>', 0)->sum('credits'), 'semester_gpa' => $credits > 0 ? round($qualityPoints / $credits, 2) : null]);
    }

    private function ensureEligible(Mahasiswa $mahasiswa): void
    {
        $problems = $this->eligibility->validate($mahasiswa);
        if ($problems !== []) {
            throw ValidationException::withMessages(['eligibility' => $problems]);
        }
    }
}
