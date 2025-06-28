import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Registration } from '@/types';
import { ArrowLeftIcon, CalendarIcon, MapPinIcon, UsersIcon } from 'lucide-react';
import { formatDateTime } from '@/utils/dateUtils';
import { Badge } from '@/components/ui/badge';

interface Props {
    registration: Registration;
}

export default function RegistrationShow({ registration }: Props) {
    const { event, attendees } = registration;

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
                    <div className="space-y-6">
                        <div className="px-1">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                <UsersIcon className="h-5 w-5 mr-3 text-gray-500" />
                                Registered Attendees ({attendees?.length})
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">This is your ticket. Each attendee has a unique QR
                                code for check-in.</p>
                        </div>
                        <div className="space-y-4">
                            {attendees?.map((attendee) => (
                                <div key={attendee.id} className="bg-white border rounded-lg shadow-sm">
                                    <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-6">
                                        <div
                                            className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 p-2 shadow-inner">
                                            <div
                                                className="w-full h-full bg-white flex items-center justify-center rounded-md">
                                                <span className="text-xs text-gray-400">QR Code Here</span>
                                            </div>
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
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
