import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { formatDateTime } from '@/utils/dateUtils';
import type { Registration } from '@/types';
import { ArrowRight, Calendar, ChevronRight, MapPin } from 'lucide-react';

interface UpcomingScheduleProps {
    registrations: Registration[];
    totalUpcomingCount: number;
}

export default function UpcomingScheduleWidget({ registrations, totalUpcomingCount }: UpcomingScheduleProps) {
    return (
        <Card className="flex h-full flex-col">
            <CardHeader>
                <CardTitle>My Upcoming Schedule</CardTitle>
                <CardDescription>Your next registered events.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                {!registrations || registrations.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                        <p className="mb-4">You have no upcoming event registrations.</p>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={route('registrations.browse')}>Browse Events</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {registrations.map((registration) => {
                            const date = new Date(registration.event.start_time);
                            const month = date.toLocaleString('en-US', { month: 'short' });
                            const day = date.getDate();

                            return (
                                <Link href={route('registrations.show', registration.uuid)} key={registration.uuid} className="block">
                                    <div className="flex items-stretch rounded-lg border transition-all hover:shadow-md">
                                        <div className="flex flex-col items-center justify-center bg-muted/50 p-4 border-r w-20">
                                            <p className="text-sm font-bold text-primary">{month.toUpperCase()}</p>
                                            <p className="text-2xl font-extrabold text-foreground">{day}</p>
                                        </div>
                                        <div className="p-4 flex-grow">
                                            <p className="font-semibold">{registration.event.name}</p>
                                            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>{formatDateTime(registration.event.start_time)}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4" />
                                                    <span>{registration.event.building.name} - {registration.event.room.name}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4 flex items-center">
                                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </CardContent>
            {totalUpcomingCount > 3 && (
                <CardFooter>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href={route('registrations.index')}>
                            View All My Registrations
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
