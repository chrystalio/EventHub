import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Registration } from '@/types';
import { Link } from '@inertiajs/react';
import { ArrowRight, Calendar, ChevronRight, ClockIcon, MapPin } from 'lucide-react';

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
                    <div className="text-muted-foreground flex h-full flex-col items-center justify-center text-center">
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
                                        <div className="bg-muted/50 flex w-20 flex-col items-center justify-center border-r p-4">
                                            <p className="text-primary text-sm font-bold">{month.toUpperCase()}</p>
                                            <p className="text-foreground text-2xl font-extrabold">{day}</p>
                                        </div>
                                        <div className="flex-grow p-4">
                                            <p className="font-semibold">{registration.event.name}</p>
                                            <div className="text-muted-foreground mt-2 space-y-1 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <ClockIcon className="h-4 w-4" />
                                                    <span>
                                                        {new Date(registration.event.start_time).toLocaleTimeString('en-US', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            hour12: true,
                                                        })}
                                                        {' – '}
                                                        {new Date(registration.event.end_time).toLocaleTimeString('en-US', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            hour12: true,
                                                        })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4" />
                                                    <span>
                                                        {registration.event.building.name} - {registration.event.room.name}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center p-4">
                                            <ChevronRight className="text-muted-foreground h-5 w-5" />
                                        </div>
                                    </div>
                                </Link>
                            );
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
