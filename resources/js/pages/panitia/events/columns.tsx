"use client"

import { Column, ColumnDef } from '@tanstack/react-table';
import { Event } from "@/types"
import { Button } from "@/components/ui/button"
import { Link } from "@inertiajs/react"
import { ArrowUpDown, QrCode, Users } from 'lucide-react';
import { formatDateTime } from '@/utils/dateUtils';

const SortableHeader = <TData, TValue>({ column, title }: { column: Column<TData, TValue>, title: string }) => {
    return (
        <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            {title}
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    )
}

export const columns: ColumnDef<Event>[] = [
    {
        accessorKey: "name",
        header: "Event",
        cell: ({ row }) => {
            const event = row.original
            return (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{event.name}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">by {event.organizer}</span>
                </div>
            )
        },
    },
    {
        accessorKey: "start_time",
        header: ({ column }) => <SortableHeader column={column} title="Date & Time" />,
        cell: ({ row }) => {
            const startDate = new Date(row.original.start_time);
            const endDate = new Date(row.original.end_time);

            const optionsDate: Intl.DateTimeFormatOptions = {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            };

            const optionsTime: Intl.DateTimeFormatOptions = {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            };

            const isSameDay = startDate.toDateString() === endDate.toDateString();

            if (isSameDay) {
                const datePart = startDate.toLocaleDateString([], optionsDate);
                const startTimePart = startDate.toLocaleTimeString([], optionsTime);
                const endTimePart = endDate.toLocaleTimeString([], optionsTime);

                return (
                    <div className="flex flex-col">
                        <span>{datePart}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                        {startTimePart} - {endTimePart}
                    </span>
                    </div>
                );
            } else {
                const fullStartDate = `${startDate.toLocaleDateString([], optionsDate)} at ${startDate.toLocaleTimeString([], optionsTime)}`;
                const fullEndDate = `${endDate.toLocaleDateString([], optionsDate)} at ${endDate.toLocaleTimeString([], optionsTime)}`;

                return (
                    <div className="flex flex-col text-sm">
                        <span>From: {fullStartDate}</span>
                        <span className="text-gray-500 dark:text-gray-400">To: {fullEndDate}</span>
                    </div>
                );
            }
        },
    },
    {
        accessorKey: "start_time",
        header: ({ column }) => <SortableHeader column={column} title="Status" />,
        cell: ({ row }) => {
            const startTime = new Date(row.original.start_time);
            const endTime = new Date(row.original.end_time);
            const now = new Date();

            let statusText: string;
            let dotClass: string;
            let textClass: string;

            if (now >= startTime && now <= endTime) {
                statusText = "Active";
                dotClass = "bg-green-500 animate-pulse";
                textClass = "text-green-600 dark:text-green-400";
            } else if (now < startTime) {
                statusText = "Upcoming";
                dotClass = "bg-blue-500";
                textClass = "text-blue-600 dark:text-blue-400";
            } else {
                statusText = "Past";
                dotClass = "bg-gray-400 dark:bg-gray-600";
                textClass = "text-gray-600 dark:text-gray-300";
            }

            return (
                <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${dotClass}`}></span>
                    <span className={textClass}>{statusText}</span>
                </div>
            )
        },
    },
    {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
            const event = row.original;
            const now = new Date();
            const startTime = new Date(event.start_time);
            const endTime = new Date(event.end_time);
            const scanWindowStart = new Date(startTime.getTime() - 2 * 60 * 60 * 1000);
            const scanWindowEnd = new Date(startTime.getTime() + 1 * 60 * 60 * 1000);
            const showScanButton = now >= scanWindowStart && now <= scanWindowEnd;
            const isPastEvent = now > endTime;
            const manageButtonText = isPastEvent ? 'Details' : 'Manage';

            return (
                <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={route('admin.events.show', event.uuid)}>
                            <Users className="mr-2 h-4 w-4" />
                            {manageButtonText}
                        </Link>
                    </Button>
                    {showScanButton && (
                        <Button size="sm" asChild>
                            <Link href={route('panitia.events.scanner', event.uuid)}>
                                <QrCode className="mr-2 h-4 w-4" />
                                Scan
                            </Link>
                        </Button>
                    )}
                </div>
            )
        },
    },
]
