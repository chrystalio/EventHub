import { usePage, Link } from '@inertiajs/react';
import {
    Sidebar, SidebarContent, SidebarFooter,
    SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem
} from '@/components/ui/sidebar';
import { NavMain } from '@/components/nav-main';
import { NavFooter } from '@/components/nav-footer';
import { NavUser } from '@/components/nav-user';
import {
    LayoutGrid, UserCog, Users, Building, DoorOpenIcon,
    CalendarRange, CalendarIcon, TicketIcon, Briefcase, Award
} from 'lucide-react';
import { type NavItem, User } from '@/types';
import AppLogo from './app-logo';

const rawNavItems: NavItem[] = [
    { title: 'Dashboard', url: route('dashboard'), icon: LayoutGrid },
    { title: 'Managed Events', url: route('panitia.events.index'), icon: Briefcase, role: 'Panitia' },
    { title: 'Browse Events', url: route('registrations.browse'), icon: CalendarIcon, role: 'Peserta' },
    { title: 'My Registrations', url: route('registrations.index'), icon: TicketIcon, role: 'Peserta' },
    { title: 'My Certificates', url: route('certificates.index'), icon: Award, role: 'Peserta' },
    { title: 'Events', url: route('admin.events.index'), icon: CalendarRange, role: ['System Administrator', 'Akademik'] },
    { title: 'Buildings', url: route('admin.buildings.index'), icon: Building, role: ['System Administrator', 'Akademik'] },
    { title: 'Rooms', url: route('admin.rooms.index'), icon: DoorOpenIcon, role: ['System Administrator', 'Akademik'] },
    { title: 'Users', url: route('admin.users.index'), icon: Users, role: 'System Administrator' },
    { title: 'Roles', url: route('roles.index'), icon: UserCog, role: 'System Administrator' },
];

type Role = string | { name: string };

const roleMatches = (userRoles: Role[] | undefined, required: string[]): boolean =>
    !!userRoles?.some(r => required.includes(typeof r === 'string' ? r : r?.name));

export function AppSidebar() {
    const { props } = usePage<{ auth: { user: User } }>();
    const user = props.auth?.user;

    const mainNavItems = rawNavItems.filter(item => {
        if (item.permission) return user?.permissions?.includes(item.permission);
        if (item.role) {
            const required = Array.isArray(item.role) ? item.role : [item.role];
            return roleMatches(user?.roles as Role[], required);
        }
        return true;
    });

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
                <NavFooter items={[]} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
