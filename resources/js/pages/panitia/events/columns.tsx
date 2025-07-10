"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Event } from "@/types"
import { Button } from "@/components/ui/button"
import { Link } from "@inertiajs/react"
import { QrCode, Users } from "lucide-react"
import { formatDateTime } from '@/utils/dateUtils';

export const columns: ColumnDef<Event>[] = [
    {
        accessorKey: "name",
        header: "Event",
        cell: ({ row }) => {
            const event = row.original
            return (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{event.name}</span>
                    <span className="text-sm text-gray-500">by {event.organizer}</span>
                </div>
            )
        },
    },
    {
        accessorKey: "start_time",
        header: "Date",
        cell: ({ row }) => {
            return <span>
                {formatDateTime(row.original.start_time, 'MMM dd, yyyy')}
            </span>
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const isUpcoming = new Date(row.original.start_time) > new Date()
            return (
                <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${isUpcoming ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    <span className={isUpcoming ? 'text-green-600' : 'text-gray-600'}>
                        {isUpcoming ? "Upcoming" : "Past"}
                    </span>
                </div>
            )
        },
    },
    {
        accessorKey: "total_registered",
        header: "Registrations",
        cell: ({ row }) => {
            return <span>{row.original.total_registered}</span>
        },
    },
    {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
            const event = row.original
            return (
                <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={route('admin.events.show', event.uuid)}>
                            <Users className="mr-2 h-4 w-4" />
                            Manage
                        </Link>
                    </Button>
                    <Button size="sm" asChild>
                        <Link href={route('panitia.events.scanner', event.uuid)}>
                            <QrCode className="mr-2 h-4 w-4" />
                            Scan
                        </Link>
                    </Button>
                </div>
            )
        },
    },
]
