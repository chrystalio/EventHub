<?php

namespace App\Services;

use App\Models\Event;
use App\Models\RegistrationAttendee;
use Illuminate\Support\Facades\Log;

class StaticQRCodeService
{
    /**
     * Generate static QR code data for an attendee
     * Includes event context in signature to prevent event cloning attacks
     */
    public function generateQRData(RegistrationAttendee $attendee): string
    {
        $event = $attendee->registration->event;

        $payload = [
            'attendee_uuid' => $attendee->qr_code,  // qr_code serves as UUID
            'event_uuid' => $event->uuid,
            'registration_uuid' => $attendee->registration->uuid,
            'timestamp' => now()->timestamp,
        ];

        // Include event start time in signature to prevent event cloning attacks
        $signatureInput = json_encode($payload).'|'.$event->start_time;
        $signature = hash_hmac('sha256', $signatureInput, config('app.key'));

        $payload['signature'] = $signature;

        return json_encode($payload);
    }

    /**
     * Verify static QR code data with enhanced security checks
     */
    public function verifyQRData(string $qrData, Event $event): ?RegistrationAttendee
    {
        try {
            $payload = json_decode($qrData, true);

            if (! $payload || ! isset($payload['signature'])) {
                Log::warning('Static QR: Missing signature or invalid JSON', [
                    'qr_data_length' => strlen($qrData),
                ]);

                return null;
            }

            // Extract signature
            $providedSignature = $payload['signature'];
            unset($payload['signature']);

            // Verify event match BEFORE signature check (fail fast)
            if ($payload['event_uuid'] !== $event->uuid) {
                Log::warning('Static QR: Event UUID mismatch', [
                    'expected' => $event->uuid,
                    'received' => $payload['event_uuid'],
                ]);

                return null;
            }

            // Recompute signature with event start time
            $signatureInput = json_encode($payload).'|'.$event->start_time;
            $expectedSignature = hash_hmac('sha256', $signatureInput, config('app.key'));

            // Constant-time comparison (prevents timing attacks)
            if (! hash_equals($expectedSignature, $providedSignature)) {
                Log::warning('Static QR: Invalid signature', [
                    'attendee_uuid' => $payload['attendee_uuid'] ?? 'unknown',
                ]);

                return null;
            }

            // Fetch and return attendee
            $attendee = RegistrationAttendee::where('qr_code', $payload['attendee_uuid'])
                ->whereHas('registration', function ($query) use ($event) {
                    $query->where('event_uuid', $event->uuid);
                })
                ->first();

            if (! $attendee) {
                Log::warning('Static QR: Attendee not found or not registered for event', [
                    'attendee_uuid' => $payload['attendee_uuid'],
                    'event_uuid' => $event->uuid,
                ]);
            }

            return $attendee;

        } catch (\Exception $e) {
            Log::error('Static QR: Verification error', [
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }
}
