# Deployment Checklist - Graduation Day Readiness

**Purpose:** Ensure EventHub is production-ready before graduation day
**Timeline:** Complete 7 days before graduation
**Estimated Time:** 4-6 hours of testing and verification

---

## Table of Contents
1. [Pre-Deployment Verification](#pre-deployment-verification)
2. [Critical Functionality Testing](#critical-functionality-testing)
3. [Performance Benchmarking](#performance-benchmarking)
4. [Security Audit](#security-audit)
5. [Infrastructure Checklist](#infrastructure-checklist)
6. [Graduation Day Preparation](#graduation-day-preparation)
7. [Rollback Plan](#rollback-plan)

---

## Pre-Deployment Verification

### Code Quality Checks

**Run All Quality Tools:**
```bash
# 1. TypeScript compilation
npm run types
# Expected: "No errors found"

# 2. Production build
npm run build
# Expected: Build succeeds without errors

# 3. PHP code style
./vendor/bin/pint --test
# Expected: No style issues

# 4. Run all tests
php artisan test
# Expected: All tests pass

# 5. Check for TODO/FIXME comments
grep -r "TODO\|FIXME" app/ resources/js/
# Review any critical TODOs
```

**Checklist:**
- [ ] TypeScript compiles with 0 errors
- [ ] Production build succeeds
- [ ] PHP Pint passes (or run `./vendor/bin/pint` to auto-fix)
- [ ] All tests pass (Pest PHP)
- [ ] No critical TODOs/FIXMEs in code

---

### Database Integrity

**Verify Migrations:**
```bash
# 1. Check migration status
php artisan migrate:status
# All migrations should show "Ran"

# 2. Verify foreign keys exist
php artisan tinker
>>> Schema::getConnection()->getDoctrineSchemaManager()->listTableForeignKeys('registrations');
# Should show: event_uuid, user_uuid foreign keys

# 3. Verify indexes exist
>>> Schema::getConnection()->getDoctrineSchemaManager()->listTableIndexes('registrations_attendees');
# Should show: qr_code, registration_id indexes

# 4. Check for orphaned records
>>> DB::table('registrations')
...     ->whereNotExists(function($q) {
...         $q->select('uuid')->from('events')
...           ->whereColumn('events.uuid', 'registrations.event_uuid');
...     })->count();
# Should be 0 (no orphaned registrations)
```

**Checklist:**
- [ ] All migrations run successfully
- [ ] Foreign key constraints exist on UUID columns
- [ ] Indexes exist on frequently queried columns
- [ ] No orphaned records in database
- [ ] Database backup procedure tested

---

### Environment Configuration

**File:** `.env` (Production)

```bash
# Application
APP_NAME=EventHub
APP_ENV=production
APP_DEBUG=false  # ← MUST BE FALSE
APP_URL=https://your-domain.com  # ← HTTPS required

# Database
DB_CONNECTION=mysql  # or pgsql (not sqlite in production)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=eventhub_production
DB_USERNAME=your_db_user
DB_PASSWORD=strong_password_here

# Queue
QUEUE_CONNECTION=database  # or redis for better performance

# Cache
CACHE_DRIVER=file  # or redis for better performance

# Session
SESSION_DRIVER=database  # Important for multi-server

# Midtrans Payment (PRODUCTION)
MIDTRANS_MERCHANT_ID=your_merchant_id
MIDTRANS_CLIENT_KEY=your_client_key
MIDTRANS_SERVER_KEY=your_production_server_key
MIDTRANS_IS_PRODUCTION=true  # ← MUST BE TRUE

# Mail (for notifications)
MAIL_MAILER=smtp
MAIL_HOST=your-smtp-host
MAIL_PORT=587
MAIL_USERNAME=your-email
MAIL_PASSWORD=your-password
MAIL_FROM_ADDRESS=noreply@your-domain.com

# Logging
LOG_CHANNEL=daily
LOG_LEVEL=warning  # Don't log debug info in production
```

**Verify Configuration:**
```bash
# Check critical config values
php artisan tinker
>>> config('app.debug');  // Should be false
>>> config('app.env');    // Should be 'production'
>>> config('services.midtrans.is_production');  // Should be true
>>> config('app.url');    // Should be HTTPS URL
```

**Checklist:**
- [ ] `APP_DEBUG=false` (security critical)
- [ ] `APP_ENV=production`
- [ ] `APP_URL` uses HTTPS
- [ ] Database credentials correct
- [ ] Midtrans production keys configured
- [ ] `MIDTRANS_IS_PRODUCTION=true`
- [ ] Mail configuration working
- [ ] Queue driver configured (not sync)

---

## Critical Functionality Testing

### 1. User Registration & Authentication

**Test Flow:**
```bash
# Use browser or API testing tool (Postman/Insomnia)
```

**Test Cases:**
- [ ] User can register new account
- [ ] Email verification works (if enabled)
- [ ] User can login with correct credentials
- [ ] Login fails with wrong password
- [ ] Password reset email sent and works
- [ ] User profile can be updated

**Expected Behavior:**
- Registration redirects to dashboard
- Login redirects to intended page
- Failed login shows error message
- All auth pages render correctly

---

### 2. Event Registration Flow (Free Event)

**Test Flow:**
```bash
# 1. Login as regular user
# 2. Browse available events
# 3. Click "Register" on free event
# 4. Fill guest information (if applicable)
# 5. Submit registration
```

**Test Cases:**
- [ ] Event listing page loads correctly
- [ ] Event details page shows all information
- [ ] Can register for free event
- [ ] Guest form validates correctly
- [ ] Registration confirmation shown
- [ ] Registration appears in "My Registrations"
- [ ] QR code ticket displays correctly
- [ ] QR code token updates every 30 seconds
- [ ] Cannot register twice for same event

**Expected Behavior:**
- Registration status: "approved" or "pending" (based on event config)
- Email notification sent (if configured)
- QR code generates without errors

---

### 3. Event Registration Flow (Paid Event)

**Test Flow:**
```bash
# 1. Register for paid event
# 2. Redirected to Midtrans payment page
# 3. Complete payment (use sandbox credentials)
# 4. Verify webhook updates status
```

**Test Cases:**
- [ ] Paid event shows correct price
- [ ] Registration creates pending transaction
- [ ] Redirected to Midtrans payment page
- [ ] Payment page shows correct amount
- [ ] **CRITICAL:** Test with Midtrans SANDBOX first
- [ ] After payment, status updates to "approved"
- [ ] Registration marked as paid
- [ ] QR code becomes available

**Midtrans Sandbox Test Cards:**
```
# Successful payment:
Card Number: 4811 1111 1111 1114
CVV: 123
Exp: 01/25

# Failed payment:
Card Number: 4911 1111 1111 1113
CVV: 123
Exp: 01/25
```

**Expected Behavior:**
- Transaction status: "pending" → "settlement" (success) or "failed"
- Registration status: "pending_payment" → "approved" (success) or "cancelled" (failed)
- Email confirmation sent on successful payment

**IMPORTANT: Test Webhook:**
```bash
# Manually trigger webhook (development)
curl -X POST http://localhost:8000/midtrans/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_status": "settlement",
    "order_id": "YOUR_ORDER_ID",
    "signature_key": "CORRECT_SIGNATURE"
  }'

# Should update transaction status
```

---

### 4. QR Code Generation & Scanning

**Test Flow:**
```bash
# As User:
# 1. Navigate to "My Registrations"
# 2. Click on approved registration
# 3. View QR code ticket

# As Panitia:
# 1. Login as Panitia user
# 2. Navigate to assigned event
# 3. Click "Scan Ticket"
# 4. Scan user's QR code
```

**Test Cases:**
- [ ] QR code displays without errors
- [ ] TOTP token updates every 30 seconds (client-side generation)
- [ ] Countdown shows correct time (30, 29, 28...)
- [ ] Progress bar animates smoothly
- [ ] **No network polling** after initial load (check DevTools)
- [ ] QR code works within event time window (2h before to 1h after)
- [ ] Panitia can scan and verify QR code
- [ ] Valid QR code marks attendee as "attended"
- [ ] Invalid/expired QR code shows error
- [ ] Cannot scan same QR code twice (double-scan prevention)

**Expected Behavior:**
- QR code format: `{qr_code},{totp_token}`
- Valid QR code: Success message, attendee marked attended
- Invalid QR code: Error message shown to Panitia
- Outside time window: "Event not started yet" or "Event ended"

**Manual QR Verification:**
```php
# Test TOTP validation
php artisan tinker

>>> $attendee = RegistrationAttendee::first();
>>> $qrCode = $attendee->qr_code;
>>> $secret = $attendee->totp_secret;

# Generate current token
>>> $otp = TOTP::create($secret);
>>> $token = $otp->now();
>>> echo "{$qrCode},{$token}";

# Verify this value scans successfully
```

---

### 5. Permission & Authorization

**Test Cases:**

**As System Administrator:**
- [ ] Can view all events
- [ ] Can create/edit/delete events
- [ ] Can view all registrations
- [ ] Can approve/reject registrations
- [ ] Can manage users and roles
- [ ] Can access admin dashboard

**As Akademik:**
- [ ] Can view all events
- [ ] Can create/edit events
- [ ] Can approve/reject registrations
- [ ] Can assign Panitia to events
- [ ] Can access admin dashboard

**As Panitia:**
- [ ] Can only view assigned events
- [ ] Can scan QR codes for assigned events
- [ ] Can view registrations for assigned events
- [ ] **CANNOT** access events not assigned to them
- [ ] **CANNOT** approve/reject registrations (verify this!)
- [ ] **CANNOT** access admin dashboard

**As Regular User:**
- [ ] Can browse public events
- [ ] Can register for events
- [ ] Can view own registrations
- [ ] **CANNOT** access admin pages
- [ ] **CANNOT** scan QR codes
- [ ] **CANNOT** view other users' registrations

**Test Authorization Bypass:**
```bash
# Try to access other user's data via URL manipulation
# Login as User A, then try:
https://your-domain.com/registrations/{user_b_registration_id}

# Should show: 403 Forbidden or redirect to dashboard
```

---

## Performance Benchmarking

### Load Time Targets

**Pages to Test:**
- Dashboard: < 2 seconds
- Event listing: < 1 second
- Event details: < 1.5 seconds
- Registration form: < 1 second
- QR code page: < 1 second (initial load)

### Database Query Optimization

**Check Query Count:**
```php
php artisan tinker

# Dashboard query count (System Admin)
>>> DB::enableQueryLog();
>>> $controller = new App\Http\Controllers\DashboardController();
>>> $request = Request::create('/dashboard', 'GET');
>>> auth()->login(User::role('System Administrator')->first());
>>> $controller->index($request);
>>> count(DB::getQueryLog());
# Target: < 30 queries
```

**Check for N+1 Queries:**
```php
# Event listing with registrations
>>> DB::flushQueryLog();
>>> DB::enableQueryLog();
>>> Event::with(['registrations', 'building', 'room'])
...     ->withCount('registrations')
...     ->take(50)
...     ->get();
>>> count(DB::getQueryLog());
# Target: < 10 queries (not 100+)
```

**Checklist:**
- [ ] Dashboard loads in < 2 seconds
- [ ] Event listing < 30 queries
- [ ] No N+1 query patterns
- [ ] QR code generates instantly (client-side)
- [ ] Database indexes in place

---

### Concurrent User Simulation

**Load Testing (Optional but Recommended):**

Install k6 load testing tool:
```bash
# Install k6
curl https://github.com/grafana/k6/releases/download/v0.47.0/k6-v0.47.0-linux-amd64.tar.gz -L | tar xvz
```

**Load Test Script:**
```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    stages: [
        { duration: '30s', target: 50 },  // Ramp up to 50 users
        { duration: '1m', target: 100 },  // Hold at 100 users
        { duration: '30s', target: 0 },   // Ramp down
    ],
};

export default function () {
    // Test event listing page
    let res = http.get('https://your-domain.com/events');
    check(res, {
        'status is 200': (r) => r.status === 200,
        'response time < 2s': (r) => r.timings.duration < 2000,
    });
    sleep(1);
}
```

**Run Load Test:**
```bash
k6 run load-test.js
```

**Target Metrics:**
- 100 concurrent users: avg response time < 2s
- 95th percentile: < 3s
- No 500 errors
- No timeouts

**Checklist:**
- [ ] Server handles 100+ concurrent users
- [ ] No 500 errors under load
- [ ] Response time acceptable
- [ ] Database connections don't exhaust

---

## Security Audit

### 1. Authentication & Session Security

**Verify:**
- [ ] HTTPS enforced (all HTTP redirects to HTTPS)
- [ ] Secure session cookies (`SESSION_SECURE_COOKIE=true`)
- [ ] CSRF protection enabled (Laravel default)
- [ ] Password hashing uses bcrypt/argon2
- [ ] Password reset tokens expire

**Test HTTPS Redirect:**
```bash
curl -I http://your-domain.com
# Should return: 301 Redirect to https://
```

---

### 2. Authorization Checks

**Test Scenarios:**
- [ ] Panitia cannot access unassigned events
- [ ] User cannot view other users' registrations
- [ ] Guest cannot access authenticated routes
- [ ] Authenticated user cannot access admin routes

**Example Test:**
```bash
# Login as Panitia user assigned to Event A
# Try to access Event B's QR scanning page
GET /panitia/events/{event_b_uuid}/scan

# Expected: 403 Forbidden
```

---

### 3. Midtrans Payment Security

**Verify:**
- [ ] Webhook signature verification enabled
- [ ] CSRF exemption for `/midtrans/webhook` route only
- [ ] Webhook processes idempotently (no duplicate processing)
- [ ] Transaction amounts validated server-side
- [ ] Production server key stored in `.env` (not hardcoded)

**Test Webhook Security:**
```bash
# Try to call webhook with invalid signature
curl -X POST https://your-domain.com/midtrans/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_status": "settlement",
    "order_id": "ORD-123",
    "signature_key": "INVALID_SIGNATURE"
  }'

# Expected: Signature verification fails (logged, not processed)
```

**Check Code:**
```php
// TransactionController.php - verify this exists:
$signature = hash('sha512', $orderId . $statusCode . $grossAmount . $serverKey);
if ($signature !== $signatureKey) {
    Log::warning('Midtrans signature mismatch');
    return response()->json(['message' => 'Invalid signature'], 403);
}
```

---

### 4. QR Code Security

**Verify:**
- [ ] TOTP secret never logged
- [ ] Secret transmitted over HTTPS only
- [ ] Rate limiting on secret endpoint (5 per 5 min)
- [ ] Ownership verification (user can only fetch own secrets)
- [ ] Server validates TOTP tokens (client generation doesn't bypass validation)
- [ ] Double-scan prevention (attended_at timestamp checked)

**Test Rate Limiting:**
```bash
# Try to fetch secret 6 times in 5 minutes
for i in {1..6}; do
    curl -H "Authorization: Bearer YOUR_TOKEN" \
         https://your-domain.com/api/attendees/ABC123/secret
done

# Expected: 6th request returns 429 Too Many Requests
```

---

### 5. Input Validation

**Verify:**
- [ ] Event dates validated (start < end)
- [ ] Room conflict detection works
- [ ] Guest count validated (>= 0)
- [ ] Phone numbers validated
- [ ] File uploads validated (type, size)
- [ ] XSS protection (React auto-escapes)

**Test Invalid Input:**
```bash
# Try to create event with end_time < start_time
POST /admin/events
{
    "title": "Test Event",
    "start_time": "2025-12-01 15:00",
    "end_time": "2025-12-01 10:00"  // ← Before start
}

# Expected: Validation error
```

---

## Infrastructure Checklist

### Server Configuration

**Requirements:**
- [ ] PHP 8.2 or higher
- [ ] Composer installed
- [ ] Node.js 18+ and npm installed
- [ ] MySQL/PostgreSQL database
- [ ] Web server (Nginx/Apache) configured
- [ ] HTTPS certificate installed (Let's Encrypt)
- [ ] Firewall configured (allow 80, 443)

**PHP Extensions Required:**
```bash
php -m | grep -E "pdo|mbstring|tokenizer|xml|ctype|json|bcmath|fileinfo|gd"

# All should be present
```

---

### Process Management

**Queue Worker:**
```bash
# Install supervisor for queue management
sudo apt-get install supervisor

# Create supervisor config
sudo nano /etc/supervisor/conf.d/eventhub-worker.conf
```

**Supervisor Config:**
```ini
[program:eventhub-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /path/to/project/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/path/to/project/storage/logs/worker.log
stopwaitsecs=3600
```

```bash
# Start supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start eventhub-worker:*
```

**Checklist:**
- [ ] Queue worker running via supervisor
- [ ] Worker auto-restarts on failure
- [ ] Worker logs to `storage/logs/worker.log`
- [ ] Queue processes jobs without errors

---

### Cron Jobs

**Setup Laravel Scheduler:**
```bash
# Edit crontab
crontab -e

# Add this line:
* * * * * cd /path/to/project && php artisan schedule:run >> /dev/null 2>&1
```

**Verify Scheduler:**
```bash
# Check scheduled tasks
php artisan schedule:list

# Should show:
# 0 * * * * expire-pending-transactions ........ Next Due: X minutes from now
```

**Checklist:**
- [ ] Cron job configured for Laravel scheduler
- [ ] Transaction expiration job runs every minute
- [ ] Scheduler logs to `storage/logs/laravel.log`

---

### File Permissions

**Set Correct Permissions:**
```bash
# Storage and cache directories
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache

# Verify
ls -la storage
# Should show: drwxrwxr-x www-data www-data
```

**Checklist:**
- [ ] `storage/` writable by web server
- [ ] `bootstrap/cache/` writable by web server
- [ ] Certificate upload directory exists and writable

---

### Backups

**Database Backup:**
```bash
# Setup automated backup script
sudo nano /usr/local/bin/backup-eventhub.sh
```

**Backup Script:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/eventhub"
DB_NAME="eventhub_production"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u root -p $DB_NAME | gzip > $BACKUP_DIR/eventhub_$DATE.sql.gz

# Backup files
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /path/to/project/storage

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-eventhub.sh

# Add to crontab (daily at 2 AM)
0 2 * * * /usr/local/bin/backup-eventhub.sh >> /var/log/eventhub-backup.log 2>&1
```

**Checklist:**
- [ ] Database backup script configured
- [ ] Backups run daily
- [ ] Backup retention policy set (7 days)
- [ ] Backup restoration tested

---

## Graduation Day Preparation

### 7 Days Before Graduation

**Final Code Freeze:**
- [ ] All critical fixes deployed
- [ ] All features tested
- [ ] No more code changes (emergency only)
- [ ] Final backup created

**Communication:**
- [ ] Inform all Panitia about system
- [ ] Provide QR scanning training
- [ ] Share emergency contact info
- [ ] Print troubleshooting guide

---

### 3 Days Before Graduation

**Load Testing:**
- [ ] Simulate 200+ concurrent users
- [ ] Test QR scanning with multiple Panitia
- [ ] Verify payment webhook handling
- [ ] Check email notification delivery

**Infrastructure:**
- [ ] Server resources adequate (CPU, RAM, disk)
- [ ] Database connections sufficient
- [ ] Queue worker processing fast enough
- [ ] Monitoring alerts configured

---

### 1 Day Before Graduation

**Final Checks:**
- [ ] All services running (web, queue, scheduler)
- [ ] Database backup completed
- [ ] Error logs clear (no warnings/errors)
- [ ] Payment gateway in production mode
- [ ] Test QR scanning end-to-end
- [ ] Verify event details correct (time, venue, capacity)

**On-Call Preparation:**
- [ ] Laptop with SSH access ready
- [ ] Phone fully charged
- [ ] Database access credentials available
- [ ] Rollback procedure documented

---

### Graduation Day Morning

**Pre-Event Checklist:**
- [ ] Verify website accessible
- [ ] Check all services running
- [ ] Test QR code scanning
- [ ] Monitor error logs (should be clean)
- [ ] Verify Panitia accounts active
- [ ] Check database connections
- [ ] Queue processing normally

**Monitoring During Event:**
```bash
# Watch logs in real-time
tail -f storage/logs/laravel.log

# Monitor queue
watch -n 5 'php artisan queue:work --once'

# Check for errors
grep "ERROR\|CRITICAL" storage/logs/laravel.log
```

---

## Rollback Plan

### If Critical Issues Arise

**Scenario 1: Application Error (500s)**
```bash
# 1. Check error logs
tail -100 storage/logs/laravel.log

# 2. Revert to last working version
git revert HEAD
git push

# 3. Redeploy
php artisan down  # Maintenance mode
git pull
composer install --no-dev
npm run build
php artisan config:cache
php artisan route:cache
php artisan up
```

**Scenario 2: Database Issue**
```bash
# Restore from backup
gunzip < /var/backups/eventhub/eventhub_YYYYMMDD.sql.gz | mysql -u root -p eventhub_production
```

**Scenario 3: Queue Worker Stopped**
```bash
# Restart supervisor
sudo supervisorctl restart eventhub-worker:*

# Verify running
sudo supervisorctl status
```

**Scenario 4: Payment Webhook Not Working**
```bash
# Check webhook logs
grep "midtrans" storage/logs/laravel.log

# Manually process pending transactions
php artisan tinker
>>> Transaction::where('status', 'pending')->get();
# Review and manually update if needed
```

---

## Emergency Contacts

**Development Team:**
- Your Name: +62-xxx-xxx-xxxx
- Backup Developer: +62-xxx-xxx-xxxx

**Infrastructure:**
- Server Admin: +62-xxx-xxx-xxxx
- Database Admin: +62-xxx-xxx-xxxx

**Third-Party Services:**
- Midtrans Support: support@midtrans.com
- Server Provider: support@provider.com

---

## Post-Graduation Review

**After Event Completion:**
- [ ] Review error logs for issues
- [ ] Document any problems encountered
- [ ] Gather user feedback
- [ ] Create report of system performance
- [ ] Plan post-launch improvements

**Metrics to Collect:**
- Total registrations processed
- Total payments collected
- Total QR scans performed
- Peak concurrent users
- Average response time
- Error rate
- Payment success rate

---

## Summary

### Critical Must-Haves

**7 Days Before:**
- [ ] All critical fixes deployed and tested
- [ ] Load testing completed (200+ users)
- [ ] Backups configured and tested
- [ ] Panitia trained on QR scanning

**3 Days Before:**
- [ ] Final code freeze (no changes)
- [ ] All services monitored and stable
- [ ] Emergency procedures documented

**1 Day Before:**
- [ ] Final end-to-end test
- [ ] All event details verified
- [ ] On-call team ready

**Graduation Day:**
- [ ] Monitor logs continuously
- [ ] Be ready for immediate response
- [ ] Have rollback plan accessible

---

**Last Updated:** November 4, 2025
**Graduation Day:** [Fill in date - 39 days from now]
**Final Review:** [7 days before graduation]
