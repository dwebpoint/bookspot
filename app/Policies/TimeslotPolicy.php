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
        // Cannot update booked timeslots
        if ($timeslot->is_booked) {
            return false;
        }

        return ($user->can('update timeslots') && $user->id === $timeslot->provider_id) || $user->isAdmin();
    }

    /**
     * Determine whether the user can delete the timeslot.
     */
    public function delete(User $user, Timeslot $timeslot): bool
    {
        // Only allow deletion of available or cancelled timeslots
        if ($timeslot->is_booked || $timeslot->is_completed) {
            return false;
        }

        return ($user->can('delete timeslots') && $user->id === $timeslot->provider_id) || $user->isAdmin();
    }

    /**
     * Determine whether the user can book the timeslot.
     */
    public function book(User $user, Timeslot $timeslot): bool
    {
        // Must be a client
        if (! $user->isClient()) {
            return false;
        }

        // Timeslot must be available
        if (! $timeslot->is_available) {
            return false;
        }

        // Client must be linked to the provider
        return $user->hasProvider($timeslot->provider_id);
    }

    /**
     * Determine whether the user can cancel the booking on this timeslot.
     */
    public function cancelBooking(User $user, Timeslot $timeslot): bool
    {
        // Timeslot must be booked
        if (! $timeslot->is_booked) {
            return false;
        }

        // Client who booked it, provider who owns it, or admin
        return $user->id === $timeslot->client_id
            || $user->id === $timeslot->provider_id
            || $user->isAdmin();
    }

    /**
     * Determine whether the provider can assign a client to this timeslot.
     */
    public function assignClient(User $user, Timeslot $timeslot): bool
    {
        // Must be the provider or admin
        if ($user->id !== $timeslot->provider_id && ! $user->isAdmin()) {
            return false;
        }

        // Timeslot must be available or booked (for reassignment)
        return $timeslot->is_available || $timeslot->is_booked;
    }
}
