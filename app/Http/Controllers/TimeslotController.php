<?php

namespace App\Http\Controllers;

use App\Models\Timeslot;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TimeslotController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of timeslots based on user role.
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();

        // Build query based on user role
        if ($user->hasRole('admin')) {
            // Admins see all timeslots
            $query = Timeslot::with(['provider', 'client']);

            // Get all users for potential filters (optional for admin)
            $clients = collect();
        } elseif ($user->isServiceProvider()) {
            // Service providers see ALL their timeslots
            $query = Timeslot::with('client')
                ->forProvider($user->id);

            // Get provider's clients for filter dropdown
            $clients = $user->clients()
                ->select('users.id', 'users.name')
                ->orderBy('users.name')
                ->get();
        } else {
            // Clients see their bookings
            $query = Timeslot::with('provider')
                ->forClient($user->id);

            $clients = collect();
        }

        // Filter by status if specified
        if ($request->filled('status')) {
            $status = $request->status;
            if ($status === 'available') {
                $query->available();
            } elseif ($status === 'booked') {
                $query->booked();
            } elseif ($status === 'cancelled') {
                $query->cancelled();
            } elseif ($status === 'completed') {
                $query->completed();
            }
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

        // Order and paginate
        $query->latest('start_time');

        return Inertia::render('Timeslots/Index', [
            'timeslots' => $query->paginate(50),
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

            return redirect()->back()
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

        return redirect()->back()
            ->with('success', 'Booking cancelled successfully. Timeslot is now available.');
    }

    /**
     * Delete the specified timeslot (service provider only).
     */
    public function forceDelete(Timeslot $timeslot): RedirectResponse
    {
        $this->authorize('forceDelete', $timeslot);

        $timeslot->delete();

        return redirect()->back()
            ->with('success', 'Timeslot deleted successfully.');
    }

    /**
     * Mark the specified timeslot as completed (service provider only).
     */
    public function complete(Timeslot $timeslot): RedirectResponse
    {
        $this->authorize('complete', $timeslot);

        $timeslot->complete();

        return redirect()->back()
            ->with('success', 'Timeslot marked as completed successfully.');
    }
}
