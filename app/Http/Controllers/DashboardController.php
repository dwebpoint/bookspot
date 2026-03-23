<?php

namespace App\Http\Controllers;

use App\Models\Timeslot;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();

        $stats = match (true) {
            $user->isServiceProvider() => $this->providerStats($user),
            $user->isClient() => $this->clientStats($user),
            default => $this->adminStats(),
        };

        return Inertia::render('dashboard', [
            'stats' => $stats,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function providerStats(User $user): array
    {
        $today = now()->startOfDay();
        $todayEnd = now()->endOfDay();
        $weekEnd = now()->endOfWeek();

        $todaySlots = Timeslot::forProvider($user->id)
            ->whereBetween('start_time', [$today, $todayEnd])
            ->get();

        $nextAppointment = Timeslot::forProvider($user->id)
            ->where('status', 'booked')
            ->where('start_time', '>', now())
            ->with('client:id,name,email')
            ->orderBy('start_time')
            ->first();

        $availableThisWeek = Timeslot::forProvider($user->id)
            ->available()
            ->whereBetween('start_time', [now(), $weekEnd])
            ->count();

        $bookedThisWeek = Timeslot::forProvider($user->id)
            ->booked()
            ->whereBetween('start_time', [now(), $weekEnd])
            ->count();

        $totalClients = $user->clients()->count();

        $yearAgo = now()->subYear()->startOfDay();
        $completedDaily = Timeslot::forProvider($user->id)
            ->completed()
            ->where('start_time', '>=', $yearAgo)
            ->selectRaw('DATE(start_time) as date, COUNT(*) as count')
            ->groupByRaw('DATE(start_time)')
            ->pluck('count', 'date')
            ->toArray();

        $completedCount = Timeslot::forProvider($user->id)->completed()->count();

        return [
            'role' => 'service_provider',
            'today_total' => $todaySlots->count(),
            'today_booked' => $todaySlots->where('status', 'booked')->count(),
            'available_this_week' => $availableThisWeek,
            'booked_this_week' => $bookedThisWeek,
            'total_clients' => $totalClients,
            'completed_count' => $completedCount,
            'completed_heatmap' => $completedDaily,
            'next_appointment' => $nextAppointment ? [
                'id' => $nextAppointment->id,
                'start_time' => $nextAppointment->start_time,
                'end_time' => $nextAppointment->end_time,
                'duration_minutes' => $nextAppointment->duration_minutes,
                'client' => $nextAppointment->client,
            ] : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function clientStats(User $user): array
    {
        $nextAppointment = Timeslot::forClient($user->id)
            ->where('status', 'booked')
            ->where('start_time', '>', now())
            ->with('provider:id,name,email')
            ->orderBy('start_time')
            ->first();

        $upcomingCount = Timeslot::forClient($user->id)
            ->where('status', 'booked')
            ->where('start_time', '>', now())
            ->count();

        $completedCount = Timeslot::forClient($user->id)
            ->where('status', 'completed')
            ->count();

        $providerCount = $user->providers()->count();

        return [
            'role' => 'client',
            'upcoming_count' => $upcomingCount,
            'completed_count' => $completedCount,
            'provider_count' => $providerCount,
            'next_appointment' => $nextAppointment ? [
                'id' => $nextAppointment->id,
                'start_time' => $nextAppointment->start_time,
                'end_time' => $nextAppointment->end_time,
                'duration_minutes' => $nextAppointment->duration_minutes,
                'provider' => $nextAppointment->provider,
            ] : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function adminStats(): array
    {
        $totalUsers = User::count();
        $totalProviders = User::where('role', 'service_provider')->count();
        $totalClients = User::where('role', 'client')->count();
        $activeBookings = Timeslot::where('status', 'booked')->count();
        $availableSlots = Timeslot::available()->count();
        $completedToday = Timeslot::where('status', 'completed')
            ->whereDate('updated_at', today())
            ->count();

        return [
            'role' => 'admin',
            'total_users' => $totalUsers,
            'total_providers' => $totalProviders,
            'total_clients' => $totalClients,
            'active_bookings' => $activeBookings,
            'available_slots' => $availableSlots,
            'completed_today' => $completedToday,
        ];
    }
}
