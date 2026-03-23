import { Head, usePage } from '@inertiajs/react';

import HeadingSmall from '@/components/heading-small';
import { type BreadcrumbItem, type SharedData } from '@/types';

import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit as editInfo } from '@/routes/info';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Application info',
        href: editInfo().url,
    },
];

export default function Info() {
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
            </SettingsLayout>
        </AppLayout>
    );
}
