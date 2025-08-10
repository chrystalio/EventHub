import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { EventWithRegistrationsCount } from '@/types';
import { Link } from '@inertiajs/react';
import { Clock, MapPin, Ticket, Users } from 'lucide-react';

interface UpcomingManagedScheduleWidgetProps {
    events: EventWithRegistrationsCount[];
}

export default function UpcomingManagedScheduleWidget({ events }: UpcomingManagedScheduleWidgetProps) {
    const formatMonth = (dateString: string) => new Date(dateString).toLocaleDateString([], { month: 'short' }).toUpperCase();
    const formatDay = (dateString: string) => new Date(dateString).toLocaleDateString([], { day: '2-digit' });
    const formatTimeRange = (startStr: string, endStr: string) => {
        const options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
        const startTime = new Date(startStr).toLocaleTimeString([], options);
        const endTime = new Date(endStr).toLocaleTimeString([], options);
        return `${startTime} - ${endTime}`;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Upcoming Managed Schedule</CardTitle>
                <CardDescription>Here are up to 5 of your next managed events.</CardDescription>
            </CardHeader>
            <CardContent>
                {events && events.length > 0 ? (
                    <ScrollArea className="h-52">
                        <ul className="space-y-4 pr-6">
                            {events.map((event) => (
                                <li
                                    key={event.uuid}
                                    className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
                                >
                                    <div
                                        className="bg-muted text-muted-foreground flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-md">
                                        <span className="text-xs font-bold">{formatMonth(event.start_time)}</span>
                                        <span
                                            className="text-xl font-bold tracking-tight">{formatDay(event.start_time)}</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="truncate text-base font-semibold leading-snug">{event.name}</h3>
                                        <div
                                            className="text-muted-foreground mt-1 flex items-center gap-x-4 gap-y-1 text-xs">
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="h-3 w-3 flex-shrink-0" />
                                                <span>{formatTimeRange(event.start_time, event.end_time)}</span>
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                                <span>{event.building?.name} - {event.room?.name}</span>
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Users className="h-3 w-3 flex-shrink-0" />
                                                <span>{event.registrations_count} Registrant(s)</span>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full flex-shrink-0 sm:w-auto">
                                        <Button asChild size="sm" className="w-full sm:w-auto">
                                            <Link href={route('admin.events.show', { event: event.uuid })}>Manage
                                                Event</Link>
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </ScrollArea>
                ) : (
                    <div
                        className="text-muted-foreground flex flex-col items-center justify-center gap-2 p-8 text-center">
                        <Ticket className="h-8 w-8" />
                        <p>You are not managing any upcoming events.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
