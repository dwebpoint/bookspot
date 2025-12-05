export interface Timeslot {
    id: number;
    provider_id: number;
    client_id: number | null;
    start_time: string;
    duration_minutes: number;
    end_time: string;
    status: 'available' | 'booked' | 'cancelled' | 'completed';
    is_available: boolean;
    is_booked: boolean;
    is_cancelled: boolean;
    is_completed: boolean;
    created_at: string;
    updated_at: string;
    provider?: Provider;
    client?: Client;
}

export interface Provider {
    id: number;
    name: string;
    email: string;
}

export interface Client {
    id: number;
    name: string;
    email: string;
}

export interface TimeslotWithProvider extends Timeslot {
    provider: Provider;
}

export interface TimeslotWithClient extends Timeslot {
    client: Client;
}
