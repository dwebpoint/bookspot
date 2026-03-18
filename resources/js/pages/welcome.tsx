import { AmbientBackground } from '@/components/ambient-background';
import { login, register, dashboard } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { CalendarCheck, Clock, Users, CheckCircle, ArrowRight, CalendarDays, Zap, Shield } from 'lucide-react';

export default function Welcome({ canRegister = true }: { canRegister?: boolean }) {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="BookSpot — Simple Appointment Scheduling" />
            <div className="relative min-h-screen bg-background text-foreground">
                <AmbientBackground />

                {/* Nav */}
                <header className="border-b border-border/60 backdrop-blur-sm bg-background/70">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <CalendarCheck className="h-4 w-4" />
                            </div>
                            <span className="text-lg font-bold tracking-tight">BookSpot</span>
                        </div>
                        <nav className="flex items-center gap-3">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                                >
                                    Go to Dashboard <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        Log in
                                    </Link>
                                    {canRegister && (
                                        <Link
                                            href={register()}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                                        >
                                            Get started free
                                        </Link>
                                    )}
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                {/* Hero */}
                <section className="mx-auto max-w-6xl px-6 py-20 text-center">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary dark:border-primary/30 dark:bg-primary/10">
                        <Zap className="h-3.5 w-3.5" />
                        Simple. Fast. Reliable.
                    </div>
                    <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 dark:text-white lg:text-6xl">
                        Appointment scheduling
                        <br />
                        <span className="text-primary">made effortless</span>
                    </h1>
                    <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-500 dark:text-gray-400">
                        BookSpot connects service providers with their clients through a clean calendar interface.
                        Create timeslots, manage bookings, and stay on top of your schedule — all in one place.
                    </p>
                    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                        {canRegister && !auth.user && (
                            <Link
                                href={register()}
                                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
                            >
                                Start scheduling for free <ArrowRight className="h-4 w-4" />
                            </Link>
                        )}
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
                            >
                                Go to Dashboard <ArrowRight className="h-4 w-4" />
                            </Link>
                        ) : (
                            <Link
                                href={login()}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-6 py-3 text-base font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                                Sign in to your account
                            </Link>
                        )}
                    </div>
                </section>

                {/* Feature cards */}
                <section className="border-t border-border/50">
                    <div className="mx-auto max-w-6xl px-6 py-20">
                        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
                            Everything you need to manage bookings
                        </h2>
                        <div className="grid gap-8 md:grid-cols-3">
                            <div className="rounded-xl border border-border/60 bg-card/70 p-6 shadow-sm backdrop-blur-sm">
                                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <CalendarDays className="h-5 w-5" />
                                </div>
                                <h3 className="mb-2 text-lg font-semibold">Calendar-first view</h3>
                                <p className="text-sm text-muted-foreground">
                                    Browse and manage your week at a glance. Create timeslots by clicking any day and see your full schedule in one view.
                                </p>
                            </div>
                            <div className="rounded-xl border border-border/60 bg-card/70 p-6 shadow-sm backdrop-blur-sm">
                                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                                    <CheckCircle className="h-5 w-5" />
                                </div>
                                <h3 className="mb-2 text-lg font-semibold">Instant booking</h3>
                                <p className="text-sm text-muted-foreground">
                                    Clients see real-time availability and book with one click. Automatic status updates keep everyone in sync.
                                </p>
                            </div>
                            <div className="rounded-xl border border-border/60 bg-card/70 p-6 shadow-sm backdrop-blur-sm">
                                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                    <Users className="h-5 w-5" />
                                </div>
                                <h3 className="mb-2 text-lg font-semibold">Client management</h3>
                                <p className="text-sm text-muted-foreground">
                                    Build your client list, link them to your schedule, and manage all their appointments from a single dashboard.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Two-audience section */}
                <section className="mx-auto max-w-6xl px-6 py-20">
                    <div className="grid gap-12 md:grid-cols-2">
                        {/* For providers */}
                        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 dark:bg-primary/10">
                            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
                                For service providers
                            </div>
                            <h3 className="mb-4 text-2xl font-bold">Take control of your schedule</h3>
                            <ul className="space-y-3">
                                {[
                                    'Create and publish timeslots in seconds',
                                    'Assign clients directly or let them book themselves',
                                    'Mark appointments complete and track history',
                                    'Get email notifications on new bookings',
                                    'Manage all clients from one place',
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-2.5 text-sm">
                                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* For clients */}
                        <div className="rounded-2xl border border-border/60 bg-card/60 p-8 backdrop-blur-sm">
                            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                For clients
                            </div>
                            <h3 className="mb-4 text-2xl font-bold">Book appointments hassle-free</h3>
                            <ul className="space-y-3">
                                {[
                                    'See live availability from your providers',
                                    'Book and cancel with one click',
                                    'View all upcoming appointments in one list',
                                    'Reminders for appointments in the next 3 days',
                                    'Connect with multiple service providers',
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-2.5 text-sm">
                                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
                                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                {/* CTA strip */}
                {!auth.user && canRegister && (
                    <section className="border-t border-border/50">
                        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
                            <div className="mb-4 flex justify-center">
                                <Shield className="h-8 w-8 text-primary" />
                            </div>
                            <h2 className="mb-3 text-3xl font-bold">Ready to simplify your bookings?</h2>
                            <p className="mb-8 text-gray-500 dark:text-gray-400">
                                Join BookSpot and start managing your appointments today.
                            </p>
                            <Link
                                href={register()}
                                className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
                            >
                                Create your free account <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </section>
                )}

                {/* Footer */}
                <footer className="border-t border-border/50 backdrop-blur-sm bg-background/50">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
                        <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
                                <CalendarCheck className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-sm font-semibold">BookSpot</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Clock className="h-3 w-3" />
                            Your time, well spent.
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
