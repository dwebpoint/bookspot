<?php

namespace App\Policies;

use App\Models\Timeslot;
use App\Models\User;

class TimeslotPolicy
{
    /**
     * Determine whether the user can view any timeslots.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('view timeslots') || $user->isServiceProvider() || $user->isAdmin();
    }

    /**
     * Determine whether the user can view the timeslot.
     */
    public function view(User $user, Timeslot $timeslot): bool
    {
        return $user->id === $timeslot->provider_id || $user->isAdmin();
    }

    /**
     * Determine whether the user can create timeslots.
     */
    public function create(User $user): bool
    {
        return $user->can('create timeslots') || $user->isServiceProvider() || $user->isAdmin();
    }

    /**
     * Determine whether the user can update the timeslot.
     */
    public function update(User $user, Timeslot $timeslot): bool
    {
        return ($user->can('update timeslots') && $user->id === $timeslot->provider_id) || $user->isAdmin();
    }

    /**
     * Determine whether the user can delete the timeslot.
     */
    public function delete(User $user, Timeslot $timeslot): bool
    {
        return ($user->can('delete timeslots') && $user->id === $timeslot->provider_id) || $user->isAdmin();
    }
}
