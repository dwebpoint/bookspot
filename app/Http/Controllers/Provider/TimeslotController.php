<?php

namespace App\Http\Controllers\Provider;

use App\Http\Controllers\Controller;
use App\Http\Requests\Provider\AssignClientRequest;
use App\Http\Requests\StoreTimeslotRequest;
use App\Models\Booking;
use App\Models\Timeslot;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TimeslotController extends Controller
{
    use AuthorizesRequests;
    /**
     * Display a listing of the provider's timeslots.
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Timeslot::class);

        $query = Timeslot::with('booking.client')
            ->forProvider(auth()->id())
            ->future()
            ->orderBy('start_time');

        // Filter by status if specified
        if ($request->status === 'available') {
            $query->available();
        } elseif ($request->status === 'booked') {
            $query->whereHas('booking', fn($q) => $q->where('status', 'confirmed'));
        }

        // Filter by date if specified
        if ($request->date) {
            $query->whereDate('start_time', $request->date);
        }

        // Filter by client if specified
        if ($request->client_id) {
            $query->whereHas('booking', fn($q) => $q->where('client_id', $request->client_id));
        }

        // Get provider's clients for filter dropdown
        $clients = auth()->user()->clients()
            ->select('users.id', 'users.name')
            ->orderBy('users.name')
            ->get();

        return Inertia::render('Provider/Timeslots/Index', [
            'timeslots' => $query->get(),
            'filters' => $request->only(['status', 'date', 'client_id']),
            'clients' => $clients,
        ]);
    }

    /**
     * Show the form for creating a new timeslot.
     */
    public function create(): Response
    {
        $this->authorize('create', Timeslot::class);

        return Inertia::render('Provider/Timeslots/Create');
    }

    /**
     * Store a newly created timeslot in storage.
     */
    public function store(StoreTimeslotRequest $request): RedirectResponse
    {
        $this->authorize('create', Timeslot::class);

        Timeslot::create([
            'provider_id' => auth()->id(),
            'start_time' => $request->start_time,
            'duration_minutes' => $request->duration_minutes,
        ]);

        return redirect()->route('provider.timeslots.index')
            ->with('success', 'Timeslot created successfully!');
    }

    /**
     * Remove the specified timeslot from storage.
     */
    public function destroy(Timeslot $timeslot): RedirectResponse
    {
        $this->authorize('delete', $timeslot);

        $timeslot->delete();

        return redirect()->route('provider.timeslots.index')
            ->with('success', 'Timeslot cancelled successfully.');
    }

    /**
     * Assign a client to an available timeslot.
     */
    public function assignClient(AssignClientRequest $request, Timeslot $timeslot): RedirectResponse
    {
        $this->authorize('update', $timeslot);

        // Check if timeslot is already booked
        if ($timeslot->booking) {
            return back()->with('error', 'This timeslot is already booked.');
        }

        // Validate provider-client relationship
        $provider = auth()->user();
        if (!$provider->hasClient($request->client_id)) {
            return back()->with('error', 'You can only assign clients you are linked to.');
        }

        // Create the booking
        Booking::create([
            'timeslot_id' => $timeslot->id,
            'client_id' => $request->client_id,
            'status' => 'confirmed',
        ]);

        return back()->with('success', 'Client assigned to timeslot successfully.');
    }

    /**
     * Remove a client's booking from a timeslot.
     */
    public function removeClient(Timeslot $timeslot): RedirectResponse
    {
        $this->authorize('update', $timeslot);

        if (!$timeslot->booking) {
            return back()->with('error', 'This timeslot has no booking to remove.');
        }

        $timeslot->booking->delete();

        return back()->with('success', 'Client booking removed successfully.');
    }
}
