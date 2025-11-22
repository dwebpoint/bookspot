export interface Timeslot {
    id: number;
    provider_id: number;
    start_time: string;
    duration_minutes: number;
    end_time: string;
    is_available: boolean;
    is_booked: boolean;
    created_at: string;
    updated_at: string;
    provider?: Provider;
    booking?: Booking;
}

export interface Provider {
    id: number;
    name: string;
    email: string;
}

export interface TimeslotWithProvider extends Timeslot {
    provider: Provider;
}
