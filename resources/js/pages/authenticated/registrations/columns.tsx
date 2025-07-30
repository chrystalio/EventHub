"use client"

import { Column, ColumnDef } from "@tanstack/react-table"
import type { Registration } from "@/types"
import { formatDateTime } from "@/utils/dateUtils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Link } from "@inertiajs/react"
import { ArrowUpDown } from "lucide-react"

const SortableHeader = <TData, TValue>({ column, title }: { column: Column<TData, TValue>, title: string }) => {
    return (
        <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
            {title}
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    )
}

const statusConfig: Record<Registration['status'], { bg: string, text: string }> = {
    approved: { bg: 'bg-green-100', text: 'text-green-800' },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    pending_payment: { bg: 'bg-yellow-200', text: 'text-yellow-900' },
    rejected: { bg: 'bg-red-100', text: 'text-red-800' },
    attended: { bg: 'bg-blue-100', text: 'text-blue-800' },
    missed: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

export const columns: ColumnDef<Registration>[] = [
    {
        accessorKey: "event.name",
        header: ({ column }) => <SortableHeader column={column} title="Event" />,
        cell: ({ row }) => {
            const registration = row.original;
            return (
                <div className="font-medium text-gray-900">
                    <div>{registration.event.name}</div>
                    <div className="text-sm text-gray-500 font-normal">
                        {registration.event.building.name} - {registration.event.room.name}
                    </div>
                </div>
            )
        },
    },
    {
        accessorKey: "event.start_time",
        header: ({ column }) => <SortableHeader column={column} title="Date & Time" />,
        cell: ({ row }) => <div>{formatDateTime(row.original.event.start_time)}</div>,
    },
    {
        accessorKey: "guest_count",
        header: () => <div className="text-center">Attendees</div>,
        cell: ({ row }) => <div className="text-center">{1 + row.original.guest_count}</div>,
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.original.status;
            return (
                <Badge className={`capitalize ${statusConfig[status]?.bg || ''} ${statusConfig[status]?.text || ''}`}>
                    {status}
                </Badge>
            )
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const registration = row.original;
            if (registration.status === 'pending_payment') {
                return (
                    <div className="text-right">
                        {/* Using the default primary button style */}
                        <Button
                            size="sm"
                            asChild
                            className="bg-amber-500 text-white hover:bg-amber-600 focus-visible:ring-amber-400"
                        >
                            <Link href={route('transactions.show', registration.order_id)}>
                                Pay Now
                            </Link>
                        </Button>
                    </div>
                );
            }
            return (
                <div className="text-right">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={route('registrations.show', registration.uuid)}>Details</Link>
                    </Button>
                </div>
            )
        },
    },
]
