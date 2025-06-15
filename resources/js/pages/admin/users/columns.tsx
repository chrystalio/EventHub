import { Link, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table'
import type { User, SharedData } from '@/types'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { LucideTrash, MoreHorizontal, PencilIcon, UserCog, UserRoundPlus } from 'lucide-react';

export function getColumns(
    setEditingUser: (user: User) => void,
    setIsDialogOpen: (open: boolean) => void,
    setFormData: (formData: { roles: string[] }) => void
): ColumnDef<User>[] {
    return [
        {
            accessorKey: 'name',
            header: 'Name',
        },
        {
            accessorKey: 'email',
            header: 'Email',
        },
        {
            accessorKey: 'roles',
            header: 'Roles',
            cell: ({ row }) => row.original.roles.map(r => r.name).join(', '),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const user = row.original;
                // eslint-disable-next-line react-hooks/rules-of-hooks
                const { auth } = usePage<SharedData>().props;
                const currentUser = auth.user;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem className="cursor-pointer text-blue-400 focus:bg-blue-100 focus:text-blue-500"
                                onClick={() => {
                                    setEditingUser(user);
                                    setFormData({ roles: user.roles.map(r => r.name) });
                                    setIsDialogOpen(true);
                                }}
                            >
                                <UserRoundPlus className="h-4 w-4 mr-2 hover:text-white" />
                                Assign Roles
                            </DropdownMenuItem>
                            {currentUser.id !== user.id && !user.roles.some((role) => role.name === "System Administrator") && (
                                <DropdownMenuItem asChild className="cursor-pointer text-indigo-400 focus:bg-indigo-50 focus:text-indigo-600">
                                    <Link href={route('impersonate', user.id)} method="get" as="button" className="w-full">
                                        <UserCog className="h-4 w-4 mr-2 hover:text-white" />
                                        Impersonate User
                                    </Link>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => console.log('Edit user', user)}>
                                <PencilIcon className="h-4 w-4 mr-2" />
                                Edit
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={() => console.log('Delete user', user)}
                                className="text-red-500 focus:text-red-500"
                            >
                                <LucideTrash className="h-4 w-4 mr-2 text-red-500" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        }

    ]
}
