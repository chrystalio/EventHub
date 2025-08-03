<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBuildingRequest;
use App\Http\Requests\UpdateBuildingRequest;
use App\Models\Building;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

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
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreBuildingRequest $request): RedirectResponse
    {
        Building::create($request->validated());

        return redirect()->route('admin.buildings.index')->with('success', 'Building created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): void
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id): void
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateBuildingRequest $request, string $id): RedirectResponse
    {
        $building = Building::findOrFail($id);
        $building->update($request->validated());

        return redirect()->route('admin.buildings.index')->with('success', 'Building updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): RedirectResponse
    {
        $building = Building::with('rooms')->findOrFail($id);

        if ($building->rooms()->exists()) {
            return redirect()->route('admin.buildings.index')
                ->with('error', 'Building cannot be deleted because it has associated rooms.');
        }

        $building->delete();

        return redirect()->route('admin.buildings.index')
            ->with('success', 'Building deleted successfully.');
    }
}
