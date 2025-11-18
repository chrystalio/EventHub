<!DOCTYPE html>
<html lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Event Ticket - {{ $attendee->name }}</title>
    <style>
        @page {
            margin: 20mm;
            size: A4 portrait;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            background: #ffffff;
            color: #0f172a;
            line-height: 1.4;
            padding: 20px 0;
        }

        .ticket-container {
            width: 100%;
            max-width: 480px;
            margin: 0 auto;
            background: white;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
        }

        /* Top accent bar - DomPDF doesn't support gradients well, use solid color */
        .accent-bar {
            height: 6px;
            background: #3b82f6;
        }

        /* Header Section */
        .header {
            padding: 25px 30px 20px;
            text-align: center;
            border-bottom: 1px solid #e2e8f0;
        }

        .ticket-type {
            display: inline-block;
            background: #dbeafe;
            color: #1e40af;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 6px 12px;
            border-radius: 4px;
            margin-bottom: 12px;
        }

        .event-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 8px;
            line-height: 1.3;
        }

        .attendee-name {
            font-size: 14px;
            font-weight: 600;
            color: #64748b;
        }

        /* QR Code Section */
        .qr-section {
            padding: 25px 30px;
            text-align: center;
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
        }

        .qr-container {
            background: white;
            display: inline-block;
            padding: 12px;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
        }

        .qr-image {
            display: block;
            width: 250px;
            height: 250px;
        }

        .qr-label {
            margin-top: 12px;
            font-size: 10px;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* Info Section */
        .info-section {
            padding: 20px 30px;
        }

        .info-row {
            width: 100%;
            padding: 12px 0;
            border-bottom: 1px solid #f1f5f9;
        }

        .info-row:last-child {
            border-bottom: none;
        }

        .info-label {
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #94a3b8;
            margin-bottom: 4px;
        }

        .info-value {
            font-size: 13px;
            font-weight: 600;
            line-height: 1.4;
            color: #0f172a;
        }

        .info-value-sub {
            font-size: 12px;
            font-weight: normal;
            color: #64748b;
            margin-top: 2px;
        }

        /* Important Notice */
        .notice-box {
            margin-top: 15px;
            padding: 12px;
            background: #fef9c3;
            border-left: 3px solid #eab308;
            border-radius: 3px;
        }

        .notice-text {
            font-size: 9px;
            color: #854d0e;
            line-height: 1.5;
        }

        .notice-text strong {
            font-weight: bold;
        }

        /* Footer */
        .footer {
            padding: 15px 30px;
            text-align: center;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
        }

        .footer-logo {
            font-size: 10px;
            font-weight: bold;
            color: #3b82f6;
            letter-spacing: 1px;
            margin-bottom: 8px;
        }

        .divider {
            width: 40px;
            height: 1px;
            background: #cbd5e1;
            margin: 8px auto;
        }

        .footer-text {
            font-size: 8px;
            color: #94a3b8;
        }
    </style>
</head>
<body>

<div class="ticket-container">

    <div class="accent-bar"></div>

    <div class="header">
        <div class="ticket-type">{{ strtoupper($attendee->attendee_type) }} Ticket</div>
        <div class="event-title">{{ $event->name }}</div>
        <div class="attendee-name">{{ $attendee->name }}</div>
    </div>

    <div class="qr-section">
        <div class="qr-container">
            <img src="{{ $qrCodeDataUri }}" alt="QR Code" class="qr-image">
        </div>
        <div class="qr-label">Your Check-in Code</div>
    </div>

    <div class="info-section">
        <div class="info-row">
            <div class="info-label">Date & Time</div>
            <div class="info-value">
                {{ \Carbon\Carbon::parse($event->start_time)->format('l, F j, Y') }}
                <div class="info-value-sub">
                    {{ \Carbon\Carbon::parse($event->start_time)->format('g:i A') }}
                    @if($event->end_time)
                        – {{ \Carbon\Carbon::parse($event->end_time)->format('g:i A') }}
                    @endif
                </div>
            </div>
        </div>

        @if($event->building && $event->room)
            <div class="info-row">
                <div class="info-label">Venue</div>
                <div class="info-value">
                    {{ $event->building->name }}
                    <div class="info-value-sub">{{ $event->room->name }}</div>
                </div>
            </div>
        @endif

        <div class="info-row">
            <div class="info-label">Attendee Info</div>
            <div class="info-value">
                {{ ucfirst($attendee->attendee_type) }}
                @if($attendee->phone)
                    <div class="info-value-sub">{{ $attendee->phone }}</div>
                @endif
            </div>
        </div>

        <div class="notice-box">
            <div class="notice-text">
                <strong>Important:</strong> Please have this QR code ready for check-in. This code is for one-time use only, and we kindly ask that you arrive 15 minutes early.
            </div>
        </div>
    </div>

    <div class="footer">
        <div class="footer-logo">EVENTHUB</div>
        <div class="divider"></div>
        <div class="footer-text">
            Generated {{ now()->format('M j, Y') }} • Official Event Ticket
        </div>
    </div>

</div>

</body>
</html>
