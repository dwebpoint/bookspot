<?php

namespace App\Http\Controllers;

use App\Models\Timeslot;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CalendarController extends Controller
{
    /**
     * Display the calendar view with timeslots.
     */
    public function index(Request $request): Response
    {
        $providerId = $request->input('provider_id'); // Optional provider filter

        $user = auth()->user();

        // Date range varies by role
        // Clients: from current time onwards (future only)
        // Providers/Admins: yesterday to +14 days (for management)
        if ($user->isClient()) {
            $startDate = now(); // Current time for clients
            $endDate = now()->addDays(14)->endOfDay();
        } else {
            $startDate = now()->subDay()->startOfDay();
            $endDate = now()->addDays(14)->endOfDay();
        }
        
        // Build query for timeslots
        $query = Timeslot::with(['provider:id,name', 'client:id,name'])
            ->whereBetween('start_time', [$startDate, $endDate]);
        
        // For clients: show timeslots from their linked providers + their own bookings
        if ($user->isClient()) {
            $providerIds = $user->providers()->pluck('users.id');

            // Get timeslots from linked providers
            $linkedTimeslots = collect();
            if ($providerIds->isNotEmpty()) {
                $linkedQuery = clone $query;

                // Apply optional provider filter
                if ($providerId && $providerIds->contains($providerId)) {
                    $linkedQuery->where('provider_id', $providerId);
                } else {
                    $linkedQuery->whereIn('provider_id', $providerIds);
                }

                $linkedTimeslots = $linkedQuery->orderBy('start_time')->get();
            }

            // Get client's own bookings (regardless of provider linkage)
            $ownBookingsQuery = Timeslot::with(['provider:id,name', 'client:id,name'])
                ->whereBetween('start_time', [$startDate, $endDate])
                ->where('client_id', $user->id)
                ->orderBy('start_time');

            // Apply provider filter to own bookings if selected
            if ($providerId) {
                $ownBookingsQuery->where('provider_id', $providerId);
            }

            $ownBookings = $ownBookingsQuery->get();

            // Merge and deduplicate timeslots
            $timeslots = $linkedTimeslots->merge($ownBookings)->unique('id')->sortBy('start_time')->values();

            // Get client's linked providers for filter dropdown
            $providers = $user->providers()
                ->select('users.id', 'users.name')
                ->get();
        } elseif ($user->isServiceProvider()) {
            // For service providers: show only their own timeslots
            $timeslots = $query->where('provider_id', $user->id)
                ->orderBy('start_time')
                ->get();
            $providers = collect();
        } else {
            // For admins: show all timeslots
            $timeslots = $query->orderBy('start_time')->get();
            $providers = collect();
        }
        
        // Get provider's clients for client selector (service providers and admins)
        $clients = collect();
        if ($user->role === 'service_provider') {
            $clients = $user->clients()
                ->select('users.id', 'users.name')
                ->orderBy('users.name')
                ->get();
        } elseif ($user->role === 'admin') {
            $clients = User::where('role', 'client')
                ->select('id', 'name')
                ->orderBy('name')
                ->get();
        }
        
        // For clients: show flash messages for upcoming bookings (within 3 days)
        if ($user->isClient()) {
            $upcomingBookings = Timeslot::with('provider')
                ->where('client_id', $user->id)
                ->where('status', 'booked')
                ->whereBetween('start_time', [now(), now()->addDays(3)])
                ->orderBy('start_time')
                ->get();

            foreach ($upcomingBookings as $timeslot) {
                $message = sprintf(
                    'Upcoming appointment with %s on %s at %s',
                    $timeslot->provider->name,
                    $timeslot->start_time->format('M d, Y'),
                    $timeslot->start_time->format('g:i A')
                );
                session()->flash('info', $message);
            }
        }

        return Inertia::render('Calendar/Index', [
            'timeslots' => $timeslots,
            'startDate' => $startDate->format('Y-m-d'),
            'endDate' => $endDate->format('Y-m-d'),
            'providers' => $providers,
            'selectedProviderId' => $providerId,
            'clients' => $clients,
        ]);
    }
}
