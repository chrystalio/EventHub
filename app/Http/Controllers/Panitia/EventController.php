<?php

namespace App\Http\Controllers\Panitia;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\RegistrationAttendee;
use App\Services\StaticQRCodeService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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
                'start_time' => $event->start_time,
                'end_time' => $event->end_time,
                'building' => $event->building ? [
                    'id' => $event->building->id,
                    'name' => $event->building->name,
                ] : null,
                'room' => $event->room ? [
                    'id' => $event->room->id,
                    'name' => $event->room->name,
                ] : null,
                'status' => $event->status,
            ];
        });

        return Inertia::render('panitia/events/index', [
            'managedEvents' => $plainArrayEvents,
        ]);
    }

    public function show(Event $event): Response
    {
        $this->authorize('manage', $event);

        $event->load(['building', 'room', 'creator', 'registrations.user', 'registrations.attendees', 'staff']);

        return Inertia::render('panitia/events/show', [
            'event' => $event,
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

            if (! $now->between($scanWindowStart, $scanWindowEnd)) {
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

            $google2fa = new Google2FA;
            $isValid = $google2fa->verifyKey($attendee->totp_secret, $validated['token'], 1);

            if (! $isValid) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid or expired QR Code. Please refresh and try again.',
                    'attendee' => $attendee->name,
                ], 401);
            }

            $attendee->update(['attended_at' => now()]);

            $registration = $attendee->registration;
            if ($registration->status !== 'attended') {
                $registration->update(['status' => 'attended']);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Check-in Successful!',
                'attendee' => $attendee->name,
            ]);
        });
    }

    public function verifyStaticQR(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'event_uuid' => 'required|uuid|exists:events,uuid',
            'qr_data' => 'required|string',
        ]);

        Log::info('Static QR verification attempt', [
            'event_uuid' => $validated['event_uuid'],
            'qr_data_length' => strlen($validated['qr_data']),
            'qr_data_preview' => substr($validated['qr_data'], 0, 100),
        ]);

        $event = Event::where('uuid', $validated['event_uuid'])->firstOrFail();

        // Verify event uses static QR
        if ($event->qr_type !== 'static') {
            Log::warning('Static QR: Event type mismatch', [
                'event_uuid' => $event->uuid,
                'event_qr_type' => $event->qr_type,
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'This event uses dynamic QR codes.',
            ], 422);
        }

        return DB::transaction(function () use ($validated, $event) {
            // 1. Check scanning window (same as dynamic QR)
            $startTime = Carbon::parse($event->start_time);
            $scanWindowStart = $startTime->copy()->subHours(2);
            $scanWindowEnd = $startTime->copy()->addHour();
            $now = Carbon::now();

            if (! $now->between($scanWindowStart, $scanWindowEnd)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Scanning is not active at this time.',
                ], 403);
            }

            // 2. Verify QR signature and get attendee
            $qrService = app(StaticQRCodeService::class);
            $attendee = $qrService->verifyQRData($validated['qr_data'], $event);

            if (! $attendee) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid QR Code. Please contact support.',
                ], 401);
            }

            // 3. Check if already attended
            if ($attendee->hasAttended()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'This ticket has already been scanned.',
                    'attendee' => $attendee->name,
                ], 409);
            }

            // 4. Mark as attended
            $attendee->update(['attended_at' => now()]);

            // 5. Update registration status
            $registration = $attendee->registration;
            if ($registration->status !== 'attended') {
                $registration->update(['status' => 'attended']);
            }

            // 6. Audit log
            Log::info('Static QR check-in successful', [
                'event_uuid' => $event->uuid,
                'event_name' => $event->name,
                'attendee_uuid' => $attendee->uuid,
                'attendee_name' => $attendee->name,
                'panitia_user_id' => auth()->id(),
                'scanned_at' => now(),
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Check-in Successful!',
                'attendee' => $attendee->name,
            ]);
        });
    }
}
