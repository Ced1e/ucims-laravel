<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LabRequest extends Model
{
    use HasFactory;

    protected $table = 'lab_request';
    protected $primaryKey = 'lab_request_id';
    public $timestamps = false;

    protected $fillable = [
        'endorsed_id',
        'laboratory_request',
        'attachments',
    ];

    public function endorsed()
    {
        return $this->belongsTo(Endorsed::class, 'endorsed_id', 'endorsed_id');
    }
}