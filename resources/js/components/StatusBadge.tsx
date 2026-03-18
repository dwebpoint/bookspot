import { CheckCircle2, CircleDot, CalendarCheck } from 'lucide-react';
import { Badge } from './ui/badge';

interface StatusBadgeProps {
    status: 'available' | 'booked' | 'completed' | string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export default function StatusBadge({ status, variant }: StatusBadgeProps) {
    if (variant) {
        return <Badge variant={variant}>{status}</Badge>;
    }

    const variants = {
        available: {
            className:
                'bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/30',
            label: 'Available',
            icon: CircleDot,
        },
        booked: {
            className:
                'bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/30',
            label: 'Booked',
            icon: CalendarCheck,
        },
        completed: {
            className:
                'bg-gray-100 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-800',
            label: 'Completed',
            icon: CheckCircle2,
        },
    };

    const config = variants[status as keyof typeof variants];

    if (!config) {
        return <Badge>{status}</Badge>;
    }

    const Icon = config.icon;

    return (
        <Badge
            variant="default"
            className={`inline-flex items-center gap-1 ${config.className}`}
        >
            <Icon className="h-3 w-3" />
            {config.label}
        </Badge>
    );
}
