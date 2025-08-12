import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { CalendarEvent } from '@/types';
import type { CalendarApi, DatesSetArg, DayCellContentArg, DayHeaderContentArg, EventClickArg, EventContentArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FC } from 'react';

type EventType = 'free' | 'paid' | 'private';
type ExtendedCalendarEvent = CalendarEvent & { type?: EventType };
type DayIndicator = EventType | 'mixed';
type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';

const typeClassMap: Record<EventType, string> = {
    free: 'bg-emerald-100 border-emerald-300 text-emerald-900 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-200',
    paid: 'bg-blue-100 border-blue-300 text-blue-900 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-200',
    private: 'bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-200',
};

const dayIndicatorClass: Record<DayIndicator, string> = {
    free: 'bg-emerald-500 dark:bg-emerald-400',
    paid: 'bg-blue-500 dark:bg-blue-400',
    private: 'bg-amber-500 dark:bg-amber-400',
    mixed: 'bg-red-400 dark:bg-red-600',
};

const toLocalKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

type Props = {
    events: ExtendedCalendarEvent[];
    title?: string;
    description?: string;
    initialView?: CalendarView;
    onEventClick?: (event: ExtendedCalendarEvent) => void;
    onDateClick?: (isoDate: string) => void;
};

export default function FullCalendarWidget({
    events,
    title = 'My Calendar',
    description = 'Your registered events.',
    initialView = 'dayGridMonth',
    onEventClick,
    onDateClick,
}: Props) {
    const calRef = useRef<FullCalendar | null>(null);
    const [viewTitle, setViewTitle] = useState<string>('');
    const [isMobile, setIsMobile] = useState<boolean>(() => window.matchMedia('(max-width: 640px)').matches);
    const [currentView, setCurrentView] = useState<CalendarView>(initialView);

    const api = (): CalendarApi | undefined => calRef.current?.getApi();

    useEffect(() => {
        const mql = window.matchMedia('(max-width: 640px)');
        const handler = (e: MediaQueryListEvent | MediaQueryList) => {
            const mobile = 'matches' in e ? e.matches : (e.currentTarget?.matches ?? false);
            setIsMobile(mobile);
            const targetView = mobile ? 'timeGridWeek' : initialView;
            if (api()?.view.type !== targetView) {
                api()?.changeView(targetView);
            }
        };
        handler(mql);
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, [initialView]);

    const dayIndicatorMap = useMemo(() => {
        const perDayTypes = new Map<string, Set<EventType>>();
        const perDayHasAny = new Set<string>();
        for (const e of events) {
            const start = new Date(e.start);
            const end = e.end ? new Date(e.end) : new Date(e.start);
            const d = new Date(start);
            while (d <= end) {
                const key = toLocalKey(d);
                perDayHasAny.add(key);
                if (e.type) {
                    if (!perDayTypes.has(key)) perDayTypes.set(key, new Set<EventType>());
                    perDayTypes.get(key)!.add(e.type);
                }
                d.setDate(d.getDate() + 1);
            }
        }
        const result = new Map<string, DayIndicator>();
        for (const key of perDayHasAny) {
            const types = perDayTypes.get(key);
            if (!types || types.size === 0) result.set(key, 'mixed');
            else if (types.size > 1) result.set(key, 'mixed');
            else result.set(key, [...types][0]);
        }
        return result;
    }, [events]);

    const handleEventClick = (arg: EventClickArg) => {
        const eventUuid = arg.event.extendedProps['event_uuid'] as string | undefined;
        const originalEvent = events.find((e) => e.event_uuid === eventUuid);
        if (!originalEvent) return;
        if (onEventClick) onEventClick(originalEvent);
        else if (eventUuid) router.get(route('events.show', { event: eventUuid }));
    };

    const handleDateClick = (arg: DateClickArg) => onDateClick?.(arg.dateStr);
    const handleDatesSet = (arg: DatesSetArg) => {
        setViewTitle(arg.view.title);
        setCurrentView(arg.view.type as CalendarView);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="text-center md:text-left">
                        <CardTitle className="text-base md:text-lg">{title}</CardTitle>
                        <CardDescription className="text-xs md:text-sm">{description}</CardDescription>
                    </div>

                    <div className="flex items-center justify-center gap-2 md:justify-end">
                        <Button size="sm" variant="outline" onClick={() => api()?.prev()} aria-label="Previous">
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => api()?.next()} aria-label="Next">
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => api()?.today()}>
                            Today
                        </Button>

                        <div className="hidden md:block">
                            <ToggleGroup
                                type="single"
                                onValueChange={(v: CalendarView) => v && api()?.changeView(v)}
                                value={currentView}
                                className="h-8"
                            >
                                <ToggleGroupItem value="dayGridMonth" className="px-2 text-xs">
                                    Month
                                </ToggleGroupItem>
                                <ToggleGroupItem value="timeGridWeek" className="px-2 text-xs">
                                    Week
                                </ToggleGroupItem>
                                <ToggleGroupItem value="timeGridDay" className="px-2 text-xs">
                                    Day
                                </ToggleGroupItem>
                            </ToggleGroup>
                        </div>

                        <div className="md:hidden">
                            <Select onValueChange={(v: CalendarView) => api()?.changeView(v)} value={currentView}>
                                <SelectTrigger className="h-8 w-[110px] text-xs">
                                    <SelectValue placeholder="View" />
                                </SelectTrigger>
                                <SelectContent align="end">
                                    <SelectItem value="dayGridMonth">Month</SelectItem>
                                    <SelectItem value="timeGridWeek">Week</SelectItem>
                                    <SelectItem value="timeGridDay">Day</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="mt-1 text-center text-sm font-semibold md:text-left">{viewTitle}</div>
            </CardHeader>

            <CardContent>
                <FullCalendar
                    ref={calRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView={isMobile ? 'timeGridWeek' : initialView}
                    headerToolbar={false}
                    height={currentView === 'dayGridMonth' ? 'auto' : 650}
                    expandRows={currentView === 'dayGridMonth'}
                    weekends
                    dayMaxEvents={isMobile ? 2 : 3}
                    moreLinkText={(n) => `+ ${n} more`}
                    moreLinkClassNames="text-primary-600 dark:text-primary-400 hover:underline text-[10px] md:text-[11px]"
                    events={events}
                    eventClick={handleEventClick}
                    dateClick={handleDateClick}
                    datesSet={handleDatesSet}
                    eventClassNames={(arg) => {
                        const t = arg.event.extendedProps['type'] as EventType | undefined;
                        const base = isMobile
                            ? 'border text-[10px] px-1 py-0 rounded-sm cursor-pointer'
                            : 'border text-[11px] px-1 py-0 rounded-sm cursor-pointer';
                        return [
                            base,
                            t ? typeClassMap[t] : 'bg-primary/10 border-primary/30 text-primary-900 dark:bg-primary/20 dark:text-primary-100',
                        ];
                    }}
                    dayHeaderClassNames={() =>
                        '!bg-white !border-zinc-200 !text-zinc-700 ' +
                        'dark:!bg-zinc-900 dark:!border-zinc-800 dark:!text-zinc-200'
                    }
                    slotLaneClassNames="!bg-white !border-zinc-200 dark:!bg-zinc-900 dark:!border-zinc-800"
                    slotLabelClassNames="!text-zinc-500 dark:!text-zinc-400"
                    dayHeaderContent={(arg: DayHeaderContentArg) => {
                        const weekday = arg.date.toLocaleDateString(undefined, { weekday: 'short' });
                        const dayNum = arg.date.getDate();
                        const isMonth = arg.view.type === 'dayGridMonth';

                        return (
                            <div className="flex flex-col items-center py-1">
                                <span className="text-[11px] font-medium text-zinc-700 md:text-sm dark:text-zinc-200">{weekday}</span>
                                {!isMonth && <span className="text-[10px] text-zinc-500 md:text-xs dark:text-zinc-400">{dayNum}</span>}
                            </div>
                        );
                    }}
                    eventContent={renderEventContent}
                    dayCellContent={(arg) => renderDayCellContent(arg, dayIndicatorMap, isMobile)}
                    eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: false }}
                    slotLabelFormat={{ hour: 'numeric', minute: '2-digit', meridiem: false }}
                />
            </CardContent>
        </Card>
    );
}

