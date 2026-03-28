<?php

namespace App\Mail;

use App\Models\Invitation;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class ClientInvitation extends Mailable
{

    public function __construct(
        public Invitation $invitation,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'You\'ve been invited to '.config('app.name'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.client-invitation',
        );
    }
}
