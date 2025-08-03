import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Registration, Attendee } from '@/types';
import { ArrowLeftIcon, MapPinIcon, UsersIcon, ClockIcon, CheckCircle2, QrCodeIcon, CreditCard, TicketIcon, Loader2, AlertTriangle, ArrowRightIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import { Separator } from '@/components/ui/separator';
import { formatDateTime } from '@/utils/dateUtils';
import axios from 'axios';

interface Props {
    registration: Registration;
}

const StatusDisplay = ({ status, orderId }: { status: Registration['status'], orderId?: string | null }) => {
    const statusConfig = {
        pending_approval: {
            icon: ClockIcon,
            title: 'Registration Pending',
            description: 'Your registration is awaiting approval. Your ticket will be available here once confirmed.',
            color: 'yellow',
        },
        attended: {
            icon: CheckCircle2,
            title: 'Registration Completed',
            description: 'Thank you for attending! This ticket has been successfully used.',
            color: 'green',
        },
        pending_payment: {
            icon: CreditCard,
            title: 'Payment Required',
            description: 'Your spot is reserved. Please complete the payment to finalize your registration and receive your tickets.',
            color: 'blue',
        },
        default: {
            icon: ClockIcon,
            title: 'Registration Pending',
            description: 'Your registration is awaiting approval. Your ticket will be available here once confirmed.',
            color: 'yellow',
        },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.default;
    const Icon = config.icon;

    return (
        <Card className={`bg-${config.color}-50 border-${config.color}-200`}>
            <CardContent className="p-6 text-center flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full bg-${config.color}-100 flex items-center justify-center mb-4`}>
                    <Icon className={`h-8 w-8 text-${config.color}-600`} />
                </div>
                <h3 className={`text-xl font-bold text-${config.color}-900`}>{config.title}</h3>
                <p className={`mt-2 text-sm text-${config.color}-700 max-w-md`}>
                    {config.description}
                </p>
                {status === 'pending_payment' && orderId && (
                    <Button className="mt-6" asChild>
                        <Link href={route('transactions.show', orderId)}>Complete Payment</Link>
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};

export default function RegistrationShow({ registration }: Props) {
    const { event, attendees, status, order_id } = registration;
    const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
    const [qrCodeValue, setQrCodeValue] = useState<string>('');
    const [isLoadingQr, setIsLoadingQr] = useState<boolean>(false);
    const [qrError, setQrError] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(30);

    useEffect(() => {
        if (!selectedAttendee) return;

        let qrRefreshInterval: number;

        const fetchNewQrCode = async () => {
            setIsLoadingQr(true);
            setQrError(null);
            try {
                const response = await axios.get(
                    route('api.attendees.generate-token', selectedAttendee.qr_code),
                    { withCredentials: true }
                );

                const compositeValue = `${selectedAttendee.qr_code},${response.data.token}`;
                setQrCodeValue(compositeValue);
                setCountdown(30);

            } catch (error) {
                console.error("Failed to refresh QR code:", error);
                setQrError("Could not load QR code. Please try again.");
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
        if (!selectedAttendee || isLoadingQr || qrError) {
            return;
        }

        const countdownInterval = window.setInterval(() => {
            setCountdown(prev => {
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
            fullDate: date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
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
                    className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary"
                >
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    Back to My Registrations
                </Link>
                <Card className="overflow-visible flex flex-col sm:flex-row">
                    <div className="relative flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900/20 p-6 sm:p-8">
                        <p className="text-base font-bold text-blue-600 dark:text-slate-50">{startDate.month}</p>
                        <p className="text-5xl font-extrabold text-foreground tracking-tight">{startDate.day}</p>
                        <div className="absolute top-0 right-0 h-full w-px hidden sm:block">
                            <div className="h-full border-r-2 border-dashed border-border"></div>
                        </div>
                        <div className="absolute top-[-0.75rem] right-[-0.75rem] h-6 w-6 rounded-full bg-background hidden sm:block"></div>
                        <div className="absolute bottom-[-0.75rem] right-[-0.75rem] h-6 w-6 rounded-full bg-background hidden sm:block"></div>
                    </div>
                    <div className="p-6 flex-grow">
                        <CardTitle className="text-2xl leading-tight">{event.name}</CardTitle>
                        <CardDescription className="mt-1">Organized by {event.organizer}</CardDescription>
                        <Separator className="my-4" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                            <div className="flex items-start gap-3">
                                <ClockIcon className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                                <div>
                                    <p className="font-semibold text-foreground">Start</p>
                                    <p className="text-muted-foreground">{startDate.fullDate} at {startDate.time}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <ClockIcon className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                                <div>
                                    <p className="font-semibold text-foreground">End</p>
                                    <p className="text-muted-foreground">{endDate ? `${endDate.fullDate} at ${endDate.time}` : 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPinIcon className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                                <div>
                                    <p className="font-semibold text-foreground">{event.building.name}</p>
                                    <p className="text-muted-foreground">{event.room.name}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <TicketIcon className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                                <div>
                                    <p className="font-semibold text-foreground">{event.type ? 'Free Event' : 'Paid Event'}</p>
                                    <p className="text-muted-foreground">Registration Type</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <UsersIcon className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                                <div>
                                    <p className="font-semibold text-foreground">{attendees?.length || 1} Attendee(s)</p>
                                    <p className="text-muted-foreground">Included in this ticket</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
                <div>
                    <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                        <UsersIcon className="h-5 w-5 mr-3 text-muted-foreground" />
                        Your Ticket & Attendees
                    </h2>

                    {status === 'approved' ? (
                        <div className="space-y-4">
                            {attendees?.map((attendee) => (
                                <Card key={attendee.id} className="flex flex-col sm:flex-row items-center justify-between p-4 gap-4">
                                    <div className="flex-grow text-center sm:text-left">
                                        <Badge variant={attendee.attendee_type === 'user' ? 'default' : 'secondary'}
                                               className="capitalize mb-2">
                                            {attendee.attendee_type === 'user' ? 'Registrant' : 'Guest'}
                                        </Badge>
                                        <p className="font-bold text-lg text-foreground">{attendee.name}</p>
                                        {attendee.phone && (
                                            <p className="text-sm text-muted-foreground">{attendee.phone}</p>
                                        )}
                                    </div>
                                    {attendee.attended_at ? (
                                        <div className="flex flex-col items-center text-center sm:text-right">
                                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                                                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                                                Checked-in
                                            </Badge>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                at {formatDateTime(attendee.attended_at)}
                                            </p>
                                        </div>
                                    ) : (
                                        <Button variant="outline" onClick={() => setSelectedAttendee(attendee)} className="w-full sm:w-auto flex-shrink-0">
                                            <QrCodeIcon className="h-4 w-4 mr-2" />
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
                <DialogContent className="sm:max-w-sm p-0 overflow-hidden">
                    <div className="p-8 flex flex-col items-center">
                        <Badge variant={selectedAttendee?.attendee_type === 'user' ? 'default' : 'secondary'}
                               className="capitalize mb-2">
                            {selectedAttendee?.attendee_type === 'user' ? 'Registrant' : 'Guest'}
                        </Badge>
                        <DialogTitle className="text-2xl font-bold text-center">{selectedAttendee?.name}</DialogTitle>

                        <div className="mt-6 p-2 bg-white rounded-lg min-h-[256px] min-w-[256px] flex items-center justify-center border">
                            {isLoadingQr && <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />}
                            {qrError && (
                                <div className="text-center text-destructive">
                                    <AlertTriangle className="h-12 w-12 mx-auto" />
                                    <p className="mt-2 font-semibold text-xs">{qrError}</p>
                                </div>
                            )}
                            {!isLoadingQr && !qrError && qrCodeValue && (
                                <QRCodeSVG value={qrCodeValue} size={225} />
                            )}
                        </div>

                        {!isLoadingQr && !qrError && qrCodeValue && (
                            <div className="w-full mt-6 text-center">
                                <p className="text-sm text-muted-foreground">
                                    Code automatically refreshes in <span className="font-bold text-foreground">{countdown}s</span>
                                </p>
                            </div>
                        )}
                        <Separator className="my-6" />

                        <div className="w-full flex items-center justify-between">
                            <div className="text-left">
                                <p className="text-xs text-muted-foreground">Start time</p>
                                <p className="text-lg font-bold">{startDate.time}</p>
                                <p className="text-xs text-muted-foreground">{startDate.dayOfWeek}, {startDate.month} {startDate.day}</p>
                            </div>
                            <ArrowRightIcon className="h-5 w-5 text-muted-foreground mx-4" />
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground">End time</p>
                                <p className="text-lg font-bold">{endDate ? endDate.time : 'N/A'}</p>
                                <p className="text-xs text-muted-foreground">{endDate ? `${endDate.dayOfWeek}, ${endDate.month} ${endDate.day}` : ''}</p>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
