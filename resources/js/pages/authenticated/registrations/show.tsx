import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Registration, Attendee } from '@/types';
import { ArrowLeftIcon, MapPinIcon, UsersIcon, ClockIcon, CheckCircle2, QrCodeIcon, CreditCard, TicketIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import { Separator } from '@/components/ui/separator';

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
        }
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

// The main redesigned component
export default function RegistrationShow({ registration }: Props) {
    const { event, attendees, status, order_id } = registration;
    const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);

    const getEventDateParts = (dateString: string) => {
        const date = new Date(dateString);
        return {
            month: date.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
            day: date.getDate(),
            fullDate: date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
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
                <Card className="overflow-hidden flex flex-col sm:flex-row">
                    <div className="flex flex-col items-center justify-center bg-muted/50 p-6 border-b sm:border-b-0 sm:border-r">
                        <p className="text-base font-bold text-primary">{startDate.month}</p>
                        <p className="text-5xl font-extrabold text-foreground tracking-tight">{startDate.day}</p>
                    </div>
                    <div className="p-6 flex-grow">
                        <CardTitle className="text-2xl leading-tight">{event.name}</CardTitle>
                        <CardDescription className="mt-1">Organized by {event.organizer}</CardDescription>
                        <Separator className="my-4" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                            <div className="flex items-start gap-3">
                                <ClockIcon className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                                <div>
                                    <p className="font-semibold text-foreground">{startDate.fullDate}</p>
                                    <p className="text-muted-foreground">
                                        {startDate.time} {endDate && ` - ${endDate.time}`}
                                    </p>
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
                                    <Button variant="outline" onClick={() => setSelectedAttendee(attendee)} className="w-full sm:w-auto flex-shrink-0">
                                        <QrCodeIcon className="h-4 w-4 mr-2" />
                                        Show QR Code
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <StatusDisplay status={status} orderId={order_id} />
                    )}
                </div>
            </div>
            <Dialog open={!!selectedAttendee} onOpenChange={(isOpen) => !isOpen && setSelectedAttendee(null)}>
                <DialogContent className="sm:max-w-md p-8 flex flex-col items-center">
                    <DialogHeader className="text-center">
                        <DialogTitle className="text-2xl">{selectedAttendee?.name}</DialogTitle>
                        <p className="text-muted-foreground pt-1">{event.name}</p>
                    </DialogHeader>
                    <div className="p-4 bg-white rounded-lg mt-4">
                        <QRCodeSVG value={selectedAttendee?.signed_url || ''} size={256} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-4 text-center">
                        Present this QR code to the event staff for check-in.
                    </p>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
