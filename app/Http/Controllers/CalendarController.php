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
        
        // Date range: yesterday to +14 days (16 days total)
        $startDate = now()->subDay()->startOfDay();
        $endDate = now()->addDays(14)->endOfDay();
        
        $user = auth()->user();
        
        // Build query for timeslots
        $query = Timeslot::with(['provider:id,name', 'booking.client:id,name'])
            ->whereBetween('start_time', [$startDate, $endDate]);
        
        // For clients: only show timeslots from their linked providers
        if ($user->isClient()) {
            $providerIds = $user->providers()->pluck('users.id');
            
            if ($providerIds->isEmpty()) {
                // Client has no linked providers, show no timeslots
                $timeslots = collect();
                $providers = collect();
            } else {
                // Apply optional provider filter
                if ($providerId && $providerIds->contains($providerId)) {
                    $query->where('provider_id', $providerId);
                } else {
                    $query->whereIn('provider_id', $providerIds);
                }
                
                $timeslots = $query->orderBy('start_time')->get();
                
                // Get client's linked providers for filter dropdown
                $providers = $user->providers()
                    ->select('users.id', 'users.name')
                    ->get();
            }
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
