<?php

namespace Database\Seeders;

use App\Models\Booking;
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

                $timeslot = Timeslot::create([
                    'provider_id' => $provider->id,
                    'start_time' => $startTime,
                    'duration_minutes' => $duration,
                ]);

                // Book 50% of timeslots
                if (rand(0, 1) === 1 && $clients->isNotEmpty()) {
                    $client = $clients->random();
                    
                    Booking::create([
                        'timeslot_id' => $timeslot->id,
                        'client_id' => $client->id,
                        'status' => rand(0, 4) === 0 ? 'cancelled' : 'confirmed', // 20% cancelled
                    ]);
                }
            }

            $this->command->info("Created 10 timeslots for {$provider->name}");
        }

        $totalTimeslots = Timeslot::count();
        $totalBookings = Booking::count();
        $confirmedBookings = Booking::where('status', 'confirmed')->count();
        $cancelledBookings = Booking::where('status', 'cancelled')->count();

        $this->command->info("\nSeeding completed successfully!");
        $this->command->info("Total Timeslots: {$totalTimeslots}");
        $this->command->info("Total Bookings: {$totalBookings}");
        $this->command->info("  - Confirmed: {$confirmedBookings}");
        $this->command->info("  - Cancelled: {$cancelledBookings}");
        $this->command->info("Available Timeslots: " . ($totalTimeslots - $totalBookings));
    }
}
