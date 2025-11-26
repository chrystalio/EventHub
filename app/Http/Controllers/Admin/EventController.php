<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEventRequest;
use App\Http\Requests\UpdateEventRequest;
use App\Models\Building;
use App\Models\Event;
use App\Models\Room;
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
}
