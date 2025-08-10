import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    TicketIcon,
    InfoIcon, Ban
} from 'lucide-react';
import { formatDateTime } from '@/utils/dateUtils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/form/phone-input';

interface PageProps {
    event: Event;
    userRegistration?: Registration;
    canRegister: boolean;
    totalRegistered: number;
    isAuthenticated: boolean;
}

const EventHeader = ({ event, totalRegistered }: { event: Event, totalRegistered: number }) => (
    <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Badge variant="secondary" className="w-fit bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {new Date(event.start_time) > new Date() ? 'Upcoming' : 'Past Event'}
            </Badge>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                <UsersIcon className="h-4 w-4" />
                <span>{totalRegistered} Registered</span>
            </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 lg:text-4xl">{event.name}</h1>
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <UserIcon className="h-4 w-4" />
            <span className="text-sm">Organized by {event.organizer}</span>
        </div>
    </div>
);

const EventDetails = ({ event }: { event: Event }) => {
    const getEventTypeDisplay = (type: string) => {
        switch (type) {
            case 'free': return 'Free Event';
            case 'private': return 'Private Event';
            case 'paid': return 'Paid Event';
            default: return 'Event';
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>About This Event</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {event.description || 'More details about this event will be available soon.'}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Event Information</CardTitle>
                </CardHeader>
                <CardContent>
                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">When & Where</h3>
                            <div className="flex items-start gap-3">
                                <CalendarIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                                <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDateTime(event.start_time)}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">to {formatDateTime(event.end_time)}</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPinIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                                <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{event.building.name}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">{event.room.name}</div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Details</h3>
                            <div className="flex items-start gap-3">
                                <TicketIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                                <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{getEventTypeDisplay(event.type)}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        {event.max_guests_per_registration > 0 ? `Up to ${event.max_guests_per_registration} guests allowed` : 'No guests allowed'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const RegistrationStatusCard = ({ registration }: { registration: Registration }) => {
    const getGuestDescription = () => {
        const count = registration.guest_count;
        if (count === 0) return "You're registered for this event.";
        return `You're registered for this event with ${count} ${count === 1 ? 'guest' : 'guests'}.`;
    };

    const statusMap = {
        approved: { icon: CheckCircleIcon, title: 'Registration Confirmed', description: getGuestDescription(), classes: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800', iconContainer: 'bg-green-100 dark:bg-green-900', iconClass: 'text-green-600 dark:text-green-400', titleText: 'text-green-900 dark:text-green-200', badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', body: 'text-green-800 dark:text-green-200', button: 'border-green-300 bg-transparent text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900' },
        pending: { icon: ClockIcon, title: 'Registration Pending', description: 'Your registration is awaiting approval.', classes: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800', iconContainer: 'bg-yellow-100 dark:bg-yellow-900', iconClass: 'text-yellow-600 dark:text-yellow-400', titleText: 'text-yellow-900 dark:text-yellow-200', badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', body: 'text-yellow-800 dark:text-yellow-200', button: 'border-yellow-300 bg-transparent text-yellow-700 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-900' },
        rejected: {
            icon: Ban,
            title: 'Registration Not Approved',
            description: 'Your registration was not approved.',
            classes: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
            iconContainer: 'bg-red-100 dark:bg-red-900',
            iconClass: 'text-red-600 dark:text-red-400', // <- renamed
            titleText: 'text-red-900 dark:text-red-200',
            badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            body: 'text-red-800 dark:text-red-200',
            button: 'border-red-300 bg-transparent text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900',
        },

        cancelled: { icon: XCircleIcon, title: 'Registration Cancelled', description: 'This registration has been cancelled.', classes: 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-800', iconContainer: 'bg-gray-100 dark:bg-gray-800', iconClass: 'text-gray-600 dark:text-gray-400', titleText: 'text-gray-900 dark:text-gray-200', badge: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', body: 'text-gray-800 dark:text-gray-200', button: 'border-gray-300 bg-transparent text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800' },
        pending_payment: { icon: ClockIcon, title: 'Payment Pending', description: 'Your registration is pending payment.', classes: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800', iconContainer: 'bg-yellow-100 dark:bg-yellow-900', iconClass: 'text-yellow-600 dark:text-yellow-400', titleText: 'text-yellow-900 dark:text-yellow-200', badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', body: 'text-yellow-800 dark:text-yellow-200', button: 'border-yellow-300 bg-transparent text-yellow-700 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-900' },
    };

    const config = statusMap[registration.status] || statusMap.rejected;
    const Icon = config.icon;

    return (
        <Card className={config.classes}>
            <CardHeader className="flex-row items-start gap-4 space-y-0">
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${config.iconContainer}`}>
                    <Icon className={`h-6 w-6 ${config.icon}`} />
                </div>
                <div>
                    <CardTitle className={`text-lg ${config.titleText}`}>{config.title}</CardTitle>
                    <Badge variant="secondary" className={`mt-2 capitalize ${config.badge}`}>Status: {registration.status.replace('_', ' ')}</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <p className={`text-sm ${config.body}`}>{config.description}</p>
                <Button variant="outline" size="sm" className={`mt-4 w-full ${config.button}`} asChild>
                    <Link href={route('registrations.index')}>View My Registrations</Link>
                </Button>
            </CardContent>
        </Card>
    );
};

const RegistrationForm = ({ event, onSubmit, ...formProps }) => (
    <form onSubmit={onSubmit} className="space-y-6">
        {event.max_guests_per_registration > 0 && (
            <div>
                <Label className="font-medium">Add Guests</Label>
                <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">You can bring up to {event.max_guests_per_registration} guest(s).</p>
                <div className="flex items-center gap-4">
                    <Button type="button" variant="outline" size="icon" onClick={() => formProps.handleGuestCountChange(formProps.data.guest_count - 1)}><MinusIcon className="h-4 w-4" /></Button>
                    <span className="w-10 text-center text-lg font-semibold">{formProps.data.guest_count}</span>
                    <Button type="button" variant="outline" size="icon" onClick={() => formProps.handleGuestCountChange(formProps.data.guest_count + 1)}><PlusIcon className="h-4 w-4" /></Button>
                </div>
            </div>
        )}
        {formProps.data.guests.map((guest, index) => (
            <div key={index} className="grid gap-4 rounded-md border p-4 dark:border-gray-800">
                <div className="font-medium">Guest {index + 1} Details</div>
                <div>
                    <Label htmlFor={`guest_name_${index}`}>Full Name</Label>
                    <Input id={`guest_name_${index}`} type="text" value={guest.name} onChange={(e) => formProps.handleGuestDetailChange(index, 'name', e.target.value)} required />
                    {formProps.errors[`guests.${index}.name`] && <p className="mt-1 text-xs text-red-500">{formProps.errors[`guests.${index}.name`]}</p>}
                </div>
                <div>
                    <Label htmlFor={`guest_phone_${index}`}>Phone Number</Label>
                    <PhoneInput
                        id={`guest_phone_${index}`}
                        value={guest.phone}
                        onChange={(value) => formProps.handleGuestDetailChange(index, 'phone', value || '')}
                        defaultCountry="ID"
                        placeholder="Enter phone number"
                        required
                    />
                    {formProps.errors[`guests.${index}.phone`] && <p className="mt-1 text-xs text-red-500">{formProps.errors[`guests.${index}.phone`]}</p>}
                </div>
            </div>
        ))}
        <Button type="submit" disabled={formProps.processing} className="w-full">
            {formProps.processing ? 'Registering...' : 'Confirm Registration'}
        </Button>
    </form>
);

export default function AuthenticatedEventShow({ event, userRegistration, canRegister, totalRegistered }: PageProps) {
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
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <Link href={route('registrations.browse')} className="inline-flex items-center text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
                        <ArrowLeftIcon className="mr-2 h-4 w-4" />
                        Back to All Events
                    </Link>
                </div>

                <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-3">
                    <div className="space-y-8 lg:col-span-2">
                        <EventHeader event={event} totalRegistered={totalRegistered} />
                        <EventDetails event={event} />
                    </div>
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            {userRegistration ? (
                                <RegistrationStatusCard registration={userRegistration} />
                            ) : canRegister ? (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Register for this Event</CardTitle>
                                        <CardDescription>Confirm your details and add any guests below.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <RegistrationForm
                                            event={event}
                                            onSubmit={handleRegistrationSubmit}
                                            data={data}
                                            setData={setData}
                                            errors={errors}
                                            processing={processing}
                                            handleGuestCountChange={handleGuestCountChange}
                                            handleGuestDetailChange={handleGuestDetailChange}
                                        />
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardHeader className="flex-row items-center gap-3 space-y-0">
                                        <InfoIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                        <CardTitle>Registration Unavailable</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">You may not have the required permissions to register for this event, or registration may be closed.</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
