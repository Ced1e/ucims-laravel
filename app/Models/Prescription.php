<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Prescription extends Model
{
    use HasFactory;

    protected $table = 'prescriptions';
    protected $primaryKey = 'prescription_id';
    public $timestamps = false;

    protected $guarded = [];

    public function endorsed()
    {
        return $this->belongsTo(Endorsed::class, 'endorsed_id', 'endorsed_id');
    }
}