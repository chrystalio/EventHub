<?php

use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Api\AttendeeController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/admin/users/search', [UserController::class, 'search'])
        ->name('api.admin.users.search');

    Route::get('/attendees/{attendee:qr_code}/generate-token', [AttendeeController::class, 'generateToken'])
        ->name('api.attendees.generate-token');
});
