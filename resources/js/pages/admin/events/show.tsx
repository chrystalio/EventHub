import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, Link, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { UserSearchCombobox } from '@/components/ui/user-search-combobox';
import { formatDateTimeLong, formatDateOnly, formatTimeOnly } from '@/utils/dateUtils';
import { Row } from '@tanstack/react-table';
import {
    CalendarIcon,
    MapPinIcon,
    UserIcon,
    BuildingIcon, UsersIcon, TicketIcon, LockIcon, CreditCardIcon
} from 'lucide-react';
import type { BreadcrumbItem, Event, Registration, SharedData } from '@/types';
import { DataTable } from '@/components/ui/data-table';
import { registrantColumns } from '@/pages/admin/events/registrant-columns';
import { Button } from '@/components/ui/button';
import { useFlashToast } from '@/hooks/useFlashToast';

interface ShowProps {
    event: Event;
}

const eventTypeConfig = {
    free: {
        label: "Free Event",
        className: "bg-blue-100 text-blue-800 border-blue-200",
        icon: TicketIcon,
    },
    private: {
        label: "Private Event",
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: LockIcon,
    },
    paid: {
        label: "Paid Event",
        className: "bg-purple-100 text-purple-800 border-purple-200",
        icon: CreditCardIcon,
    }
};

export default function Show({ event }: ShowProps) {
    useFlashToast();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Events', href: route('admin.events.index') },
        { title: event.name, href: '#' },
    ];

    const { auth } = usePage<Page<SharedData>>().props;
    const isSuperAdmin = ['System Administrator', 'Akademik'].some(role =>
        auth.user.roles.includes(role)
    );
    const startDate = event.start_time.split('T')[0];
    const endDate = event.end_time.split('T')[0];
    const isSameDay = startDate === endDate;
    const typeConfig = eventTypeConfig[event.type as keyof typeof eventTypeConfig];
    const hasGuests = event.registrations?.some(reg => reg.guest_count > 0);
    const visibleColumns = hasGuests
        ? registrantColumns
        : registrantColumns.filter(col => (col as any).accessorKey !== 'guestCount');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={event.name} />
            <div className="max-w-10xl mx-auto space-y-6 p-6 md:mx-4">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-2">
                                <CardTitle className="text-xl font-bold">{event.name}</CardTitle>
                                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                                    <UserIcon className="h-4 w-4" />
                                    <span>Organized by {event.organizer}</span>
                                </div>
                            </div>
                            <div className="flex gap-2 items-center flex-wrap">
                                {typeConfig && (
                                    <Badge variant="outline" className={typeConfig.className}>
                                        <typeConfig.icon className="mr-1.5 h-3 w-3" />
                                        {typeConfig.label}
                                    </Badge>
                                )}
                                <Badge variant="outline">{new Date(event.start_time) > new Date() ? 'Upcoming' : 'Past'}</Badge>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>About This Event</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground leading-relaxed">
                                    {event.description || 'No description provided for this event.'}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <UsersIcon className="h-5 w-5" />
                                    Registered Attendees
                                </CardTitle>
                                <p className="text-muted-foreground pt-2 text-sm">
                                    A total of {event.registrations?.length || 0} registrations have been made.
                                </p>
                            </CardHeader>
                            <CardContent>
                                <DataTable
                                    columns={visibleColumns}
                                    data={event.registrations || []}
                                    renderSubComponent={renderGuestList}
                                />
                            </CardContent>
                        </Card>
                        {isSuperAdmin && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <UsersIcon className="h-5 w-5" />
                                    Manage Event Staff
                                </CardTitle>
                                <p className="text-muted-foreground pt-2 text-sm">Assign users who can help manage this event.</p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    {event.staff && event.staff.length > 0 ? (
                                        event.staff.map((staffMember) => (
                                            <div key={staffMember.id} className="flex items-center justify-between rounded-md border p-2 pl-3">
                                                <span className="text-sm font-medium">{staffMember.name}</span>
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link
                                                        href={route('admin.events.staff.destroy', {
                                                            event: event.uuid,
                                                            user: staffMember.id,
                                                        })}
                                                        method="delete"
                                                        as="button"
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        Remove
                                                    </Link>
                                                </Button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-muted-foreground p-2 text-sm">No Staff (Panitia) assigned yet.</p>
                                    )}
                                </div>

                                <Separator />

                                <AssignStaffForm event={event} />
                            </CardContent>
                        </Card>
                        )}
                    </div>
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CalendarIcon className="h-5 w-5" />
                                    Date & Time
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <div className="font-medium">{isSameDay ? formatDateOnly(event.start_time) : 'Multi-day Event'}</div>
                                    <div className="text-muted-foreground text-sm">
                                        {isSameDay
                                            ? `${formatTimeOnly(event.start_time)} - ${formatTimeOnly(event.end_time)}`
                                            : `${formatDateTimeLong(event.start_time)} - ${formatDateTimeLong(event.end_time)}`}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPinIcon className="h-5 w-5" />
                                    Location
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <BuildingIcon className="text-muted-foreground h-4 w-4" />
                                    <span className="font-medium">
                                        {event.building.name} - {event.room.name} ({event.room.code})
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function AssignStaffForm({ event }: { event: Event }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        user_id: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.events.staff.store', event.uuid), {
            onSuccess: () => reset('user_id'),
        });
    };

    return (
        <form onSubmit={submit} className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Assign New Staff (Panitia)</h3>
            <div className="flex items-center gap-2">
                <UserSearchCombobox
                    value={data.user_id}
                    onSelect={(userId) => setData('user_id', userId)}
                />
                <Button type="submit" disabled={processing}>Assign</Button>
            </div>
            {errors.user_id && <p className="text-sm text-red-500">{errors.user_id}</p>}
        </form>
    );
}

const renderGuestList = (row: Row<Registration>) => {
    const guests = row.original.attendees?.filter(a => a.attendee_type === 'guest');

    if (!guests || guests.length === 0) {
        return <div className="p-4 px-12 text-sm text-center text-muted-foreground">This registrant has no guests.</div>;
    }

    return (
        <div className="p-4 px-12 bg-gray-50/75">
            <h4 className="font-semibold mb-3 text-xs uppercase tracking-wider text-gray-500">Guests</h4>
            <ul className="space-y-3">
                {guests.map(guest => (
                    <li key={guest.id} className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-800">{guest.name}</span>
                        <span className="text-muted-foreground">{guest.phone}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};
