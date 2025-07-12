import type { ColumnDef } from '@tanstack/react-table';
import type { QuestionnaireCategory } from '@/types';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, PencilIcon, LucideTrash } from 'lucide-react';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Link } from '@inertiajs/react';

interface GetColumnsProps {
    onEdit: (questionnaire: QuestionnaireCategory) => void;
    onDelete: (questionnaire: QuestionnaireCategory) => void;
}

export function getColumns({ onEdit, onDelete }: GetColumnsProps): ColumnDef<QuestionnaireCategory>[] {
    return [
        {
            accessorKey: 'title',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Title" />
            ),
        },
        {
            accessorKey: 'description',
            header: 'Description',
        },
        {
            accessorKey: 'questions_count',
            header: 'Questions',
        },
        {
            accessorKey: 'is_active',
            header: 'Active',
            cell: ({ row }) => (row.original.is_active ? 'Yes' : 'No'),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const questionnaire = row.original;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem className="cursor-pointer" asChild>
                                <Link href={route('admin.questionnaire-categories.show', questionnaire.id)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => onEdit(questionnaire)}>
                                <PencilIcon className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="cursor-pointer text-red-500 focus:text-red-500"
                                onClick={() => onDelete(questionnaire)}
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
