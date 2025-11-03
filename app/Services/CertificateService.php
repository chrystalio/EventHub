<?php

namespace App\Services;

use App\Models\Certificate;
use App\Models\RegistrationAttendee;
use App\Models\CertificateSetting;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Log;
use Dompdf\Dompdf;
use Dompdf\Options;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use PhpOffice\PhpWord\TemplateProcessor;
use Exception;

class CertificateService
{
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

        $filePath = $this->generateCertificateFile($attendee, $certificate);
        $certificate->update(['file_path' => $filePath]);

        return $certificate;
    }

    public function downloadCertificate(Certificate $certificate)
    {
        if (!Storage::exists($certificate->file_path)) {
            abort(404, 'Certificate file not found');
        }

        $fileExtension = pathinfo($certificate->file_path, PATHINFO_EXTENSION);
        $contentType = $fileExtension === 'pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

        $fileName = 'certificate_' . preg_replace('/[^a-zA-Z0-9._-]/', '_', $certificate->certificate_number) . '.' . $fileExtension;

        return Storage::download($certificate->file_path, $fileName, [
            'Content-Type' => $contentType,
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
        ]);
    }

    private function generateCertificateFile(RegistrationAttendee $attendee, Certificate $certificate): string
    {
        $event = $attendee->registration->event;
        $event->load('certificateTemplate');

        ray([
            'event_id' => $event->id,
            'certificate_template_id' => $event->certificate_template_id,
            'has_certificateTemplate' => !!$event->certificateTemplate,
            'template_file_path' => $event->certificateTemplate->file_path ?? null,
        ])->label('Certificate Generation Debug')->color('blue');

        if ($event->certificate_template_id && $event->certificateTemplate && $event->certificateTemplate->file_path) {
            ray('Attempting custom template processing')->color('green');

            try {
                $filePath = $this->processCustomTemplate($attendee, $certificate);

                ray('Custom template generated successfully')->color('green');
                ray(['file_path' => $filePath, 'file_size' => Storage::size($filePath)])->label('Generated File Info');

                if (!Storage::exists($filePath) || Storage::size($filePath) === 0) {
                    throw new \Exception('Generated certificate file is empty or corrupted');
                }

                return $filePath;

            } catch (\Exception $e) {
                ray('Custom template failed, falling back to default')->color('red');
                ray([
                    'error' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine()
                ])->label('Custom Template Error');
            }
        } else {
            ray('Using default template - conditions not met')->color('orange');
        }

        ray('Generating default PDF certificate')->color('yellow');
        return $this->generateDefaultCertificate($attendee, $certificate);
    }

    private function generateDefaultCertificate(RegistrationAttendee $attendee, Certificate $certificate): string
    {
        $html = $this->buildCertificateHtml($attendee, $certificate);
        $fileName = 'certificates/' . preg_replace('/[^a-zA-Z0-9._-]/', '_', $certificate->certificate_number) . '.pdf';

        $options = new Options();
        $options->set('defaultFont', 'DejaVu Sans');
        $options->set('isRemoteEnabled', false);
        $options->set('isPhpEnabled', false);

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();

        $output = $dompdf->output();
        Storage::put($fileName, $output);

        ray([
            'file_path' => $fileName,
            'file_size' => strlen($output),
            'storage_size' => Storage::size($fileName)
        ])->label('Default PDF Generated')->color('blue');

        return $fileName;
    }

    private function processCustomTemplate(RegistrationAttendee $attendee, Certificate $certificate): string
    {
        $event = $attendee->registration->event;

        $templatePath = storage_path('app/' . $event->certificateTemplate->file_path);

        ray([
            'template_path' => $templatePath,
            'file_exists' => file_exists($templatePath),
            'file_size' => file_exists($templatePath) ? filesize($templatePath) : 0
        ])->label('Template File Check')->color('purple');

        if (!file_exists($templatePath)) {
            throw new \Exception('Custom template file not found at: ' . $templatePath);
        }

        try {
            $templateProcessor = new TemplateProcessor($templatePath);

            $textValues = [
                'participant_name' => $attendee->name,
                'event_name' => $event->name,
                'organizer' => $event->organizer ?? 'ITEBA',
                'start_time' => $event->start_time->format('l, d F Y'),
                'room' => trim($event->room->name ?? ''),
                'certificate_number' => $certificate->certificate_number
            ];

            ray($textValues)->label('Setting Text Values')->color('cyan');

            foreach ($textValues as $key => $value) {
                $templateProcessor->setValue($key, $value);
            }

            ray('Text values set successfully')->color('green');

            // Handle logo image
            $logoPath = public_path('assets/img/iteba.png');
            ray([
                'logo_path' => $logoPath,
                'logo_exists' => file_exists($logoPath),
                'logo_size' => file_exists($logoPath) ? filesize($logoPath) : 0
            ])->label('Logo Check')->color('orange');

            if (file_exists($logoPath)) {
                ray('Setting logo image')->color('green');
                $templateProcessor->setImageValue('logo', [
                    'path' => $logoPath,
                    'width' => 100,
                    'height' => 60,
                    'ratio' => true
                ]);
                ray('Logo image set successfully')->color('green');
            } else {
                ray('Logo file not found - skipping')->color('red');
            }

            $verificationUrl = $this->generateVerificationUrl($certificate);
            ray('Generated verification URL: ' . $verificationUrl)->color('blue');

            $qrCodePath = $this->generateQrCodeFile($verificationUrl);

            ray([
                'qr_path' => $qrCodePath,
                'qr_exists' => file_exists($qrCodePath),
                'qr_size' => file_exists($qrCodePath) ? filesize($qrCodePath) : 0
            ])->label('QR Code Check')->color('orange');

            if (file_exists($qrCodePath)) {
                ray('Setting QR code image')->color('green');
                $templateProcessor->setImageValue('qrcode', [
                    'path' => $qrCodePath,
                    'width' => 90,
                    'height' => 90,
                    'ratio' => true
                ]);
                ray('QR code image set successfully')->color('green');
            } else {
                ray('QR code file not generated - skipping')->color('red');
            }


            $safeNumber = preg_replace('/[^a-zA-Z0-9_-]/', '_', $certificate->certificate_number);
            $timestamp = now()->format('Ymd_His');
            $filename = "certificate_{$safeNumber}_{$timestamp}.docx";
            $storagePath = "certificates/{$filename}";

            ray([
                'safe_number' => $safeNumber,
                'timestamp' => $timestamp,
                'filename' => $filename,
                'storage_path' => $storagePath
            ])->label('Generated Filename')->color('purple');


            $tempDir = storage_path('app/temp');
            if (!file_exists($tempDir)) {
                mkdir($tempDir, 0755, true);
                ray('Created temp directory: ' . $tempDir)->color('yellow');
            }
            $tempFilePath = $tempDir . '/' . $filename;

            ray([
                'temp_dir' => $tempDir,
                'temp_file_path' => $tempFilePath,
                'temp_dir_exists' => file_exists($tempDir),
                'temp_dir_writable' => is_writable($tempDir)
            ])->label('Temp Directory Check')->color('purple');


            ray('About to call templateProcessor->saveAs()')->color('yellow');

            try {
                $templateProcessor->saveAs($tempFilePath);
                ray('templateProcessor->saveAs() completed successfully')->color('green');
            } catch (\Exception $e) {
                ray('templateProcessor->saveAs() failed')->color('red');
                ray([
                    'error' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine()
                ])->label('SaveAs Error');
                throw $e;
            }


            ray('Checking if temp file was created...')->color('yellow');
            $tempFileExists = file_exists($tempFilePath);
            $tempFileSize = $tempFileExists ? filesize($tempFilePath) : 0;

            ray([
                'temp_file_exists' => $tempFileExists,
                'temp_file_size' => $tempFileSize
            ])->label('Temp File Verification')->color($tempFileExists && $tempFileSize > 0 ? 'green' : 'red');

            if (!$tempFileExists || $tempFileSize === 0) {
                ray('Temp file creation failed')->color('red');
                throw new \Exception('Failed to generate processed template file');
            }

            ray('Reading temp file content...')->color('yellow');
            $processedContent = file_get_contents($tempFilePath);

            if ($processedContent === false || empty($processedContent)) {
                ray('Failed to read temp file content')->color('red');
                throw new \Exception('Failed to read processed template content');
            }

            ray([
                'content_length' => strlen($processedContent),
                'content_preview' => substr($processedContent, 0, 50) . '...'
            ])->label('File Content Read')->color('green');

            ray('Storing processed content to Laravel storage...')->color('yellow');
            Storage::put($storagePath, $processedContent);

            ray([
                'storage_exists' => Storage::exists($storagePath),
                'storage_size' => Storage::size($storagePath)
            ])->label('Storage Operation')->color('green');


            if (file_exists($tempFilePath)) {
                unlink($tempFilePath);
                ray('Cleaned up temp file')->color('blue');
            }
            if (file_exists($qrCodePath)) {
                unlink($qrCodePath);
                ray('Cleaned up QR code file')->color('blue');
            }

            ray([
                'final_storage_path' => $storagePath,
                'final_file_size' => Storage::size($storagePath),
                'final_file_exists' => Storage::exists($storagePath)
            ])->label('Custom Template Processing Complete')->color('green');

            if (str_ends_with($storagePath, '.docx')) {
                ray('Converting DOCX to PDF')->color('yellow');
                $storagePath = $this->convertDocxToPdf($storagePath);
            }

            return $storagePath;
        } catch (\Exception $e) {
            ray('Error in custom template processing')->color('red');
            ray([
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ])->label('Processing Error');
            throw $e;
        }
    }

    private function generateQrCodeFile(string $data): string
    {
        try {
            $tempDir = storage_path('app/temp');
            if (!file_exists($tempDir)) {
                mkdir($tempDir, 0755, true);
            }

            $qrCodePath = $tempDir . '/qr_' . uniqid() . '.png';

            ray('Generating QR code file: ' . $qrCodePath)->color('cyan');

            $qrCode = QrCode::format('png')
                ->size(100)
                ->margin(2)
                ->errorCorrection('M')
                ->generate($data);

            file_put_contents($qrCodePath, $qrCode);

            ray('QR code file generated successfully')->color('green');
            return $qrCodePath;

        } catch (Exception $e) {
            ray('QR Code file generation failed: ' . $e->getMessage())->color('red');
            return '';
        }
    }

    private function verifyFileIntegrity(string $filePath): bool
    {
        try {
            if (!Storage::exists($filePath)) {
                return false;
            }
            $fileSize = Storage::size($filePath);
            if ($fileSize === 0) {
                return false;
            }
            $content = Storage::get($filePath);
            if (strlen($content) < 4) {
                return false;
            }
            $zipSignature = substr($content, 0, 4);
            return $zipSignature === "PK\x03\x04" || $zipSignature === "PK\x05\x06" || $zipSignature === "PK\x07\x08";
        } catch (\Exception $e) {
            return false;
        }
    }
    private function generateCertificateNumber($event): string
    {
        $year = now()->format('Y');
        $month = now()->format('n');
        $monthRoman = $this->convertToRoman($month);

        return DB::transaction(static function() use ($year, $month, $monthRoman) {
            $lastCertificate = Certificate::whereYear('created_at', $year)
                ->whereMonth('created_at', $month)
                ->orderBy('created_at', 'desc')
                ->first();

            $nextSequence = 1;
            if ($lastCertificate) {
                $parts = explode('/', $lastCertificate->certificate_number);
                $lastSequence = (int) $parts[0];
                $nextSequence = $lastSequence + 1;
            }

            $sequence = str_pad($nextSequence, 3, '0', STR_PAD_LEFT);
            $certificateNumber = "{$sequence}/E-SERT/ITEBA/{$monthRoman}/{$year}";


            if (Certificate::where('certificate_number', $certificateNumber)->exists()) {
                throw new \RuntimeException('Certificate number collision detected');
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
            'qr_code' => $qrCodeImg,
            'logo_base64' => $logoBase64,
            'verification_url' => $verificationUrl,
        ];

        return View::make('certificates.iteba_professional', $data)->render();
    }

    private function generateQrCode(string $data): string
    {
        try {
            $qrCode = QrCode::format('png')
                ->size(60)
                ->margin(2)
                ->errorCorrection('M')
                ->generate($data);

            return base64_encode($qrCode);
        } catch (Exception $e) {
            ray('QR Code generation failed: ' . $e->getMessage())->color('red');
            return base64_encode('QR Code generation failed');
        }
    }

    private function getLogoAsBase64(): string
    {
        $logoPath = public_path('assets/img/iteba.png');

        if (!file_exists($logoPath)) {
            ray('Certificate logo not found: ' . $logoPath)->color('red');
            return $this->getFallbackLogo();
        }

        try {
            $imageContent = file_get_contents($logoPath);
            $mimeType = $this->getImageMimeType($logoPath);
            $base64 = base64_encode($imageContent);

            return "data:{$mimeType};base64,{$base64}";

        } catch (Exception $e) {
            ray('Failed to read logo file: ' . $e->getMessage())->color('red');
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
        $signature = hash_hmac('sha256', json_encode($payload, JSON_THROW_ON_ERROR), config('app.key'));
        return route('certificates.verify', [
            'uuid' => $certificate->uuid,
            'sig' => $signature
        ]);
    }

    private function convertDocxToPdf(string $docxPath): string
    {
        $fullDocxPath = storage_path('app/' . $docxPath);
        $pdfPath = str_replace('.docx', '.pdf', $docxPath);
        $fullPdfPath = storage_path('app/' . $pdfPath);

        ray([
            'docx_path' => $fullDocxPath,
            'pdf_path' => $fullPdfPath,
            'docx_exists' => file_exists($fullDocxPath)
        ])->label('Converting DOCX to PDF')->color('yellow');

        // Ensure output directory exists
        $outputDir = dirname($fullPdfPath);
        if (!file_exists($outputDir)) {
            mkdir($outputDir, 0755, true);
        }

        $command = sprintf(
            'libreoffice --headless --convert-to pdf --outdir %s %s 2>&1',
            escapeshellarg($outputDir),
            escapeshellarg($fullDocxPath)
        );

        ray('Executing command: ' . $command)->color('blue');


        exec($command, $output, $returnCode);

        ray([
            'return_code' => $returnCode,
            'output' => $output,
            'pdf_created' => file_exists($fullPdfPath),
            'pdf_size' => file_exists($fullPdfPath) ? filesize($fullPdfPath) : 0
        ])->label('LibreOffice Conversion Result')->color($returnCode === 0 ? 'green' : 'red');

        if ($returnCode === 0 && file_exists($fullPdfPath) && filesize($fullPdfPath) > 0) {
            // Delete the original DOCX file since we now have PDF
            if (file_exists($fullDocxPath)) {
                unlink($fullDocxPath);
                ray('Original DOCX file deleted')->color('blue');
            }

            ray('PDF conversion successful: ' . $pdfPath)->color('green');
            return $pdfPath;
        }

        ray('PDF conversion failed, keeping DOCX')->color('orange');
        return $docxPath;
    }

}
