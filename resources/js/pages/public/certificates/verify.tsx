import React from 'react';
import { Head } from '@inertiajs/react';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, BadgeCheck } from 'lucide-react';
interface CertificateData {
    number: string;
    status: string;
    issued_at: string;
    short_hash: string;
}

interface AttendeeData {
    name: string;
}

interface EventData {
    name: string;
    start_time: string;
    organizer: string;
}

interface VerifyProps {
    certificate: CertificateData;
    attendee: AttendeeData;
    event: EventData;
}

const getStatusInfo = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
        case 'active':
        case 'valid':
            return {
                Icon: CheckCircle2,
                label: 'Valid',
                badgeTextColor: 'text-green-700',
                badgeBgColor: 'bg-green-100',
            };
        case 'revoked':
        case 'invalid':
            return {
                Icon: XCircle,
                label: 'Revoked',
                badgeTextColor: 'text-red-700',
                badgeBgColor: 'bg-red-100',
            };
        default:
            return {
                Icon: AlertTriangle,
                label: 'Pending Verification',
                badgeTextColor: 'text-yellow-700',
                badgeBgColor: 'bg-yellow-100',
            };
    }
};
const DataPoint = ({ label, value, isMono = false }: { label: string; value: string; isMono?: boolean }) => (
    <div>
        <dt className="text-xs text-gray-500 uppercase tracking-wider">{label}</dt>
        <dd className={`mt-1 text-base text-gray-900 ${isMono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
);


export default function Verify({ certificate, attendee, event }: VerifyProps) {
    const statusInfo = getStatusInfo(certificate.status);

    return (
        <>
            <Head title={`Certificate: ${statusInfo.label}`} />
            <div className="min-h-screen bg-gray-50 font-sans">
                <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
                    <main className="max-w-2xl mx-auto">
                        <div className="flex items-center gap-4 mb-8">
                            <ShieldCheck className="h-10 w-10 text-gray-400" />
                            <div>
                                <h1 className="text-2xl font-semibold text-gray-900">Certificate Verification</h1>
                                <p className="text-gray-600">This document's authenticity has been confirmed.</p>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-8 space-y-8">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">{attendee.name}</h2>
                                    <p className="text-gray-600">has been awarded this certificate.</p>
                                </div>
                                <div
                                    className={`mt-4 sm:mt-0 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${statusInfo.badgeBgColor} ${statusInfo.badgeTextColor}`}>
                                    <statusInfo.Icon className="h-4 w-4" />
                                    <span>{statusInfo.label}</span>
                                </div>
                            </div>
                            <hr />
                            <div className="space-y-6">
                                <h3 className="text-sm font-medium text-gray-500">Issued for successful participation
                                    in</h3>
                                <p className="text-xl font-semibold text-gray-900 -mt-4">{event.name}</p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 pt-2">
                                    <DataPoint label="Organizer" value={event.organizer} />
                                    <DataPoint label="Event Date" value={event.start_time} />
                                </div>
                            </div>
                            <hr />
                            <div className="space-y-6">
                                <h3 className="text-sm font-medium text-gray-500">Credential Information</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                                    <DataPoint label="Issued On" value={certificate.issued_at} />
                                    <DataPoint label="Certificate Number" value={certificate.number} isMono />
                                </div>
                            </div>
                            <hr />
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-gray-500">Digitally Signed & Verified By</h3>
                                <div className="flex items-start gap-4 pt-2">
                                    <div className="flex-shrink-0">
                                        <BadgeCheck className="h-10 w-10 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Dr. Eng Ansarullah Lawi</p>
                                        <p className="text-sm text-gray-600">
                                            Vice Rector 1 For Academic Affairs, Student Affairs, and Alumni of ITEBA
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <footer className="mt-8 text-center text-sm text-gray-500">
                            <p>
                                Verification Hash: <span className="font-mono">{certificate.short_hash}</span>
                            </p>
                            <p className="mt-1">
                                Verified on {new Date().toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                            </p>
                        </footer>
                    </main>
                </div>
            </div>
        </>
    );
}
