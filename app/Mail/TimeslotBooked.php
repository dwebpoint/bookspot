<?php

namespace App\Mail;

use App\Models\Timeslot;
use App\Models\User;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TimeslotBooked extends Mailable
{
    use SerializesModels;

    public function __construct(
        public Timeslot $timeslot,
        public User $client,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New Booking: '.$this->timeslot->start_time->format('D, d M Y H:i'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.timeslot-booked',
        );
    }
}
