import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { ColumnFiltersState } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { getColumns } from './columns';
import type { BreadcrumbItem, Building } from '@/types';
import { PlusCircle } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Buildings', href: route('admin.buildings.index') },
];

// The main page component
export default function Index({ buildings }: { buildings: Building[] }) {
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const handleEdit = (building: Building) => {
        console.log('Editing building:', building);
    };

    const handleDelete = (building: Building) => {
        console.log('Deleting building:', building);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Building Management" />
            <div className="m-4">
                <Card>
                    <CardContent>
                        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <Input
                                type="search"
                                placeholder="Filter by building name..."
                                value={(columnFilters.find((f) => f.id === 'name')?.value as string) ?? ''}
                                onChange={(e) => setColumnFilters([{ id: 'name', value: e.target.value }])}
                                className="w-full sm:w-64"
                            />
                            <Button onClick={() => console.log('Add new building')}>
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
        </AppLayout>
    );
}
