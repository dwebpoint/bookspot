import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/auth-layout';
import { Head, router } from '@inertiajs/react';

interface Props {
    reason: 'expired' | 'accepted';
}

export default function Invalid({ reason }: Props) {
    const isExpired = reason === 'expired';

    return (
        <AuthLayout
            title={isExpired ? 'Invitation expired' : 'Invitation already used'}
            description={
                isExpired
                    ? 'This invitation link has expired. Please ask your service provider to send a new invitation.'
                    : 'This invitation has already been accepted. If you already have an account, you can log in below.'
            }
        >
            <Head title="Invalid Invitation" />
            <div className="flex flex-col gap-3">
                <Button onClick={() => router.visit('/')}>Go to home</Button>
                {!isExpired && (
                    <p className="text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <TextLink href="/login">Log in</TextLink>
                    </p>
                )}
            </div>
        </AuthLayout>
    );
}
