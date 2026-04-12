import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User | null;
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
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface AppNotification {
    id: string;
    data: {
        timeslot_id: number;
        timeslot_start_time: string;
        timeslot_duration_minutes: number;
        client_id: number;
        client_name: string;
        client_email: string;
        action: 'booked' | 'cancelled';
    };
    created_at: string;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    flash: {
        success?: string;
        error?: string;
    };
    notifications: AppNotification[];
    sidebarOpen: boolean;
    commitHash: string | null;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'service_provider' | 'client';
    timezone: string;
    email_notifications_enabled: boolean;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    timeslots_count?: number;
    bookings_count?: number;
    clients_count?: number | null;
    providers_count?: number | null;
    roles?: Array<{ id: number; name: string }>;
    [key: string]: unknown;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

export * from './booking';
export * from './timeslot';
