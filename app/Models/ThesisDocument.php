<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ThesisDocument extends Model
{
    protected $fillable = ['thesis_id', 'type', 'version', 'file_path', 'original_name', 'uploaded_by'];

    public function thesis()
    {
        return $this->belongsTo(Thesis::class);
    }

    public function uploadedBy()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
