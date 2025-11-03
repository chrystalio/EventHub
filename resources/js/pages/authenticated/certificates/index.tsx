import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Award, Calendar, ExternalLink, FileSearch, FileText, Inbox, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { BreadcrumbItem as BreadcrumbType } from '@/types';
import type { FC, PropsWithChildren, ReactElement } from 'react';

// --- TYPE DEFINITIONS ---
interface Certificate {
    id: number;
    name: string;
    event_name: string;
    certificate_number?: string | null;
    issued_date?: string | null;
    certificate_url: string;
}

interface PageProps {
    certificates: Certificate[];
}

const breadcrumbs: BreadcrumbType[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'My Certificates', href: route('certificates.index') },
];

// --- REUSABLE SUB-COMPONENTS ---

/**
 * A reusable component for displaying empty or no-result states.
 */
const EmptyState: FC<
    PropsWithChildren<{
        icon: React.ElementType;
        title: string;
        description: string;
    }>
> = ({ icon: Icon, title, description, children }) => (
    <div className="flex w-full items-center justify-center rounded-xl border border-dashed bg-muted/40 py-20 text-center">
        <div>
            <Icon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            {children && <div className="mt-6">{children}</div>}
        </div>
    </div>
);

/**
 * A component to display a single certificate card.
 */
const CertificateCard: FC<{ certificate: Certificate }> = ({ certificate }) => (
    <Card className="group flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <CardHeader className="flex-row items-start gap-4 space-y-0 bg-muted/30">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Award className="h-6 w-6" />
            </div>
            <div>
                <CardTitle className="text-base font-semibold leading-tight">{certificate.event_name}</CardTitle>
                <CardDescription className="mt-1 text-xs">{certificate.name}</CardDescription>
            </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col justify-between p-6">
            <dl className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                    <dt>
                        <Calendar className="h-4 w-4" />
                    </dt>
                    <dd>
                        <strong>Issued:</strong> {certificate.issued_date || 'Not specified'}
                    </dd>
                </div>
                <div className="flex items-center gap-3">
                    <dt>
                        <FileText className="h-4 w-4" />
                    </dt>
                    <dd className="truncate">
                        <strong>No:</strong> {certificate.certificate_number || 'N/A'}
                    </dd>
                </div>
            </dl>

            <Button className="mt-6 w-full" size="sm" asChild>
                <a href={certificate.certificate_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View & Download
                </a>
            </Button>
        </CardContent>
    </Card>
);

// --- MAIN PAGE COMPONENT ---
export default function CertificatesIndex({ certificates }: PageProps): ReactElement {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCertificates = useMemo(
        () =>
            certificates.filter(
                (cert) =>
                    cert.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (cert.certificate_number && cert.certificate_number.toLowerCase().includes(searchTerm.toLowerCase())),
            ),
        [certificates, searchTerm],
    );

    const hasCertificates = certificates.length > 0;
    const hasResults = filteredCertificates.length > 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Certificates" />

            <div className="container mx-auto space-y-8 px-4 py-8 sm:px-6 lg:px-8">
                {/* Page Header */}
                <header>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">My Certificates</h1>
                    <p className="mt-1 text-muted-foreground">
                        A collection of all your earned certificates. View or download them anytime.
                    </p>
                </header>

                {/* Search and Filter Section */}
                {hasCertificates && (
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search by event or number..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Badge variant="secondary" className="hidden sm:inline-flex">
                            {filteredCertificates.length} of {certificates.length} shown
                        </Badge>
                    </div>
                )}

                {/* Content Area */}
                <main>
                    {!hasCertificates ? (
                        <EmptyState
                            icon={Inbox}
                            title="No Certificates Yet"
                            description="When you participate in events, your certificates will appear here."
                        >
                            <Button asChild>
                                <Link href="/registrants/events/browse">Browse Events</Link>
                            </Button>
                        </EmptyState>
                    ) : !hasResults ? (
                        <EmptyState
                            icon={FileSearch}
                            title="No Certificates Found"
                            description="Your search returned no results. Please try different keywords."
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filteredCertificates.map((cert) => (
                                <CertificateCard key={cert.id} certificate={cert} />
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </AppLayout>
    );
}
