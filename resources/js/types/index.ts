import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
    is_impersonating: boolean;
}

export interface AuthUser {
    id: number
    uuid: string
    name: string
    email: string
    phone: string;
    permissions: string[]
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface Building {
    id: number;
    code: string;
    name: string;
    created_at?: string;
    updated_at?: string;
}

export interface Event {
    id: number;
    uuid: string;
    name: string;
    description: string;
    organizer: string;
    type: 'free' | 'paid' | 'private';
    price: number;
    start_time: string;
    end_time: string;
    max_guests_per_registration: number;
    building: { id: number; name: string };
    room: { id: number; name: string; code: string };
    creator: { id: number; name: string };
    registrations?: Registration[];
    staff?: User[];
}

export interface Transaction {
    id: number;
    user_uuid: string;
    event_uuid: string;
    order_id: string;
    total_amount: number;
    status: 'pending' | 'paid' | 'failed' | 'expired';
    transaction_id: string | null;
    expires_at: string | null;
    created_at: string;
    updated_at: string;
    event: Event;
    user: User;
    registration?: Registration;
}

export interface Registration {
    id: number;
    uuid: string;
    event_uuid: string;
    user_uuid: string;
    order_id: string | null;
    guest_count: number;
    status: 'approved' | 'pending' | 'rejected' | 'attended' | 'pending_payment' |  'missed';
    registered_at: string;
    approved_at: string | null;
    created_at: string;
    updated_at: string;
    user?: User;
    attendees?: RegistrationAttendee[];
    event: Event;
}

export interface RegistrationAttendee {
    id: number;
    registration_id: number;
    attendee_type: 'user' | 'guest';
    name: string;
    phone: string | null;
    qr_code: string;
    attended_at: string | null;
    cancelled_at: string | null;
    created_at: string;
    updated_at: string;
    signed_url?: string | null;
}

export interface PublicEventShowProps {
    event: Event;
    userRegistration: Registration | null;
    canRegister: boolean;
    totalRegistered: number;
    isAuthenticated: boolean;
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export type PaginatedData<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
    first_page_url?: string;
    last_page_url?: string;
    next_page_url?: string | null;
    prev_page_url?: string | null;
    from?: number | null;
    to?: number | null;
    path?: string;
};


export interface PaginatedEvents {
    data: Event[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

export interface PublicEventsIndexProps {
    events: PaginatedEvents;
}


export interface Room {
    id: number;
    code: string;
    name: string;
    building_id: number;
    created_at?: string;
    updated_at?: string;
    building?: Building | null;
}


export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    permission?: string;
    role?: string | string[];
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    [key: string]: unknown;
}

export interface User {
    id: number;
    uuid: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    roles: Role[];
    permissions?: string[];
    [key: string]: unknown;
}

export type Role = {
    id: number
    name: string
    created_at?: string
    updated_at?: string
}


export interface FormDialogProps {
    title: string;
    triggerText?: string;
    isLoading?: boolean;
    isOpen?: boolean;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
}

export interface ConfirmDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: string
    onConfirm: () => void
    isLoading?: boolean
}

export type RoleFormData = {
    roles: string[]
}

export interface Permission {
    id: number
    name: string
    guard_name: string
}

export interface RolePermissionPageProps {
    role: Role
    permissions: Record<string, Permission[]>
    assigned: string[]
}

export interface UserGrowthData {
    date: string;
    count: number;
}

export interface RoomAvailability {
    id: number;
    name: string;
    building: string;
    status: 'Available' | 'In Use';
    event_name: string | null;
}

export interface EventTypeDistribution {
    type: 'free' | 'paid' | 'private';
    count: number;
}

export interface EventWithPendingCount extends Event {
    pending_requests_count: number;
}

// For the "Upcoming Managed Schedule" widget
export interface EventWithRegistrationsCount extends Event {
    registrations_count: number;
}

// For the "Attendance Performance" chart widget
export interface AttendancePerformanceData {
    name: string;
    registered: number;
    attended: number;
}

// For the "Registrations Per Event" chart widget
export interface RegistrationsPerEventData {
    name: string;
    registrants: number;
}

export interface MonthlyAttendanceData {
    month: string; // e.g., "Jan", "Feb"
    attended: number;
    missed: number;
}

export type CalendarEvent = {
    id: string;
    title: string;
    start: string;
    end: string;
    location?: string | null;
    event_uuid: string;
    type?: 'free' | 'paid' | 'private';
};
