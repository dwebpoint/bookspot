<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreContactRequest;
use App\Mail\ContactForm;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class ContactController extends Controller
{
    public function show()
    {
        return Inertia::render('contact');
    }

    public function store(StoreContactRequest $request)
    {
        $validated = $request->validated();

        Mail::to(config('mail.from.address'))
            ->send(new ContactForm(
                visitorName: $validated['name'],
                visitorEmail: $validated['email'],
                subject: $validated['subject'],
                message: $validated['message'],
            ));

        return redirect()->route('contact.show')->with('flash', [
            'success' => 'Thank you for contacting us! We\'ll get back to you soon.',
        ]);
    }
}
