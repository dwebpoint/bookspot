<?php

namespace App\Http\Controllers;

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
        $user = auth()->user();

        // For service providers: show their timeslots that are booked
        if ($user->isServiceProvider()) {
            $query = Timeslot::with('client')
                ->forProvider($user->id)
                ->whereNotNull('client_id')
                ->orderBy('start_time', 'desc');
        } else {
            // For clients: show their bookings
            $query = Timeslot::with('provider')
                ->forClient($user->id)
                ->orderBy('start_time', 'desc');
        }

        // Filter by status if specified
        if ($request->status === 'booked') {
            $query->booked();
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
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'timeslot_id' => 'required|exists:timeslots,id',
        ]);

        try {
            DB::transaction(function () use ($request) {
                // Lock the timeslot row to prevent race conditions
                $timeslot = Timeslot::where('id', $request->timeslot_id)
                    ->where('status', 'available')
                    ->where('start_time', '>', now())
                    ->lockForUpdate()
                    ->firstOrFail();

                // Authorize booking
                $this->authorize('book', $timeslot);

                // Book the timeslot
                $timeslot->book(auth()->id());
            });

            return redirect()->route('bookings.index')
                ->with('success', 'Timeslot booked successfully!');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', $e->getMessage() ?: 'Unable to book this timeslot. It may have already been booked.');
        }
    }

    /**
     * Cancel the specified booking (timeslot).
     */
    public function destroy(Timeslot $timeslot): RedirectResponse
    {
        $this->authorize('cancelBooking', $timeslot);

        $timeslot->cancel();

        return redirect()->route('bookings.index')
            ->with('success', 'Booking cancelled successfully.');
    }
}
