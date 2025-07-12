import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { ColumnFiltersState } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { FormDialog } from '@/components/ui/form-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from "@/components/ui/switch";
import { getColumns } from './columns';
import type { BreadcrumbItem, QuestionnaireCategory } from '@/types';
import { PlusCircle } from 'lucide-react';
import { useFlashToast } from '@/hooks/useFlashToast';

interface IndexProps {
    questionnaireCategories: QuestionnaireCategory[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Questionnaire Categories', href: route('admin.questionnaire-categories.index') },
];

export default function Index({ questionnaireCategories = [] }: IndexProps) {
    useFlashToast();

    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null);
    const [editingQuestionnaire, setEditingQuestionnaire] = useState<QuestionnaireCategory | null>(null);
    const [questionnaireToDelete, setQuestionnaireToDelete] = useState<QuestionnaireCategory | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        title: '',
        description: '',
        is_active: false,
    });

    const handleCreate = () => {
        setData({
            title: '',
            description: '',
            is_active: false,
        });
        setEditingQuestionnaire(null);
        setDialogMode('create');
    };

    const handleEdit = (questionnaire: QuestionnaireCategory) => {
        reset();
        setData({
            title: questionnaire.title,
            description: questionnaire.description || '',
            is_active: questionnaire.is_active,
        });
        setEditingQuestionnaire(questionnaire);
        setDialogMode('edit');
    };

    const handleDelete = (questionnaire: QuestionnaireCategory) => {
        setQuestionnaireToDelete(questionnaire);
    };

    const handleConfirmDelete = () => {
        if (!questionnaireToDelete) return;
        destroy(route('admin.questionnaire-categories.destroy', questionnaireToDelete.id), {
            onSuccess: () => setQuestionnaireToDelete(null),
        });
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (dialogMode === 'create') {
            post(route('admin.questionnaire-categories.store'), {
                onSuccess: () => setDialogMode(null),
            });
        } else if (dialogMode === 'edit' && editingQuestionnaire) {
            put(route('admin.questionnaire-categories.update', editingQuestionnaire.id), {
                onSuccess: () => setDialogMode(null),
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Questionnaire Category Management" />

            <div className="m-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <Input
                                type="search"
                                placeholder="Filter by title..."
                                value={(columnFilters.find((f) => f.id === 'title')?.value as string) ?? ''}
                                onChange={(e) => setColumnFilters([{ id: 'title', value: e.target.value }])}
                                className="w-full sm:w-64"
                            />
                            <Button onClick={handleCreate} className="w-full sm:w-auto">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Questionnaire Category
                            </Button>
                        </div>
                        <div className="grid">
                            <div className="overflow-x-auto">
                                <DataTable
                                    columns={getColumns({ onEdit: handleEdit, onDelete: handleDelete })}
                                    data={questionnaireCategories || []}
                                    columnFilters={columnFilters}
                                    onColumnFiltersChange={setColumnFilters}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <FormDialog
                title={dialogMode === 'create' ? 'Add New Questionnaire Category' : `Edit Questionnaire Category: ${editingQuestionnaire?.title}`}
                isOpen={dialogMode !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDialogMode(null);
                        reset();
                    }
                }}
                onSubmit={handleSubmit}
                isLoading={processing}>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            required
                        />
                        {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                        />
                        {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="is_active"
                                checked={data.is_active}
                                onCheckedChange={(checked) => setData('is_active', checked)}
                            />
                            <Label htmlFor="is_active">Active</Label>
                        </div>
                        {errors.is_active && <p className="text-sm text-red-500">{errors.is_active}</p>}
                    </div>
                </div>
            </FormDialog>

            <ConfirmDialog
                isOpen={!!questionnaireToDelete}
                onOpenChange={() => setQuestionnaireToDelete(null)}
                title={`Delete Questionnaire Category: ${questionnaireToDelete?.title}`}
                description="This action cannot be undone. This will permanently delete the questionnaire category."
                onConfirm={handleConfirmDelete}
                isLoading={processing}
            />
        </AppLayout>
    );
}
