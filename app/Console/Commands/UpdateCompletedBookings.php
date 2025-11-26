<?php

namespace App\Console\Commands;

use App\Models\Timeslot;
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
    protected $description = 'Mark past booked timeslots as completed automatically';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Updating completed timeslots...');

        // Find booked timeslots where the end time has passed
        // end_time is calculated as: start_time + duration_minutes
        $count = Timeslot::where('status', 'booked')
            ->whereRaw('DATE_ADD(start_time, INTERVAL duration_minutes MINUTE) < ?', [now()])
            ->update(['status' => 'completed']);

        $this->info("Updated {$count} timeslot(s) to completed status");

        return Command::SUCCESS;
    }
}
