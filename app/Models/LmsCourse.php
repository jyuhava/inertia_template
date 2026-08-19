<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LmsCourse extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    public function jadwalKuliah()
    {
        return $this->belongsTo(JadwalKuliah::class);
    }

    public function chapters()
    {
        return $this->hasMany(LmsChapter::class)->orderBy('order');
    }
}
