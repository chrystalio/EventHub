# Performance Optimization Guide

**Priority Level:** P1 - HIGH
**Total Estimated Time:** 6 hours
**Target:** Improve dashboard load time from 3-5s to < 2s

---

## Table of Contents
1. [Fix N+1 Query in Event Model](#1-fix-n1-query-in-event-model) (2 hours)
2. [Optimize Dashboard Queries](#2-optimize-dashboard-queries) (2 hours)
3. [Add Rate Limiting to API Endpoints](#3-add-rate-limiting-to-api-endpoints) (30 minutes)
4. [Fix Timezone Hardcoding](#4-fix-timezone-hardcoding) (1 hour)
5. [Add Query Caching](#5-add-query-caching) (30 minutes)

---

## Performance Baseline

### Current Performance Issues

**Dashboard Load Time (50 events):**
- Current: 3-5 seconds
- Target: < 2 seconds

**Database Queries Per Page:**
- Current: 150+ queries
- Target: < 30 queries

**QR Code Token Generation:**
- Current: 100-500ms network latency
- Target: 0ms (client-side generation)

---

## 1. Fix N+1 Query in Event Model
**Time:** 2 hours | **Priority:** P1 - HIGH | **Impact:** Massive query reduction

### The Problem

**File:** `app/Models/Event.php` (Lines 95-102)

```php
public function getTotalRegisteredAttribute(): int
{
    return $this->registrations()
            ->where('status', '!=', 'cancelled')
            ->sum('guest_count') + $this->registrations()  // ❌ SECOND QUERY!
            ->where('status', '!=', 'cancelled')
            ->count();  // ❌ N+1 PROBLEM
}
```

**Why This Is Bad:**
- Accessor runs **2 queries per event**
- Dashboard loads 50 events → **100 extra queries**
- Each query takes ~10-20ms → **1-2 seconds wasted**

**Example Scenario:**
```php
// In DashboardController or any place loading events
$events = Event::all(); // 1 query

foreach ($events as $event) {
    echo $event->total_registered; // 2 queries PER EVENT!
}

// Total: 1 + (50 × 2) = 101 queries
```

### Solution 1: Use withCount in Controllers (Recommended)

Instead of relying on the accessor, eager load the count in controllers.

#### Step 1: Remove or Deprecate Accessor

**File:** `app/Models/Event.php`

**Option A - Remove Accessor Completely:**
```php
// DELETE THIS METHOD:
// public function getTotalRegisteredAttribute(): int { ... }
```

**Option B - Add Warning Comment (Safer):**
```php
/**
 * @deprecated Use withCount('registrations') instead to avoid N+1 queries
 */
public function getTotalRegisteredAttribute(): int
{
    // Keep for backward compatibility but warn developers
    \Log::warning('getTotalRegisteredAttribute accessor used - causes N+1 queries');

    return $this->registrations()
        ->where('status', '!=', 'cancelled')
        ->sum('guest_count') + $this->registrations()
        ->where('status', '!=', 'cancelled')
        ->count();
}
```

#### Step 2: Update DashboardController

**File:** `app/Http/Controllers/DashboardController.php`

**Find:** Lines where `Event::` queries are made (multiple locations)

**Current Code (System Administrator Dashboard):**
```php
// Line ~120
$events = Event::with(['building', 'room', 'creator'])
    ->latest()
    ->get();
```

**Optimized Code:**
```php
$events = Event::with(['building', 'room', 'creator'])
    ->withCount([
        'registrations as total_registered' => function ($query) {
            $query->where('status', '!=', 'cancelled')
                ->selectRaw('COALESCE(SUM(guest_count), 0) + COUNT(*)');
        }
    ])
    ->latest()
    ->get();
```

**Current Code (Browse Events - Public):**
```php
// EventController.php or similar
$events = Event::where('start_time', '>=', now())
    ->paginate(6);
```

**Optimized Code:**
```php
$events = Event::where('start_time', '>=', now())
    ->with(['building', 'room'])
    ->withCount([
        'registrations as total_registered' => function ($query) {
            $query->where('status', '!=', 'cancelled')
                ->selectRaw('COALESCE(SUM(guest_count), 0) + COUNT(*)');
        }
    ])
    ->paginate(6);
```

#### Step 3: Update Frontend to Use total_registered

**Frontend files may reference `event.total_registered`:**

**Example in React:**
```typescript
// Before (relies on accessor):
{event.total_registered}

// After (uses withCount):
{event.total_registered} // No change needed in frontend!
```

**The `withCount` adds `total_registered` to the model, so frontend code doesn't need to change.**

### Solution 2: Cache the Count (Alternative)

If removing accessor is too risky, cache the result:

**File:** `app/Models/Event.php`

```php
public function getTotalRegisteredAttribute(): int
{
    return Cache::remember(
        "event_{$this->id}_total_registered",
        now()->addMinutes(5),
        function () {
            $guestCount = $this->registrations()
                ->where('status', '!=', 'cancelled')
                ->sum('guest_count');

            $registrationCount = $this->registrations()
                ->where('status', '!=', 'cancelled')
                ->count();

            return $guestCount + $registrationCount;
        }
    );
}

// Add observer to clear cache on registration changes
protected static function boot()
{
    parent::boot();

    static::saved(function ($event) {
        Cache::forget("event_{$event->id}_total_registered");
    });
}
```

**Also add to Registration model:**
```php
// app/Models/Registration.php
protected static function boot()
{
    parent::boot();

    static::saved(function ($registration) {
        Cache::forget("event_{$registration->event_uuid}_total_registered");
    });

    static::deleted(function ($registration) {
        Cache::forget("event_{$registration->event_uuid}_total_registered");
    });
}
```

### Testing Performance Improvement

**Before Fix:**
```php
php artisan tinker

>>> DB::enableQueryLog();
>>> $events = Event::with(['building', 'room'])->take(50)->get();
>>> foreach ($events as $event) { $event->total_registered; }
>>> count(DB::getQueryLog());
# Expected: ~101 queries (1 initial + 50×2 for accessor)
```

**After Fix:**
```php
>>> DB::flushQueryLog();
>>> DB::enableQueryLog();
>>> $events = Event::with(['building', 'room'])
...     ->withCount(['registrations as total_registered' => function ($q) {
...         $q->where('status', '!=', 'cancelled')
...           ->selectRaw('COALESCE(SUM(guest_count), 0) + COUNT(*)');
...     }])
...     ->take(50)
...     ->get();
>>> count(DB::getQueryLog());
# Expected: 4 queries (1 events + 1 buildings + 1 rooms + 1 count)
```

**Performance Gain:**
- Before: 101 queries (~1500ms)
- After: 4 queries (~50ms)
- **30x improvement**

### Files to Update

**Required:**
- [ ] `app/Models/Event.php` - Remove or deprecate accessor
- [ ] `app/Http/Controllers/DashboardController.php` - Add withCount
- [ ] `app/Http/Controllers/EventController.php` - Add withCount

**Optional (if event listing exists elsewhere):**
- [ ] `app/Http/Controllers/Admin/EventController.php`
- [ ] `app/Http/Controllers/Panitia/EventController.php`

---

## 2. Optimize Dashboard Queries
**Time:** 2 hours | **Priority:** P1 - HIGH | **Impact:** Faster dashboard load

### Problem 1: Multiple Clone Operations

**File:** `app/Http/Controllers/DashboardController.php` (Lines 143-152)

**Current Code:**
```php
// Panitia dashboard
$managedEventsQuery = Event::join('event_staff', 'events.uuid', '=', 'event_staff.event_uuid')
    ->where('event_staff.user_uuid', $user->uuid);

$managingEventsCount = (clone $managedEventsQuery)->where('start_time', '>=', $now)->count();
$eventsThisWeekCount = (clone $managedEventsQuery)->where('start_time', '>=', $startOfWeek)->count();
$eventsThisMonthCount = (clone $managedEventsQuery)->where('start_time', '>=', $startOfMonth)->count();
$eventsThisYearCount = (clone $managedEventsQuery)->where('start_time', '>=', $startOfYear)->count();

// ❌ 4 separate queries!
```

**Problem:**
- Each `clone` creates a new query
- 4 queries when 1 would suffice

**Solution: Single Query with Conditional Aggregation**

```php
// Panitia dashboard optimization
$eventStats = DB::table('events')
    ->join('event_staff', 'events.uuid', '=', 'event_staff.event_uuid')
    ->where('event_staff.user_uuid', $user->uuid)
    ->selectRaw('
        COUNT(*) as total_managing,
        COUNT(CASE WHEN start_time >= ? THEN 1 END) as upcoming,
        COUNT(CASE WHEN start_time >= ? AND start_time < ? THEN 1 END) as this_week,
        COUNT(CASE WHEN start_time >= ? AND start_time < ? THEN 1 END) as this_month,
        COUNT(CASE WHEN start_time >= ? AND start_time < ? THEN 1 END) as this_year
    ', [
        $now,
        $startOfWeek, $endOfWeek,
        $startOfMonth, $endOfMonth,
        $startOfYear, $endOfYear
    ])
    ->first();

$managingEventsCount = $eventStats->upcoming;
$eventsThisWeekCount = $eventStats->this_week;
$eventsThisMonthCount = $eventStats->this_month;
$eventsThisYearCount = $eventStats->this_year;
```

**Performance Gain:**
- Before: 4 queries (~80ms)
- After: 1 query (~15ms)
- **5x improvement**

### Problem 2: Union Queries for Activity Feed

**File:** `app/Http/Controllers/DashboardController.php` (Lines 330-393)

**Current Code:**
```php
// System Admin activity feed
$activities = DB::table('registrations')
    ->join('events', 'registrations.event_uuid', '=', 'events.uuid')
    ->join('users', 'registrations.user_uuid', '=', 'users.uuid')
    ->select(/* ... */)
    ->unionAll(DB::table('events')->/* ... */)
    ->unionAll(DB::table('users')->/* ... */)
    ->orderBy('timestamp', 'desc')
    ->limit(10)
    ->get();
```

**Problem:**
- Complex union queries run on every page load
- Activity rarely changes minute-to-minute
- Perfect candidate for caching

**Solution: Add Caching**

```php
// Cache for 5 minutes
$activities = Cache::remember(
    'dashboard_activities_admin',
    now()->addMinutes(5),
    function () use ($now) {
        return DB::table('registrations')
            ->join('events', 'registrations.event_uuid', '=', 'events.uuid')
            ->join('users', 'registrations.user_uuid', '=', 'users.uuid')
            ->select(
                'registrations.created_at as timestamp',
                DB::raw("'registration' as type"),
                'users.name as actor',
                'events.title as event_name'
            )
            ->where('registrations.created_at', '>=', $now->copy()->subDays(7))
            ->unionAll(
                DB::table('events')
                    ->select(
                        'created_at as timestamp',
                        DB::raw("'event_created' as type"),
                        'creator.name as actor',
                        'title as event_name'
                    )
                    ->join('users as creator', 'events.created_by', '=', 'creator.id')
                    ->where('created_at', '>=', $now->copy()->subDays(7))
            )
            ->orderBy('timestamp', 'desc')
            ->limit(10)
            ->get();
    }
);
```

**Clear Cache on Events:**
```php
// app/Models/Registration.php
protected static function boot()
{
    parent::boot();

    static::created(function () {
        Cache::forget('dashboard_activities_admin');
        Cache::forget('dashboard_activities_panitia');
    });
}

// app/Models/Event.php
protected static function boot()
{
    parent::boot();

    static::created(function () {
        Cache::forget('dashboard_activities_admin');
    });
}
```

### Problem 3: Event Type Distribution

**File:** `app/Http/Controllers/DashboardController.php` (System Admin)

**Current Code:**
```php
$eventTypeDistribution = Event::select('type', DB::raw('count(*) as count'))
    ->groupBy('type')
    ->get();
```

**Problem:**
- Runs on every dashboard load
- Event types don't change frequently

**Solution: Cache for 1 Hour**

```php
$eventTypeDistribution = Cache::remember(
    'event_type_distribution',
    now()->addHour(),
    function () {
        return Event::select('type', DB::raw('count(*) as count'))
            ->groupBy('type')
            ->get();
    }
);
```

**Clear cache when events are created:**
```php
// app/Models/Event.php
protected static function boot()
{
    parent::boot();

    static::created(function () {
        Cache::forget('event_type_distribution');
    });

    static::updated(function ($event) {
        if ($event->isDirty('type')) {
            Cache::forget('event_type_distribution');
        }
    });
}
```

### Complete Dashboard Optimization Checklist

**DashboardController.php Updates:**
- [ ] Replace clone queries with conditional aggregation (Panitia stats)
- [ ] Add caching to activity feed (5-minute TTL)
- [ ] Add caching to event type distribution (1-hour TTL)
- [ ] Use withCount for event lists (avoid N+1)
- [ ] Add cache clearing in model observers

**Testing:**
```bash
php artisan tinker

# Test dashboard load
>>> DB::enableQueryLog();
>>> $controller = new App\Http\Controllers\DashboardController();
>>> $request = Request::create('/dashboard', 'GET');
>>> $controller->index($request);
>>> count(DB::getQueryLog());
# Target: < 30 queries
```

---

## 3. Add Rate Limiting to API Endpoints
**Time:** 30 minutes | **Priority:** P1 - HIGH | **Impact:** Prevents API abuse

### Endpoints Needing Rate Limiting

1. **TOTP Token Generation:** `/api/attendees/{qr_code}/generate-token`
2. **QR Code Verification:** `/panitia/ticket-check`

### Implementation

**File:** `routes/api.php`

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AttendeeController;

// API routes with rate limiting
Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    // 60 requests per 1 minute per user
    Route::get('/attendees/{attendee:qr_code}/generate-token', [AttendeeController::class, 'generateToken'])
        ->name('api.attendees.generate-token');
});
```

**File:** `routes/web.php` (Panitia Routes)

```php
// Panitia routes
Route::middleware(['auth', 'role:Panitia'])->prefix('panitia')->name('panitia.')->group(function () {
    Route::post('/ticket-check', [PanitiaEventController::class, 'verifyQrCode'])
        ->middleware('throttle:120,1') // 120 scans per minute
        ->name('ticket.verify');
});
```

### Custom Rate Limiting for Graduation Day

For high-traffic events, you may need custom limits:

**File:** `app/Providers/RouteServiceProvider.php`

```php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

public function boot(): void
{
    // QR scanning rate limit - higher for graduation day
    RateLimiter::for('qr-scanning', function (Request $request) {
        return Limit::perMinute(200)->by($request->user()?->id ?: $request->ip());
    });

    // TOTP generation rate limit
    RateLimiter::for('totp-generation', function (Request $request) {
        return Limit::perMinute(60)->by($request->user()?->id);
    });
}
```

**Update Routes:**
```php
Route::post('/ticket-check', [PanitiaEventController::class, 'verifyQrCode'])
    ->middleware('throttle:qr-scanning')
    ->name('panitia.ticket.verify');
```

### Testing Rate Limits

```bash
# Test API rate limiting
for i in {1..70}; do
    curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:8000/api/attendees/ABC123/generate-token
done

# After 60 requests, should return:
# HTTP 429 Too Many Requests
```

---

## 4. Fix Timezone Hardcoding
**Time:** 1 hour | **Priority:** P2 - MEDIUM | **Impact:** Code portability

### Problem

**File:** `app/Http/Requests/StoreEventRequest.php` (Lines 28, 52, 61)

```php
$startTime = Carbon::parse($this->start_time, 'Asia/Jakarta'); // ❌ HARDCODED
```

**Why This Is Bad:**
- Not portable to other timezones
- Violates Laravel conventions
- Breaks if deployment timezone changes

### Solution

**Option 1: Use Application Timezone**
```php
// Before
$startTime = Carbon::parse($this->start_time, 'Asia/Jakarta');

// After
$startTime = Carbon::parse($this->start_time, config('app.timezone'));

// Or simply (uses app timezone by default)
$startTime = Carbon::parse($this->start_time);
```

### Files to Update

**1. StoreEventRequest.php**

**Find and Replace:**
```php
// Line ~28
$startTime = Carbon::parse($this->start_time, config('app.timezone'));

// Line ~52
$endTime = Carbon::parse($this->end_time, config('app.timezone'));

// Line ~61
$existingEvents = Event::where('room_id', $this->room_id)
    ->where(function ($query) use ($startTime, $endTime) {
        // Conflict detection logic
    })
    ->exists();
```

**2. UpdateEventRequest.php**

Apply same fixes if this file has timezone hardcoding.

### Testing

```php
php artisan tinker

# Test with different timezones
>>> config(['app.timezone' => 'UTC']);
>>> $request = new StoreEventRequest([
...     'start_time' => '2025-12-01 10:00:00',
...     'end_time' => '2025-12-01 12:00:00',
... ]);
>>> $request->validate(); // Should work without errors
```

---

## 5. Add Query Caching
**Time:** 30 minutes | **Priority:** P2 - MEDIUM | **Impact:** Reduced database load

### Cacheable Queries

**1. Building List (rarely changes)**
```php
// Before
$buildings = Building::all();

// After
$buildings = Cache::remember('buildings_list', now()->addHours(24), function () {
    return Building::all();
});
```

**2. Room List (rarely changes)**
```php
// Before
$rooms = Room::with('building')->get();

// After
$rooms = Cache::remember('rooms_list', now()->addHours(24), function () {
    return Room::with('building')->get();
});
```

**3. User Roles (never changes during session)**
```php
// In User model
public function hasRole($role): bool
{
    return Cache::remember("user_{$this->id}_roles", now()->addHours(1), function () use ($role) {
        return parent::hasRole($role);
    });
}
```

### Clear Cache on Model Changes

**File:** `app/Models/Building.php`
```php
protected static function boot()
{
    parent::boot();

    static::saved(function () {
        Cache::forget('buildings_list');
    });

    static::deleted(function () {
        Cache::forget('buildings_list');
    });
}
```

**File:** `app/Models/Room.php`
```php
protected static function boot()
{
    parent::boot();

    static::saved(function () {
        Cache::forget('rooms_list');
    });

    static::deleted(function () {
        Cache::forget('rooms_list');
    });
}
```

---

## Performance Testing & Monitoring

### Before Optimization (Baseline)

```bash
php artisan tinker

# Measure dashboard query count
>>> DB::enableQueryLog();
>>> $response = $this->get('/dashboard');
>>> $queries = DB::getQueryLog();
>>> count($queries); // Target: Record baseline

# Measure dashboard response time
>>> $start = microtime(true);
>>> $response = $this->get('/dashboard');
>>> $duration = (microtime(true) - $start) * 1000;
>>> echo "{$duration}ms"; // Target: Record baseline
```

### After Optimization (Target)

- **Query Count:** < 30 queries
- **Response Time:** < 500ms
- **Dashboard Load (50 events):** < 2 seconds

### Tools for Monitoring

**1. Laravel Debugbar (Development)**
```bash
composer require barryvdh/laravel-debugbar --dev
```

**2. Query Logging**
```php
// AppServiceProvider.php
public function boot()
{
    if (app()->environment('local')) {
        DB::listen(function ($query) {
            if ($query->time > 100) { // Log slow queries
                \Log::warning('Slow query detected', [
                    'sql' => $query->sql,
                    'time' => $query->time,
                ]);
            }
        });
    }
}
```

**3. Production Monitoring**
- Use Laravel Telescope for query monitoring
- Monitor `storage/logs/laravel.log` for slow queries

---

## Summary Checklist

### Performance Optimization Complete When:

- [ ] N+1 query in Event model eliminated
- [ ] Dashboard uses `withCount()` instead of accessor
- [ ] Query count < 30 per dashboard load
- [ ] Clone queries replaced with conditional aggregation
- [ ] Activity feed cached (5-minute TTL)
- [ ] Event type distribution cached (1-hour TTL)
- [ ] Rate limiting added to TOTP endpoint (60/min)
- [ ] Rate limiting added to QR scanning (120/min)
- [ ] Timezone hardcoding removed from requests
- [ ] Query caching added for buildings/rooms
- [ ] Cache clearing observers implemented
- [ ] Performance baseline measured
- [ ] After optimization, 5x improvement achieved

### Expected Results

**Before:**
- Dashboard: 150+ queries, 3-5 seconds
- Event listing: N+1 queries per event

**After:**
- Dashboard: < 30 queries, < 2 seconds
- Event listing: 4 queries total (30x improvement)

---

**Last Updated:** November 4, 2025
**Next Steps:** Proceed to [CLIENT_SIDE_TOTP.md](./CLIENT_SIDE_TOTP.md) for UX improvements
