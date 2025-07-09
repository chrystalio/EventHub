"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { Registration } from "@/types"
import { formatDateOnly } from '@/utils/dateUtils';
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Link } from "@inertiajs/react"
import { ChevronDown, ChevronRight } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, CheckCircle2, XCircle } from "lucide-react"

const statusConfig: Record<Registration['status'], string> = {
    approved: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
    rejected: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
    attended: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
    missed: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100",
}

export const registrantColumns: ColumnDef<Registration>[] = [
    {
        id: 'expander',
        header: () => null,
        cell: ({ row }) => {
            return row.original.guest_count > 0 ? (
                <Button variant="ghost" size="icon" onClick={() => row.toggleExpanded()}>
                    {row.getIsExpanded() ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
            ) : null
        },
    },
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
        accessorKey: "registered_at",
        header: "Registered At",
        cell: ({ row }) => {
            const registeredAt = row.original.registered_at;
            return <div>{registeredAt ? formatDateOnly(registeredAt) : 'N/A'}</div>;
        },
    },
    {
        accessorKey: "guest_count",
        header: () => <div className="text-center">Guests</div>,
        cell: ({ row }) => (
            <div className="text-center">{row.original.guest_count > 0 ? row.original.guest_count : '-'}</div>
        )
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.original.status;
            return (
                <Badge variant="outline" className={`capitalize ${statusConfig[status] || ''}`}>
                    {status}
                </Badge>
            )
        }
    },
    {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
            const registration = row.original;

            if (registration.status && registration.status.toLowerCase() === 'pending') {
                return (
                    <div className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem className="cursor-pointer p-0 hover:bg-accent/50 data-[state=open]:bg-accent/50">
                                    <Link
                                        href={route('admin.registrations.approve', registration.id)}
                                        method="patch"
                                        preserveScroll
                                        className="flex w-full items-center px-2 py-1.5 hover:bg-green-50/50"
                                    >
                                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                                        <span>Approve</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer p-0 text-destructive focus:text-destructive hover:bg-accent/50 data-[state=open]:bg-accent/50">
                                    <Link
                                        href={route('admin.registrations.reject', registration.id)}
                                        method="patch"
                                        preserveScroll
                                        className="flex w-full items-center px-2 py-1.5 hover:bg-red-50/50"
                                    >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        <span>Reject</span>
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            }
            return null;
        },
    }
]
