<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Certificate - {{ $name ?? 'Preview' }}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Hind+Madurai:wght@300;400;500;600;700&family=Lora:ital,wght@0,400..700;1,400..700&family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap');

        @page {
            margin: 3mm;
        }

        body {
            font-family: 'Hind Madurai', 'Times New Roman', serif;
            text-align: center;
            margin: 0;
            padding: 3px;
            font-weight: 400;
        }

        .border {
            border: 4px double #d4851f;
            padding: 20px;
            margin: 10px auto;
            border-radius: 8px;
            max-width: 1100px;
            box-sizing: border-box;
        }

        .certificate-logo {
            max-width: 150px;
            height: auto;
            margin: 0 auto 10px;
            display: block;
        }

        h1 {
            font-family: 'Montserrat', 'Arial', sans-serif;
            font-size: 38px;
            color: #001c7e;
            margin: 5px 0;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 3px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }
        .cert-number {
            font-family: 'Montserrat', 'Arial', sans-serif;
            font-size: 12px;
            font-weight: 500;
            /*margin: 14px 0;*/
            margin-top: 10px;
            margin-bottom: 30px;
            color: #666;
            text-decoration: underline;
            padding: 0 15px;
            display: inline-block;
            letter-spacing: 0.5px;
        }

        .name {
            font-family: 'Lora', serif;
            font-size: 34px;
            font-weight: 600;
            font-style: italic;
            color: #d4851f;
            word-wrap: break-word;
            text-shadow: 1px 1px 3px rgba(0,0,0,0.15);
            padding: 0 15px;
            max-width: 450px;       /* Constrain maximum width */
            margin: 0 auto;         /* Center horizontally */
            display: block;         /* Changed from inline-block for better centering */
        }

        .event {
            font-family: 'Hind Madurai', serif;
            font-size: 18px;
            line-height: 1.4;
            font-weight: 400;
            margin-bottom: 15px;  /* Reduced from default 15px */
        }

        .event strong {
            font-family: 'Montserrat', 'Arial', sans-serif;
            font-weight: 600;
            color: #1C352D;
        }

        .organizer-section {
            font-family: 'Hind Madurai', serif;
            font-size: 16px;
            line-height: 1.4;
            font-weight: 400;
            margin: 0px 0 6px 0;
            color: #333;
        }

        .organizer-section .organizer-label {
            font-family: 'Hind Madurai', serif;
            font-size: 16px;
            font-weight: 400;
            color: #555;
        }

        .organizer-section .organizer-name {
            font-family: 'Montserrat', 'Arial', sans-serif;
            font-weight: 600;
            color: #1C352D;
            font-size: 16px;
        }

        .details {
            font-family: 'Hind Madurai', serif;
            font-size: 14px;
            margin: 4px 0;
            color: #555;
            font-weight: 400;
            display: inline-block;
        }

        /*.institution {*/
        /*    font-family: 'Montserrat', 'Arial', sans-serif;*/
        /*    font-size: 14px;*/
        /*    color: #001c7e;*/
        /*    font-weight: 600;*/
        /*    margin: 2px 0;*/
        /*    text-transform: uppercase;*/
        /*    letter-spacing: 2px;*/
        /*}*/

        /*.signatures {*/
        /*    margin-top: 40px;*/
        /*    margin-bottom: 30px;*/
        /*}*/

        /*.sig-box {*/
        /*    display: inline-block;*/
        /*    width: 180px;*/
        /*    text-align: center;*/
        /*    margin: 0 10px;*/
        /*    vertical-align: top;*/
        /*}*/

        /*.sig-line {*/
        /*    border-bottom: 2px solid #333;*/
        /*    height: 60px;*/
        /*    margin-bottom: 8px;*/
        /*}*/

        /*.sig-title {*/
        /*    font-size: 12px;*/
        /*    font-weight: bold;*/
        /*    margin-bottom: 3px;*/
        /*}*/

        /*.sig-name {*/
        /*    font-size: 11px;*/
        /*    color: #666;*/
        /*    font-style: italic;*/
        /*}*/

        .verification-section {
            margin-top: 60px;
        }

        .qr-code {
            margin-top: 40px;
        }

        .verification-info {
            font-size: 14px;
            color: #666;
            margin: 2px;
            line-height: 1.4;
            font-family: 'Hind Madurai', serif;
            font-weight: 400;
        }
    </style>
</head>
<body>
<div class="border">
    @if($logo_base64)
        <img src="{{ $logo_base64 }}" alt="Campus Logo" class="certificate-logo" />
    @else
        <div class="certificate-logo-fallback" style="width: 100px; height: 60px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; border: 1px solid #ccc;">
            <span style="font-size: 12px; color: #666;">ITEBA</span>
        </div>
    @endif
    <h1>Certificate of Participation</h1>
    <div class="cert-number">No. {{ $certificate_number ?? '1/SERT/ITEBA/VIII/2025' }}</div>
    <p>Awarded to</p>
    <div class="name">{{ $name ?? 'Recipient Name' }}</div>

    <div class="event">
        For participating in<br>
        <strong>"{{ $event_name ?? 'Event Name' }}"</strong><br>
    </div>

    <div class="organizer-section">
        <span class="organizer-label">Organized by</span>
        <span class="organizer-name">{{ $organizer ?? 'Organizer Name' }}</span>
    </div>
    <div class="details">
        {{ $venue ?? 'Venue' }} - {{ $date ?? 'Date' }}
    </div>


{{--    <div class="signatures">--}}
{{--        <div class="sig-box">--}}
{{--            <div class="sig-line"></div>--}}
{{--            <div class="sig-title">Dr. Eng Ansarullah Lawi</div>--}}
{{--            <div class="sig-name">Vice Rector I for Academic Affairs, <br>Student Affairs, and Alumni of ITEBA</div>--}}
{{--        </div>--}}
{{--        <div class="sig-box">--}}
{{--            <div class="sig-line"></div>--}}
{{--            <div class="sig-title">Dr. Eng Ansarullah Lawi</div>--}}
{{--            <div class="sig-name">Vice Rector I for Academic Affairs, <br>Student Affairs, and Alumni of ITEBA</div>--}}
{{--        </div>--}}
{{--        <div class="sig-box">--}}
{{--            <div class="sig-line"></div>--}}
{{--            <div class="sig-title">Dr. Eng Ansarullah Lawi</div>--}}
{{--            <div class="sig-name">Vice Rector I for Academic Affairs, <br>Student Affairs, and Alumni of ITEBA</div>--}}
{{--        </div>--}}
{{--    </div>--}}

    <div class="verification-section">
        <div class="qr-code">
            {!! $qr_code ?? '<div style="width: 90px; height: 90px; background: #f8f8f8; border: 2px solid #1a472a; display: inline-block; border-radius: 5px;"></div>' !!}
        </div>
        <div class="verification-info">
            Scan QR code to verify certificate authenticity.
        </div>
    </div>
</div>
</body>
</html>
