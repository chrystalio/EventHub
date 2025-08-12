import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CalendarDays, Activity, Building2 } from 'lucide-react';

export type Glance = {
    eventsToday: number;
    ongoingNow: number;
    roomsInUse: number;
    totalRooms: number;
};

export default function TodayGlance({ data }: { data: Glance }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Today at a Glance</CardTitle>
                <CardDescription>Snapshot of today’s activity.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Events Today</span>
                            <CalendarDays className="h-4 w-4" />
                        </div>
                        <div className="mt-2 text-2xl font-semibold">{data.eventsToday}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Ongoing Now</span>
                            <Activity className="h-4 w-4" />
                        </div>
                        <div className="mt-2 text-2xl font-semibold">{data.ongoingNow}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Rooms In Use</span>
                            <Building2 className="h-4 w-4" />
                        </div>
                        <div className="mt-2 text-2xl font-semibold">
                            {data.roomsInUse} <span className="text-sm text-muted-foreground">/ {data.totalRooms}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
