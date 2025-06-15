import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox'

import { useForm, router } from '@inertiajs/react'
import type { Role, Permission } from '@/types'

interface Props {
    role: Role
    permissions: Record<string, Permission[]>
    assigned: string[]
    onClose: () => void
}

export default function PermissionDialog({ role, permissions, assigned, onClose }: Props) {
    const [selected, setSelected] = useState<string[]>(assigned)

    const { processing } = useForm()

    const toggle = (name: string) => {
        setSelected(prev =>
            prev.includes(name)
                ? prev.filter(p => p !== name)
                : [...prev, name]
        )
    }

    const handleSubmit = () => {
        router.post(`/admin/roles/${role.id}/permissions`,
            { permissions: selected },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Permissions updated')
                    onClose()
                },
                onError: () => {
                    toast.error('Failed to update permissions')
                },
            }
        )
    }



    console.log('Rendering PermissionDialog with:', { permissions });
    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>
                        Manage Permissions for <span className="text-primary">{role.name}</span>
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="mt-4 h-[400px] space-y-6 pr-4">
                    {Object.keys(permissions).length === 0 ? (
                        <p className="text-muted-foreground text-sm">No permissions available.</p>
                    ) : (
                        Object.entries(permissions)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([group, perms]) => (
                                <div key={group}>
                                    <h3 className="my-3 font-medium capitalize">{group.replace('_', ' ')}</h3>
                                    <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
                                        {perms.map((permission) => (
                                            <label key={permission.name} className="flex items-center gap-2">
                                                <Checkbox
                                                    checked={selected.includes(permission.name)}
                                                    onCheckedChange={() => toggle(permission.name)}
                                                />
                                                <span className="text-sm">
                                                    {permission.name.replace(`${group}.`, '').replace(/^\w/, (c) => c.toUpperCase())}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))
                    )}
                </ScrollArea>

                <div className="mt-6 flex justify-end">
                    <Button onClick={handleSubmit} disabled={processing || JSON.stringify(assigned.sort()) === JSON.stringify(selected.sort())}>
                        Save
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
