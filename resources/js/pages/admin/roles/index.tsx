import React, { useState } from 'react';
import { usePage } from '@inertiajs/react'
import { useEffect } from 'react'
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { ColumnFiltersState } from '@tanstack/react-table';
import { getColumns } from './columns'
import { DataTable } from '@/components/ui/data-table'
import type { BreadcrumbItem, Role, RolePermissionPageProps } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormDialog } from '@/components/ui/form-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from "sonner"
import { router } from '@inertiajs/react';
import PermissionDialog from '@/components/dialogs/permission-dialog';
import axios from 'axios';



const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Roles',
        href: '/admin/roles',
    },
];

export default function Index({ roles }: { roles: Role[] }) {
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [selectedRole, setSelectedRole] = useState<Role | null>(null)
    const [permissionsData, setPermissionsData] = useState<RolePermissionPageProps | null>(null)
    const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false)


    const { props } = usePage<{ success?: string }>();

    useEffect(() => {
        setIsPermissionsDialogOpen(true);
        if (props.success) {
            toast.success("Success", {
                description: props.success,
            });
        }
    }, [props.success]);


    const handleManagePermissions = (role: Role) => {
        console.log('Fetching permissions for role:', role)
        axios.get(`/admin/roles/${role.id}/permissions`)
            .then((res) => {
                const { role, permissions, assigned } = res.data
                setSelectedRole(role)
                setPermissionsData({ role, permissions, assigned })
                setIsPermissionsDialogOpen(true)
            })
            .catch((error) => {
                console.error('Error fetching permissions:', error)
                toast.error("Failed to fetch permissions", {
                    description: "There was an error retrieving the permissions for this role.",
                })
            })

    }


    const handleFilterChange = (value: string) => {
        setColumnFilters([{ id: 'name', value }])
    }
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles List" />
            <div className="mx-4 mt-4">
                <Card>
                    <CardContent>
                        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <Input
                                type="search"
                                placeholder="Filter roles..."
                                value={(columnFilters.find((f) => f.id === 'name')?.value as string) ?? ''}
                                onChange={(e) => handleFilterChange(e.target.value)}
                                className="w-full sm:w-64"
                            />
                            {isPermissionsDialogOpen && permissionsData && selectedRole && (
                                <PermissionDialog
                                    role={permissionsData.role}
                                    permissions={permissionsData.permissions}
                                    assigned={permissionsData.assigned}
                                    onClose={() => setIsPermissionsDialogOpen(false)}
                                />
                            )}

                            <FormDialog
                                title={editingRole ? "Edit Role" : "Create Role"}
                                triggerText="Create Role"
                                isLoading={isSubmitting}
                                isOpen={isDialogOpen}
                                onOpenChange={(open) => {
                                    if (!open) setEditingRole(null)
                                    setIsDialogOpen(open)
                                }}
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    setIsSubmitting(true)

                                    const formData = new FormData(e.currentTarget)
                                    const name = formData.get('name') as string

                                    if (editingRole) {
                                        router.put(`/admin/roles/${editingRole.id}`, { name }, {
                                            onSuccess: () => {
                                                toast.success("Role updated", {
                                                    description: "Role has been updated.",
                                                })
                                                setEditingRole(null)
                                                setIsDialogOpen(false)
                                            },
                                            onError: (errors) => {
                                                toast.error("Failed to update role", {
                                                    description: errors.name ?? "There was an error updating the role.",
                                                })
                                            },
                                            onFinish: () => setIsSubmitting(false)
                                        })
                                    } else {
                                        router.post('/admin/roles', { name }, {
                                            onSuccess: () => {
                                                toast.success("Role created", {
                                                    description: "A new role has been added.",
                                                })
                                                setIsDialogOpen(false)
                                            },
                                            onError: (errors) => {
                                                toast.error("Failed to create role", {
                                                    description: errors.name ?? "There was an error creating the role.",
                                                })
                                            },
                                            onFinish: () => setIsSubmitting(false)
                                        })
                                    }
                                }}
                                >
                                <div className="space-y-2">
                                    <Label htmlFor="name">Role Name</Label>
                                    <Input
                                        name="name"
                                        id="name"
                                        placeholder="e.g. Admin"
                                        defaultValue={editingRole?.name ?? ""}
                                    />
                                </div>
                            </FormDialog>
                            <ConfirmDialog
                                isOpen={isDeleteDialogOpen}
                                onOpenChange={setIsDeleteDialogOpen}
                                title="Delete Role"
                                description={`Are you sure you want to delete the role "${roleToDelete?.name}"? This action cannot be undone.`}
                                isLoading={isDeleting}
                                onConfirm={() => {
                                    if (!roleToDelete) return
                                    setIsDeleting(true)

                                    router.delete(`/admin/roles/${roleToDelete.id}`, {
                                        onSuccess: () => {
                                            toast.success("Role deleted", {
                                                description: "The role has been removed.",
                                            })

                                            setIsDeleteDialogOpen(false)
                                            setRoleToDelete(null)

                                            router.reload({ only: ['roles'] })
                                        },
                                        onError: () => {
                                            toast.error("Failed to delete role", { description: "An error occurred while deleting the role." })
                                        },
                                        onFinish: () => setIsDeleting(false),
                                    })
                                }}
                            />
                        </div>
                        {Array.isArray(roles) && (
                            <DataTable
                                columns={getColumns(
                                    setEditingRole,
                                    setIsDialogOpen,
                                    setRoleToDelete,
                                    setIsDeleteDialogOpen,
                                    handleManagePermissions
                                )}
                                data={roles}
                                columnFilters={columnFilters}
                                onColumnFiltersChange={setColumnFilters}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
