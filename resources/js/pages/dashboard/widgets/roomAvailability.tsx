import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import type { PaginatedData, RoomAvailability } from '@/types';
import { cn } from '@/lib/utils';

interface RoomAvailabilityProps {
    rooms: PaginatedData<RoomAvailability>;
}

export default function RoomAvailabilityWidget({ rooms }: RoomAvailabilityProps) {
    if (!rooms || rooms.total === 0) {
        return (
            <Card className="col-span-1 lg:col-span-2">
                <CardHeader>
                    <CardTitle>Live Room Status</CardTitle>
                    <CardDescription>An overview of room availability right now.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">No rooms found.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-1 lg:col-span-2 flex flex-col">
            <CardHeader>
                <CardTitle>Live Room Status</CardTitle>
                <CardDescription>An overview of room availability right now.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <div className="space-y-4">
                    {(rooms.data || []).map((room) => (
                        <div key={room.id} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <span className={cn(
                                    'h-2.5 w-2.5 rounded-full flex-shrink-0',
                                    room.status === 'Available' ? 'bg-green-500' : 'bg-red-500'
                                )} />
                                <div>
                                    <p className="font-medium">{room.name} <span className="text-muted-foreground">({room.building})</span></p>
                                    <p className="text-xs text-muted-foreground">{room.event_name || 'No event currently scheduled'}</p>
                                </div>
                            </div>
                            <span className={cn(
                                'text-sm font-medium',
                                room.status === 'Available' ? 'text-green-600' : 'text-red-600'
                            )}>
                                {room.status}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
            {rooms.last_page > 1 && (
                <CardFooter>
                    <div className="flex w-full justify-between items-center text-xs text-muted-foreground">
                        <span>
                            Page {rooms.current_page} of {rooms.last_page}
                        </span>
                        <div className="flex gap-2">
                            <Button asChild variant="outline" size="sm" disabled={!rooms.prev_page_url}>
                                <Link href={rooms.prev_page_url || '#'} preserveScroll preserveState>Previous</Link>
                            </Button>
                            <Button asChild variant="outline" size="sm" disabled={!rooms.next_page_url}>
                                <Link href={rooms.next_page_url || '#'} preserveScroll preserveState>Next</Link>
                            </Button>
                        </div>
                    </div>
                </CardFooter>
            )}
        </Card>
    );
}
