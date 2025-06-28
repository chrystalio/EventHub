<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRegistrationRequest;
use App\Models\Event;
use App\Models\Registration;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class RegistrationController extends Controller
{
    public function index(): Response
    {
        $registrations = Registration::where('user_id', Auth::id())
            ->with(['event' => function ($query) {
                $query->with(['building', 'room']);
            }])
            ->latest('registered_at')
            ->get();

        return Inertia::render('authenticated/registrations/index', [
            'registrations' => $registrations,
        ]);
    }

    public function browse(): Response
    {
        $events = Event::with(['building', 'room'])
            ->where('start_time', '>', now())
            ->orderBy('start_time')
            ->paginate(6);

        $canRegister = auth()->user() && auth()->user()->can('registration.create');

        $userRegistrations = [];
        if ($canRegister) {
            $userRegistrations = auth()->user()
                ->registrations()
                ->whereIn('event_id', $events->pluck('id'))
                ->where('status', '!=', 'cancelled')
                ->with('attendees')
                ->get()
                ->keyBy('event_id');
        }

        return Inertia::render('authenticated/events/index', [
            'events' => $events,
            'userRegistrations' => $userRegistrations,
            'canRegister' => $canRegister,
            'isAuthenticated' => true,
        ]);
    }

    public function showEvent(Event $event): Response
    {
        $event->load(['building', 'room', 'creator']);

        $canCreate = auth()->user() && auth()->user()->can('registration.create');

        $userRegistration = null;
        if (auth()->user()) {
            $userRegistration = $event->registrations()
                ->where('user_id', auth()->id())
                ->where('status', '!=', 'cancelled')
                ->first();
        }

        $totalRegistered = $event->total_registered;

        return Inertia::render('authenticated/events/show', [
            'event' => $event,
            'userRegistration' => $userRegistration,
            'canRegister' => $canCreate && !$userRegistration,
            'totalRegistered' => $totalRegistered,
            'isAuthenticated' => true,
        ]);
    }

    public function store(StoreRegistrationRequest $request, Event $event): RedirectResponse
    {
        $validated = $request->validated();

        $registration = Registration::create([
            'user_id' => auth()->id(),
            'event_id' => $event->id,
            'guest_count' => $validated['guest_count'],
            'status' => 'approved',
        ]);

        $user = Auth::user();
        $registration->attendees()->create([
            'attendee_type' => 'user',
            'name' => $user->name,
            'phone' => $user->phone ?? '',
        ]);

        if (!empty($validated['guests'])) {
            foreach ($validated['guests'] as $guestData){
                $registration->attendees()->create([
                    'attendee_type' => 'guest',
                    'name' => $guestData['name'],
                    'phone' => $guestData['phone'],
                ]);
            }
        }

        return redirect()->route('registrations.show_event', $event->uuid)
        ->with('success', 'Registration successful! You can now view your registration details.');
    }
}
