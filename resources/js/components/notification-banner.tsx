import { destroy as notificationDestroy } from '@/actions/App/Http/Controllers/NotificationController';
import type { AppNotification, SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { Bell, X } from 'lucide-react';
import { useState } from 'react';

function formatRelativeTime(isoString: string): string {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) {
        return 'Just now';
    }

    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
        return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);

    return `${days}d ago`;
}

function formatMessage(notification: AppNotification): string {
    const { data } = notification;
    const date = new Date(data.timeslot_start_time).toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    if (data.action === 'booked') {
        return `${data.client_name} booked a timeslot on ${date}`;
    }

    return `${data.client_name} cancelled a timeslot on ${date}`;
}

export function NotificationBanner() {
    const { notifications } = usePage<SharedData>().props;
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    const visible = notifications.filter((n) => !dismissed.has(n.id));

    if (visible.length === 0) {
        return null;
    }

    function dismiss(id: string) {
        setDismissed((prev) => new Set([...prev, id]));
        router.delete(notificationDestroy(id).url, { preserveScroll: true });
    }

    return (
        <div className="flex flex-col gap-2 px-6 pt-4 md:px-4">
            {visible.map((notification) => (
                <div
                    key={notification.id}
                    className={`flex items-center justify-between gap-4 rounded-lg border-l-4 px-4 py-3.5 text-sm font-medium shadow-sm ${
                        notification.data.action === 'booked'
                            ? 'border-l-blue-500 bg-blue-100 text-blue-900 ring-1 ring-blue-200 dark:bg-blue-900/40 dark:text-blue-100 dark:ring-blue-700'
                            : 'border-l-amber-500 bg-amber-100 text-amber-900 ring-1 ring-amber-200 dark:bg-amber-900/40 dark:text-amber-100 dark:ring-amber-700'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <Bell
                            className={`h-4 w-4 shrink-0 ${
                                notification.data.action === 'booked' ? 'text-blue-500' : 'text-amber-500'
                            }`}
                        />
                        <span>{formatMessage(notification)}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                        <span className="text-xs opacity-60">{formatRelativeTime(notification.created_at)}</span>
                        <button
                            type="button"
                            aria-label="Dismiss notification"
                            onClick={() => dismiss(notification.id)}
                            className="rounded p-0.5 opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
