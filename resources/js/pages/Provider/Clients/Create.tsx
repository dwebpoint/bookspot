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
import AppLayout from '@/layouts/app-layout';
import { route } from '@/lib/route-helper';
import type { SharedData } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

interface CreateClientProps extends SharedData {}

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('provider.clients.store'));
    };

    return (
        <AppLayout>
            <Head title="Add New Client" />
            <FlashMessages />

            <div className="space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Add New Client
                        </h1>
                        <p className="text-muted-foreground">
                            Create a new client account and link them to your
                            services
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() =>
                            router.get(route('provider.clients.index'))
                        }
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Clients
                    </Button>
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Client Information</CardTitle>
                        <CardDescription>
                            Enter the client's details. If an account with this
                            email already exists, they will be linked to your
                            services.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
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
                                    placeholder="John Doe"
                                    disabled={processing}
                                    className={
                                        errors.name ? 'border-destructive' : ''
                                    }
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
                                    placeholder="john@example.com"
                                    disabled={processing}
                                    className={
                                        errors.email ? 'border-destructive' : ''
                                    }
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone (Optional)</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={data.phone}
                                    onChange={(e) =>
                                        setData('phone', e.target.value)
                                    }
                                    placeholder="+1 (555) 123-4567"
                                    disabled={processing}
                                    className={
                                        errors.phone ? 'border-destructive' : ''
                                    }
                                />
                                {errors.phone && (
                                    <p className="text-sm text-destructive">
                                        {errors.phone}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button type="submit" disabled={processing}>
                                    {processing
                                        ? 'Adding Client...'
                                        : 'Add Client'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        router.get(
                                            route('provider.clients.index'),
                                        )
                                    }
                                    disabled={processing}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card className="max-w-2xl bg-muted/50">
                    <CardHeader>
                        <CardTitle className="text-base">
                            About Client Accounts
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <p>
                            • If a client account with this email doesn't exist,
                            a new account will be created
                        </p>
                        <p>
                            • If the email is already registered, the existing
                            client will be linked to your services
                        </p>
                        <p>
                            • New clients will receive an email with
                            instructions to set their password
                        </p>
                        <p>
                            • Clients will only see your available timeslots
                            once linked
                        </p>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
