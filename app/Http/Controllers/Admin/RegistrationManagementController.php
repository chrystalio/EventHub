<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Registration;
use Illuminate\Http\RedirectResponse;

class RegistrationManagementController extends Controller
{
    /**
     * Approve a pending registration.
     */
    public function approve($registrationId): RedirectResponse
    {
        $registration = Registration::findOrFail($registrationId);
        $registration->update([
            'status' => 'approved',
            'approved_at' => now(),
        ]);
        return back()->with('success', 'Registration has been approved.');
    }

    public function reject($registrationId): RedirectResponse
    {
        $registration = Registration::findOrFail($registrationId);
        $registration->update([
            'status' => 'rejected',
        ]);
        return back()->with('success', 'Registration has been rejected.');
    }
}
