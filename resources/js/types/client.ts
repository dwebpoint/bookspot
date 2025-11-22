export interface Client {
    id: number;
    name: string;
    email: string;
    created_at: string;
    providers_count?: number;
    pivot?: {
        created_at: string;
        created_by_provider: boolean;
        status: 'active' | 'inactive';
    };
}

export interface ClientWithProviders extends Client {
    providers?: Provider[];
}

export interface Provider {
    id: number;
    name: string;
    email: string;
}
