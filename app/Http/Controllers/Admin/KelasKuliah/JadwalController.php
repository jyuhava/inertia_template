<?php

namespace App\Http\Controllers\Admin\KelasKuliah;

use App\Http\Controllers\Controller;
use App\Models\JadwalKelasKuliah;
use App\Models\KelasKuliah;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class JadwalController extends Controller
{
    private function validateJadwal(Request $request): array
    {
        return $request->validate([
            'hari' => 'required|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu,Minggu',
            'jam_mulai' => 'required|date_format:H:i',
            'jam_selesai' => 'required|date_format:H:i|after:jam_mulai',
            'ruangan_id' => 'nullable|exists:ruangans,id',
            'tipe_pertemuan' => 'required|in:tatap_muka,daring,hybrid',
            'status' => 'required|in:draft,dipublikasikan,dibatalkan',
            'catatan' => 'nullable|string',
        ]);
    }

    /**
     * Interval-overlap conflict detection (existing_start < new_end AND
     * existing_end > new_start) for room, class, and lecturer — never a
     * naive start_time == start_time comparison.
     */
    private function assertNoConflicts(KelasKuliah $kelasKuliah, array $data, ?int $ignoreId = null): void
    {
        $errors = [];

        if (! empty($data['ruangan_id'])) {
            $roomConflict = JadwalKelasKuliah::overlapping($data['hari'], $data['jam_mulai'], $data['jam_selesai'])
                ->where('ruangan_id', $data['ruangan_id'])
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists();
            if ($roomConflict) {
                $errors['ruangan_id'] = 'Ruangan sudah digunakan kelas lain pada waktu tersebut.';
            }
        }

        $classConflict = JadwalKelasKuliah::overlapping($data['hari'], $data['jam_mulai'], $data['jam_selesai'])
            ->where('kelas_kuliah_id', $kelasKuliah->id)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists();
        if ($classConflict) {
            $errors['hari'] = 'Kelas kuliah ini sudah memiliki jadwal lain yang tumpang tindih.';
        }

        $dosenIds = $kelasKuliah->pengajars()->pluck('dosen_id');
        if ($dosenIds->isNotEmpty()) {
            $lecturerConflict = JadwalKelasKuliah::overlapping($data['hari'], $data['jam_mulai'], $data['jam_selesai'])
                ->whereHas('kelasKuliah.pengajars', fn ($q) => $q->whereIn('dosen_id', $dosenIds))
                ->where('kelas_kuliah_id', '!=', $kelasKuliah->id)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists();
            if ($lecturerConflict) {
                $errors['dosen'] = 'Salah satu dosen pengajar kelas ini sudah memiliki jadwal lain yang tumpang tindih.';
            }
        }

        if (! empty($errors)) {
            throw ValidationException::withMessages($errors);
        }
    }

    public function store(Request $request, KelasKuliah $kelasKuliah)
    {
        $data = $this->validateJadwal($request);
        $this->assertNoConflicts($kelasKuliah, $data);

        $kelasKuliah->jadwals()->create($data);

        return back()->with('success', 'Jadwal berhasil ditambahkan.');
    }

    public function update(Request $request, KelasKuliah $kelasKuliah, JadwalKelasKuliah $jadwal)
    {
        abort_unless($jadwal->kelas_kuliah_id === $kelasKuliah->id, 404);
        $data = $this->validateJadwal($request);
        $this->assertNoConflicts($kelasKuliah, $data, $jadwal->id);

        $jadwal->update($data);

        return back()->with('success', 'Jadwal berhasil diperbarui.');
    }

    public function destroy(KelasKuliah $kelasKuliah, JadwalKelasKuliah $jadwal)
    {
        abort_unless($jadwal->kelas_kuliah_id === $kelasKuliah->id, 404);
        $jadwal->delete();

        return back()->with('success', 'Jadwal berhasil dihapus.');
    }
}
