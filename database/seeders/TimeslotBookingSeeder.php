<?php

namespace Database\Seeders;

use App\Models\Timeslot;
use App\Models\User;
use Illuminate\Database\Seeder;

class TimeslotBookingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all service providers
        $providers = User::where('role', 'service_provider')->get();

        if ($providers->isEmpty()) {
            $this->command->warn('No service providers found. Run RoleSeeder first.');
            return;
        }

        // Get all clients
        $clients = User::where('role', 'client')->get();

        if ($clients->isEmpty()) {
            $this->command->warn('No clients found. Run RoleSeeder first.');
            return;
        }

        $this->command->info('Creating timeslots and bookings...');

        foreach ($providers as $provider) {
            // Create 10 timeslots for each provider
            for ($i = 0; $i < 10; $i++) {
                $startTime = now()->addDays(rand(1, 30))->setHour(rand(9, 17))->setMinute(rand(0, 1) * 30);
                $duration = [30, 60, 90, 120][rand(0, 3)];

                // Determine if this timeslot should be booked
                $shouldBook = rand(0, 1) === 1 && $clients->isNotEmpty();

                $timeslotData = [
                    'provider_id' => $provider->id,
                    'start_time' => $startTime,
                    'duration_minutes' => $duration,
                    'status' => 'available',
                ];

                // Book 50% of timeslots
                if ($shouldBook) {
                    $client = $clients->random();
                    $timeslotData['client_id'] = $client->id;
                    $timeslotData['status'] = rand(0, 4) === 0 ? 'cancelled' : 'booked'; // 20% cancelled
                }

                Timeslot::create($timeslotData);
            }

            $this->command->info("Created 10 timeslots for {$provider->name}");
        }

        $totalTimeslots = Timeslot::count();
        $bookedTimeslots = Timeslot::where('status', 'booked')->count();
        $cancelledTimeslots = Timeslot::where('status', 'cancelled')->count();
        $availableTimeslots = Timeslot::where('status', 'available')->count();

        $this->command->info("\nSeeding completed successfully!");
        $this->command->info("Total Timeslots: {$totalTimeslots}");
        $this->command->info("  - Available: {$availableTimeslots}");
        $this->command->info("  - Booked: {$bookedTimeslots}");
        $this->command->info("  - Cancelled: {$cancelledTimeslots}");
    }
}
