import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useFlashToast } from '@/hooks/useFlashToast';
import { toast } from 'sonner';
import type { BreadcrumbItem, Transaction } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, ShieldCheck, User, Ticket, Clock, HelpCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { formatDateTime } from '@/utils/dateUtils';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'My Registrations', href: route('registrations.index') },
    { title: 'Complete Payment', href: '#' },
];

interface ShowProps {
    transaction: Transaction;
    snapToken: string | null;
    errors?: Record<string, string>;
}

export default function Show({ transaction, snapToken, errors }: ShowProps) {
    useFlashToast();

    useEffect(() => {
        if (errors && Object.keys(errors).length > 0) {
            Object.values(errors).forEach(error => toast.error(error));
        }
    }, [errors]);

    useEffect(() => {
        if (!(window as any).snap) {
            console.error("Midtrans Snap.js is not loaded.");
            toast.error("Payment service is currently unavailable. Please refresh the page.");
            return;
        }

        if (snapToken) {
            (window as any).snap.embed(snapToken, {
                embedId: 'snap-container',
                onSuccess: function (result: any) {
                    toast.success("Payment successful! Redirecting...");
                    setTimeout(() => {
                        if (transaction.registration) {
                            router.visit(route('registrations.show', transaction.registration.uuid));
                        } else {
                            router.visit(route('registrations.index'));
                        }
                    }, 2000);
                },
                onPending: function (result: any) {
                    toast.info("Waiting for your payment. We'll notify you upon confirmation.");
                    router.visit(route('registrations.index'));
                },
                onError: function (result: any) {
                    toast.error("Payment failed. Please try again.");
                },
                onClose: function () {
                    toast.info("You can complete the payment later from the 'My Registrations' page.");
                    router.visit(route('registrations.index'), { replace: true });
                }
            });
        }
    }, [snapToken, transaction]);
    const formattedAmount = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(transaction.total_amount);
    const ticketPrice = transaction.event.price ?? 0;
    const ticketCount = ticketPrice > 0 ? Math.round(transaction.total_amount / ticketPrice) : 1;
    const expirationDate = transaction.expires_at ? formatDateTime(transaction.expires_at) : 'N/A';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Complete Payment" />

            <div className="flex min-h-[calc(100vh-150px)] items-center justify-center p-4">
                <div className="w-full max-w-5xl">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold tracking-tight">Complete Your Payment</h1>
                        <p className="text-muted-foreground mt-2">
                            Finalize your registration by completing the payment below.
                        </p>
                    </div>

                    <Card className="overflow-hidden shadow-lg">
                        <div className="grid grid-cols-1 lg:grid-cols-2">
                            <div className="p-8 bg-muted/30 flex flex-col">
                                <CardHeader className="p-0 mb-6">
                                    <CardTitle className="text-2xl">Transaction Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 space-y-6 flex-grow">
                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-sm">Billed To</h3>
                                        <div className="flex items-center text-sm">
                                            <User className="h-4 w-4 mr-2 text-muted-foreground" />
                                            <span>{transaction.user.name} ({transaction.user.email})</span>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-sm">Order Details</h3>
                                        <p className="text-sm text-muted-foreground">{transaction.event.name}</p>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center">
                                                <Ticket className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span>{ticketCount} x Ticket(s)</span>
                                            </div>
                                            <span className="font-mono">{formattedAmount}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground ml-6">Order ID</span>
                                            <span className="font-mono">{transaction.order_id}</span>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center">
                                            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                            <span className="text-muted-foreground">Payment due by</span>
                                        </div>
                                        <span className="font-semibold">{expirationDate}</span>
                                    </div>
                                </CardContent>
                                <CardFooter className="p-0 pt-8 flex flex-col items-center justify-center gap-4">
                                    <div className="flex items-center text-xs text-green-600">
                                        <ShieldCheck className="h-4 w-4 mr-2" />
                                        <span>Secure payment powered by Midtrans</span>
                                    </div>
                                </CardFooter>
                            </div>
                            <div className="p-6 flex items-center justify-center">
                                {snapToken ? (
                                    <div id="snap-container" className="w-full"></div>
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <Alert>
                                            <Terminal className="h-4 w-4" />
                                            <AlertTitle>Transaction Inactive</AlertTitle>
                                            <AlertDescription>
                                                This payment cannot be processed. It may have already been completed or has expired.
                                            </AlertDescription>
                                        </Alert>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
