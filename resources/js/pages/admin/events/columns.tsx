import type { ColumnDef } from '@tanstack/react-table';
import type { Event } from '@/types';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PencilIcon, LucideTrash, EyeIcon } from 'lucide-react';
import { formatDateTime } from '@/utils/dateUtils';
import { Badge } from '@/components/ui/badge';

interface GetColumnsProps {
    onEdit: (event: Event) => void;
    onDelete: (event: Event) => void;
}

export function getColumns({ onEdit, onDelete }: GetColumnsProps): ColumnDef<Event>[] {
    return [
        {
            accessorKey: 'name',
            header: 'Event Name',
        },
        {
            id: 'room',
            header: 'Room',
            cell: ({ row }) => {
                const event = row.original;
                return `${event.building.name} - ${event.room.name}`;
            },
        },
        {
            id: 'schedule',
            header: 'Schedule',
            cell: ({ row }) => {
                const startTime = formatDateTime(row.original.start_time);
                const endTime = formatDateTime(row.original.end_time);

                const startDate = startTime.split(',')[0];
                const endDate = endTime.split(',')[0];

                if (startDate === endDate) {
                    const timeOnly = (datetime: string) => datetime.split(', ')[1];
                    return (
                        <div className="space-y-1">
                            <div className="text-sm font-medium">{startDate}</div>
                            <div className="text-xs text-muted-foreground">
                                {timeOnly(startTime)} - {timeOnly(endTime)}
                            </div>
                        </div>
                    );
                } else {
                    return (
                        <div className="space-y-1">
                            <div className="text-sm font-medium">{startTime}</div>
                            <div className="text-xs text-muted-foreground">to {endTime}</div>
                        </div>
                    );
                }
            },
        },
        {
            id: 'type',
            'header': 'Type',
            cell: ({ row }) => {
                const type = row.original.type;
                const typeLabels: Record<string, string> = {
                    free: 'Free',
                    paid: 'Paid',
                    private: 'Private',
                };
                return (
                    <Badge variant="outline" className="capitalize">
                        {typeLabels[type] || 'Unknown'}
                    </Badge>
                );
            },
        },

        {
            id: 'organizer',
            header: 'Organizer',
            cell: ({ row }) => row.original.organizer || '-',
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const event = row.original;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem className="cursor-pointer" onClick={() => window.open(route('admin.events.show', event.uuid), '_blank')}>
                            <EyeIcon className="mr-2 h-4 w-4" />
                            View Detail
                        </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => onEdit(event)}>
                                <PencilIcon className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="cursor-pointer text-red-500 focus:text-red-500"
                                onClick={() => onDelete(event)}>
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
