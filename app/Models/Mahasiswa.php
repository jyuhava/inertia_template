<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Mahasiswa extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'nim',
        'no_ktp',
        'nisn',
        'npwp',
        'nama_lengkap',
        'jenis_kelamin',
        'tempat_lahir',
        'tanggal_lahir',
        'agama',
        'kewarganegaraan',
        'alamat',
        'no_hp',
        'email',
        'foto',
        'prodi_id',
        'program_studi', // Keep for backward compatibility during migration
        'angkatan',
        'status',
        'surat_komitmen',
        'komitmen_uploaded_at',
    ];

    protected $casts = [
        'tanggal_lahir' => 'date',
        'komitmen_uploaded_at' => 'datetime',
    ];

    /**
     * Get the user that owns the mahasiswa.
     */
    public function user()
    {
        return $this->belongsTo(User::class)->withDefault([
            'name' => '-',
            'email' => '-',
        ]);
    }

    /**
     * Get the prodi that owns the mahasiswa.
     */
    public function prodi()
    {
        return $this->belongsTo(Prodi::class);
    }

    /**
     * Get the display name for jenis kelamin
     */
    public function getJenisKelaminDisplayAttribute()
    {
        return $this->jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan';
    }

    /**
     * Get the display name for status
     */
    public function getStatusDisplayAttribute()
    {
        return match ($this->status) {
            'aktif' => 'Aktif',
            'nonaktif' => 'Nonaktif',
            'lulus' => 'Lulus',
            default => 'Unknown'
        };
    }

    /**
     * Get status badge color
     */
    public function getStatusBadgeColorAttribute()
    {
        return match ($this->status) {
            'aktif' => 'green',
            'nonaktif' => 'red',
            'lulus' => 'blue',
            default => 'gray'
        };
    }

    /**
     * Relasi ke KRS
     */
    public function krs()
    {
        return $this->hasMany(Krs::class);
    }

    /**
     * Get KRS untuk periode tertentu
     */
    public function krsForPeriode($periodeKrsId)
    {
        return $this->krs()->where('periode_krs_id', $periodeKrsId)->diambil();
    }

    /**
     * Relasi ke Penilaian
     */
    public function penilaians()
    {
        return $this->hasMany(Penilaian::class);
    }

    /**
     * Relasi ke Absensi
     */
    public function absensis()
    {
        return $this->hasMany(Absensi::class);
    }

    /**
     * Get persentase kehadiran untuk periode tertentu
     */
    public function getPersentaseKehadiran($periodeKrsId, $jadwalKuliahId = null)
    {
        $query = $this->absensis()->where('periode_krs_id', $periodeKrsId);

        if ($jadwalKuliahId) {
            $query->where('jadwal_kuliah_id', $jadwalKuliahId);
        }

        $totalAbsensi = $query->count();
        $hadirCount = $query->where('status', 'hadir')->count();

        return $totalAbsensi > 0 ? round(($hadirCount / $totalAbsensi) * 100, 1) : 0;
    }

    /**
     * Check if mahasiswa has uploaded surat komitmen
     */
    public function hasUploadedKomitmen()
    {
        return ! empty($this->surat_komitmen) && ! empty($this->komitmen_uploaded_at);
    }

    /**
     * Get surat komitmen file path
     */
    public function getKomitmenFilePath()
    {
        return $this->surat_komitmen ? public_path('uploads/komitmen/'.$this->surat_komitmen) : null;
    }

    /**
     * Get surat komitmen URL
     */
    public function getKomitmenUrl()
    {
        return $this->surat_komitmen ? asset('uploads/komitmen/'.$this->surat_komitmen) : null;
    }

    /**
     * Relasi ke Registrasi (bisa lebih dari satu, misal transfer/re-admisi)
     */
    public function registrasis()
    {
        return $this->hasMany(MahasiswaRegistrasi::class);
    }

    /**
     * Registrasi terakhir/terbaru
     */
    public function registrasiTerbaru()
    {
        return $this->hasOne(MahasiswaRegistrasi::class)->latestOfMany();
    }

    /**
     * Riwayat status mahasiswa
     */
    public function statusHistories()
    {
        return $this->hasMany(MahasiswaStatusHistory::class)->orderByDesc('tanggal_berlaku');
    }

    public function statusTerbaru()
    {
        return $this->hasOne(MahasiswaStatusHistory::class)->latestOfMany('tanggal_berlaku');
    }

    /**
     * Alamat (KTP & domisili)
     */
    public function alamats()
    {
        return $this->hasMany(MahasiswaAlamat::class);
    }

    public function alamatKtp()
    {
        return $this->hasOne(MahasiswaAlamat::class)->where('jenis', 'ktp');
    }

    public function alamatDomisili()
    {
        return $this->hasOne(MahasiswaAlamat::class)->where('jenis', 'domisili');
    }

    /**
     * Kontak
     */
    public function kontaks()
    {
        return $this->hasMany(MahasiswaKontak::class);
    }

    /**
     * Orang tua / wali
     */
    public function orangTuas()
    {
        return $this->hasMany(MahasiswaOrangTua::class);
    }

    public function ayah()
    {
        return $this->hasOne(MahasiswaOrangTua::class)->where('jenis', 'ayah');
    }

    public function ibu()
    {
        return $this->hasOne(MahasiswaOrangTua::class)->where('jenis', 'ibu');
    }

    public function wali()
    {
        return $this->hasOne(MahasiswaOrangTua::class)->where('jenis', 'wali');
    }

    /**
     * Riwayat pendidikan sebelumnya
     */
    public function riwayatPendidikans()
    {
        return $this->hasMany(MahasiswaRiwayatPendidikan::class);
    }

    /**
     * Kebutuhan khusus (bisa lebih dari satu)
     */
    public function kebutuhanKhusus()
    {
        return $this->hasMany(MahasiswaKebutuhanKhusus::class);
    }

    /**
     * Beasiswa / bantuan
     */
    public function beasiswas()
    {
        return $this->hasMany(MahasiswaBeasiswa::class);
    }

    /**
     * Dokumen mahasiswa
     */
    public function dokumens()
    {
        return $this->hasMany(MahasiswaDokumen::class);
    }

    /**
     * Mapping PDDikti
     */
    public function pddiktiMapping()
    {
        return $this->hasOne(PddiktiMahasiswaMapping::class);
    }

    /**
     * Log sinkronisasi PDDikti
     */
    public function pddiktiSyncLogs()
    {
        return $this->hasMany(PddiktiSyncLog::class)->orderByDesc('created_at');
    }

    /**
     * Enrollment (KRS baru) — dibangun di atas Kelas Kuliah, terpisah dari
     * modul `krs`/`jadwal_kuliahs` lama yang masih dipakai Penilaian/Absensi.
     */
    public function studentCourseRegistrations()
    {
        return $this->hasMany(StudentCourseRegistration::class);
    }

    public function advisors()
    {
        return $this->hasMany(StudentAdvisor::class);
    }

    public function advisorAktif()
    {
        return $this->hasOne(StudentAdvisor::class)->where('status', 'aktif')->latestOfMany('tanggal_mulai');
    }

    public function studyResults()
    {
        return $this->hasMany(StudentStudyResult::class);
    }

    public function surveyResponses()
    {
        return $this->hasMany(SurveyResponse::class);
    }

    public function mbkmApplications()
    {
        return $this->hasMany(MbkmApplication::class);
    }

    public function mbkmParticipants()
    {
        return $this->hasMany(MbkmParticipant::class);
    }

    public function theses()
    {
        return $this->hasMany(Thesis::class);
    }
}
