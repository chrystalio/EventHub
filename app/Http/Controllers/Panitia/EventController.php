<?php

namespace App\Http\Controllers\Panitia;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\RegistrationAttendee;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use PragmaRX\Google2FA\Google2FA;

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

    public function verifyQrCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'event_uuid' => 'required|uuid|exists:events,uuid',
            'attendee_uuid' => 'required|uuid|exists:registrations_attendees,qr_code',
            'token' => 'required|string|digits:6',
        ]);

        $attendee = RegistrationAttendee::where('qr_code', $validated['attendee_uuid'])->firstOrFail();
        $event = Event::where('uuid', $validated['event_uuid'])->firstOrFail();

        return DB::transaction(function () use ($validated, $attendee, $event) {
            $startTime = Carbon::parse($event->start_time);
            $scanWindowStart = $startTime->copy()->subHours(2);
            $scanWindowEnd = $startTime->copy()->addHour();
            $now = Carbon::now();

            if (!$now->between($scanWindowStart, $scanWindowEnd)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Scanning is not active at this time.',
                    'attendee' => $attendee->name,
                ], 403);
            }

            if ($attendee->registration->event_uuid !== $event->uuid) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Ticket is for a different event.',
                    'attendee' => $attendee->name,
                ], 422);
            }

            if ($attendee->hasAttended()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'This ticket has already been scanned.',
                    'attendee' => $attendee->name,
                ], 409);
            }

            $google2fa = new Google2FA();
            $isValid = $google2fa->verifyKey($attendee->totp_secret, $validated['token'], 1);

            if (!$isValid) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid or expired QR Code. Please refresh and try again.',
                    'attendee' => $attendee->name,
                ], 401);
            }

            $attendee->update(['attended_at' => now()]);

            $registration = $attendee->registration;
            $allAttended = $registration->attendees()->whereNull('attended_at')->doesntExist();
            if ($allAttended) {
                $registration->update(['status' => 'attended']);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Check-in Successful!',
                'attendee' => $attendee->name,
            ]);
        });
    }
}
