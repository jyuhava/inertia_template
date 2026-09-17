<?php

namespace App\Services\Academic;

use App\Models\Absensi;
use App\Models\AttendanceAudit;
use App\Models\CourseMeeting;
use App\Models\KelasKuliah;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AttendanceService
{
    public function open(KelasKuliah $class, array $data, int $userId): CourseMeeting
    {
        return DB::transaction(function () use ($class, $data, $userId) {
            $meeting = CourseMeeting::create($data + ['kelas_kuliah_id' => $class->id, 'status' => 'open', 'created_by' => $userId]);
            $class->registrationItems()->with('registration')->where('status', 'active')->get()->filter(fn ($item) => in_array($item->registration->status, ['approved', 'locked']))->each(fn ($item) => Absensi::create(['course_meeting_id' => $meeting->id, 'registration_item_id' => $item->id, 'mahasiswa_id' => $item->registration->mahasiswa_id, 'periode_krs_id' => $item->registration->periode_krs_id, 'tanggal' => $meeting->meeting_date, 'jam_mulai' => $meeting->start_time, 'jam_selesai' => $meeting->end_time, 'status' => 'tidak_hadir', 'attendance_status' => 'absent', 'created_by' => $userId, 'recorded_by' => $userId]));

            return $meeting->load('attendances.mahasiswa');
        });
    }

    public function record(CourseMeeting $meeting, array $rows, int $userId, ?string $reason = null): void
    {
        if ($meeting->status !== 'open') {
            throw ValidationException::withMessages(['meeting' => 'Presensi hanya dapat diubah saat pertemuan dibuka.']);
        }
        DB::transaction(function () use ($meeting, $rows, $userId, $reason) {
            foreach ($rows as $row) {
                $attendance = $meeting->attendances()->where('mahasiswa_id', $row['mahasiswa_id'])->firstOrFail();
                $before = $attendance->only(['status', 'attendance_status', 'keterangan']);
                $status = $row['status'];
                $attendance->update(['status' => match ($status) {
                    'present', 'late' => 'hadir', 'excused' => 'izin', 'sick' => 'sakit', default => 'tidak_hadir'
                }, 'attendance_status' => $status, 'keterangan' => $row['notes'] ?? null, 'recorded_by' => $userId, 'check_in_at' => in_array($status, ['present', 'late']) ? now() : null]);
                AttendanceAudit::create(['absensi_id' => $attendance->id, 'user_id' => $userId, 'action' => 'recorded', 'before' => $before, 'after' => $attendance->only(['status', 'attendance_status', 'keterangan']), 'reason' => $reason]);
            }
        });
    }

    public function complete(CourseMeeting $meeting, int $userId): void
    {
        if ($meeting->status !== 'open') {
            throw ValidationException::withMessages(['meeting' => 'Hanya presensi terbuka yang dapat ditutup.']);
        } $meeting->update(['status' => 'completed', 'updated_by' => $userId]);
    }
}
