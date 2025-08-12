import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { Registration } from '@/types';
import { TicketIcon } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './columns';

interface Props {
    registrations: Registration[];
}

export default function RegistrationsIndex({ registrations }: Props) {
    return (
        <AppLayout>
            <Head title="My Registrations" />

            <div className="space-y-6 px-4 py-8 lg:px-14">
                <div className="rounded-lg border bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
                            <TicketIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">My Registrations</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Here are all the events you've registered for.</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 sm:p-6 rounded-lg border ">
                    <DataTable columns={columns} data={registrations} />
                </div>
            </div>
        </AppLayout>
    );
}
