# EventHub Improvement Plan
**Project:** EventHub - Event Management System
**Timeline:** 39 days until Graduation Day
**Focus Areas:** Critical Bug Fixes, Performance Optimization, Client-Side TOTP
**Last Updated:** November 4, 2025

---

## Executive Summary

This document outlines the improvement plan for EventHub before graduation day deployment. With 39 days available, the plan is organized into 4 phases focusing on critical fixes, performance optimization, and client-side TOTP implementation.

**Total Estimated Effort:** ~13.5 hours of focused work
**Recommended Timeline:** Deploy for testing by Week 3 (Day 21)

### Project Health Score: 6.5/10
**Top Priorities:**
1. Fix critical bugs blocking deployment (5 hours)
2. Optimize performance for concurrent users (6 hours)
3. Implement client-side TOTP generation (2.5 hours)

---

## Phase 1: Critical Fixes (Week 1-2) - Deploy ASAP
**Target:** Days 1-14
**Estimated Time:** 5 hours
**Risk Level:** HIGH - Must complete before any testing

### 1.1 Fix TypeScript Compilation Errors ⚠️ BLOCKING DEPLOYMENT
- [ ] **Priority:** P0 - CRITICAL
- [ ] **Time Estimate:** 2 hours
- [ ] **Impact:** Cannot build production assets until fixed

**12 TypeScript errors found across 6 files:**

#### File 1: `resources/js/pages/admin/events/registrant-columns.tsx:18`
```typescript
// ❌ CURRENT - Missing 'pending_payment'
const statusConfig: Record<'pending' | 'approved' | 'rejected' | 'attended' | 'missed', string> = {
    approved: 'Approved',
    rejected: 'Rejected',
    pending: 'Pending Approval',
    attended: 'Attended',
    missed: 'Missed',
};

// ✅ FIX - Add missing status
const statusConfig: Record<Registration['status'], string> = {
    approved: 'Approved',
    rejected: 'Rejected',
    pending: 'Pending Approval',
    attended: 'Attended',
    missed: 'Missed',
    pending_payment: 'Pending Payment', // ADD THIS LINE
};
```

#### File 2: `resources/js/pages/authenticated/events/show.tsx:146`
```typescript
// ❌ CURRENT - Missing 'attended' and 'missed' in STATUS_CONFIGS
const STATUS_CONFIGS = {
    approved: { /* ... */ },
    pending: { /* ... */ },
    rejected: { /* ... */ },
    cancelled: { /* ... */ },
    pending_payment: { /* ... */ },
};

// ✅ FIX - Add missing statuses
import { CheckCircle2, XCircle } from 'lucide-react';

const STATUS_CONFIGS = {
    // ... existing configs ...
    attended: {
        icon: CheckCircle2,
        variant: "default" as const,
        label: "Attended",
    },
    missed: {
        icon: XCircle,
        variant: "destructive" as const,
        label: "Missed",
    },
};
```

#### File 3: `resources/js/pages/admin/events/show.tsx:53`
```typescript
// ❌ ERROR - Cannot find name 'Page'
// ✅ FIX - Add import
import { Page } from '@inertiajs/core';
```

#### File 4: `resources/js/components/form/registration-form.tsx:30`
```typescript
// ❌ ERROR - Type mismatch on guest form data
// ✅ FIX - Update form initialization type
const form = useForm<{
    guest_count: number;
    guests: Array<{ name: string; phone: string }>;
}>({
    guest_count: 0,
    guests: [],
});
```

#### File 5: `resources/js/pages/dashboard.tsx:97`
```typescript
// ❌ ERROR - Missing 'state' property in todayEvents
// ✅ FIX - Update interface or provide default value
const todayEvents: TodayEventItem[] = (data.todayEvents || []).map(event => ({
    ...event,
    state: event.state || 'upcoming', // Add default state
}));
```

#### File 6: `resources/js/pages/authenticated/registrations/columns.tsx:67`
```typescript
// ❌ ERROR - Type mismatch
// Review the column definition and ensure proper typing
```

