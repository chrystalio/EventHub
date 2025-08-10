import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type {
    BreadcrumbItem,
    Event,
    Registration,
    UserGrowthData,
    RoomAvailability,
    EventTypeDistribution,
    EventWithPendingCount, EventWithRegistrationsCount, RegistrationsPerEventData, PaginatedData
} from '@/types';

import StatCard from './dashboard/widgets/statCard';
import RoomAvailabilityWidget from './dashboard/widgets/roomAvailability';
import EventTypeChartWidget from './dashboard/widgets/charts/eventType';
import UpcomingScheduleWidget from '@/pages/dashboard/widgets/upcomingSchedule';
import YearlyAttendanceChartWidget from '@/pages/dashboard/widgets/charts/yearlyAttendance';
import EventsHappeningNowWidget from '@/pages/dashboard/widgets/eventHappeningNow';
import UpcomingManagedScheduleWidget from '@/pages/dashboard/widgets/upcomingManagedSchedule';
import RegistrationApprovalsWidget from '@/pages/dashboard/widgets/registrationApproval';
import RecentActivitiesWidget from '@/pages/dashboard/widgets/recentActivities';
import TodayGlance, { Glance } from '@/pages/dashboard/widgets/todayGlance';
import TodayEvents from '@/pages/dashboard/widgets/todayEvents';

type YearlyAttendancePoint = { month: string; attended: number; missed: number };

type EventNowItem = {
    uuid: string;
    name: string;
    start_time: string;
    end_time: string;
    total_registered: number;
    building?: { name: string } | null;
    room?: { name: string } | null;
};

type TodayEventItem = {
    uuid: string;
    name: string;
    start_time: string;
    end_time: string;
    building?: { name: string } | null;
    room?: { name: string } | null;
    staff: { id: number; name: string }[];
    ongoing: boolean;
};

interface DashboardProps {
    role: 'System Administrator' | 'Panitia' | 'Akademik' | 'Peserta';
    stats?: { label: string; value: string | number }[];
    userGrowth?: UserGrowthData[];
    roomAvailability?: PaginatedData<RoomAvailability>;
    eventTypeDistribution?: EventTypeDistribution[];
    upcomingRegistrations?: Registration[];
    registrationApprovals?: EventWithPendingCount[];
    eventsHappeningNow?: EventNowItem[];
    upcomingManagedSchedule?: EventWithRegistrationsCount[];
    registrationsPerEvent?: RegistrationsPerEventData[];
    recentActivities?: { type: 'registration' | 'approval' | 'attendance'; event_uuid: string; message: string; occurred_at: string }[];
    yearlyAttendance?: YearlyAttendancePoint[];
    totalUpcomingCount?: number;
    glance?: Glance;
    todayEvents?: TodayEventItem[];
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: route('dashboard') }];

export default function Dashboard(props: DashboardProps) {
    const renderDashboardByRole = (dashboardProps: DashboardProps) => {
        const {
            role,
            stats,
            roomAvailability,
            eventTypeDistribution,
            upcomingRegistrations,
            eventsHappeningNow,
            upcomingManagedSchedule,
            registrationApprovals,
            yearlyAttendance,
            totalUpcomingCount
        } = dashboardProps;
        switch (role) {
            case 'System Administrator':
                return (
                    <div className="space-y-8">
                        <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {(stats || []).map((stat) => (
                                <StatCard key={stat.label} {...stat} />
                            ))}
                        </div>
                        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
                            <div className="lg:col-span-2 space-y-8">
                                {props.glance && <TodayGlance data={props.glance} />}
                                <TodayEvents items={props.todayEvents || []} />
                                {roomAvailability && (
                                    <RoomAvailabilityWidget rooms={roomAvailability} />
                                )}
                            </div>
                            <div className="space-y-8">
                                <EventTypeChartWidget data={eventTypeDistribution || []} />
                                <RecentActivitiesWidget items={props.recentActivities || []} />
                            </div>
                        </div>
                    </div>
                );
            case 'Panitia':
                return (
                    <div className="space-y-8">
                        <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {(stats || []).map((stat) => (
                                <StatCard key={stat.label} {...stat} />
                            ))}
                        </div>
                        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-4">
                            <div className="lg:col-span-3 space-y-4">
                                <RegistrationApprovalsWidget approvals={registrationApprovals || []} />
                                <UpcomingManagedScheduleWidget events={upcomingManagedSchedule || []} />
                            </div>
                            <div className="space-y-8">
                                <EventsHappeningNowWidget events={eventsHappeningNow || []} />
                                <RecentActivitiesWidget items={props.recentActivities || []} />
                            </div>
                        </div>
                    </div>
                );
            case 'Akademik':
                return <div>Akademik Dashboard (Coming Soon)</div>;
            case 'Peserta':
                return (
                    <div className="space-y-8">
                        <div className="grid auto-rows-min gap-4 md:grid-cols-1 lg:grid-cols-5">
                            {(stats || []).map((stat) => (
                                <StatCard key={stat.label} {...stat} />
                            ))}
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                            <div className="lg:col-span-2">
                                <YearlyAttendanceChartWidget data={yearlyAttendance || []} />
                            </div>
                            <div>
                                <UpcomingScheduleWidget
                                    registrations={upcomingRegistrations || []}
                                    totalUpcomingCount={totalUpcomingCount || 0}
                                />
                            </div>
                        </div>
                    </div>
                )
            default:
                return <div>Welcome to your dashboard.</div>;
        }
    };
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="p-4 sm:p-6 lg:p-8">
                {renderDashboardByRole(props)}
            </div>
        </AppLayout>
    );
}
