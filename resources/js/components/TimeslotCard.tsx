import { format } from 'date-fns';
import { Calendar, Clock, User } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import type { Timeslot } from '@/types';

interface TimeslotCardProps {
    timeslot: Timeslot;
    onBook?: (timeslotId: number) => void;
    onCancel?: (timeslotId: number) => void;
    showProvider?: boolean;
    isBooking?: boolean;
    isCancelling?: boolean;
}

export default function TimeslotCard({
    timeslot,
    onBook,
    onCancel,
    showProvider = false,
    isBooking = false,
    isCancelling = false,
}: TimeslotCardProps) {
    const startTime = new Date(timeslot.start_time);
    const endTime = new Date(timeslot.end_time);

    // Check if dates are valid
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return (
            <Card>
                <CardContent className="py-6">
                    <p className="text-center text-sm text-muted-foreground">
                        Invalid timeslot data
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{format(startTime, 'PPP')}</span>
                    </div>
                    {timeslot.is_booked && (
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                            Booked
                        </span>
                    )}
                    {timeslot.is_available && (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                            Available
                        </span>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pb-3">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-lg font-semibold">
                            {format(startTime, 'p')} - {format(endTime, 'p')}
                        </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Duration: {timeslot.duration_minutes} minutes
                    </div>
                    {showProvider && timeslot.provider && (
                        <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{timeslot.provider.name}</span>
                        </div>
                    )}
                    {timeslot.client && (
                        <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <div className="font-medium">
                                    {timeslot.client.name}
                                </div>
                                <div className="text-muted-foreground">
                                    {timeslot.client.email}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
            {(onBook || onCancel) && (
                <CardFooter>
                    {onBook && timeslot.is_available && (
                        <Button
                            onClick={() => onBook(timeslot.id)}
                            disabled={isBooking}
                            className="w-full"
                        >
                            {isBooking ? 'Booking...' : 'Book Now'}
                        </Button>
                    )}
                    {onCancel && (
                        <Button
                            onClick={() => onCancel(timeslot.id)}
                            disabled={isCancelling}
                            variant="destructive"
                            className="w-full"
                        >
                            {isCancelling ? 'Cancelling...' : 'Cancel Timeslot'}
                        </Button>
                    )}
                </CardFooter>
            )}
        </Card>
    );
}
