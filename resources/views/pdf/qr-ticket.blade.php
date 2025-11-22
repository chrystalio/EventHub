<!DOCTYPE html>
<html lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Event Ticket - {{ $attendee->name }}</title>
    <style>
        @page {
            margin: 0;
            size: 105mm 180mm;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            background: #ffffff;
            color: #0f172a;
            width: 100%;
            height: 100%;
        }

        /* Header */
        .header {
            background: #1e293b;
            color: white;
            padding: 15px 20px;
            border-bottom: 4px solid #3b82f6;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
        }

        .header-table td {
            vertical-align: middle;
        }

        .event-label {
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #94a3b8;
            margin-bottom: 2px;
            font-weight: bold;
        }

        .event-name {
            font-size: 16px;
            font-weight: bold;
            line-height: 1.2;
            text-align: left;
        }

        .ticket-type {
            display: inline-block;
            background: rgba(255, 255, 255, 0.15);
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            text-align: right;
        }

        /* QR Section */
        .qr-section {
            padding: 15px 20px;
            text-align: center;
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
        }

        .qr-box {
            display: inline-block;
            padding: 8px;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .qr-image {
            width: 220px;
            height: 220px;
            display: block;
        }

        .scan-hint {
            margin-top: 8px;
            font-size: 10px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* Info Section Grid */
        .info-section {
            padding: 0;
        }

        .info-table {
            width: 100%;
            border-collapse: collapse;
        }

        .info-table td {
            padding: 12px 20px;
            vertical-align: top;
        }

        .info-table tr:last-child td {
            border-bottom: none;
        }

        .border-right {
            border-right: 1px solid #e2e8f0;
        }

        .label {
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #94a3b8;
            margin-bottom: 3px;
            font-weight: bold;
        }

        .value {
            font-size: 14px;
            font-weight: bold;
            color: #0f172a;
            line-height: 1.3;
        }

        .sub-value {
            font-size: 10px;
            color: #64748b;
            font-weight: normal;
            margin-top: 1px;
        }

        /* Policy Section */
        .policy-section {
            padding: 15px 20px 30px 20px;
            border-top: 1px solid #e2e8f0;
        }

        .policy-title {
            font-size: 9px;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 5px;
            text-transform: uppercase;
        }

        .policy-list {
            font-size: 8px;
            color: #64748b;
            line-height: 1.4;
            padding-left: 12px;
            margin: 0;
        }

        .policy-list li {
            margin-bottom: 2px;
        }

        /* Footer */
        .footer {
            background: #1e293b;
            padding: 8px;
            text-align: center;
            font-size: 7px;
            color: #94a3b8;
            position: fixed;
            bottom: 0;
            width: 100%;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
        }

    </style>
</head>
<body>

<!-- Header -->
<div class="header">
    <table class="header-table">
        <tr>
            <td style="text-align: left;">
                <div class="event-label">Event</div>
                <div class="event-name">{{ $event->name }}</div>
            </td>
            <td style="text-align: right;">
                <div class="ticket-type">{{ strtoupper($attendee->attendee_type) }}</div>
            </td>
        </tr>
    </table>
</div>

<!-- QR Code -->
<div class="qr-section">
    <div class="qr-box">
        <img src="{{ $qrCodeDataUri }}" alt="QR Code" class="qr-image">
    </div>
    <div class="scan-hint">Scan at Entrance</div>
</div>

<!-- Info Grid -->
<div class="info-section">
    <table class="info-table">
        <tr>
            <td colspan="2">
                <div class="label">Attendee</div>
                <div class="value">{{ $attendee->name }}</div>
                @if($attendee->phone_number)
                    <div class="sub-value">{{ $attendee->phone_number }}</div>
                @endif
            </td>
        </tr>
        <tr>
            <td style="width: 50%;" class="border-right">
                <div class="label">Date</div>
                <div class="value">{{ \Carbon\Carbon::parse($event->start_time)->format('l, d F Y') }}</div>
            </td>
            <td style="width: 50%;">
                <div class="label">Time</div>
                <div class="value">{{ \Carbon\Carbon::parse($event->start_time)->format('H:i') }}</div>
                @if($event->end_time)
                    <div class="sub-value">Until {{ \Carbon\Carbon::parse($event->end_time)->format('H:i') }}</div>
                @endif
            </td>
        </tr>
        @if($event->building && $event->room)
        <tr>
            <td colspan="2">
                <div class="label">Location</div>
                <div class="value">{{ $event->building->name }}</div>
                <div class="sub-value">{{ $event->room->name }}</div>
            </td>
        </tr>
        @endif
    </table>
</div>

<!-- Policy Section -->
<div class="policy-section">
    <div class="policy-title">Important Notice</div>
    <ul class="policy-list">
        <li>Valid for one-time entry only.</li>
        <li>Please arrive 15 minutes prior to the event.</li>
        <li>Present QR code at entrance for scanning.</li>
    </ul>
</div>

<!-- Footer -->
<div class="footer">
    Powered by EventHub &bull; Crafted by Chrystalio &copy; {{ \Carbon\Carbon::now()->format('Y') }}
</div>

</body>
</html>
