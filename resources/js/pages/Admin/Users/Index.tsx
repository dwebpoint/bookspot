import FlashMessages from '@/components/FlashMessages';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { route } from '@/lib/route-helper';
import type { PaginatedResponse, SharedData, User } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Link2, Plus, Search, UserCog } from 'lucide-react';
import { useState } from 'react';

interface ServiceProvider {
    id: number;
    name: string;
    email: string;
}

interface AdminUsersIndexProps extends SharedData {
    users: PaginatedResponse<User>;
    filters: {
        search?: string;
        role?: string;
    };
    serviceProviders: ServiceProvider[];
    stats: {
        total_users: number;
        admins: number;
        service_providers: number;
        clients: number;
        no_role: number;
    };
}

export default function Index() {
    const { users, filters, serviceProviders, stats } =
        usePage<AdminUsersIndexProps>().props;
    const [search, setSearch] = useState(filters.search || '');
    const [attachModalUser, setAttachModalUser] = useState<User | null>(null);

    const attachForm = useForm({
        provider_id: '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('admin.users.index'),
            { ...filters, search },
            { preserveState: true },
        );
    };

    const handleRoleFilter = (role: string) => {
        router.get(
            route('admin.users.index'),
            {
                ...filters,
                role: role === 'all' ? undefined : role,
            },
            { preserveState: true },
        );
    };

    const handleAttachProvider = (e: React.FormEvent) => {
        e.preventDefault();
        if (!attachModalUser) return;
        attachForm.post(
            route('admin.users.attachProvider', attachModalUser.id),
            {
                onSuccess: () => {
                    setAttachModalUser(null);
                    attachForm.reset();
                },
            },
        );
    };

    const getUserRole = (user: User): string => {
        if (user.roles && user.roles.length > 0) {
            return user.roles[0].name;
        }
        return '';
    };

    const getRoleLabel = (role: string) => {
        const labels: Record<string, string> = {
            admin: 'Admin',
            service_provider: 'Service Provider',
            client: 'Client',
        };
        return labels[role] || 'No Role';
    };

    const getRoleBadgeVariant = (role: string) => {
        const variants: Record<
            string,
            'default' | 'secondary' | 'destructive' | 'outline'
        > = {
            admin: 'destructive',
            service_provider: 'default',
            client: 'secondary',
        };
        return variants[role] || 'outline';
    };

    return (
        <AppLayout>
            <Head title="User Management" />
            <FlashMessages />

            <div className="space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            User Management
                        </h1>
                        <p className="text-muted-foreground">
                            Manage users and their roles
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={route('admin.users.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create User
                        </Link>
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                    <div className="rounded-lg border p-3 text-center">
                        <p className="text-2xl font-bold">
                            {stats.total_users}
                        </p>
                        <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="rounded-lg border p-3 text-center">
                        <p className="text-2xl font-bold">{stats.admins}</p>
                        <p className="text-xs text-muted-foreground">Admins</p>
                    </div>
                    <div className="rounded-lg border p-3 text-center">
                        <p className="text-2xl font-bold">
                            {stats.service_providers}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Providers
                        </p>
                    </div>
                    <div className="rounded-lg border p-3 text-center">
                        <p className="text-2xl font-bold">{stats.clients}</p>
                        <p className="text-xs text-muted-foreground">
                            Clients
                        </p>
                    </div>
                    <div className="rounded-lg border p-3 text-center">
                        <p className="text-2xl font-bold">{stats.no_role}</p>
                        <p className="text-xs text-muted-foreground">
                            No role
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-4 md:flex-row">
                    <form onSubmit={handleSearch} className="flex flex-1 gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Button type="submit">Search</Button>
                    </form>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant={!filters.role ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleRoleFilter('all')}
                        >
                            All
                        </Button>
                        <Button
                            variant={
                                filters.role === 'admin' ? 'default' : 'outline'
                            }
                            size="sm"
                            onClick={() => handleRoleFilter('admin')}
                        >
                            Admin
                        </Button>
                        <Button
                            variant={
                                filters.role === 'service_provider'
                                    ? 'default'
                                    : 'outline'
                            }
                            size="sm"
                            onClick={() => handleRoleFilter('service_provider')}
                        >
                            Providers
                        </Button>
                        <Button
                            variant={
                                filters.role === 'client'
                                    ? 'default'
                                    : 'outline'
                            }
                            size="sm"
                            onClick={() => handleRoleFilter('client')}
                        >
                            Clients
                        </Button>
                        <Button
                            variant={
                                filters.role === 'none' ? 'default' : 'outline'
                            }
                            size="sm"
                            onClick={() => handleRoleFilter('none')}
                        >
                            No Role
                        </Button>
                    </div>
                </div>

                {/* Users Table */}
                {users.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                        <UserCog className="mb-4 h-12 w-12 text-muted-foreground" />
                        <h3 className="mb-2 text-lg font-semibold">
                            No users found
                        </h3>
                        <p className="mb-4 text-sm text-muted-foreground">
                            {filters.search || filters.role
                                ? 'Try adjusting your filters.'
                                : 'Create your first user to get started.'}
                        </p>
                    </div>
                ) : (
                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Timezone</TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.data.map((user) => {
                                    const userRole = getUserRole(user);
                                    return (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">
                                                {user.name}
                                            </TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <StatusBadge
                                                    status={getRoleLabel(
                                                        userRole,
                                                    )}
                                                    variant={getRoleBadgeVariant(
                                                        userRole,
                                                    )}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {user.timezone || 'UTC'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        title="Attach to provider"
                                                        onClick={() =>
                                                            setAttachModalUser(
                                                                user,
                                                            )
                                                        }
                                                    >
                                                        <Link2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={route(
                                                                'admin.users.show',
                                                                user.id,
                                                            )}
                                                        >
                                                            View
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={route(
                                                                'admin.users.edit',
                                                                user.id,
                                                            )}
                                                        >
                                                            Edit
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* Pagination */}
                {users.links.length > 3 && (
                    <div className="flex items-center justify-center gap-2">
                        {users.links.map((link, index) => (
                            <Button
                                key={index}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => {
                                    if (link.url) {
                                        router.get(link.url);
                                    }
                                }}
                                disabled={!link.url}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Attach to Provider Modal */}
            <Dialog
                open={!!attachModalUser}
                onOpenChange={(open) => {
                    if (!open) {
                        setAttachModalUser(null);
                        attachForm.reset();
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Attach to service provider</DialogTitle>
                        <DialogDescription>
                            Link {attachModalUser?.name} to a service provider.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAttachProvider}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="provider_id">
                                    Service provider
                                </Label>
                                <Select
                                    value={attachForm.data.provider_id}
                                    onValueChange={(value) =>
                                        attachForm.setData(
                                            'provider_id',
                                            value,
                                        )
                                    }
                                >
                                    <SelectTrigger id="provider_id">
                                        <SelectValue placeholder="Select a provider" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {serviceProviders
                                            .filter(
                                                (p) =>
                                                    p.id !==
                                                    attachModalUser?.id,
                                            )
                                            .map((provider) => (
                                                <SelectItem
                                                    key={provider.id}
                                                    value={String(provider.id)}
                                                >
                                                    {provider.name} (
                                                    {provider.email})
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                                {attachForm.errors.provider_id && (
                                    <p className="text-sm text-destructive">
                                        {attachForm.errors.provider_id}
                                    </p>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setAttachModalUser(null);
                                    attachForm.reset();
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    attachForm.processing ||
                                    !attachForm.data.provider_id
                                }
                            >
                                {attachForm.processing
                                    ? 'Linking...'
                                    : 'Link to provider'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
