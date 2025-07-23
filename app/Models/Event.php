<?php

namespace App\Models;

use App\Policies\EventPolicy;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Support\Str;

#[UsePolicy(EventPolicy::class)]
class Event extends Model
{
    protected $fillable = [
        'name',
        'description',
        'organizer',
        'type',
        'price',
        'start_time',
        'end_time',
        'max_guests_per_registration',
        'building_id',
        'room_id',
        'created_by',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'max_guests_per_registration' => 'integer',
    ];

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($model) {
            $model->uuid = (string) Str::uuid();
        });
    }


    public function building(): BelongsTo
    {
        return $this->belongsTo(Building::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class);
    }

    public function staff(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'event_staff', 'event_id', 'user_id')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function attendees(): HasManyThrough
    {
        return $this->hasManyThrough(RegistrationAttendee::class, Registration::class);
    }
    public function getTotalRegisteredAttribute(): int
    {
        return $this->registrations()
                ->where('status', '!=', 'cancelled')
                ->sum('guest_count') + $this->registrations()
                ->where('status', '!=', 'cancelled')
                ->count();
    }
    public function isUserRegistered($userId): bool
    {
        return $this->registrations()
            ->where('user_id', $userId)
            ->where('status', '!=', 'cancelled')
            ->exists();
    }
}
