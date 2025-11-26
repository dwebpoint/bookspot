/**
 * Laravel route helper for use with standard named routes
 * This is a compatibility helper until Wayfinder routes are regenerated
 */
export function route(
    name: string,
    params?: Record<string, unknown> | number | string,
    absolute = false,
): string {
    const routes: Record<string, string> = {
        // Dashboard
        dashboard: '/calendar',

        // Calendar
        calendar: '/calendar',

        // Timeslot routes
        'timeslots.index': '/timeslots',
        'timeslots.store': '/timeslots',
        'timeslots.destroy': '/timeslots/:id',
        'timeslots.complete': '/timeslots/:id/complete',
        'timeslots.forceDelete': '/timeslots/:id/force-delete',

        // Provider routes

        'provider.timeslots.store': '/provider/timeslots',
        'provider.timeslots.destroy': '/provider/timeslots/:id',
        'provider.timeslots.assign': '/provider/timeslots/:id/assign',
        'provider.timeslots.remove': '/provider/timeslots/:id/remove',

        // Provider client routes
        'provider.clients.index': '/provider/clients',
        'provider.clients.create': '/provider/clients/create',
        'provider.clients.store': '/provider/clients',
        'provider.clients.edit': '/provider/clients/:id/edit',
        'provider.clients.update': '/provider/clients/:id',
        'provider.clients.destroy': '/provider/clients/:id',

        // Admin routes
        'admin.users.index': '/admin/users',
        'admin.users.create': '/admin/users/create',
        'admin.users.store': '/admin/users',
        'admin.users.show': '/admin/users/:id',
        'admin.users.edit': '/admin/users/:id/edit',
        'admin.users.update': '/admin/users/:id',
        'admin.users.destroy': '/admin/users/:id',
    };

    let url = routes[name];

    if (!url) {
        console.error(`Route "${name}" not found`);
        return '/';
    }

    // Handle params
    if (params !== undefined) {
        if (typeof params === 'number' || typeof params === 'string') {
            // Simple ID param
            url = url.replace(':id', String(params));
        } else if (typeof params === 'object') {
            // Object params - replace placeholders and add query string
            Object.entries(params).forEach(([key, value]) => {
                const placeholder = `:${key}`;
                if (url.includes(placeholder)) {
                    url = url.replace(placeholder, String(value));
                }
            });
        }
    }

    return absolute ? window.location.origin + url : url;
}
