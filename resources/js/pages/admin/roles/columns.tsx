import type { Role } from '@/types'
import { ColumnDef } from '@tanstack/react-table'
import { LucideTrash, MoreHorizontal, PencilIcon, ShieldPlus } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem, DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';

export const getColumns = (
    setEditingRole: (role: Role) => void,
    setDialogOpen: (open: boolean) => void,
    setRoleToDelete: (role: Role | null) => void,
    setDeleteDialogOpen: (open: boolean) => void,
    handleManagePermissions: (role: Role) => void
): ColumnDef<Role>[] => [
    {
        accessorKey: 'name',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => <div className="capitalize">{row.getValue('name')}</div>,
    },
    {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
            const role = row.original;
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleManagePermissions(role)}>
                            <ShieldPlus className="h-4 w-4 mr-2" />
                            Manage Permissions
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => {
                            setEditingRole(role);
                            setDialogOpen(true);
                        }}>
                            <PencilIcon className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => {
                                setRoleToDelete(role)
                                setDeleteDialogOpen(true)
                            }}
                            className="text-red-500"
                        >
                            <LucideTrash className="h-4 w-4 mr-2" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
