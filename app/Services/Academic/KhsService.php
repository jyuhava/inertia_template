<?php

namespace App\Services\Academic;

use App\Models\GradeScale;
use App\Models\Krs;
use App\Models\Mahasiswa;
use App\Models\Penilaian;
use App\Models\PeriodeKrs;
use App\Models\StudentStudyResult;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class KhsService
{
    public function __construct(private GpaCalculator $gpaCalculator) {}

    public function publish(Mahasiswa $mahasiswa, PeriodeKrs $periode, int $userId): StudentStudyResult
    {
        return DB::transaction(function () use ($mahasiswa, $periode, $userId) {
            $result = StudentStudyResult::firstOrCreate(['mahasiswa_id' => $mahasiswa->id, 'periode_krs_id' => $periode->id]);
            if ($result->status === 'locked') {
                throw ValidationException::withMessages(['khs' => 'KHS yang dikunci tidak dapat diubah.']);
            }
            $grades = Penilaian::with('jadwalKuliah.mataKuliah')
                ->where('mahasiswa_id', $mahasiswa->id)->where('periode_krs_id', $periode->id)->where('status', 'final')
                ->whereNotNull('nilai_akhir')->get();
            if ($grades->isEmpty()) {
                throw ValidationException::withMessages(['khs' => 'Tidak ada nilai final untuk diterbitkan.']);
            }
            $result->items()->delete();
            foreach ($grades as $grade) {
                $course = $grade->jadwalKuliah?->mataKuliah;
                $legacyKrs = Krs::where(['mahasiswa_id' => $mahasiswa->id, 'periode_krs_id' => $periode->id, 'jadwal_kuliah_id' => $grade->jadwal_kuliah_id])->where('status', 'disetujui')->first();
                if (! $course || ! $legacyKrs) {
                    continue;
                }
                $scale = GradeScale::where('is_active', true)->where('minimum_score', '<=', $grade->nilai_akhir)->where('maximum_score', '>=', $grade->nilai_akhir)->orderByDesc('minimum_score')->first();
                $result->items()->create(['krs_id' => $legacyKrs->id, 'penilaian_id' => $grade->id, 'mata_kuliah_id' => $course->id, 'jadwal_kuliah_id' => $grade->jadwal_kuliah_id, 'credits' => $course->sks, 'grade_numeric' => $grade->nilai_akhir, 'grade' => $scale?->code ?? $grade->nilai_huruf ?? '-', 'grade_point' => $scale?->grade_point ?? $grade->nilai_angka ?? 0]);
            }
            $summary = $this->gpaCalculator->calculate($result->items()->get());
            $cumulative = $this->gpaCalculator->calculate(
                $mahasiswa->studyResults()->whereIn('status', ['published', 'locked'])->with('items')->get()->flatMap->items
            );
            $result->update(['status' => 'published', 'total_courses' => $result->items()->count(), 'total_credits' => $summary['credits'], 'earned_credits' => $result->items()->where('grade_point', '>', 0)->sum('credits'), 'semester_gpa' => $summary['gpa'], 'cumulative_gpa' => $cumulative['gpa'], 'published_at' => now(), 'published_by' => $userId]);

            return $result->fresh('items.mataKuliah');
        });
    }

    public function lock(StudentStudyResult $result): void
    {
        if ($result->status !== 'published') {
            throw ValidationException::withMessages(['khs' => 'Hanya KHS published yang dapat dikunci.']);
        } $result->update(['status' => 'locked', 'locked_at' => now()]);
        $result->items()->update(['status' => 'locked']);
    }
}
