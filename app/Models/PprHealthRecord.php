<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PprHealthRecord extends Model
{
    use HasFactory;

    protected $table = 'ppr_health_records';
    protected $primaryKey = 'health_record_id';
    public $timestamps = false;

    protected $guarded = [];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}