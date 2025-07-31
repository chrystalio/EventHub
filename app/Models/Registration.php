<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Registration extends Model
{
    protected $fillable = [
        'uuid',
        'event_uuid',
        'user_uuid',
        'order_id',
        'guest_count',
        'status',
        'registered_at',
        'approved_at',
    ];

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($registration) {
            if (empty($registration->uuid)) {
                $registration->uuid = (string) Str::uuid();
            }
            if (empty($registration->registered_at)) {
                $registration->registered_at = now();
            }
            // Auto-approve for now (public events)
            if (empty($registration->approved_at) && $registration->status === 'approved') {
                $registration->approved_at = now();
            }
        });
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class, 'event_uuid', 'uuid');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_uuid', 'uuid');
    }

    public function attendees(): HasMany
    {
        return $this->hasMany(RegistrationAttendee::class);
    }

    public function getTotalAttendeesAttribute(): int
    {
        return 1 + $this->guest_count; // registrant + guests
    }
}
