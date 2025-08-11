<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Registration;
use App\Models\Room;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the dashboard based on the authenticated user's role.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();
        $data = [];

        if ($user->hasRole('System Administrator')) {
            $data = $this->getSystemAdministratorData();
        } elseif ($user->hasRole('Panitia')) {
            $data = $this->getPanitiaData($user);
        } elseif ($user->hasRole('Akademik')) {
            $data = $this->getAkademikData();
        } else {
            $data = $this->getPesertaData($user);
        }

        return Inertia::render('dashboard', $data);
    }

    private function getSystemAdministratorData(): array
    {
        $now = now();
        $startOfDay = now()->startOfDay();
        $endOfDay = now()->endOfDay();
        $totalUsers = User::count();
        $totalEvents = Event::count();
        $totalRegistrations = Registration::count();
        $totalRevenue = Transaction::where('status', 'paid')->sum('total_amount');

        $activeEventsByRoom = Event::where('start_time', '<=', $now)
            ->where('end_time', '>=', $now)
            ->get()
            ->keyBy('room_id');

        $paginatedRooms = Room::with('building')->paginate(5, ['*'], 'roomsPage')->withQueryString();

        $paginatedRooms->getCollection()->transform(function ($room) use ($activeEventsByRoom) {
            $activeEvent = $activeEventsByRoom->get($room->id);
            return [
                'id' => $room->id,
                'name' => $room->name,
                'building' => $room->building->name,
                'status' => $activeEvent ? 'In Use' : 'Available',
                'event_name' => $activeEvent ? $activeEvent->name : null,
            ];
        });

        $eventTypeDistribution = Event::select('type', DB::raw('count(*) as count'))
            ->groupBy('type')
            ->get();

        $recentActivities = $this->getRecentActivitiesGlobal();

        $eventsToday = Event::whereBetween('start_time', [$startOfDay, $endOfDay])->count();
        $ongoingNow = Event::where('start_time', '<=', $now)->where('end_time', '>=', $now)->count();
        $totalRooms = Room::count();
        $roomsInUse = Event::where('start_time', '<=', $now)->where('end_time', '>=', $now)->distinct('room_id')->count('room_id');

        $todayEvents = Event::with([
            'building:id,name',
            'room:id,name',
            'staff:id,name',
        ])
            ->whereBetween('start_time', [$startOfDay, $endOfDay])
            ->orderBy('start_time')
            ->take(5)
            ->get()
            ->map(function ($e) use ($now) {
                return [
                    'uuid' => $e->uuid,
                    'name' => $e->name,
                    'start_time' => (string) $e->start_time,
                    'end_time' => (string) $e->end_time,
                    'building' => ['name' => optional($e->building)->name],
                    'room' => ['name' => optional($e->room)->name],
                    'staff' => $e->staff->map(fn ($u) => ['id' => $u->id, 'name' => $u->name])->values(),
                    'ongoing' => $e->start_time <= $now && $e->end_time >= $now,
                ];
            });

        return [
            'role' => 'System Administrator',
            'stats' => [
                ['label' => 'Total Users', 'value' => $totalUsers],
                ['label' => 'Total Events', 'value' => $totalEvents],
                ['label' => 'Total Registrations', 'value' => $totalRegistrations],
                ['label' => 'Total Revenue', 'value' => 'Rp ' . number_format($totalRevenue, 0, ',', '.')],
            ],
            'roomAvailability' => $paginatedRooms,
            'eventTypeDistribution' => $eventTypeDistribution,
            'recentActivities' => $recentActivities,
            'glance' => [
                'eventsToday' => $eventsToday,
                'ongoingNow' => $ongoingNow,
                'roomsInUse' => $roomsInUse,
                'totalRooms' => $totalRooms,
            ],
            'todayEvents' => $todayEvents,
        ];
    }

    /**
     * Get data for the Panitia dashboard.
     */
    private function getPanitiaData(User $user): array
    {
        $now = now();
        $managedEventsQuery = $user->managedEvents();
        $startOfWeek = $now->copy()->startOfWeek();
        $endOfWeek = $now->copy()->endOfWeek();

        $managingEventsCount = (clone $managedEventsQuery)
            ->where('start_time', '>=', $now)
            ->count();

        $eventsThisWeekCount = (clone $managedEventsQuery)
            ->where('start_time', '>=', $startOfWeek)
            ->where('start_time', '<=', $endOfWeek)
            ->count();

        $managedEventUuids = (clone $managedEventsQuery)->pluck('events.uuid');

        $pendingApprovalsCount = Registration::whereIn('event_uuid', $managedEventUuids)
            ->where('status', 'pending')
            ->count();

        $eventsHappeningNow = (clone $managedEventsQuery)
            ->with(['building', 'room'])
            ->withCount(['registrations as total_registered' => fn($q) => $q->where('status', '!=', 'cancelled')])
            ->where('start_time', '<=', $now->copy()->addMinutes(5))
            ->where('end_time', '>=', $now)
            ->orderBy('start_time', 'asc')
            ->get();

        $upcomingManagedSchedule = (clone $managedEventsQuery)
            ->where('start_time', '>=', $now)
            ->with(['building', 'room'])
            ->withCount(['registrations' => fn($q) => $q->where('status', '!=', 'cancelled')])
            ->orderBy('start_time', 'asc')
            ->take(5)
            ->get();

        $registrationApprovals = (clone $managedEventsQuery)
            ->where('type', 'private')
            ->whereHas('registrations', fn($q) => $q->where('status', 'pending'))
            ->withCount(['registrations as pending_requests_count' => fn($q) => $q->where('status', 'pending')])
            ->get();

        $recentActivities = $this->getRecentActivitiesForPanitia($user);

        return [
            'role' => 'Panitia',
            'stats' => [
                ['label' => 'Managing Events', 'value' => $managingEventsCount],
                ['label' => 'Events This Week', 'value' => $eventsThisWeekCount],
                ['label' => 'Pending Approvals', 'value' => $pendingApprovalsCount],
            ],
            'eventsHappeningNow' => $eventsHappeningNow,
            'upcomingManagedSchedule' => $upcomingManagedSchedule,
            'registrationApprovals' => $registrationApprovals,
            'recentActivities' => $recentActivities,
        ];
    }
    /**
     * Get data for the Akademik dashboard.
     */
    private function getAkademikData(): array
    {
        return $this->getSystemAdministratorData();
    }

    /**
     * Get data for the Peserta dashboard.
     */
    private function getPesertaData(User $user): array
    {
        $now = now();
        $startOfYear = $now->copy()->startOfYear();

        $registeredThisMonthCount = Registration::where('user_uuid', $user->uuid)
            ->whereMonth('registered_at', $now->month)
            ->whereYear('registered_at', $now->year)
            ->count();

        $attendedThisMonthCount = Registration::where('user_uuid', $user->uuid)
            ->where('status', 'attended')
            ->whereMonth('registered_at', $now->month)
            ->whereYear('registered_at', $now->year)
            ->count();

        $missedThisMonthCount = Registration::where('user_uuid', $user->uuid)
            ->where('status', 'missed')
            ->whereMonth('registered_at', $now->month)
            ->whereYear('registered_at', $now->year)
            ->count();

        $pendingThisMonthCount = Registration::where('user_uuid', $user->uuid)
            ->where('status', 'pending')
            ->whereMonth('registered_at', $now->month)
            ->whereYear('registered_at', $now->year)
            ->count();

        $pendingPaymentsCount = Transaction::where('user_uuid', $user->uuid)
            ->where('status', 'pending')
            ->count();

        $totalUpcomingCount = Registration::where('user_uuid', $user->uuid)
            ->whereHas('event', fn($q) => $q->where('start_time', '>=', $now))
            ->count();

        $upcomingRegistrations = Registration::with(['event.building', 'event.room'])
            ->where('user_uuid', $user->uuid)
            ->whereHas('event', fn($q) => $q->where('start_time', '>=', $now))
            ->join('events', 'registrations.event_uuid', '=', 'events.uuid')
            ->orderBy('events.start_time', 'asc')
            ->select('registrations.*')
            ->take(3)
            ->get();

        $attendedByMonth = DB::table('registrations')
            ->join('events', 'registrations.event_uuid', '=', 'events.uuid')
            ->select(DB::raw('MONTH(events.start_time) as month'), DB::raw('COUNT(registrations.uuid) as count'))
            ->where('registrations.user_uuid', $user->uuid)
            ->where('events.start_time', '>=', $startOfYear)
            ->where('events.start_time', '<=', $now)
            ->whereExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('registrations_attendees')
                    ->whereColumn('registrations_attendees.registration_id', 'registrations.id')
                    ->whereNotNull('attended_at');
            })
            ->groupBy('month')
            ->pluck('count', 'month');

        $missedByMonth = DB::table('registrations')
            ->join('events', 'registrations.event_uuid', '=', 'events.uuid')
            ->select(DB::raw('MONTH(events.start_time) as month'), DB::raw('COUNT(registrations.uuid) as count'))
            ->where('registrations.user_uuid', $user->uuid)
            ->where('events.start_time', '>=', $startOfYear)
            ->where('events.start_time', '<', $now)
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('registrations_attendees')
                    ->whereColumn('registrations_attendees.registration_id', 'registrations.id')
                    ->whereNotNull('attended_at');
            })
            ->groupBy('month')
            ->pluck('count', 'month');

        $monthlyData = [];
        for ($i = 1; $i <= 12; $i++) {
            $monthlyData[] = [
                'month' => Carbon::create()->month($i)->format('M'),
                'attended' => $attendedByMonth->get($i, 0),
                'missed' => $missedByMonth->get($i, 0),
            ];
        }

        $calendarEvents = Registration::with('event')
            ->where('user_uuid', $user->uuid)
            ->get()
            ->map(fn($registration) => [
                'id' => $registration->event->id,
                'title' => $registration->event->name,
                'start' => $registration->event->start_time->toIso8601String(),
                'end' => optional($registration->event->end_time)->toIso8601String(),
                'location' => $registration->event->location ?? null,
                'event_uuid' => $registration->event->uuid,
                'type' => $registration->event->type,
            ]);

        return [
            'role' => 'Peserta',
            'stats' => [
                ['label' => 'Registered', 'value' => $registeredThisMonthCount],
                ['label' => 'Attended', 'value' => $attendedThisMonthCount],
                ['label' => 'Missed', 'value' => $missedThisMonthCount],
                ['label' => 'Pending Registrations', 'value' => $pendingThisMonthCount],
                ['label' => 'Pending Payments', 'value' => $pendingPaymentsCount],
            ],
            'upcomingRegistrations' => $upcomingRegistrations,
            'totalUpcomingCount' => $totalUpcomingCount,
            'yearlyAttendance' => $monthlyData,
            'calendarEvents' => $calendarEvents,
        ];
    }


    private function getRecentActivitiesForPanitia(User $user)
    {
        if (!$user->managedEvents()->exists()) {
            return [];
        }

        $managedEventUuidsSub = $user->managedEvents()->select('events.uuid');


        $registrations = DB::table('registrations')
            ->join('events', 'registrations.event_uuid', '=', 'events.uuid')
            ->join('users', 'users.uuid', '=', 'registrations.user_uuid')
            ->whereIn('registrations.event_uuid', $managedEventUuidsSub)
            ->selectRaw("
            registrations.registered_at as occurred_at,
            'registration' as type,
            registrations.event_uuid as event_uuid,
            users.name as actor_name,
            events.name as event_name
        ");


        $statusChanges = DB::table('registrations')
            ->join('events', 'registrations.event_uuid', '=', 'events.uuid')
            ->join('users', 'users.uuid', '=', 'registrations.user_uuid')
            ->whereIn('registrations.event_uuid', $managedEventUuidsSub)
            ->whereIn('registrations.status', ['approved', 'rejected'])
            ->whereColumn('registrations.updated_at', '>', 'registrations.created_at')
            ->selectRaw("
            registrations.updated_at as occurred_at,
            registrations.status as type,
            registrations.event_uuid as event_uuid,
            users.name as actor_name,
            events.name as event_name
        ");

        $attendance = DB::table('registrations_attendees')
            ->join('registrations', 'registrations_attendees.registration_id', '=', 'registrations.id')
            ->join('events', 'registrations.event_uuid', '=', 'events.uuid')
            ->join('users', 'users.uuid', '=', 'registrations.user_uuid')
            ->whereIn('registrations.event_uuid', $managedEventUuidsSub)
            ->selectRaw("
            registrations_attendees.attended_at as occurred_at,
            'attended' as type,
            registrations.event_uuid as event_uuid,
            users.name as actor_name,
            events.name as event_name
        ");

        $union = $registrations->unionAll($statusChanges)->unionAll($attendance);

        return DB::query()
            ->fromSub($union, 'a')
            ->orderByDesc('occurred_at')
            ->limit(10)
            ->get()
            ->map(function ($row) {
                $message = match ($row->type) {
                    'registration' => "{$row->actor_name} registered for {$row->event_name}",
                    'approved' => "Registration approved for {$row->actor_name} – {$row->event_name}",
                    'rejected' => "Registration rejected for {$row->actor_name} – {$row->event_name}",
                    'attended' => "{$row->actor_name} checked in to {$row->event_name}",
                    default => "An update occurred for {$row->actor_name} in {$row->event_name}",
                };
                return [
                    'type' => $row->type,
                    'event_uuid' => $row->event_uuid,
                    'message' => $message,
                    'occurred_at' => (string) $row->occurred_at,
                ];
            })
            ->all();
    }

    private function getRecentActivitiesGlobal(): array
    {
        $registrations = DB::table('registrations')
            ->join('events', 'registrations.event_uuid', '=', 'events.uuid')
            ->join('users', 'users.uuid', '=', 'registrations.user_uuid')
            ->selectRaw("
            registrations.registered_at as occurred_at,
            'registration' as type,
            registrations.event_uuid as event_uuid,
            users.name as actor_name,
            events.name as event_name
        ");

        $statusChanges = DB::table('registrations')
            ->join('events', 'registrations.event_uuid', '=', 'events.uuid')
            ->join('users', 'users.uuid', '=', 'registrations.user_uuid')
            ->whereIn('registrations.status', ['approved', 'rejected'])
            ->whereColumn('registrations.updated_at', '>', 'registrations.created_at')
            ->selectRaw("
            registrations.updated_at as occurred_at,
            registrations.status as type,
            registrations.event_uuid as event_uuid,
            users.name as actor_name,
            events.name as event_name
        ");

        $attendance = DB::table('registrations_attendees')
            ->join('registrations', 'registrations_attendees.registration_id', '=', 'registrations.id')
            ->join('events', 'registrations.event_uuid', '=', 'events.uuid')
            ->join('users', 'users.uuid', '=', 'registrations.user_uuid')
            ->selectRaw("
            registrations_attendees.attended_at as occurred_at,
            'attended' as type,
            registrations.event_uuid as event_uuid,
            users.name as actor_name,
            events.name as event_name
        ");

        $union = $registrations->unionAll($statusChanges)->unionAll($attendance);

        return DB::query()
            ->fromSub($union, 'a')
            ->orderByDesc('occurred_at')
            ->limit(10)
            ->get()
            ->map(function ($row) {
                $message = match ($row->type) {
                    'registration' => "{$row->actor_name} registered for {$row->event_name}",
                    'approved'     => "Registration approved for {$row->actor_name} – {$row->event_name}",
                    'rejected'     => "Registration rejected for {$row->actor_name} – {$row->event_name}",
                    'attended'     => "{$row->actor_name} checked in to {$row->event_name}",
                    default        => "Update for {$row->actor_name} – {$row->event_name}",
                };
                return [
                    'type' => $row->type,
                    'event_uuid' => $row->event_uuid,
                    'message' => $message,
                    'occurred_at' => (string) $row->occurred_at,
                ];
            })
            ->all();
    }
}
