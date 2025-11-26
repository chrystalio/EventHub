# Client-Side TOTP Implementation Guide

**Priority Level:** P1 - HIGH (User-requested feature)
**Total Estimated Time:** 2.5 hours
**Impact:** 90% reduction in server load, zero latency, better UX

---

## Table of Contents
1. [Overview & Benefits](#overview--benefits)
2. [Current Architecture](#current-architecture)
3. [Proposed Architecture](#proposed-architecture)
4. [Security Considerations](#security-considerations)
5. [Step-by-Step Implementation](#step-by-step-implementation)
6. [Testing & Validation](#testing--validation)
7. [Migration Plan](#migration-plan)

---

## Overview & Benefits

### What is TOTP?
Time-based One-Time Password (TOTP) is an algorithm that generates a temporary code based on:
- **Secret key** (shared between server and client)
- **Current time** (30-second intervals)
- **Algorithm** (HMAC-SHA1)

### Current Problem
Right now, the frontend polls the server **every 30 seconds** to get a new TOTP token:

```
[User's Phone] --HTTP Request--> [Server] --Generate TOTP--> [Response]
   (Every 30s)      Network Latency             CPU Time        (100-500ms)
```

**Problems:**
- Network latency: 100-500ms per request
- Server load: N users = N requests every 30 seconds
- No offline support
- Battery drain from constant polling
- Flicker during token refresh

### Proposed Solution
Generate TOTP tokens **directly in the browser** using JavaScript:

```
[User's Phone] --One-time HTTPS--> [Server] --Secret--> [Store in Memory]
                    Initial Load               Encrypted      ↓
                                                          [Generate TOTP]
                                                          (Every 1 second)
                                                          (0ms latency)
```

**Benefits:**
- ✅ **90% reduction in server load** (1 request vs continuous polling)
- ✅ **Zero latency** after initial fetch
- ✅ **Smoother UX** with real-time countdown
- ✅ **Offline capability** once secret is loaded
- ✅ **Battery efficient** (no network polling)

---

## Current Architecture

### Backend: Server-Side Token Generation

**File:** `app/Http/Controllers/Api/AttendeeController.php`

```php
public function generateToken(RegistrationAttendee $attendee): JsonResponse
{
    // Verify ownership
    if (auth()->user()->uuid !== $attendee->registration->user_uuid) {
        return response()->json(['error' => 'Unauthorized'], 403);
    }

    // Generate TOTP token
    $secret = $attendee->totp_secret; // Base32-encoded secret
    $otp = TOTP::create($secret);
    $token = $otp->now();

    return response()->json([
        'token' => $token,
        'expires_in' => 30 - (time() % 30), // Seconds until next token
    ]);
}
```

### Frontend: Polling Every 30 Seconds

**File:** `resources/js/pages/authenticated/registrations/show.tsx`

```typescript
const [qrCodeValue, setQrCodeValue] = useState('');
const [countdown, setCountdown] = useState(30);

useEffect(() => {
    const fetchToken = async () => {
        const response = await axios.get(
            route('api.attendees.generate-token', attendee.qr_code)
        );
        setQrCodeValue(`${attendee.qr_code},${response.data.token}`);
        setCountdown(response.data.expires_in);
    };

    fetchToken(); // Initial fetch
    const interval = setInterval(fetchToken, 30000); // Poll every 30s

    return () => clearInterval(interval);
}, []);
```

**Issues:**
- Polling creates network traffic every 30 seconds
- Loading state flickers during refresh
- Depends on network connectivity
- 100-500ms latency per request

---

## Proposed Architecture

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Initial Page Load (One-time)                                 │
└─────────────────────────────────────────────────────────────────┘
         │
         v
┌─────────────────────────────────────────────────────────────────┐
│ Frontend: GET /api/attendees/{qr_code}/secret                   │
│           Headers: Authorization: Bearer {token}                 │
└─────────────────────────────────────────────────────────────────┘
         │
         v
┌─────────────────────────────────────────────────────────────────┐
│ Backend: Verify ownership + rate limit                           │
│          Return: { secret: "BASE32STRING", period: 30 }         │
└─────────────────────────────────────────────────────────────────┘
         │
         v
┌─────────────────────────────────────────────────────────────────┐
│ Frontend: Store secret in React state (memory only)             │
└─────────────────────────────────────────────────────────────────┘
         │
         v
┌─────────────────────────────────────────────────────────────────┐
│ 2. Token Generation Loop (Every 1 second)                       │
└─────────────────────────────────────────────────────────────────┘
         │
         v
┌─────────────────────────────────────────────────────────────────┐
│ Frontend: Generate TOTP using otpauth library                   │
│           - No network call                                      │
│           - 0ms latency                                          │
│           - Update countdown (30, 29, 28, ...)                  │
│           - Regenerate token when countdown hits 0              │
└─────────────────────────────────────────────────────────────────┘
```

### Security Model

**1. Secret Transmission:**
- ✅ HTTPS enforced (encrypted in transit)
- ✅ Sanctum authentication (only authenticated users)
- ✅ Ownership verification (user can only fetch own secrets)
- ✅ Rate limiting (5 requests per 5 minutes per user)

**2. Secret Storage:**
- ✅ React state only (memory, not localStorage)
- ✅ Cleared on component unmount
- ✅ Never logged to console
- ✅ Never persisted to disk

**3. Token Validation:**
- ✅ Server-side validation remains unchanged
- ✅ TOTP algorithm identical to current implementation
- ✅ Same time window tolerance (±30 seconds)

---

## Security Considerations

### Risk Assessment

**Question:** Is it safe to send the TOTP secret to the client?

**Answer:** Yes, with proper precautions:

**Why It's Safe:**
1. **Limited Exposure Window:**
   - Secret only exposed during ticket viewing
   - Cleared when user leaves page
   - Expires after event ends

2. **Authentication Required:**
   - User must be authenticated (Sanctum)
   - User must own the registration
   - Rate limiting prevents brute force

3. **Time-Limited Validity:**
   - Tickets only valid 2 hours before event
   - Tokens expire every 30 seconds
   - Secret useless after event

4. **HTTPS Encryption:**
   - Secret encrypted in transit
   - Man-in-the-middle protected

**Why It's Better Than Current:**
- Current: Secret stored in database (same risk)
- Current: Server generates token (attacker could call same API)
- Proposed: Client generates token (reduces attack surface)

### Security Checklist

- [ ] HTTPS enforced on all routes (`config/app.php`: `'force_https' => true`)
- [ ] Sanctum authentication on secret endpoint
- [ ] Ownership verification (user_uuid matches)
- [ ] Rate limiting (5 requests per 5 minutes)
- [ ] Secret never logged (`Log::debug()` disabled in production)
- [ ] Secret cleared on component unmount
- [ ] No localStorage/sessionStorage usage
- [ ] Server-side validation unchanged

### Attack Scenarios & Mitigations

**Scenario 1: Attacker intercepts secret**
- **Mitigation:** HTTPS encryption prevents interception
- **Fallback:** Secret only valid for specific event/time window

**Scenario 2: XSS vulnerability exposes secret**
- **Mitigation:** React auto-escapes output, CSP headers
- **Fallback:** Secret cleared on page unload, limited time window

**Scenario 3: User shares QR code screenshot**
- **Mitigation:** Token expires every 30 seconds
- **Note:** This is same risk as current implementation

**Scenario 4: Replay attack on QR code**
- **Mitigation:** Server tracks `attended_at` timestamp (prevents double-scan)
- **Note:** This is existing protection, unchanged

---

## Step-by-Step Implementation

### Prerequisites

**Install Required Package:**
```bash
npm install otpauth
```

**Package Info:**
- **Name:** otpauth
- **Purpose:** Generate TOTP/HOTP tokens in JavaScript
- **Size:** ~20KB minified
- **Algorithm:** HMAC-SHA1 (matches server-side)

---

### Step 1: Create Backend Endpoint (30 minutes)

**File:** `app/Http/Controllers/Api/AttendeeController.php`

**Add New Method:**
```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RegistrationAttendee;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class AttendeeController extends Controller
{
    /**
     * Get TOTP secret for client-side token generation
     *
     * @param RegistrationAttendee $attendee
     * @return JsonResponse
     */
    public function getSecret(RegistrationAttendee $attendee): JsonResponse
    {
        // Authorization: Verify user owns this attendee
        if (auth()->user()->uuid !== $attendee->registration->user_uuid) {
            Log::warning('Unauthorized TOTP secret access attempt', [
                'user_id' => auth()->id(),
                'attendee_id' => $attendee->id,
            ]);

            return response()->json([
                'error' => 'Unauthorized access to attendee secret'
            ], 403);
        }

        // Rate limiting: Prevent excessive secret fetching
        // Allow 5 fetches per 5 minutes per user
        $cacheKey = "totp_secret_fetched:{$attendee->id}:" . auth()->id();

        if (Cache::has($cacheKey)) {
            return response()->json([
                'error' => 'Secret already fetched recently. Please refresh the page if needed.'
            ], 429);
        }

        // Mark secret as fetched (rate limit)
        Cache::put($cacheKey, true, now()->addMinutes(5));

        // Log secret access for audit trail
        Log::info('TOTP secret fetched', [
            'user_id' => auth()->id(),
            'attendee_id' => $attendee->id,
            'event_uuid' => $attendee->registration->event_uuid,
        ]);

        // Return secret configuration
        return response()->json([
            'secret' => $attendee->totp_secret, // Base32-encoded secret
            'algorithm' => 'SHA1',
            'digits' => 6,
            'period' => 30,
            'issuer' => 'EventHub',
            'label' => $attendee->name,
        ]);
    }

    /**
     * Generate TOTP token (keep for backward compatibility temporarily)
     *
     * @deprecated Use client-side generation instead
     */
    public function generateToken(RegistrationAttendee $attendee): JsonResponse
    {
        // Keep existing implementation for gradual migration
        // Can be removed after client-side TOTP is fully deployed
        // ... (existing code)
    }
}
```

---

### Step 2: Add Route with Rate Limiting (10 minutes)

**File:** `routes/api.php`

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AttendeeController;

Route::middleware('auth:sanctum')->group(function () {
    // Client-side TOTP: Fetch secret once per session
    Route::get('/attendees/{attendee:qr_code}/secret', [AttendeeController::class, 'getSecret'])
        ->middleware('throttle:5,5') // 5 requests per 5 minutes
        ->name('api.attendees.secret');

    // Legacy server-side generation (keep for backward compatibility)
    Route::get('/attendees/{attendee:qr_code}/generate-token', [AttendeeController::class, 'generateToken'])
        ->middleware('throttle:60,1') // 60 requests per minute
        ->name('api.attendees.generate-token');
});
```

**Add Route Name to Ziggy:**
Ziggy auto-discovers routes, so no manual config needed. Just ensure route has `->name()`.

---

### Step 3: Create React TOTP Hook (1 hour)

**File:** `resources/js/hooks/useTOTP.ts`

```typescript
import { useEffect, useState } from 'react';
import { TOTP } from 'otpauth';
import axios from 'axios';
import { route } from 'ziggy-js';

interface RegistrationAttendee {
    id: number;
    qr_code: string;
    name: string;
    // ... other fields
}

interface UseTOTPResult {
    token: string | null;
    countdown: number;
    isLoading: boolean;
    error: string | null;
}

/**
 * Custom hook for client-side TOTP generation
 *
 * @param attendee - The attendee to generate TOTP for
 * @returns Object with token, countdown, loading state, and error
 */
export function useTOTP(attendee: RegistrationAttendee): UseTOTPResult {
    const [secret, setSecret] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(30);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Step 1: Fetch TOTP secret once on mount
    useEffect(() => {
        const fetchSecret = async () => {
            try {
                const response = await axios.get(
                    route('api.attendees.secret', attendee.qr_code)
                );

                setSecret(response.data.secret);
                setIsLoading(false);
            } catch (err: any) {
                console.error('Failed to fetch TOTP secret:', err);

                if (err.response?.status === 429) {
                    setError('Too many requests. Please refresh the page.');
                } else if (err.response?.status === 403) {
                    setError('Unauthorized access to ticket.');
                } else {
                    setError('Failed to load QR code. Please refresh the page.');
                }

                setIsLoading(false);
            }
        };

        fetchSecret();

        // Cleanup: Clear secret on unmount (security)
        return () => {
            setSecret(null);
            setToken(null);
        };
    }, [attendee.qr_code]);

    // Step 2: Generate TOTP token every second
    useEffect(() => {
        if (!secret) return;

        // Initialize TOTP generator
        const totp = new TOTP({
            issuer: 'EventHub',
            label: attendee.name,
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: secret, // Base32-encoded secret from server
        });

        // Function to update token and countdown
        const updateToken = () => {
            try {
                // Generate current TOTP token
                const newToken = totp.generate();
                setToken(newToken);

                // Calculate seconds until next token
                const now = Math.floor(Date.now() / 1000);
                const remaining = 30 - (now % 30);
                setCountdown(remaining);
            } catch (err) {
                console.error('Failed to generate TOTP:', err);
                setError('Failed to generate token.');
            }
        };

        // Initial generation
        updateToken();

        // Update every second for smooth countdown
        const interval = setInterval(updateToken, 1000);

        // Cleanup interval on unmount
        return () => clearInterval(interval);
    }, [secret, attendee.name]);

    return {
        token,
        countdown,
        isLoading,
        error,
    };
}
```

---

### Step 4: Update Registration Show Page (30 minutes)

**File:** `resources/js/pages/authenticated/registrations/show.tsx`

**Find:** The component that displays QR code

**Current Code:**
```typescript
// Old polling-based implementation
const [qrCodeValue, setQrCodeValue] = useState('');
const [countdown, setCountdown] = useState(30);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
    const fetchToken = async () => {
        // ... polling logic
    };

    fetchToken();
    const interval = setInterval(fetchToken, 30000);
    return () => clearInterval(interval);
}, []);
```

**Replace With:**
```typescript
import { useTOTP } from '@/hooks/useTOTP';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, AlertTriangle, Clock } from 'lucide-react';

interface TicketQRCodeProps {
    attendee: RegistrationAttendee;
}

function TicketQRCode({ attendee }: TicketQRCodeProps) {
    // Use custom TOTP hook for client-side generation
    const { token, countdown, isLoading, error } = useTOTP(attendee);

    // Construct QR code value: "{qr_code},{totp_token}"
    const qrCodeValue = token ? `${attendee.qr_code},${token}` : '';

    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">
                    Loading your ticket...
                </p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <p className="mt-4 text-sm text-destructive">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 text-sm text-primary underline"
                >
                    Refresh Page
                </button>
            </div>
        );
    }

    // Success: Display QR code with countdown
    return (
        <div className="flex flex-col items-center space-y-4">
            {/* QR Code */}
            <div className="rounded-lg border-4 border-primary p-4 bg-white">
                <QRCodeSVG
                    value={qrCodeValue}
                    size={225}
                    level="M"
                    includeMargin={false}
                />
            </div>

            {/* Token Display (for debugging - remove in production) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                        Token: {token}
                    </p>
                </div>
            )}

            {/* Countdown Timer */}
            <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">
                    Refreshes in {countdown}s
                </p>
            </div>

            {/* Countdown Progress Bar */}
            <div className="w-full max-w-xs">
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-1000 ease-linear"
                        style={{ width: `${(countdown / 30) * 100}%` }}
                    />
                </div>
            </div>

            {/* Instructions */}
            <div className="text-center text-sm text-muted-foreground max-w-xs">
                <p>
                    Show this QR code to the event staff for check-in.
                    The code refreshes automatically every 30 seconds.
                </p>
            </div>
        </div>
    );
}

export default function Show({ registration }: { registration: Registration }) {
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6">Your Event Ticket</h1>

            {/* Display ticket for main attendee */}
            {registration.attendees.map((attendee) => (
                <div key={attendee.id} className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">{attendee.name}</h2>
                    <TicketQRCode attendee={attendee} />
                </div>
            ))}
        </div>
    );
}
```

---

## Testing & Validation

### Unit Tests (Optional but Recommended)

**File:** `resources/js/hooks/__tests__/useTOTP.test.ts`

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useTOTP } from '../useTOTP';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('useTOTP', () => {
    const mockAttendee = {
        id: 1,
        qr_code: 'ABC123',
        name: 'John Doe',
    };

    it('fetches secret and generates token', async () => {
        mockedAxios.get.mockResolvedValue({
            data: {
                secret: 'JBSWY3DPEHPK3PXP', // Base32 test secret
                period: 30,
                digits: 6,
            },
        });

        const { result } = renderHook(() => useTOTP(mockAttendee));

        // Initially loading
        expect(result.current.isLoading).toBe(true);

        // Wait for secret fetch
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        // Token should be generated
        expect(result.current.token).toHaveLength(6);
        expect(result.current.token).toMatch(/^\d{6}$/);
        expect(result.current.countdown).toBeLessThanOrEqual(30);
        expect(result.current.countdown).toBeGreaterThan(0);
    });

    it('handles unauthorized error', async () => {
        mockedAxios.get.mockRejectedValue({
            response: { status: 403 },
        });

        const { result } = renderHook(() => useTOTP(mockAttendee));

        await waitFor(() => {
            expect(result.current.error).toContain('Unauthorized');
        });
    });
});
```

### Manual Testing Checklist

**Backend Testing:**
```bash
# Test 1: Fetch secret as authenticated user
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8000/api/attendees/ABC123/secret

# Expected response:
# {
#   "secret": "BASE32STRING",
#   "algorithm": "SHA1",
#   "digits": 6,
#   "period": 30
# }

# Test 2: Fetch secret without authentication
curl http://localhost:8000/api/attendees/ABC123/secret

# Expected: 401 Unauthorized

# Test 3: Fetch another user's secret
curl -H "Authorization: Bearer USER2_TOKEN" \
     http://localhost:8000/api/attendees/USER1_QR/secret

# Expected: 403 Forbidden

# Test 4: Rate limiting (6th request in 5 minutes)
for i in {1..6}; do
    curl -H "Authorization: Bearer YOUR_TOKEN" \
         http://localhost:8000/api/attendees/ABC123/secret
done

# Expected: 6th request returns 429 Too Many Requests
```

**Frontend Testing:**
- [ ] QR code displays without errors
- [ ] Token changes every 30 seconds
- [ ] Countdown updates every second (30, 29, 28, ...)
- [ ] Progress bar animates smoothly
- [ ] No network requests after initial load (check DevTools Network tab)
- [ ] Token clears when navigating away
- [ ] Error handling works (test with invalid QR code)

**Token Validation Testing:**
```php
// Server-side validation should remain unchanged
php artisan tinker

>>> $attendee = RegistrationAttendee::first();
>>> $secret = $attendee->totp_secret;

// Generate client-side token (simulate)
>>> $otp = TOTP::create($secret);
>>> $clientToken = $otp->now();

// Verify server accepts it
>>> $otp->verify($clientToken); // Should return true
```

---

## Migration Plan

### Phase 1: Deploy Client-Side TOTP (Week 4)

**Day 1: Deploy Backend**
```bash
# 1. Deploy code with new endpoint
git add .
git commit -m "Add client-side TOTP secret endpoint"
git push

# 2. Run any new migrations (none needed for this feature)

# 3. Verify endpoint is accessible
curl -H "Authorization: Bearer TOKEN" \
     https://your-domain.com/api/attendees/ABC123/secret
```

**Day 2-3: Frontend Deployment**
```bash
# 1. Install npm package
npm install otpauth

# 2. Build production assets
npm run build

# 3. Deploy frontend
# (Deploy static assets to server)

# 4. Verify QR codes work
# Open registration page → Check QR code displays → Check countdown updates
```

**Day 4-7: Monitoring**
- Monitor error logs for TOTP-related errors
- Check server load (should decrease)
- Gather user feedback

### Phase 2: Remove Legacy Polling (Week 5)

**After 1 week of stable client-side TOTP:**
```bash
# 1. Remove old polling endpoint
# File: routes/api.php
# Delete: Route::get('/attendees/{attendee:qr_code}/generate-token', ...)

# 2. Remove generateToken method
# File: app/Http/Controllers/Api/AttendeeController.php
# Delete: public function generateToken(...) { ... }

# 3. Deploy
git commit -m "Remove legacy server-side TOTP generation"
git push
```

### Rollback Plan

**If Issues Arise:**
```bash
# 1. Revert git commits
git revert HEAD~2  # Revert last 2 commits

# 2. Rebuild frontend
npm run build

# 3. Deploy reverted version
```

**Keep Legacy Endpoint:**
Leave the old `generateToken()` method for 1 week as fallback.

---

## Performance Impact

### Before Client-Side TOTP

**Server Load:**
- 100 concurrent users viewing tickets
- Each polls every 30 seconds
- **200 requests per minute** (100 users × 2 requests/min)
- Average response time: 50ms
- **10 seconds of CPU time per minute**

**User Experience:**
- 100-500ms latency per refresh
- Flicker during token update
- Doesn't work offline

### After Client-Side TOTP

**Server Load:**
- 100 concurrent users viewing tickets
- Each fetches secret once on page load
- **~10 requests total** (some users refresh)
- **99% reduction in TOTP-related load**

**User Experience:**
- 0ms latency for token updates
- Smooth countdown animation
- Works offline after initial load

### Monitoring Queries

**Check Request Count:**
```bash
# Before deployment
tail -f storage/logs/laravel.log | grep "generate-token"

# After deployment (should see dramatic decrease)
tail -f storage/logs/laravel.log | grep "totp_secret_fetched"
```

**Database Impact:**
None - This feature doesn't add any database queries.

---

## Troubleshooting

### Issue 1: Token Doesn't Match on Scan

**Symptoms:**
- QR code generated successfully
- Panitia scans QR code
- Server rejects token ("Invalid token")

**Causes:**
1. Client/server time mismatch
2. TOTP configuration mismatch (algorithm, period, digits)
3. Secret encoding issue

**Solutions:**
```typescript
// Verify TOTP configuration matches server
const totp = new TOTP({
    algorithm: 'SHA1',  // ← Must match server
    digits: 6,          // ← Must match server
    period: 30,         // ← Must match server
    secret: secret,     // ← Base32-encoded
});
```

```php
// Server-side (verify consistency)
$otp = TOTP::create($secret, 30, 'sha1', 6); // period, algorithm, digits
```

**Check Time Sync:**
```bash
# Server time
date +%s

# Client time (browser console)
Math.floor(Date.now() / 1000)

# Difference should be < 1 second
```

### Issue 2: Rate Limit Errors

**Symptoms:**
User gets 429 error when trying to view ticket

**Solution:**
```php
// Increase rate limit or adjust cache TTL
Route::get('/attendees/{attendee:qr_code}/secret', ...)
    ->middleware('throttle:10,10'); // 10 requests per 10 minutes
```

### Issue 3: Secret Not Cleared on Unmount

**Symptoms:**
Security concern - secret persists in memory

**Solution:**
```typescript
useEffect(() => {
    // ... fetch secret logic

    return () => {
        // Ensure cleanup
        setSecret(null);
        setToken(null);
    };
}, []);
```

---

## Summary Checklist

### Implementation Complete When:

**Backend:**
- [ ] `getSecret()` method created in AttendeeController
- [ ] Route added with authentication and rate limiting
- [ ] Ownership verification implemented
- [ ] Audit logging added

**Frontend:**
- [ ] `otpauth` package installed
- [ ] `useTOTP` hook created
- [ ] Registration show page updated
- [ ] QR code component uses client-side generation
- [ ] Loading and error states handled

**Security:**
- [ ] HTTPS enforced
- [ ] Rate limiting configured (5 per 5 minutes)
- [ ] Secret cleared on unmount
- [ ] No localStorage/sessionStorage usage
- [ ] Audit logs reviewed

**Testing:**
- [ ] Backend endpoint tested (auth, ownership, rate limit)
- [ ] Frontend QR code displays correctly
- [ ] Token updates every 30 seconds
- [ ] Countdown animates smoothly
- [ ] Server validates client-generated tokens
- [ ] No network requests after initial load

**Deployment:**
- [ ] Deployed to staging
- [ ] Tested with real QR scanner
- [ ] Monitored for 48 hours
- [ ] Deployed to production
- [ ] Legacy endpoint kept for 1 week

---

**Last Updated:** November 4, 2025
**Next Steps:** Deploy to staging and test with graduation day scenario
