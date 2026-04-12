<?php

namespace App\Listeners;

use App\Events\TimeslotBooked;
use App\Events\TimeslotCancelled;
use App\Notifications\TimeslotBookedNotification;
use App\Notifications\TimeslotCancelledNotification;
use Illuminate\Events\Dispatcher;

class SendTimeslotNotifications
{
    public function onTimeslotBooked(TimeslotBooked $event): void
    {
        $event->timeslot->loadMissing('provider');

        $event->timeslot->provider->notify(
            new TimeslotBookedNotification($event->timeslot, $event->client)
        );
    }

    public function onTimeslotCancelled(TimeslotCancelled $event): void
    {
        $event->timeslot->loadMissing('provider');

        $event->timeslot->provider->notify(
            new TimeslotCancelledNotification($event->timeslot, $event->client)
        );
    }

    public function subscribe(Dispatcher $events): array
    {
        return [
            TimeslotBooked::class => 'onTimeslotBooked',
            TimeslotCancelled::class => 'onTimeslotCancelled',
        ];
    }
}
