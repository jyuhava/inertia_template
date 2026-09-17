<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class KelasKuliah extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'mata_kuliah_id', 'kurikulum_id', 'semester_id',
        'kode_kelas', 'nama_kelas', 'kapasitas', 'tipe_kelas', 'status',
    ];

    public function mataKuliah()
    {
        return $this->belongsTo(MataKuliah::class);
    }

    public function kurikulum()
    {
        return $this->belongsTo(Kurikulum::class);
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class);
    }

    public function pengajars()
    {
        return $this->hasMany(KelasKuliahPengajar::class);
    }

    public function dosens()
    {
        return $this->belongsToMany(Dosen::class, 'kelas_kuliah_pengajars')->withPivot(['peran', 'status'])->withTimestamps();
    }

    public function jadwals()
    {
        return $this->hasMany(JadwalKelasKuliah::class);
    }

    public function pddiktiMapping()
    {
        return $this->morphOne(PddiktiAkademikMapping::class, 'entity', 'entity_type', 'entity_id')
            ->where('entity_type', self::class);
    }

    public function getNamaLengkapAttribute(): string
    {
        return trim(($this->mataKuliah->kode_mata_kuliah ?? '').'-'.$this->kode_kelas);
    }

    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function registrationItems()
    {
        return $this->hasMany(StudentCourseRegistrationItem::class);
    }

    public function meetings()
    {
        return $this->hasMany(CourseMeeting::class, 'kelas_kuliah_id');
    }

    /**
     * Jumlah mahasiswa terdaftar aktif — dihitung dari KRS/enrollment,
     * bukan dari field statis, per aturan modul KRS.
     */
    public function getJumlahTerdaftarAttribute(): int
    {
        return $this->registrationItems()
            ->where('status', 'active')
            ->whereHas('registration', fn ($q) => $q->whereIn('status', ['draft', 'submitted', 'revision', 'approved', 'locked']))
            ->count();
    }

    public function getSisaKapasitasAttribute(): int
    {
        return max($this->kapasitas - $this->jumlah_terdaftar, 0);
    }
}
