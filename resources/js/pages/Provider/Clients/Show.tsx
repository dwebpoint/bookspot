import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { route } from '@/lib/route-helper';
import type { SharedData } from '@/types';
import type { ClientNote } from '@/types/client';
import type { Timeslot } from '@/types/timeslot';
import { destroy, store, update } from '@/routes/provider/clients/notes';
import { Head, router, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Clock, Mail, Pencil, Plus, Trash2, User } from 'lucide-react';
import { useState } from 'react';

interface ClientDetail {
    id: number;
    name: string;
    email: string;
    created_at: string;
    added_at: string | null;
}

interface ShowClientProps extends SharedData {
    client: ClientDetail;
    timeslots: Timeslot[];
    notes: ClientNote[];
}

type StatusFilter = 'all' | 'booked' | 'completed';

const STATUS_LABELS: Record<StatusFilter, string> = {
    all: 'All',
    booked: 'Booked',
    completed: 'Completed',
};

const STATUS_STYLES: Record<string, string> = {
    available: 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950',
    booked: 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950',
    completed: 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900',
};

const BADGE_STYLES: Record<string, string> = {
    available: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    booked: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    completed: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

export default function Show({ client, timeslots, notes }: ShowClientProps) {
    const [filter, setFilter] = useState<StatusFilter>('completed');
    const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
    const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);

    const today = format(new Date(), 'yyyy-MM-dd');

    const createForm = useForm({ note_date: today, body: '' });
    const editForm = useForm({ note_date: '', body: '' });

    const counts: Record<StatusFilter, number> = {
        all: timeslots.length,
        booked: timeslots.filter((t) => t.status === 'booked').length,
        completed: timeslots.filter((t) => t.status === 'completed').length,
    };

    const filtered =
        filter === 'all' ? timeslots : timeslots.filter((t) => t.status === filter);

    function submitCreate(e: React.FormEvent) {
        e.preventDefault();
        createForm.post(store.url(client.id), {
            onSuccess: () => createForm.reset('body'),
        });
    }

    function startEdit(note: ClientNote) {
        editForm.setData({ note_date: note.note_date, body: note.body });
        setEditingNoteId(note.id);
    }

    function submitEdit(e: React.FormEvent, noteId: number) {
        e.preventDefault();
        editForm.put(update.url({ client: client.id, note: noteId }), {
            onSuccess: () => setEditingNoteId(null),
        });
    }

    function confirmDelete() {
        if (deletingNoteId === null) {
            return;
        }
        router.delete(destroy.url({ client: client.id, note: deletingNoteId }), {
            onFinish: () => setDeletingNoteId(null),
        });
    }

    return (
        <AppLayout>
            <Head title={client.name} />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.get(route('provider.clients.index'))}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
                        <p className="text-muted-foreground">Client profile</p>
                    </div>
                </div>

                {/* Client info card */}
                <Card>
                    <CardContent className="p-2">
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="flex items-center gap-3">
                                <User className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Name</p>
                                    <p className="font-medium">{client.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Email</p>
                                    <p className="font-medium">{client.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Added</p>
                                    <p className="font-medium">
                                        {format(
                                            new Date(client.added_at ?? client.created_at),
                                            'd MMM yyyy',
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Timeslots */}
                <div>
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold">Appointments</h2>
                        <div className="flex flex-wrap gap-2">
                            {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((status) => (
                                <Button
                                    key={status}
                                    size="sm"
                                    variant={filter === status ? 'default' : 'outline'}
                                    onClick={() => setFilter(status)}
                                >
                                    {STATUS_LABELS[status]}
                                    {counts[status] > 0 && (
                                        <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                                            {counts[status]}
                                        </span>
                                    )}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {filtered.length === 0 ? (
                        <Card>
                            <CardContent className="flex items-center justify-center py-12">
                                <p className="text-muted-foreground">No appointments found</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Carousel className="w-full">
                            <div className="mb-3 flex items-center justify-between">
                                <CarouselPrevious className="static translate-0 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700" />
                                <CarouselNext className="static translate-0 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700" />
                            </div>
                            <CarouselContent>
                                {filtered.map((timeslot) => (
                                    <CarouselItem
                                        key={timeslot.id}
                                        className="sm:basis-1/2 lg:basis-1/3"
                                    >
                                        <Card className={`border ${STATUS_STYLES[timeslot.status]}`}>
                                            <CardContent className="p-4">
                                                <div className="mb-2 flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                                        <span className="font-medium">
                                                            {format(
                                                                new Date(timeslot.start_time),
                                                                'EEE, d MMM yyyy',
                                                            )}
                                                        </span>
                                                    </div>
                                                    <span
                                                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_STYLES[timeslot.status]}`}
                                                    >
                                                        {timeslot.status.charAt(0).toUpperCase() +
                                                            timeslot.status.slice(1)}
                                                    </span>
                                                </div>
                                                <div className="mb-1 flex items-center gap-2 text-sm">
                                                    <Clock className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                                    <span>
                                                        {format(new Date(timeslot.start_time), 'HH:mm')}
                                                        {' – '}
                                                        {format(new Date(timeslot.end_time), 'HH:mm')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Clock className="h-3 w-3 flex-shrink-0" />
                                                    <span>{timeslot.duration_minutes} min</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                        </Carousel>
                    )}
                </div>

                {/* Notes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">Notes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Add note form */}
                        <form onSubmit={submitCreate} className="space-y-3">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                                <input
                                    type="date"
                                    value={createForm.data.note_date}
                                    onChange={(e) => createForm.setData('note_date', e.target.value)}
                                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none sm:w-40"
                                    required
                                />
                                <Textarea
                                    value={createForm.data.body}
                                    onChange={(e) => createForm.setData('body', e.target.value)}
                                    placeholder="Add a note…"
                                    className="min-h-[72px] flex-1 resize-none"
                                    maxLength={2000}
                                    required
                                />
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={createForm.processing}
                                    className="self-start"
                                >
                                    Save
                                </Button>
                            </div>
                            {createForm.errors.body && (
                                <p className="text-destructive text-sm">{createForm.errors.body}</p>
                            )}
                            {createForm.errors.note_date && (
                                <p className="text-destructive text-sm">{createForm.errors.note_date}</p>
                            )}
                        </form>

                        {/* Notes list */}
                        {notes.length === 0 ? (
                            <p className="text-muted-foreground py-4 text-center text-sm">
                                No notes yet.
                            </p>
                        ) : (
                            <ul className="divide-y">
                                {notes.map((note) =>
                                    editingNoteId === note.id ? (
                                        <li key={note.id} className="py-3">
                                            <form
                                                onSubmit={(e) => submitEdit(e, note.id)}
                                                className="space-y-2"
                                            >
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                                                    <input
                                                        type="date"
                                                        value={editForm.data.note_date}
                                                        onChange={(e) =>
                                                            editForm.setData('note_date', e.target.value)
                                                        }
                                                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none sm:w-40"
                                                        required
                                                    />
                                                    <Textarea
                                                        value={editForm.data.body}
                                                        onChange={(e) =>
                                                            editForm.setData('body', e.target.value)
                                                        }
                                                        className="min-h-[72px] flex-1 resize-none"
                                                        maxLength={2000}
                                                        required
                                                    />
                                                    <div className="flex gap-2 self-start">
                                                        <Button
                                                            type="submit"
                                                            size="sm"
                                                            disabled={editForm.processing}
                                                        >
                                                            Update
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setEditingNoteId(null)}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                                {editForm.errors.body && (
                                                    <p className="text-destructive text-sm">
                                                        {editForm.errors.body}
                                                    </p>
                                                )}
                                            </form>
                                        </li>
                                    ) : (
                                        <li
                                            key={note.id}
                                            className="flex items-start justify-between gap-3 py-3"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="text-muted-foreground mb-1 text-xs">
                                                    {format(new Date(note.note_date + 'T00:00:00'), 'd MMM yyyy')}
                                                </p>
                                                <p className="whitespace-pre-wrap text-sm">{note.body}</p>
                                            </div>
                                            <div className="flex shrink-0 gap-1">
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7"
                                                    onClick={() => startEdit(note)}
                                                    aria-label="Edit note"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    className="text-destructive hover:text-destructive h-7 w-7"
                                                    onClick={() => setDeletingNoteId(note.id)}
                                                    aria-label="Delete note"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </li>
                                    ),
                                )}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete confirmation */}
            <AlertDialog
                open={deletingNoteId !== null}
                onOpenChange={(open) => !open && setDeletingNoteId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete note?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This note will be permanently deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
