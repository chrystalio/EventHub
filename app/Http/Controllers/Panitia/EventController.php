<?php

namespace App\Http\Controllers\Panitia;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{   
    public function index(Request $request): Response
    {
        $panitia = $request->user();

        $managedEvents = $panitia->managedEvents()
            ->with(['building', 'room'])
            ->latest('start_time')
            ->get();

        $plainArrayEvents = $managedEvents->map(function ($event) {
            return [
                'id' => $event->id,
                'uuid' => $event->uuid,
                'name' => $event->name,
                'organizer' => $event->organizer,
            ];
        });

        return Inertia::render('panitia/events/index', [
            'managedEvents' => $plainArrayEvents,
        ]);
    }
}
