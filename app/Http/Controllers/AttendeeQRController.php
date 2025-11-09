<?php

namespace App\Http\Controllers;

use App\Models\RegistrationAttendee;
use App\Services\StaticQRCodeService;
use Illuminate\Http\Response;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class AttendeeQRController extends Controller
{
    /**
     * Download QR code as PNG image with attendee and event information
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

        // Generate QR code image with high error correction at larger size
        $qrCodeImage = QrCode::size(500)
            ->errorCorrection('H')  // Highest error correction (30%)
            ->format('png')
            ->margin(2)
            ->generate($qrData);

        // Create image resource from QR code
        $qrImage = imagecreatefromstring($qrCodeImage);

        // Create canvas with better proportions
        $canvasWidth = 800;
        $canvasHeight = 1000;
        $canvas = imagecreatetruecolor($canvasWidth, $canvasHeight);

        // Enable antialiasing for smoother lines
        imageantialias($canvas, true);

        // Define modern color palette
        $white = imagecolorallocate($canvas, 255, 255, 255);
        $black = imagecolorallocate($canvas, 30, 30, 30);
        $darkGray = imagecolorallocate($canvas, 75, 85, 99); // Gray-600
        $mediumGray = imagecolorallocate($canvas, 156, 163, 175); // Gray-400
        $lightGray = imagecolorallocate($canvas, 249, 250, 251); // Gray-50
        $borderGray = imagecolorallocate($canvas, 229, 231, 235); // Gray-200
        $primaryBlue = imagecolorallocate($canvas, 59, 130, 246); // Blue-500
        $darkBlue = imagecolorallocate($canvas, 30, 64, 175); // Blue-800

        // Fill background with light gray
        imagefilledrectangle($canvas, 0, 0, $canvasWidth, $canvasHeight, $lightGray);

        // Draw main card container (white background with shadow effect)
        $cardMargin = 40;
        $cardX = $cardMargin;
        $cardY = $cardMargin;
        $cardWidth = $canvasWidth - ($cardMargin * 2);
        $cardHeight = $canvasHeight - ($cardMargin * 2);

        // Shadow effect (3 layers for depth)
        $shadowGray1 = imagecolorallocate($canvas, 200, 200, 200);
        $shadowGray2 = imagecolorallocate($canvas, 210, 210, 210);
        $shadowGray3 = imagecolorallocate($canvas, 220, 220, 220);
        imagefilledrectangle($canvas, $cardX + 6, $cardY + 6, $cardX + $cardWidth + 6, $cardY + $cardHeight + 6, $shadowGray3);
        imagefilledrectangle($canvas, $cardX + 4, $cardY + 4, $cardX + $cardWidth + 4, $cardY + $cardHeight + 4, $shadowGray2);
        imagefilledrectangle($canvas, $cardX + 2, $cardY + 2, $cardX + $cardWidth + 2, $cardY + $cardHeight + 2, $shadowGray1);

        // Main card
        imagefilledrectangle($canvas, $cardX, $cardY, $cardX + $cardWidth, $cardY + $cardHeight, $white);

        // Draw gradient-like header (using multiple rectangles for gradient effect)
        $headerHeight = 140;
        for ($i = 0; $i < $headerHeight; $i++) {
            $ratio = $i / $headerHeight;
            $r = (int) (30 + (59 - 30) * $ratio);
            $g = (int) (64 + (130 - 64) * $ratio);
            $b = (int) (175 + (246 - 175) * $ratio);
            $gradientColor = imagecolorallocate($canvas, $r, $g, $b);
            imageline($canvas, $cardX, $cardY + $i, $cardX + $cardWidth, $cardY + $i, $gradientColor);
        }

        // Draw event name in header (white text on blue)
        $eventName = $this->truncateText($event->name, 45);
        $this->drawText($canvas, $eventName, 28, $cardY + 50, $white, $canvasWidth, true);

        // Draw subtitle "EVENT TICKET"
        $this->drawText($canvas, 'EVENT TICKET', 16, $cardY + 95, $white, $canvasWidth);

        // QR Code section
        $qrSectionY = $cardY + $headerHeight + 50;
        $qrSize = 450;
        $qrX = ($canvasWidth - $qrSize) / 2;
        $qrY = $qrSectionY;

        // QR code background (subtle border)
        $qrBorderSize = 8;
        imagefilledrectangle($canvas, $qrX - $qrBorderSize, $qrY - $qrBorderSize,
                           $qrX + $qrSize + $qrBorderSize, $qrY + $qrSize + $qrBorderSize, $borderGray);

        // White background for QR
        imagefilledrectangle($canvas, $qrX, $qrY, $qrX + $qrSize, $qrY + $qrSize, $white);

        // Copy QR code
        $qrOriginalSize = imagesx($qrImage);
        $qrPadding = 20;
        imagecopyresampled($canvas, $qrImage,
            $qrX + $qrPadding, $qrY + $qrPadding,
            0, 0,
            $qrSize - ($qrPadding * 2), $qrSize - ($qrPadding * 2),
            $qrOriginalSize, $qrOriginalSize);

        // Information section below QR
        $infoStartY = $qrY + $qrSize + 60;

        // Add attendee name (bold/large)
        $attendeeName = $this->truncateText($attendee->name, 40);
        $this->drawText($canvas, $attendeeName, 26, $infoStartY, $black, $canvasWidth, true);

        // Add attendee type badge with background
        $attendeeType = strtoupper($attendee->attendee_type);
        $badgeY = $infoStartY + 45;
        $badgeText = '• '.$attendeeType.' •';

        // Calculate badge dimensions
        $fontPath = base_path('public/fonts/Roboto-Regular.ttf');
        $bbox = imagettfbbox(14, 0, $fontPath, $badgeText);
        $badgeWidth = abs($bbox[4] - $bbox[0]) + 30;
        $badgeHeight = 30;
        $badgeX = ($canvasWidth - $badgeWidth) / 2;

        // Draw badge background
        imagefilledrectangle($canvas, $badgeX, $badgeY, $badgeX + $badgeWidth, $badgeY + $badgeHeight, $primaryBlue);

        // Draw badge text
        $this->drawText($canvas, $badgeText, 14, $badgeY + 8, $white, $canvasWidth);

        // Event details section
        $detailsStartY = $badgeY + 60;

        // Event date with icon-like bullet
        $eventDate = date('l, F j, Y', strtotime($event->start_time));
        $this->drawText($canvas, '◆ '.$eventDate, 18, $detailsStartY, $darkGray, $canvasWidth);

        // Event time
        $eventTime = date('g:i A', strtotime($event->start_time));
        $this->drawText($canvas, '◆ '.$eventTime, 18, $detailsStartY + 35, $darkGray, $canvasWidth);

        // Event location (if available)
        if ($event->building && $event->room) {
            $location = $event->building->name.' - '.$event->room->name;
            $location = $this->truncateText($location, 50);
            $this->drawText($canvas, '◆ '.$location, 16, $detailsStartY + 70, $mediumGray, $canvasWidth);
        }

        // Output as PNG
        ob_start();
        imagepng($canvas);
        $imageData = ob_get_clean();

        // Clean up
        imagedestroy($canvas);
        imagedestroy($qrImage);

        // Generate filename
        $filename = $this->sanitizeFilename($attendee->name).'-qr-code.png';

        return response($imageData)
            ->header('Content-Type', 'image/png')
            ->header('Content-Disposition', "attachment; filename=\"{$filename}\"");
    }

    /**
     * Draw centered text on image using TrueType fonts
     */
    private function drawText($image, string $text, int $size, int $y, int $color, int $canvasWidth, bool $bold = false): void
    {
        $fontFile = $bold ? 'Roboto-Bold.ttf' : 'Roboto-Regular.ttf';
        $fontPath = base_path('public/fonts/'.$fontFile);

        // Check if TrueType font is available
        if (file_exists($fontPath)) {
            // Calculate text bounding box
            $bbox = imagettfbbox($size, 0, $fontPath, $text);
            $textWidth = abs($bbox[4] - $bbox[0]);
            $textHeight = abs($bbox[5] - $bbox[1]);

            // Calculate centered X position
            $x = ($canvasWidth - $textWidth) / 2;

            // Draw text with TrueType font
            imagettftext($image, $size, 0, $x, $y + $textHeight, $color, $fontPath, $text);
        } else {
            // Fallback to built-in fonts if TrueType not available
            $builtInSize = max(1, min(5, (int) ($size / 4)));
            $textWidth = imagefontwidth($builtInSize) * strlen($text);
            $x = (int) (($canvasWidth - $textWidth) / 2);

            imagestring($image, $builtInSize, $x, $y, $text, $color);

            // Simulate bold
            if ($bold) {
                imagestring($image, $builtInSize, $x + 1, $y, $text, $color);
                imagestring($image, $builtInSize, $x, $y + 1, $text, $color);
            }
        }
    }

    /**
     * Truncate text to specified length
     */
    private function truncateText(string $text, int $maxLength): string
    {
        if (strlen($text) > $maxLength) {
            return substr($text, 0, $maxLength - 3).'...';
        }

        return $text;
    }

    /**
     * Sanitize filename for download
     */
    private function sanitizeFilename(string $name): string
    {
        // Remove special characters and spaces
        $name = preg_replace('/[^a-zA-Z0-9\s-]/', '', $name);
        $name = preg_replace('/\s+/', '-', $name);
        $name = strtolower(trim($name, '-'));

        return $name ?: 'attendee';
    }
}
