import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Registration } from '@/types';
import { ArrowLeftIcon, CalendarIcon, MapPinIcon, UsersIcon, ClockIcon, AlertCircleIcon } from 'lucide-react';
import { formatDateTime } from '@/utils/dateUtils';
import { Badge } from '@/components/ui/badge';
import { QRCodeSVG } from 'qrcode.react';

interface Props {
    registration: Registration;
}

const StatusInfo = ({ status }) => {
    if (status === 'pending') {
        return (
            <div className="p-6 text-center">
                <ClockIcon className="mx-auto h-12 w-12 text-yellow-500" />
                <h3 className="mt-2 text-lg font-semibold text-gray-900">Registration Pending</h3>
                <p className="mt-1 text-sm text-gray-600">
                    Your registration is awaiting approval. Your ticket will be available here once confirmed.
                </p>
            </div>
        );
    }

    return (
        <div className="p-6 text-center">
            <AlertCircleIcon className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-2 text-lg font-semibold text-gray-900">Registration Issue</h3>
            <p className="mt-1 text-sm text-gray-600">
                There is an issue with this registration. Please contact the event organizer.
            </p>
        </div>
    );
};


export default function RegistrationShow({ registration }: Props) {
    const { event, attendees, status } = registration;

    return (
        <AppLayout>
            <Head title={`Details for ${event.name}`} />

            <div className="space-y-6 px-4 py-8 lg:px-14">
                <div className="mb-6">
                    <Link
                        href={route('registrations.index')}
                        className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                        Back to My Registrations
                    </Link>
                </div>

                <div className="space-y-8">
                    <div className="bg-white border rounded-lg shadow-sm p-6">
                        <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
                        <p className="mt-1 text-gray-600">Organized by {event.organizer}</p>
                        <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-3">
                                <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <span>{formatDateTime(event.start_time)}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <MapPinIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <span>{event.building.name} - {event.room.name}</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white border rounded-lg shadow-sm">
                        <div className="p-6 border-b">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                <UsersIcon className="h-5 w-5 mr-3 text-gray-500" />
                                Your Ticket & Attendees
                            </h2>
                        </div>
                        {status === 'approved' ? (
                            <div className="divide-y">
                                {attendees?.map((attendee) => (
                                    <div key={attendee.id} className="p-4 sm:p-6">
                                        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                                            <div className="bg-white p-2 rounded-lg shadow-md">
                                                <QRCodeSVG value={attendee.signed_url || ''} size={250} />
                                            </div>

                                            <div className="flex-grow text-center sm:text-left">
                                                <Badge variant={attendee.attendee_type === 'user' ? 'default' : 'secondary'}
                                                       className="capitalize">
                                                    {attendee.attendee_type === 'user' ? 'Registrant' : 'Guest'}
                                                </Badge>
                                                <p className="font-bold text-2xl text-gray-900 mt-2">{attendee.name}</p>
                                                {attendee.phone && (
                                                    <p className="text-base text-gray-500">{attendee.phone}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <StatusInfo status={status} />
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
