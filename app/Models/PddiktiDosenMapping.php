<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PddiktiDosenMapping extends Model
{
    use HasFactory;

    protected $table = 'pddikti_dosen_mappings';

    protected $fillable = ['dosen_id', 'pddikti_id', 'id_registrasi_dosen', 'status_mapping', 'last_synced_at', 'last_action', 'last_message'];

    protected $casts = ['last_synced_at' => 'datetime'];

    public function dosen()
    {
        return $this->belongsTo(Dosen::class);
    }
}
