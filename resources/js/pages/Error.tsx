import { AmbientBackground } from '@/components/ambient-background';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { dashboard, home } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    BookOpen,
    Calendar,
    ChevronRight,
    LayoutGrid,
    LogIn,
    RefreshCw,
    UserPlus,
    Users,
} from 'lucide-react';

interface Props {
    status: number;
}

interface ErrorInfo {
    title: string;
    description: string;
    hint: string;
    /** Show a "Refresh page" action instead of "Go back" */
    showRefresh?: boolean;
}

const errorContent: Record<number, ErrorInfo> = {
    403: {
        title: 'Access denied',
        description: "You don't have permission to view this page.",
        hint: 'This page requires a different role or permission level. If you believe this is a mistake, contact your service provider or administrator.',
    },
    404: {
        title: 'Page not found',
        description: "The page you're looking for doesn't exist or has been moved.",
        hint: 'Double-check the URL, or navigate to one of the pages below.',
    },
    405: {
        title: 'Method not allowed',
        description: "This action can't be performed that way.",
        hint: 'The page exists but does not support the request method you used. Go back and try again.',
    },
    419: {
        title: 'Page expired',
        description: 'Your session has expired.',
        hint: 'This usually happens after a long period of inactivity. Refreshing the page will restore your session.',
        showRefresh: true,
    },
    429: {
        title: 'Too many requests',
        description: "You've sent too many requests in a short period.",
        hint: 'Please wait a moment before trying again. This limit helps keep the service reliable for everyone.',
    },
    500: {
        title: 'Server error',
        description: 'Something went wrong on our end.',
        hint: "We've been notified and are looking into it. Please try again in a few minutes.",
        showRefresh: true,
    },
    503: {
        title: 'Service unavailable',
        description: "BookSpot is temporarily offline for maintenance.",
        hint: 'We should be back shortly. Thanks for your patience.',
        showRefresh: true,
    },
};

// ─── Guest layout (standalone card) ───────────────────────────────────────────

function GuestError({
    status,
    title,
    description,
    hint,
    showRefresh,
    navLinks,
}: {
    status: number;
    title: string;
    description: string;
    hint: string;
    showRefresh?: boolean;
    navLinks: { title: string; href: string; icon: React.ElementType }[];
}) {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
            <AmbientBackground />

            <div className="w-full max-w-md">
                <div className="flex flex-col gap-8 rounded-2xl border border-border/50 bg-card/70 p-8 shadow-xl backdrop-blur-md">
                    <div className="flex flex-col items-center gap-4">
                        <Link href={home()} className="flex flex-col items-center gap-2 font-medium">
                            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                                <AppLogoIcon className="size-5" />
                            </div>
                            <span className="text-sm font-bold tracking-tight">BookSpot</span>
                        </Link>

                        <div className="space-y-2 text-center">
                            <p className="text-5xl font-bold tabular-nums text-muted-foreground/40">{status}</p>
                            <h1 className="text-xl font-medium">{title}</h1>
                            <p className="text-sm text-muted-foreground">{description}</p>
                        </div>

                        <p className="rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-center text-sm text-muted-foreground">
                            {hint}
                        </p>
                    </div>

                    <div className="flex flex-col gap-2">
                        {showRefresh ? (
                            <Button onClick={() => window.location.reload()}>
                                <RefreshCw className="mr-2 size-4" />
                                Refresh page
                            </Button>
                        ) : (
                            <Button onClick={() => router.visit(home())}>Go to home</Button>
                        )}
                        <Button variant="outline" onClick={() => window.history.back()}>
                            <ArrowLeft className="mr-2 size-4" />
                            Go back
                        </Button>
                    </div>

                    <Separator />

                    <div className="space-y-1">
                        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Get started
                        </p>
                        {navLinks.map(({ title: label, href, icon: Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                                <span className="flex items-center gap-2.5">
                                    <Icon className="size-4 text-muted-foreground" />
                                    {label}
                                </span>
                                <ChevronRight className="size-3.5 text-muted-foreground/50" />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Authenticated layout (app shell with sidebar) ────────────────────────────

function AuthError({
    status,
    title,
    description,
    hint,
    showRefresh,
    navLinks,
}: {
    status: number;
    title: string;
    description: string;
    hint: string;
    showRefresh?: boolean;
    navLinks: { title: string; href: string; icon: React.ElementType }[];
}) {
    return (
        <AppLayout>
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
                <div className="w-full max-w-lg space-y-8">
                    {/* Status + heading */}
                    <div className="space-y-3">
                        <p className="text-7xl font-bold tabular-nums text-muted-foreground/25">{status}</p>
                        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                        <p className="text-muted-foreground">{description}</p>
                    </div>

                    {/* Hint */}
                    <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                        {hint}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                        {showRefresh ? (
                            <Button onClick={() => window.location.reload()}>
                                <RefreshCw className="mr-2 size-4" />
                                Refresh page
                            </Button>
                        ) : (
                            <Button onClick={() => router.visit(dashboard().url)}>Go to dashboard</Button>
                        )}
                        <Button variant="outline" onClick={() => window.history.back()}>
                            <ArrowLeft className="mr-2 size-4" />
                            Go back
                        </Button>
                    </div>

                    <Separator />

                    {/* Navigation grid */}
                    <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Where would you like to go?
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {navLinks.map(({ title: label, href, icon: Icon }) => (
                                <Link
                                    key={String(href)}
                                    href={href}
                                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-card px-4 py-3 text-sm transition-colors hover:border-border hover:bg-accent hover:text-accent-foreground"
                                >
                                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                                    <span className="font-medium">{label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Error({ status }: Props) {
    const { auth } = usePage<SharedData>().props;
    const user = auth?.user;

    const { title, description, hint, showRefresh } = errorContent[status] ?? {
        title: 'Something went wrong',
        description: 'An unexpected error occurred.',
        hint: 'Please try again or navigate to one of the pages below.',
    };

    const authNavLinks = [
        { title: 'Dashboard', href: dashboard().url, icon: LayoutGrid },
        { title: 'Calendar', href: '/calendar', icon: Calendar },
        { title: 'Timeslots', href: '/timeslots', icon: BookOpen },
        ...(user?.role === 'service_provider' || user?.role === 'admin'
            ? [{ title: 'Clients', href: '/provider/clients', icon: Users }]
            : []),
        ...(user?.role === 'admin'
            ? [{ title: 'User management', href: '/admin/users', icon: Users }]
            : []),
    ];

    const guestNavLinks = [
        { title: 'Log in', href: '/login', icon: LogIn },
        { title: 'Create an account', href: '/register', icon: UserPlus },
    ];

    const pageTitle = `${status} — ${title}`;

    if (user) {
        return (
            <>
                <Head title={pageTitle} />
                <AuthError
                    status={status}
                    title={title}
                    description={description}
                    hint={hint}
                    showRefresh={showRefresh}
                    navLinks={authNavLinks}
                />
            </>
        );
    }

    return (
        <>
            <Head title={pageTitle} />
            <GuestError
                status={status}
                title={title}
                description={description}
                hint={hint}
                showRefresh={showRefresh}
                navLinks={guestNavLinks}
            />
        </>
    );
}
