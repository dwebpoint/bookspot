import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel';
import AppLayout from '@/layouts/app-layout';
import { route } from '@/lib/route-helper';
import type { SharedData } from '@/types';
import type { Timeslot } from '@/types/timeslot';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Clock, Mail, User } from 'lucide-react';
import { useState } from 'react';

interface ClientDetail {
    id: number;
    name: string;
    email: string;
    created_at: string;
    added_at: string | null;
}

interface ShowClientProps extends SharedData {
    client: ClientDetail;
    timeslots: Timeslot[];
}

type StatusFilter = 'all' | 'booked' | 'completed';

const STATUS_LABELS: Record<StatusFilter, string> = {
    all: 'All',
    booked: 'Booked',
    completed: 'Completed',
};

const STATUS_STYLES: Record<string, string> = {
    available: 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950',
    booked: 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950',
    completed: 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900',
};

const BADGE_STYLES: Record<string, string> = {
    available: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    booked: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    completed: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

export default function Show({ client, timeslots }: ShowClientProps) {
    const [filter, setFilter] = useState<StatusFilter>('completed');

    const counts: Record<StatusFilter, number> = {
        all: timeslots.length,
        booked: timeslots.filter((t) => t.status === 'booked').length,
        completed: timeslots.filter((t) => t.status === 'completed').length,
    };

    const filtered =
        filter === 'all' ? timeslots : timeslots.filter((t) => t.status === filter);

    return (
        <AppLayout>
            <Head title={client.name} />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.get(route('provider.clients.index'))}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
                        <p className="text-muted-foreground">Client profile</p>
                    </div>
                </div>

                {/* Client info card */}
                <Card>
                    <CardContent className="p-6">
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="flex items-center gap-3">
                                <User className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Name</p>
                                    <p className="font-medium">{client.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Email</p>
                                    <p className="font-medium">{client.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Added</p>
                                    <p className="font-medium">
                                        {format(
                                            new Date(client.added_at ?? client.created_at),
                                            'd MMM yyyy',
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Timeslots */}
                <div>
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold">Appointments</h2>
                        <div className="flex flex-wrap gap-2">
                            {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((status) => (
                                <Button
                                    key={status}
                                    size="sm"
                                    variant={filter === status ? 'default' : 'outline'}
                                    onClick={() => setFilter(status)}
                                >
                                    {STATUS_LABELS[status]}
                                    {counts[status] > 0 && (
                                        <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                                            {counts[status]}
                                        </span>
                                    )}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {filtered.length === 0 ? (
                        <Card>
                            <CardContent className="flex items-center justify-center py-12">
                                <p className="text-muted-foreground">No appointments found</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Carousel className="w-full">
                            <div className="mb-3 flex items-center justify-between">
                                <CarouselPrevious className="static translate-0 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700" />
                                <CarouselNext className="static translate-0 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700" />
                            </div>
                            <CarouselContent>
                                {filtered.map((timeslot) => (
                                    <CarouselItem
                                        key={timeslot.id}
                                        className="sm:basis-1/2 lg:basis-1/3"
                                    >
                                        <Card className={`border ${STATUS_STYLES[timeslot.status]}`}>
                                            <CardContent className="p-4">
                                                <div className="mb-2 flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                                        <span className="font-medium">
                                                            {format(
                                                                new Date(timeslot.start_time),
                                                                'EEE, d MMM yyyy',
                                                            )}
                                                        </span>
                                                    </div>
                                                    <span
                                                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_STYLES[timeslot.status]}`}
                                                    >
                                                        {timeslot.status.charAt(0).toUpperCase() +
                                                            timeslot.status.slice(1)}
                                                    </span>
                                                </div>
                                                <div className="mb-1 flex items-center gap-2 text-sm">
                                                    <Clock className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                                    <span>
                                                        {format(new Date(timeslot.start_time), 'HH:mm')}
                                                        {' – '}
                                                        {format(new Date(timeslot.end_time), 'HH:mm')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Clock className="h-3 w-3 flex-shrink-0" />
                                                    <span>{timeslot.duration_minutes} min</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                        </Carousel>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
