<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Building extends Model
{
    protected $fillable = [
        'code',
        'name',
    ];

    public function events(): HasMany
    {
        return $this->hasMany(Event::class);
    }

    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class);
    }
}
