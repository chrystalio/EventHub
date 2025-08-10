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

class EventController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
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

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreEventRequest $request): RedirectResponse
    {
       $validatedData = $request->validated();
       $validatedData['created_by'] = auth()->id();

       Event::create($validatedData);


        return redirect()->route('admin.events.index')->with('success', 'Event created successfully.');
    }


    /**
     * Display the specified resource.
     */
    public function show(Event $event)
    {
        $this->authorize('manage', $event);

        $event->load(['building', 'room', 'creator', 'registrations.user', 'registrations.attendees', 'staff']);

        return inertia('admin/events/show', [
            'event' => $event,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateEventRequest $request, Event $event): RedirectResponse
    {
        $event->update($request->validated());

        return redirect()->route('admin.events.index')->with('success', 'Event updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Event $event): RedirectResponse
    {
        $event->delete();

        return redirect()->route('admin.events.index')
            ->with('success', 'Event deleted successfully.');
    }

}
