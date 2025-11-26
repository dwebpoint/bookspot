import FlashMessages from '@/components/FlashMessages';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Search, UserCog } from 'lucide-react';
import { useState } from 'react';

interface AdminUsersIndexProps extends SharedData {
    users: PaginatedResponse<User>;
    filters: {
        search?: string;
        role?: 'admin' | 'service_provider' | 'client';
    };
}

export default function Index() {
    const { users, filters } = usePage<AdminUsersIndexProps>().props;
    const [search, setSearch] = useState(filters.search || '');

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

    const getRoleLabel = (role: string) => {
        const labels: Record<string, string> = {
            admin: 'Admin',
            service_provider: 'Service Provider',
            client: 'Client',
        };
        return labels[role] || role;
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

                    <div className="flex gap-2">
                        <Button
                            variant={!filters.role ? 'default' : 'outline'}
                            onClick={() => handleRoleFilter('all')}
                        >
                            All
                        </Button>
                        <Button
                            variant={
                                filters.role === 'admin' ? 'default' : 'outline'
                            }
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
                            onClick={() => handleRoleFilter('client')}
                        >
                            Clients
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
                                {users.data.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">
                                            {user.name}
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <StatusBadge
                                                status={getRoleLabel(user.role)}
                                                variant={getRoleBadgeVariant(
                                                    user.role,
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
                                ))}
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
        </AppLayout>
    );
}
