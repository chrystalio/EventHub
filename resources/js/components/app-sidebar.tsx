import { usePage } from '@inertiajs/react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar, SidebarContent, SidebarFooter,
    SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem
} from '@/components/ui/sidebar';
import { type NavItem, AuthUser } from '@/types';
import { Link } from '@inertiajs/react';
import { Github, LayoutGrid, UserCog, Users } from 'lucide-react';
import AppLogo from './app-logo';

const rawNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Users',
        url: '/admin/users',
        icon: Users,
        permission: 'user.view',
    },
    {
        title: 'Roles',
        url: '/admin/roles',
        icon: UserCog,
        permission: 'role.view',
    }
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        url: 'https://github.com/chrystalio/lareact-starter-kit',
        icon: Github,
    }
];

export function AppSidebar() {
    const { props } = usePage<{ auth: { user: AuthUser } }>()
    const permissions: string[] = props.auth?.user?.permissions ?? [];

    const mainNavItems = rawNavItems.filter(
        item => !item.permission || permissions.includes(item.permission)
    );

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
