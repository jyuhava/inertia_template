<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Penilaian extends Model
{
    protected $fillable = [
        'mahasiswa_id',
        'jadwal_kuliah_id',
        'periode_krs_id',
        'nilai_aktivitas',
        'nilai_tugas',
        'nilai_uts',
        'nilai_uas',
        'nilai_akhir',
        'nilai_huruf',
        'nilai_angka',
        'status',
        'catatan'
    ];

    protected $casts = [
        'nilai_aktivitas' => 'decimal:2',
        'nilai_tugas' => 'decimal:2',
        'nilai_uts' => 'decimal:2',
        'nilai_uas' => 'decimal:2',
        'nilai_akhir' => 'decimal:2',
        'nilai_angka' => 'decimal:2',
    ];

    /**
     * Relasi ke Mahasiswa
     */
    public function mahasiswa(): BelongsTo
    {
        return $this->belongsTo(Mahasiswa::class);
    }

    /**
     * Relasi ke JadwalKuliah
     */
    public function jadwalKuliah(): BelongsTo
    {
        return $this->belongsTo(JadwalKuliah::class);
    }

    /**
     * Relasi ke PeriodeKrs
     */
    public function periodeKrs(): BelongsTo
    {
        return $this->belongsTo(PeriodeKrs::class);
    }

    /**
     * Hitung nilai akhir berdasarkan komponen nilai
     *
     * Bobot default: Aktivitas 30%, Tugas 20%, UTS 20%, UAS 30%.
     */
    public function hitungNilaiAkhir($bobotAktivitas = 30, $bobotTugas = 20, $bobotUts = 20, $bobotUas = 30)
    {
        $nilaiAktivitas = $this->nilai_aktivitas ?? 0;
        $nilaiTugas = $this->nilai_tugas ?? 0;
        $nilaiUts = $this->nilai_uts ?? 0;
        $nilaiUas = $this->nilai_uas ?? 0;

        $nilaiAkhir = ($nilaiAktivitas * $bobotAktivitas / 100) +
                      ($nilaiTugas * $bobotTugas / 100) +
                      ($nilaiUts * $bobotUts / 100) +
                      ($nilaiUas * $bobotUas / 100);

        return round($nilaiAkhir, 2);
    }

    /**
     * Konversi nilai angka ke huruf
     */
    public function konversiNilaiHuruf($nilaiAkhir)
    {
        if ($nilaiAkhir >= 85) return 'A';
        if ($nilaiAkhir >= 80) return 'B+';
        if ($nilaiAkhir >= 75) return 'B';
        if ($nilaiAkhir >= 70) return 'C+';
        if ($nilaiAkhir >= 65) return 'C';
        if ($nilaiAkhir >= 60) return 'D';
        return 'E';
    }

    /**
     * Konversi nilai huruf ke angka (untuk IPK)
     */
    public function konversiNilaiAngka($nilaiHuruf)
    {
        return match($nilaiHuruf) {
            'A' => 4.00,
            'B+' => 3.75,
            'B' => 3.00,
            'C+' => 2.75,
            'C' => 2.00,
            'D' => 1.00,
            'E' => 0.00,
            default => 0.00
        };
    }

    /**
     * Update nilai akhir dan konversi otomatis
     */
    public function updateNilaiAkhir($bobotAktivitas = 30, $bobotTugas = 20, $bobotUts = 20, $bobotUas = 30)
    {
        $nilaiAkhir = $this->hitungNilaiAkhir($bobotAktivitas, $bobotTugas, $bobotUts, $bobotUas);
        $nilaiHuruf = $this->konversiNilaiHuruf($nilaiAkhir);
        $nilaiAngka = $this->konversiNilaiAngka($nilaiHuruf);

        $this->update([
            'nilai_akhir' => $nilaiAkhir,
            'nilai_huruf' => $nilaiHuruf,
            'nilai_angka' => $nilaiAngka
        ]);

        return $this;
    }

    /**
     * Scope untuk nilai yang sudah final
     */
    public function scopeFinal($query)
    {
        return $query->where('status', 'final');
    }

    /**
     * Scope untuk nilai draft
     */
    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }
}
