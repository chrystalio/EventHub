<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEventRequest;
use App\Http\Requests\UpdateEventRequest;
use App\Models\Building;
use App\Models\CertificateTemplate;
use App\Models\Event;
use App\Models\Room;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

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

        // Handle certificate template upload if provided
        if ($request->hasFile('certificate_template_file')) {
            $file = $request->file('certificate_template_file');

            // Generate unique filename
            $filename = 'event_' . time() . '_' . uniqid('', true) . '_certificate_template.docx';
            $uploadDir = 'certificate-templates/events';

            // Store the file using Laravel's Storage facade
            $filePath = $file->storeAs($uploadDir, $filename);

            // Verify the upload worked by checking both Storage and physical file
            $physicalPath = storage_path('app/' . $filePath);

            ray([
                'upload_attempt' => true,
                'filename' => $filename,
                'stored_path' => $filePath,
                'physical_path' => $physicalPath,
                'storage_exists' => Storage::exists($filePath),
                'file_exists' => file_exists($physicalPath),
                'file_size' => file_exists($physicalPath) ? filesize($physicalPath) : 'file not found'
            ])->label('File Upload Final Check');

            if ($filePath && Storage::exists($filePath) && file_exists($physicalPath)) {
                $template = CertificateTemplate::create([
                    'name' => 'Custom Template - ' . $validatedData['name'],
                    'theme' => 'custom',
                    'file_path' => $filePath,
                    'config' => json_encode([])
                ]);

                $validatedData['certificate_template_id'] = $template->id;
                ray('Custom template uploaded and saved successfully!')->color('green');
            } else {
                ray('File upload verification failed')->color('red');
                return back()->withErrors(['certificate_template_file' => 'Failed to upload certificate template']);
            }
        }


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
        $validatedData = $request->validated();

        // Handle certificate template upload if provided
        if ($request->hasFile('certificate_template_file')) {

            ray([
                'has_file' => $request->hasFile('certificate_template_file'),
                'file_info' => $request->file('certificate_template_file'),
                'all_files' => $request->allFiles()
            ])->label('File Upload Start');

            $file = $request->file('certificate_template_file');

            // Generate unique filename
            $filename = 'event_' . time() . '_' . uniqid('', true) . '_certificate_template.docx';
            $filePath = $file->storeAs('certificate-templates/events', $filename);

            // Delete old template if exists
            if ($event->certificate_template_id && $event->certificateTemplate) {
                $oldTemplate = $event->certificateTemplate;
                if ($oldTemplate->file_path && Storage::exists($oldTemplate->file_path)) {
                    Storage::delete($oldTemplate->file_path);
                }
                $oldTemplate->delete();
            }

            ray([
                'upload_success' => Storage::exists($filePath),
                'stored_path' => $filePath,
                'full_physical_path' => storage_path('app/' . $filePath),
                'physical_file_exists' => file_exists(storage_path('app/' . $filePath))
            ])->label('File Upload Debug');

            // Create new certificate template record
            $template = CertificateTemplate::create([
                'name' => 'Custom Template - ' . $validatedData['name'],
                'theme' => 'custom',
                'file_path' => $filePath,
                'config' => json_encode([])
            ]);

            // Associate new template with event
            $validatedData['certificate_template_id'] = $template->id;
        }

        $event->update($validatedData);

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

    public function toggleCertificate(Event $event): ?RedirectResponse
    {
        try {
            $event->update([
                'certificate_enabled' => !$event->certificate_enabled
            ]);

            return back()->with('success', $event->certificate_enabled
                ? 'Certificates enabled for this event'
                : 'Certificates disabled for this event'
            );

        } catch (\Exception $e) {
            return back()->with('error', 'Failed to update certificate setting');
        }
    }


}
