import type { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';

interface RoleGuardProps {
    allowedRoles: Array<'admin' | 'service_provider' | 'client'>;
    children: ReactNode;
    fallback?: ReactNode;
}

export default function RoleGuard({
    allowedRoles,
    children,
    fallback = null,
}: RoleGuardProps) {
    const { auth } = usePage<SharedData>().props;

    if (!auth.user || !allowedRoles.includes(auth.user.role)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
