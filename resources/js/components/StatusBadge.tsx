import { Badge } from './ui/badge';

interface StatusBadgeProps {
    status: 'available' | 'booked' | 'cancelled' | 'completed' | string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export default function StatusBadge({ status, variant }: StatusBadgeProps) {
    // If custom variant provided, use it with the status as-is
    if (variant) {
        return <Badge variant={variant}>{status}</Badge>;
    }

    // Otherwise use predefined mapping for booking statuses
    const variants = {
        available: {
            variant: 'default' as const,
            className: 'bg-green-100 text-green-700 hover:bg-green-100',
            label: 'Available',
        },
        booked: {
            variant: 'default' as const,
            className: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
            label: 'Booked',
        },
        cancelled: {
            variant: 'secondary' as const,
            className: '',
            label: 'Cancelled',
        },
        completed: {
            variant: 'secondary' as const,
            className: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
            label: 'Completed',
        },
    };

    const config = variants[status as keyof typeof variants];

    if (!config) {
        return <Badge>{status}</Badge>;
    }

    return (
        <Badge variant={config.variant} className={config.className}>
            {config.label}
        </Badge>
    );
}
