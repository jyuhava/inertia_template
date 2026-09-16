<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Dosen extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'nip',
        'nik',
        'nidn',
        'nidk',
        'nuptk',
        'npwp',
        'nama_lengkap',
        'gelar_depan',
        'gelar_belakang',
        'jenis_kelamin',
        'tempat_lahir',
        'tanggal_lahir',
        'alamat',
        'no_hp',
        'email',
        'telepon',
        'kontak_darurat',
        'foto',
        'agama',
        'kewarganegaraan',
        'pendidikan_terakhir',
        'bidang_keahlian',
        'jabatan_akademik',
        'status',
        'status_kepegawaian',
    ];

    protected $casts = [
        'tanggal_lahir' => 'date',
    ];

    /**
     * Get the user that owns the dosen.
     */
    public function user()
    {
        return $this->belongsTo(User::class)->withDefault([
            'name' => '-',
            'email' => '-',
        ]);
    }

    /**
     * Get the jadwal kuliahs for the dosen.
     */
    public function jadwalKuliahs()
    {
        return $this->hasMany(JadwalKuliah::class);
    }

    public function alamats()
    {
        return $this->hasMany(DosenAlamat::class);
    }

    public function alamatKtp()
    {
        return $this->hasOne(DosenAlamat::class)->where('jenis', 'ktp');
    }

    public function alamatDomisili()
    {
        return $this->hasOne(DosenAlamat::class)->where('jenis', 'domisili');
    }

    public function kepegawaian()
    {
        return $this->hasOne(DosenKepegawaian::class);
    }

    public function statusHistories()
    {
        return $this->hasMany(DosenStatusHistory::class)->orderByDesc('tanggal_berlaku');
    }

    public function homebaseHistories()
    {
        return $this->hasMany(DosenHomebaseHistory::class)->orderByDesc('tanggal_mulai');
    }

    public function homebaseAktif()
    {
        return $this->hasOne(DosenHomebaseHistory::class)->where('status', 'aktif')->latestOfMany('tanggal_mulai');
    }

    public function riwayatPendidikans()
    {
        return $this->hasMany(DosenRiwayatPendidikan::class);
    }

    public function jabatanAkademikHistories()
    {
        return $this->hasMany(DosenJabatanAkademikHistory::class)->orderByDesc('tanggal_berlaku');
    }

    public function pangkatGolongans()
    {
        return $this->hasMany(DosenPangkatGolongan::class)->orderByDesc('tanggal_berlaku');
    }

    public function sertifikasis()
    {
        return $this->hasMany(DosenSertifikasi::class);
    }

    public function dokumens()
    {
        return $this->hasMany(DosenDokumen::class);
    }

    public function pddiktiMapping()
    {
        return $this->hasOne(PddiktiDosenMapping::class);
    }

    public function pddiktiSyncLogs()
    {
        return $this->hasMany(PddiktiDosenSyncLog::class)->orderByDesc('created_at');
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
            'pensiun' => 'Pensiun',
            'mengundurkan_diri' => 'Mengundurkan Diri',
            'meninggal' => 'Meninggal Dunia',
            'pindah' => 'Pindah',
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
            'pensiun' => 'gray',
            default => 'gray'
        };
    }

    /**
     * Get jabatan akademik badge color
     */
    public function getJabatanBadgeColorAttribute()
    {
        return match ($this->jabatan_akademik) {
            'Asisten Ahli' => 'blue',
            'Lektor' => 'green',
            'Lektor Kepala' => 'orange',
            'Profesor' => 'purple',
            default => 'gray'
        };
    }
}
