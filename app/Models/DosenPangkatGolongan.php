<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DosenPangkatGolongan extends Model
{
    use HasFactory;

    protected $table = 'dosen_pangkat_golongans';

    protected $fillable = ['dosen_id', 'pangkat', 'golongan', 'tanggal_berlaku', 'nomor_sk', 'tanggal_sk'];

    protected $casts = ['tanggal_berlaku' => 'date', 'tanggal_sk' => 'date'];

    public function dosen()
    {
        return $this->belongsTo(Dosen::class);
    }
}
