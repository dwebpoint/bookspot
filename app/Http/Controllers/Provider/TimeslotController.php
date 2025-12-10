<?php

namespace App\Http\Controllers\Provider;

use App\Http\Controllers\Controller;
use App\Http\Requests\Provider\AssignClientRequest;
use App\Http\Requests\StoreTimeslotRequest;
use App\Models\Timeslot;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;

class TimeslotController extends Controller
{
    use AuthorizesRequests;

    /**
     * Store a newly created timeslot in storage.
     */
    public function store(StoreTimeslotRequest $request): RedirectResponse
    {
        $this->authorize('create', Timeslot::class);

        $data = [
            'provider_id' => auth()->id(),
            'start_time' => $request->start_time,
            'duration_minutes' => $request->duration_minutes,
        ];

        // If client_id is provided, assign immediately
        if ($request->filled('client_id')) {
            $data['client_id'] = $request->client_id;
            $data['status'] = 'booked';
        } else {
            $data['status'] = 'available';
        }

        Timeslot::create($data);

        $message = $request->filled('client_id')
            ? 'Timeslot created and assigned to client successfully.'
            : 'Timeslot created successfully.';

        return back()->with('success', $message);
    }

    /**
     * Remove the specified timeslot from storage.
     * Service providers can only delete available or cancelled timeslots.
     * For deleting booked timeslots, use the forceDelete route.
     */
    public function destroy(Timeslot $timeslot): RedirectResponse
    {
        $this->authorize('delete', $timeslot);

        $timeslot->delete();

        return back()->with('success', 'Timeslot deleted successfully.');
    }

    /**
     * Assign a client to an available timeslot or reassign to a different client.
     */
    public function assignClient(AssignClientRequest $request, Timeslot $timeslot): RedirectResponse
    {
        $this->authorize('assignClient', $timeslot);

        // Check if timeslot is available or booked (for reassignment)
        if (! $timeslot->is_available && ! $timeslot->is_booked) {
            return back()->with('error', 'This timeslot cannot be assigned.');
        }

        // Validate provider-client relationship
        $provider = auth()->user();
        if (! $provider->hasClient($request->client_id)) {
            return back()->with('error', 'You can only assign clients you are linked to.');
        }

        // Book the timeslot (this will reassign if already booked)
        $timeslot->book($request->client_id);

        $message = $timeslot->wasRecentlyCreated ? 'Client assigned to timeslot successfully.' : 'Client reassigned to timeslot successfully.';

        return back()->with('success', $message);
    }

    /**
     * Remove a client's booking from a timeslot (make it available again).
     */
    public function removeClient(Timeslot $timeslot): RedirectResponse
    {
        $this->authorize('cancelBooking', $timeslot);

        if (! $timeslot->is_booked) {
            return back()->with('error', 'This timeslot has no booking to remove.');
        }

        // Make timeslot available again
        $timeslot->makeAvailable();

        return back()->with('success', 'Client booking removed successfully.');
    }
}
