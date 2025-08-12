import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { Registration, RegistrationAttendee as Attendee } from '@/types';
import { formatDateTime } from '@/utils/dateUtils';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertTriangle,
    ArrowLeftIcon,
    ArrowRightIcon,
    CheckCircle2,
    ClockIcon,
    CreditCard,
    Loader2,
    MapPinIcon,
    QrCodeIcon,
    TicketIcon,
    UsersIcon,
    XCircle,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';

interface Props {
    registration: Registration;
}

const STATUS_STYLES = {
    pending_approval: {
        card: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-900/40',
        circle: 'bg-yellow-100',
        icon: 'text-yellow-600',
        title: 'text-yellow-900',
        desc: 'text-yellow-700',
        titleText: 'Registration Pending',
        descText: 'Your registration is awaiting approval. Your ticket will be available here once confirmed.',
    },
    pending_payment: {
        card: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-900/40',
        circle: 'bg-blue-100',
        icon: 'text-blue-600',
        title: 'text-blue-900',
        desc: 'text-blue-700',
        titleText: 'Payment Required',
        descText: 'Your spot is reserved. Please complete the payment to finalize your registration and receive your tickets.',
    },
    attended: {
        card: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900/40',
        circle: 'bg-green-100',
        icon: 'text-green-600',
        title: 'text-green-900',
        desc: 'text-green-700',
        titleText: 'Registration Completed',
        descText: 'Thank you for attending! This ticket has been successfully used.',
    },
    missed: {
        card: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900/40',
        circle: 'bg-red-100',
        icon: 'text-red-600',
        title: 'text-red-900',
        desc: 'text-red-700',
        titleText: 'Registration Missed',
        descText: 'You missed the event. If you have any questions, please contact the organizer.',
    },
    rejected: {
        card: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900/40',
        circle: 'bg-red-100',
        icon: 'text-red-600',
        title: 'text-red-900',
        desc: 'text-red-700',
        titleText: 'Registration Rejected',
        descText: 'Your registration has been rejected. If you have any questions, please contact the organizer.',
    },
} as const;

