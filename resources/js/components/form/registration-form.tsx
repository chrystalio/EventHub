import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { UsersIcon, UserIcon } from 'lucide-react';
import type { Event, Registration } from '@/types';

interface RegistrationFormProps {
    event: Event;
    userRegistration?: Registration | null;
    canRegister: boolean;
    onSuccess?: () => void;
}

interface GuestForm {
    name: string;
    email: string;
    phone: string;
}

export default function RegistrationForm({ event, userRegistration, canRegister, onSuccess }: RegistrationFormProps) {
    const [guestCount, setGuestCount] = useState(0);
    const [guests, setGuests] = useState<GuestForm[]>([]);

    const { data, setData, post, delete: destroy, processing, errors, reset } = useForm({
        guest_count: 0,
        guests: [] as GuestForm[],
    });

    // Update guest forms when count changes
    const handleGuestCountChange = (count: number) => {
        setGuestCount(count);
        setData('guest_count', count);

        // Adjust guests array
        const newGuests = [...guests];
        if (count > guests.length) {
            // Add new guest forms
            for (let i = guests.length; i < count; i++) {
                newGuests.push({
                    name: '',
                    email: '',
                    phone: '',
                });
            }
        } else {
            // Remove excess guest forms
            newGuests.splice(count);
        }
        setGuests(newGuests);
        setData('guests', newGuests);
    };

    // Update individual guest data
    const updateGuest = (index: number, field: keyof GuestForm, value: string) => {
        const newGuests = [...guests];
        newGuests[index] = { ...newGuests[index], [field]: value };
        setGuests(newGuests);
        setData('guests', newGuests);
    };

    // Handle registration submission
    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('events.register', event.uuid), {
            onSuccess: () => {
                reset();
                setGuestCount(0);
                setGuests([]);
                onSuccess?.();
            },
        });
    };

    // Handle registration cancellation
    const handleUnregister = () => {
        destroy(route('events.unregister', event.uuid), {
            onSuccess: () => {
                onSuccess?.();
            },
        });
    };

    // If user is already registered
    if (userRegistration) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700">
                        <UserIcon className="h-5 w-5" />
                        You're Registered!
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-green-800">Registration Confirmed</p>
                                <p className="text-sm text-green-600">
                                    {userRegistration.guest_count === 0
                                        ? 'Solo registration - just you attending'
                                        : `You + ${userRegistration.guest_count} guest${userRegistration.guest_count > 1 ? 's' : ''}`
                                    }
                                </p>
                            </div>
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                                Registered
                            </Badge>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        onClick={handleUnregister}
                        disabled={processing}
                        className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    >
                        Cancel Registration
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // If registration is closed
    if (!canRegister) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-muted-foreground">Registration Closed</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-muted border rounded-lg p-4 text-center">
                        <p className="font-medium text-muted-foreground">Registration Unavailable</p>
                        <p className="text-sm text-muted-foreground">
                            {new Date(event.start_time) <= new Date()
                                ? 'This event has already started or ended.'
                                : 'Registration is currently closed for this event.'
                            }
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Registration form
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UsersIcon className="h-5 w-5" />
                    Event Registration
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleRegister} className="space-y-6">
                    {/* Guest Count Selection */}
                    <div className="space-y-3">
                        <Label>How many guests will you bring?</Label>
                        <Select
                            value={guestCount.toString()}
                            onValueChange={(value) => handleGuestCountChange(parseInt(value))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select guest count" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">Just me (no guests)</SelectItem>
                                {Array.from({ length: event.max_guests_per_registration }, (_, i) => (
                                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                                        {i + 1} guest{i + 1 > 1 ? 's' : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.guest_count && (
                            <p className="text-sm text-red-500">{errors.guest_count}</p>
                        )}

                        {/* Guest Policy Reminder */}
                        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                            {event.max_guests_per_registration === 0
                                ? 'This event does not allow additional guests.'
                                : `You can bring up to ${event.max_guests_per_registration} guest${event.max_guests_per_registration > 1 ? 's' : ''} to this event.`
                            }
                        </div>
                    </div>

                    {/* Guest Details Forms */}
                    {guestCount > 0 && (
                        <div className="space-y-4">
                            <Separator />
                            <div>
                                <h4 className="font-medium mb-3">Guest Information</h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Please provide details for each guest you're bringing.
                                </p>
                            </div>

                            {guests.map((guest, index) => (
                                <Card key={index} className="border-dashed">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <UserIcon className="h-4 w-4" />
                                            Guest {index + 1}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <Label htmlFor={`guest_${index}_name`}>Full Name *</Label>
                                                <Input
                                                    id={`guest_${index}_name`}
                                                    value={guest.name}
                                                    onChange={(e) => updateGuest(index, 'name', e.target.value)}
                                                    required
                                                    placeholder="Enter full name"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor={`guest_${index}_email`}>Email</Label>
                                                <Input
                                                    id={`guest_${index}_email`}
                                                    type="email"
                                                    value={guest.email}
                                                    onChange={(e) => updateGuest(index, 'email', e.target.value)}
                                                    placeholder="Enter email (optional)"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor={`guest_${index}_phone`}>Phone Number</Label>
                                            <Input
                                                id={`guest_${index}_phone`}
                                                value={guest.phone}
                                                onChange={(e) => updateGuest(index, 'phone', e.target.value)}
                                                placeholder="Enter phone number (optional)"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-4">
                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            disabled={processing}
                        >
                            {processing ? 'Registering...' : 'Register for Event'}
                        </Button>
                        <p className="text-xs text-muted-foreground text-center mt-2">
                            By registering, you confirm your attendance at the scheduled time and location.
                        </p>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
