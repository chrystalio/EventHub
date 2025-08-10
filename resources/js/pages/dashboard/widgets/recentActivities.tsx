import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Users,
    CheckCircle2,
    BadgeCheck,
    ArrowRight,
    XCircle,
    Clock,
    CreditCard,
    UserX,
} from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

/** Accept both coarse kinds and granular statuses to match whatever the server sends */
type ActivityType =
    | 'registration'
    | 'approval'
    | 'attendance'
    | 'approved'
    | 'pending'
    | 'rejected'
    | 'attended'
    | 'pending_payment'
    | 'missed';

type Activity = {
    type: ActivityType;
    event_uuid: string;
    message: string;
    occurred_at: string;
};

interface RecentActivitiesWidgetProps {
    items: Activity[];
}

function timeAgo(dateStr: string) {
    const d = new Date(dateStr).getTime();
    if (Number.isNaN(d)) return 'some time ago';
    const diff = Date.now() - d;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

const iconFor = (type: ActivityType) => {
    switch (type) {
        case 'registration':
            return <Users className="h-4 w-4" />;
        case 'pending':
            return <Clock className="h-4 w-4 text-yellow-500" />;
        case 'pending_payment':
            return <CreditCard className="h-4 w-4 text-blue-500" />;
        case 'approved':
        case 'approval':
            return <CheckCircle2 className="h-4 w-4 text-green-500" />;
        case 'rejected':
            return <XCircle className="h-4 w-4 text-red-500" />;
        case 'attended':
        case 'attendance':
            return <BadgeCheck className="h-4 w-4 text-green-500" />;
        case 'missed':
            return <UserX className="h-4 w-4" />;
        default:
            return <Users className="h-4 w-4" />;
    }
};

export default function RecentActivitiesWidget({ items }: RecentActivitiesWidgetProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Latest registrations, approvals, and check-ins.</CardDescription>
            </CardHeader>
            <CardContent>
                {items && items.length > 0 ? (
                    <ScrollArea className="h-52">
                        <ul className="divide-y dark:divide-gray-800 pr-4">
                            {items.map((it, idx) => (
                                <li key={idx} className="py-3 flex items-start gap-3">
                                    <div className="mt-0.5 flex-shrink-0">{iconFor(it.type)}</div>

                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm break-words">{it.message}</div>
                                        <div className="text-xs text-muted-foreground pt-0.5">
                                            {timeAgo(it.occurred_at)}
                                        </div>
                                    </div>

                                    <div className="flex-shrink-0">
                                        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                                            <Link href={route('admin.events.show', { event: it.event_uuid })}>
                                                <ArrowRight className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </ScrollArea>
                ) : (
                    <div className="text-sm text-muted-foreground text-center py-12">No recent activity.</div>
                )}
            </CardContent>
        </Card>
    );
}
