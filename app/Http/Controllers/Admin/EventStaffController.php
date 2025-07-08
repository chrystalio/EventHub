<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Spatie\Permission\PermissionRegistrar;

class EventStaffController extends Controller
{
    public function store(Request $request, Event $event): RedirectResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id'
        ]);

        $user = User::find($validated['user_id']);

        $currentRoles = $user->getRoleNames()->toArray();

        if (!in_array('Panitia', $currentRoles, true)) {
            $currentRoles[] = 'Panitia';
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $user->syncRoles($currentRoles);

        $event->staff()->syncWithoutDetaching([
            $validated['user_id'] => ['role' => 'panitia']
        ]);

        return back()->with('success', 'User successfully assigned as Panitia.');
    }

    public function destroy(Event $event, User $user): RedirectResponse
    {
        $event->staff()->detach($user->id);

        $remainingAssignments = $event->staff()->count();

        if ($remainingAssignments === 0 && $user->hasRole('Panitia')) {
            $user->removeRole('Panitia');
        }

        return back()->with('success', 'User successfully removed from Panitia.');
    }
}
