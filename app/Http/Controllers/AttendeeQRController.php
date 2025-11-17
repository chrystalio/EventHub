<?php

namespace App\Http\Controllers;

use App\Models\RegistrationAttendee;
use App\Services\StaticQRCodeService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class AttendeeQRController extends Controller
{
    /**
     * Download QR code ticket as PDF
     */
    public function download(RegistrationAttendee $attendee): Response
    {
        // Authorization: user must own this attendee's registration
        if (auth()->user()->uuid !== $attendee->registration->user_uuid) {
            abort(403, 'Unauthorized');
        }

        // Load event with relationships
        $event = $attendee->registration->event->load(['building', 'room']);

        // Verify event uses static QR
        if ($event->qr_type !== 'static') {
            abort(422, 'This event uses dynamic QR codes. Download is only available for static QR codes.');
        }

        // Generate QR data
        $qrService = app(StaticQRCodeService::class);
        $qrData = $qrService->generateQRData($attendee);

        // Generate styled QR code with modern design
        $qrCodeImage = QrCode::size(250)
            ->errorCorrection('H')  // Highest error correction (30%)
            ->format('png')
            ->margin(0)
            ->style('round')  // Rounded dots for modern look
            ->eye('circle')   // Circular eye pattern
            ->generate($qrData);

        // Convert to base64 data URI
        $qrCodeDataUri = 'data:image/png;base64,' . base64_encode($qrCodeImage);

        // Generate PDF from Blade view
        $pdf = Pdf::loadView('pdf.qr-ticket', [
            'attendee' => $attendee,
            'event' => $event,
            'qrCodeDataUri' => $qrCodeDataUri,
        ]);

        // Configure PDF settings
        $pdf->setPaper('a4', 'portrait');
        $pdf->setOption('isHtml5ParserEnabled', true);
        $pdf->setOption('isRemoteEnabled', false);

        // Generate filename
        $filename = $this->sanitizeFilename($attendee->name) . '-ticket.pdf';

        // Return PDF as download
        return $pdf->download($filename);
    }


    private function sanitizeFilename(string $name): string
    {
        $name = preg_replace('/[^a-zA-Z0-9\s-]/', '', $name);
        $name = preg_replace('/\s+/', '-', $name);
        $name = strtolower(trim($name, '-'));
        return $name ?: 'attendee';
    }
}
