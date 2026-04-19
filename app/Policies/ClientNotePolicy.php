<?php

namespace App\Policies;

use App\Models\ClientNote;
use App\Models\User;

class ClientNotePolicy
{
    /**
     * Determine if the provider can manage notes for a given client.
     */
    public function manage(User $user, User $client): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $user->isServiceProvider() && $user->hasClient($client->id);
    }

    /**
     * Determine if the provider can update or delete a specific note.
     */
    public function modify(User $user, ClientNote $note): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $note->provider_id === $user->id;
    }
}
