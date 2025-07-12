import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
    is_impersonating: boolean;
}

export interface AuthUser {
    id: number
    name: string
    email: string
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
    start_time: string;
    end_time: string;
    max_guests_per_registration: number;
    building: { id: number; name: string };
    room: { id: number; name: string; code: string };
    creator: { id: number; name: string };
    registrations?: Registration[];
    staff?: User[];
}

export interface QuestionnaireCategory {
    id: number;
    title: string;
    description: string | null;
    is_active: boolean;
    questions_count: number;
    created_at: string;
    updated_at: string;
}

export interface Registration {
    id: number;
    uuid: string;
    event_id: number;
    user_id: number;
    guest_count: number;
    status: 'approved' | 'pending' | 'rejected' | 'attended' | 'missed';
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
    name: string;
    email: string;
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