const renderEventContent: FC<EventContentArg> = ({ event }) => {
    const isAllDay = event.allDay;
    const start = event.start!;
    const end = event.end;
    const location = event.extendedProps['location'] as string | undefined | null;

    const timeText = isAllDay ? 'All-day' : start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const tooltipDate = `${start.toLocaleDateString([], { dateStyle: 'medium' })} at ${start.toLocaleTimeString([], { timeStyle: 'short' })}`;
    const tooltipEnd = end ? ` – ${end.toLocaleTimeString([], { timeStyle: 'short' })}` : '';

    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="fc-event-main-frame overflow-hidden">
                        <div className="fc-event-time text-[10px] leading-4 font-semibold md:text-[11px]">{timeText}</div>
                        <div className="fc-event-title fc-sticky truncate text-[10px] leading-4 font-medium md:text-[11px]">{event.title}</div>
                    </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-left" side="top" align="start">
                    <p className="font-bold">{event.title}</p>
                    <p className="text-muted-foreground">
                        {tooltipDate}
                        {tooltipEnd}
                    </p>
                    {location && <p className="text-muted-foreground mt-1">Location: {location}</p>}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

function renderDayCellContent(dayCellInfo: DayCellContentArg, indicatorMap: Map<string, DayIndicator>, isMobile: boolean) {
    const key = toLocalKey(dayCellInfo.date);
    const indicator = indicatorMap.get(key);
    return (
        <div className="relative h-full w-full">
            <div className="fc-daygrid-day-number text-[10px] font-medium md:text-[11px]">{dayCellInfo.dayNumberText}</div>
            {indicator && (
                <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 ${isMobile ? 'w-4' : 'w-6'}`}>
                    <span className={`block h-0.5 w-full rounded-full ${dayIndicatorClass[indicator]}`} />
                </div>
            )}
        </div>
    );
}
