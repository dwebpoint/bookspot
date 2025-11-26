import { Head, Link, router, usePage } from '@inertiajs/react';
import { route } from '@/lib/route-helper';
import { format } from 'date-fns';
import { Edit, Trash2 } from 'lucide-react';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Timeslot, SharedData } from '@/types';

interface BookingsIndexProps extends SharedData {
    bookings: Timeslot[];
    filters: {
        status?: 'all' | 'booked' | 'cancelled' | 'completed';
    };
}

export default function Index() {
    const { bookings, filters, auth } = usePage<BookingsIndexProps>().props;
    const [cancellingId, setCancellingId] = useState<number | null>(null);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [selectedTimeslot, setSelectedTimeslot] = useState<number | null>(null);

    const isProvider = auth.user?.role === 'service_provider';

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
                        {isProvider ? 'Booked Timeslots' : 'My Bookings'}
                    </h1>
                    <p className="text-muted-foreground">
                        {isProvider
                            ? 'Manage your booked timeslots and client appointments'
                            : 'View and manage your appointment bookings'}
                    </p>
                </div>

                {/* Status Filter Tabs */}
                <Tabs
                    value={filters.status || 'all'}
                    onValueChange={handleFilterChange}
                >
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="booked">
                            {isProvider ? 'Booked' : 'Upcoming'}
                        </TabsTrigger>
                        <TabsTrigger value="completed">Completed</TabsTrigger>
                        <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Bookings Table */}
                {bookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                        <h3 className="mb-2 text-lg font-semibold">
                            No bookings found
                        </h3>
                        <p className="mb-4 text-sm text-muted-foreground">
                            {isProvider
                                ? "You don't have any booked timeslots yet."
                                : "You don't have any bookings yet."}
                        </p>
                        {!isProvider && (
                            <Button onClick={() => router.get(route('calendar'))}>
                                Browse Calendar
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Duration</TableHead>
                                    {isProvider ? (
                                        <TableHead>Client</TableHead>
                                    ) : (
                                        <TableHead>Provider</TableHead>
                                    )}
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bookings.map((timeslot) => (
                                    <TableRow key={timeslot.id}>
                                        <TableCell className="font-medium">
                                            {format(
                                                new Date(timeslot.start_time),
                                                'PPP'
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {format(
                                                new Date(timeslot.start_time),
                                                'p'
                                            )}{' '}
                                            -{' '}
                                            {format(
                                                new Date(timeslot.end_time),
                                                'p'
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {timeslot.duration_minutes} min
                                        </TableCell>
                                        <TableCell>
                                            {isProvider ? (
                                                <div>
                                                    <div className="font-medium">
                                                        {timeslot.client?.name || 'Unknown'}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {timeslot.client?.email}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="font-medium">
                                                        {timeslot.provider?.name || 'Unknown'}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {timeslot.provider?.email}
                                                    </div>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={timeslot.status} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {isProvider && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            asChild
                                                            title="View/Edit in Schedule"
                                                        >
                                                            <Link
                                                                href={route(
                                                                    'provider.timeslots.index'
                                                                )}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        {timeslot.status === 'booked' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() =>
                                                                    handleCancelClick(
                                                                        timeslot.id
                                                                    )
                                                                }
                                                                disabled={
                                                                    cancellingId ===
                                                                    timeslot.id
                                                                }
                                                                title="Cancel Booking"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </>
                                                )}
                                                {!isProvider &&
                                                    timeslot.status === 'booked' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() =>
                                                                handleCancelClick(
                                                                    timeslot.id
                                                                )
                                                            }
                                                            disabled={
                                                                cancellingId ===
                                                                timeslot.id
                                                            }
                                                            title="Cancel Booking"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
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
