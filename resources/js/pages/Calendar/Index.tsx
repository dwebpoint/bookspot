import { Head, router, usePage } from '@inertiajs/react';
import { route } from '@/lib/route-helper';
import { format, eachDayOfInterval, isToday, isPast } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Plus, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import FlashMessages from '@/components/FlashMessages';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import type { SharedData, Timeslot } from '@/types';
import type { Provider } from '@/types/client';
import type { Client } from '@/types/booking';

interface CalendarPageProps extends SharedData {
    timeslots: Timeslot[];
    startDate: string; // YYYY-MM-DD format
    endDate: string; // YYYY-MM-DD format
    providers: Provider[];
    selectedProviderId?: number;
    clients: Client[];
}

export default function Calendar() {
    const { timeslots, startDate, endDate, providers, selectedProviderId, clients, auth } = usePage<CalendarPageProps>().props;
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showDialog, setShowDialog] = useState(false);
    const [selectedTimeslot, setSelectedTimeslot] = useState<Timeslot | null>(null);
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
    const [isAssigning, setIsAssigning] = useState(false);

    const isServiceProvider = auth.user?.role === 'service_provider';
    const isAdmin = auth.user?.role === 'admin';
    const isClient = auth.user?.role === 'client';
    const canSeeClientNames = isServiceProvider || isAdmin;
    
    const rangeStart = new Date(startDate);
    const rangeEnd = new Date(endDate);
    
    const calendarDays = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

    // Group timeslots by date
    const timeslotsByDate = timeslots.reduce((acc, timeslot) => {
        const date = format(new Date(timeslot.start_time), 'yyyy-MM-dd');
        if (!acc[date]) acc[date] = [];
        acc[date].push(timeslot);
        return acc;
    }, {} as Record<string, Timeslot[]>);

    const handleProviderFilter = (value: string) => {
        const params: Record<string, string> = {};
        if (value !== 'all') params.provider_id = value;
        router.get(route('calendar'), params, { preserveState: true });
    };

    const handleCreateTimeslot = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        router.get(route('provider.timeslots.create'), { date: dateStr });
    };

    const handleBookTimeslot = (timeslotId: number) => {
        router.post(
            route('bookings.store'),
            { timeslot_id: timeslotId },
            {
                onSuccess: () => {
                    setShowDialog(false);
                },
            }
        );
    };

    const handleAssignClient = () => {
        if (!selectedTimeslot || !selectedClientId) return;

        setIsAssigning(true);
        router.post(
            route('provider.timeslots.assign', selectedTimeslot.id),
            { client_id: selectedClientId },
            {
                onSuccess: () => {
                    setShowDialog(false);
                    setSelectedTimeslot(null);
                    setSelectedClientId(null);
                },
                onFinish: () => {
                    setIsAssigning(false);
                },
            }
        );
    };

    const handleTimeslotClick = (timeslot: Timeslot, date: Date) => {
        setSelectedTimeslot(timeslot);
        setSelectedDate(date);
        setSelectedClientId(timeslot.booking?.client?.id || null);
        setShowDialog(true);
    };

    const handleDialogChange = (open: boolean) => {
        setShowDialog(open);
        if (!open) {
            // Reset state when dialog closes
            setSelectedTimeslot(null);
            setSelectedDate(null);
            setSelectedClientId(null);
        }
    };

    const selectedDateTimeslots = selectedDate 
        ? timeslotsByDate[format(selectedDate, 'yyyy-MM-dd')] || []
        : [];

    const showProviderFilter = providers && providers.length > 1;

    return (
        <AppLayout>
            <Head title="Calendar" />
            <FlashMessages />

            <div className="space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Calendar
                        </h1>
                        <p className="text-muted-foreground">
                            {isClient
                                ? 'Browse and book available timeslots'
                                : 'View available timeslots in calendar format'}
                        </p>
                    </div>
                </div>

                {/* Calendar Header */}
                <Card>
                    <CardContent className="p-4">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-semibold">
                                    {format(rangeStart, 'MMM d')} - {format(rangeEnd, 'MMM d, yyyy')}
                                </h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    16-day view (Yesterday to +14 days)
                                </p>
                            </div>
                            {showProviderFilter && (
                                <Select
                                    value={selectedProviderId ? String(selectedProviderId) : 'all'}
                                    onValueChange={handleProviderFilter}
                                >
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="All Providers" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Providers</SelectItem>
                                        {providers.map((provider) => (
                                            <SelectItem key={provider.id} value={String(provider.id)}>
                                                {provider.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {calendarDays.map((day) => {
                                const dateKey = format(day, 'yyyy-MM-dd');
                                const dayTimeslots = timeslotsByDate[dateKey] || [];
                                const hasTimeslots = dayTimeslots.length > 0;
                                const isDayToday = isToday(day);
                                const isDayPast = isPast(day) && !isDayToday;

                                return (
                                    <Card 
                                        key={day.toISOString()}
                                        className={`
                                            ${isDayToday ? 'ring-2 ring-primary' : ''}
                                            ${isDayPast ? 'opacity-60' : ''}
                                        `}
                                    >
                                        <CardContent className="p-4">
                                            <div className="mb-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="text-lg font-semibold">
                                                        {format(day, 'EEE, MMM d')}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {isDayToday && (
                                                            <span className="text-xs font-medium text-primary">Today</span>
                                                        )}
                                                        {isServiceProvider && !isDayPast && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-6 px-2 text-xs"
                                                                onClick={() => handleCreateTimeslot(day)}
                                                            >
                                                                <Plus className="h-3 w-3 mr-1" />
                                                                Add
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {hasTimeslots ? (
                                                <div className="space-y-2">
                                                    {/* For clients: show available timeslots first, then booked ones */}
                                                    {isClient ? (
                                                        <>
                                                            {/* Client's own booked timeslots */}
                                                            {dayTimeslots
                                                                .filter((ts) => !ts.is_available && ts.booking?.client?.id === auth.user?.id)
                                                                .map((timeslot) => (
                                                                    <button
                                                                        key={timeslot.id}
                                                                        onClick={() => {
                                                                            handleTimeslotClick(timeslot, day);
                                                                        }}
                                                                        className="w-full text-left rounded-lg border bg-blue-50 border-blue-200 hover:bg-blue-100 p-3 transition-colors"
                                                                    >
                                                                        <div className="flex items-start justify-between gap-2">
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0" />
                                                                                    <span className="text-sm font-medium">
                                                                                        {format(new Date(timeslot.start_time), 'HH:mm')}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                                    <Clock className="h-3 w-3 flex-shrink-0" />
                                                                                    <span>{timeslot.duration_minutes} min</span>
                                                                                </div>
                                                                                {timeslot.provider && (
                                                                                    <div className="text-xs text-muted-foreground mt-1 truncate">
                                                                                        {timeslot.provider.name}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <span className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">
                                                                                Your Booking
                                                                            </span>
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                            {/* Available timeslots */}
                                                            {dayTimeslots
                                                                .filter((ts) => ts.is_available)
                                                                .map((timeslot) => (
                                                                    <button
                                                                        key={timeslot.id}
                                                                        onClick={() => {
                                                                            handleTimeslotClick(timeslot, day);
                                                                        }}
                                                                        className="w-full text-left rounded-lg border bg-green-50 border-green-200 hover:bg-green-100 p-3 transition-colors"
                                                                    >
                                                                        <div className="flex items-start justify-between gap-2">
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0" />
                                                                                    <span className="text-sm font-medium">
                                                                                        {format(new Date(timeslot.start_time), 'HH:mm')}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                                    <Clock className="h-3 w-3 flex-shrink-0" />
                                                                                    <span>{timeslot.duration_minutes} min</span>
                                                                                </div>
                                                                                {timeslot.provider && (
                                                                                    <div className="text-xs text-muted-foreground mt-1 truncate">
                                                                                        {timeslot.provider.name}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <span className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">
                                                                                Available
                                                                            </span>
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                            {/* Other booked timeslots count (not by this client) */}
                                                            {dayTimeslots.filter((ts) => !ts.is_available && ts.booking?.client?.id !== auth.user?.id).length > 0 && (
                                                                <div className="text-xs text-muted-foreground text-center pt-1">
                                                                    {dayTimeslots.filter((ts) => !ts.is_available && ts.booking?.client?.id !== auth.user?.id).length} booked by others
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        /* For providers and admins: show all timeslots */
                                                        dayTimeslots.map((timeslot) => (
                                                            <button
                                                                key={timeslot.id}
                                                                onClick={() => {
                                                                    handleTimeslotClick(timeslot, day);
                                                                }}
                                                                className={`
                                                                    w-full text-left rounded-lg border p-3 transition-colors
                                                                    ${timeslot.is_available
                                                                        ? 'bg-green-50 border-green-200 hover:bg-green-100'
                                                                        : 'bg-blue-50 border-blue-200 hover:bg-blue-100'}
                                                                `}
                                                            >
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0" />
                                                                            <span className="text-sm font-medium">
                                                                                {format(new Date(timeslot.start_time), 'HH:mm')}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                            <Clock className="h-3 w-3 flex-shrink-0" />
                                                                            <span>{timeslot.duration_minutes} min</span>
                                                                        </div>
                                                                        {timeslot.provider && !isServiceProvider && (
                                                                            <div className="text-xs text-muted-foreground mt-1 truncate">
                                                                                {timeslot.provider.name}
                                                                            </div>
                                                                        )}
                                                                        {canSeeClientNames && timeslot.booking?.client && (
                                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 truncate">
                                                                                <UserIcon className="h-3 w-3 flex-shrink-0" />
                                                                                <span>{timeslot.booking.client.name}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <span
                                                                        className={`
                                                                            flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium
                                                                            ${timeslot.is_available
                                                                                ? 'bg-green-100 text-green-700'
                                                                                : 'bg-blue-100 text-blue-700'}
                                                                        `}
                                                                    >
                                                                        {timeslot.is_available ? 'Open' : 'Booked'}
                                                                    </span>
                                                                </div>
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-center py-4">
                                                    {isServiceProvider && !isDayPast ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-muted-foreground"
                                                            onClick={() => handleCreateTimeslot(day)}
                                                        >
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            Add Timeslot
                                                        </Button>
                                                    ) : (
                                                        <div className="text-sm text-muted-foreground">
                                                            {isClient ? 'No available slots' : 'No timeslots'}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Legend */}
                <div className="flex gap-4 text-sm">
                    {isClient && (
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 rounded bg-blue-100 border border-blue-200" />
                            <span>Your Booking</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded bg-green-100 border border-green-200" />
                        <span>Available</span>
                    </div>
                    {!isClient && (
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 rounded bg-blue-100 border border-blue-200" />
                            <span>Booked</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Timeslot Details Dialog */}
            <Dialog open={showDialog} onOpenChange={handleDialogChange}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedTimeslot 
                                ? 'Timeslot details' 
                                : 'Available timeslots for this day'}
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedTimeslot ? (
                        // Single timeslot view with client selector
                        <div className="space-y-4">
                            <Card>
                                <CardContent className="p-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg font-semibold">
                                                        {format(new Date(selectedTimeslot.start_time), 'HH:mm')} - {format(new Date(selectedTimeslot.end_time), 'HH:mm')}
                                                    </span>
                                                    <span
                                                        className={`
                                                            rounded-full px-2 py-1 text-xs font-medium
                                                            ${selectedTimeslot.is_available 
                                                                ? 'bg-green-100 text-green-700' 
                                                                : 'bg-blue-100 text-blue-700'}
                                                        `}
                                                    >
                                                        {selectedTimeslot.is_available ? 'Available' : 'Booked'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    Duration: {selectedTimeslot.duration_minutes} minutes
                                                </p>
                                                {selectedTimeslot.provider && (
                                                    <p className="text-sm text-muted-foreground">
                                                        Provider: {selectedTimeslot.provider.name}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Client selector for service providers and admins */}
                                        {canSeeClientNames && clients && clients.length > 0 && (
                                            <div className="space-y-2 pt-3 border-t">
                                                <label className="text-sm font-medium">
                                                    {selectedTimeslot.is_available ? 'Assign Client' : 'Current Client'}
                                                </label>
                                                <Combobox
                                                    options={clients.map((client) => ({
                                                        value: client.id,
                                                        label: client.name,
                                                    }))}
                                                    value={selectedClientId || undefined}
                                                    onValueChange={(value) => setSelectedClientId(value as number)}
                                                    placeholder="Select a client..."
                                                    searchPlaceholder="Search clients..."
                                                    emptyText="No clients found."
                                                    disabled={!selectedTimeslot.is_available}
                                                />
                                                {selectedTimeslot.is_available && selectedClientId && (
                                                    <Button
                                                        onClick={handleAssignClient}
                                                        disabled={isAssigning}
                                                        className="w-full"
                                                    >
                                                        {isAssigning ? 'Assigning...' : 'Assign Client'}
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Book button for clients */}
                                        {!canSeeClientNames && selectedTimeslot.is_available && (
                                            <Button
                                                onClick={() => handleBookTimeslot(selectedTimeslot.id)}
                                                className="w-full"
                                            >
                                                Book Now
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        // List view of all timeslots for the day
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                            {selectedDateTimeslots.map((timeslot) => (
                                <Card key={timeslot.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg font-semibold">
                                                        {format(new Date(timeslot.start_time), 'HH:mm')} - {format(new Date(timeslot.end_time), 'HH:mm')}
                                                    </span>
                                                    <span
                                                        className={`
                                                            rounded-full px-2 py-1 text-xs font-medium
                                                            ${timeslot.is_available 
                                                                ? 'bg-green-100 text-green-700' 
                                                                : 'bg-blue-100 text-blue-700'}
                                                        `}
                                                    >
                                                        {timeslot.is_available ? 'Available' : 'Booked'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    Duration: {timeslot.duration_minutes} minutes
                                                </p>
                                                {timeslot.provider && (
                                                    <p className="text-sm text-muted-foreground">
                                                        Provider: {timeslot.provider.name}
                                                    </p>
                                                )}
                                                {canSeeClientNames && timeslot.booking?.client && (
                                                    <p className="text-sm text-muted-foreground">
                                                        Client: {timeslot.booking.client.name}
                                                    </p>
                                                )}
                                            </div>
                                            {timeslot.is_available && (
                                                <Button
                                                    onClick={() => handleTimeslotClick(timeslot, selectedDate!)}
                                                    size="sm"
                                                >
                                                    {canSeeClientNames ? 'Assign' : 'Book Now'}
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
