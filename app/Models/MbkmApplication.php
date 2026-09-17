<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class MbkmApplication extends Model { protected $fillable=['mbkm_program_id','mahasiswa_id','application_number','status','motivation','notes','submitted_at']; protected $casts=['submitted_at'=>'datetime']; public function program(){return $this->belongsTo(MbkmProgram::class,'mbkm_program_id');} public function mahasiswa(){return $this->belongsTo(Mahasiswa::class);} }
