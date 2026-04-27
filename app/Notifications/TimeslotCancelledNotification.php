<?php

namespace App\Notifications;

use App\Mail\TimeslotCancelled as TimeslotCancelledMail;
use App\Models\Timeslot;
use App\Models\User;
use Illuminate\Notifications\Notification;

class TimeslotCancelledNotification extends Notification
{
    public function __construct(
        public Timeslot $timeslot,
        public User $client,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database'];

        if ($notifiable->email_notifications_enabled) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public function toMail(object $notifiable): TimeslotCancelledMail
    {
        return (new TimeslotCancelledMail($this->timeslot, $this->client))->to($notifiable->email);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'timeslot_id' => $this->timeslot->id,
            'timeslot_start_time' => $this->timeslot->start_time->toIso8601String(),
            'timeslot_duration_minutes' => $this->timeslot->duration_minutes,
            'client_id' => $this->client->id,
            'client_name' => $this->client->name,
            'client_email' => $this->client->email,
            'action' => 'cancelled',
        ];
    }
}
