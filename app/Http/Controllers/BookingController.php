<?php

namespace App\Http\Controllers;

use App\Http\Requests\BookTimeslotRequest;
use App\Models\Booking;
use App\Models\Timeslot;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of the authenticated user's bookings.
     */
    public function index(Request $request): Response
    {
        $query = Booking::with('timeslot.provider')
            ->forClient(auth()->id())
            ->orderBy('created_at', 'desc');

        // Filter by status if specified
        if ($request->status === 'confirmed') {
            $query->confirmed();
        } elseif ($request->status === 'cancelled') {
            $query->cancelled();
        } elseif ($request->status === 'completed') {
            $query->completed();
        }

        return Inertia::render('Bookings/Index', [
            'bookings' => $query->get(),
            'filters' => $request->only('status'),
        ]);
    }

    /**
     * Store a newly created booking in storage.
     */
    public function store(BookTimeslotRequest $request): RedirectResponse
    {
        $this->authorize('create', Booking::class);

        try {
            DB::transaction(function () use ($request) {
                // Lock the timeslot row to prevent race conditions
                $timeslot = Timeslot::where('id', $request->timeslot_id)
                    ->whereDoesntHave('booking', fn($q) => $q->where('status', 'confirmed'))
                    ->where('start_time', '>', now())
                    ->lockForUpdate()
                    ->firstOrFail();

                // Validate that client is linked to the timeslot's provider
                $user = auth()->user();
                if ($user->isClient() && !$user->hasProvider($timeslot->provider_id)) {
                    throw new \Exception('You must be linked to this provider to book their timeslots.');
                }

                Booking::create([
                    'timeslot_id' => $request->timeslot_id,
                    'client_id' => auth()->id(),
                    'status' => 'confirmed',
                ]);
            });

            return redirect()->route('bookings.index')
                ->with('success', 'Timeslot booked successfully!');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', $e->getMessage() ?: 'Unable to book this timeslot. It may have already been booked.');
        }
    }

    /**
     * Remove the specified booking from storage (cancel booking).
     */
    public function destroy(Booking $booking): RedirectResponse
    {
        $this->authorize('delete', $booking);

        $booking->cancel();

        return redirect()->route('bookings.index')
            ->with('success', 'Booking cancelled successfully.');
    }
}
