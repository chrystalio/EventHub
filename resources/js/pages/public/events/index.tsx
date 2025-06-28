import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/utils/dateUtils';
import { CalendarIcon, MapPinIcon, UserIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import type { Event, PaginatedEvents, PublicEventsIndexProps } from '@/types';
export default function Index({ events }: PublicEventsIndexProps) {
    return (
        <>
            <Head title="Events - ITEBA" />
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white border-b">
                    <div className="max-w-6xl mx-auto px-6 py-12">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-4xl font-bold text-gray-900 mb-2">Upcoming Events</h1>
                                <p className="text-lg text-gray-600">Join us for exciting opportunities at ITEBA</p>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" asChild>
                                    <a href={route('login')}>Sign in</a>
                                </Button>
                                <Button asChild>
                                    <a href={route('register')}>Get started</a>
                                </Button>
                            </div>
                        </div>

                        <div className="flex gap-8 text-sm text-gray-500">
                            <div><span className="font-semibold text-gray-900">{events.total}</span> upcoming events</div>
                            <div><span className="font-semibold text-gray-900">Free</span> registration</div>
                            <div><span className="font-semibold text-gray-900">Open</span> to all students</div>
                        </div>
                    </div>
                </div>

                {/* Events Grid */}
                <div className="max-w-6xl mx-auto px-6 py-8">
                    {events.data.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-lg shadow-sm">
                            <CalendarIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <h3 className="text-xl font-medium text-gray-900 mb-2">No upcoming events</h3>
                            <p className="text-gray-500">Check back soon for new opportunities</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                                {events.data.map((event) => (
                                    <EventCard key={event.id} event={event} />
                                ))}
                            </div>

                            {/* Pagination */}
                            {events.last_page > 1 && (
                                <Pagination events={events} />
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

function EventCard({ event }: { event: Event }) {
    return (
        <div className="bg-white rounded-lg shadow-sm border hover:shadow-lg hover:border-gray-300 transition-all duration-200 overflow-hidden group cursor-pointer">
            <div className="p-6">
                <div className="flex justify-end items-start mb-4">
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                        Upcoming
                    </Badge>
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-700 transition-colors line-clamp-2">
                    {event.name}
                </h2>

                <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-3">
                    {event.description || 'Join us for this exciting event at ITEBA.'}
                </p>

                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                        <span>{formatDateTime(event.start_time)}</span>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        <MapPinIcon className="h-4 w-4 text-gray-400" />
                        <span>{event.building.name} - {event.room.name}</span>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        <UserIcon className="h-4 w-4 text-gray-400" />
                        <span>By {event.organizer}</span>
                    </div>
                </div>

                <div className="mt-6">
                    <Button variant="outline" className="w-full flex items-center justify-center gap-2" asChild>
                        <Link href={route('public.events.show', event.uuid)}>
                            View Details
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}


function Pagination({ events }: { events: PaginatedEvents }) {
    const prevLink = events.links[0];
    const nextLink = events.links[events.links.length - 1];

    return (
        <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
                Showing {((events.current_page - 1) * events.per_page) + 1} to{' '}
                {Math.min(events.current_page * events.per_page, events.total)} of{' '}
                {events.total} events
            </div>

            <div className="flex items-center gap-2">
                {/* Previous Button */}
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

                {/* Page Numbers */}
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

                {/* Next Button - Fixed */}
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
        </div>
    );
}

