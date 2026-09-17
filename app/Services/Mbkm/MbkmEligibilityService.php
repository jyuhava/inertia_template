<?php

namespace App\Services\Mbkm;

use App\Models\Mahasiswa;
use App\Models\MbkmProgram;

class MbkmEligibilityService
{
    /**
     * Return all server-side eligibility failures. A program target is a
     * whitelist when configured; nullable target fields match every value.
     */
    public function validate(Mahasiswa $mahasiswa, MbkmProgram $program): array
    {
        $problems = [];

        if ($mahasiswa->status !== 'aktif') {
            $problems[] = 'Mahasiswa harus berstatus aktif untuk mendaftar MBKM.';
        }

        if (! $program->isRegistrationOpen()) {
            $problems[] = 'Pendaftaran program MBKM tidak sedang dibuka.';
        }

        if ($program->prodi_id !== null && (int) $program->prodi_id !== (int) $mahasiswa->prodi_id) {
            $problems[] = 'Program MBKM ini tidak tersedia untuk Program Studi mahasiswa.';
        }

        $targets = $program->targets;
        if ($targets->isNotEmpty() && ! $targets->contains(function ($target) use ($mahasiswa) {
            return ($target->prodi_id === null || (int) $target->prodi_id === (int) $mahasiswa->prodi_id)
                && ($target->student_status === null || $target->student_status === $mahasiswa->status);
        })) {
            $problems[] = 'Mahasiswa tidak memenuhi target Program Studi atau status program MBKM ini.';
        }

        return $problems;
    }
}
