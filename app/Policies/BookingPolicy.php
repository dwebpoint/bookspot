<?php

namespace App\Policies;

use App\Models\Booking;
use App\Models\User;

class BookingPolicy
{
    /**
     * Determine whether the user can view any bookings.
     */
    public function viewAny(User $user): bool
    {
        return true; // Authenticated users can view their own bookings
    }

    /**
     * Determine whether the user can view the booking.
     */
    public function view(User $user, Booking $booking): bool
    {
        return $user->id === $booking->client_id
            || $user->id === $booking->timeslot->provider_id
            || $user->isAdmin();
    }

    /**
     * Determine whether the user can create bookings.
     */
    public function create(User $user): bool
    {
        return $user->can('create bookings') || $user->isClient() || $user->isAdmin();
    }

    /**
     * Determine whether the user can delete (cancel) the booking.
     */
    public function delete(User $user, Booking $booking): bool
    {
        return $user->can('cancel bookings') && 
               ($user->id === $booking->client_id ||
                $user->id === $booking->timeslot->provider_id ||
                $user->isAdmin());
    }
}
