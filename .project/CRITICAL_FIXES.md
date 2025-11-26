# Critical Fixes (P0) - Must Complete Before Deployment

**Priority Level:** P0 - CRITICAL
**Total Estimated Time:** 5 hours
**Risk Level:** HIGH - These issues could break the system on graduation day

---

## Table of Contents
1. [Fix TypeScript Compilation Errors](#1-fix-typescript-compilation-errors) (2 hours)
2. [Add Missing Foreign Key Constraints](#2-add-missing-foreign-key-constraints) (1 hour)
3. [Fix Authorization Bypass Vulnerability](#3-fix-authorization-bypass-vulnerability) (30 minutes)
4. [Add Database Indexes](#4-add-database-indexes) (30 minutes)
5. [Implement Transaction Expiration](#5-implement-transaction-expiration) (1 hour)

---

## 1. Fix TypeScript Compilation Errors
**Time:** 2 hours | **Risk:** HIGH | **Impact:** Blocks production build

### Current Status
```bash
npm run types
# Output: 12 errors found across 6 files
```

### Why This is Critical
- Production build (`npm run build`) will fail with TypeScript errors
- Type safety is broken, allowing potential runtime errors
- Cannot deploy to production with compilation errors

### Fix 1.1: Add Missing Status to registrant-columns.tsx

**File:** `resources/js/pages/admin/events/registrant-columns.tsx`
**Line:** 18
**Error:** Type `'pending_payment'` is not in union type

**Current Code:**
```typescript
const statusConfig: Record<'pending' | 'approved' | 'rejected' | 'attended' | 'missed', string> = {
    approved: 'Approved',
    rejected: 'Rejected',
    pending: 'Pending Approval',
    attended: 'Attended',
    missed: 'Missed',
};
```

**Fixed Code:**
```typescript
const statusConfig: Record<Registration['status'], string> = {
    approved: 'Approved',
    rejected: 'Rejected',
    pending: 'Pending Approval',
    attended: 'Attended',
    missed: 'Missed',
    pending_payment: 'Pending Payment', // ← ADD THIS LINE
};
```

**Why This Works:**
- Uses the `Registration['status']` type which includes all possible status values
- Ensures the mapping is exhaustive and type-safe
- Prevents future status additions from breaking the code

---

### Fix 1.2: Add Missing Status Configs in events/show.tsx

**File:** `resources/js/pages/authenticated/events/show.tsx`
**Line:** 146
**Error:** Property 'attended' does not exist on type

**Current Code:**
```typescript
const STATUS_CONFIGS = {
    approved: {
        icon: CheckCircle2,
        variant: "default" as const,
        label: "Approved",
    },
    pending: {
        icon: Clock,
        variant: "secondary" as const,
        label: "Pending Approval",
    },
    rejected: {
        icon: XCircle,
        variant: "destructive" as const,
        label: "Rejected",
    },
    cancelled: {
        icon: Ban,
        variant: "destructive" as const,
        label: "Cancelled",
    },
    pending_payment: {
        icon: CreditCard,
        variant: "secondary" as const,
        label: "Pending Payment",
    },
    // Missing: 'attended' and 'missed'
};
```

**Fixed Code:**
```typescript
import { CheckCircle2, XCircle, Clock, Ban, CreditCard, CircleSlash } from 'lucide-react';

const STATUS_CONFIGS = {
    approved: {
        icon: CheckCircle2,
        variant: "default" as const,
        label: "Approved",
    },
    pending: {
        icon: Clock,
        variant: "secondary" as const,
        label: "Pending Approval",
    },
    rejected: {
        icon: XCircle,
        variant: "destructive" as const,
        label: "Rejected",
    },
    cancelled: {
        icon: Ban,
        variant: "destructive" as const,
        label: "Cancelled",
    },
    pending_payment: {
        icon: CreditCard,
        variant: "secondary" as const,
        label: "Pending Payment",
    },
    // ← ADD THESE TWO:
    attended: {
        icon: CheckCircle2,
        variant: "default" as const,
        label: "Attended",
    },
    missed: {
        icon: CircleSlash,
        variant: "destructive" as const,
        label: "Missed",
    },
};
```

---

### Fix 1.3: Add Missing Import in admin/events/show.tsx

**File:** `resources/js/pages/admin/events/show.tsx`
**Line:** 53
**Error:** Cannot find name 'Page'

**Current Code:**
```typescript
// Missing import
export default function Show({ event, ... }: PageProps<{ event: Event }>) {
    // ...
}
```

**Fixed Code:**
```typescript
import { Page } from '@inertiajs/core'; // ← ADD THIS IMPORT

export default function Show({ event, ... }: PageProps<{ event: Event }>) {
    // ...
}
```

---

### Fix 1.4: Fix Type Mismatch in registration-form.tsx

**File:** `resources/js/components/form/registration-form.tsx`
**Line:** 30
**Error:** Type 'GuestForm[]' is not assignable to 'FormDataConvertible'

**Current Code:**
```typescript
const form = useForm({
    guest_count: 0,
    guests: [],
});
```

**Fixed Code:**
```typescript
interface GuestForm {
    name: string;
    phone: string;
}

const form = useForm<{
    guest_count: number;
    guests: GuestForm[];
}>({
    guest_count: 0,
    guests: [],
});
```

---

### Fix 1.5: Fix Missing Property in dashboard.tsx

**File:** `resources/js/pages/dashboard.tsx`
**Line:** 97
**Error:** Type does not have property 'state'

**Context:** The `todayEvents` array items are missing the `state` property.

**Current Code:**
```typescript
const todayEvents: TodayEventItem[] = data.todayEvents || [];
```

**Option 1 - Add Default State:**
```typescript
const todayEvents: TodayEventItem[] = (data.todayEvents || []).map(event => ({
    ...event,
    state: event.state || 'upcoming', // Add default state
}));
```

**Option 2 - Update Backend:**
Ensure the backend controller includes `state` in the response:
```php
// DashboardController.php
$todayEvents = Event::whereDate('start_time', today())
    ->get()
    ->map(fn($event) => [
        'id' => $event->id,
        'title' => $event->title,
        'start_time' => $event->start_time,
        'state' => $event->start_time > now() ? 'upcoming' : 'ongoing', // ← Add this
    ]);
```

---

### Fix 1.6: Review Type Mismatch in registrations/columns.tsx

**File:** `resources/js/pages/authenticated/registrations/columns.tsx`
**Line:** 67
**Error:** Type mismatch (specific error needs review)

**Action Required:**
1. Open the file and locate line 67
2. Review the column definition
3. Ensure proper typing for the accessor/cell function
4. Common issue: Accessing a property that doesn't exist on the type

**Example Fix Pattern:**
```typescript
// ❌ If this is the issue:
{
    accessorKey: "event.title",
    // TypeScript doesn't know 'event' exists on Registration
}

// ✅ Fix by asserting the type:
{
    accessorKey: "event",
    cell: ({ row }) => {
        const registration = row.original as Registration & { event: Event };
        return registration.event?.title || 'N/A';
    },
}
```

---

### Testing All TypeScript Fixes

**Step 1: Run TypeScript Compiler**
```bash
npm run types
```

**Expected Output:**
```
No errors found
```

**Step 2: Build Production Assets**
```bash
npm run build
```

**Expected Output:**
```
✓ built in [time]
```

**Step 3: Visual Testing**
Open these pages in the browser to ensure no runtime errors:
- `/admin/events` - Check registrant columns display correctly
- `/admin/events/{event}` - Check all status badges render
- `/dashboard` - Check today's events load
- `/registrations/create` - Check guest form works
- `/registrations/{registration}` - Check columns display

---

## 2. Add Missing Foreign Key Constraints
**Time:** 1 hour | **Risk:** HIGH | **Impact:** Data integrity, prevents orphaned records

### Why This is Critical
Without foreign key constraints:
- Deleting an event doesn't cascade to registrations → orphaned data
- Deleting a user doesn't cascade to registrations → stale references
- Database cannot enforce referential integrity
- Silent data corruption possible

### Current Problem

**Migration 1:** `2025_07_22_071042_update_event_foreign_key_in_registrations_table.php`
```php
// ❌ Drops foreign key but never recreates it
Schema::table('registrations', function (Blueprint $table) {
    $table->dropForeign(['event_id']);
    $table->dropColumn('event_id');
    $table->uuid('event_uuid')->after('uuid'); // No constraint!
});
```

**Migration 2:** `2025_07_23_064202_update_user_foreign_key_in_registrations_table.php`
```php
// ❌ Drops foreign key but never recreates it
Schema::table('registrations', function (Blueprint $table) {
    $table->dropForeign(['user_id']);
    $table->dropColumn('user_id');
    $table->uuid('user_uuid')->after('uuid'); // No constraint!
});
```

### Solution: Update Both Migrations

**⚠️ IMPORTANT:** This change requires database re-migration. Coordinate with deployment.

#### Fix Migration 1: Event Foreign Key

**File:** `database/migrations/2025_07_22_071042_update_event_foreign_key_in_registrations_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->dropForeign(['event_id']);
            $table->dropColumn('event_id');
            $table->uuid('event_uuid')->after('uuid');

            // ← ADD THIS:
            $table->foreign('event_uuid')
                ->references('uuid')
                ->on('events')
                ->onDelete('cascade'); // Delete registrations when event deleted
        });
    }

    public function down(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->dropForeign(['event_uuid']); // ← Add this
            $table->dropColumn('event_uuid');
            $table->unsignedBigInteger('event_id')->after('uuid');
            $table->foreign('event_id')->references('id')->on('events')->onDelete('cascade');
        });
    }
};
```

#### Fix Migration 2: User Foreign Key

**File:** `database/migrations/2025_07_23_064202_update_user_foreign_key_in_registrations_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
            $table->uuid('user_uuid')->after('uuid');

            // ← ADD THIS:
            $table->foreign('user_uuid')
                ->references('uuid')
                ->on('users')
                ->onDelete('cascade'); // Delete registrations when user deleted
        });
    }

    public function down(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->dropForeign(['user_uuid']); // ← Add this
            $table->dropColumn('user_uuid');
            $table->unsignedBigInteger('user_id')->after('uuid');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }
};
```

### Testing Foreign Keys

**Development Testing:**
```bash
# 1. Rollback migrations
php artisan migrate:rollback --step=10

# 2. Re-run migrations with fixes
php artisan migrate

# 3. Seed test data
php artisan db:seed

# 4. Verify foreign keys exist
php artisan tinker
>>> Schema::getConnection()->getDoctrineSchemaManager()->listTableForeignKeys('registrations');
# Should show: event_uuid → events.uuid, user_uuid → users.uuid
```

**Functional Testing:**
```php
// Test cascade delete
php artisan tinker

// Create test event with registration
>>> $event = Event::factory()->create();
>>> $user = User::factory()->create();
>>> $registration = Registration::factory()->create([
...     'event_uuid' => $event->uuid,
...     'user_uuid' => $user->uuid,
... ]);

// Delete event - should cascade to registration
>>> $event->delete();
>>> Registration::find($registration->id); // Should be null

// Verify orphaned records don't exist
>>> DB::table('registrations')->whereNull('event_uuid')->count(); // Should be 0
```

### Production Deployment Strategy

**⚠️ CRITICAL:** This requires careful production migration

**Option 1: Fresh Migration (Recommended for staging)**
```bash
# Backup database first!
php artisan db:backup

# Fresh migration
php artisan migrate:fresh --seed
```

**Option 2: Add Constraints to Existing Data (Production)**
```bash
# 1. Check for orphaned records BEFORE migration
php artisan tinker
>>> DB::table('registrations')->whereNotExists(function($q) {
...     $q->select('uuid')->from('events')->whereColumn('events.uuid', 'registrations.event_uuid');
... })->count();
# If > 0, clean up orphans first!

# 2. Clean up orphaned records
>>> DB::table('registrations')
...     ->whereNotExists(function($q) {
...         $q->select('uuid')->from('events')->whereColumn('events.uuid', 'registrations.event_uuid');
...     })
...     ->delete();

# 3. Run migration
php artisan migrate
```

---

## 3. Fix Authorization Bypass Vulnerability
**Time:** 30 minutes | **Risk:** CRITICAL SECURITY | **Impact:** Unauthorized registration management

### The Vulnerability

**File:** `app/Http/Controllers/RegistrationManagementController.php`

**Current Code (INSECURE):**
```php
public function approve($registrationId): RedirectResponse
{
    $registration = Registration::findOrFail($registrationId);

    // ❌ NO AUTHORIZATION CHECK!
    // Any authenticated user can approve ANY registration

    $registration->update(['status' => 'approved']);
    return back()->with('success', 'Registration approved.');
}

public function reject($registrationId): RedirectResponse
{
    $registration = Registration::findOrFail($registrationId);

    // ❌ NO AUTHORIZATION CHECK!

    $registration->update(['status' => 'rejected']);
    return back()->with('success', 'Registration rejected.');
}
```

### Attack Scenario
1. Panitia user is assigned to Event A
2. They discover the API endpoint for Event B registration approval
3. They can approve/reject registrations for Event B without permission
4. System Administrator privileges bypassed

### The Fix

**File:** `app/Http/Controllers/RegistrationManagementController.php`

```php
<?php

namespace App\Http\Controllers;

use App\Models\Registration;
use Illuminate\Http\RedirectResponse;

class RegistrationManagementController extends Controller
{
    /**
     * Approve a registration
     */
    public function approve(Registration $registration): RedirectResponse
    {
        // ✅ ADD AUTHORIZATION CHECK
        $this->authorize('manage', $registration->event);

        $registration->update([
            'status' => 'approved',
            'approved_at' => now(), // Track when approved
            'approved_by' => auth()->id(), // Track who approved (optional - requires migration)
        ]);

        return back()->with('success', 'Registration has been approved successfully.');
    }

    /**
     * Reject a registration
     */
    public function reject(Registration $registration): RedirectResponse
    {
        // ✅ ADD AUTHORIZATION CHECK
        $this->authorize('manage', $registration->event);

        $registration->update([
            'status' => 'rejected',
            'rejected_at' => now(), // Track when rejected
            'rejected_by' => auth()->id(), // Track who rejected (optional)
        ]);

        return back()->with('success', 'Registration has been rejected.');
    }
}
```

### What This Does

The `$this->authorize('manage', $registration->event)` checks:
1. Is user a System Administrator? → Allow
2. Is user Akademik role? → Allow
3. Is user Panitia assigned to this event? → Allow
4. Otherwise → Throw 403 Forbidden

**Policy Location:** `app/Policies/EventPolicy.php` - Line 72

```php
public function manage(User $user, Event $event): bool
{
    // System Administrator and Akademik can manage all events
    if ($user->hasRole(['System Administrator', 'Akademik'])) {
        return true;
    }

    // Panitia can only manage events they're assigned to
    return $event->staff()->where('user_id', $user->id)->exists();
}
```

### Testing Authorization

**Test Case 1: System Administrator (Should Pass)**
```bash
# Login as admin
php artisan tinker
>>> $admin = User::role('System Administrator')->first();
>>> $registration = Registration::first();
>>> auth()->login($admin);

# Should succeed
>>> app(RegistrationManagementController::class)->approve($registration);
```

**Test Case 2: Assigned Panitia (Should Pass)**
```php
>>> $panitia = User::role('Panitia')->first();
>>> $event = Event::first();
>>> $event->staff()->attach($panitia->id); // Assign panitia to event
>>> $registration = Registration::where('event_uuid', $event->uuid)->first();
>>> auth()->login($panitia);

# Should succeed
>>> app(RegistrationManagementController::class)->approve($registration);
```

**Test Case 3: Unassigned Panitia (Should Fail)**
```php
>>> $panitia = User::role('Panitia')->first();
>>> $otherEvent = Event::where('uuid', '!=', $event->uuid)->first();
>>> $registration = Registration::where('event_uuid', $otherEvent->uuid)->first();
>>> auth()->login($panitia);

# Should throw 403 Forbidden
>>> app(RegistrationManagementController::class)->approve($registration);
# Expected: Illuminate\Auth\Access\AuthorizationException
```

**Browser Testing:**
1. Login as Panitia user assigned to Event A
2. Try to approve registration for Event B via URL manipulation
3. Should see 403 Forbidden error page

---

## 4. Add Database Indexes
**Time:** 30 minutes | **Risk:** MEDIUM | **Impact:** Query performance degradation

### Why Indexes Are Critical

Without indexes on frequently queried columns:
- **Dashboard with 50 events:** 150+ queries, 3-5 second load time
- **QR code lookup:** Full table scan on every scan
- **Registration filtering:** Slow status queries
- **Graduation day with 200+ users:** Potential timeouts

### Create Performance Index Migration

```bash
php artisan make:migration add_performance_indexes_to_tables
```

### Migration Code

**File:** `database/migrations/2025_11_04_000000_add_performance_indexes_to_tables.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add indexes to improve query performance
     */
    public function up(): void
    {
        // Registrations table - most queried table
        Schema::table('registrations', function (Blueprint $table) {
            $table->index('event_uuid', 'registrations_event_uuid_index');
            $table->index('user_uuid', 'registrations_user_uuid_index');
            $table->index('status', 'registrations_status_index');
            $table->index('order_id', 'registrations_order_id_index');
        });

        // Registration attendees - QR code scans happen frequently
        Schema::table('registrations_attendees', function (Blueprint $table) {
            $table->index('registration_id', 'attendees_registration_id_index');
            $table->index('qr_code', 'attendees_qr_code_index'); // CRITICAL!
            $table->index('attended_at', 'attendees_attended_at_index');
        });

        // Events - range queries and conflict detection
        Schema::table('events', function (Blueprint $table) {
            $table->index('start_time', 'events_start_time_index');
            $table->index('end_time', 'events_end_time_index');
            // Composite index for room availability checking
            $table->index(['room_id', 'start_time', 'end_time'], 'events_room_time_index');
        });

        // Transactions - status filtering
        Schema::table('transactions', function (Blueprint $table) {
            $table->index('status', 'transactions_status_index');
        });
    }

    /**
     * Reverse the migrations
     */
    public function down(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->dropIndex('registrations_event_uuid_index');
            $table->dropIndex('registrations_user_uuid_index');
            $table->dropIndex('registrations_status_index');
            $table->dropIndex('registrations_order_id_index');
        });

        Schema::table('registrations_attendees', function (Blueprint $table) {
            $table->dropIndex('attendees_registration_id_index');
            $table->dropIndex('attendees_qr_code_index');
            $table->dropIndex('attendees_attended_at_index');
        });

        Schema::table('events', function (Blueprint $table) {
            $table->dropIndex('events_start_time_index');
            $table->dropIndex('events_end_time_index');
            $table->dropIndex('events_room_time_index');
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex('transactions_status_index');
        });
    }
};
```

### Run Migration

```bash
php artisan migrate
```

### Verify Indexes

```bash
php artisan tinker

# Check registrations indexes
>>> Schema::getConnection()->getDoctrineSchemaManager()->listTableIndexes('registrations');

# Should show indexes on: event_uuid, user_uuid, status, order_id

# Check attendees indexes
>>> Schema::getConnection()->getDoctrineSchemaManager()->listTableIndexes('registrations_attendees');

# Should show indexes on: qr_code, registration_id, attended_at
```

### Performance Testing

**Before Indexes:**
```php
php artisan tinker

>>> DB::enableQueryLog();
>>> Event::with('registrations')->get();
>>> collect(DB::getQueryLog())->pluck('time')->sum(); // milliseconds
# Example: 1500ms for 50 events
```

**After Indexes:**
```php
>>> DB::flushQueryLog();
>>> DB::enableQueryLog();
>>> Event::with('registrations')->get();
>>> collect(DB::getQueryLog())->pluck('time')->sum();
# Expected: < 300ms for 50 events (5x improvement)
```

### Query Examples That Benefit

**1. QR Code Lookup (Most Critical):**
```sql
-- Before: Full table scan
SELECT * FROM registrations_attendees WHERE qr_code = 'ABC123XYZ';
-- After: Index seek (instant)
```

**2. Event Registration Filtering:**
```sql
-- Before: Full table scan
SELECT * FROM registrations WHERE event_uuid = 'xxx' AND status = 'approved';
-- After: Index seek on event_uuid, filter on status
```

**3. Dashboard Event Loading:**
```sql
-- Before: Multiple full scans
SELECT * FROM events WHERE start_time >= NOW() ORDER BY start_time;
-- After: Index range scan
```

---

## 5. Implement Transaction Expiration
**Time:** 1 hour | **Risk:** MEDIUM | **Impact:** Pending transactions never expire

### The Problem

**Current Behavior:**
- User registers for paid event
- Midtrans transaction created with `expires_at` timestamp
- User never pays
- Transaction stays "pending" forever
- Registration stays "pending_payment" forever
- Slot not released for other users

### The Solution

Add automatic expiration via Laravel scheduler.

**File:** `app/Console/Kernel.php`

```php
<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use App\Models\Transaction;
use App\Models\Registration;
use Illuminate\Support\Facades\Log;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule
     */
    protected function schedule(Schedule $schedule): void
    {
        // Expire pending transactions every minute
        $schedule->call(function () {
            // Step 1: Expire transactions past their expiration time
            $expiredCount = Transaction::where('status', 'pending')
                ->where('expires_at', '<', now())
                ->update([
                    'status' => 'expired',
                    'updated_at' => now(),
                ]);

            // Step 2: Cancel registrations with expired transactions
            $cancelledCount = Registration::where('status', 'pending_payment')
                ->whereHas('transaction', function ($query) {
                    $query->where('status', 'expired');
                })
                ->update([
                    'status' => 'cancelled',
                    'updated_at' => now(),
                ]);

            // Log if any transactions were expired
            if ($expiredCount > 0 || $cancelledCount > 0) {
                Log::info("Transaction expiration job completed", [
                    'expired_transactions' => $expiredCount,
                    'cancelled_registrations' => $cancelledCount,
                    'timestamp' => now()->toDateTimeString(),
                ]);
            }
        })
        ->everyMinute()
        ->name('expire-pending-transactions')
        ->withoutOverlapping(); // Prevent concurrent runs
    }

    /**
     * Register the commands for the application
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
```

### Setup Cron Job

**Development:**
```bash
# Run scheduler manually (for testing)
php artisan schedule:run

# Or run continuously
php artisan schedule:work
```

**Production:**
Add to server crontab:
```bash
# Edit crontab
crontab -e

# Add this line:
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

### Testing Expiration Logic

**Test Case 1: Expire Old Transaction**
```php
php artisan tinker

// Create expired transaction
>>> $transaction = Transaction::factory()->create([
...     'status' => 'pending',
...     'expires_at' => now()->subMinutes(5), // 5 minutes ago
... ]);

>>> $registration = Registration::factory()->create([
...     'status' => 'pending_payment',
...     'order_id' => $transaction->order_id,
... ]);

// Run scheduler
>>> Artisan::call('schedule:run');

// Verify expiration
>>> $transaction->fresh()->status; // Should be 'expired'
>>> $registration->fresh()->status; // Should be 'cancelled'
```

**Test Case 2: Don't Expire Valid Transaction**
```php
>>> $transaction = Transaction::factory()->create([
...     'status' => 'pending',
...     'expires_at' => now()->addHours(1), // Expires in 1 hour
... ]);

>>> Artisan::call('schedule:run');

>>> $transaction->fresh()->status; // Should still be 'pending'
```

**Test Case 3: Ignore Already Expired**
```php
>>> $transaction = Transaction::factory()->create([
...     'status' => 'expired', // Already expired
...     'expires_at' => now()->subHours(1),
... ]);

>>> Artisan::call('schedule:run');

>>> $transaction->fresh()->updated_at; // Should not change
```

### Monitoring Expiration

**Check Logs:**
```bash
tail -f storage/logs/laravel.log | grep "Transaction expiration"
```

**Manual Check:**
```bash
php artisan tinker

# Count pending transactions past expiration
>>> Transaction::where('status', 'pending')
...     ->where('expires_at', '<', now())
...     ->count();
# Should be 0 if scheduler is working

# Count pending_payment registrations with expired transactions
>>> Registration::where('status', 'pending_payment')
...     ->whereHas('transaction', fn($q) => $q->where('status', 'expired'))
...     ->count();
# Should be 0 if scheduler is working
```

### Graduation Day Verification

**Before Event Starts:**
```bash
# Verify scheduler is running
php artisan schedule:list

# Should show:
# 0 * * * * expire-pending-transactions ........ Next Due: 1 minute from now
```

**During Event:**
Monitor logs every 30 minutes to ensure job is running.

---

## Summary Checklist

### Phase 1 Completion Criteria

- [ ] TypeScript compiles with 0 errors (`npm run types`)
- [ ] Production build succeeds (`npm run build`)
- [ ] Foreign key constraints added to registrations table
- [ ] Cascade delete tested (event deletion removes registrations)
- [ ] Authorization checks added to approve/reject actions
- [ ] Panitia cannot manage unassigned events (tested)
- [ ] Database indexes created on all critical columns
- [ ] QR code lookup uses index (verified in query log)
- [ ] Transaction expiration cron job configured
- [ ] Expired transactions automatically cancelled
- [ ] All changes tested on staging environment
- [ ] No errors in `storage/logs/laravel.log`

### Deployment Readiness

After completing all 5 critical fixes:
1. Commit changes to git
2. Deploy to staging
3. Run full test suite
4. Monitor for 24 hours
5. Deploy to production

### If Something Breaks

**Rollback Plan:**
```bash
# Revert git changes
git revert HEAD

# Rollback migrations
php artisan migrate:rollback

# Restore database backup
# (specific commands depend on your backup strategy)
```

---

**Last Updated:** November 4, 2025
**Next Steps:** Proceed to [PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md) after Phase 1 completion