**Testing Steps:**
```bash
# Run TypeScript compiler
npm run types

# Should output: "No errors found"
# If errors persist, check each file carefully
```

---

### 1.2 Add Missing Foreign Key Constraints ⚠️ DATA INTEGRITY RISK
- [ ] **Priority:** P0 - CRITICAL
- [ ] **Time Estimate:** 1 hour
- [ ] **Impact:** Prevents orphaned records and data corruption

**Problem:** UUID migration files drop foreign keys but never recreate them.

**Files to Fix:**
1. `database/migrations/2025_07_22_071042_update_event_foreign_key_in_registrations_table.php`
2. `database/migrations/2025_07_23_064202_update_user_foreign_key_in_registrations_table.php`

#### Migration 1: Event Foreign Key in Registrations
**File:** `2025_07_22_071042_update_event_foreign_key_in_registrations_table.php`

```php
// ❌ CURRENT - No foreign key constraint
Schema::table('registrations', function (Blueprint $table) {
    $table->dropForeign(['event_id']);
    $table->dropColumn('event_id');
    $table->uuid('event_uuid')->after('uuid');
});

// ✅ FIX - Add foreign key with cascade delete
Schema::table('registrations', function (Blueprint $table) {
    $table->dropForeign(['event_id']);
    $table->dropColumn('event_id');
    $table->uuid('event_uuid')->after('uuid');

    // ADD THIS:
    $table->foreign('event_uuid')
        ->references('uuid')
        ->on('events')
        ->onDelete('cascade'); // Delete registrations when event is deleted
});
```

#### Migration 2: User Foreign Key in Registrations
**File:** `2025_07_23_064202_update_user_foreign_key_in_registrations_table.php`

```php
// ❌ CURRENT - No foreign key constraint
Schema::table('registrations', function (Blueprint $table) {
    $table->dropForeign(['user_id']);
    $table->dropColumn('user_id');
    $table->uuid('user_uuid')->after('uuid');
});

// ✅ FIX - Add foreign key with cascade delete
Schema::table('registrations', function (Blueprint $table) {
    $table->dropForeign(['user_id']);
    $table->dropColumn('user_id');
    $table->uuid('user_uuid')->after('uuid');

    // ADD THIS:
    $table->foreign('user_uuid')
        ->references('uuid')
        ->on('users')
        ->onDelete('cascade'); // Delete registrations when user is deleted
});
```

**Testing Steps:**
```bash
# Rollback and re-run migrations
php artisan migrate:rollback --step=5
php artisan migrate

# Verify foreign keys exist
php artisan tinker
>>> Schema::getConnection()->getDoctrineSchemaManager()->listTableForeignKeys('registrations');

# Should show foreign keys for event_uuid and user_uuid
```

**⚠️ IMPORTANT:** This change requires a fresh migration on production. Coordinate with deployment strategy.

---

### 1.3 Fix Authorization Bypass in Registration Management 🔒
- [ ] **Priority:** P0 - CRITICAL SECURITY
- [ ] **Time Estimate:** 30 minutes
- [ ] **Impact:** Currently any authenticated user can approve ANY registration

**Problem:** Missing policy check in `RegistrationManagementController`

**File:** `app/Http/Controllers/RegistrationManagementController.php`

```php
// ❌ CURRENT - No authorization check (line ~45)
public function approve($registrationId): RedirectResponse
{
    $registration = Registration::findOrFail($registrationId);
    $registration->update(['status' => 'approved']);
    return back()->with('success', 'Registration approved.');
}

// ✅ FIX - Add policy check
public function approve(Registration $registration): RedirectResponse
{
    // Check if user can manage this event
    $this->authorize('manage', $registration->event);

    $registration->update([
        'status' => 'approved',
        'approved_at' => now(),
    ]);

    return back()->with('success', 'Registration has been approved.');
}

// Apply same fix to reject() method
public function reject(Registration $registration): RedirectResponse
{
    $this->authorize('manage', $registration->event);

    $registration->update([
        'status' => 'rejected',
        'rejected_at' => now(),
    ]);

    return back()->with('success', 'Registration has been rejected.');
}
```

