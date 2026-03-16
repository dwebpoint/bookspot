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
import { ArrowLeft, Calendar, CheckCircle, Clock, Mail, User } from 'lucide-react';

interface ClientDetail {
    id: number;
    name: string;
    email: string;
    created_at: string;
    added_at: string | null;
}

interface ShowClientProps extends SharedData {
    client: ClientDetail;
    completedTimeslots: Timeslot[];
}

export default function Show({ client, completedTimeslots }: ShowClientProps) {
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

                {/* Completed timeslots */}
                <div>
                    <h2 className="mb-4 text-xl font-semibold">
                        Completed appointments
                        {completedTimeslots.length > 0 && (
                            <span className="ml-2 text-base font-normal text-muted-foreground">
                                ({completedTimeslots.length})
                            </span>
                        )}
                    </h2>

                    {completedTimeslots.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <CheckCircle className="mb-4 h-12 w-12 text-muted-foreground" />
                                <p className="text-muted-foreground">No completed appointments yet</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Carousel className="w-full">
                            <div className="mb-3 flex items-center justify-between">
                                <CarouselPrevious className="static translate-0 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700" />
                                <CarouselNext className="static translate-0 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700" />
                            </div>
                            <CarouselContent>
                                {completedTimeslots.map((timeslot) => (
                                    <CarouselItem
                                        key={timeslot.id}
                                        className="sm:basis-1/2 lg:basis-1/3"
                                    >
                                        <Card>
                                            <CardContent className="p-4">
                                                <div className="mb-2 flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                                    <span className="font-medium">
                                                        {format(
                                                            new Date(timeslot.start_time),
                                                            'EEE, d MMM yyyy',
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="mb-2 flex items-center gap-2 text-sm">
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
                                                <div className="mt-3">
                                                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                                        Completed
                                                    </span>
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
