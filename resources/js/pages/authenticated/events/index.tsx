import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/utils/dateUtils';
import { CalendarIcon, MapPinIcon, UserIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import type { Event, PaginatedEvents, Registration } from '@/types';

interface Props {
    events: PaginatedEvents;
    userRegistrations: Record<number, Registration>;
    canRegister: boolean;
    isAuthenticated: boolean;
}

export default function AuthenticatedEventsIndex({ events, userRegistrations, canRegister }: Props) {
    return (
        <AppLayout>
            <Head title="Browse Events - ITEBA" />

            <div className="space-y-6 px-4 py-8 lg:px-14">
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
                        {/* Left side content (Icon, Title, Subtitle) */}
                        <div className="flex w-full items-start gap-3 sm:w-auto">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                                <CalendarIcon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-grow">
                                <div className="flex items-center justify-between sm:justify-start sm:gap-3">
                                    <h1 className="text-xl font-semibold text-gray-900">Browse Events</h1>
                                    {/* BADGE FOR MOBILE: Placed next to the title */}
                                    {events.total > 0 && (
                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 sm:hidden">
                                            {events.total} available
                                        </Badge>
                                    )}
                                </div>
                                <p className="mt-1 text-sm leading-relaxed text-gray-500">
                                    Explore upcoming events at ITEBA and register to participate in the ones that interest you.
                                </p>
                            </div>
                        </div>

                        {/* BADGE FOR DESKTOP: A separate block, remains unchanged */}
                        {events.total > 0 && (
                            <Badge variant="secondary" className="hidden shrink-0 bg-blue-50 text-blue-700 sm:ml-4 sm:block">
                                {events.total} available
                            </Badge>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {events.data.length === 0 ? (
                        <div className="col-span-full rounded-lg bg-white py-20 text-center shadow-sm">
                            <CalendarIcon className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                            <h3 className="mb-2 text-xl font-medium text-gray-900">No upcoming events</h3>
                            <p className="text-gray-500">Check back soon for new opportunities</p>
                        </div>
                    ) : (
                        events.data.map((event) => (
                            <AuthenticatedEventCard
                                key={event.id}
                                event={event}
                                userRegistration={userRegistrations[event.id]}
                                canRegister={canRegister}
                            />
                        ))
                    )}
                </div>

                {events.last_page > 1 && (
                    <div className="flex flex-col-reverse items-center justify-between gap-4 md:flex-row">
                        <div className="text-sm text-gray-500">
                            Showing {(events.current_page - 1) * events.per_page + 1} to{' '}
                            {Math.min(events.current_page * events.per_page, events.total)} of {events.total} events
                        </div>
                        <PaginationControls events={events} />
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function AuthenticatedEventCard({ event, userRegistration, canRegister }: { event: Event; userRegistration?: Registration; canRegister: boolean }) {
    const getRegistrationBadge = () => {
        if (!userRegistration)
            return (
                <Badge variant="secondary" className="border-blue-200 bg-blue-50 text-blue-700">
                    Available
                </Badge>
            );

        const statusConfig = {
            approved: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Registered' },
            pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', label: 'Pending' },
            rejected: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Rejected' },
            attended: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Attended' },
            missed: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', label: 'Missed' },
            cancelled: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', label: 'Cancelled' },
        };

        const config = statusConfig[userRegistration.status] || statusConfig.pending;

        return (
            <Badge variant="secondary" className={`${config.bg} ${config.text} ${config.border}`}>
                {config.label}
            </Badge>
        );
    };

    return (
        <div className="group cursor-pointer overflow-hidden rounded-lg border bg-white shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow-lg">
            <div className="p-6">
                <div className="mb-4 flex items-start justify-end">{getRegistrationBadge()}</div>

                <h2 className="mb-3 line-clamp-2 text-xl font-bold text-gray-900 transition-colors group-hover:text-gray-700">{event.name}</h2>

                <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-gray-600">
                    {event.description || 'Join us for this exciting event at ITEBA.'}
                </p>

                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                        <span>{formatDateTime(event.start_time)}</span>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        <MapPinIcon className="h-4 w-4 text-gray-400" />
                        <span>
                            {event.building.name} - {event.room.name}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        <UserIcon className="h-4 w-4 text-gray-400" />
                        <span>By {event.organizer}</span>
                    </div>

                    {userRegistration && (
                        <div className="rounded bg-gray-50 px-2 py-1 text-xs text-gray-500">
                            Registered with {userRegistration.guest_count} guest{userRegistration.guest_count !== 1 ? 's' : ''}
                        </div>
                    )}
                </div>

                <div className="mt-6">
                    <Button variant="outline" className="flex w-full items-center justify-center gap-2" asChild>
                        <Link href={route('registrations.show_event', event.uuid)}>View Details</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}

function PaginationControls({ events }: { events: PaginatedEvents }) {
    const prevLink = events.links[0];
    const nextLink = events.links[events.links.length - 1];

    return (
            <div className="flex items-center gap-2">
                {prevLink?.url ? (
                    <Link
                        href={prevLink.url}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700"
                    >
                        <ChevronLeftIcon className="w-4 h-4 mr-1" />
                        Previous
                    </Link>
                ) : (
                    <span className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-300 bg-white border border-gray-300 rounded-md cursor-not-allowed">
                        <ChevronLeftIcon className="w-4 h-4 mr-1" />
                        Previous
                    </span>
                )}

                <div className="flex gap-1">
                    {events.links.slice(1, -1).map((link, index) => (
                        link.url ? (
                            <Link
                                key={index}
                                href={link.url}
                                className={`inline-flex items-center px-3 py-2 text-sm font-medium border rounded-md ${
                                    link.active
                                        ? 'bg-gray-800 text-white border-gray-600'
                                        : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                                }`}
                            >
                                {link.label}
                            </Link>
                        ) : (
                            <span
                                key={index}
                                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-300 bg-white border border-gray-300 rounded-md"
                            >
                                {link.label}
                            </span>
                        )
                    ))}
                </div>

                {nextLink?.url ? (
                    <Link
                        href={nextLink.url}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700"
                    >
                        Next
                        <ChevronRightIcon className="w-4 h-4 ml-1" />
                    </Link>
                ) : (
                    <span className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-300 bg-white border border-gray-300 rounded-md cursor-not-allowed">
                        Next
                        <ChevronRightIcon className="w-4 h-4 ml-1" />
                    </span>
                )}
            </div>
    );
}
