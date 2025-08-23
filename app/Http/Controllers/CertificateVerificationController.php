<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Exception;

class CertificateVerificationController extends Controller
{
    public function verify(Request $request, string $uuid)
    {
        try {
            $signature = $request->get('sig');
            if (!$signature) {
                return inertia('public/certificates/verify-error', [
                    'error' => [
                        'code' => 400,
                        'type' => 'missing_signature',
                        'message' => 'Verification signature is required.'
                    ],
                    'uuid' => $uuid
                ]);
            }

            $certificate = Certificate::where('uuid', $uuid)
                ->with(['attendee.registration.event'])
                ->firstOrFail();

            if ($certificate->status === 'revoked') {
                return inertia('public/certificates/verify-error', [
                    'error' => [
                        'code' => 403,
                        'type' => 'revoked',
                        'message' => 'This certificate has been revoked and is no longer valid.'
                    ],
                    'uuid' => $uuid
                ]);
            }

            $payload = [
                'uuid' => $certificate->uuid,
                'issued_at' => $certificate->issued_at->timestamp,
            ];

            $expectedSignature = hash_hmac('sha256', json_encode($payload, JSON_THROW_ON_ERROR), config('app.key'));

            if (!hash_equals($expectedSignature, $signature)) {
                return inertia('public/certificates/verify-error', [
                    'error' => [
                        'code' => 403,
                        'type' => 'invalid_signature',
                        'message' => 'Invalid verification signature.'
                    ],
                    'uuid' => $uuid
                ]);
            }

            $shortHash = substr(hash('sha256', $certificate->uuid), 0, 8);
            $event = $certificate->attendee->registration->event;

            return inertia('public/certificates/verify', [
                'certificate' => [
                    'number' => $certificate->certificate_number,
                    'status' => $certificate->status,
                    'issued_at' => $certificate->issued_at->format('F j, Y \a\t g:i A'),
                    'short_hash' => $shortHash,
                ],
                'attendee' => [
                    'name' => $certificate->attendee->name,
                ],
                'event' => [
                    'name' => $event->name,
                    'start_time' => $event->start_time->format('F j, Y'),
                    'organizer' => $event->organizer,
                ],
            ]);

        } catch (ModelNotFoundException $e) {
            return inertia('public/certificates/verify-error', [
                'error' => [
                    'code' => 404,
                    'type' => 'not_found',
                    'message' => 'Certificate not found.'
                ],
                'uuid' => $uuid
            ]);
        } catch (Exception $e) {
            \Log::error('Certificate verification error: ' . $e->getMessage(), [
                'uuid' => $uuid,
                'signature' => $signature ?? null,
            ]);

            return inertia('public/certificates/verify-error', [
                'error' => [
                    'code' => 500,
                    'type' => 'server_error',
                    'message' => 'An unexpected error occurred during verification.'
                ],
                'uuid' => $uuid
            ]);
        }
    }
}
