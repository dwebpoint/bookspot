import { Head, router, usePage } from '@inertiajs/react';
import { route } from '@/lib/route-helper';
import { Plus, Search, Trash2, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import FlashMessages from '@/components/FlashMessages';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import type { PaginatedResponse, SharedData } from '@/types';
import type { Client } from '@/types/client';
import { format } from 'date-fns';

interface ClientsIndexProps extends SharedData {
    clients: PaginatedResponse<Client>;
    search?: string;
}

export default function Index() {
    const { clients, search: initialSearch } = usePage<ClientsIndexProps>().props;
    const [search, setSearch] = useState(initialSearch || '');
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('provider.clients.index'), { search }, { preserveState: true });
    };

    const handleDeleteClient = () => {
        if (!clientToDelete) return;

        router.delete(route('provider.clients.destroy', clientToDelete.id), {
            onSuccess: () => {
                setClientToDelete(null);
            },
        });
    };

    return (
        <AppLayout>
            <Head title="My Clients" />
            <FlashMessages />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            My Clients
                        </h1>
                        <p className="text-muted-foreground">
                            Manage your client relationships
                        </p>
                    </div>
                    <Button onClick={() => router.get(route('provider.clients.create'))}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Client
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-6">
                        <form onSubmit={handleSearch} className="flex gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Button type="submit">Search</Button>
                            {initialSearch && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setSearch('');
                                        router.get(route('provider.clients.index'));
                                    }}
                                >
                                    Clear
                                </Button>
                            )}
                        </form>
                    </CardContent>
                </Card>

                {clients.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
                                {initialSearch ? 'No clients found' : 'No clients yet'}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                                {initialSearch
                                    ? 'Try adjusting your search terms'
                                    : 'Start building your client base by adding your first client'}
                            </p>
                            {!initialSearch && (
                                <Button onClick={() => router.get(route('provider.clients.create'))}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Your First Client
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {clients.data.map((client) => (
                                <Card key={client.id}>
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-lg truncate">
                                                        {client.name}
                                                    </h3>
                                                    {client.providers_count && client.providers_count > 1 && (
                                                        <Badge variant="secondary" className="flex items-center gap-1">
                                                            <Users className="h-3 w-3" />
                                                            Shared
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {client.email}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => setClientToDelete(client)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-xs text-muted-foreground">
                                                Added {format(new Date(client.pivot?.created_at || client.created_at), 'MMM d, yyyy')}
                                            </div>
                                            {client.providers_count && client.providers_count > 1 && (
                                                <div className="text-xs text-muted-foreground">
                                                    Linked to {client.providers_count} providers
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {clients.last_page > 1 && (
                            <div className="flex items-center justify-center gap-2">
                                {clients.current_page > 1 && (
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            router.get(route('provider.clients.index'), {
                                                page: clients.current_page - 1,
                                                search: initialSearch,
                                            })
                                        }
                                    >
                                        Previous
                                    </Button>
                                )}
                                <span className="text-sm text-muted-foreground">
                                    Page {clients.current_page} of {clients.last_page}
                                </span>
                                {clients.current_page < clients.last_page && (
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            router.get(route('provider.clients.index'), {
                                                page: clients.current_page + 1,
                                                search: initialSearch,
                                            })
                                        }
                                    >
                                        Next
                                    </Button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Client?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove <strong>{clientToDelete?.name}</strong> from your client list.
                            All future bookings with this client will be cancelled. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={handleDeleteClient}
                        >
                            Remove Client
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
