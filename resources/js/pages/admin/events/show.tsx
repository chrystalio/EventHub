import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTimeLong, formatDateOnly, formatTimeOnly } from '@/utils/dateUtils';
import {
    CalendarIcon,
    MapPinIcon,
    UserIcon,
    BuildingIcon
} from 'lucide-react';
import type { BreadcrumbItem, Event } from '@/types';

interface ShowProps {
    event: Event;
}

export default function Show({ event }: ShowProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Events', href: route('admin.events.index') },
        { title: event.name, href: '#' },
    ];

    const startDate = event.start_time.split('T')[0];
    const endDate = event.end_time.split('T')[0];
    const isSameDay = startDate === endDate;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={event.name} />
            <div className="max-w-10xl mx-auto md:mx-4 p-6 space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="space-y-2">
                                <CardTitle className="text-xl font-bold">{event.name}</CardTitle>
                                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                    <UserIcon className="h-4 w-4" />
                                    <span>Organized by {event.organizer}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Badge variant="outline">
                                    {new Date(event.start_time) > new Date() ? 'Upcoming' : 'Past'}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
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
                                    <div className="font-medium">
                                        {isSameDay ? formatDateOnly(event.start_time) : 'Multi-day Event'}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {isSameDay
                                            ? `${formatTimeOnly(event.start_time)} - ${formatTimeOnly(event.end_time)}`
                                            : `${formatDateTimeLong(event.start_time)} - ${formatDateTimeLong(event.end_time)}`
                                        }
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
                                    <BuildingIcon className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{event.building.name} - {event.room.name} ({event.room.code})</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
