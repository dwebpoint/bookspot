import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { Provider } from '@/types/client';
import { Users } from 'lucide-react';

interface ClientProvidersProps {
    providers: Provider[];
}

export default function ClientProviders({ providers }: ClientProvidersProps) {
    if (providers.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>My Providers</CardTitle>
                    <CardDescription>
                        You are not currently linked to any service providers
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <CardTitle>My Providers</CardTitle>
                </div>
                <CardDescription>
                    Service providers you are linked to
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {providers.map((provider) => (
                        <div
                            key={provider.id}
                            className="flex items-center justify-between rounded-lg border p-3"
                        >
                            <div className="space-y-1">
                                <p className="font-medium">{provider.name}</p>
                                {provider.email && (
                                    <p className="text-sm text-muted-foreground">
                                        {provider.email}
                                    </p>
                                )}
                            </div>
                            <Badge variant="secondary">Active</Badge>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
