<?php

use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Api\AttendeeController;
use App\Http\Controllers\Performance\QrScanController;
use Illuminate\Support\Facades\Route;

// Performance testing routes (no auth, only in local/testing)
// Temporarily removing environment check for debugging
Route::post('/performance/ticket-verify', [QrScanController::class, 'verify'])
    ->name('performance.ticket.verify');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/admin/users/search', [UserController::class, 'search'])
        ->name('api.admin.users.search');

    Route::get('/attendees/{attendee:qr_code}/generate-token', [AttendeeController::class, 'generateToken'])
        ->name('api.attendees.generate-token');
});
