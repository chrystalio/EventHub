# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EventHub is a Laravel-based event management system with a React frontend using Inertia.js. It handles event registration, attendee management, QR code ticketing, payment processing via Midtrans, and certificate generation.

## Tech Stack

- **Backend**: Laravel 12, PHP 8.2+
- **Frontend**: React 19, TypeScript, Inertia.js, TailwindCSS 4
- **Build Tool**: Vite
- **Testing**: Pest PHP
- **Key Packages**:
  - Spatie Laravel Permission (RBAC)
  - Ziggy (Laravel routes in JavaScript)
  - DomPDF & PhpWord (certificate generation)
  - SimpleSoftwareIO QR Code
  - Midtrans Payment Gateway

## Development Commands

### Start Development Environment
```bash
# Start all services (server, queue, logs, vite) concurrently
composer dev

# Alternative: Individual services
php artisan serve           # Development server
php artisan queue:listen    # Queue worker
php artisan pail            # Real-time logs
npm run dev                 # Frontend assets
```

### Testing
```bash
# Run all tests
php artisan test

# Run specific test file
php artisan test tests/Feature/Auth/AuthenticationTest.php

# Run tests with coverage
php artisan test --coverage
```

### Code Quality
```bash
# PHP linting (Laravel Pint)
./vendor/bin/pint

# TypeScript type checking
npm run types

# JavaScript/TypeScript linting
npm run lint

# Format frontend code (Prettier)
npm run format
npm run format:check
```

### Frontend Build
```bash
npm run build              # Production build
npm run build:ssr          # Build with SSR support
```

### Database
```bash
php artisan migrate                    # Run migrations
php artisan migrate:fresh --seed       # Fresh database with seeders
php artisan db:seed                    # Run seeders only
```

## Architecture

### UUID-Based Routing
Most models use UUID-based routing instead of auto-increment IDs. Models override `getRouteKeyName()` to return `'uuid'`. Routes use parameters like `{event:uuid}` to bind by UUID.

**Key Models**: `User`, `Event`, `Registration`, `RegistrationAttendee`

### Permission System
Uses Spatie Laravel Permission for RBAC. Permissions follow the pattern `{resource}.{action}` (e.g., `event.view`, `event.create`). Route middleware: `->middleware('can:permission.name')`.

**Roles**: System Administrator, Akademik, Panitia (event staff)

### Event Management
- **Events** have many **Registrations**
- **Registrations** belong to **Users** and have many **Attendees** (RegistrationAttendee)
- Events use **Buildings** and **Rooms** for venue management
- Event staff are managed via pivot table `event_staff` with roles

### Certificate System
Certificates can be generated for attendees who have attended events (`attended_at` timestamp must be set). Certificate generation typically uses:
1. Custom Word templates (`.docx`) with placeholders (`{participant_name}`, `{event_name}`, etc.)
2. Default HTML/PDF templates using DomPDF

**Flow**:
- Attendee must have attended event (`attended_at` timestamp)
- Certificate generated with unique number format: `{seq}/E-SERT/ITEBA/{month-roman}/{year}`
- QR code verification embedded
- Optional DOCX to PDF conversion via LibreOffice

### Frontend Structure
```
resources/js/
├── app.tsx                  # Inertia app entry point
├── pages/                   # Inertia pages (route components)
│   ├── admin/               # Admin-only pages
│   ├── authenticated/       # Authenticated user pages
│   ├── public/              # Public pages
│   ├── panitia/             # Event staff pages
│   └── auth/                # Authentication pages
├── components/              # Reusable React components
├── hooks/                   # Custom React hooks
├── lib/                     # Utilities
└── types/                   # TypeScript types
```

Pages are lazy-loaded via `resolvePageComponent()` and follow Inertia's file-based routing convention.

### Payment Integration
Midtrans payment gateway integration for paid events. Transaction webhook handling at `/midtrans/webhook`. Configuration in `.env`:
```
MIDTRANS_MERCHANT_ID=
MIDTRANS_CLIENT_KEY=
MIDTRANS_SERVER_KEY=
MIDTRANS_IS_PRODUCTION=false
```

### QR Code Ticketing
Attendees receive QR codes (TOTP-based) for event check-in. Panitia role can scan and verify tickets via `/panitia/events/{event}/scan`.

## Key Conventions

### Models
- All models with UUIDs auto-generate on creation (via `boot()` method)
- Relationships use UUID foreign keys (`user_uuid`, `event_uuid`)
- HasManyThrough relationships bridge Event → Registration → RegistrationAttendee

### Controllers
- Organized by namespace: `Admin\`, `Panitia\`, `Auth\`, `Settings\`
- Return Inertia responses: `Inertia::render('page.name', ['data' => $data])`
- Use FormRequest classes for validation (`StoreEventRequest`, `UpdateEventRequest`)

### Policies
Event management uses `EventPolicy::manage()` to check if user can manage an event (System Administrator, Akademik, or Panitia assigned to event).

### Frontend
- Use `route()` helper (Ziggy) for Laravel route generation in JavaScript
- Inertia shared data available via `usePage()` hook
- Form handling with `react-hook-form` and Zod validation
- UI components from shadcn/ui (Radix UI primitives)

## File Storage
Default disk is `local`. Certificate files stored in `storage/app/certificates/`. Template files in `storage/app/certificate_templates/`.

## Important Notes

- The application uses Ray for debugging (`ray()` function) - visible throughout the codebase
- User impersonation supported via `lab404/laravel-impersonate` package
- Database defaults to SQLite (`:memory:` for testing)
- Queue driver is `database` - run `php artisan queue:listen` for async jobs
