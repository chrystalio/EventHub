<?php

namespace App\Http\Controllers\Panitia;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Registration;
use App\Models\RegistrationAttendee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

    public function scanner(Event $event): Response
    {
        $this->authorize('manage', $event);

        return Inertia::render('panitia/events/scanner', [
            'event' => $event,
        ]);
    }

    public function verifyQrCode(Request $request, RegistrationAttendee $attendee, Registration $registration): JsonResponse
    {

        $validated = $request->validate([
            'event_uuid' => 'required|uuid|exists:events,uuid',
        ]);

        return DB::transaction(function () use ($validated, $attendee) {
            $registration = $attendee->registration;
            $event = Event::where('uuid', $validated['event_uuid'])->first();

            if ($registration->event_id !== $event->id) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Ticket is for a different event',
                    'attendee' => $attendee->name,
                ], 422);
            }

            if ($attendee->attended_at) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'QR Already Scanned',
                    'attendee' => $attendee->name,
                ], 409);
            }

            $attendee->update(['attended_at' => now()]);

            $allAttended = $registration->attendees()->whereNull('attended_at')->doesntExist();

            if ($allAttended) {
                $registration->update(['status' => 'attended']);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Check-in Successful',
                'attendee' => $attendee->name,
            ]);
        });

    }
}
