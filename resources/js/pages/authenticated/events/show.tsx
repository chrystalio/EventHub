import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Event, Registration } from '@/types';
import {
    CalendarIcon,
    MapPinIcon,
    UserIcon,
    ArrowLeftIcon,
    CheckCircleIcon,
    ClockIcon,
    UsersIcon,
    PlusIcon,
    MinusIcon,
    XCircleIcon,
} from 'lucide-react';
import { formatDateTime } from '@/utils/dateUtils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
    event: Event;
    userRegistration?: Registration;
    canRegister: boolean;
    totalRegistered: number;
    isAuthenticated: boolean;
}

const RegistrationStatusCard = ({ registration }: { registration: Registration }) => {
    let statusConfig = {
        icon: CheckCircleIcon,
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        iconColor: 'text-green-600',
        badgeBgColor: 'bg-green-100',
        badgeTextColor: 'text-green-800',
        titleTextColor: 'text-green-900',
        descriptionTextColor: 'text-green-800',
        buttonClass: 'border-green-300 text-green-700 hover:bg-green-100',
        title: 'Registration Confirmed',
        description: `You're registered for this event with ${registration.guest_count} guest${registration.guest_count !== 1 ? 's' : ''}.`
    };

    switch (registration.status) {
        case 'pending':
            statusConfig = {
                ...statusConfig,
                icon: ClockIcon,
                bgColor: 'bg-yellow-50',
                borderColor: 'border-yellow-200',
                iconColor: 'text-yellow-600',
                badgeBgColor: 'bg-yellow-100',
                badgeTextColor: 'text-yellow-800',
                titleTextColor: 'text-yellow-900',
                descriptionTextColor: 'text-yellow-800',
                buttonClass: 'border-yellow-300 text-yellow-700 hover:bg-yellow-100',
                title: 'Registration Pending',
                description: 'Your registration is awaiting approval. You will be notified once it is confirmed.'
            };
            break;
        case 'rejected':
            statusConfig = {
                ...statusConfig,
                icon: XCircleIcon,
                bgColor: 'bg-red-50',
                borderColor: 'border-red-200',
                iconColor: 'text-red-600',
                badgeBgColor: 'bg-red-100',
                badgeTextColor: 'text-red-800',
                titleTextColor: 'text-red-900',
                descriptionTextColor: 'text-red-800',
                buttonClass: 'border-red-300 text-red-700 hover:bg-red-100',
                title: 'Registration Issue',
                description: 'This registration has been cancelled or was not approved.'
            };
            break;
    }

    const Icon = statusConfig.icon;

    return (
        <div className={`rounded-lg border ${statusConfig.borderColor} ${statusConfig.bgColor} p-6 sm:p-8`}>
            <div className="flex gap-4 sm:items-start">
                <Icon className={`h-6 w-6 flex-shrink-0 ${statusConfig.iconColor}`} />
                <div className="flex-1">
                    <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                        <h3 className={`text-lg font-semibold ${statusConfig.titleTextColor}`}>{statusConfig.title}</h3>
                        <span className={`w-fit rounded-full px-3 py-1 text-sm font-medium capitalize ${statusConfig.badgeBgColor} ${statusConfig.badgeTextColor}`}>
                            Status: {registration.status}
                        </span>
                    </div>
                    <p className={`text-sm sm:text-base ${statusConfig.descriptionTextColor}`}>
                        {statusConfig.description}
                    </p>
                    <div className="mt-4">
                        <Button variant="outline" size="sm" className={`w-fit ${statusConfig.buttonClass}`} asChild>
                            <Link href={route('registrations.index')}>View My Registrations</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default function AuthenticatedEventShow({ event, userRegistration, canRegister, totalRegistered }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        guest_count: 0,
        guests: [] as { name: string; phone: string }[],
    });

    const handleGuestCountChange = (newCount: number) => {
        const count = Math.max(0, Math.min(newCount, event.max_guests_per_registration));
        const newGuests = Array.from({ length: count }, (_, i) => data.guests[i] || { name: '', phone: '' });
        setData({ guest_count: count, guests: newGuests });
    };

    const handleGuestDetailChange = (index: number, field: 'name' | 'phone', value: string) => {
        const updatedGuests = [...data.guests];
        updatedGuests[index] = { ...updatedGuests[index], [field]: value };
        setData('guests', updatedGuests);
    };

    const handleRegistrationSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('registrations.store', event.uuid), { preserveScroll: true });
    };

    return (
        <AppLayout>
            <Head title={`${event.name} - ITEBA Events`} />

            <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
                <div className="mb-6 sm:mb-8">
                    <Link href={route('registrations.browse')} className="inline-flex items-center text-gray-600 transition-colors hover:text-gray-900">
                        <ArrowLeftIcon className="mr-2 h-4 w-4" />
                        Back to Events
                    </Link>
                </div>

                <div className="space-y-6 sm:space-y-8">
                    <div className="space-y-4 sm:space-y-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                            <Badge variant="secondary" className="w-fit bg-gray-100 text-gray-700">
                                {new Date(event.start_time) > new Date() ? 'Upcoming' : 'Past Event'}
                            </Badge>
                            <span className="text-sm text-gray-500">{totalRegistered} registered</span>
                        </div>
                        <h1 className="text-2xl leading-tight font-bold text-gray-900 sm:text-3xl lg:text-4xl">{event.name}</h1>
                        <div className="flex items-center gap-2 text-gray-600">
                            <UserIcon className="h-4 w-4" />
                            <span className="text-sm sm:text-base">Organized by {event.organizer}</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">About This Event</h2>
                        <div className="prose prose-gray max-w-none">
                            <p className="text-base leading-relaxed text-gray-700 sm:text-lg">
                                {event.description || 'More details about this event will be available soon.'}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-6 border-t border-gray-200 pt-6 sm:grid-cols-2">
                            <div className="space-y-4">
                                <h3 className="text-base font-semibold text-gray-900">When & Where</h3>
                                <div className="flex items-start gap-3">
                                    <CalendarIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">{formatDateTime(event.start_time)}</div>
                                        <div className="text-sm text-gray-600">{formatDateTime(event.start_time)} - {formatDateTime(event.end_time)}</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPinIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">{event.building.name}</div>
                                        <div className="text-sm text-gray-600">{event.room.name}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-base font-semibold text-gray-900">Event Details</h3>
                                <div className="flex items-start gap-3">
                                    <UsersIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">{totalRegistered} people registered</div>
                                        <div className="text-sm text-gray-600">
                                            {event.max_guests_per_registration > 0 ? `Up to ${event.max_guests_per_registration} guests allowed` : 'No guests allowed'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <ClockIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">Free Event</div>
                                        <div className="text-sm text-gray-600">No registration fee required</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {userRegistration ? (
                        <RegistrationStatusCard registration={userRegistration} />
                    ) : canRegister ? (
                        <form onSubmit={handleRegistrationSubmit} className="space-y-6 rounded-lg border bg-white p-6 sm:p-8">
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-gray-900">Register for this event</h3>
                                <p className="text-sm text-gray-600">Confirm your details and add any guests.</p>
                            </div>
                            {event.max_guests_per_registration > 0 && (
                                <div className="rounded-md border p-4">
                                    <Label htmlFor="guest_count" className="font-medium">Add Guests</Label>
                                    <p className="mb-3 text-sm text-gray-500">You can bring up to {event.max_guests_per_registration} guest(s).</p>
                                    <div className="flex items-center gap-4">
                                        <Button type="button" variant="outline" size="icon" onClick={() => handleGuestCountChange(data.guest_count - 1)}>
                                            <MinusIcon className="h-4 w-4" />
                                        </Button>
                                        <span className="w-10 text-center text-lg font-semibold">{data.guest_count}</span>
                                        <Button type="button" variant="outline" size="icon" onClick={() => handleGuestCountChange(data.guest_count + 1)}>
                                            <PlusIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {data.guests.map((guest, index) => (
                                <div key={index} className="grid gap-4 rounded-md border p-4 sm:grid-cols-2">
                                    <div className="col-span-full font-medium">Guest {index + 1} Details</div>
                                    <div>
                                        <Label htmlFor={`guest_name_${index}`}>Full Name</Label>
                                        <Input id={`guest_name_${index}`} type="text" value={guest.name} onChange={(e) => handleGuestDetailChange(index, 'name', e.target.value)} required />
                                        {errors[`guests.${index}.name`] && <p className="mt-1 text-xs text-red-500">{errors[`guests.${index}.name`]}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor={`guest_phone_${index}`}>Phone Number</Label>
                                        <Input id={`guest_phone_${index}`} type="text" value={guest.phone} onChange={(e) => handleGuestDetailChange(index, 'phone', e.target.value)} required />
                                        {errors[`guests.${index}.phone`] && <p className="mt-1 text-xs text-red-500">{errors[`guests.${index}.phone`]}</p>}
                                    </div>
                                </div>
                            ))}
                            <Button type="submit" disabled={processing} className="w-full bg-gray-900 text-white hover:bg-gray-800 sm:w-auto">
                                {processing ? 'Registering...' : `Confirm Registration`}
                            </Button>
                        </form>
                    ) : (
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center sm:p-8">
                            <div className="space-y-4">
                                <p className="text-gray-600">Registration requires proper permissions.</p>
                                <Button variant="outline" size="sm">Contact Administrator</Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
