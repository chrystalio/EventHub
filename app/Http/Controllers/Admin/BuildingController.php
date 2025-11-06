<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBuildingRequest;
use App\Http\Requests\UpdateBuildingRequest;
use App\Models\Building;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BuildingController extends Controller
{

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $buildings = Building::latest()->get();

        return inertia('admin/buildings/index', [
            'buildings' => $buildings,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     * @throws \Throwable
     */
    public function store(StoreBuildingRequest $request): RedirectResponse
    {

        DB::beginTransaction();

        try {
            $validatedData = $request->validated();
            Building::create($validatedData);

            DB::commit();

            return redirect()
                ->route('admin.buildings.index')
                ->with('success', 'Building created successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Building creation failed', ['error' => $e->getMessage()]);

            return redirect()
                ->route('admin.buildings.index')
                ->with('error', 'Failed to create building. Please try again.');
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateBuildingRequest $request, string $id): RedirectResponse
    {
        DB::beginTransaction();

        try {
            $building = Building::findOrFail($id);
            $building->update($request->validated());

            DB::commit();

            return redirect()
                ->route('admin.buildings.index')
                ->with('success', 'Building updated successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Building update failed', ['error' => $e->getMessage()]);

            return redirect()
                ->route('admin.buildings.index')
                ->with('error', 'Failed to update building. Please try again.');
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): RedirectResponse
    {
        try {
            $building = Building::findOrFail($id);

            if ($building->rooms()->exists()) {
                return redirect()->route('admin.buildings.index')
                    ->with('error', 'Building cannot be deleted because it has associated rooms.');
            }

            DB::beginTransaction();

            $building->delete();

            DB::commit();

            return redirect()
                ->route('admin.buildings.index')
                ->with('success', 'Building deleted successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Building deletion failed', ['error' => $e->getMessage()]);

            return redirect()
                ->route('admin.buildings.index')
                ->with('error', 'Failed to delete building. Please try again.');
        }
    }
}
