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
import { getColumns } from './columns';
import type { BreadcrumbItem, Room, Building } from '@/types';
import { PlusCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFlashToast } from '@/hooks/useFlashToast';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Rooms', href: route('admin.rooms.index') },
];

export default function Index({ rooms, buildings }: { rooms: Room[], buildings: Building[] }) {
    useFlashToast();

    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        code: '',
        name: '',
        building_id: '',
    });

    const handleCreate = () => {
        reset();
        setDialogMode('create');
    };

    const handleEdit = (room: Room) => {
        reset();
        setData({ code: room.code, name: room.name, building_id: room.building_id.toString() });
        setEditingRoom(room);
        setDialogMode('edit');
    };

    const handleDelete = (room: Room) => {
        setRoomToDelete(room);
    };

    const handleConfirmDelete = () => {
        if (!roomToDelete) return;
        destroy(route('admin.rooms.destroy', roomToDelete.id), {
            onSuccess: () => setRoomToDelete(null),
        });
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (dialogMode === 'create') {
            post(route('admin.rooms.store'), {
                onSuccess: () => setDialogMode(null),
            });
        } else if (dialogMode === 'edit' && editingRoom) {
            put(route('admin.rooms.update', editingRoom.id), {
                onSuccess: () => setDialogMode(null),
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Room Management" />

            <div className="m-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <Input
                                type="search"
                                placeholder="Filter by room name..."
                                value={(columnFilters.find((f) => f.id === 'name')?.value as string) ?? ''}
                                onChange={(e) => setColumnFilters([{ id: 'name', value: e.target.value }])}
                                className="w-full sm:w-64"
                            />
                            <Button onClick={handleCreate} className="w-full sm:w-auto">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Room
                            </Button>
                        </div>

                        <div className="grid">
                            <div className="overflow-x-auto">
                                <DataTable
                                    columns={getColumns({ onEdit: handleEdit, onDelete: handleDelete })}
                                    data={rooms}
                                    columnFilters={columnFilters}
                                    onColumnFiltersChange={setColumnFilters}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <FormDialog
                title={dialogMode === 'create' ? 'Add New Room' : `Edit Room: ${editingRoom?.name}`}
                isOpen={dialogMode !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDialogMode(null);
                        reset();
                    }
                }}
                onSubmit={handleSubmit}
                isLoading={processing}
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="building_id">Building</Label>
                        <Select value={data.building_id} onValueChange={(value) => setData('building_id', value)}>
                            <SelectTrigger id="building_id">
                                <SelectValue placeholder="Select a building..." />
                            </SelectTrigger>
                            <SelectContent>
                                {buildings.map((building) => (
                                    <SelectItem key={building.id} value={building.id.toString()}>
                                        {building.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.building_id && <p className="text-sm text-red-500">{errors.building_id}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="code">Room Code</Label>
                        <Input id="code" value={data.code} onChange={(e) => setData('code', e.target.value)} required />
                        {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="name">Room Name</Label>
                        <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                    </div>
                </div>
            </FormDialog>

            <ConfirmDialog
                isOpen={!!roomToDelete}
                onOpenChange={() => setRoomToDelete(null)}
                title={`Delete Room: ${roomToDelete?.name}`}
                description="This action cannot be undone. This will permanently delete this room."
                onConfirm={handleConfirmDelete}
                isLoading={processing}
            />
        </AppLayout>
    );
}
