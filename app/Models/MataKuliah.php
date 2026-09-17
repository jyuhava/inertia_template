<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MataKuliah extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'kode_mata_kuliah',
        'nama_mata_kuliah',
        'short_name',
        'english_name',
        'sks',
        'theory_credits',
        'practical_credits',
        'field_credits',
        'semester',
        'prodi_id',
        'jenis',
        'course_type',
        'kategori_mata_kuliah_id',
        'deskripsi',
        'status',
    ];

    protected $casts = [
        'theory_credits' => 'decimal:2',
        'practical_credits' => 'decimal:2',
        'field_credits' => 'decimal:2',
    ];

    public function prodi()
    {
        return $this->belongsTo(Prodi::class);
    }

    public function kategori()
    {
        return $this->belongsTo(KategoriMataKuliah::class, 'kategori_mata_kuliah_id');
    }

    public function jadwalKuliahs()
    {
        return $this->hasMany(JadwalKuliah::class);
    }

    /**
     * Mata kuliah yang menjadi prasyarat mata kuliah ini.
     */
    public function prasyarats()
    {
        return $this->belongsToMany(self::class, 'mata_kuliah_prasyarats', 'mata_kuliah_id', 'prasyarat_mata_kuliah_id')
            ->withPivot(['nilai_minimum', 'keterangan'])
            ->withTimestamps();
    }

    /**
     * Mata kuliah lain yang menjadikan mata kuliah ini sebagai prasyarat.
     */
    public function menjadiPrasyaratUntuk()
    {
        return $this->belongsToMany(self::class, 'mata_kuliah_prasyarats', 'prasyarat_mata_kuliah_id', 'mata_kuliah_id')
            ->withPivot(['nilai_minimum', 'keterangan'])
            ->withTimestamps();
    }

    public function substansiKuliahs()
    {
        return $this->belongsToMany(SubstansiKuliah::class, 'mata_kuliah_substansi');
    }

    public function kurikulumMataKuliahs()
    {
        return $this->hasMany(KurikulumMataKuliah::class);
    }

    public function kurikulums()
    {
        return $this->belongsToMany(Kurikulum::class, 'kurikulum_mata_kuliahs')->withPivot(['semester', 'is_wajib']);
    }

    public function kelasKuliahs()
    {
        return $this->hasMany(KelasKuliah::class);
    }

    public function ekuivalensiSebagaiLama()
    {
        return $this->hasMany(MataKuliahEkuivalensi::class, 'mata_kuliah_lama_id');
    }

    public function ekuivalensiSebagaiBaru()
    {
        return $this->hasMany(MataKuliahEkuivalensi::class, 'mata_kuliah_baru_id');
    }

    public function pddiktiMapping()
    {
        return $this->morphOne(PddiktiAkademikMapping::class, 'entity', 'entity_type', 'entity_id')
            ->where('entity_type', self::class);
    }

    public function getStatusDisplayAttribute()
    {
        return ucfirst($this->status);
    }

    public function getStatusBadgeColorAttribute()
    {
        return match ($this->status) {
            'aktif' => 'green',
            'nonaktif' => 'gray',
            default => 'gray'
        };
    }

    public function getJenisBadgeColorAttribute()
    {
        return match ($this->jenis) {
            'Wajib' => 'blue',
            'Pilihan' => 'purple',
            default => 'gray'
        };
    }

    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }

    public function scopeWajib($query)
    {
        return $query->where('jenis', 'Wajib');
    }

    public function scopePilihan($query)
    {
        return $query->where('jenis', 'Pilihan');
    }

    public function scopeBySemester($query, $semester)
    {
        return $query->where('semester', $semester);
    }

    public function scopeByProdi($query, $prodiId)
    {
        return $query->where('prodi_id', $prodiId);
    }

    public function mbkmRecognitions()
    {
        return $this->hasMany(MbkmRecognition::class);
    }
}
