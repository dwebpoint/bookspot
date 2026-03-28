<?php

namespace App\Enums;

enum TimeslotStatus: string
{
    case Available = 'available';
    case Booked = 'booked';
    case Completed = 'completed';
}
