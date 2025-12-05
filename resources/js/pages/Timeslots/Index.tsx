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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { route } from '@/lib/route-helper';
import type { PaginatedResponse, SharedData, Timeslot } from '@/types';
import type { Client } from '@/types/client';
import { Head, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { CheckCircle, Trash2, X } from 'lucide-react';
import { useState } from 'react';

interface TimeslotsIndexProps extends SharedData {
    timeslots: PaginatedResponse<Timeslot>;
    filters: {
        status?: 'all' | 'available' | 'booked' | 'cancelled' | 'completed';
        date?: string;
        client_id?: number;
    };
    clients: Client[];
}

export default function Index() {
    const { timeslots, filters, auth, clients } =
        usePage<TimeslotsIndexProps>().props;
    const [cancellingId, setCancellingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [completingId, setCompletingId] = useState<number | null>(null);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showCompleteDialog, setShowCompleteDialog] = useState(false);
    const [selectedTimeslot, setSelectedTimeslot] = useState<number | null>(
        null,
    );

    const isProvider = auth.user?.role === 'service_provider';
    const isAdmin = auth.user?.role === 'admin';

    const handleCancelClick = (timeslotId: number) => {
        setSelectedTimeslot(timeslotId);
        setShowCancelDialog(true);
    };

    const handleDeleteClick = (timeslotId: number) => {
        setSelectedTimeslot(timeslotId);
        setShowDeleteDialog(true);
    };

    const handleCompleteClick = (timeslotId: number) => {
        setSelectedTimeslot(timeslotId);
        setShowCompleteDialog(true);
    };

    const handleCancelConfirm = () => {
        if (selectedTimeslot) {
            setCancellingId(selectedTimeslot);
            router.delete(route('timeslots.destroy', selectedTimeslot), {
                onFinish: () => {
                    setCancellingId(null);
                    setShowCancelDialog(false);
                    setSelectedTimeslot(null);
                },
            });
        }
    };

    const handleDeleteConfirm = () => {
        if (selectedTimeslot) {
            setDeletingId(selectedTimeslot);
            router.delete(route('timeslots.forceDelete', selectedTimeslot), {
                onFinish: () => {
                    setDeletingId(null);
                    setShowDeleteDialog(false);
                    setSelectedTimeslot(null);
                },
            });
        }
    };

    const handleCompleteConfirm = () => {
        if (selectedTimeslot) {
            setCompletingId(selectedTimeslot);
            router.patch(
                route('timeslots.complete', selectedTimeslot),
                {},
                {
                    onFinish: () => {
                        setCompletingId(null);
                        setShowCompleteDialog(false);
                        setSelectedTimeslot(null);
                    },
                },
            );
        }
    };

    const handleFilterChange = (status: string) => {
        router.get(
            route('timeslots.index'),
            {
                status: status === 'all' ? undefined : status,
                date: filters.date,
                client_id: filters.client_id,
            },
            { preserveState: true },
        );
    };

    const handleDateChange = (date: string) => {
        router.get(
            route('timeslots.index'),
            {
                status: filters.status,
                date: date || undefined,
                client_id: filters.client_id,
            },
            { preserveState: true },
        );
    };

    const handleClientChange = (clientIdOrAll: string) => {
        router.get(
            route('timeslots.index'),
            {
                status: filters.status,
                date: filters.date,
                client_id: clientIdOrAll === 'all' ? undefined : clientIdOrAll,
            },
            { preserveState: true },
        );
    };

    const handleClearFilters = () => {
        router.get(route('timeslots.index'), {}, { preserveState: true });
    };

    return (
        <AppLayout>
            <Head title="Timeslots" />
            <FlashMessages />

            <div className="space-y-6 p-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {isAdmin
                            ? 'All Timeslots'
                            : isProvider
                              ? 'My Timeslots'
                              : 'My Bookings'}
                    </h1>
                    <p className="text-muted-foreground">
                        {isAdmin
                            ? 'View and manage all timeslots in the system'
                            : isProvider
                              ? 'Manage your timeslots and client appointments'
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
                        {(isAdmin || isProvider) && (
                            <TabsTrigger value="available">
                                Available
                            </TabsTrigger>
                        )}
                        <TabsTrigger value="booked">
                            {isProvider ? 'Booked' : 'Upcoming'}
                        </TabsTrigger>
                        <TabsTrigger value="completed">Completed</TabsTrigger>
                        <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Additional Filters */}
                <div className="flex flex-wrap items-end gap-4">
                    <div className="min-w-[200px] flex-1">
                        <Label htmlFor="date-filter">Filter by Date</Label>
                        <Input
                            id="date-filter"
                            type="date"
                            value={filters.date || ''}
                            onChange={(e) => handleDateChange(e.target.value)}
                            className="mt-1"
                        />
                    </div>
                    {isProvider && clients.length > 0 && (
                        <div className="min-w-[200px] flex-1">
                            <Label htmlFor="client-filter">
                                Filter by Client
                            </Label>
                            <Select
                                value={
                                    filters.client_id
                                        ? String(filters.client_id)
                                        : 'all'
                                }
                                onValueChange={handleClientChange}
                            >
                                <SelectTrigger
                                    id="client-filter"
                                    className="mt-1"
                                >
                                    <SelectValue placeholder="All Clients" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Clients
                                    </SelectItem>
                                    {clients.map((client) => (
                                        <SelectItem
                                            key={client.id}
                                            value={String(client.id)}
                                        >
                                            {client.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {(filters.date || filters.client_id) && (
                        <Button
                            variant="outline"
                            onClick={handleClearFilters}
                            className="mb-0"
                        >
                            Clear Filters
                        </Button>
                    )}
                </div>

                {/* Timeslots Table */}
                {timeslots.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                        <h3 className="mb-2 text-lg font-semibold">
                            No timeslots found
                        </h3>
                        <p className="mb-4 text-sm text-muted-foreground">
                            {isAdmin
                                ? 'No timeslots in the system yet.'
                                : isProvider
                                  ? "You don't have any timeslots yet."
                                  : "You don't have any bookings yet."}
                        </p>
                        {!isProvider && !isAdmin && (
                            <Button
                                onClick={() => router.get(route('calendar'))}
                            >
                                Browse Calendar
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Duration</TableHead>
                                        {isAdmin && (
                                            <TableHead>Provider</TableHead>
                                        )}
                                        {(isProvider || isAdmin) && (
                                            <TableHead>Client</TableHead>
                                        )}
                                        {!isProvider && !isAdmin && (
                                            <TableHead>Provider</TableHead>
                                        )}
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {timeslots.data.map((timeslot) => (
                                    <TableRow key={timeslot.id}>
                                        <TableCell className="font-medium">
                                            {format(
                                                new Date(timeslot.start_time),
                                                'PPP',
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {format(
                                                new Date(timeslot.start_time),
                                                'p',
                                            )}{' '}
                                            -{' '}
                                            {format(
                                                new Date(timeslot.end_time),
                                                'p',
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {timeslot.duration_minutes} min
                                        </TableCell>
                                        {isAdmin && (
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">
                                                        {timeslot.provider
                                                            ?.name || 'Unknown'}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {
                                                            timeslot.provider
                                                                ?.email
                                                        }
                                                    </div>
                                                </div>
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            {isProvider || isAdmin ? (
                                                <div>
                                                    <div className="font-medium">
                                                        {timeslot.client
                                                            ?.name || (timeslot.status === 'available' ? 'N/A' : 'Unknown')}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {timeslot.client?.email}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="font-medium">
                                                        {timeslot.provider
                                                            ?.name || 'Unknown'}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {
                                                            timeslot.provider
                                                                ?.email
                                                        }
                                                    </div>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge
                                                status={timeslot.status}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {isProvider && (
                                                    <>
                                                        {timeslot.status ===
                                                            'booked' && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        handleCompleteClick(
                                                                            timeslot.id,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        cancellingId ===
                                                                            timeslot.id ||
                                                                        deletingId ===
                                                                            timeslot.id ||
                                                                        completingId ===
                                                                            timeslot.id
                                                                    }
                                                                    title="Mark as Completed"
                                                                >
                                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        handleCancelClick(
                                                                            timeslot.id,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        cancellingId ===
                                                                            timeslot.id ||
                                                                        deletingId ===
                                                                            timeslot.id ||
                                                                        completingId ===
                                                                            timeslot.id
                                                                    }
                                                                    title="Cancel Booking (Make Available)"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        handleDeleteClick(
                                                                            timeslot.id,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        cancellingId ===
                                                                            timeslot.id ||
                                                                        deletingId ===
                                                                            timeslot.id ||
                                                                        completingId ===
                                                                            timeslot.id
                                                                    }
                                                                    title="Delete Timeslot"
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                                {!isProvider &&
                                                    timeslot.status ===
                                                        'booked' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() =>
                                                                handleCancelClick(
                                                                    timeslot.id,
                                                                )
                                                            }
                                                            disabled={
                                                                cancellingId ===
                                                                timeslot.id
                                                            }
                                                            title="Cancel Booking"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {timeslots.links.length > 3 && (
                        <div className="flex items-center justify-center gap-2">
                            {timeslots.links.map((link, index) => (
                                <Button
                                    key={index}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => {
                                        if (link.url) {
                                            router.get(link.url);
                                        }
                                    }}
                                    disabled={!link.url}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </>
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
                            {isProvider
                                ? 'Are you sure you want to cancel this booking? The timeslot will be unassigned from the client and made available again.'
                                : 'Are you sure you want to cancel this booking? The timeslot will be made available for others to book.'}
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

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Timeslot</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to permanently delete this
                            timeslot? This action cannot be undone and will
                            remove the timeslot entirely.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>No, keep it</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Yes, delete timeslot
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Complete Confirmation Dialog */}
            <AlertDialog
                open={showCompleteDialog}
                onOpenChange={setShowCompleteDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Mark as Completed</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to mark this timeslot as
                            completed? This confirms that the appointment was
                            successfully completed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCompleteConfirm}
                            className="bg-green-600 text-white hover:bg-green-700"
                        >
                            Yes, mark as completed
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
