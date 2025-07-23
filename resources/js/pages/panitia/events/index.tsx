import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Event } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './columns';

interface Props {
    managedEvents: Event[];
}

export default function PanitiaEventsIndex({ managedEvents = [] }: Props) {
    return (
        <AppLayout>
            <Head title="Managed Events" />
            <div className="space-y-6 p-4 sm:p-6 lg:p-8">
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100">
                            <Briefcase className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Managed Events</h1>
                            <p className="text-sm text-gray-600">
                                Here are the events you have been assigned to as a Panitia.
                            </p>
                        </div>
                    </div>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Event List</CardTitle>
                        <CardDescription>
                            You can sort and filter the events you manage.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid">
                            <div className="overflow-x-auto">
                                <DataTable columns={columns} data={managedEvents} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
