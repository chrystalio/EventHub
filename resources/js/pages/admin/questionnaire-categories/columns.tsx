import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import type { QuestionnaireCategory } from '@/types';

interface ColumnsProps {
    onEdit: (questionnaire: QuestionnaireCategory) => void;
    onDelete: (questionnaire: QuestionnaireCategory) => void;
}

export function getColumns({ onEdit, onDelete }: ColumnsProps): ColumnDef<QuestionnaireCategory>[] {
    return [
        {
            accessorKey: 'title',
            header: 'Title',
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
            cell: ({ row }) => (
                <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(row.original)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(row.original)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];
}
