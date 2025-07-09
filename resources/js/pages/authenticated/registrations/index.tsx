import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { Registration } from '@/types';
import { TicketIcon } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table'; // Import your DataTable
import { columns } from './columns'; // Import your new column definitions

interface Props {
    registrations: Registration[];
}

export default function RegistrationsIndex({ registrations }: Props) {
    return (
        <AppLayout>
            <Head title="My Registrations" />

            <div className="space-y-6 px-4 py-8 lg:px-14">
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                            <TicketIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">My Registrations</h1>
                            <p className="text-sm text-gray-500">Here are all the events you've registered for.</p>
                        </div>
                    </div>
                </div>

                {/* The old table is now replaced with your powerful DataTable component */}
                <div className="p-4 sm:p-6 bg-white rounded-lg border">
                    <DataTable columns={columns} data={registrations} />
                </div>
            </div>
        </AppLayout>
    );
}
