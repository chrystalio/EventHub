<?php

namespace App\Http\Controllers;

use App\Models\RegistrationAttendee;
use App\Services\CertificateService;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CertificateController extends Controller
{
    public function __construct(private CertificateService $certificateService)
    {}

    public function index(): \Inertia\Response
    {
        $user = auth()->user();

        $certificates = RegistrationAttendee::whereHas('registration', function($query) use ($user) {
            $query->where('user_uuid', $user->uuid);
        })
            ->with(['registration.event', 'certificate'])
            ->whereHas('certificate')
            ->whereNotNull('attended_at')
            ->get()
            ->map(function($attendee) {
                return [
                    'id' => $attendee->id,
                    'name' => $attendee->name,
                    'event_name' => $attendee->registration->event->name,
                    'certificate_number' => $attendee->certificate->certificate_number ?? null,
                    'issued_date' => $attendee->certificate->issued_at ?
                        $attendee->certificate->issued_at->format('d F Y') : null,
                    'certificate_url' => route('attendees.certificate', $attendee->id),
                ];
            });

        return Inertia::render('authenticated/certificates/index', [
            'certificates' => $certificates,
        ]);
    }

    public function download($attendeeId): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $attendee = RegistrationAttendee::with(['registration.event', 'registration.user'])
            ->findOrFail($attendeeId);

        if ($attendee->registration->user_uuid !== auth()->user()->uuid) {
            abort(403, 'This is not your certificate.');
        }

        if (!$attendee->hasAttended()) {
            return back()->with('error', 'Certificate not available. Attendance not confirmed.');
        }

        $certificate = $this->certificateService->generateCertificate($attendee);

        // Get the actual file path
        $filePath = storage_path('app/' . $certificate->file_path);

        // Verify file exists
        if (!file_exists($filePath)) {
            abort(404, 'Certificate file not found');
        }

        // Clear any output buffers to prevent corruption
        while (ob_get_level()) {
            ob_end_clean();
        }

        // Get correct file extension
        $fileExtension = pathinfo($certificate->file_path, PATHINFO_EXTENSION);

        // Create safe filename with correct extension
        $safeFilename = preg_replace('/[^a-zA-Z0-9._-]/', '_', $certificate->certificate_number);
        $downloadName = $safeFilename . '.' . $fileExtension;

        // Use response()->download() with absolute path instead of Storage::download()
        return response()->download($filePath, $downloadName, [
            'Content-Type' => $fileExtension === 'pdf'
                ? 'application/pdf'
                : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition' => 'attachment; filename="' . $downloadName . '"',
        ]);
    }

}
