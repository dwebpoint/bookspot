<?php

namespace App\Http\Controllers\Provider;

use App\Enums\TimeslotStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Provider\AssignClientRequest;
use App\Http\Requests\StoreTimeslotRequest;
use App\Http\Requests\UpdateTimeslotRequest;
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

        $validated = $request->validated();

        Timeslot::create(array_merge($validated, [
            'provider_id' => auth()->id(),
            'status' => isset($validated['client_id']) ? TimeslotStatus::Booked : TimeslotStatus::Available,
        ]));

        $message = isset($validated['client_id'])
            ? 'Timeslot created and assigned to client successfully.'
            : 'Timeslot created successfully.';

        return back()->with('success', $message);
    }

    /**
     * Update the specified timeslot in storage.
     */
    public function update(UpdateTimeslotRequest $request, Timeslot $timeslot): RedirectResponse
    {
        $this->authorize('update', $timeslot);

        if ($timeslot->is_completed) {
            return back()->with('error', 'Completed timeslots cannot be updated.');
        }

        $timeslot->update($request->validated());

        return back()->with('success', 'Timeslot updated successfully.');
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

        if (! $timeslot->is_available && ! $timeslot->is_booked && ! $timeslot->is_completed) {
            return back()->with('error', 'This timeslot cannot be assigned.');
        }

        $wasAlreadyAssigned = $timeslot->is_booked || ($timeslot->is_completed && $timeslot->client_id !== null);
        $clientId = $request->validated()['client_id'];

        if ($timeslot->is_completed) {
            // Preserve completed status — only update the assigned client.
            $timeslot->update(['client_id' => $clientId]);
        } else {
            $timeslot->book($clientId);
        }

        $message = $wasAlreadyAssigned ? 'Client reassigned to timeslot successfully.' : 'Client assigned to timeslot successfully.';

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
