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
    InfoIcon,
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
            <Badge variant="secondary" className="w-fit bg-gray-100 text-gray-700">
                {new Date(event.start_time) > new Date() ? 'Upcoming' : 'Past Event'}
            </Badge>
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <UsersIcon className="h-4 w-4" />
                <span>{totalRegistered} Registered</span>
            </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 lg:text-4xl">{event.name}</h1>
        <div className="flex items-center gap-2 text-gray-600">
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
                    <div className="prose prose-gray max-w-none text-gray-700">
                        <p>{event.description || 'More details about this event will be available soon.'}</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Event Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900">When & Where</h3>
                            <div className="flex items-start gap-3">
                                <CalendarIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                                <div>
                                    <div className="text-sm font-medium text-gray-900">{formatDateTime(event.start_time)}</div>
                                    <div className="text-sm text-gray-600">to {formatDateTime(event.end_time)}</div>
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
                            <h3 className="font-semibold text-gray-900">Details</h3>
                            <div className="flex items-start gap-3">
                                <TicketIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                                <div>
                                    <div className="text-sm font-medium text-gray-900">{getEventTypeDisplay(event.type)}</div>
                                    <div className="text-sm text-gray-600">
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
    const statusMap = {
        approved: { icon: CheckCircleIcon, color: 'green', title: 'Registration Confirmed', description: `You're registered for this event with ${registration.guest_count} guest${registration.guest_count !== 1 ? 's' : ''}.` },
        pending: { icon: ClockIcon, color: 'yellow', title: 'Registration Pending', description: 'Your registration is awaiting approval and will be available here once confirmed.' },
        rejected: { icon: XCircleIcon, color: 'red', title: 'Registration Not Approved', description: 'Unfortunately, your registration for this event was not approved.' },
        cancelled: { icon: XCircleIcon, color: 'red', title: 'Registration Cancelled', description: 'This registration has been cancelled.' },
        pending_payment: { icon: ClockIcon, color: 'yellow', title: 'Payment Pending', description: 'Your registration is pending payment. Please complete the payment to confirm your registration.' },
    };
    const config = statusMap[registration.status] || statusMap.rejected;
    const Icon = config.icon;

    return (
        <Card className={`bg-${config.color}-50 border-${config.color}-200`}>
            <CardHeader className="flex-row items-start gap-4 space-y-0">
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-${config.color}-100`}>
                    <Icon className={`h-6 w-6 text-${config.color}-600`} />
                </div>
                <div>
                    <CardTitle className={`text-lg text-${config.color}-900`}>{config.title}</CardTitle>
                    <Badge variant="secondary" className={`mt-2 capitalize bg-${config.color}-100 text-${config.color}-800`}>Status: {registration.status}</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <p className={`text-sm text-${config.color}-800`}>{config.description}</p>
                <Button variant="outline" size="sm" className={`mt-4 w-full border-${config.color}-300 bg-transparent text-${config.color}-700 hover:bg-${config.color}-100`} asChild>
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
                <p className="mb-3 text-sm text-gray-500">You can bring up to {event.max_guests_per_registration} guest(s).</p>
                <div className="flex items-center gap-4">
                    <Button type="button" variant="outline" size="icon" onClick={() => formProps.handleGuestCountChange(formProps.data.guest_count - 1)}><MinusIcon className="h-4 w-4" /></Button>
                    <span className="w-10 text-center text-lg font-semibold">{formProps.data.guest_count}</span>
                    <Button type="button" variant="outline" size="icon" onClick={() => formProps.handleGuestCountChange(formProps.data.guest_count + 1)}><PlusIcon className="h-4 w-4" /></Button>
                </div>
            </div>
        )}
        {formProps.data.guests.map((guest, index) => (
            <div key={index} className="grid gap-4 rounded-md border p-4">
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
                    <Link href={route('registrations.browse')} className="inline-flex items-center text-sm text-gray-600 transition-colors hover:text-gray-900">
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
                                        <InfoIcon className="h-5 w-5 text-gray-500" />
                                        <CardTitle>Registration Unavailable</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="mt-2 text-sm text-gray-600">You may not have the required permissions to register for this event, or registration may be closed.</p>
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
