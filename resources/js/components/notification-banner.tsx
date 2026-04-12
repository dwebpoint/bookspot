import { destroy as notificationDestroy } from '@/actions/App/Http/Controllers/NotificationController';
import type { AppNotification, SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { X } from 'lucide-react';
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
                    className={`flex items-start justify-between gap-4 rounded-lg border px-4 py-3 text-sm ${
                        notification.data.action === 'booked'
                            ? 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100'
                            : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100'
                    }`}
                >
                    <span>{formatMessage(notification)}</span>
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
