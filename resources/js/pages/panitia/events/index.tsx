import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Event } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase } from 'lucide-react';

interface Props {
    managedEvents: Event[];
}

export default function PanitiaEventsIndex(props: Props) {
    const { managedEvents = [] } = props;

    return (
        <AppLayout>
            <Head title="Managed Events" />
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <Briefcase className="h-6 w-6" />
                            My Managed Events
                        </CardTitle>
                        <CardDescription>
                            Here are the events you have been assigned to as a Panitia.
                        </CardDescription>
                    </CardHeader>
                </Card>

                <div className="space-y-4">
                    {managedEvents.length > 0 ? (
                        managedEvents.map(event => (
                            <Card key={event.id}>
                                <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div>
                                        <p className="font-semibold">{event.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Organized by {event.organizer}
                                        </p>
                                    </div>
                                    <Button asChild className="w-full sm:w-auto">
                                        <Link href={route('admin.events.show', event.uuid)}>
                                            Manage Registrants
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card>
                            <CardContent className="p-10 text-center text-muted-foreground">
                                You have not been assigned to manage any events yet.
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
