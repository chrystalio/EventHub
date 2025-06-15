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
