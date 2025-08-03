<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;

class RegistrationAttendee extends Model
{
    protected $table = 'registrations_attendees';

    protected $fillable = [
        'registration_id',
        'attendee_type',
        'name',
        'phone',
        'qr_code',
        'totp_secret',
        'attended_at',
        'cancelled_at',
    ];

    protected $hidden = [
        'totp_secret',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($attendee) {
            if (empty($attendee->qr_code)) {
                $attendee->qr_code = (string) Str::uuid();
            }

            if (empty($attendee->totp_secret)) {
                $google2fa = new Google2FA();
                $attendee->totp_secret = $google2fa->generateSecretKey();
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
