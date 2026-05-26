<?php

namespace App\Policies;

use App\Enums\TimeslotStatus;
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
        // Admins can update any timeslot
        if ($user->isAdmin()) {
            return true;
        }

        return $user->can('update timeslots') && $user->id === $timeslot->provider_id;
    }

    /**
     * Determine whether the user can delete the timeslot.
     */
    public function delete(User $user, Timeslot $timeslot): bool
    {
        // Admins can delete any timeslot
        if ($user->isAdmin()) {
            return true;
        }

        // Service providers can delete their own timeslots (including past ones and completed)
        if ($user->isServiceProvider() && $user->id === $timeslot->provider_id && $user->can('delete timeslots')) {
            // Cannot delete booked timeslots (to protect active bookings)
            if ($timeslot->is_booked) {
                return false;
            }

            return true;
        }

        return false;
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

        // Clients cannot cancel bookings for timeslots in the past
        if ($user->isClient() && $timeslot->start_time->lessThan(now())) {
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

        // Timeslot must be available, booked, or completed (for reassignment of past timeslots).
        // Completed timeslots in the past may need client correction; status is preserved on reassignment.
        return $timeslot->is_available || $timeslot->is_booked || $timeslot->is_completed;
    }

    /**
     * Determine whether the user can force delete the timeslot (including booked ones).
     * This is used from the bookings page to delete booked timeslots.
     */
    public function forceDelete(User $user, Timeslot $timeslot): bool
    {
        // Provider can force delete their own timeslots (including booked ones)
        // Admin can force delete any timeslot
        return ($user->id === $timeslot->provider_id && $user->isServiceProvider())
            || $user->isAdmin();
    }

    /**
     * Determine whether the user can revert a completed timeslot back to booked.
     */
    public function revertCompletion(User $user, Timeslot $timeslot): bool
    {
        if (! $timeslot->is_completed) {
            return false;
        }

        return ($user->id === $timeslot->provider_id && $user->isServiceProvider())
            || $user->isAdmin();
    }

    /**
     * Determine whether the user can mark the timeslot as completed.
     */
    public function complete(User $user, Timeslot $timeslot): bool
    {
        // Timeslot must have a client assigned (status is 'booked')
        if ($timeslot->status !== TimeslotStatus::Booked || ! $timeslot->client_id) {
            return false;
        }

        // Provider can complete their own timeslots
        // Admin can complete any timeslot
        return ($user->id === $timeslot->provider_id && $user->isServiceProvider())
            || $user->isAdmin();
    }

    /**
     * Determine whether the user can update the comment on this timeslot.
     */
    public function updateComment(User $user, Timeslot $timeslot): bool
    {
        // Provider who owns the timeslot
        if ($user->id === $timeslot->provider_id) {
            return true;
        }

        // Client who is assigned to the timeslot
        if ($user->id === $timeslot->client_id) {
            return true;
        }

        return $user->isAdmin();
    }
}
