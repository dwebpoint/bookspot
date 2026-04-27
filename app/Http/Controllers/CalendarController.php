<?php

namespace App\Http\Controllers;

use App\Enums\TimeslotStatus;
use App\Models\Timeslot;
use App\Models\User;
use Carbon\CarbonInterface;
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
        $weekOffset = (int) $request->input('week', 0); // Week offset from current week

        $user = auth()->user();

        // Date range: single week (Monday to Sunday) based on offset
        $currentWeekStart = now()->startOfWeek(CarbonInterface::MONDAY);
        $startDate = $currentWeekStart->copy()->addWeeks($weekOffset);
        $endDate = $startDate->copy()->endOfWeek(CarbonInterface::SUNDAY)->endOfDay();

        // Build query for timeslots
        $query = Timeslot::with(['provider:id,name', 'client:id,name'])
            ->whereBetween('start_time', [$startDate, $endDate]);

        // For clients: show timeslots from their linked providers + their own bookings
        if ($user->isClient()) {
            $providerIds = $user->providers()->pluck('users.id');

            $clientQuery = clone $query;
            $clientQuery->where(function ($q) use ($user, $providerIds, $providerId) {
                // Timeslots from linked providers
                if ($providerIds->isNotEmpty()) {
                    $q->where(function ($sub) use ($providerIds, $providerId) {
                        if ($providerId && $providerIds->contains($providerId)) {
                            $sub->where('provider_id', $providerId);
                        } else {
                            $sub->whereIn('provider_id', $providerIds);
                        }
                    });
                }

                // OR client's own bookings (regardless of provider linkage)
                $q->orWhere(function ($sub) use ($user, $providerId) {
                    $sub->where('client_id', $user->id);
                    if ($providerId) {
                        $sub->where('provider_id', $providerId);
                    }
                });
            });

            $timeslots = $clientQuery->orderBy('start_time')->get();

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
        if ($user->isServiceProvider()) {
            $clients = $user->clients()
                ->select('users.id', 'users.name')
                ->orderBy('users.name')
                ->get();
        } elseif ($user->isAdmin()) {
            $clients = User::role('client')
                ->select('id', 'name')
                ->orderBy('name')
                ->get();
        }

        // For clients: flash the nearest upcoming booking (within 3 days)
        if ($user->isClient()) {
            $upcomingBooking = Timeslot::with('provider')
                ->where('client_id', $user->id)
                ->where('status', TimeslotStatus::Booked)
                ->whereBetween('start_time', [now(), now()->addDays(3)])
                ->orderBy('start_time')
                ->first();

            if ($upcomingBooking) {
                session()->flash('info', sprintf(
                    'Upcoming appointment with %s on %s at %s',
                    $upcomingBooking->provider->name,
                    $upcomingBooking->start_time->format('d M Y'),
                    $upcomingBooking->start_time->format('g:i A')
                ));
            }
        }

        return Inertia::render('Calendar/Index', [
            'timeslots' => $timeslots,
            'startDate' => $startDate->format('Y-m-d'),
            'endDate' => $endDate->format('Y-m-d'),
            'weekOffset' => $weekOffset,
            'providers' => $providers,
            'selectedProviderId' => $providerId,
            'clients' => $clients,
        ]);
    }
}
