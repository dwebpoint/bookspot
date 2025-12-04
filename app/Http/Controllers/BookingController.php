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

            // Get provider's clients for filter dropdown
            $clients = $user->clients()
                ->select('users.id', 'users.name')
                ->orderBy('users.name')
                ->get();
        } else {
            // For clients: show their bookings
            $query = Timeslot::with('provider')
                ->forClient($user->id)
                ->orderBy('start_time', 'desc');

            $clients = collect();
        }

        // Filter by status if specified
        if ($request->status === 'booked') {
            $query->booked();
        } elseif ($request->status === 'cancelled') {
            $query->cancelled();
        } elseif ($request->status === 'completed') {
            $query->completed();
        }

        // Filter by date if specified
        if ($request->filled('date')) {
            $date = \Carbon\Carbon::parse($request->date);
            $query->whereDate('start_time', $date);
        }

        // Filter by client (service provider only)
        if ($user->isServiceProvider() && $request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        return Inertia::render('Bookings/Index', [
            'bookings' => $query->get(),
            'filters' => $request->only(['status', 'date', 'client_id']),
            'clients' => $clients,
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
     * Unassigns the client and makes the timeslot available again.
     */
    public function destroy(Timeslot $timeslot): RedirectResponse
    {
        $this->authorize('cancelBooking', $timeslot);

        // Unassign client and make available
        $timeslot->status = 'available';
        $timeslot->client_id = null;
        $timeslot->save();

        return redirect()->route('bookings.index')
            ->with('success', 'Booking cancelled successfully. Timeslot is now available.');
    }

    /**
     * Delete the specified timeslot (service provider only).
     */
    public function forceDelete(Timeslot $timeslot): RedirectResponse
    {
        $this->authorize('forceDelete', $timeslot);

        $timeslot->delete();

        return redirect()->route('bookings.index')
            ->with('success', 'Timeslot deleted successfully.');
    }

    /**
     * Mark the specified timeslot as completed (service provider only).
     */
    public function complete(Timeslot $timeslot): RedirectResponse
    {
        $this->authorize('complete', $timeslot);

        $timeslot->complete();

        return redirect()->route('bookings.index')
            ->with('success', 'Timeslot marked as completed successfully.');
    }
}
