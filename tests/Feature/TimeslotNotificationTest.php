<?php

namespace Tests\Feature;

use App\Events\TimeslotBooked as TimeslotBookedEvent;
use App\Events\TimeslotCancelled as TimeslotCancelledEvent;
use App\Models\Timeslot;
use App\Models\User;
use App\Notifications\TimeslotBookedNotification;
use App\Notifications\TimeslotCancelledNotification;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class TimeslotNotificationTest extends TestCase
{
    use LazilyRefreshDatabase;

    protected User $provider;

    protected User $client;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);

        $this->provider = User::factory()->serviceProvider()->create(['email_notifications_enabled' => false]);
        $this->client = User::factory()->client()->create();

        $this->provider->clients()->attach($this->client->id);
    }

    public function test_timeslot_booked_event_is_dispatched_when_client_books(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => now()->addDays(3),
        ]);

        Event::fake();

        $this->actingAs($this->client)
            ->post(route('timeslots.store'), ['timeslot_id' => $timeslot->id])
            ->assertRedirect();

        Event::assertDispatched(TimeslotBookedEvent::class, function (TimeslotBookedEvent $event) use ($timeslot) {
            return $event->timeslot->id === $timeslot->id
                && $event->client->id === $this->client->id;
        });
    }

    public function test_timeslot_cancelled_event_is_dispatched_when_client_cancels(): void
    {
        $timeslot = Timeslot::factory()->booked($this->client->id)->create([
            'provider_id' => $this->provider->id,
            'start_time' => now()->addDays(3),
        ]);

        Event::fake();

        $this->actingAs($this->client)
            ->delete(route('timeslots.destroy', $timeslot))
            ->assertRedirect();

        Event::assertDispatched(TimeslotCancelledEvent::class, function (TimeslotCancelledEvent $event) use ($timeslot) {
            return $event->timeslot->id === $timeslot->id
                && $event->client->id === $this->client->id;
        });
    }

    public function test_subscriber_sends_booking_email_when_provider_has_notifications_enabled(): void
    {
        Notification::fake();

        $this->provider->update(['email_notifications_enabled' => true]);

        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => now()->addDays(3),
        ]);

        TimeslotBookedEvent::dispatch($timeslot, $this->client);

        Notification::assertSentTo(
            $this->provider,
            TimeslotBookedNotification::class,
            function (TimeslotBookedNotification $notification) {
                $channels = $notification->via($this->provider);

                return in_array('database', $channels) && in_array('mail', $channels);
            }
        );
    }

    public function test_subscriber_sends_cancellation_email_when_provider_has_notifications_enabled(): void
    {
        Notification::fake();

        $this->provider->update(['email_notifications_enabled' => true]);

        $timeslot = Timeslot::factory()->booked($this->client->id)->create([
            'provider_id' => $this->provider->id,
            'start_time' => now()->addDays(3),
        ]);

        TimeslotCancelledEvent::dispatch($timeslot, $this->client);

        Notification::assertSentTo(
            $this->provider,
            TimeslotCancelledNotification::class,
            function (TimeslotCancelledNotification $notification) {
                $channels = $notification->via($this->provider);

                return in_array('database', $channels) && in_array('mail', $channels);
            }
        );
    }

    public function test_subscriber_skips_email_when_provider_has_notifications_disabled(): void
    {
        Notification::fake();

        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => now()->addDays(3),
        ]);

        TimeslotBookedEvent::dispatch($timeslot, $this->client);

        Notification::assertSentTo(
            $this->provider,
            TimeslotBookedNotification::class,
            function (TimeslotBookedNotification $notification) {
                return ! in_array('mail', $notification->via($this->provider));
            }
        );
    }

    public function test_no_event_dispatched_when_booking_fails_due_to_unavailable_timeslot(): void
    {
        $timeslot = Timeslot::factory()->booked($this->client->id)->create([
            'provider_id' => $this->provider->id,
            'start_time' => now()->addDays(3),
        ]);

        Event::fake();

        $this->actingAs($this->client)
            ->post(route('timeslots.store'), ['timeslot_id' => $timeslot->id])
            ->assertRedirect();

        Event::assertNotDispatched(TimeslotBookedEvent::class);
    }

    public function test_cancelled_event_is_not_dispatched_when_provider_cancels_booking(): void
    {
        $timeslot = Timeslot::factory()->booked($this->client->id)->create([
            'provider_id' => $this->provider->id,
            'start_time' => now()->addDays(3),
        ]);

        Event::fake();

        $this->actingAs($this->provider)
            ->delete(route('timeslots.destroy', $timeslot))
            ->assertRedirect();

        Event::assertNotDispatched(TimeslotCancelledEvent::class);
    }

    public function test_provider_does_not_receive_notification_when_provider_cancels_booking(): void
    {
        Notification::fake();

        $this->provider->update(['email_notifications_enabled' => true]);

        $timeslot = Timeslot::factory()->booked($this->client->id)->create([
            'provider_id' => $this->provider->id,
            'start_time' => now()->addDays(3),
        ]);

        $this->actingAs($this->provider)
            ->delete(route('timeslots.destroy', $timeslot))
            ->assertRedirect();

        Notification::assertNotSentTo($this->provider, TimeslotCancelledNotification::class);
    }

    public function test_provider_receives_cancellation_notification_when_client_cancels(): void
    {
        Notification::fake();

        $this->provider->update(['email_notifications_enabled' => true]);

        $timeslot = Timeslot::factory()->booked($this->client->id)->create([
            'provider_id' => $this->provider->id,
            'start_time' => now()->addDays(3),
        ]);

        $this->actingAs($this->client)
            ->delete(route('timeslots.destroy', $timeslot))
            ->assertRedirect();

        Notification::assertSentTo(
            $this->provider,
            TimeslotCancelledNotification::class,
            function (TimeslotCancelledNotification $notification) use ($timeslot) {
                $channels = $notification->via($this->provider);

                return in_array('mail', $channels)
                    && $notification->timeslot->id === $timeslot->id
                    && $notification->client->id === $this->client->id;
            }
        );
    }

    public function test_no_event_dispatched_when_cancellation_is_unauthorised(): void
    {
        $timeslot = Timeslot::factory()->booked($this->client->id)->create([
            'provider_id' => $this->provider->id,
            'start_time' => now()->subDays(2),
        ]);

        Event::fake();

        $this->actingAs($this->client)
            ->delete(route('timeslots.destroy', $timeslot))
            ->assertForbidden();

        Event::assertNotDispatched(TimeslotCancelledEvent::class);
    }

    public function test_provider_receives_booking_email_when_client_books_timeslot(): void
    {
        Notification::fake();

        $this->provider->update(['email_notifications_enabled' => true]);

        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => now()->addDays(3),
        ]);

        $this->actingAs($this->client)
            ->post(route('timeslots.store'), ['timeslot_id' => $timeslot->id])
            ->assertRedirect();

        Notification::assertSentTo(
            $this->provider,
            TimeslotBookedNotification::class,
            function (TimeslotBookedNotification $notification) use ($timeslot) {
                $channels = $notification->via($this->provider);

                return in_array('mail', $channels)
                    && $notification->timeslot->id === $timeslot->id
                    && $notification->client->id === $this->client->id;
            }
        );
    }

    public function test_provider_does_not_receive_booking_email_when_notifications_disabled(): void
    {
        Notification::fake();

        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => now()->addDays(3),
        ]);

        $this->actingAs($this->client)
            ->post(route('timeslots.store'), ['timeslot_id' => $timeslot->id])
            ->assertRedirect();

        Notification::assertSentTo(
            $this->provider,
            TimeslotBookedNotification::class,
            function (TimeslotBookedNotification $notification) {
                return ! in_array('mail', $notification->via($this->provider));
            }
        );
    }
}
