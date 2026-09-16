<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class CalonMahasiswa extends Model
{
    use HasFactory;

    protected $table = 'calon_mahasiswas';
    
    protected $fillable = [
        'no_pendaftaran',
        'periode_pmb_id',
        'prodi_pilihan_1',
        'prodi_pilihan_2',
        'user_id',
        'nama_lengkap',
        'nik',
        'jenis_kelamin',
        'tempat_lahir',
        'tanggal_lahir',
        'agama',
        'alamat',
        'no_hp',
        'email',
        'nama_ayah',
        'pekerjaan_ayah',
        'nama_ibu',
        'pekerjaan_ibu',
        'no_hp_ortu',
        'alamat_ortu',
        'asal_sekolah',
        'tahun_lulus',
        'jurusan_sekolah',
        'nilai_rata_rata',
        'status_pendaftaran',
        'status_pembayaran',
        'status_berkas',
        'foto',
        'ktp',
        'ijazah',
        'transkrip',
        'bukti_pembayaran',
        'catatan_admin',
        'tanggal_daftar',
        'tanggal_verifikasi',
        'verified_by',
    ];

    protected $casts = [
        'tanggal_lahir' => 'date',
        'tanggal_daftar' => 'datetime',
        'tanggal_verifikasi' => 'datetime',
        'nilai_rata_rata' => 'decimal:2',
    ];

    // Relationships
    public function periodePmb()
    {
        return $this->belongsTo(PeriodePmb::class);
    }

    public function prodiPilihan1()
    {
        return $this->belongsTo(Prodi::class, 'prodi_pilihan_1');
    }

    public function prodiPilihan2()
    {
        return $this->belongsTo(Prodi::class, 'prodi_pilihan_2');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function verifiedBy()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function dokumenUploads()
    {
        return $this->hasMany(UploadDokumenPmb::class);
    }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        return $query->where('status_pendaftaran', $status);
    }

    public function scopeVerified($query)
    {
        return $query->where('status_pendaftaran', 'verified');
    }

    public function scopeAccepted($query)
    {
        return $query->where('status_pendaftaran', 'accepted');
    }

    // Methods
    public function generateNoPendaftaran($periodePmb)
    {
        $tahun = Carbon::parse($periodePmb->tanggal_buka)->year;
        $urutan = CalonMahasiswa::where('periode_pmb_id', $periodePmb->id)->count() + 1;
        
        return sprintf('PMB%d%04d', $tahun, $urutan);
    }

    public function getStatusBadgeAttribute()
    {
        $colors = [
            'draft' => 'bg-gray-100 text-gray-800',
            'submitted' => 'bg-blue-100 text-blue-800',
            'verified' => 'bg-yellow-100 text-yellow-800',
            'accepted' => 'bg-green-100 text-green-800',
            'rejected' => 'bg-red-100 text-red-800',
        ];

        return $colors[$this->status_pendaftaran] ?? 'bg-gray-100 text-gray-800';
    }

    public function getPembayaranBadgeAttribute()
    {
        $colors = [
            'unpaid' => 'bg-red-100 text-red-800',
            'pending' => 'bg-yellow-100 text-yellow-800',
            'paid' => 'bg-green-100 text-green-800',
            'expired' => 'bg-gray-100 text-gray-800',
        ];

        return $colors[$this->status_pembayaran] ?? 'bg-gray-100 text-gray-800';
    }

    public function getBerkasBadgeAttribute()
    {
        $colors = [
            'incomplete' => 'bg-red-100 text-red-800',
            'complete' => 'bg-blue-100 text-blue-800',
            'verified' => 'bg-green-100 text-green-800',
            'revision' => 'bg-yellow-100 text-yellow-800',
        ];

        return $colors[$this->status_berkas] ?? 'bg-gray-100 text-gray-800';
    }

    public function isEditable()
    {
        return in_array($this->status_pendaftaran, ['draft', 'submitted']);
    }

    public function canUploadDokumen()
    {
        return in_array($this->status_pendaftaran, ['draft', 'submitted', 'verified']);
    }

    public function isConvertedToMahasiswa()
    {
        if (!$this->user_id) {
            return false;
        }
        return \App\Models\Mahasiswa::where('user_id', $this->user_id)->exists();
    }

    // Add missing attributes for frontend
    public function getIsEditableAttribute()
    {
        return $this->isEditable();
    }

    public function getCanUploadDokumenAttribute()
    {
        return $this->canUploadDokumen();
    }

    // Add accessor for frontend
    public function getConvertedToMahasiswaAttribute()
    {
        return $this->isConvertedToMahasiswa();
    }
}
