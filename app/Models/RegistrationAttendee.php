<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class RegistrationAttendee extends Model
{
    protected $table = 'registrations_attendees';

    protected $fillable = [
        'registration_id',
        'attendee_type',
        'name',
        'phone',
        'qr_code',
        'attended_at',
        'cancelled_at',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($attendee) {
            if (empty($attendee->qr_code)) {
                $attendee->qr_code = (string) Str::uuid();
            }
        });
    }

    public function registration(): BelongsTo
    {
        return $this->belongsTo(Registration::class);
    }

    // Helper method to check if attendee has attended
    public function hasAttended(): bool
    {
        return !is_null($this->attended_at);
    }

    // Helper method to check if attendee is cancelled
    public function isCancelled(): bool
    {
        return !is_null($this->cancelled_at);
    }
}
