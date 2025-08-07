<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');


Schedule::command('registrations:mark-missed')->hourly()->withoutOverlapping()->onFailure(function () {
    Log::error('Failed to mark missed registrations.');
})->onSuccess(function () {
    Log::info('Successfully marked missed registrations.');
});
