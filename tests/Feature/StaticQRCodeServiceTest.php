<?php

use App\Models\Event;
use App\Models\Registration;
use App\Models\RegistrationAttendee;
use App\Models\User;
use App\Services\StaticQRCodeService;

beforeEach(function () {
    $this->service = new StaticQRCodeService;
});

it('generates valid QR data with all required fields', function () {
    $event = Event::factory()->create(['qr_type' => 'static']);
    $user = User::factory()->create();
    $registration = Registration::factory()->create([
        'event_uuid' => $event->uuid,
        'user_uuid' => $user->uuid,
    ]);
    $attendee = RegistrationAttendee::factory()->create([
        'registration_id' => $registration->id,
        'registration_uuid' => $registration->uuid,
    ]);

    $qrData = $this->service->generateQRData($attendee);

    expect($qrData)->toBeJson();

    $payload = json_decode($qrData, true);

    expect($payload)->toHaveKeys(['attendee_uuid', 'event_uuid', 'registration_uuid', 'timestamp', 'signature'])
        ->and($payload['attendee_uuid'])->toBe($attendee->uuid)
        ->and($payload['event_uuid'])->toBe($event->uuid)
        ->and($payload['registration_uuid'])->toBe($registration->uuid)
        ->and($payload['timestamp'])->toBeInt()
        ->and($payload['signature'])->toBeString()->not->toBeEmpty();
});

it('verifies valid QR data successfully', function () {
    $event = Event::factory()->create(['qr_type' => 'static']);
    $user = User::factory()->create();
    $registration = Registration::factory()->create([
        'event_uuid' => $event->uuid,
        'user_uuid' => $user->uuid,
    ]);
    $attendee = RegistrationAttendee::factory()->create([
        'registration_id' => $registration->id,
        'registration_uuid' => $registration->uuid,
    ]);

    $qrData = $this->service->generateQRData($attendee);
    $verifiedAttendee = $this->service->verifyQRData($qrData, $event);

    expect($verifiedAttendee)->not->toBeNull()
        ->and($verifiedAttendee->uuid)->toBe($attendee->uuid);
});

it('rejects QR data with invalid signature', function () {
    $event = Event::factory()->create(['qr_type' => 'static']);
    $user = User::factory()->create();
    $registration = Registration::factory()->create([
        'event_uuid' => $event->uuid,
        'user_uuid' => $user->uuid,
    ]);
    $attendee = RegistrationAttendee::factory()->create([
        'registration_id' => $registration->id,
        'registration_uuid' => $registration->uuid,
    ]);

    $qrData = $this->service->generateQRData($attendee);
    $payload = json_decode($qrData, true);

    // Tamper with signature
    $payload['signature'] = 'invalid_signature';
    $tamperedQrData = json_encode($payload);

    $verifiedAttendee = $this->service->verifyQRData($tamperedQrData, $event);

    expect($verifiedAttendee)->toBeNull();
});

it('rejects QR data with mismatched event UUID', function () {
    $event1 = Event::factory()->create(['qr_type' => 'static']);
    $event2 = Event::factory()->create(['qr_type' => 'static']);
    $user = User::factory()->create();
    $registration = Registration::factory()->create([
        'event_uuid' => $event1->uuid,
        'user_uuid' => $user->uuid,
    ]);
    $attendee = RegistrationAttendee::factory()->create([
        'registration_id' => $registration->id,
        'registration_uuid' => $registration->uuid,
    ]);

    // Generate QR for event1
    $qrData = $this->service->generateQRData($attendee);

    // Try to verify with event2
    $verifiedAttendee = $this->service->verifyQRData($qrData, $event2);

    expect($verifiedAttendee)->toBeNull();
});

it('rejects QR data with missing signature', function () {
    $event = Event::factory()->create(['qr_type' => 'static']);

    $invalidQrData = json_encode([
        'attendee_uuid' => 'some-uuid',
        'event_uuid' => $event->uuid,
        'registration_uuid' => 'some-reg-uuid',
        'timestamp' => now()->timestamp,
        // Missing signature
    ]);

    $verifiedAttendee = $this->service->verifyQRData($invalidQrData, $event);

    expect($verifiedAttendee)->toBeNull();
});

it('rejects QR data with invalid JSON', function () {
    $event = Event::factory()->create(['qr_type' => 'static']);

    $invalidQrData = 'not-valid-json';

    $verifiedAttendee = $this->service->verifyQRData($invalidQrData, $event);

    expect($verifiedAttendee)->toBeNull();
});

it('rejects QR data for non-existent attendee', function () {
    $event = Event::factory()->create(['qr_type' => 'static']);

    $fakePayload = [
        'attendee_uuid' => 'non-existent-uuid',
        'event_uuid' => $event->uuid,
        'registration_uuid' => 'some-reg-uuid',
        'timestamp' => now()->timestamp,
    ];

    $signatureInput = json_encode($fakePayload).'|'.$event->start_time;
    $signature = hash_hmac('sha256', $signatureInput, config('app.key'));
    $fakePayload['signature'] = $signature;

    $fakeQrData = json_encode($fakePayload);

    $verifiedAttendee = $this->service->verifyQRData($fakeQrData, $event);

    expect($verifiedAttendee)->toBeNull();
});

it('signature includes event start time to prevent event cloning', function () {
    $event = Event::factory()->create(['qr_type' => 'static']);
    $user = User::factory()->create();
    $registration = Registration::factory()->create([
        'event_uuid' => $event->uuid,
        'user_uuid' => $user->uuid,
    ]);
    $attendee = RegistrationAttendee::factory()->create([
        'registration_id' => $registration->id,
        'registration_uuid' => $registration->uuid,
    ]);

    $qrData = $this->service->generateQRData($attendee);

    // Change event start time
    $event->update(['start_time' => now()->addDays(1)]);

    // QR should now be invalid because signature was based on old start_time
    $verifiedAttendee = $this->service->verifyQRData($qrData, $event);

    expect($verifiedAttendee)->toBeNull();
});
