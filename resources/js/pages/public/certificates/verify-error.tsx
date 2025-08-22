import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Home, FileQuestion, Ban, Clock, AlertCircle, ShieldOff } from 'lucide-react';

// --- Prop Interfaces ---
interface VerifyErrorProps {
    error?: {
        message?: string;
        code?: string | number;
        type?: string;
    };
    uuid?: string;
}

// --- Helper for Dynamic Error UI ---
const getErrorPresentation = (error?: VerifyErrorProps['error']) => {
    const defaultError = {
        Icon: FileQuestion,
        title: 'Certificate Not Found',
        message: 'The certificate you are trying to verify could not be found in our records. Please check the ID and try again.',
        color: 'text-red-500',
    };

    if (!error) return defaultError;

    switch (error.code || error.type) {
        case 403:
        case 'invalid_signature':
            return {
                Icon: ShieldOff,
                title: 'Invalid Signature',
                message: 'This verification link may be incorrect, tampered with, or expired. Please use the original link provided.',
                color: 'text-red-500',
            };
        case 404:
        case 'not_found':
            return defaultError;
        case 'expired':
            return {
                Icon: Clock,
                title: 'Link Expired',
                message: 'For security reasons, verification links have a limited lifespan. Please request a new link from the certificate issuer.',
                color: 'text-yellow-600',
            };
        case 'revoked':
            return {
                Icon: Ban,
                title: 'Certificate Revoked',
                message: 'This certificate has been officially revoked by the issuing organization and is no longer valid.',
                color: 'text-red-500',
            };
        default:
            return {
                Icon: AlertCircle,
                title: 'Verification Failed',
                message: error.message || 'An unexpected error occurred. Please try again later or contact support.',
                color: 'text-red-500',
            };
    }
};

export default function VerifyError({ error, uuid }: VerifyErrorProps) {
    const { Icon, title, message, color } = getErrorPresentation(error);

    return (
        <>
            <Head title={`Error: ${title}`} />

            <div className="min-h-screen bg-gray-50 font-sans flex items-center justify-center px-4 py-12">
                <main className="w-full max-w-lg">
                    {/* --- Main Error Card --- */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm text-center p-8 md:p-10">
                        {/* --- Icon --- */}
                        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 ${color}`}>
                            <Icon className="h-8 w-8" />
                        </div>

                        {/* --- Title & Message --- */}
                        <h1 className="mt-6 text-2xl font-semibold text-gray-900">{title}</h1>
                        <p className="mt-2 text-gray-600">{message}</p>

                        {/* --- Debug Info (if available) --- */}
                        {(uuid || error?.code) && (
                            <div className="mt-6 text-left bg-gray-50 rounded-md p-4 text-sm">
                                <dl className="space-y-2">
                                    {uuid && (
                                        <div>
                                            <dt className="font-medium text-gray-500">Certificate ID</dt>
                                            <dd className="font-mono text-gray-700 break-words">{uuid}</dd>
                                        </div>
                                    )}
                                    {error?.code && (
                                        <div>
                                            <dt className="font-medium text-gray-500">Error Code</dt>
                                            <dd className="font-mono text-gray-700">{error.code}</dd>
                                        </div>
                                    )}
                                </dl>
                            </div>
                        )}

                        <hr className="my-8" />

                        {/* --- Help & Actions --- */}
                        <div className="text-left space-y-4">
                            <h2 className="font-medium text-gray-800">What to do next?</h2>
                            <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                                <li>Double-check you are using the correct, unmodified link.</li>
                                <li>Contact the certificate issuer for assistance.</li>
                                <li>If the link has expired, request a new one.</li>
                            </ul>
                        </div>

                        <div className="mt-8 flex flex-col sm:flex-row-reverse gap-3">
                            <Link
                                href="/"
                                className="inline-flex w-full justify-center items-center gap-2 rounded-md bg-gray-800 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                            >
                                <Home className="h-4 w-4" />
                                Go to Homepage
                            </Link>
                            <button
                                onClick={() => window.history.back()}
                                className="inline-flex w-full justify-center items-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Go Back
                            </button>
                        </div>
                    </div>

                    {/* --- Footer --- */}
                    <footer className="mt-6 text-center text-xs text-gray-500">
                        <p>
                            Verification attempt: {new Date().toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' })}
                        </p>
                    </footer>
                </main>
            </div>
        </>
    );
}
