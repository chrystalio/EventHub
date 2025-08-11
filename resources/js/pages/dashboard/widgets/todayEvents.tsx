import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TodayEventItem } from '@/types';
import { Link } from '@inertiajs/react';
import { Calendar, CalendarCheck, ChevronRight, Clock, MapPin } from 'lucide-react';

function timeRange(startStr: string, endStr: string | null) {
    const fmt: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
    const start = new Date(startStr).toLocaleTimeString([], fmt);
    const end = endStr ? new Date(endStr).toLocaleTimeString([], fmt) : start;
    return `${start} – ${end}`;
}

function initials(name: string) {
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() || '').join('');
}

function Status({ state }: { state: TodayEventItem['state'] }) {
    const styles =
        state === 'ongoing'
            ? {
                  wrap: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
                  dot: 'bg-emerald-500',
                  label: 'Ongoing',
              }
            : state === 'upcoming'
              ? {
                    wrap: 'bg-muted text-muted-foreground',
                    dot: 'bg-muted-foreground/50',
                    label: 'Upcoming',
                }
              : {
                    wrap: 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-400',
                    dot: 'bg-red-400 dark:bg-red-600',
                    label: 'Past',
                };

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${styles.wrap}`}>
            <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
            {styles.label}
        </span>
    );
}

function EventIcon({ state }: { state: TodayEventItem['state'] }) {
    const base = 'h-10 w-10 flex-shrink-0 rounded-lg flex items-center justify-center';
    if (state === 'ongoing') {
        return (
            <div className={`${base} bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400`} aria-hidden>
                <CalendarCheck className="h-5 w-5" />
            </div>
        );
    }
    return (
        <div className={`${base} bg-muted text-muted-foreground`} aria-hidden>
            <Calendar className="h-5 w-5" />
        </div>
    );
}

function StaffGroup({ staff }: { staff: TodayEventItem['staff'] }) {
    if (!staff.length) return <span className="text-muted-foreground text-xs">No staff assigned</span>;
    const show = staff.slice(0, 4);
    const overflow = staff.length - show.length;
    return (
        <div className="flex items-center">
            <div className="flex -space-x-2">
                {show.map((s) => (
                    <span
                        key={s.id}
                        className="bg-muted ring-background inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ring-2"
                        title={s.name}
                    >
                        {initials(s.name)}
                    </span>
                ))}
            </div>
            {overflow > 0 && <span className="text-muted-foreground pl-2 text-xs font-medium">+{overflow} more</span>}
        </div>
    );
}

export default function TodayEvents({ items }: { items: TodayEventItem[] }) {
    if (!items?.length) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Happening Today</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
                <ScrollArea className="max-h-80 md:max-h-96">
                    <ul className="divide-border/50 -my-2 divide-y pr-2">
                        {items.map((e) => (
                            <li key={e.uuid} className="py-2">
                                <Link
                                    href={route('admin.events.show', { event: e.uuid })}
                                    prefetch="hover"
                                    aria-label={`Open event ${e.name}`}
                                    className="group hover:bg-muted/50 focus:ring-ring/40 -m-2 flex items-center gap-4 rounded-lg p-2 transition-colors focus:ring-2 focus:outline-none"
                                >
                                    <EventIcon state={e.state} />

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                            <p className="line-clamp-2 text-sm font-semibold sm:line-clamp-1 sm:truncate">{e.name}</p>
                                            <Status state={e.state} />
                                        </div>

                                        <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
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
                                        className="text-muted-foreground h-5 w-5 self-center transition-transform group-hover:translate-x-1"
                                        aria-hidden
                                    />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