const StatusDisplay = ({ status, orderId }: { status: Registration['status']; orderId?: string | null }) => {
    const map = STATUS_STYLES[status as keyof typeof STATUS_STYLES] ?? STATUS_STYLES.pending_approval;
    const Icon =
        status === 'pending_payment'
            ? CreditCard
            : status === 'attended'
              ? CheckCircle2
              : status === 'missed' || status === 'rejected'
                ? XCircle
                : ClockIcon;

    return (
        <Card className={map.card}>
            <CardContent className="flex flex-col items-center p-6 text-center">
                <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${map.circle}`}>
                    <Icon className={`h-8 w-8 ${map.icon}`} />
                </div>
                <h3 className={`text-xl font-bold ${map.title}`}>{map.titleText}</h3>
                <p className={`mt-2 max-w-md text-sm ${map.desc}`}>{map.descText}</p>

                {status === 'pending_payment' && orderId && (
                    <Button className="mt-6" asChild>
                        <Link href={route('transactions.show', orderId)}>Complete Payment</Link>
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};

function getEventTypeLabel(t: string | null | undefined) {
    if (t === 'free') return 'Free Event';
    if (t === 'paid') return 'Paid Event';
    if (t === 'private') return 'Private Event';
    return 'Event';
}

export default function RegistrationShow({ registration }: Props) {
    const { event, attendees, status, order_id } = registration;
    const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
    const [qrCodeValue, setQrCodeValue] = useState<string>('');
    const [isLoadingQr, setIsLoadingQr] = useState<boolean>(false);
    const [qrError, setQrError] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(30);

    const now = new Date();
    const startTime = new Date(event.start_time);
    const checkinWindowEnd = new Date(startTime.getTime() + 60 * 60 * 1000);
    const isCheckinClosed = now > checkinWindowEnd;

    useEffect(() => {
        if (!selectedAttendee) return;

        let qrRefreshInterval: number;

        const fetchNewQrCode = async () => {
            setIsLoadingQr(true);
            setQrError(null);
            try {
                const response = await axios.get(route('api.attendees.generate-token', selectedAttendee.qr_code), {
                    withCredentials: true,
                });

                const compositeValue = `${selectedAttendee.qr_code},${response.data.token}`;
                setQrCodeValue(compositeValue);
                setCountdown(30);
            } catch (error) {
                console.error('Failed to refresh QR code:', error);
                setQrError('Could not load QR code. Please try again.');
                clearInterval(qrRefreshInterval);
            } finally {
                setIsLoadingQr(false);
            }
        };

        fetchNewQrCode();
        qrRefreshInterval = window.setInterval(fetchNewQrCode, 30000);

        return () => clearInterval(qrRefreshInterval);
    }, [selectedAttendee]);

    useEffect(() => {
        if (!selectedAttendee || isLoadingQr || qrError) return;

        const countdownInterval = window.setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(countdownInterval);
    }, [selectedAttendee, isLoadingQr, qrError, qrCodeValue]);

    const getEventDateParts = (dateString: string) => {
        const date = new Date(dateString);
        return {
            month: date.toLocaleString('en-US', { month: 'short' }),
            day: date.getDate(),
            fullDate: date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }),
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
            dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }),
        };
    };

    const startDate = getEventDateParts(event.start_time);
    const endDate = event.end_time ? getEventDateParts(event.end_time) : null;

    return (
        <AppLayout>
            <Head title={`Ticket for ${event.name}`} />

            <div className="space-y-8 px-4 py-8 lg:px-8">
                <Link
                    href={route('registrations.index')}
                    className="text-muted-foreground hover:text-primary inline-flex items-center text-sm font-medium">
                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    Back to My Registrations
                </Link>
                <Card className="flex flex-col overflow-visible sm:flex-row">
                    <div className="relative flex flex-col items-center justify-center bg-blue-50 p-6 sm:p-8 dark:bg-blue-900/20">
                        <p className="text-base font-bold text-blue-600 dark:text-slate-50">{startDate.month}</p>
                        <p className="text-foreground text-5xl font-extrabold tracking-tight">{startDate.day}</p>

                        <div className="absolute top-0 right-0 hidden h-full w-px sm:block">
                            <div className="border-border h-full border-r-2 border-dashed" />
                        </div>
                        <div className="bg-background absolute -top-3 -right-3 hidden h-6 w-6 rounded-full sm:block" />
                        <div className="bg-background absolute -right-3 -bottom-3 hidden h-6 w-6 rounded-full sm:block" />
                    </div>

                    <div className="flex-grow p-6">
                        <CardTitle className="text-2xl leading-tight">{event.name}</CardTitle>
                        <CardDescription className="mt-1">Organized by {event.organizer}</CardDescription>

                        <Separator className="my-4" />

                        <div className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm md:grid-cols-2">
                            <div className="flex items-start gap-3">
                                <ClockIcon className="text-muted-foreground mt-1 h-4 w-4 flex-shrink-0" />
                                <div>
                                    <p className="text-foreground font-semibold">Start</p>
                                    <p className="text-muted-foreground">
                                        {startDate.fullDate} at {startDate.time}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <ClockIcon className="text-muted-foreground mt-1 h-4 w-4 flex-shrink-0" />
                                <div>
                                    <p className="text-foreground font-semibold">End</p>
                                    <p className="text-muted-foreground">{endDate ? `${endDate.fullDate} at ${endDate.time}` : 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPinIcon className="text-muted-foreground mt-1 h-4 w-4 flex-shrink-0" />
                                <div>
                                    <p className="text-foreground font-semibold">{event.building.name}</p>
                                    <p className="text-muted-foreground">{event.room.name}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <TicketIcon className="text-muted-foreground mt-1 h-4 w-4 flex-shrink-0" />
                                <div>
                                    <p className="text-foreground font-semibold">{getEventTypeLabel(event.type)}</p>
                                    <p className="text-muted-foreground">Registration Type</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <UsersIcon className="text-muted-foreground mt-1 h-4 w-4 flex-shrink-0" />
                                <div>
                                    <p className="text-foreground font-semibold">{attendees?.length || 1} Attendee(s)</p>
                                    <p className="text-muted-foreground">Included in this ticket</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
                <div>
                    <h2 className="text-foreground mb-4 flex items-center text-xl font-semibold">
                        <UsersIcon className="text-muted-foreground mr-3 h-5 w-5" />
                        Your Ticket & Attendees
                    </h2>
                    {status === 'approved' || status === 'attended' ? (
                        <div className="space-y-4">
                            {attendees?.map((attendee) => (
                                <Card key={attendee.id} className="flex flex-col items-center justify-between gap-4 p-4 sm:flex-row">
                                    <div className="flex-grow text-center sm:text-left">
                                        <Badge variant={attendee.attendee_type === 'user' ? 'default' : 'secondary'} className="mb-2 capitalize">
                                            {attendee.attendee_type === 'user' ? 'Registrant' : 'Guest'}
                                        </Badge>
                                        <p className="text-foreground text-lg font-bold">{attendee.name}</p>
                                        {attendee.phone && <p className="text-muted-foreground text-sm">{attendee.phone}</p>}
                                    </div>
                                    {attendee.attended_at ? (
                                        <div className="flex flex-col items-center text-center sm:text-right">
                                            <Badge className="border-green-200 bg-green-100 text-green-800 hover:bg-green-100">
                                                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                                                Checked-in
                                            </Badge>
                                            <p className="text-muted-foreground mt-1 text-xs">at {formatDateTime(attendee.attended_at)}</p>
                                        </div>
                                    ) : isCheckinClosed ? (
                                        <Badge className="border-red-200 bg-red-100 text-red-800 hover:bg-red-100">
                                            <XCircle className="mr-1.5 h-4 w-4" />
                                            Missed
                                        </Badge>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            onClick={() => setSelectedAttendee(attendee)}
                                            className="w-full flex-shrink-0 sm:w-auto"
                                        >
                                            <QrCodeIcon className="mr-2 h-4 w-4" />
                                            Show QR Code
                                        </Button>
                                    )}
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <StatusDisplay status={status} orderId={order_id} />
                    )}
                </div>
            </div>
            <Dialog open={!!selectedAttendee} onOpenChange={(isOpen) => !isOpen && setSelectedAttendee(null)}>
                <DialogContent className="overflow-hidden p-0 sm:max-w-sm">
                    <div className="flex flex-col items-center p-8">
                        <Badge variant={selectedAttendee?.attendee_type === 'user' ? 'default' : 'secondary'} className="mb-2 capitalize">
                            {selectedAttendee?.attendee_type === 'user' ? 'Registrant' : 'Guest'}
                        </Badge>
                        <DialogTitle className="text-center text-2xl font-bold">{selectedAttendee?.name}</DialogTitle>

                        <div className="mt-6 flex min-h-[256px] min-w-[256px] items-center justify-center rounded-lg border bg-white p-2">
                            {isLoadingQr && <Loader2 className="text-muted-foreground h-12 w-12 animate-spin" />}
                            {qrError && (
                                <div className="text-destructive text-center">
                                    <AlertTriangle className="mx-auto h-12 w-12" />
                                    <p className="mt-2 text-xs font-semibold">{qrError}</p>
                                </div>
                            )}
                            {!isLoadingQr && !qrError && qrCodeValue && <QRCodeSVG value={qrCodeValue} size={225} />}
                        </div>

                        {!isLoadingQr && !qrError && qrCodeValue && (
                            <div className="mt-6 w-full text-center">
                                <p className="text-muted-foreground text-sm">
                                    Code automatically refreshes in <span className="text-foreground font-bold">{countdown}s</span>
                                </p>
                            </div>
                        )}
                        <Separator className="my-6" />
                        <div className="flex w-full items-center justify-between">
                            <div className="text-left">
                                <p className="text-muted-foreground text-xs">Start time</p>
                                <p className="text-lg font-bold">{startDate.time}</p>
                                <p className="text-muted-foreground text-xs">
                                    {startDate.dayOfWeek}, {startDate.month} {startDate.day}
                                </p>
                            </div>
                            <ArrowRightIcon className="text-muted-foreground mx-4 h-5 w-5" />
                            <div className="text-right">
                                <p className="text-muted-foreground text-xs">End time</p>
                                <p className="text-lg font-bold">{endDate ? endDate.time : 'N/A'}</p>
                                <p className="text-muted-foreground text-xs">
                                    {endDate ? `${endDate.dayOfWeek}, ${endDate.month} ${endDate.day}` : ''}
                                </p>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
