<?php

namespace App\Policies;

use App\Models\Event;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class EventPolicy
{
    public function manage(User $user, Event $event): bool
    {
        ray([
            'message' => 'Checking authorization in EventPolicy@manage',
            'user_being_checked' => [
                'id' => $user->id,
                'name' => $user->name,
                'has_panitia_role' => $user->hasRole('Panitia'),
            ],
            'event_being_checked' => [
                'id' => $event->id,
                'name' => $event->name,
            ],
            'is_user_assigned_to_this_event' => $event->staff()->where('user_id', $user->id)->exists(),
            'all_staff_ids_for_this_event' => $event->staff()->pluck('users.id')->all(),
        ]);

        if ($user->hasRole(['System Administrator', 'Akademik'])) {
            return true;
        }

        if ($user->hasRole('Panitia')) {
            return $event->staff()->where('user_id', $user->id)->exists();
        }

        return false;
    }
}
