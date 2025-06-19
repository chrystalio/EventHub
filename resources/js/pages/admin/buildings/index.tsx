import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { ColumnFiltersState } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { FormDialog } from '@/components/ui/form-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Label } from '@/components/ui/label';
import { getColumns } from './columns';
import type { BreadcrumbItem, Building } from '@/types';
import { PlusCircle } from 'lucide-react';
import { useFlashToast } from '@/hooks/useFlashToast';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Buildings', href: route('admin.buildings.index') },
];

export default function Index({ buildings }: { buildings: Building[] }) {
    useFlashToast();

    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null);

    const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
    const [buildingToDelete, setBuildingToDelete] = useState<Building | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        code: '',
        name: '',
    });

    const handleCreate = () => {
        reset();
        setDialogMode('create');
    };

    const handleEdit = (building: Building) => {
        reset();
        setData({ code: building.code, name: building.name });
        setEditingBuilding(building);
        setDialogMode('edit');
    };

    const handleDelete = (building: Building) => {
        setBuildingToDelete(building);
    };

    const handleConfirmDelete = () => {
        if (!buildingToDelete) return;
        destroy(route('admin.buildings.destroy', buildingToDelete.id), {
            onSuccess: () => setBuildingToDelete(null), // Close the dialog on success
        });
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (dialogMode === 'create') {
            post(route('admin.buildings.store'), {
                onSuccess: () => setDialogMode(null),
            });
        } else if (dialogMode === 'edit' && editingBuilding) {
            put(route('admin.buildings.update', editingBuilding.id), {
                onSuccess: () => setDialogMode(null),
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Building Management" />

            <div className="m-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <Input
                                type="search"
                                placeholder="Filter by building name..."
                                value={(columnFilters.find((f) => f.id === 'name')?.value as string) ?? ''}
                                onChange={(e) => setColumnFilters([{ id: 'name', value: e.target.value }])}
                                className="w-full sm:w-64"
                            />
                            <Button onClick={handleCreate} className="w-full sm:w-auto">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Building
                            </Button>
                        </div>

                        <DataTable
                            columns={getColumns({ onEdit: handleEdit, onDelete: handleDelete })}
                            data={buildings}
                            columnFilters={columnFilters}
                            onColumnFiltersChange={setColumnFilters}
                        />
                    </CardContent>
                </Card>
            </div>
            <FormDialog
                title={dialogMode === 'create' ? 'Add New Building' : `Edit Building: ${editingBuilding?.name}`}
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
                        <Label htmlFor="code">Building Code</Label>
                        <Input
                            id="code"
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value)}
                            required
                        />
                        {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="name">Building Name</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                        />
                        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                    </div>
                </div>
            </FormDialog>
            <ConfirmDialog
                isOpen={!!buildingToDelete}
                onOpenChange={() => setBuildingToDelete(null)}
                title={`Delete Building: ${buildingToDelete?.name}`}
                description="This action cannot be undone. This will permanently delete the building."
                onConfirm={handleConfirmDelete}
                isLoading={processing}
            />
        </AppLayout>
    );
}
