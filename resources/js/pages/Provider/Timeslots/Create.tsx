import { Head, useForm } from '@inertiajs/react';
import { route } from '@/lib/route-helper';
import { FormEvent } from 'react';
import AppLayout from '@/layouts/app-layout';
import FlashMessages from '@/components/FlashMessages';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        start_time: '',
        duration_minutes: 60,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('provider.timeslots.store'));
    };

    return (
        <AppLayout>
            <Head title="Create Timeslot" />
            <FlashMessages />

            <div className="mx-auto max-w-2xl space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Create Timeslot
                    </h1>
                    <p className="text-muted-foreground">
                        Add a new available timeslot to your schedule
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Timeslot Details</CardTitle>
                        <CardDescription>
                            Enter the start time and duration for your timeslot.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="start_time">
                                    Start Time <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="start_time"
                                    type="datetime-local"
                                    value={data.start_time}
                                    onChange={(e) =>
                                        setData('start_time', e.target.value)
                                    }
                                    required
                                />
                                {errors.start_time && (
                                    <p className="text-sm text-destructive">
                                        {errors.start_time}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="duration_minutes">
                                    Duration <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={data.duration_minutes.toString()}
                                    onValueChange={(value) =>
                                        setData('duration_minutes', parseInt(value))
                                    }
                                >
                                    <SelectTrigger id="duration_minutes">
                                        <SelectValue placeholder="Select duration" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="15">15 minutes</SelectItem>
                                        <SelectItem value="30">30 minutes</SelectItem>
                                        <SelectItem value="45">45 minutes</SelectItem>
                                        <SelectItem value="60">1 hour</SelectItem>
                                        <SelectItem value="90">1.5 hours</SelectItem>
                                        <SelectItem value="120">2 hours</SelectItem>
                                        <SelectItem value="180">3 hours</SelectItem>
                                        <SelectItem value="240">4 hours</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.duration_minutes && (
                                    <p className="text-sm text-destructive">
                                        {errors.duration_minutes}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Creating...' : 'Create Timeslot'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        window.history.back()
                                    }
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
