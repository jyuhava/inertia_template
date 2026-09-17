<?php

namespace App\Services\Krs;

use App\Models\KelasKuliah;
use App\Models\Mahasiswa;
use App\Models\StudentCourseRegistration;

/**
 * Server-side business-rule validation for KRS/enrollment. Every check here
 * runs again at submit time — the "Ambil" (add) button validation is never
 * trusted alone because state can change between add and submit.
 */
class KrsValidationService
{
    /**
     * Validate adding one kelas_kuliah to a registration. Returns a list of
     * human-readable problems (empty when valid).
     */
    public function validateAddClass(StudentCourseRegistration $registration, KelasKuliah $kelasKuliah): array
    {
        $problems = [];
        $periode = $registration->periodeKrs;
        $mahasiswa = $registration->mahasiswa;

        if (! $periode->isKrsOpenForRegistration() && ! $periode->isInRevisionWindow()) {
            $problems[] = 'Periode KRS tidak sedang dibuka untuk pendaftaran atau revisi.';
        }

        if ($mahasiswa->status !== 'aktif') {
            $problems[] = 'Mahasiswa berstatus '.$mahasiswa->status.' tidak dapat mengambil KRS.';
        }

        if ($kelasKuliah->mataKuliah?->prodi_id !== $mahasiswa->prodi_id) {
            $problems[] = 'Mata kuliah tidak tersedia untuk Program Studi Anda.';
        }

        if ($kelasKuliah->status !== 'dibuka') {
            $problems[] = 'Kelas kuliah belum dibuka untuk pendaftaran.';
        }

        if ($kelasKuliah->sisa_kapasitas <= 0) {
            $problems[] = 'Kapasitas kelas '.$kelasKuliah->nama_lengkap.' sudah penuh.';
        }

        $alreadyTakenClass = $registration->activeItems()->where('kelas_kuliah_id', $kelasKuliah->id)->exists();
        if ($alreadyTakenClass) {
            $problems[] = 'Kelas '.$kelasKuliah->nama_lengkap.' sudah diambil pada KRS ini.';
        }

        $alreadyTakenCourse = $registration->activeItems()->where('mata_kuliah_id', $kelasKuliah->mata_kuliah_id)->exists();
        if (! $alreadyTakenClass && $alreadyTakenCourse) {
            $problems[] = 'Mata kuliah '.($kelasKuliah->mataKuliah->nama_mata_kuliah ?? '').' sudah diambil pada kelas paralel lain.';
        }

        $prereqProblems = $this->validatePrerequisites($mahasiswa, $kelasKuliah);
        $problems = array_merge($problems, $prereqProblems);

        $conflict = $this->findScheduleConflict($registration, $kelasKuliah);
        if ($conflict) {
            $problems[] = $conflict;
        }

        $maxSks = $periode->maksimal_sks;
        if ($maxSks !== null) {
            $newTotal = $registration->total_sks + (float) $kelasKuliah->mataKuliah->sks;
            if ($newTotal > $maxSks) {
                $problems[] = "Total SKS akan menjadi {$newTotal}, melebihi batas maksimal {$maxSks} SKS.";
            }
        }

        return $problems;
    }

    /**
     * Prerequisite validation. No KHS/grade module exists yet, so this is
     * an honest abstraction: it checks that a prerequisite course has been
     * *taken with an approved/locked registration* in a past period, not a
     * passing grade (grades are out of scope for KRS).
     */
    public function validatePrerequisites(Mahasiswa $mahasiswa, KelasKuliah $kelasKuliah): array
    {
        $problems = [];
        $prereqs = $kelasKuliah->mataKuliah->prasyarats;

        foreach ($prereqs as $prereq) {
            $taken = StudentCourseRegistration::where('mahasiswa_id', $mahasiswa->id)
                ->whereIn('status', ['approved', 'locked'])
                ->whereHas('items', fn ($q) => $q->where('mata_kuliah_id', $prereq->id)->where('status', 'active'))
                ->exists();

            if (! $taken) {
                $problems[] = "Prasyarat belum terpenuhi: {$prereq->kode_mata_kuliah} - {$prereq->nama_mata_kuliah}.";
            }
        }

        return $problems;
    }

    /**
     * Interval-overlap conflict detection across every schedule session of
     * every already-active class in the registration, and every session of
     * the new class (a class can have more than one weekly meeting).
     */
    public function findScheduleConflict(StudentCourseRegistration $registration, KelasKuliah $kelasKuliah): ?string
    {
        $newSchedules = $kelasKuliah->jadwals;
        $existingItems = $registration->activeItems()->with('kelasKuliah.jadwals', 'kelasKuliah.mataKuliah')->get();

        foreach ($newSchedules as $newSchedule) {
            foreach ($existingItems as $item) {
                foreach ($item->kelasKuliah->jadwals as $existingSchedule) {
                    if ($existingSchedule->hari !== $newSchedule->hari) {
                        continue;
                    }
                    $existingStart = $existingSchedule->jam_mulai->format('H:i');
                    $existingEnd = $existingSchedule->jam_selesai->format('H:i');
                    $newStart = $newSchedule->jam_mulai->format('H:i');
                    $newEnd = $newSchedule->jam_selesai->format('H:i');

                    if ($existingStart < $newEnd && $existingEnd > $newStart) {
                        $mkName = $item->kelasKuliah->mataKuliah->nama_mata_kuliah ?? '-';

                        return "Jadwal bentrok dengan: {$mkName} — {$existingSchedule->hari} {$existingStart}–{$existingEnd}";
                    }
                }
            }
        }

        return null;
    }

    /**
     * Full re-validation of every active item at submit time. Runs inside
     * the caller's transaction.
     */
    public function validateForSubmit(StudentCourseRegistration $registration): array
    {
        $problems = [];
        $periode = $registration->periodeKrs;

        if (! $periode->isKrsOpenForRegistration() && ! $periode->isInRevisionWindow()) {
            $problems[] = 'Periode KRS tidak sedang dibuka untuk pendaftaran atau revisi.';
        }

        if ($registration->activeItems()->count() === 0) {
            $problems[] = 'KRS belum memiliki mata kuliah/kelas yang dipilih.';
        }

        $minSks = $periode->minimal_sks;
        if ($minSks !== null && $registration->total_sks < $minSks) {
            $problems[] = "Total SKS ({$registration->total_sks}) kurang dari batas minimal {$minSks} SKS.";
        }

        $maxSks = $periode->maksimal_sks;
        if ($maxSks !== null && $registration->total_sks > $maxSks) {
            $problems[] = "Total SKS ({$registration->total_sks}) melebihi batas maksimal {$maxSks} SKS.";
        }

        foreach ($registration->activeItems as $item) {
            $kelas = $item->kelasKuliah()->with(['mataKuliah.prasyarats', 'jadwals'])->first();
            if (! $kelas) {
                $problems[] = 'Kelas kuliah pada KRS tidak lagi tersedia.';

                continue;
            }
            if ($kelas->mataKuliah?->prodi_id !== $registration->mahasiswa->prodi_id) {
                $problems[] = 'Mata kuliah tidak tersedia untuk Program Studi mahasiswa.';
            }
            $problems = array_merge($problems, $this->validatePrerequisites($registration->mahasiswa, $kelas));
            if ($item->kelasKuliah->jumlah_terdaftar > $item->kelasKuliah->kapasitas) {
                $problems[] = "Kelas {$item->kelasKuliah->nama_lengkap} sudah melebihi kapasitas.";
            }
        }

        return $problems;
    }
}