**Testing Steps:**
```bash
# Test as Panitia user - should only manage assigned events
# Test as non-assigned user - should get 403 Forbidden
# Test as System Admin - should manage all events
```

---

### 1.4 Add Database Indexes for Query Performance 🚀
- [ ] **Priority:** P0 - PERFORMANCE CRITICAL
- [ ] **Time Estimate:** 30 minutes
- [ ] **Impact:** Prevents slow queries as data grows

**Problem:** UUID columns and frequently filtered columns lack indexes.

**Create New Migration:**
```bash
php artisan make:migration add_performance_indexes_to_tables
```

**Migration Code:**
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Registrations table - heavily queried
        Schema::table('registrations', function (Blueprint $table) {
            $table->index('event_uuid'); // JOIN and WHERE clauses
            $table->index('user_uuid');  // JOIN and WHERE clauses
            $table->index('status');     // Filtered in most queries
            $table->index('order_id');   // Transaction lookups
        });

        // Registration attendees - QR code scans
        Schema::table('registrations_attendees', function (Blueprint $table) {
            $table->index('registration_id'); // JOIN queries
            $table->index('qr_code');         // CRITICAL: QR code lookups
            $table->index('attended_at');     // Certificate generation
        });

        // Events - range queries and conflict detection
        Schema::table('events', function (Blueprint $table) {
            $table->index('start_time');
            $table->index('end_time');
            // Composite index for room conflict detection
            $table->index(['room_id', 'start_time', 'end_time'], 'events_room_time_index');
        });

        // Transactions - status filtering
        Schema::table('transactions', function (Blueprint $table) {
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->dropIndex(['event_uuid']);
            $table->dropIndex(['user_uuid']);
            $table->dropIndex(['status']);
            $table->dropIndex(['order_id']);
        });

        Schema::table('registrations_attendees', function (Blueprint $table) {
            $table->dropIndex(['registration_id']);
            $table->dropIndex(['qr_code']);
            $table->dropIndex(['attended_at']);
        });

        Schema::table('events', function (Blueprint $table) {
            $table->dropIndex(['start_time']);
            $table->dropIndex(['end_time']);
            $table->dropIndex('events_room_time_index');
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });
    }
};
```

**Testing Steps:**
```bash
# Run migration
php artisan migrate

# Verify indexes exist
php artisan tinker
>>> Schema::getConnection()->getDoctrineSchemaManager()->listTableIndexes('registrations');

# Check query performance (before/after)
php artisan tinker
>>> DB::enableQueryLog();
>>> Event::with('registrations')->get();
>>> DB::getQueryLog(); // Should show indexed queries
```

---

### 1.5 Add Transaction Expiration Job ⏰
- [ ] **Priority:** P0 - BUSINESS LOGIC
- [ ] **Time Estimate:** 1 hour
- [ ] **Impact:** Pending transactions never expire without this

**Problem:** Transactions have `expires_at` field but no automatic expiration.

**File:** `app/Console/Kernel.php`

```php
<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use App\Models\Transaction;
use App\Models\Registration;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule): void
    {
        // Expire pending transactions
        $schedule->call(function () {
            // Expire transactions
            $expiredCount = Transaction::where('status', 'pending')
                ->where('expires_at', '<', now())
                ->update(['status' => 'expired']);

            // Cancel registrations with expired transactions
            $cancelledCount = Registration::where('status', 'pending_payment')
                ->whereHas('transaction', function ($query) {
                    $query->where('status', 'expired');
                })
                ->update(['status' => 'cancelled']);

            if ($expiredCount > 0 || $cancelledCount > 0) {
                \Log::info("Transaction expiration: {$expiredCount} transactions expired, {$cancelledCount} registrations cancelled");
            }
        })
        ->everyMinute()
        ->name('expire-pending-transactions')
        ->withoutOverlapping();
    }

    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
```

**Testing Steps:**
```bash
# Create a test transaction with past expiry
php artisan tinker
>>> $transaction = Transaction::factory()->create([
...     'status' => 'pending',
...     'expires_at' => now()->subMinutes(5)
... ]);

