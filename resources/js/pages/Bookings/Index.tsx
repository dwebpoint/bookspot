import { Head, router, usePage } from '@inertiajs/react';
import { route } from '@/lib/route-helper';
import { format } from 'date-fns';
import { Calendar, Trash2 } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TimeslotWithProvider, SharedData } from '@/types';

interface BookingsIndexProps extends SharedData {
    bookings: TimeslotWithProvider[];
    filters: {
        status?: 'all' | 'booked' | 'cancelled' | 'completed';
    };
}

export default function Index() {
    const { bookings, filters } = usePage<BookingsIndexProps>().props;
    const [cancellingId, setCancellingId] = useState<number | null>(null);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [selectedTimeslot, setSelectedTimeslot] = useState<number | null>(null);

    const handleCancelClick = (timeslotId: number) => {
        setSelectedTimeslot(timeslotId);
        setShowCancelDialog(true);
    };

    const handleCancelConfirm = () => {
        if (selectedTimeslot) {
            setCancellingId(selectedTimeslot);
            router.delete(route('bookings.destroy', selectedTimeslot), {
                onFinish: () => {
                    setCancellingId(null);
                    setShowCancelDialog(false);
                    setSelectedTimeslot(null);
                },
            });
        }
    };

    const handleFilterChange = (status: string) => {
        router.get(
            route('bookings.index'),
            { status: status === 'all' ? undefined : status },
            { preserveState: true }
        );
    };

    return (
        <AppLayout>
            <Head title="Bookings" />
            <FlashMessages />

            <div className="space-y-6 p-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        My Bookings
                    </h1>
                    <p className="text-muted-foreground">
                        View and manage your appointment bookings
                    </p>
                </div>

                {/* Status Filter Tabs */}
                <Tabs
                    value={filters.status || 'all'}
                    onValueChange={handleFilterChange}
                >
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="booked">Upcoming</TabsTrigger>
                        <TabsTrigger value="completed">Completed</TabsTrigger>
                        <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Bookings List */}
                {bookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                        <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
                        <h3 className="mb-2 text-lg font-semibold">
                            No bookings found
                        </h3>
                        <p className="mb-4 text-sm text-muted-foreground">
                            You don't have any bookings yet.
                        </p>
                        <Button onClick={() => router.get(route('calendar'))}>
                            Browse Calendar
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {bookings.map((timeslot) => (
                            <Card key={timeslot.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="flex items-center gap-2">
                                                {timeslot.provider.name}
                                                <StatusBadge status={timeslot.status} />
                                            </CardTitle>
                                            <p className="text-sm text-muted-foreground">
                                                {timeslot.provider.email}
                                            </p>
                                        </div>
                                        {timeslot.status === 'booked' && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    handleCancelClick(timeslot.id)
                                                }
                                                disabled={
                                                    cancellingId === timeslot.id
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span>
                                                {format(
                                                    new Date(timeslot.start_time),
                                                    'PPP'
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">
                                                Time:
                                            </span>
                                            <span className="font-medium">
                                                {format(
                                                    new Date(timeslot.start_time),
                                                    'p'
                                                )}{' '}
                                                -{' '}
                                                {format(
                                                    new Date(timeslot.end_time),
                                                    'p'
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">
                                                Duration:
                                            </span>
                                            <span>
                                                {timeslot.duration_minutes} minutes
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">
                                                Booked on:
                                            </span>
                                            <span>
                                                {format(
                                                    new Date(timeslot.created_at),
                                                    'PPp'
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Cancel Confirmation Dialog */}
            <AlertDialog
                open={showCancelDialog}
                onOpenChange={setShowCancelDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel this booking? This
                            action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>No, keep it</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancelConfirm}>
                            Yes, cancel booking
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
