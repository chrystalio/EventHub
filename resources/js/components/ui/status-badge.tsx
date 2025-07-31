import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Clock, AlertTriangle, UserCheck } from 'lucide-react';

// Define all possible registration statuses
type RegistrationStatus = 'approved' | 'pending_payment' | 'cancelled' | 'pending_approval' | 'rejected' | 'attended' | 'missed';

interface StatusBadgeProps {
    status: RegistrationStatus;
    className?: string;
}

const statusMap: Record<RegistrationStatus, { text: string; className: string; icon: React.ElementType }> = {
    approved: {
        text: 'Approved',
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
    },
    pending_payment: {
        text: 'Awaiting Payment',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock,
    },
    attended: {
        text: 'Attended',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: UserCheck,
    },
    cancelled: {
        text: 'Cancelled',
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle,
    },
    rejected: {
        text: 'Rejected',
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle,
    },
    pending_approval: {
        text: 'Pending Approval',
        className: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: AlertTriangle,
    },
    missed: {
        text: 'Missed',
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: XCircle,
    },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
    // Default to pending_approval if status is unknown
    const config = statusMap[status] || statusMap.pending_approval;

    return (
        <Badge variant="outline" className={cn('font-medium capitalize', config.className, className)}>
            <config.icon className="h-3.5 w-3.5 mr-1.5" />
            {config.text}
        </Badge>
    );
}
