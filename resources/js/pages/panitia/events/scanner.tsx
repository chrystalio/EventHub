import React, { useEffect, useState, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import axios from 'axios';
import { CheckCircle2, XCircle, ScanLine, ArrowLeft } from 'lucide-react';
import { Event } from '@/types';
import { Button } from '@/components/ui/button';

interface Props {
    event: Event;
}

const ResultOverlay = ({ result }) => {
    if (!result) return null;
    const isSuccess = result.status === 'success';
    const isError = result.status === 'error';
    const isLoading = result.status === 'loading';
    const bgColor = isSuccess ? 'bg-green-500/90' : isError ? 'bg-red-500/90' : 'bg-black/80';

    return (
        <div className={`absolute inset-0 z-30 flex flex-col items-center justify-center p-4 text-center text-white backdrop-blur-sm rounded-lg`}>
            {isSuccess && <CheckCircle2 className="h-24 w-24" />}
            {isError && <XCircle className="h-24 w-24" />}
            {isLoading && <ScanLine className="h-24 w-24 animate-pulse" />}
            <p className="mt-4 text-2xl font-bold">{result.message}</p>
            {result.attendee && <p className="text-xl">{result.attendee}</p>}
        </div>
    );
};

const scannerAnimation = `
    @keyframes scanner-line-anim {
        0%, 100% { top: 10%; }
        50% { top: 90%; }
    }
    .scanner-line {
        display: block;
        position: absolute;
        left: 10%;
        width: 80%;
        height: 3px;
        background-color: #3b82f6;
        box-shadow: 0 0 10px #3b82f6;
        border-radius: 9999px;
        animation: scanner-line-anim 2.5s ease-in-out infinite;
    }
`;

export default function Scanner({ event }: Props) {
    const [scanResult, setScanResult] = useState<any>(null);
    const html5QrcodeRef = useRef<Html5Qrcode | null>(null);

    const resetScanner = () => {
        setScanResult(null);
        if (html5QrcodeRef.current?.getState() === Html5QrcodeScannerState.PAUSED) {
            html5QrcodeRef.current.resume();
        }
    };

    useEffect(() => {
        const html5QrcodeScanner = new Html5Qrcode("qr-code-reader-container");
        html5QrcodeRef.current = html5QrcodeScanner;

        const onScanSuccess = (decodedText: string) => {
            html5QrcodeScanner.pause();
            setScanResult({ status: 'loading', message: 'Verifying...' });

            axios.post(decodedText, {
                event_uuid: event.uuid,
            })
                .then(response => setScanResult(response.data))
                .catch(error => setScanResult(error.response?.data || { status: 'error', message: 'Invalid QR Code' }));
        };

        const config = {
            fps: 10,
            qrbox: { width: 300, height: 300 },
            videoConstraints: {
                zoom: 1.0
            }
        };

        html5QrcodeScanner.start(
            { facingMode: "environment" },
            config,
            onScanSuccess,
            (errorMessage) => { /* Ignore errors */ }
        ).catch(err => console.error("Unable to start scanning.", err));

        return () => {
            if (html5QrcodeRef.current?.isScanning) {
                html5QrcodeRef.current.stop().catch(err => console.error("Failed to stop scanner cleanly.", err));
            }
        };
    }, []);

    useEffect(() => {
        if (scanResult && (scanResult.status === 'success' || scanResult.status === 'error')) {
            const timer = setTimeout(() => {
                resetScanner();
            }, 1500);

            return () => clearTimeout(timer);
        }
    }, [scanResult]);

    return (
        <div className="min-h-dvh w-screen bg-black text-white flex flex-col items-center justify-center p-4">
            <Head title={`Scan Tickets - ${event.name}`}>
                <style>{scannerAnimation}</style>
            </Head>

            <header className="w-full max-w-md mb-4">
                <Button variant="ghost" size="sm" asChild className="text-white hover:bg-white/10 hover:text-white">
                    <Link href={route('panitia.events.index')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
            </header>
            
            <div className="relative w-full max-w-md aspect-square bg-gray-900 rounded-lg overflow-hidden shadow-2xl border-2 border-gray-700">
                <div id="qr-code-reader-container" className="w-full h-full"></div>

                {!scanResult && (
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="relative w-full h-full">
                            <div className="scanner-line"></div>
                        </div>
                    </div>
                )}

                <ResultOverlay result={scanResult} />
            </div>

            <footer className="w-full max-w-sm mt-4 text-center">
                <h1 className="text-lg font-bold">{event.name}</h1>
                <p className="text-sm text-gray-300">Point QR Code at the camera</p>
            </footer>
        </div>
    );
}
