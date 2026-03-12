import NotificationsController from '@/actions/App/Http/Controllers/Settings/NotificationsController';
import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { edit } from '@/routes/notifications';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Notification settings',
        href: edit().url,
    },
];

export default function Notifications() {
    const { auth } = usePage<SharedData>().props;

    const form = useForm({
        email_notifications_enabled: auth.user?.email_notifications_enabled ?? false,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.patch(NotificationsController.update().url, { preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notification settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Notification preferences"
                        description="Choose which email notifications you want to receive"
                    />

                    <form onSubmit={submit} className="space-y-6">
                        <div className="flex items-start gap-3">
                            <Checkbox
                                id="email_notifications_enabled"
                                checked={form.data.email_notifications_enabled}
                                onCheckedChange={(checked) =>
                                    form.setData(
                                        'email_notifications_enabled',
                                        checked === true,
                                    )
                                }
                            />
                            <div className="grid gap-1">
                                <Label htmlFor="email_notifications_enabled">
                                    Email notifications
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Receive an email when a client books or
                                    cancels a timeslot.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Button disabled={form.processing}>
                                Save preferences
                            </Button>

                            <Transition
                                show={form.recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-neutral-600">
                                    Saved
                                </p>
                            </Transition>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
