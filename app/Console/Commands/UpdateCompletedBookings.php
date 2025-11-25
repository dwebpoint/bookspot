<?php

namespace App\Console\Commands;

use App\Models\Booking;
use Illuminate\Console\Command;

class UpdateCompletedBookings extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bookings:update-completed';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Mark past bookings as completed automatically';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Updating completed bookings...');

        // Find confirmed bookings where the timeslot end time has passed
        // end_time is calculated as: start_time + duration_minutes
        $count = Booking::confirmed()
            ->whereHas('timeslot', function ($query) {
                // Calculate end_time as start_time + INTERVAL duration_minutes MINUTE
                $query->whereRaw('DATE_ADD(start_time, INTERVAL duration_minutes MINUTE) < ?', [now()]);
            })
            ->update(['status' => 'completed']);

        $this->info("Updated {$count} booking(s) to completed status");

        return Command::SUCCESS;
    }
}
