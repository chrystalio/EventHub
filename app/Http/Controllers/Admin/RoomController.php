<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRoomRequest;
use App\Http\Requests\UpdateRoomRequest;
use App\Models\Building;
use App\Models\Room;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RoomController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $rooms = Room::with('building')->latest()->get();
        $buildings = Building::orderBy('name')->get();

        return Inertia::render('admin/rooms/index', [
            'rooms' => $rooms,
            'buildings' => $buildings,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     * @throws \Throwable
     */
    public function store(StoreRoomRequest $request): RedirectResponse
    {

        DB::beginTransaction();

        try {
            $validatedData = $request->validated();
            Room::create($validatedData);

            DB::commit();

            return redirect()
                ->route('admin.rooms.index')
                ->with('success', 'Room created successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Room creation failed', ['error' => $e->getMessage()]);

            return redirect()
                ->route('admin.rooms.index')
                ->with('error', 'Failed to create room. Please try again.');
        }
    }

    /**
     * Update the specified resource in storage.
     * @throws \Throwable
     */
    public function update(UpdateRoomRequest $request, string $id): RedirectResponse
    {
        DB::beginTransaction();

        try {
            $room = Room::findOrFail($id);
            $validatedData = $request->validated();
            $room->update($validatedData);

            DB::commit();

            return redirect()
                ->route('admin.rooms.index')
                ->with('success', 'Room updated successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Room update failed', ['error' => $e->getMessage()]);

            return redirect()
                ->route('admin.rooms.index')
                ->with('error', 'Failed to update room. Please try again.');
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): RedirectResponse
    {
        try {
            $room = Room::findOrFail($id);

            // Check for associated events before deletion
            if ($room->events()->exists()) {
                return redirect()->route('admin.rooms.index')
                    ->with('error', 'Room cannot be deleted because it has associated events.');
            }

            DB::beginTransaction();

            $room->delete();

            DB::commit();

            return redirect()
                ->route('admin.rooms.index')
                ->with('success', 'Room deleted successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Room deletion failed', ['error' => $e->getMessage()]);

            return redirect()
                ->route('admin.rooms.index')
                ->with('error', 'Failed to delete room. Please try again.');
        }
    }
}
