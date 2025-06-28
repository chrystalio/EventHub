import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateTime, formatDateOnly, formatTimeOnly } from '@/utils/dateUtils';
import type { Event, Registration, PublicEventShowProps } from '@/types';
import {
    CalendarIcon,
    MapPinIcon,
    UserIcon,
    ArrowLeftIcon,
    LogInIcon,
    CheckCircleIcon,
    ShareIcon,
    UsersIcon,
    ClockIcon
} from 'lucide-react';

export default function Show({ event, userRegistration, canRegister, totalRegistered, isAuthenticated }: PublicEventShowProps) {
    const startDate = event.start_time.split('T')[0];
    const endDate = event.end_time.split('T')[0];
    const isSameDay = startDate === endDate;

    return (
        <>
            <Head title={`${event.name} - ITEBA Events`} />
            <div className="min-h-screen bg-gray-50">
                <div className="relative bg-gray-900 text-white">
                    <div className="max-w-4xl mx-auto px-6 py-12">
                        <div className="mb-8">
                            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" asChild>
                                <Link href={route('public.events.index')}>
                                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                                    Back to Events
                                </Link>
                            </Button>
                        </div>
                        <div className="mb-6">
                            <div className="flex items-center gap-3 mb-6">
                                <Badge className="bg-gray-800 text-white border-gray-700">
                                    {new Date(event.start_time) > new Date() ? 'Upcoming Event' : 'Past Event'}
                                </Badge>
                                <span className="text-gray-300 text-sm">
                                    {totalRegistered} people registered
                                </span>
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                                {event.name}
                            </h1>
                            <div className="flex items-center gap-2 text-gray-300 mb-8">
                                <UserIcon className="h-5 w-5" />
                                <span className="text-lg">Organized by {event.organizer}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                                            <CalendarIcon className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-white">
                                                {isSameDay ? formatDateOnly(event.start_time) : 'Multi-day Event'}
                                            </div>
                                            <div className="text-white/70 text-sm">
                                                {isSameDay
                                                    ? `${formatTimeOnly(event.start_time)} - ${formatTimeOnly(event.end_time)}`
                                                    : `${formatDateTime(event.start_time)} - ${formatDateTime(event.end_time)}`
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                                            <MapPinIcon className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-white">{event.building.name}</div>
                                            <div className="text-white/70 text-sm">{event.room.name}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-white border-b">
                    <div className="max-w-4xl mx-auto px-6 py-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Ready to Join?</h2>
                                <p className="text-gray-600">Registration is completely free and takes less than a minute.</p>
                            </div>

                            <div className="flex-shrink-0">
                                {userRegistration ? (
                                    <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                                        <span className="text-green-800 font-medium">You're registered!</span>
                                        <Button variant="outline" size="sm" className="ml-4 border-green-300 text-green-700 hover:bg-green-100" asChild>
                                            <Link href={route('registrations.show', userRegistration.uuid)}>
                                                View Registration
                                            </Link>
                                        </Button>
                                    </div>
                                ) : isAuthenticated ? (
                                    <Button size="lg" className="bg-gray-900 text-white hover:bg-gray-800" asChild>
                                        <Link href="#">
                                            Register Now - Free
                                        </Link>
                                    </Button>
                                ) : (
                                    <div className="flex gap-3">
                                        <Button size="lg" className="bg-gray-900 text-white hover:bg-gray-800" asChild>
                                            <Link href={route('login')}>
                                                <LogInIcon className="h-4 w-4 mr-2" />
                                                Sign In to Register
                                            </Link>
                                        </Button>
                                        <Button variant="outline" size="lg" className="bg-gray-900 text-white hover:bg-gray-800" asChild>
                                            <Link href={route('register')}>
                                                Create Account
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-6 py-12">
                    <div className="bg-white rounded-2xl p-8 shadow-sm border">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">About This Event</h2>

                        {/* Just the description - clean and simple */}
                        <div className="prose prose-lg max-w-none mb-8">
                            <p className="text-gray-700 leading-relaxed text-lg">
                                {event.description || 'More details about this event will be available soon. Stay tuned for updates and additional information from the organizers.'}
                            </p>
                        </div>

                        {/* Simple horizontal stats - no cards, just clean info */}
                        <div className="flex flex-wrap items-center gap-8 pt-6 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-sm">
                                <UsersIcon className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">{totalRegistered} registered</span>
                            </div>

                            {event.max_guests_per_registration > 0 && (
                                <div className="flex items-center gap-2 text-sm">
                                    <UserIcon className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-600">Up to {event.max_guests_per_registration} guests</span>
                                </div>
                            )}

                            <div className="flex items-center gap-2 text-sm">
                                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                                <span className="text-gray-600">Free event</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <ClockIcon className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">{isSameDay ? 'Single day' : 'Multi-day'}</span>
                            </div>

                            <div className="flex gap-4 ml-auto">
                                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-white">
                                    <ShareIcon className="h-4 w-4 mr-2" />
                                    Share
                                </Button>
                                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-white">
                                    <CalendarIcon className="h-4 w-4 mr-2" />
                                    Add to Calendar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
