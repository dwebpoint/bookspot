<?php

namespace App\Policies;

use App\Models\Invitation;
use App\Models\User;

class InvitationPolicy
{
    public function create(User $user): bool
    {
        return $user->isServiceProvider() || $user->isAdmin();
    }

    public function delete(User $user, Invitation $invitation): bool
    {
        return $invitation->provider_id === $user->id || $user->isAdmin();
    }
}
