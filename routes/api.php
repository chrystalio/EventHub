<?php

use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->get('/admin/users/search', [UserController::class, 'search'])->name('api.admin.users.search');
