<?php

namespace Tests\Feature;

use App\Mail\ContactForm;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ContactTest extends TestCase
{
    public function test_contact_page_is_accessible()
    {
        $response = $this->get('/contact');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('contact'));
    }

    public function test_contact_form_submission_sends_email()
    {
        Mail::fake();

        $response = $this->post('/contact', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'subject' => 'Test Subject',
            'message' => 'This is a test message.',
        ]);

        $response->assertRedirect();
        Mail::assertSent(ContactForm::class);
    }

    public function test_contact_form_requires_all_fields()
    {
        $response = $this->post('/contact', []);

        $response->assertSessionHasErrors(['name', 'email', 'subject', 'message']);
    }

    public function test_contact_form_validates_email_format()
    {
        $response = $this->post('/contact', [
            'name' => 'John Doe',
            'email' => 'invalid-email',
            'subject' => 'Test Subject',
            'message' => 'This is a test message.',
        ]);

        $response->assertSessionHasErrors(['email']);
    }

    public function test_contact_form_validates_message_length()
    {
        $response = $this->post('/contact', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'subject' => 'Test Subject',
            'message' => str_repeat('a', 5001),
        ]);

        $response->assertSessionHasErrors(['message']);
    }
}
