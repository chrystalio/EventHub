<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

//Artisan::command('inspire', function () {
//    $this->comment(Inspiring::quote());
//})->purpose('Display an inspiring quote');


Schedule::command('registrations:mark-missed')
    ->hourly()
    ->withoutOverlapping()
    ->onFailure(function () {
        Log::error('[registrations:mark-missed] Failed to mark missed registrations at ' . now()->toDateTimeString());
    })
    ->onSuccess(function () {
        Log::info('[registrations:mark-missed] Successfully completed marking missed registrations at ' . now()->toDateTimeString());
    });

Schedule::command('registrations:reject-private-pending')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->onFailure(function () {
        Log::error('[registrations:reject-private-pending] Failed to reject pending private registrations at ' . now()->toDateTimeString());
    })
    ->onSuccess(function () {
        Log::info('[registrations:reject-private-pending] Successfully completed rejection of pending private registrations at ' . now()->toDateTimeString());
    });
