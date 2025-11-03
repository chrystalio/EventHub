<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CertificateTemplate extends Model
{
    protected $fillable = [
        'name',
        'theme',
        'config',
        'file_path',
    ];

    protected $casts = [
        'config' => 'array',
    ];
}
