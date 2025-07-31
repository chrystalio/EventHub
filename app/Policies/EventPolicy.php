<?php

namespace App\Policies;

use App\Models\Event;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class EventPolicy
{
    public function manage(User $user, Event $event): bool
    {
        if ($user->hasRole(['System Administrator', 'Akademik'])) {
            return true;
        }

        if ($user->hasRole('Panitia')) {
            return $event->staff->contains($user);
        }

        return false;
    }
}
