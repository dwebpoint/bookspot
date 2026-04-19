<?php

namespace App\Http\Controllers\Provider;

use App\Http\Controllers\Controller;
use App\Http\Requests\Provider\StoreClientNoteRequest;
use App\Http\Requests\Provider\UpdateClientNoteRequest;
use App\Models\ClientNote;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;

class ClientNoteController extends Controller
{
    use AuthorizesRequests;

    /**
     * Store a new note for the given client.
     */
    public function store(StoreClientNoteRequest $request, User $client): RedirectResponse
    {
        $this->authorize('manageClientNotes', $client);

        ClientNote::create([
            'provider_id' => auth()->id(),
            'client_id' => $client->id,
            'note_date' => $request->validated('note_date'),
            'body' => $request->validated('body'),
        ]);

        return redirect()->route('provider.clients.show', $client)
            ->with('success', 'Note added.');
    }

    /**
     * Update an existing note.
     */
    public function update(UpdateClientNoteRequest $request, User $client, ClientNote $note): RedirectResponse
    {
        $this->authorize('modifyClientNote', $note);

        $note->update([
            'note_date' => $request->validated('note_date'),
            'body' => $request->validated('body'),
        ]);

        return redirect()->route('provider.clients.show', $client)
            ->with('success', 'Note updated.');
    }

    /**
     * Delete a note.
     */
    public function destroy(User $client, ClientNote $note): RedirectResponse
    {
        $this->authorize('modifyClientNote', $note);

        $note->delete();

        return redirect()->route('provider.clients.show', $client)
            ->with('success', 'Note deleted.');
    }
}
