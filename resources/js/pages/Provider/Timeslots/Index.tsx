import { Head, Link, router, usePage } from '@inertiajs/react';
import { route } from '@/lib/route-helper';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import FlashMessages from '@/components/FlashMessages';
import TimeslotCard from '@/components/TimeslotCard';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { SharedData, Timeslot } from '@/types';
import type { Client } from '@/types/client';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface ProviderTimeslotsIndexProps extends SharedData {
    timeslots: Timeslot[];
    filters: {
        status?: 'all' | 'available' | 'booked';
        date?: string;
        client_id?: number;
    };
    clients: Client[];
}

export default function Index() {
    const { timeslots, filters, clients } = usePage<ProviderTimeslotsIndexProps>().props;
    const [cancellingId, setCancellingId] = useState<number | null>(null);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [selectedTimeslot, setSelectedTimeslot] = useState<number | null>(
        null
    );

    const handleCancelClick = (timeslotId: number) => {
        setSelectedTimeslot(timeslotId);
        setShowCancelDialog(true);
    };

    const handleCancelConfirm = () => {
        if (selectedTimeslot) {
            setCancellingId(selectedTimeslot);
            router.delete(route('provider.timeslots.destroy', selectedTimeslot), {
                onFinish: () => {
                    setCancellingId(null);
                    setShowCancelDialog(false);
                    setSelectedTimeslot(null);
                },
            });
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        router.get(
            route('provider.timeslots.index'),
            {
                ...filters,
                [key]: value === 'all' || !value ? undefined : value,
            },
            { preserveState: true }
        );
    };

    return (
        <AppLayout>
            <Head title="Schedule" />
            <FlashMessages />

            <div className="space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Schedule
                        </h1>
                        <p className="text-muted-foreground">
                            Manage your available timeslots and bookings
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={route('provider.timeslots.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Timeslot
                        </Link>
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-4 md:flex-row">
                    <Tabs
                        value={filters.status || 'all'}
                        onValueChange={(value: string) =>
                            handleFilterChange('status', value)
                        }
                        className="w-full md:w-auto"
                    >
                        <TabsList>
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="available">Available</TabsTrigger>
                            <TabsTrigger value="booked">Booked</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="flex-1">
                        <Label htmlFor="date" className="sr-only">
                            Filter by date
                        </Label>
                        <Input
                            id="date"
                            type="date"
                            placeholder="Filter by date"
                            value={filters.date || ''}
                            onChange={(e) =>
                                handleFilterChange('date', e.target.value)
                            }
                        />
                    </div>

                    {clients.length > 0 && (
                        <Select
                            value={filters.client_id ? String(filters.client_id) : 'all'}
                            onValueChange={(value) =>
                                handleFilterChange('client_id', value === 'all' ? '' : value)
                            }
                        >
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="All Clients" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Clients</SelectItem>
                                {clients.map((client) => (
                                    <SelectItem key={client.id} value={String(client.id)}>
                                        {client.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {(filters.status || filters.date || filters.client_id) && (
                        <Button
                            variant="outline"
                            onClick={() =>
                                router.get(route('provider.timeslots.index'))
                            }
                        >
                            Clear Filters
                        </Button>
                    )}
                </div>

                {/* Timeslots Grid */}
                {timeslots.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                        <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
                        <h3 className="mb-2 text-lg font-semibold">
                            No timeslots found
                        </h3>
                        <p className="mb-4 text-sm text-muted-foreground">
                            Create your first timeslot to start accepting bookings.
                        </p>
                        <Button asChild>
                            <Link href={route('provider.timeslots.create')}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Timeslot
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {timeslots.map((timeslot) => (
                            <div key={timeslot.id} className="relative">
                                <TimeslotCard timeslot={timeslot} />
                                <div className="mt-2 flex gap-2">
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="w-full"
                                        onClick={() =>
                                            handleCancelClick(timeslot.id)
                                        }
                                        disabled={
                                            cancellingId === timeslot.id
                                        }
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        {cancellingId === timeslot.id
                                            ? 'Cancelling...'
                                            : 'Cancel Timeslot'}
                                    </Button>
                                </div>
                            </div>
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
                        <AlertDialogTitle>Cancel Timeslot</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel this timeslot? If it
                            has been booked, the client's booking will also be
                            cancelled. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>No, keep it</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancelConfirm}>
                            Yes, cancel timeslot
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
