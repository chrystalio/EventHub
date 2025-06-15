import type { ColumnDef } from '@tanstack/react-table';
import type { Building } from '@/types';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PencilIcon, LucideTrash } from 'lucide-react';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';


interface GetColumnsProps {
    onEdit: (building: Building) => void;
    onDelete: (building: Building) => void;
}

export function getColumns({ onEdit, onDelete }: GetColumnsProps): ColumnDef<Building>[] {
    return [
        {
            accessorKey: 'code',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Code" />
            ),
        },
        {
            accessorKey: 'name',
            header: 'Name',
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const building = row.original;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem className="cursor-pointer" onClick={() => onEdit(building)}>
                                <PencilIcon className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="cursor-pointer text-red-500 focus:text-red-500"
                                onClick={() => onDelete(building)}
                            >
                                <LucideTrash className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];
}
