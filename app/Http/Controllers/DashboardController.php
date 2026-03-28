<?php

namespace App\Http\Controllers;

use App\Enums\TimeslotStatus;
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

        $todayCounts = Timeslot::forProvider($user->id)
            ->whereBetween('start_time', [$today, $todayEnd])
            ->selectRaw("COUNT(*) as total, SUM(status = 'booked') as booked")
            ->first();

        $nextAppointment = Timeslot::forProvider($user->id)
            ->where('status', TimeslotStatus::Booked)
            ->where('start_time', '>', now())
            ->with('client:id,name,email')
            ->orderBy('start_time')
            ->first();

        $weekCounts = Timeslot::forProvider($user->id)
            ->whereBetween('start_time', [now(), $weekEnd])
            ->selectRaw("SUM(status = 'available' AND start_time > ?) as available_count, SUM(status = 'booked') as booked_count", [now()])
            ->first();

        $totalClients = $user->clients()->count();

        $yearAgo = now()->subYear()->startOfDay();
        $completedDaily = Timeslot::forProvider($user->id)
            ->completed()
            ->where('start_time', '>=', $yearAgo)
            ->selectRaw('DATE(start_time) as date, COUNT(*) as count')
            ->groupByRaw('DATE(start_time)')
            ->pluck('count', 'date')
            ->toArray();

        $completedCount = (int) array_sum($completedDaily) ?: Timeslot::forProvider($user->id)->completed()->count();

        return [
            'role' => 'service_provider',
            'today_total' => (int) $todayCounts->total,
            'today_booked' => (int) $todayCounts->booked,
            'available_this_week' => (int) $weekCounts->available_count,
            'booked_this_week' => (int) $weekCounts->booked_count,
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
            ->where('status', TimeslotStatus::Booked)
            ->where('start_time', '>', now())
            ->with('provider:id,name,email')
            ->orderBy('start_time')
            ->first();

        $counts = Timeslot::forClient($user->id)
            ->selectRaw("SUM(status = 'booked' AND start_time > ?) as upcoming_count, SUM(status = 'completed') as completed_count", [now()])
            ->first();

        $providerCount = $user->providers()->count();

        return [
            'role' => 'client',
            'upcoming_count' => (int) $counts->upcoming_count,
            'completed_count' => (int) $counts->completed_count,
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
        $roleTable = config('permission.table_names.roles', 'roles');
        $modelHasRoles = config('permission.table_names.model_has_roles', 'model_has_roles');

        $roleCounts = User::join($modelHasRoles, 'users.id', '=', "{$modelHasRoles}.model_id")
            ->join($roleTable, "{$modelHasRoles}.role_id", '=', "{$roleTable}.id")
            ->where("{$modelHasRoles}.model_type", User::class)
            ->selectRaw("SUM({$roleTable}.name = 'service_provider') as providers, SUM({$roleTable}.name = 'client') as clients")
            ->first();

        $timeslotCounts = Timeslot::selectRaw("SUM(status = 'booked') as active_bookings, SUM(status = 'available' AND start_time > ?) as available_slots, SUM(status = 'completed' AND DATE(updated_at) = DATE(?)) as completed_today", [now(), now()])
            ->first();

        return [
            'role' => 'admin',
            'total_users' => User::count(),
            'total_providers' => (int) $roleCounts?->providers,
            'total_clients' => (int) $roleCounts?->clients,
            'active_bookings' => (int) $timeslotCounts->active_bookings,
            'available_slots' => (int) $timeslotCounts->available_slots,
            'completed_today' => (int) $timeslotCounts->completed_today,
        ];
    }
}
