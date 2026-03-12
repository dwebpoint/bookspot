<?php

namespace Tests\Feature;

use App\Events\TimeslotBooked as TimeslotBookedEvent;
use App\Events\TimeslotCancelled as TimeslotCancelledEvent;
use App\Mail\TimeslotBooked as TimeslotBookedMail;
use App\Mail\TimeslotCancelled as TimeslotCancelledMail;
use App\Models\Timeslot;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class TimeslotNotificationTest extends TestCase
{
    use RefreshDatabase;

    protected User $provider;

    protected User $client;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);

        $this->provider = User::factory()->create(['email_notifications_enabled' => false]);
        $this->provider->assignRole('service_provider');

        $this->client = User::factory()->create();
        $this->client->assignRole('client');

        $this->provider->clients()->attach($this->client->id);
    }

    /** @test */
    public function timeslot_booked_event_is_dispatched_when_client_books(): void
    {
        Event::fake();

        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => now()->addDays(3),
            'status' => 'available',
        ]);

        $this->actingAs($this->client)
            ->post(route('timeslots.store'), ['timeslot_id' => $timeslot->id])
            ->assertRedirect();

        Event::assertDispatched(TimeslotBookedEvent::class, function (TimeslotBookedEvent $event) use ($timeslot) {
            return $event->timeslot->id === $timeslot->id
                && $event->client->id === $this->client->id;
        });
    }

    /** @test */
    public function timeslot_cancelled_event_is_dispatched_when_client_cancels(): void
    {
        Event::fake();

        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'client_id' => $this->client->id,
            'start_time' => now()->addDays(3),
            'status' => 'booked',
        ]);

        $this->actingAs($this->client)
            ->delete(route('timeslots.destroy', $timeslot))
            ->assertRedirect();

        Event::assertDispatched(TimeslotCancelledEvent::class, function (TimeslotCancelledEvent $event) use ($timeslot) {
            return $event->timeslot->id === $timeslot->id
                && $event->client->id === $this->client->id;
        });
    }

    /** @test */
    public function subscriber_queues_booking_email_when_provider_has_notifications_enabled(): void
    {
        Mail::fake();

        $this->provider->update(['email_notifications_enabled' => true]);

        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => now()->addDays(3),
            'status' => 'available',
        ]);

        TimeslotBookedEvent::dispatch($timeslot, $this->client);

        Mail::assertQueued(TimeslotBookedMail::class, function (TimeslotBookedMail $mail) use ($timeslot) {
            return $mail->hasTo($this->provider->email)
                && $mail->timeslot->id === $timeslot->id
                && $mail->client->id === $this->client->id;
        });
    }

    /** @test */
    public function subscriber_queues_cancellation_email_when_provider_has_notifications_enabled(): void
    {
        Mail::fake();

        $this->provider->update(['email_notifications_enabled' => true]);

        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'client_id' => $this->client->id,
            'start_time' => now()->addDays(3),
            'status' => 'booked',
        ]);

        TimeslotCancelledEvent::dispatch($timeslot, $this->client);

        Mail::assertQueued(TimeslotCancelledMail::class, function (TimeslotCancelledMail $mail) use ($timeslot) {
            return $mail->hasTo($this->provider->email)
                && $mail->timeslot->id === $timeslot->id
                && $mail->client->id === $this->client->id;
        });
    }

    /** @test */
    public function subscriber_skips_email_when_provider_has_notifications_disabled(): void
    {
        Mail::fake();

        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => now()->addDays(3),
            'status' => 'available',
        ]);

        TimeslotBookedEvent::dispatch($timeslot, $this->client);

        Mail::assertNotQueued(TimeslotBookedMail::class);
    }

    /** @test */
    public function no_event_dispatched_when_booking_fails_due_to_unavailable_timeslot(): void
    {
        Event::fake();

        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'client_id' => $this->client->id,
            'start_time' => now()->addDays(3),
            'status' => 'booked',
        ]);

        $this->actingAs($this->client)
            ->post(route('timeslots.store'), ['timeslot_id' => $timeslot->id])
            ->assertRedirect();

        Event::assertNotDispatched(TimeslotBookedEvent::class);
    }

    /** @test */
    public function no_event_dispatched_when_cancellation_is_unauthorised(): void
    {
        Event::fake();

        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'client_id' => $this->client->id,
            'start_time' => now()->subDays(2),
            'status' => 'booked',
        ]);

        $this->actingAs($this->client)
            ->delete(route('timeslots.destroy', $timeslot))
            ->assertForbidden();

        Event::assertNotDispatched(TimeslotCancelledEvent::class);
    }
}
