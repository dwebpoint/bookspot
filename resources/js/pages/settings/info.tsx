import InfoController from '@/actions/App/Http/Controllers/Settings/InfoController';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, usePage } from '@inertiajs/react';
import { edit as editInfo } from '@/routes/info';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Application info',
        href: editInfo().url,
    },
];

export default function Info({ contactEmail }: { contactEmail: string }) {
    const { commitHash } = usePage<SharedData>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Application info" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Application info"
                        description="Details about the deployed application"
                    />
                    <div className="space-y-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-sm font-medium text-foreground">
                                Deployed commit:
                            </span>
                            {commitHash ? (
                                <code className="rounded bg-muted px-2 py-1 text-sm">
                                    {commitHash}
                                </code>
                            ) : (
                                <span className="text-sm text-muted-foreground">
                                    Not available
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <HeadingSmall
                        title="Site settings"
                        description="Configure public-facing site information"
                    />

                    <Form
                        {...InfoController.update.form()}
                        options={{ preserveScroll: true }}
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="contact_email">
                                        Contact email
                                    </Label>
                                    <Input
                                        id="contact_email"
                                        type="email"
                                        name="contact_email"
                                        defaultValue={contactEmail}
                                        placeholder="contact@example.com"
                                        required
                                        className="max-w-sm"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Displayed on the public contact page.
                                    </p>
                                    <InputError message={errors.contact_email} />
                                </div>

                                <div className="flex items-center gap-4">
                                    <Button disabled={processing}>Save</Button>

                                    <Transition
                                        show={recentlySuccessful}
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
                            </>
                        )}
                    </Form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
