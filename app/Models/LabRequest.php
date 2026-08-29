<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LabRequest extends Model
{
    use HasFactory;

    protected $table = 'lab_requests';
    protected $primaryKey = 'lab_id';
    public $timestamps = false;

    protected $guarded = [];

    public function endorsed()
    {
        return $this->belongsTo(Endorsed::class, 'endorsed_id', 'endorsed_id');
    }
}