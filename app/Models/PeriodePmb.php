<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class PeriodePmb extends Model
{
    use HasFactory;

    protected $table = 'periode_pmb';
    
    protected $fillable = [
        'nama_periode',
        'tahun_akademik',
        'tanggal_buka',
        'tanggal_tutup',
        'biaya_pendaftaran',
        'kuota_total',
        'persyaratan',
        'keterangan',
        'status',
    ];

    protected $casts = [
        'tanggal_buka' => 'date',
        'tanggal_tutup' => 'date',
        'biaya_pendaftaran' => 'decimal:0',
    ];

    // Relationships
    public function calonMahasiswas()
    {
        return $this->hasMany(CalonMahasiswa::class);
    }

    // Scopes
    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }

    public function scopeBerlangsung($query)
    {
        $today = Carbon::now()->toDateString();
        return $query->where('status', 'aktif')
                    ->where('tanggal_buka', '<=', $today)
                    ->where('tanggal_tutup', '>=', $today);
    }

    // Methods
    public function isBerlangsung()
    {
        $today = Carbon::now()->toDateString();
        return $this->status === 'aktif' && 
               $this->tanggal_buka <= $today && 
               $this->tanggal_tutup >= $today;
    }

    public function getTotalPendaftarAttribute()
    {
        return $this->calonMahasiswas()->count();
    }

    public function getSisaKuotaAttribute()
    {
        return $this->kuota_total - $this->total_pendaftar;
    }

    public function getFormattedBiayaAttribute()
    {
        return 'Rp ' . number_format($this->biaya_pendaftaran, 0, ',', '.');
    }
}
