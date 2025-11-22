<?php

namespace App\Policies;

use App\Models\User;

class ProviderClientPolicy
{
    /**
     * Determine if the user can view any clients.
     */
    public function viewAny(User $user): bool
    {
        return $user->isServiceProvider() || $user->isAdmin();
    }

    /**
     * Determine if the user can view the client.
     */
    public function view(User $user, User $client): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($user->isServiceProvider()) {
            return $user->hasClient($client->id);
        }

        return false;
    }

    /**
     * Determine if the user can create clients.
     */
    public function create(User $user): bool
    {
        return $user->isServiceProvider() || $user->isAdmin();
    }

    /**
     * Determine if the user can remove a client relationship.
     */
    public function delete(User $user, User $client): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($user->isServiceProvider()) {
            return $user->hasClient($client->id);
        }

        return false;
    }

    /**
     * Determine if the user can assign a timeslot to the client.
     */
    public function assignTimeslot(User $user, User $client): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($user->isServiceProvider()) {
            return $user->hasClient($client->id);
        }

        return false;
    }
}
