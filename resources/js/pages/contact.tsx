import { AmbientBackground } from '@/components/ambient-background';
import { Head, Link } from '@inertiajs/react';
import { Form } from '@inertiajs/react';
import { CalendarCheck, Mail } from 'lucide-react';

export default function Contact({ contactEmail }: { contactEmail: string }) {
    return (
        <>
            <Head title="Contact Us — BookSpot" />
            <div className="relative min-h-screen bg-background text-foreground">
                <AmbientBackground />

                {/* Nav */}
                <header className="border-b border-border/60 backdrop-blur-sm bg-background/70">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-75">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <CalendarCheck className="h-4 w-4" />
                            </div>
                            <span className="text-lg font-bold tracking-tight">BookSpot</span>
                        </Link>
                        <nav className="flex items-center gap-3">
                            <Link
                                href="/"
                                className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                            >
                                Back to Home
                            </Link>
                        </nav>
                    </div>
                </header>

                {/* Contact Section */}
                <section className="mx-auto max-w-2xl px-6 py-20">
                    <div className="mb-8">
                        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white lg:text-5xl">
                            Get in touch
                        </h1>
                        <p className="text-lg text-gray-500 dark:text-gray-400">
                            Have a question or feedback? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                        </p>
                    </div>

                    {/* Contact Form */}
                    <div className="rounded-2xl border border-border/60 bg-card/70 p-8 backdrop-blur-sm">
                        <Form action="/contact" method="post" resetOnSuccess>
                            {({ errors, processing, wasSuccessful }) => (
                                <div className="space-y-6">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                            placeholder="Your name"
                                        />
                                        {errors.name && (
                                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                            placeholder="you@example.com"
                                        />
                                        {errors.email && (
                                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                                        )}
                                    </div>

                                    {/* Subject */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Subject *
                                        </label>
                                        <input
                                            type="text"
                                            name="subject"
                                            required
                                            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                            placeholder="What is this about?"
                                        />
                                        {errors.subject && (
                                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.subject}</p>
                                        )}
                                    </div>

                                    {/* Message */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Message *
                                        </label>
                                        <textarea
                                            name="message"
                                            required
                                            rows={6}
                                            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                            placeholder="Tell us what's on your mind..."
                                        />
                                        {errors.message && (
                                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.message}</p>
                                        )}
                                    </div>

                                    {/* Success Message */}
                                    {wasSuccessful && (
                                        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900/30 dark:bg-green-900/20 dark:text-green-400">
                                            Thank you for your message! We'll get back to you shortly.
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing ? 'Sending...' : (
                                            <>
                                                Send Message <Mail className="h-4 w-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </Form>
                    </div>

                    {/* Contact Info */}
                    {contactEmail && (
                        <div className="mt-12 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                For urgent matters, please email us directly at{' '}
                                <a href={`mailto:${contactEmail}`} className="font-semibold text-primary hover:underline">
                                    {contactEmail}
                                </a>
                            </p>
                        </div>
                    )}
                </section>

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
                            <Mail className="h-3 w-3" />
                            Contact us anytime
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
