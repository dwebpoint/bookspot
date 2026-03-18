import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { format, formatDistanceToNow } from 'date-fns';
import {
    ArrowRight,
    CalendarCheck,
    CalendarDays,
    CheckCircle2,
    Clock,
    Plus,
    Users,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
];

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
    label,
    value,
    icon: Icon,
    accent = false,
}: {
    label: string;
    value: number | string;
    icon: React.ElementType;
    accent?: boolean;
}) {
    return (
        <div
            className={`rounded-xl border p-5 ${
                accent
                    ? 'border-primary/20 bg-primary/5 dark:bg-primary/10'
                    : 'border-border bg-card'
            }`}
        >
            <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                    {label}
                </span>
                <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        accent
                            ? 'bg-primary/15 text-primary'
                            : 'bg-muted text-muted-foreground'
                    }`}
                >
                    <Icon className="h-4 w-4" />
                </div>
            </div>
            <p
                className={`text-3xl font-bold ${accent ? 'text-primary' : 'text-foreground'}`}
            >
                {value}
            </p>
        </div>
    );
}

// ── Next appointment card ──────────────────────────────────────────────────────

function NextAppointmentCard({
    appointment,
    personLabel,
    personName,
}: {
    appointment: {
        id: number;
        start_time: string;
        end_time: string;
        duration_minutes: number;
    };
    personLabel: string;
    personName: string;
}) {
    const start = new Date(appointment.start_time);
    const end = new Date(appointment.end_time);

    return (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 dark:bg-primary/10">
            <div className="mb-3 flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">
                    Next appointment
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                    {formatDistanceToNow(start, { addSuffix: true })}
                </span>
            </div>
            <div className="space-y-1">
                <p className="text-lg font-bold">
                    {format(start, 'EEEE, d MMMM yyyy')}
                </p>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {format(start, 'p')} – {format(end, 'p')} &middot;{' '}
                    {appointment.duration_minutes} min
                </div>
                <p className="text-sm text-muted-foreground">
                    {personLabel}:{' '}
                    <span className="font-medium text-foreground">
                        {personName}
                    </span>
                </p>
            </div>
        </div>
    );
}

// ── Provider dashboard ─────────────────────────────────────────────────────────

interface ProviderStats {
    role: 'service_provider';
    today_total: number;
    today_booked: number;
    available_this_week: number;
    booked_this_week: number;
    total_clients: number;
    next_appointment: {
        id: number;
        start_time: string;
        end_time: string;
        duration_minutes: number;
        client?: { id: number; name: string; email: string };
    } | null;
}

function ProviderDashboard({ stats }: { stats: ProviderStats }) {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    label="Today's slots"
                    value={stats.today_total}
                    icon={CalendarDays}
                />
                <StatCard
                    label="Booked today"
                    value={stats.today_booked}
                    icon={CalendarCheck}
                    accent
                />
                <StatCard
                    label="Available this week"
                    value={stats.available_this_week}
                    icon={Clock}
                />
                <StatCard
                    label="Total clients"
                    value={stats.total_clients}
                    icon={Users}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {stats.next_appointment ? (
                    <NextAppointmentCard
                        appointment={stats.next_appointment}
                        personLabel="Client"
                        personName={
                            stats.next_appointment.client?.name ?? 'Unknown'
                        }
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
                        <CalendarDays className="mb-3 h-8 w-8 text-muted-foreground/50" />
                        <p className="mb-1 font-medium">No upcoming appointments</p>
                        <p className="mb-4 text-sm text-muted-foreground">
                            Create timeslots so clients can book with you.
                        </p>
                        <Link
                            href="/calendar"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                        >
                            <Plus className="h-4 w-4" /> Create timeslot
                        </Link>
                    </div>
                )}

                <div className="rounded-xl border border-border bg-card p-5">
                    <h3 className="mb-4 font-semibold">Quick actions</h3>
                    <div className="space-y-2">
                        <Link
                            href="/calendar"
                            className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:bg-accent"
                        >
                            <span className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-primary" />
                                View calendar
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </Link>
                        <Link
                            href="/timeslots"
                            className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:bg-accent"
                        >
                            <span className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary" />
                                All timeslots
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </Link>
                        <Link
                            href="/provider/clients"
                            className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:bg-accent"
                        >
                            <span className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" />
                                Manage clients
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Client dashboard ───────────────────────────────────────────────────────────

interface ClientStats {
    role: 'client';
    upcoming_count: number;
    completed_count: number;
    provider_count: number;
    next_appointment: {
        id: number;
        start_time: string;
        end_time: string;
        duration_minutes: number;
        provider?: { id: number; name: string; email: string };
    } | null;
}

function ClientDashboard({ stats }: { stats: ClientStats }) {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                    label="Upcoming bookings"
                    value={stats.upcoming_count}
                    icon={CalendarCheck}
                    accent
                />
                <StatCard
                    label="Completed visits"
                    value={stats.completed_count}
                    icon={CheckCircle2}
                />
                <StatCard
                    label="My providers"
                    value={stats.provider_count}
                    icon={Users}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {stats.next_appointment ? (
                    <NextAppointmentCard
                        appointment={stats.next_appointment}
                        personLabel="With"
                        personName={
                            stats.next_appointment.provider?.name ?? 'Unknown'
                        }
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
                        <CalendarDays className="mb-3 h-8 w-8 text-muted-foreground/50" />
                        <p className="mb-1 font-medium">No upcoming bookings</p>
                        <p className="mb-4 text-sm text-muted-foreground">
                            Browse available timeslots and book an appointment.
                        </p>
                        <Link
                            href="/calendar"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                        >
                            <CalendarDays className="h-4 w-4" /> Browse
                            calendar
                        </Link>
                    </div>
                )}

                <div className="rounded-xl border border-border bg-card p-5">
                    <h3 className="mb-4 font-semibold">Quick actions</h3>
                    <div className="space-y-2">
                        <Link
                            href="/calendar"
                            className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:bg-accent"
                        >
                            <span className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-primary" />
                                Browse available slots
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </Link>
                        <Link
                            href="/timeslots"
                            className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:bg-accent"
                        >
                            <span className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary" />
                                My bookings
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Admin dashboard ────────────────────────────────────────────────────────────

interface AdminStats {
    role: 'admin';
    total_users: number;
    total_providers: number;
    total_clients: number;
    active_bookings: number;
    available_slots: number;
    completed_today: number;
}

function AdminDashboard({ stats }: { stats: AdminStats }) {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    label="Total users"
                    value={stats.total_users}
                    icon={Users}
                />
                <StatCard
                    label="Service providers"
                    value={stats.total_providers}
                    icon={CalendarDays}
                />
                <StatCard
                    label="Clients"
                    value={stats.total_clients}
                    icon={Users}
                />
                <StatCard
                    label="Active bookings"
                    value={stats.active_bookings}
                    icon={CalendarCheck}
                    accent
                />
                <StatCard
                    label="Available slots"
                    value={stats.available_slots}
                    icon={Clock}
                />
                <StatCard
                    label="Completed today"
                    value={stats.completed_today}
                    icon={CheckCircle2}
                />
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="mb-4 font-semibold">Quick actions</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                    <Link
                        href="/admin/users"
                        className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:bg-accent"
                    >
                        <span className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            User management
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </Link>
                    <Link
                        href="/timeslots"
                        className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:bg-accent"
                    >
                        <span className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-primary" />
                            All timeslots
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

type DashboardStats = ProviderStats | ClientStats | AdminStats;

interface DashboardPageProps extends SharedData {
    stats: DashboardStats;
}

const roleLabel: Record<string, string> = {
    service_provider: 'Provider',
    client: 'Client',
    admin: 'Admin',
};

export default function Dashboard() {
    const { stats, auth } = usePage<DashboardPageProps>().props;
    const userName = auth.user?.name?.split(' ')[0] ?? 'there';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="space-y-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Welcome back, {userName}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {roleLabel[stats.role] ?? 'User'} dashboard &mdash;{' '}
                        {format(new Date(), 'EEEE, d MMMM yyyy')}
                    </p>
                </div>

                {stats.role === 'service_provider' && (
                    <ProviderDashboard stats={stats} />
                )}
                {stats.role === 'client' && (
                    <ClientDashboard stats={stats} />
                )}
                {stats.role === 'admin' && (
                    <AdminDashboard stats={stats} />
                )}
            </div>
        </AppLayout>
    );
}
