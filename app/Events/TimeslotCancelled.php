<?php

namespace App\Events;

use App\Models\Timeslot;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TimeslotCancelled
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Timeslot $timeslot,
        public User $client,
    ) {}
}
