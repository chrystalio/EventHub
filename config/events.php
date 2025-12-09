<?php

return [

    /*
    |--------------------------------------------------------------------------
    | QR Code Scanning Window Settings
    |--------------------------------------------------------------------------
    |
    | These values define the default scanning window for QR code check-ins.
    | Events can override these values individually, but these serve as
    | system-wide defaults.
    |
    | - default_window_before_minutes: How many minutes before event start
    |   that scanning becomes active (default: 120 minutes / 2 hours)
    |
    | - default_window_after_minutes: How many minutes after event start
    |   that scanning remains active (default: 60 minutes / 1 hour)
    |
    | - max_window_hours: Maximum allowed scanning window in hours to
    |   prevent unreasonable values (default: 24 hours)
    |
    */

    'scanning' => [
        'default_window_before_minutes' => env('SCAN_WINDOW_BEFORE', 120),
        'default_window_after_minutes' => env('SCAN_WINDOW_AFTER', 60),
        'max_window_hours' => 24,
    ],

];
