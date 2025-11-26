<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEventRequest;
use App\Http\Requests\UpdateEventRequest;
use App\Models\Building;
use App\Models\Event;
use App\Models\Room;
use App\Services\StaticQRCodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Response;

class EventController extends Controller
{
    public function index(): Response
    {
        $events = Event::with(['building', 'room', 'creator'])->latest()->get();
        $buildings = Building::all();
        $rooms = Room::with('building')->get();

        return inertia('admin/events/index', [
            'events' => $events,
            'buildings' => $buildings,
            'rooms' => $rooms,
            'canCreate' => auth()->user()->can('event.create', Event::class),
            'canUpdate' => Auth::user()->hasPermissionTo('event.update'),
            'canDelete' => Auth::user()->hasPermissionTo('event.delete'),
        ]);
    }

    public function store(StoreEventRequest $request): RedirectResponse
    {
        DB::beginTransaction();

        try {
            $validatedData = $request->validated();
            $validatedData['created_by'] = auth()->id();

            Event::create($validatedData);

            DB::commit();

            return redirect()
                ->route('admin.events.index')
                ->with('success', 'Event created successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Event creation failed', ['error' => $e->getMessage()]);

            return redirect()
                ->route('admin.events.index')
                ->with('error', 'Failed to create event. Please try again.');
        }
    }

    public function show(Event $event): Response
    {
        $this->authorize('manage', $event);

        $event->load(['building', 'room', 'creator', 'registrations.user', 'registrations.attendees', 'staff']);

        return inertia('admin/events/show', [
            'event' => $event,
        ]);
    }

    public function update(UpdateEventRequest $request, Event $event): RedirectResponse
    {
        DB::beginTransaction();

        try {
            $event->update($request->validated());

            DB::commit();

            return redirect()
                ->route('admin.events.index')
                ->with('success', 'Event updated successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Event update failed', ['error' => $e->getMessage(), 'event_id' => $event->id]);

            return redirect()
                ->route('admin.events.index')
                ->with('error', 'Failed to update event. Please try again.');
        }
    }

    public function destroy(Event $event): RedirectResponse
    {
        $hasActiveRegistrations = $event->registrations()->exists();

        if ($hasActiveRegistrations) {
            return redirect()
                ->route('admin.events.index')
                ->with('error', 'Delete failed: Event has registered attendees.');
        }

        DB::beginTransaction();

        try {
            $event->delete();

            DB::commit();

            return redirect()
                ->route('admin.events.index')
                ->with('success', 'Event deleted successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Event deletion failed', ['error' => $e->getMessage(), 'event_id' => $event->id]);

            return redirect()
                ->route('admin.events.index')
                ->with('error', 'Failed to delete event. Please try again.');
        }
    }

    /**
     * Validate all QR codes for a static QR event before printing.
     * Useful for pre-event testing to ensure all QR codes are valid.
     */
    public function validateQRCodes(Event $event): JsonResponse
    {
        $this->authorize('manage', $event);

        if ($event->qr_type !== 'static') {
            return response()->json([
                'success' => false,
                'message' => 'This endpoint is only for static QR events.',
            ], 422);
        }

        $attendees = $event->registrations()
            ->with('attendees')
            ->get()
            ->pluck('attendees')
            ->flatten();

        if ($attendees->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No attendees registered for this event yet.',
            ], 422);
        }

        $qrService = app(StaticQRCodeService::class);
        $results = [];

        foreach ($attendees as $attendee) {
            try {
                $qrData = $qrService->generateQRData($attendee);
                $verified = $qrService->verifyQRData($qrData, $event);

                $results[] = [
                    'attendee_name' => $attendee->name,
                    'attendee_uuid' => $attendee->uuid,
                    'qr_valid' => $verified !== null,
                    'error' => null,
                ];
            } catch (\Exception $e) {
                $results[] = [
                    'attendee_name' => $attendee->name,
                    'attendee_uuid' => $attendee->uuid,
                    'qr_valid' => false,
                    'error' => $e->getMessage(),
                ];
            }
        }

        $validCount = collect($results)->where('qr_valid', true)->count();
        $invalidCount = collect($results)->where('qr_valid', false)->count();

        Log::info('Static QR validation completed', [
            'event_uuid' => $event->uuid,
            'event_name' => $event->name,
            'total' => count($results),
            'valid' => $validCount,
            'invalid' => $invalidCount,
            'validated_by' => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'total' => count($results),
            'valid' => $validCount,
            'invalid' => $invalidCount,
            'validation_rate' => count($results) > 0 ? round(($validCount / count($results)) * 100, 2) : 0,
            'results' => $results,
        ]);
    }
}
