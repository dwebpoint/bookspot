<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreContactRequest;
use App\Mail\ContactForm;
use App\Models\SiteSettings;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class ContactController extends Controller
{
    public function show()
    {
        return Inertia::render('contact', [
            'contactEmail' => SiteSettings::get(SiteSettings::CONTACT_EMAIL),
        ]);
    }

    public function store(StoreContactRequest $request)
    {
        $validated = $request->validated();

        $contactEmail = SiteSettings::get(SiteSettings::CONTACT_EMAIL) ?: config('mail.from.address');

        Mail::to($contactEmail)
            ->send(new ContactForm(
                visitorName: $validated['name'],
                visitorEmail: $validated['email'],
                contactSubject: $validated['subject'],
                contactMessage: $validated['message'],
            ));

        return redirect()->route('contact.show')->with('flash', [
            'success' => 'Thank you for contacting us! We\'ll get back to you soon.',
        ]);
    }
}
