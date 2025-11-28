import FlashMessages from '@/components/FlashMessages';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { route } from '@/lib/route-helper';
import type { SharedData, User } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEvent } from 'react';

interface AdminUsersEditProps extends SharedData {
    user: User;
}

const timezones = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Toronto',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
];

export default function Edit() {
    const { user } = usePage<AdminUsersEditProps>().props;
    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        password: '',
        password_confirmation: '',
        role: user.role,
        timezone: user.timezone || 'UTC',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put(route('admin.users.update', user.id));
    };

    return (
        <AppLayout>
            <Head title={`Edit ${user.name}`} />
            <FlashMessages />

            <div className="mx-auto max-w-2xl space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Edit User
                    </h1>
                    <p className="text-muted-foreground">
                        Update {user.name}'s information
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>User Details</CardTitle>
                        <CardDescription>
                            Update the user's information and role. Leave
                            password blank to keep current password.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Name{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    required
                                    autoFocus
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    Email{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                    required
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">
                                    Password{' '}
                                    <span className="text-muted-foreground">
                                        (leave blank to keep current)
                                    </span>
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                />
                                {errors.password && (
                                    <p className="text-sm text-destructive">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">
                                    Confirm Password
                                </Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) =>
                                        setData(
                                            'password_confirmation',
                                            e.target.value,
                                        )
                                    }
                                />
                                {errors.password_confirmation && (
                                    <p className="text-sm text-destructive">
                                        {errors.password_confirmation}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">
                                    Role{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={data.role}
                                    onValueChange={(value) =>
                                        setData(
                                            'role',
                                            value as
                                                | 'admin'
                                                | 'service_provider'
                                                | 'client',
                                        )
                                    }
                                >
                                    <SelectTrigger id="role">
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="client">
                                            Client
                                        </SelectItem>
                                        <SelectItem value="service_provider">
                                            Service Provider
                                        </SelectItem>
                                        <SelectItem value="admin">
                                            Admin
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.role && (
                                    <p className="text-sm text-destructive">
                                        {errors.role}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="timezone">
                                    Timezone{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={data.timezone}
                                    onValueChange={(value) =>
                                        setData('timezone', value)
                                    }
                                >
                                    <SelectTrigger id="timezone">
                                        <SelectValue placeholder="Select timezone" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {timezones.map((tz) => (
                                            <SelectItem key={tz} value={tz}>
                                                {tz}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.timezone && (
                                    <p className="text-sm text-destructive">
                                        {errors.timezone}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Updating...' : 'Update User'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => window.history.back()}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
