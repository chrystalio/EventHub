<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRegistrationRequest;
use App\Models\Event;
use App\Models\Registration;
use App\Models\Transaction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class RegistrationController extends Controller
{
    public function index(): Response
    {
        $registrations = Registration::where('user_uuid', auth()->user()->uuid)
            ->with(['event' => function ($query) {
                $query->with(['building', 'room']);
            }])
            ->latest('registered_at')
            ->get();

        return Inertia::render('authenticated/registrations/index', [
            'registrations' => $registrations,
        ]);
    }

    public function browse(): Response
    {
        $events = Event::with(['building', 'room'])
            ->where('start_time', '>', now())
            ->orderBy('start_time')
            ->paginate(6);

        $canRegister = auth()->user() && auth()->user()->can('registration.create');

        $userRegistrations = [];
        if ($canRegister) {
            $userRegistrations = auth()->user()
                ->registrations()
                ->whereIn('event_uuid', $events->pluck('uuid'))
                ->where('status', '!=', 'cancelled')
                ->with('attendees')
                ->get()
                ->keyBy('event_uuid');
        }

        return Inertia::render('authenticated/events/index', [
            'events' => $events,
            'userRegistrations' => $userRegistrations,
            'canRegister' => $canRegister,
            'isAuthenticated' => true,
        ]);
    }

    public function show(Registration $registration): Response
    {
        if ($registration->user_uuid !== auth()->user()->uuid) {
            abort(403, 'This is not your registration.');
        }

        $registration->load(['event.building', 'event.room', 'attendees']);

        if ($registration->status === 'approved') {
            $registration->attendees->each(function ($attendee) {
                $attendee->signed_url = URL::signedRoute(
                    'ticket.verify',
                    ['attendee' => $attendee->qr_code]
                );
            });
        }

        return Inertia::render('authenticated/registrations/show', [
            'registration' => $registration,
        ]);
    }

    public function showEvent(Event $event): Response
    {
        $event->load(['building', 'room', 'creator']);

        $canCreate = auth()->user() && auth()->user()->can('registration.create');

        $userRegistration = null;
        if (auth()->user()) {
            $userRegistration = $event->registrations()
                ->where('user_uuid', auth()->user()->uuid)
                ->where('status', '!=', 'cancelled')
                ->first();
        }

        $totalRegistered = $event->total_registered;

        return Inertia::render('authenticated/events/show', [
            'event' => $event,
            'userRegistration' => $userRegistration,
            'canRegister' => $canCreate && !$userRegistration,
            'totalRegistered' => $totalRegistered,
            'isAuthenticated' => true,
        ]);
    }

    public function store(StoreRegistrationRequest $request, Event $event): RedirectResponse
    {
        $validated = $request->validated();
        $user = Auth::user();

        if ($event->type === 'paid' && $event->price > 0){
            $totalAmount = $event->price * ($validated['guest_count'] + 1);

            $timestamp = time();
            $timeCode = strtoupper(base_convert($timestamp, 10, 36));
            $UniqueId = strtoupper(Str::random(3));

            $orderId = 'REG-' . $timeCode.$UniqueId;

            DB::beginTransaction();
            try {
                Transaction::create([
                    'user_uuid' => $user->uuid,
                    'event_uuid' => $event->uuid,
                    'order_id' => $orderId,
                    'total_amount' => $totalAmount,
                    'status' => 'pending',
                    'expires_at' => now()->addHour(),
                ]);

                $registration = Registration::create([
                    'user_uuid' => $user->uuid,
                    'event_uuid' => $event->uuid,
                    'order_id' => $orderId,
                    'guest_count' => $validated['guest_count'],
                    'status' => 'pending_payment',
                ]);

                $registration->attendees()->create([
                    'attendee_type' => 'user',
                    'name' => $user->name,
                    'phone' => $user->phone ?? '',
                ]);

                if (!empty($validated['guests'])) {
                    foreach ($validated['guests'] as $guestData) {
                        $registration->attendees()->create([
                            'attendee_type' => 'guest',
                            'name' => $guestData['name'],
                            'phone' => $guestData['phone'],
                        ]);
                    }
                }

                DB::commit();
                return redirect()->route('transactions.show', $orderId);
            } catch (\Throwable $e) {
                DB::rollBack();
                report($e);
                return back()->with('error', 'A server error occurred. Please try again.');
            }
        } else {
            $status = ($event->type === 'private') ? 'pending' : 'approved';
            $message = ($status === 'pending')
                ? 'Your registration is submitted and is now pending approval.'
                : 'Registration successful! You can now view your registration details.';

            try {
                DB::beginTransaction();

                $registration = Registration::create([
                    'user_uuid'     => $user->uuid,
                    'event_uuid'    => $event->uuid,
                    'guest_count' => $validated['guest_count'],
                    'status'      => $status,
                ]);

                $registration->attendees()->create([
                    'attendee_type' => 'user',
                    'name' => $user->name,
                    'phone' => $user->phone ?? '',
                ]);

                if (!empty($validated['guests'])) {
                    foreach ($validated['guests'] as $guestData){
                        $registration->attendees()->create([
                            'attendee_type' => 'guest',
                            'name' => $guestData['name'],
                            'phone' => $guestData['phone'],
                        ]);
                    }
                }

                DB::commit();

            } catch (\Throwable $e) {
                DB::rollBack();
                report($e);
                return back()->with('error', 'A server error occurred during registration.');
            }

            return redirect()->route('registrations.show_event', $event->uuid)
                ->with('success', $message);
        }
    }
}
