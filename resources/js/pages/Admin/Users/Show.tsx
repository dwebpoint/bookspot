import { Head, Link, router, usePage } from '@inertiajs/react';
import { route } from '@/lib/route-helper';
import { Calendar, Mail, MapPin, Pencil, Shield, Trash2 } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import FlashMessages from '@/components/FlashMessages';
import StatusBadge from '@/components/StatusBadge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { SharedData, Timeslot, User } from '@/types';

interface AdminUsersShowProps extends SharedData {
    user: User & {
        timeslots?: Timeslot[];
        bookedTimeslots?: Timeslot[];
    };
}

export default function Show() {
    const { user } = usePage<AdminUsersShowProps>().props;
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = () => {
        setDeleting(true);
        router.delete(route('admin.users.destroy', user.id), {
            onFinish: () => {
                setDeleting(false);
                setShowDeleteDialog(false);
            },
        });
    };

    const getRoleLabel = (role: string) => {
        const labels: Record<string, string> = {
            admin: 'Admin',
            service_provider: 'Service Provider',
            client: 'Client',
        };
        return labels[role] || role;
    };

    const getRoleBadgeVariant = (role: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            admin: 'destructive',
            service_provider: 'default',
            client: 'secondary',
        };
        return variants[role] || 'outline';
    };

    return (
        <AppLayout>
            <Head title={user.name} />
            <FlashMessages />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {user.name}
                        </h1>
                        <p className="text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild>
                            <Link href={route('admin.users.edit', user.id)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => setShowDeleteDialog(true)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>User Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{user.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                <StatusBadge
                                    status={getRoleLabel(user.role)}
                                    variant={getRoleBadgeVariant(user.role)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                    {user.timezone || 'UTC'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                    Joined{' '}
                                    {new Date(user.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {user.role === 'service_provider' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Provider Statistics</CardTitle>
                                <CardDescription>
                                    Timeslot and booking metrics
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        Total Timeslots
                                    </span>
                                    <span className="font-semibold">
                                        {user.timeslots?.length || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        Booked Timeslots
                                    </span>
                                    <span className="font-semibold">
                                        {user.timeslots?.filter((t) => t.status === 'booked')
                                            .length || 0}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {user.role === 'client' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Client Statistics</CardTitle>
                                <CardDescription>
                                    Booking activity metrics
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        Total Bookings
                                    </span>
                                    <span className="font-semibold">
                                        {user.bookedTimeslots?.length || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        Active Bookings
                                    </span>
                                    <span className="font-semibold">
                                        {user.bookedTimeslots?.filter(
                                            (t) => t.status === 'booked'
                                        ).length || 0}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete {user.name}? This will
                            also delete all their timeslots and bookings. This
                            action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? 'Deleting...' : 'Delete User'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
