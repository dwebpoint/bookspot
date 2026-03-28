<?php

namespace App\Listeners;

use App\Events\TimeslotBooked;
use App\Events\TimeslotCancelled;
use App\Mail\TimeslotBooked as TimeslotBookedMail;
use App\Mail\TimeslotCancelled as TimeslotCancelledMail;
use Illuminate\Events\Dispatcher;
use Illuminate\Support\Facades\Mail;

class SendTimeslotNotifications
{
    public function onTimeslotBooked(TimeslotBooked $event): void
    {
        $event->timeslot->loadMissing('provider');

        if (! $event->timeslot->provider->email_notifications_enabled) {
            return;
        }

        Mail::to($event->timeslot->provider)
            ->send(new TimeslotBookedMail($event->timeslot, $event->client));
    }

    public function onTimeslotCancelled(TimeslotCancelled $event): void
    {
        $event->timeslot->loadMissing('provider');

        if (! $event->timeslot->provider->email_notifications_enabled) {
            return;
        }

        Mail::to($event->timeslot->provider)
            ->send(new TimeslotCancelledMail($event->timeslot, $event->client));
    }

    public function subscribe(Dispatcher $events): array
    {
        return [
            TimeslotBooked::class => 'onTimeslotBooked',
            TimeslotCancelled::class => 'onTimeslotCancelled',
        ];
    }
}
