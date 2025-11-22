import type { Timeslot, Provider } from './timeslot';

export interface Booking {
    id: number;
    timeslot_id: number;
    client_id: number;
    status: 'confirmed' | 'cancelled';
    created_at: string;
    updated_at: string;
    timeslot?: Timeslot;
    client?: Client;
}

export interface Client {
    id: number;
    name: string;
    email: string;
}

export interface BookingWithTimeslot extends Booking {
    timeslot: Timeslot & {
        provider: Provider;
    };
}
