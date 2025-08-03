<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RegistrationAttendee;
use PragmaRX\Google2FA\Exceptions\IncompatibleWithGoogleAuthenticatorException;
use PragmaRX\Google2FA\Exceptions\InvalidCharactersException;
use PragmaRX\Google2FA\Exceptions\SecretKeyTooShortException;
use PragmaRX\Google2FA\Google2FA;

class AttendeeController extends Controller
{
    /**
     * @throws IncompatibleWithGoogleAuthenticatorException
     * @throws SecretKeyTooShortException
     * @throws InvalidCharactersException
     */
    public function generateToken(RegistrationAttendee $attendee)
    {
        if (auth()->user()->uuid !== $attendee->registration->user_uuid) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if (empty($attendee->totp_secret)) {
            return response()->json(['message' => 'Security key not set up for this ticket.'], 500);
        }

        $google2fa = new Google2FA();
        $token = $google2fa->getCurrentOtp($attendee->totp_secret);

        return response()->json([
            'token' => $token,
        ]);
    }
}
