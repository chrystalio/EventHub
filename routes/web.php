<?php

use App\Http\Controllers\Admin\BuildingController;
use App\Http\Controllers\Admin\EventController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\RolePermissionController;
use App\Http\Controllers\Admin\RoomController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::impersonate();

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }

    return Inertia::render('auth/login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::prefix('admin')->group(function () {
        Route::resource('roles', RoleController::class)->middleware('can:role.view');
        Route::get('/users', [UserController::class, 'index'])->name('admin.users.index')->middleware('can:user.view');
        Route::put('/users/{user}/roles', [UserController::class, 'updateRoles'])->name('admin.users.updateRoles')->middleware('can:user.update');
        Route::put('/users/{user}/roles', [UserController::class, 'updateRoles'])->name('admin.users.updateRoles')->middleware('can:user.edit');

        Route::get('/roles/{role}/permissions', [RolePermissionController::class, 'index'])->middleware('can:rolepermission.view')->name('admin.roles.permissions.index');
        Route::post('/roles/{role}/permissions', [RolePermissionController::class, 'update'])->middleware('can:rolepermission.update')->name('admin.roles.permissions.update');

        Route::get('/buildings', [BuildingController::class, 'index'])->name('admin.buildings.index')->middleware('can:building.view');
        Route::post('/buildings', [BuildingController::class, 'store'])->name('admin.buildings.store')->middleware('can:building.create');
        Route::put('/buildings/{building}', [BuildingController::class, 'update'])->name('admin.buildings.update')->middleware('can:building.update');
        Route::delete('/buildings/{building}', [BuildingController::class, 'destroy'])->name('admin.buildings.destroy')->middleware('can:building.delete');

        Route::get('/rooms', [RoomController::class, 'index'])->name('admin.rooms.index')->middleware('can:room.view');
        Route::post('/rooms', [RoomController::class, 'store'])->name('admin.rooms.store')->middleware('can:room.create');
        Route::put('/rooms/{room}', [RoomController::class, 'update'])->name('admin.rooms.update')->middleware('can:room.update');
        Route::delete('/rooms/{room}', [RoomController::class, 'destroy'])->name('admin.rooms.destroy')->middleware('can:room.delete');

        Route::get('/events', [EventController::class, 'index'])->name('admin.events.index')->middleware('can:event.view');
        Route::post('/events', [EventController::class, 'store'])->name('admin.events.store')->middleware('can:event.create');
        Route::put('/events/{event}', [EventController::class, 'update'])->name('admin.events.update')->middleware('can:event.update');
        Route::delete('/events/{event}', [EventController::class, 'destroy'])->name('admin.events.destroy')->middleware('can:event.delete');
        Route::get('/events/{event}/show', [EventController::class, 'show'])->name('admin.events.show')->middleware('can:event.view');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
