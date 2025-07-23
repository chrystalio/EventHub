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
            'user_uuid' => 'required|exists:users,uuid'
        ]);

        $user = User::where('uuid', $validated['user_uuid'])->firstOrFail();

        if (!$user->hasRole('Panitia')) {
            $user->assignRole('Panitia');
        }

        $event->staff()->syncWithoutDetaching([
            $user->uuid => ['role' => 'panitia']
        ]);

        return back()->with('success', 'User successfully assigned as Panitia.');
    }

    public function destroy(Event $event, User $user): RedirectResponse
    {
        $event->staff()->detach($user->uuid);

        $remainingAssignments = $user->managedEvents()->count();

        if ($remainingAssignments === 0 && $user->hasRole('Panitia')) {
            $user->removeRole('Panitia');
        }

        return back()->with('success', 'User successfully removed from Panitia.');
    }
}
