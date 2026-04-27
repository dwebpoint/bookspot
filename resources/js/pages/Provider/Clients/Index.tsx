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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { route } from '@/lib/route-helper';
import type { PaginatedResponse, SharedData } from '@/types';
import type { Client, Invitation } from '@/types/client';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { Clock, Edit, Eye, Mail, Plus, Search, Trash2, UserPlus, Users, X } from 'lucide-react';
import { useState } from 'react';

interface ClientsIndexProps extends SharedData {
    clients: PaginatedResponse<Client>;
    search?: string;
    pendingInvitations: Invitation[];
}

export default function Index() {
    const { clients, search: initialSearch, pendingInvitations } =
        usePage<ClientsIndexProps>().props;
    const [search, setSearch] = useState(initialSearch || '');
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
    const [invitationToRevoke, setInvitationToRevoke] = useState<Invitation | null>(null);
    const [showInviteModal, setShowInviteModal] = useState(false);

    const inviteForm = useForm({ email: '' });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('provider.clients.index'),
            { search },
            { preserveState: true },
        );
    };

    const handleDeleteClient = () => {
        if (!clientToDelete) return;

        router.delete(route('provider.clients.destroy', clientToDelete.id), {
            onSuccess: () => {
                setClientToDelete(null);
            },
        });
    };

    const handleSendInvitation = (e: React.FormEvent) => {
        e.preventDefault();
        inviteForm.post(route('provider.invitations.store'), {
            onSuccess: () => {
                setShowInviteModal(false);
                inviteForm.reset();
            },
        });
    };

    const handleRevokeInvitation = () => {
        if (!invitationToRevoke) return;

        router.delete(route('provider.invitations.destroy', invitationToRevoke.id), {
            onSuccess: () => {
                setInvitationToRevoke(null);
            },
        });
    };

    return (
        <AppLayout>
            <Head title="My Clients" />

            <div className="space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            My Clients
                        </h1>
                        <p className="text-muted-foreground">
                            Manage your client relationships
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowInviteModal(true)}
                        >
                            <Mail className="mr-2 h-4 w-4" />
                            Invite Client
                        </Button>
                        <Button
                            onClick={() =>
                                router.get(route('provider.clients.create'))
                            }
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Client
                        </Button>
                    </div>
                </div>

                {pendingInvitations.length > 0 && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                Pending Invitations
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ul className="divide-y">
                                {pendingInvitations.map((invitation) => (
                                    <li
                                        key={invitation.id}
                                        className="flex items-center justify-between px-6 py-3"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">
                                                {invitation.email}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Sent{' '}
                                                {format(
                                                    new Date(invitation.created_at),
                                                    'd MMM yyyy',
                                                )}{' '}
                                                &middot; Expires{' '}
                                                {format(
                                                    new Date(invitation.expires_at),
                                                    'd MMM yyyy',
                                                )}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="ml-4 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                            title="Revoke invitation"
                                            onClick={() =>
                                                setInvitationToRevoke(invitation)
                                            }
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardContent className="p-2">
                        <form onSubmit={handleSearch} className="flex gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                                        router.get(
                                            route('provider.clients.index'),
                                        );
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
                            <UserPlus className="mb-4 h-12 w-12 text-muted-foreground" />
                            <h3 className="mb-2 text-lg font-semibold">
                                {initialSearch
                                    ? 'No clients found'
                                    : 'No clients yet'}
                            </h3>
                            <p className="mb-4 max-w-md text-center text-sm text-muted-foreground">
                                {initialSearch
                                    ? 'Try adjusting your search terms'
                                    : 'Start building your client base by adding or inviting your first client'}
                            </p>
                            {!initialSearch && (
                                <Button
                                    onClick={() =>
                                        router.get(
                                            route('provider.clients.create'),
                                        )
                                    }
                                >
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
                                    <CardContent className="p-2">
                                        <div className="mb-4 flex items-start justify-between">
                                            <div className="min-w-0 flex-1">
                                                <div className="mb-1 flex items-center gap-2">
                                                    <h3 className="truncate text-lg font-semibold">
                                                        {client.name}
                                                    </h3>
                                                    {client.providers_count &&
                                                        client.providers_count >
                                                            1 && (
                                                            <Badge
                                                                variant="secondary"
                                                                className="flex items-center gap-1"
                                                            >
                                                                <Users className="h-3 w-3" />
                                                                Shared
                                                            </Badge>
                                                        )}
                                                </div>
                                                <p className="truncate text-sm text-muted-foreground">
                                                    {client.email}
                                                </p>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        router.get(
                                                            route(
                                                                'provider.clients.show',
                                                                client.id,
                                                            ),
                                                        )
                                                    }
                                                    title="View client"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        router.get(
                                                            route(
                                                                'provider.clients.edit',
                                                                client.id,
                                                            ),
                                                        )
                                                    }
                                                    title="Edit client"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() =>
                                                        setClientToDelete(
                                                            client,
                                                        )
                                                    }
                                                    title="Remove client"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-xs text-muted-foreground">
                                                Added{' '}
                                                {format(
                                                    new Date(
                                                        client.pivot
                                                            ?.created_at ||
                                                            client.created_at,
                                                    ),
                                                    'd MMM yyyy',
                                                )}
                                            </div>
                                            {client.providers_count &&
                                                client.providers_count > 1 && (
                                                    <div className="text-xs text-muted-foreground">
                                                        Linked to{' '}
                                                        {client.providers_count}{' '}
                                                        providers
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
                                            router.get(
                                                route('provider.clients.index'),
                                                {
                                                    page:
                                                        clients.current_page -
                                                        1,
                                                    search: initialSearch,
                                                },
                                            )
                                        }
                                    >
                                        Previous
                                    </Button>
                                )}
                                <span className="text-sm text-muted-foreground">
                                    Page {clients.current_page} of{' '}
                                    {clients.last_page}
                                </span>
                                {clients.current_page < clients.last_page && (
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            router.get(
                                                route('provider.clients.index'),
                                                {
                                                    page:
                                                        clients.current_page +
                                                        1,
                                                    search: initialSearch,
                                                },
                                            )
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

            {/* Invite Client Modal */}
            <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Invite a client</DialogTitle>
                        <DialogDescription>
                            Enter the client's email address. They'll receive an invitation link to register and will be automatically linked to your profile.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSendInvitation}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="invite-email">
                                    Email address
                                </Label>
                                <Input
                                    id="invite-email"
                                    type="email"
                                    placeholder="client@example.com"
                                    value={inviteForm.data.email}
                                    onChange={(e) =>
                                        inviteForm.setData('email', e.target.value)
                                    }
                                    autoFocus
                                />
                                {inviteForm.errors.email && (
                                    <p className="text-destructive text-sm">
                                        {inviteForm.errors.email}
                                    </p>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setShowInviteModal(false);
                                    inviteForm.reset();
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={inviteForm.processing}
                            >
                                <Mail className="mr-2 h-4 w-4" />
                                Send invitation
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Remove Client Confirmation */}
            <AlertDialog
                open={!!clientToDelete}
                onOpenChange={(open) => !open && setClientToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Client?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove{' '}
                            <strong>{clientToDelete?.name}</strong> from your
                            client list. All future bookings with this client
                            will be cancelled. This action cannot be undone.
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

            {/* Revoke Invitation Confirmation */}
            <AlertDialog
                open={!!invitationToRevoke}
                onOpenChange={(open) => !open && setInvitationToRevoke(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Revoke invitation?</AlertDialogTitle>
                        <AlertDialogDescription>
                            The invitation sent to{' '}
                            <strong>{invitationToRevoke?.email}</strong> will be
                            cancelled and the link in their email will no longer
                            work.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={handleRevokeInvitation}
                        >
                            Revoke invitation
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}

