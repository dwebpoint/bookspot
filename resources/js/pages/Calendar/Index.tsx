import FlashMessages from '@/components/FlashMessages';
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
import { Card, CardContent } from '@/components/ui/card';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel';
import { Combobox } from '@/components/ui/combobox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { route } from '@/lib/route-helper';
import type { SharedData, Timeslot } from '@/types';
import type { Client, Provider } from '@/types/client';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    eachDayOfInterval,
    format,
    getWeek,
    isPast,
    isToday,
} from 'date-fns';
import {
    Calendar as CalendarIcon,
    CheckCircle,
    Clock,
    Edit2,
    Plus,
    Trash2,
    User as UserIcon,
    X,
} from 'lucide-react';
import { FormEvent, useState } from 'react';

interface CalendarPageProps extends SharedData {
    timeslots: Timeslot[];
    startDate: string; // YYYY-MM-DD format
    endDate: string; // YYYY-MM-DD format
    weekOffset: number; // Week offset from current week
    providers: Provider[];
    selectedProviderId?: number;
    clients: Client[];
}

export default function Calendar() {
    const {
        timeslots,
        startDate,
        endDate,
        weekOffset,
        providers,
        selectedProviderId,
        clients,
        auth,
    } = usePage<CalendarPageProps>().props;
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isNavigating, setIsNavigating] = useState(false);
    const [showDialog, setShowDialog] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [selectedTimeslot, setSelectedTimeslot] = useState<Timeslot | null>(
        null,
    );
    const [selectedClientId, setSelectedClientId] = useState<number | null>(
        null,
    );
    const [isAssigning, setIsAssigning] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showCompleteDialog, setShowCompleteDialog] = useState(false);
    const [isEditingDuration, setIsEditingDuration] = useState(false);
    const [editDuration, setEditDuration] = useState<number>(60);
    const [isUpdating, setIsUpdating] = useState(false);

    const createForm = useForm({
        start_time: '',
        duration_minutes: 60,
        client_id: null as number | null,
    });

    const isServiceProvider = auth.user?.role === 'service_provider';
    const isAdmin = auth.user?.role === 'admin';
    const isClient = auth.user?.role === 'client';
    const canSeeClientNames = isServiceProvider || isAdmin;

    const rangeStart = new Date(startDate);
    const rangeEnd = new Date(endDate);

    const calendarDays = eachDayOfInterval({
        start: rangeStart,
        end: rangeEnd,
    });

    // Group timeslots by date
    const timeslotsByDate = timeslots.reduce(
        (acc, timeslot) => {
            const date = format(new Date(timeslot.start_time), 'yyyy-MM-dd');
            if (!acc[date]) acc[date] = [];
            acc[date].push(timeslot);
            return acc;
        },
        {} as Record<string, Timeslot[]>,
    );

    const handleWeekNavigation = (direction: 'prev' | 'next') => {
        const newOffset = direction === 'prev' ? weekOffset - 1 : weekOffset + 1;
        setIsNavigating(true);

        const params: Record<string, string> = {
            week: String(newOffset),
        };
        if (selectedProviderId) {
            params.provider_id = String(selectedProviderId);
        }

        router.get(route('calendar'), params, {
            preserveState: true,
            onFinish: () => setIsNavigating(false),
        });
    };

    const handleProviderFilter = (value: string) => {
        const params: Record<string, string> = {
            week: String(weekOffset),
        };
        if (value !== 'all') params.provider_id = value;
        router.get(route('calendar'), params, { preserveState: true });
    };

    const handleCreateTimeslot = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const defaultDateTime = dateStr + 'T09:00';
        createForm.setData({
            start_time: defaultDateTime,
            duration_minutes: 60,
        });
        setShowCreateDialog(true);
    };

    const handleCreateSubmit = (e: FormEvent) => {
        e.preventDefault();
        createForm.post(route('provider.timeslots.store'), {
            onSuccess: () => {
                setShowCreateDialog(false);
                createForm.reset();
            },
        });
    };

    const handleBookTimeslot = (timeslotId: number) => {
        router.post(
            route('timeslots.store'),
            { timeslot_id: timeslotId },
            {
                onSuccess: () => {
                    setShowDialog(false);
                },
            },
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
            },
        );
    };

    const handleCancelBooking = () => {
        if (!selectedTimeslot) return;

        if (isServiceProvider || isAdmin) {
            // Service provider/admin: unassign and make available
            router.delete(
                route('provider.timeslots.remove', selectedTimeslot.id),
                {
                    onSuccess: () => {
                        setShowDialog(false);
                        setShowCancelDialog(false);
                        setSelectedTimeslot(null);
                    },
                },
            );
        } else {
            // Client: cancel booking
            router.delete(route('timeslots.destroy', selectedTimeslot.id), {
                onSuccess: () => {
                    setShowDialog(false);
                    setShowCancelDialog(false);
                    setSelectedTimeslot(null);
                },
            });
        }
    };

    const handleDeleteTimeslot = () => {
        if (!selectedTimeslot) return;

        router.delete(
            route('provider.timeslots.destroy', selectedTimeslot.id),
            {
                onSuccess: () => {
                    setShowDialog(false);
                    setShowDeleteDialog(false);
                    setSelectedTimeslot(null);
                },
            },
        );
    };

    const handleCompleteTimeslot = () => {
        if (!selectedTimeslot) return;

        router.patch(
            route('timeslots.complete', selectedTimeslot.id),
            {},
            {
                onSuccess: () => {
                    setShowDialog(false);
                    setShowCompleteDialog(false);
                    setSelectedTimeslot(null);
                },
            },
        );
    };

    const handleUpdateDuration = () => {
        if (!selectedTimeslot) return;

        setIsUpdating(true);
        router.patch(
            route('provider.timeslots.update', selectedTimeslot.id),
            { duration_minutes: editDuration },
            {
                onSuccess: () => {
                    setIsEditingDuration(false);
                },
                onFinish: () => {
                    setIsUpdating(false);
                },
            },
        );
    };

    const handleTimeslotClick = (timeslot: Timeslot, date: Date) => {
        setSelectedTimeslot(timeslot);
        setSelectedDate(date);
        setSelectedClientId(timeslot.client?.id || null);
        setEditDuration(timeslot.duration_minutes);
        setIsEditingDuration(false);
        setShowDialog(true);
    };

    const handleDialogChange = (open: boolean) => {
        setShowDialog(open);
        if (!open) {
            // Reset state when dialog closes
            setSelectedTimeslot(null);
            setSelectedDate(null);
            setSelectedClientId(null);
            setIsEditingDuration(false);
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

                {/* Calendar Header with Week Navigation */}
                <Card>
                    <CardContent className="p-4">
                        <div className="mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div>
                                    <h2 className="text-2xl font-semibold">
                                        {format(rangeStart, 'd MMM')} -{' '}
                                        {format(rangeEnd, 'd MMM yyyy')}
                                    </h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Week {getWeek(rangeStart)}
                                        {weekOffset === 0 && ' (Current week)'}
                                    </p>
                                </div>
                            </div>
                            {showProviderFilter && (
                                <Select
                                    value={
                                        selectedProviderId
                                            ? String(selectedProviderId)
                                            : 'all'
                                    }
                                    onValueChange={handleProviderFilter}
                                >
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="All Providers" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Providers
                                        </SelectItem>
                                        {providers.map((provider) => (
                                            <SelectItem
                                                key={provider.id}
                                                value={String(provider.id)}
                                            >
                                                {provider.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* Carousel Week Navigation */}
                        <Carousel className="w-full">
                            <CarouselContent>
                                <CarouselItem>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {calendarDays.map((day) => {
                                const dateKey = format(day, 'yyyy-MM-dd');
                                const dayTimeslots =
                                    timeslotsByDate[dateKey] || [];
                                const hasTimeslots = dayTimeslots.length > 0;
                                const isDayToday = isToday(day);
                                const isDayPast = isPast(day) && !isDayToday;

                                return (
                                    <Card
                                        key={day.toISOString()}
                                        className={isDayPast ? 'opacity-60' : ''}
                                    >
                                        <CardContent className="p-4">
                                            <div className="mb-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="text-lg font-semibold">
                                                        {format(
                                                            day,
                                                            'EEE, d MMM',
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {isServiceProvider &&
                                                            !isDayPast && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-6 px-2 text-xs"
                                                                    onClick={() =>
                                                                        handleCreateTimeslot(
                                                                            day,
                                                                        )
                                                                    }
                                                                >
                                                                    <Plus className="mr-1 h-3 w-3" />
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
                                                                .filter(
                                                                    (ts) =>
                                                                        !ts.is_available &&
                                                                        ts
                                                                            .client
                                                                            ?.id ===
                                                                            auth
                                                                                .user
                                                                                ?.id,
                                                                )
                                                                .map(
                                                                    (
                                                                        timeslot,
                                                                    ) => (
                                                                        <button
                                                                            key={
                                                                                timeslot.id
                                                                            }
                                                                            onClick={() => {
                                                                                handleTimeslotClick(
                                                                                    timeslot,
                                                                                    day,
                                                                                );
                                                                            }}
                                                                            className="w-full rounded-lg border border-blue-200 bg-blue-50 p-3 text-left transition-colors hover:bg-blue-100"
                                                                        >
                                                                            <div className="flex items-start justify-between gap-2">
                                                                                <div className="min-w-0 flex-1">
                                                                                    <div className="mb-1 flex items-center gap-2">
                                                                                        <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0" />
                                                                                        <span className="text-sm font-medium">
                                                                                            {format(
                                                                                                new Date(
                                                                                                    timeslot.start_time,
                                                                                                ),
                                                                                                'HH:mm',
                                                                                            )}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                                        <Clock className="h-3 w-3 flex-shrink-0" />
                                                                                        <span>
                                                                                            {
                                                                                                timeslot.duration_minutes
                                                                                            }{' '}
                                                                                            min
                                                                                        </span>
                                                                                    </div>
                                                                                    {timeslot.provider && (
                                                                                        <div className="mt-1 truncate text-xs text-muted-foreground">
                                                                                            {
                                                                                                timeslot
                                                                                                    .provider
                                                                                                    .name
                                                                                            }
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <span className="flex-shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                                                                    Your
                                                                                    Booking
                                                                                </span>
                                                                            </div>
                                                                        </button>
                                                                    ),
                                                                )}
                                                            {/* Available timeslots */}
                                                            {dayTimeslots
                                                                .filter(
                                                                    (ts) =>
                                                                        ts.is_available,
                                                                )
                                                                .map(
                                                                    (
                                                                        timeslot,
                                                                    ) => (
                                                                        <button
                                                                            key={
                                                                                timeslot.id
                                                                            }
                                                                            onClick={() => {
                                                                                handleTimeslotClick(
                                                                                    timeslot,
                                                                                    day,
                                                                                );
                                                                            }}
                                                                            className="w-full rounded-lg border border-green-200 bg-green-50 p-3 text-left transition-colors hover:bg-green-100"
                                                                        >
                                                                            <div className="flex items-start justify-between gap-2">
                                                                                <div className="min-w-0 flex-1">
                                                                                    <div className="mb-1 flex items-center gap-2">
                                                                                        <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0" />
                                                                                        <span className="text-sm font-medium">
                                                                                            {format(
                                                                                                new Date(
                                                                                                    timeslot.start_time,
                                                                                                ),
                                                                                                'HH:mm',
                                                                                            )}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                                        <Clock className="h-3 w-3 flex-shrink-0" />
                                                                                        <span>
                                                                                            {
                                                                                                timeslot.duration_minutes
                                                                                            }{' '}
                                                                                            min
                                                                                        </span>
                                                                                    </div>
                                                                                    {timeslot.provider && (
                                                                                        <div className="mt-1 truncate text-xs text-muted-foreground">
                                                                                            {
                                                                                                timeslot
                                                                                                    .provider
                                                                                                    .name
                                                                                            }
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <span className="flex-shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                                                                    Available
                                                                                </span>
                                                                            </div>
                                                                        </button>
                                                                    ),
                                                                )}
                                                        </>
                                                    ) : (
                                                        /* For providers and admins: show all timeslots */
                                                        dayTimeslots.map(
                                                            (timeslot) => (
                                                                <button
                                                                    key={
                                                                        timeslot.id
                                                                    }
                                                                    onClick={() => {
                                                                        handleTimeslotClick(
                                                                            timeslot,
                                                                            day,
                                                                        );
                                                                    }}
                                                                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                                                                        timeslot.is_available
                                                                            ? 'border-green-200 bg-green-50 hover:bg-green-100'
                                                                            : timeslot.is_completed
                                                                              ? 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                                                                              : 'border-blue-200 bg-blue-50 hover:bg-blue-100'
                                                                    } `}
                                                                >
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div className="min-w-0 flex-1">
                                                                            <div className="mb-1 flex items-center gap-2">
                                                                                <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0" />
                                                                                <span className="text-sm font-medium">
                                                                                    {format(
                                                                                        new Date(
                                                                                            timeslot.start_time,
                                                                                        ),
                                                                                        'HH:mm',
                                                                                    )}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                                <Clock className="h-3 w-3 flex-shrink-0" />
                                                                                <span>
                                                                                    {
                                                                                        timeslot.duration_minutes
                                                                                    }{' '}
                                                                                    min
                                                                                </span>
                                                                            </div>
                                                                            {timeslot.provider &&
                                                                                !isServiceProvider && (
                                                                                    <div className="mt-1 truncate text-xs text-muted-foreground">
                                                                                        {
                                                                                            timeslot
                                                                                                .provider
                                                                                                .name
                                                                                        }
                                                                                    </div>
                                                                                )}
                                                                            {canSeeClientNames &&
                                                                                timeslot.client && (
                                                                                    <div className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                                                                                        <UserIcon className="h-3 w-3 flex-shrink-0" />
                                                                                        <span>
                                                                                            {
                                                                                                timeslot
                                                                                                    .client
                                                                                                    .name
                                                                                            }
                                                                                        </span>
                                                                                    </div>
                                                                                )}
                                                                        </div>
                                                                        <span
                                                                            className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                                                                                timeslot.is_available
                                                                                    ? 'bg-green-100 text-green-700'
                                                                                    : timeslot.is_completed
                                                                                      ? 'bg-gray-100 text-gray-700'
                                                                                      : 'bg-blue-100 text-blue-700'
                                                                            } `}
                                                                        >
                                                                            {timeslot.is_available
                                                                                ? 'Open'
                                                                                : timeslot.is_completed
                                                                                  ? 'Completed'
                                                                                  : 'Booked'}
                                                                        </span>
                                                                    </div>
                                                                </button>
                                                            ),
                                                        )
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="py-4 text-center">
                                                    {isServiceProvider &&
                                                    !isDayPast ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-muted-foreground"
                                                            onClick={() =>
                                                                handleCreateTimeslot(
                                                                    day,
                                                                )
                                                            }
                                                        >
                                                            <Plus className="mr-2 h-4 w-4" />
                                                            Add Timeslot
                                                        </Button>
                                                    ) : (
                                                        <div className="text-sm text-muted-foreground">
                                                            {isClient
                                                                ? 'No available slots'
                                                                : 'No timeslots'}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                                </CarouselItem>
                            </CarouselContent>
                            <CarouselPrevious
                                onClick={() => handleWeekNavigation('prev')}
                                disabled={isNavigating}
                            />
                            <CarouselNext
                                onClick={() => handleWeekNavigation('next')}
                                disabled={isNavigating}
                            />
                        </Carousel>
                    </CardContent>
                </Card>

                {/* Legend */}
                <div className="flex gap-4 text-sm">
                    {isClient && (
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 rounded border border-blue-200 bg-blue-100" />
                            <span>Your Booking</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded border border-green-200 bg-green-100" />
                        <span>Available</span>
                    </div>
                    {!isClient && (
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 rounded border border-blue-200 bg-blue-100" />
                            <span>Booked</span>
                        </div>
                    )}
                    {!isClient && (
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 rounded border border-gray-200 bg-gray-100" />
                            <span>Completed</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Timeslot Details Dialog */}
            <Dialog open={showDialog} onOpenChange={handleDialogChange}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedDate &&
                                format(selectedDate, 'EEEE, d MMMM yyyy')}
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
                                                        {format(
                                                            new Date(
                                                                selectedTimeslot.start_time,
                                                            ),
                                                            'HH:mm',
                                                        )}{' '}
                                                        -{' '}
                                                        {format(
                                                            new Date(
                                                                selectedTimeslot.end_time,
                                                            ),
                                                            'HH:mm',
                                                        )}
                                                    </span>
                                                    <span
                                                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                                                            selectedTimeslot.is_available
                                                                ? 'bg-green-100 text-green-700'
                                                                : selectedTimeslot.is_completed
                                                                  ? 'bg-gray-100 text-gray-700'
                                                                  : 'bg-blue-100 text-blue-700'
                                                        } `}
                                                    >
                                                        {selectedTimeslot.is_available
                                                            ? 'Available'
                                                            : selectedTimeslot.is_completed
                                                              ? 'Completed'
                                                              : 'Booked'}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <span>Duration:</span>
                                                        {canSeeClientNames &&
                                                        selectedTimeslot.is_available ? (
                                                            isEditingDuration ? (
                                                                <div className="flex items-center gap-2">
                                                                    <Select
                                                                        value={editDuration.toString()}
                                                                        onValueChange={(
                                                                            value,
                                                                        ) =>
                                                                            setEditDuration(
                                                                                parseInt(
                                                                                    value,
                                                                                ),
                                                                            )
                                                                        }
                                                                    >
                                                                        <SelectTrigger className="h-8 w-32">
                                                                            <SelectValue placeholder="Select duration" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="15">
                                                                                15 minutes
                                                                            </SelectItem>
                                                                            <SelectItem value="30">
                                                                                30 minutes
                                                                            </SelectItem>
                                                                            <SelectItem value="45">
                                                                                45 minutes
                                                                            </SelectItem>
                                                                            <SelectItem value="60">
                                                                                1 hour
                                                                            </SelectItem>
                                                                            <SelectItem value="90">
                                                                                1.5 hours
                                                                            </SelectItem>
                                                                            <SelectItem value="120">
                                                                                2 hours
                                                                            </SelectItem>
                                                                            <SelectItem value="180">
                                                                                3 hours
                                                                            </SelectItem>
                                                                            <SelectItem value="240">
                                                                                4 hours
                                                                            </SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={
                                                                            handleUpdateDuration
                                                                        }
                                                                        disabled={
                                                                            isUpdating
                                                                        }
                                                                    >
                                                                        {isUpdating
                                                                            ? 'Saving...'
                                                                            : 'Save'}
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => {
                                                                            setIsEditingDuration(
                                                                                false,
                                                                            );
                                                                            setEditDuration(
                                                                                selectedTimeslot.duration_minutes,
                                                                            );
                                                                        }}
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    <span>
                                                                        {
                                                                            selectedTimeslot.duration_minutes
                                                                        }{' '}
                                                                        minutes
                                                                    </span>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="h-6 w-6 p-0"
                                                                        onClick={() =>
                                                                            setIsEditingDuration(
                                                                                true,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Edit2 className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            )
                                                        ) : (
                                                            <span>
                                                                {
                                                                    selectedTimeslot.duration_minutes
                                                                }{' '}
                                                                minutes
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {selectedTimeslot.provider && (
                                                    <p className="text-sm text-muted-foreground">
                                                        Provider:{' '}
                                                        {
                                                            selectedTimeslot
                                                                .provider.name
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Client selector for service providers and admins */}
                                        {canSeeClientNames &&
                                            clients &&
                                            clients.length > 0 && (
                                                <div className="space-y-2 border-t pt-3">
                                                    <label className="text-sm font-medium">
                                                        {selectedTimeslot.is_available
                                                            ? 'Assign Client'
                                                            : 'Current Client'}
                                                    </label>
                                                    <Combobox
                                                        options={clients.map(
                                                            (client) => ({
                                                                value: client.id,
                                                                label: client.name,
                                                            }),
                                                        )}
                                                        value={
                                                            selectedClientId ||
                                                            undefined
                                                        }
                                                        onValueChange={(
                                                            value,
                                                        ) =>
                                                            setSelectedClientId(
                                                                value as number,
                                                            )
                                                        }
                                                        placeholder="Select a client..."
                                                        searchPlaceholder="Search clients..."
                                                        emptyText="No clients found."
                                                    />
                                                    {selectedTimeslot.is_available ? (
                                                        selectedClientId && (
                                                            <Button
                                                                onClick={
                                                                    handleAssignClient
                                                                }
                                                                disabled={
                                                                    isAssigning
                                                                }
                                                                className="w-full"
                                                            >
                                                                {isAssigning
                                                                    ? 'Assigning...'
                                                                    : 'Assign Client'}
                                                            </Button>
                                                        )
                                                    ) : (
                                                        <Button
                                                            onClick={
                                                                handleAssignClient
                                                            }
                                                            disabled={
                                                                isAssigning ||
                                                                !selectedClientId
                                                            }
                                                            className="w-full"
                                                        >
                                                            {isAssigning
                                                                ? 'Reassigning...'
                                                                : 'Reassign to Different Client'}
                                                        </Button>
                                                    )}
                                                </div>
                                            )}

                                        {/* Action buttons for service providers/admins */}
                                        {canSeeClientNames &&
                                            selectedTimeslot.is_booked && (
                                                <div className="space-y-2 border-t pt-3">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() =>
                                                            setShowCompleteDialog(
                                                                true,
                                                            )
                                                        }
                                                        className="w-full border-green-600 bg-green-50 text-green-700 hover:bg-green-100"
                                                    >
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        Mark as Completed
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() =>
                                                            setShowCancelDialog(
                                                                true,
                                                            )
                                                        }
                                                        className="w-full"
                                                    >
                                                        <X className="mr-2 h-4 w-4" />
                                                        Cancel Booking
                                                    </Button>
                                                </div>
                                            )}

                                        {/* Delete button for available timeslots (service providers/admins) */}
                                        {canSeeClientNames &&
                                            selectedTimeslot.is_available && (
                                                <div className="border-t pt-3">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() =>
                                                            setShowDeleteDialog(
                                                                true,
                                                            )
                                                        }
                                                        className="w-full text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete Timeslot
                                                    </Button>
                                                </div>
                                            )}

                                        {/* Book button for clients - available timeslots */}
                                        {!canSeeClientNames &&
                                            selectedTimeslot.is_available && (
                                                <Button
                                                    onClick={() =>
                                                        handleBookTimeslot(
                                                            selectedTimeslot.id,
                                                        )
                                                    }
                                                    className="w-full"
                                                >
                                                    Book Now
                                                </Button>
                                            )}

                                        {/* Cancel button for clients - their own bookings */}
                                        {!canSeeClientNames &&
                                            !selectedTimeslot.is_available &&
                                            selectedTimeslot.client?.id ===
                                                auth.user?.id && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() =>
                                                        setShowCancelDialog(
                                                            true,
                                                        )
                                                    }
                                                    className="w-full"
                                                >
                                                    <X className="mr-2 h-4 w-4" />
                                                    Cancel Booking
                                                </Button>
                                            )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        // List view of all timeslots for the day
                        <div className="max-h-[60vh] space-y-4 overflow-y-auto">
                            {selectedDateTimeslots.map((timeslot) => (
                                <Card key={timeslot.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg font-semibold">
                                                        {format(
                                                            new Date(
                                                                timeslot.start_time,
                                                            ),
                                                            'HH:mm',
                                                        )}{' '}
                                                        -{' '}
                                                        {format(
                                                            new Date(
                                                                timeslot.end_time,
                                                            ),
                                                            'HH:mm',
                                                        )}
                                                    </span>
                                                    <span
                                                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                                                            timeslot.is_available
                                                                ? 'bg-green-100 text-green-700'
                                                                : timeslot.is_completed
                                                                  ? 'bg-gray-100 text-gray-700'
                                                                  : 'bg-blue-100 text-blue-700'
                                                        } `}
                                                    >
                                                        {timeslot.is_available
                                                            ? 'Available'
                                                            : timeslot.is_completed
                                                              ? 'Completed'
                                                              : 'Booked'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    Duration:{' '}
                                                    {timeslot.duration_minutes}{' '}
                                                    minutes
                                                </p>
                                                {timeslot.provider && (
                                                    <p className="text-sm text-muted-foreground">
                                                        Provider:{' '}
                                                        {timeslot.provider.name}
                                                    </p>
                                                )}
                                                {canSeeClientNames &&
                                                    timeslot.client && (
                                                        <p className="text-sm text-muted-foreground">
                                                            Client:{' '}
                                                            {
                                                                timeslot.client
                                                                    .name
                                                            }
                                                        </p>
                                                    )}
                                            </div>
                                            {timeslot.is_available && (
                                                <Button
                                                    onClick={() =>
                                                        handleTimeslotClick(
                                                            timeslot,
                                                            selectedDate!,
                                                        )
                                                    }
                                                    size="sm"
                                                >
                                                    {canSeeClientNames
                                                        ? 'Assign'
                                                        : 'Book Now'}
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

            {/* Cancel Booking Confirmation Dialog */}
            <AlertDialog
                open={showCancelDialog}
                onOpenChange={setShowCancelDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                        <AlertDialogDescription>
                            {isServiceProvider || isAdmin
                                ? 'Are you sure you want to cancel this booking? The timeslot will be unassigned from the client and made available again.'
                                : 'Are you sure you want to cancel this booking? The timeslot will be made available for others to book.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>No, keep it</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancelBooking}>
                            Yes, cancel booking
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Timeslot Confirmation Dialog */}
            <AlertDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Available Timeslot</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to permanently delete this
                            available timeslot? This action cannot be undone and will
                            remove the timeslot entirely from your schedule.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>No, keep it</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteTimeslot}
                            className="bg-destructive text-white hover:bg-destructive/90"
                        >
                            Yes, delete timeslot
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Complete Timeslot Confirmation Dialog */}
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
                            onClick={handleCompleteTimeslot}
                            className="bg-green-600 text-white hover:bg-green-700"
                        >
                            Yes, mark as completed
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Create Timeslot Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Timeslot</DialogTitle>
                        <DialogDescription>
                            Add a new available timeslot to your schedule
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="start_time">
                                Start Time{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="start_time"
                                type="datetime-local"
                                value={createForm.data.start_time}
                                onChange={(e) =>
                                    createForm.setData(
                                        'start_time',
                                        e.target.value,
                                    )
                                }
                                required
                            />
                            {createForm.errors.start_time && (
                                <p className="text-sm text-destructive">
                                    {createForm.errors.start_time}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="duration_minutes">
                                Duration{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={createForm.data.duration_minutes.toString()}
                                onValueChange={(value) =>
                                    createForm.setData(
                                        'duration_minutes',
                                        parseInt(value),
                                    )
                                }
                            >
                                <SelectTrigger id="duration_minutes">
                                    <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="30">30 minutes</SelectItem>
                                    <SelectItem value="45">45 minutes</SelectItem>
                                    <SelectItem value="60">1 hour</SelectItem>
                                    <SelectItem value="90">1.5 hours</SelectItem>
                                    <SelectItem value="120">2 hours</SelectItem>
                                    <SelectItem value="180">3 hours</SelectItem>
                                </SelectContent>
                            </Select>
                            {createForm.errors.duration_minutes && (
                                <p className="text-sm text-destructive">
                                    {createForm.errors.duration_minutes}
                                </p>
                            )}
                        </div>

                        {/* Client selector for service providers */}
                        {(isServiceProvider || isAdmin) &&
                            clients &&
                            clients.length > 0 && (
                                <div className="space-y-2">
                                    <Label htmlFor="client_id">
                                        Assign to Client (Optional)
                                    </Label>
                                    <Select
                                        value={
                                            createForm.data.client_id
                                                ? String(createForm.data.client_id)
                                                : 'none'
                                        }
                                        onValueChange={(value) =>
                                            createForm.setData(
                                                'client_id',
                                                value === 'none'
                                                    ? null
                                                    : parseInt(value),
                                            )
                                        }
                                    >
                                        <SelectTrigger id="client_id">
                                            <SelectValue placeholder="Leave available" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                Leave available
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
                                    <p className="text-xs text-muted-foreground">
                                        Assign this timeslot directly to a client,
                                        or leave it available for booking
                                    </p>
                                    {createForm.errors.client_id && (
                                        <p className="text-sm text-destructive">
                                            {createForm.errors.client_id}
                                        </p>
                                    )}
                                </div>
                            )}

                        <div className="flex gap-4">
                            <Button
                                type="submit"
                                disabled={createForm.processing}
                            >
                                {createForm.processing
                                    ? 'Creating...'
                                    : 'Create Timeslot'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowCreateDialog(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
