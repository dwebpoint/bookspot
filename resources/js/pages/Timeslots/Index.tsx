import FlashMessages from '@/components/FlashMessages';
import TimeslotCard from '@/components/TimeslotCard';
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
import AppLayout from '@/layouts/app-layout';
import { route } from '@/lib/route-helper';
import type {
    PaginatedResponse,
    Provider,
    SharedData,
    TimeslotWithProvider,
} from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Calendar, Filter } from 'lucide-react';
import { useState } from 'react';

interface TimeslotsIndexProps extends SharedData {
    timeslots: PaginatedResponse<TimeslotWithProvider>;
    filters: {
        provider_id?: number;
        date?: string;
    };
    providers: Provider[];
}

export default function Index() {
    const { timeslots, filters, providers } =
        usePage<TimeslotsIndexProps>().props;
    const [bookingId, setBookingId] = useState<number | null>(null);

    const handleBook = (timeslotId: number) => {
        setBookingId(timeslotId);
        router.post(
            route('bookings.store'),
            { timeslot_id: timeslotId },
            {
                onFinish: () => setBookingId(null),
            },
        );
    };

    const handleFilterChange = (key: string, value: string) => {
        router.get(
            route('timeslots.index'),
            { ...filters, [key]: value || undefined },
            { preserveState: true },
        );
    };

    return (
        <AppLayout>
            <Head title="Available Timeslots" />
            <FlashMessages />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Available Timeslots
                        </h1>
                        <p className="text-muted-foreground">
                            Browse and book available appointment slots
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Filter className="h-4 w-4" />
                        <span>Filters</span>
                    </div>
                    <div className="flex-1 space-y-4 md:flex md:gap-4 md:space-y-0">
                        <div className="flex-1">
                            <Label htmlFor="provider">Service Provider</Label>
                            <Select
                                value={filters.provider_id?.toString() || ''}
                                onValueChange={(value) =>
                                    handleFilterChange('provider_id', value)
                                }
                            >
                                <SelectTrigger id="provider">
                                    <SelectValue placeholder="All providers" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">
                                        All providers
                                    </SelectItem>
                                    {providers.map((provider) => (
                                        <SelectItem
                                            key={provider.id}
                                            value={provider.id.toString()}
                                        >
                                            {provider.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={filters.date || ''}
                                onChange={(e) =>
                                    handleFilterChange('date', e.target.value)
                                }
                            />
                        </div>
                        {(filters.provider_id || filters.date) && (
                            <div className="flex items-end">
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        router.get(route('timeslots.index'))
                                    }
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Timeslots Grid */}
                {timeslots.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                        <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
                        <h3 className="mb-2 text-lg font-semibold">
                            No available timeslots
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            There are no available timeslots matching your
                            filters.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {timeslots.data.map((timeslot) => (
                            <TimeslotCard
                                key={timeslot.id}
                                timeslot={timeslot}
                                showProvider
                                onBook={handleBook}
                                isBooking={bookingId === timeslot.id}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {timeslots.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {timeslots.links.map((link, index) => (
                            <Button
                                key={index}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
