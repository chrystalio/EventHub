"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { Registration } from "@/types"
import { formatDateTime } from "@/utils/dateUtils"
import { Badge } from "@/components/ui/badge"

export const registrantColumns: ColumnDef<Registration>[] = [
    {
        accessorKey: "user.name",
        header: "Registrant",
        cell: ({ row }) => {
            const user = row.original.user;
            return (
                <div>
                    <div className="font-medium">{user?.name}</div>
                    <div className="text-xs text-muted-foreground">{user?.email}</div>
                </div>
            )
        }
    },
    {
        accessorKey: "registeredAt",
        header: "Registered At",
        cell: ({ row }) => {
            const registeredAt = row.original.registered_at;
            return <div>{registeredAt ? formatDateTime(registeredAt) : 'N/A'}</div>;
        },
    },
    {
        accessorKey: "guestCount",
        header: "Guests Count",
        cell: ({ row }) => (
            <div className="text-center">{1 + row.original.guest_count}</div>
        )
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
            <Badge variant="outline" className="capitalize">{row.original.status}</Badge>
        )
    },
]
