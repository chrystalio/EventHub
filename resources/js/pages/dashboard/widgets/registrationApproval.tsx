import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { EventWithPendingCount } from '@/types';

interface RegistrationApprovalsWidgetProps {
    approvals: EventWithPendingCount[];
}

export default function RegistrationApprovalsWidget({ approvals }: RegistrationApprovalsWidgetProps) {
    const hasApprovals = approvals && approvals.length > 0;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    {hasApprovals ? (
                        <AlertTriangle className="h-6 w-6 text-yellow-500 dark:text-yellow-400" />
                    ) : (
                        <CheckCircle2 className="h-6 w-6 text-green-500 dark:text-green-400" />
                    )}
                    <div>
                        <CardTitle>Registration Approvals</CardTitle>
                        <CardDescription>
                            {hasApprovals ? 'Action required for your private events.' : 'No pending approvals.'}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            {hasApprovals && (
                <CardContent>
                    <ul className="space-y-4">
                        {approvals.map((event) => (
                            <li key={event.uuid} className="flex items-center justify-between gap-4 p-3 bg-muted/50 rounded-lg">
                                <div>
                                    <p className="font-semibold">{event.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {event.pending_requests_count} pending request(s)
                                    </p>
                                </div>
                                <Button asChild size="sm">
                                    <Link href={route('admin.events.show', { event: event.uuid })}>
                                        View Requests
                                    </Link>
                                </Button>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            )}
        </Card>
    );
}
