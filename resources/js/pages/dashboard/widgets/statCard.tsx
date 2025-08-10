import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, ListChecks, Banknote, CircleCheckBig, ClipboardX, CalendarClock, Clock } from 'lucide-react';

interface Stat {
    label: string;
    value: string | number;
}

export default function StatCard({ label, value }: Stat) {
    const getIcon = () => {
        switch (label) {
            case 'Total Users':
                return <Users className="h-4 w-4 text-muted-foreground" />;
            case 'Total Events':
                return <Calendar className="h-4 w-4 text-muted-foreground" />;
            case 'Total Registrations':
                return <ListChecks className="h-4 w-4 text-muted-foreground" />;
            case 'Total Revenue':
                return <Banknote className="h-4 w-4 text-muted-foreground" />;
            case 'Registered':
                return <Calendar className="h-4 w-4 text-muted-foreground" />;
            case 'Pending Registrations':
                return <Clock className="h-4 w-4 text-muted-foreground" />;
            case 'Attended':
                return <CircleCheckBig className="h-4 w-4 text-muted-foreground" />;
            case 'Missed':
                return <ClipboardX className="h-4 w-4 text-muted-foreground" />;
            case 'Pending Payments':
                return <CalendarClock className="h-4 w-4 text-muted-foreground" />;
            case 'Managing Events':
                return <ListChecks className="h-4 w-4 text-muted-foreground" />;
            case 'Events This Week':
                return <Calendar className="h-4 w-4 text-muted-foreground" />;
            case 'Pending Approvals':
                return <Clock className="h-4 w-4 text-muted-foreground" />;
            default:
                return null;
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                {getIcon()}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );
};
