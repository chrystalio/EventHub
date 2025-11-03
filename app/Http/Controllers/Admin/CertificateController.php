<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\CertificateTemplate;
use App\Services\CertificateService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CertificateController extends Controller
{
    public function __construct(private CertificateService $certificateService)
    {}

    public function show(Event $event)
    {
        $this->authorize('manage', $event);

        $certificates = $event->certificates()->with('attendee')->get();

        return inertia('admin/events/certificates', [
            'event' => $event->load('certificateTemplate'),
            'certificates' => $certificates,
        ]);
    }

    public function configure(Request $request, Event $event): RedirectResponse
    {
        $this->authorize('manage', $event);

        $validated = $request->validate([
            'certificate_number_format' => 'nullable|string|max:100',
        ]);

        $event->update([
            'certificate_enabled' => true,
            'certificate_number_format' => $validated['certificate_number_format'] ?? null,
        ]);

        return back()->with('success', 'Certificate configuration updated successfully.');
    }

    public function bulkReissue(Event $event): RedirectResponse
    {
        $this->authorize('manage', $event);

        $attendees = $event->registrations()
            ->with('attendees')
            ->get()
            ->flatMap(fn($registration) => $registration->attendees)
            ->filter(fn($attendee) => $attendee->hasAttended());

        foreach ($attendees as $attendee) {
            // Revoke existing certificate
            $attendee->certificate?->update(['status' => 'revoked']);

            // Generate new certificate
            $this->certificateService->generateCertificate($attendee);
        }

        return back()->with('success', 'Certificates reissued successfully.');
    }
}
