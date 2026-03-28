import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { Head, useForm } from '@inertiajs/react';

interface Props {
    email: string;
    token: string;
    providerName: string;
}

export default function Register({ email, token, providerName }: Props) {
    const form = useForm({
        name: '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(`/invitation/${token}`, {
            onSuccess: () => form.reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout
            title="Accept your invitation"
            description={`You've been invited by ${providerName} to join. Create your account below.`}
        >
            <Head title="Accept Invitation" />
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Full name</Label>
                        <Input
                            id="name"
                            type="text"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="name"
                            name="name"
                            placeholder="Full name"
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                        />
                        <InputError message={form.errors.name} className="mt-2" />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            tabIndex={2}
                            autoComplete="email"
                            name="email"
                            value={email}
                            readOnly
                            className="bg-muted text-muted-foreground"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            tabIndex={3}
                            autoComplete="new-password"
                            name="password"
                            placeholder="Password"
                            value={form.data.password}
                            onChange={(e) =>
                                form.setData('password', e.target.value)
                            }
                        />
                        <InputError message={form.errors.password} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">
                            Confirm password
                        </Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            required
                            tabIndex={4}
                            autoComplete="new-password"
                            name="password_confirmation"
                            placeholder="Confirm password"
                            value={form.data.password_confirmation}
                            onChange={(e) =>
                                form.setData(
                                    'password_confirmation',
                                    e.target.value,
                                )
                            }
                        />
                        <InputError
                            message={form.errors.password_confirmation}
                        />
                    </div>

                    <Button
                        type="submit"
                        className="mt-2 w-full"
                        tabIndex={5}
                        disabled={form.processing}
                    >
                        {form.processing && <Spinner />}
                        Create account
                    </Button>
                </div>
            </form>
        </AuthLayout>
    );
}
