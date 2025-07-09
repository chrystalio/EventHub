<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Inertia\Inertia;
use Inertia\Response;

class PublicEventController extends Controller
{
    public function index(): Response
    {
        $events = Event::with(['building', 'room'])
            ->where('start_time', '>', now())
            ->orderBy('start_time')
            ->paginate(6);

        return Inertia::render('public/events/index', [
            'events' => $events,
        ]);
    }

    public function show(Event $event): Response
    {
        $event->load(['building', 'room', 'creator']);

        $userRegistration = null;
        if (auth()->check()) {
            $userRegistration = $event->registrations()
                ->where('user_id', auth()->id())
                ->where('status', '!=', 'cancelled')
                ->with('attendees')
                ->first();
        }

        $totalRegistered = $event->registrations()
            ->where('status', '!=', 'cancelled')
            ->withCount('attendees')
            ->get()
            ->sum('attendees_count');

        return Inertia::render('public/events/show', [
            'event' => $event,
            'userRegistration' => $userRegistration,
            'canRegister' => auth()->check() && !$userRegistration,
            'totalRegistered' => $totalRegistered,
            'isAuthenticated' => auth()->check(),
        ]);
    }
}
