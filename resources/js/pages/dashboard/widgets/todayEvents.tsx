import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { Clock, MapPin, Calendar, CalendarCheck, ChevronRight } from 'lucide-react';

// --- TYPE DEFINITIONS (Unchanged) ---
type Staff = { id: number; name: string };
type TodayEventItem = {
    uuid: string;
    name: string;
    start_time: string;
    end_time: string;
    building?: { name: string } | null;
    room?: { name: string } | null;
    staff: Staff[];
    ongoing: boolean;
};

// --- HELPER FUNCTIONS (Unchanged) ---
function timeRange(startStr: string, endStr: string) {
    const opt: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
    return `${new Date(startStr).toLocaleTimeString([], opt)} – ${new Date(endStr).toLocaleTimeString([], opt)}`;
}

function initials(name: string) {
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() || '').join('');
}

// --- REFINED SUB-COMPONENTS ---

// Status Badge: No functional changes, slightly adjusted for consistency.
function Status({ ongoing }: { ongoing: boolean }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                ongoing
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                    : 'bg-muted text-muted-foreground'
            }`}
        >
      <span
          className={`h-2 w-2 rounded-full ${ongoing ? 'bg-emerald-500' : 'bg-muted-foreground/50'}`}
      />
            {ongoing ? 'Ongoing' : 'Upcoming'}
    </span>
    );
}

// Event Icon: New component to provide a clear visual anchor for each event status.
function EventIcon({ ongoing }: { ongoing: boolean }) {
    const cls = "h-10 w-10 flex-shrink-0 rounded-lg flex items-center justify-center";
    return ongoing ? (
        <div className={`${cls} bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400`} aria-hidden>
            <CalendarCheck className="h-5 w-5" />
        </div>
    ) : (
        <div className={`${cls} bg-muted text-muted-foreground`} aria-hidden>
            <Calendar className="h-5 w-5" />
        </div>
    );
}

// StaffGroup: Unchanged functionally, styling is inherited.
function StaffGroup({ staff }: { staff: Staff[] }) {
    if (!staff.length) return <span className="text-xs text-muted-foreground">No staff assigned</span>;
    const show = staff.slice(0, 4);
    const overflow = staff.length - show.length;
    return (
        <div className="flex items-center">
            <div className="flex -space-x-2">
                {show.map((s) => (
                    <span
                        key={s.id}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold ring-2 ring-background"
                        title={s.name}
                    >
            {initials(s.name)}
          </span>
                ))}
            </div>
            {overflow > 0 && <span className="pl-2 text-xs font-medium text-muted-foreground">+{overflow} more</span>}
        </div>
    );
}

// --- MAIN COMPONENT (Refactored) ---
export default function TodayEvents({ items }: { items: TodayEventItem[] }) {
    if (!items?.length) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Happening Today</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
                <ul className="-my-2 divide-y divide-border/50">
                    {items.map((e) => (
                        <li key={e.uuid} className="py-2">
                            <Link
                                href={route('admin.events.show', { event: e.uuid })}
                                prefetch="hover"
                                aria-label={`Open event ${e.name}`}
                                className="group flex items-center gap-4 rounded-lg p-2 -m-2 transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring/40"
                            >
                                <EventIcon ongoing={e.ongoing} />

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                        <p className="text-sm font-semibold line-clamp-2 sm:line-clamp-1 sm:truncate">
                                            {e.name}
                                        </p>
                                        <Status ongoing={e.ongoing} />
                                    </div>

                                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" aria-hidden />
                        {timeRange(e.start_time, e.end_time)}
                    </span>
                                        <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" aria-hidden />
                                            {(e.building?.name || 'N/A') + (e.room?.name ? ` – ${e.room.name}` : '')}
                    </span>
                                    </div>

                                    <div className="mt-2">
                                        <StaffGroup staff={e.staff} />
                                    </div>
                                </div>

                                <ChevronRight
                                    className="h-5 w-5 self-center text-muted-foreground transition-transform group-hover:translate-x-1"
                                    aria-hidden
                                />
                            </Link>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}
