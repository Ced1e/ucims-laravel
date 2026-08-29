<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TriageRecord extends Model
{
    use HasFactory;

    protected $table = 'triage_record';
    protected $primaryKey = 'triage_id';
    public $timestamps = false; // Uses database default for created_at

    protected $guarded = [];

    public function queue()
    {
        return $this->belongsTo(ClinicQueue::class, 'queue_id', 'queue_id');
    }

    public function nurse()
    {
        return $this->belongsTo(User::class, 'nurse_id', 'user_id');
    }
}