# Run scheduler manually
php artisan schedule:run

# Verify transaction was expired
>>> $transaction->fresh()->status; // Should be 'expired'

# In production, ensure cron is set up
# Add to crontab: * * * * * cd /path-to-project && php artisan schedule:run >> /dev/null 2>&1
```

---

## Phase 2: Performance Optimization (Week 3-4)
**Target:** Days 15-28
**Estimated Time:** 6 hours
**Risk Level:** MEDIUM - Improves UX and scalability

See detailed guide: [PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md)

### 2.1 Fix N+1 Query in Event Model
- [ ] **Priority:** P1 - HIGH
- [ ] **Time Estimate:** 2 hours
- [ ] **Impact:** Dashboard with 50 events = 100+ extra queries

**Quick Summary:**
- Problem: `getTotalRegisteredAttribute()` runs 2 queries per event
- Solution: Use `withCount()` in controllers instead of accessor
- Files: `app/Models/Event.php`, `app/Http/Controllers/DashboardController.php`

---

### 2.2 Optimize Dashboard Queries
- [ ] **Priority:** P1 - HIGH
- [ ] **Time Estimate:** 2 hours
- [ ] **Impact:** Faster dashboard load for all users

**Quick Summary:**
- Replace multiple `clone` queries with single conditional aggregation
- Add caching to event type distribution (1 hour TTL)
- Files: `app/Http/Controllers/DashboardController.php`

---

### 2.3 Add Rate Limiting to API Endpoints
- [ ] **Priority:** P1 - HIGH
- [ ] **Time Estimate:** 30 minutes
- [ ] **Impact:** Prevents API abuse

**Quick Summary:**
- Add `throttle:60,1` to TOTP generation endpoint
- Add `throttle:120,1` to QR verification endpoint
- Files: `routes/api.php`, `routes/web.php`

---

### 2.4 Fix Timezone Hardcoding
- [ ] **Priority:** P2 - MEDIUM
- [ ] **Time Estimate:** 1 hour
- [ ] **Impact:** Code portability

**Quick Summary:**
- Replace `'Asia/Jakarta'` with `config('app.timezone')`
- Files: `app/Http/Requests/StoreEventRequest.php`, `app/Http/Requests/UpdateEventRequest.php`

---

## Phase 3: Client-Side TOTP Implementation (Week 4-5)
**Target:** Days 22-35
**Estimated Time:** 2.5 hours
**Risk Level:** MEDIUM - Significant UX improvement

See detailed guide: [CLIENT_SIDE_TOTP.md](./CLIENT_SIDE_TOTP.md)

### 3.1 Benefits of Client-Side Token Generation
- [ ] **90% reduction in server load** (no 30-second polling)
- [ ] **Zero latency** after initial secret fetch
- [ ] **Smoother UX** with real-time countdown
- [ ] **Offline capability** once secret is loaded

### 3.2 Implementation Checklist
- [ ] Install `otpauth` npm package
- [ ] Create backend endpoint: `GET /api/attendees/{qr_code}/secret`
- [ ] Create React hook: `useTOTP()`
- [ ] Update component: `authenticated/registrations/show.tsx`
- [ ] Add rate limiting (5 requests per 5 minutes)
- [ ] Test token generation accuracy
- [ ] Remove old polling endpoint

**Time Breakdown:**
- Backend endpoint: 30 minutes
- Frontend hook: 1 hour
- Component update: 30 minutes
- Testing: 30 minutes

---

## Phase 4: Testing & Validation (Week 5+)
**Target:** Days 29-39
**Estimated Time:** Variable
**Risk Level:** LOW - Quality assurance

### 4.1 Manual Testing Checklist
- [ ] User registration flow (free events)
- [ ] User registration flow (paid events)
- [ ] Midtrans payment webhook
- [ ] QR code generation and countdown
- [ ] QR code scanning by Panitia
- [ ] Permission checks for all roles
- [ ] Dashboard load time with 50+ events
- [ ] Mobile responsive design

### 4.2 Load Testing
- [ ] Simulate 50 concurrent users on dashboard
- [ ] Simulate 100 QR scans per minute
- [ ] Monitor database query performance

### 4.3 Security Testing
- [ ] Test authorization on all admin routes
- [ ] Verify CSRF protection
- [ ] Test Midtrans signature verification
- [ ] Validate TOTP window (±30 seconds)

---

## Deployment Timeline

### Week 1-2 (Days 1-14): Critical Fixes
**Deliverable:** Fixed codebase ready for staging deployment
- [ ] All TypeScript errors resolved
- [ ] Database integrity enforced
- [ ] Security vulnerabilities patched
- [ ] Performance indexes added
- [ ] Transaction expiration working

### Week 3 (Days 15-21): Staging Deployment
**Deliverable:** Application deployed to staging environment
- [ ] Deploy to staging server
- [ ] Run full test suite
- [ ] Monitor logs for errors
- [ ] Performance baseline established

### Week 4 (Days 22-28): Performance & TOTP
**Deliverable:** Optimized application
- [ ] N+1 queries eliminated
- [ ] Client-side TOTP implemented
- [ ] Dashboard loading < 2 seconds

### Week 5 (Days 29-35): Testing & Fixes
**Deliverable:** Production-ready application
- [ ] All critical paths tested
- [ ] Bug fixes applied
- [ ] Documentation updated

### Week 6 (Days 36-39): Production Deployment
**Deliverable:** Live on production, graduation-ready
- [ ] Deploy to production
- [ ] Final smoke tests
- [ ] Monitor for 48 hours
- [ ] Graduation day readiness confirmed

---

## Risk Management

### High-Risk Areas
1. **Database Migrations:** Foreign key changes require careful coordination
   - **Mitigation:** Test on staging first, backup before production migration

2. **TypeScript Errors:** May reveal deeper architectural issues
   - **Mitigation:** Fix incrementally, test after each fix

3. **TOTP Security:** Client-side secret exposure risk
   - **Mitigation:** Follow security checklist, rate limiting, HTTPS only

### Rollback Plans
- Keep old TOTP polling endpoint for 1 week after client-side deployment
- Database migrations tested on staging with backup restore procedure
- Git tags for each phase completion

---

## Success Metrics

### Before Improvements (Baseline)
- TypeScript: 12 errors
- Dashboard load (50 events): ~3-5 seconds
- QR code latency: 100-500ms per refresh
- Database queries per dashboard: 150+

### After Improvements (Target)
- TypeScript: 0 errors ✅
- Dashboard load (50 events): < 2 seconds ✅
- QR code latency: 0ms (client-side) ✅
- Database queries per dashboard: < 30 ✅

### Graduation Day Requirements
- [ ] System handles 200+ concurrent users
- [ ] QR scanning works within 2-hour window
- [ ] Payment flow 100% reliable
- [ ] Zero critical bugs in production

---

## Additional Resources

- **Detailed Guides:**
  - [CRITICAL_FIXES.md](./CRITICAL_FIXES.md) - Step-by-step fix instructions
  - [PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md) - Query optimization guide
  - [CLIENT_SIDE_TOTP.md](./CLIENT_SIDE_TOTP.md) - TOTP implementation guide
  - [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Pre-launch verification

- **Commands Reference:**
```bash
# Development
composer dev                    # Start all services

# Testing
php artisan test               # Run test suite
npm run types                  # Check TypeScript
./vendor/bin/pint --test       # Check code style

# Database
php artisan migrate            # Run migrations
php artisan tinker             # Database console

# Deployment
npm run build                  # Production build
php artisan config:cache       # Cache config
php artisan route:cache        # Cache routes
php artisan optimize           # Optimize app
```

---

## Notes & Decisions

**Date: November 4, 2025**
- Decided to prioritize critical fixes over comprehensive testing
- Client-side TOTP implementation approved for better UX
- Certificate generation system deferred to post-graduation
- Focus on stability and performance for graduation day

---

**Last Updated:** November 4, 2025
**Next Review:** Day 14 (After Phase 1 completion)
**Contact:** Review with thesis advisor before Phase 3 deployment
