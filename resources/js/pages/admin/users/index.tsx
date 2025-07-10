import React, { useEffect, useState } from 'react'
import AppLayout from '@/layouts/app-layout'
import { Head, router, usePage } from '@inertiajs/react'
import { ColumnFiltersState } from '@tanstack/react-table'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { FormDialog } from '@/components/ui/form-dialog'
import { DataTable } from '@/components/ui/data-table'
import { toast } from 'sonner'
import { getColumns } from './columns'
import type { BreadcrumbItem, User } from '@/types'
import { ComboboxMulti } from '@/components/form/combobox-multi';

type RoleFormData = { roles: string[] }

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Users', href: '/admin/users' },
]

function toOption(value: string): { label: string; value: string } {
    return { label: value, value }
}

export default function Index({ users, roles }: { users: User[], roles: string[] }) {
    const { props } = usePage<{ success?: string }>()
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [formData, setFormData] = useState<RoleFormData>({ roles: [] })

    useEffect(() => {
        if (props.success) {
            toast.success("Success", { description: props.success })
        }
    }, [props.success])

    const handleFilterChange = (value: string) => {
        setColumnFilters([{ id: 'name', value }])
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Role Management" />
            <div className="mx-4 mt-4">
                <Card>
                    <CardContent>
                        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <Input
                                type="search"
                                placeholder="Filter users..."
                                value={(columnFilters.find((f) => f.id === 'name')?.value as string) ?? ''}
                                onChange={(e) => handleFilterChange(e.target.value)}
                                className="w-full sm:w-64"
                            />
                        </div>

                        <div className="grid">
                            <div className="overflow-x-auto">
                                <DataTable
                                    columns={getColumns(setEditingUser, setIsDialogOpen, setFormData)}
                                    data={users}
                                    columnFilters={columnFilters}
                                    onColumnFiltersChange={setColumnFilters}
                                />
                            </div>
                        </div>
                        <FormDialog
                            title={`Assign Roles to ${editingUser?.name}`}
                            isOpen={isDialogOpen}
                            onOpenChange={setIsDialogOpen}
                            onSubmit={(e) => {
                                e.preventDefault()
                                if (!editingUser) return

                                setIsSubmitting(true)

                                router.put(`/admin/users/${editingUser.id}/roles`, formData, {
                                    onSuccess: () => {
                                        setIsDialogOpen(false)
                                        setEditingUser(null)
                                    },
                                    onFinish: () => {
                                        setIsSubmitting(false)
                                    }
                                })
                            }}
                            isLoading={isSubmitting}
                        >
                            <div className="space-y-2">
                                <Label>Roles</Label>
                                <ComboboxMulti
                                    value={formData.roles}
                                    onChange={(roles) => setFormData({ roles })}
                                    options={roles.map(toOption)}
                                    placeholder="Select roles..."
                                />
                            </div>
                        </FormDialog>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    )
}
