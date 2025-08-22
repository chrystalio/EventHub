import { usePage } from '@inertiajs/react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar, SidebarContent, SidebarFooter,
    SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem
} from '@/components/ui/sidebar';
import { type NavItem, User } from '@/types';
import { Link } from '@inertiajs/react';
import {
    LayoutGrid,
    UserCog,
    Users,
    Building,
    DoorOpenIcon,
    CalendarRange,
    CalendarIcon,
    TicketIcon,
    Briefcase, Award
} from 'lucide-react';
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
    { title: 'Users', url: route('admin.users.index'), icon: Users, role: ['System Administrator', 'Akademik'] },
    { title: 'Roles', url: route('roles.index'), icon: UserCog, role: ['System Administrator', 'Akademik'] },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const { props } = usePage<{ auth: { user: User } }>();
    const user = props.auth?.user;

    const mainNavItems = rawNavItems.filter(item => {
        if (item.permission) {
            return user?.permissions?.includes(item.permission);
        }

        if (item.role) {
            const requiredRoles = Array.isArray(item.role) ? item.role : [item.role];
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            return user?.roles?.some(userRoleName => requiredRoles.includes(userRoleName));
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
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
