import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { Clock, Users, MapPin, CheckCircle2, BellRing, QrCode } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

type EventWithDetails = {
    uuid: string;
    name: string;
    start_time: string;
    end_time: string;
    total_registered: number;
    building?: { name: string } | null;
    room?: { name: string } | null;
};

interface EventsHappeningNowWidgetProps {
    events: EventWithDetails[];
}

const OngoingEventItem = ({ event }: { event: EventWithDetails }) => {
    const [isCheckinActive, setIsCheckinActive] = useState(false);
    const [countdownText, setCountdownText] = useState('');

    useEffect(() => {
        const updateStatus = () => {
            const now = new Date();
            const checkinEndTime = new Date(new Date(event.start_time).getTime() + 60 * 60 * 1000);
            const eventEndTime = new Date(event.end_time);

            const checkinIsCurrentlyActive = now < checkinEndTime;
            setIsCheckinActive(checkinIsCurrentlyActive);

            if (now < eventEndTime) {
                if (checkinIsCurrentlyActive) {
                    const diff = checkinEndTime.getTime() - now.getTime();
                    const minutes = Math.floor((diff / 1000 / 60) % 60);
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    setCountdownText(`Check-in closes in ${hours > 0 ? `${hours}h ` : ''}${minutes}m`);
                } else {
                    setCountdownText('Check-in is closed.');
                }
            } else {
                setCountdownText('Event has ended.');
            }
        };

        updateStatus();
        const timerId = setInterval(updateStatus, 30000);
        return () => clearInterval(timerId);
    }, [event]);

    return (
        <li className="space-y-4 py-4">
            <div className="flex-grow space-y-2">
                <h3 className="font-bold text-lg leading-tight">{event.name}</h3>
                <div className="text-sm text-muted-foreground space-y-1.5">
                    <p className={`flex items-center gap-2 font-medium ${isCheckinActive ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                        <Clock className="h-4 w-4" />
                        <span>{countdownText}</span>
                    </p>
                    <p className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{event.total_registered} Registered</span>
                    </p>
                    <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{event.building?.name} - {event.room?.name}</span>
                    </p>
                </div>
            </div>

            <div className="w-full">
                {isCheckinActive ? (
                    <Button asChild size="sm" className="w-full">
                        <Link href={route('panitia.events.scanner', { event: event.uuid })}>
                            <QrCode className="mr-1 h-4 w-4" />
                            Scan
                        </Link>
                    </Button>
                ) : (
                    <Button asChild size="sm" variant="outline" className="w-full">
                        <Link href={route('admin.events.show', { event: event.uuid })}>
                            Details
                        </Link>
                    </Button>
                )}
            </div>
        </li>
    );
};

export default function EventsHappeningNowWidget({ events }: EventsHappeningNowWidgetProps) {
    if (!events || events.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <div>
                            <CardTitle>Events Happening Now</CardTitle>
                            <CardDescription>No events are currently active.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <BellRing className="h-4 w-4 mb-4 text-red-500 dark:text-red-400 animate-pulse" />
                    <div>
                        <CardTitle className="text-md">Events Happening Now</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                            {events.length} {events.length === 1 ? 'event is' : 'events are'} currently active.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="max-h-80">
                    <ul className="divide-y dark:divide-gray-800 pr-6">
                        {events.map((event) => (
                            <OngoingEventItem key={event.uuid} event={event} />
                        ))}
                    </ul>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
