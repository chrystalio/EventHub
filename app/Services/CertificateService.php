<?php

namespace App\Services;

use App\Models\Certificate;
use App\Models\RegistrationAttendee;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Log;
use Dompdf\Dompdf;
use Dompdf\Options;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Exception;

class CertificateService
{
    /**
     * @throws Exception
     */
    public function generateCertificate(RegistrationAttendee $attendee): Certificate
    {
        $event = $attendee->registration->event;

        if (!$event->certificate_enabled) {
            throw new \RuntimeException('Certificates are not enabled for this event.');
        }

        if (!$attendee->hasAttended()) {
            throw new \RuntimeException('Certificate not available. Attendance not confirmed.');
        }

        $existingCertificate = $attendee->certificate;
        if ($existingCertificate && $existingCertificate->status === 'valid') {
            return $existingCertificate;
        }

        $certificate = Certificate::create([
            'attendee_id' => $attendee->id,
            'certificate_number' => $this->generateCertificateNumber($event),
            'file_path' => '',
            'status' => 'valid',
        ]);

        $html = $this->buildCertificateHtml($attendee, $certificate);
        $fileName = "certificates/{$certificate->certificate_number}.pdf";

        $options = new Options();
        $options->set('defaultFont', 'Times');
        $options->set('isRemoteEnabled', false);
        $options->set('isPhpEnabled', true);
        $options->set('chroot', [public_path()]);

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();

        Storage::put($fileName, $dompdf->output());
        $certificate->update(['file_path' => $fileName]);

        return $certificate;
    }

    private function generateCertificateNumber($event): string
    {
        // Format: {SEQ}/E-SERT/ITEBA/{ROMAN_MONTH}/{YEAR}
        $year = now()->format('Y');
        $monthRoman = $this->convertToRoman(now()->format('n'));
        return DB::transaction(function() use ($year, $monthRoman) {
            $existingCount = Certificate::whereYear('created_at', $year)
                ->lockForUpdate()
                ->count();

            $sequence = str_pad($existingCount + 1, 3, '0', STR_PAD_LEFT);
            $certificateNumber = "{$sequence}/E-SERT/ITEBA/{$monthRoman}/{$year}";
            $maxAttempts = 10;
            $attempt = 0;

            while (Certificate::where('certificate_number', $certificateNumber)->exists()) {
                if ($attempt >= $maxAttempts) {
                    throw new \Exception('Unable to generate unique certificate number');
                }

                $existingCount++;
                $sequence = str_pad($existingCount + 1, 3, '0', STR_PAD_LEFT);
                $certificateNumber = "{$sequence}/E-SERT/ITEBA/{$monthRoman}/{$year}";
                $attempt++;
            }

            return $certificateNumber;
        });
    }


    private function convertToRoman(int $month): string
    {
        $romanMonths = [
            1 => 'I', 2 => 'II', 3 => 'III', 4 => 'IV', 5 => 'V', 6 => 'VI',
            7 => 'VII', 8 => 'VIII', 9 => 'IX', 10 => 'X', 11 => 'XI', 12 => 'XII'
        ];
        return $romanMonths[$month] ?? 'I';
    }

    private function buildCertificateHtml(RegistrationAttendee $attendee, Certificate $certificate): string
    {
        $event = $attendee->registration->event;
        $template = $event->certificateTemplate;

        $verificationUrl = $this->generateVerificationUrl($certificate);
        $qrCodeBase64 = $this->generateQrCode($verificationUrl);
        $qrCodeImg = '<img src="data:image/png;base64,' . $qrCodeBase64 . '" style="width: 120px; height: 120px;" alt="Verification QR Code">';
        $logoBase64 = $this->getLogoAsBase64();

        $data = [
            'name' => $attendee->name,
            'event_name' => $event->name,
            'organizer' => $event->organizer ?? 'ITEBA',
            'certificate_number' => $certificate->certificate_number,
            'date' => $event->start_time->format('l, d F Y'),
            'venue' => trim($event->room->name ?? ''),
            'config' => $template->config ?? [],
            'qr_code' => $qrCodeImg,
            'logo_base64' => $logoBase64,
            'short_hash' => substr(hash('sha256', $certificate->uuid), 0, 8),
            'verification_url' => $verificationUrl,
        ];

        return View::make('certificates.iteba_professional', $data)->render();
    }

    private function generateQrCode(string $data): string
    {
        try {
            // Suppress PHP 8.4 deprecation warnings
            $previousErrorLevel = error_reporting(E_ALL & ~E_DEPRECATED);

            $qrCode = QrCode::format('png')
                ->size(120)
                ->margin(2)
                ->errorCorrection('M')
                ->generate($data);

            error_reporting($previousErrorLevel);

            return base64_encode($qrCode);

        } catch (Exception $e) {
            Log::warning('QR Code generation failed', ['error' => $e->getMessage()]);
            return base64_encode('QR Code generation failed');
        }
    }

    private function getLogoAsBase64(): string
    {
        $logoPath = public_path('assets/img/iteba.png');

        if (!file_exists($logoPath)) {
            Log::warning('Certificate logo not found', ['path' => $logoPath]);
            return $this->getFallbackLogo();
        }

        try {
            $imageContent = file_get_contents($logoPath);
            $mimeType = $this->getImageMimeType($logoPath);
            $base64 = base64_encode($imageContent);

            return "data:{$mimeType};base64,{$base64}";

        } catch (Exception $e) {
            Log::error('Failed to read logo file', [
                'path' => $logoPath,
                'error' => $e->getMessage()
            ]);
            return $this->getFallbackLogo();
        }
    }

    private function getImageMimeType(string $filePath): string
    {
        $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));

        return match ($extension) {
            'jpg', 'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml',
            default => 'image/png',
        };
    }

    private function getFallbackLogo(): string
    {
        $svg = '<svg width="100" height="60" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100" height="60" fill="#f0f0f0" stroke="#ccc" stroke-width="1"/>
                    <text x="50" y="35" font-family="Arial" font-size="12" text-anchor="middle" fill="#666">ITEBA</text>
                </svg>';

        return 'data:image/svg+xml;base64,' . base64_encode($svg);
    }

    private function generateVerificationUrl(Certificate $certificate): string
    {
        $payload = [
            'uuid' => $certificate->uuid,
            'issued_at' => $certificate->issued_at->timestamp,
        ];

        $signature = hash_hmac('sha256', json_encode($payload), config('app.key'));

        return route('certificates.verify', [
            'uuid' => $certificate->uuid,
            'sig' => $signature
        ]);
    }
}
