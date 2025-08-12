import React, { useCallback, useEffect, useState } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getColumns } from './columns';
import type { BreadcrumbItem, Event, Building, Room } from '@/types';
import { PlusCircle } from 'lucide-react';
import { useFlashToast } from '@/hooks/useFlashToast';

interface IndexProps {
    events: Event[];
    buildings: Building[];
    rooms: Room[];
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Events', href: route('admin.events.index') },
];

export default function Index({ events = [], buildings = [], rooms = [], canCreate, canUpdate, canDelete }: IndexProps) {
    useFlashToast();

    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
    const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        description: '',
        organizer: '',
        type: '',
        price: '0',
        start_time: '',
        end_time: '',
        max_guests_per_registration: '0',
        building_id: '',
        room_id: '',
    });

    const updateFilteredRooms = useCallback(() => {
        if (data.building_id) {
            const filtered = rooms.filter(room => room.building_id.toString() === data.building_id);
            setFilteredRooms(filtered);
            if (data.room_id && !filtered.find(room => room.id.toString() === data.room_id)) {
                setData('room_id', '');
            }
        } else {
            setFilteredRooms([]);
            setData('room_id', '');
        }
    }, [data.building_id, data.room_id, rooms, setData]);

    useEffect(() => {
        updateFilteredRooms();
    }, [updateFilteredRooms]);

    const handleCreate = () => {
        setData({
            name: '',
            description: '',
            organizer: '',
            type: '',
            price: '0',
            start_time: '',
            end_time: '',
            max_guests_per_registration: '0',
            building_id: '',
            room_id: '',
        });
        setFilteredRooms([]);
        setEditingEvent(null);
        setDialogMode('create');
    };

    const handleEdit = (event: Event) => {
        reset();

        const formatForInput = (datetime: string) => {
            if (!datetime) return '';
            const localDate = new Date(datetime);
            const year = localDate.getFullYear();
            const month = String(localDate.getMonth() + 1).padStart(2, '0');
            const day = String(localDate.getDate()).padStart(2, '0');
            const hours = String(localDate.getHours()).padStart(2, '0');
            const minutes = String(localDate.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        };

        setData({
            name: event.name,
            description: event.description || '',
            organizer: event.organizer || '',
            type: event.type,
            price: event.price?.toString() || '0',
            start_time: formatForInput(event.start_time),
            end_time: formatForInput(event.end_time),
            max_guests_per_registration: event.max_guests_per_registration?.toString() || '0',
            building_id: event.building.id.toString(),
            room_id: event.room.id.toString(),
        });
        setEditingEvent(event);
        setDialogMode('edit');
    };

    const handleDelete = (event: Event) => {
        setEventToDelete(event);
    };

    const handleConfirmDelete = () => {
        if (!eventToDelete) return;
        destroy(route('admin.events.destroy', eventToDelete.uuid), {
            onSuccess: () => setEventToDelete(null),
        });
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (dialogMode === 'create') {
            post(route('admin.events.store'), {
                onSuccess: () => setDialogMode(null),
            });
        } else if (dialogMode === 'edit' && editingEvent) {
            put(route('admin.events.update', editingEvent.uuid), {
                onSuccess: () => setDialogMode(null),
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Event Management" />
            <div className="m-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <Input
                                type="search"
                                placeholder="Filter by event name..."
                                value={(columnFilters.find((f) => f.id === 'name')?.value as string) ?? ''}
                                onChange={(e) => setColumnFilters([{ id: 'name', value: e.target.value }])}
                                className="w-full sm:w-64"
                            />
                            {canCreate && (
                                <Button onClick={handleCreate} className="w-full sm:w-auto">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add Event
                                </Button>
                            )}
                        </div>
                        <div className="grid">
                            <div className="overflow-x-auto">
                                <DataTable
                                    columns={getColumns({ onEdit: handleEdit, onDelete: handleDelete, canUpdate, canDelete })}
                                    data={events || []}
                                    columnFilters={columnFilters}
                                    onColumnFiltersChange={setColumnFilters}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <FormDialog
                title={dialogMode === 'create' ? 'Add New Event' : `Edit Event: ${editingEvent?.name}`}
                isOpen={dialogMode !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDialogMode(null);
                        reset();
                    }
                }}
                onSubmit={handleSubmit}
                isLoading={processing}>
                {errors.room_id && errors.room_id.includes('already booked') && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">
                            <strong>Room Conflict:</strong> This room is already <b>booked</b> during the selected
                            time.
                            Please choose a different time or room.
                        </p>
                    </div>
                )}
                {/* --- REFACTORED FORM LAYOUT --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="name">Event Name</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                        />
                        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                        />
                        {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="organizer">Organizer</Label>
                        <Input
                            id="organizer"
                            value={data.organizer}
                            onChange={(e) => setData('organizer', e.target.value)}
                            required
                        />
                        {errors.organizer && <p className="text-sm text-red-500">{errors.organizer}</p>}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label>Event Type</Label>
                        <p className="text-sm text-muted-foreground">
                            Choose the registration method for this event.
                        </p>
                        <RadioGroup
                            value={data.type}
                            onValueChange={(value) => setData('type', value)}
                            className="space-y-1 pt-2"
                        >
                            <div className="flex items-center space-x-3 p-3 rounded-md border has-[input:checked]:border-primary">
                                <RadioGroupItem value="free" id="type-free" />
                                <Label htmlFor="type-free" className="font-normal cursor-pointer w-full">
                                    <span className="font-semibold block">Free</span>
                                    <span className="text-muted-foreground text-xs">Anyone can register instantly. No approval needed.</span>
                                </Label>
                            </div>
                            <div className="flex items-center space-x-3 p-3 rounded-md border has-[input:checked]:border-primary">
                                <RadioGroupItem value="private" id="type-private" />
                                <Label htmlFor="type-private" className="font-normal cursor-pointer w-full">
                                    <span className="font-semibold block">Private (Requires Approval)</span>
                                    <span className="text-muted-foreground text-xs">Registrants must be manually approved by an admin.</span>
                                </Label>
                            </div>
                            <div className="flex items-center space-x-3 p-3 rounded-md border has-[input:checked]:border-primary">
                                <RadioGroupItem value="paid" id="type-paid" />
                                <Label htmlFor="type-paid" className="font-normal cursor-pointer w-full">
                                    <span className="font-semibold block">Paid</span>
                                    <span className="text-muted-foreground text-xs">Registrants must complete payment to register.</span>
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {data.type === 'paid' && (
                        <div className="space-y-2 md:col-span-2 animate-in fade-in-0 duration-300">
                            <Label htmlFor="price">Ticket Price (IDR)</Label>
                            <Input
                                id="price"
                                type="number"
                                placeholder="e.g., 50000"
                                min="0"
                                value={data.price}
                                onChange={(e) => setData('price', e.target.value)}
                                required
                            />
                            {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="start_time">Start Time</Label>
                        <Input
                            id="start_time"
                            type="datetime-local"
                            value={data.start_time}
                            onChange={(e) => setData('start_time', e.target.value)}
                            required
                        />
                        {errors.start_time && <p className="text-sm text-red-500">{errors.start_time}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="end_time">End Time</Label>
                        <Input
                            id="end_time"
                            type="datetime-local"
                            value={data.end_time}
                            onChange={(e) => setData('end_time', e.target.value)}
                            required
                        />
                        {errors.end_time && <p className="text-sm text-red-500">{errors.end_time}</p>}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="max_guests_per_registration">Max Guests per Registration</Label>
                        <Input
                            id="max_guests_per_registration"
                            type="number"
                            placeholder="0"
                            min="0"
                            value={data.max_guests_per_registration}
                            onChange={(e) => setData('max_guests_per_registration', e.target.value)}
                        />
                        {errors.max_guests_per_registration && (
                            <p className="text-sm text-red-500">{errors.max_guests_per_registration}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="building_id">Building</Label>
                        <Select value={data.building_id} onValueChange={(value) => setData('building_id', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select building" />
                            </SelectTrigger>
                            <SelectContent>
                                {(buildings || []).map((building) => (
                                    <SelectItem key={building.id} value={building.id.toString()}>
                                        {building.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.building_id && <p className="text-sm text-red-500">{errors.building_id}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="room_id">Room</Label>
                        <Select value={data.room_id} onValueChange={(value) => setData('room_id', value)}
                                disabled={!data.building_id}>
                            <SelectTrigger>
                                <SelectValue
                                    placeholder={data.building_id ? "Select room" : "Select building first"}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredRooms.map((room) => (
                                    <SelectItem key={room.id} value={room.id.toString()}>
                                        {room.code} - {room.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.room_id && (
                            <p className="text-sm text-red-500">{errors.room_id}</p>
                        )}
                    </div>
                </div>
            </FormDialog>

            <ConfirmDialog
                isOpen={!!eventToDelete}
                onOpenChange={() => setEventToDelete(null)}
                title={`Delete Event: ${eventToDelete?.name}`}
                description="This action cannot be undone. This will permanently delete the event."
                onConfirm={handleConfirmDelete}
                isLoading={processing}
            />
        </AppLayout>
    );
}
