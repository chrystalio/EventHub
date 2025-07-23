<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    protected $fillable = [
        'user_uuid',
        'event_uuid',
        'order_id',
        'total_amount',
        'status',
        'transaction_id',
        'payment_details',
        'expires_at',
    ];

    protected $casts = [
        'payment_details' => 'json',
        'expires_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_uuid', 'uuid');
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class, 'event_uuid', 'uuid');
    }
}
