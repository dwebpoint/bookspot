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

interface Client {
    id: number;
    name: string;
    email: string;
}

interface EditClientProps extends SharedData {
    client: Client;
}

export default function Edit({ client }: EditClientProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: client.name,
        email: client.email,
        phone: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('provider.clients.update', client.id));
    };

    return (
        <AppLayout>
            <Head title="Edit Client" />
            <FlashMessages />

            <div className="space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Edit Client
                        </h1>
                        <p className="text-muted-foreground">
                            Update client information
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
                            Update the client's details below.
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
                                <p className="text-xs text-muted-foreground">
                                    Changing the email will update the client's
                                    login credentials
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button type="submit" disabled={processing}>
                                    {processing
                                        ? 'Updating Client...'
                                        : 'Update Client'}
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
            </div>
        </AppLayout>
    );
}
