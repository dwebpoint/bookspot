<?php

namespace Tests\Feature;

use App\Events\TimeslotBooked as TimeslotBookedEvent;
use App\Events\TimeslotCancelled as TimeslotCancelledEvent;
use App\Mail\TimeslotBooked as TimeslotBookedMail;
use App\Models\Timeslot;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class NotificationTest extends TestCase
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

    public function test_booking_event_creates_database_notification_for_provider(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => now()->addDays(3),
            'status' => 'available',
        ]);

        TimeslotBookedEvent::dispatch($timeslot, $this->client);

        $this->assertCount(1, $this->provider->fresh()->unreadNotifications);

        $notification = $this->provider->unreadNotifications->first();
        $this->assertEquals('booked', $notification->data['action']);
        $this->assertEquals($timeslot->id, $notification->data['timeslot_id']);
        $this->assertEquals($this->client->id, $notification->data['client_id']);
        $this->assertEquals($this->client->name, $notification->data['client_name']);
    }

    public function test_cancellation_event_creates_database_notification_for_provider(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'client_id' => $this->client->id,
            'start_time' => now()->addDays(3),
            'status' => 'booked',
        ]);

        TimeslotCancelledEvent::dispatch($timeslot, $this->client);

        $this->assertCount(1, $this->provider->fresh()->unreadNotifications);

        $notification = $this->provider->unreadNotifications->first();
        $this->assertEquals('cancelled', $notification->data['action']);
        $this->assertEquals($timeslot->id, $notification->data['timeslot_id']);
    }

    public function test_database_notification_is_saved_even_when_email_notifications_disabled(): void
    {
        Mail::fake();

        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => now()->addDays(3),
            'status' => 'available',
        ]);

        TimeslotBookedEvent::dispatch($timeslot, $this->client);

        $this->assertCount(1, $this->provider->fresh()->unreadNotifications);
        Mail::assertNotSent(TimeslotBookedMail::class);
    }

    public function test_database_notification_and_email_both_sent_when_email_notifications_enabled(): void
    {
        \Illuminate\Support\Facades\Notification::fake();

        $this->provider->update(['email_notifications_enabled' => true]);

        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => now()->addDays(3),
            'status' => 'available',
        ]);

        TimeslotBookedEvent::dispatch($timeslot, $this->client);

        \Illuminate\Support\Facades\Notification::assertSentTo(
            $this->provider,
            \App\Notifications\TimeslotBookedNotification::class,
            function (\App\Notifications\TimeslotBookedNotification $notification) {
                $channels = $notification->via($this->provider);

                return in_array('database', $channels) && in_array('mail', $channels);
            }
        );
    }

    public function test_provider_can_dismiss_notification(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => now()->addDays(3),
        ]);

        TimeslotBookedEvent::dispatch($timeslot, $this->client);

        $notification = $this->provider->fresh()->unreadNotifications->first();
        $this->assertNotNull($notification);

        $this->actingAs($this->provider)
            ->delete(route('notifications.destroy', $notification->id))
            ->assertRedirect();

        $this->assertCount(0, $this->provider->fresh()->unreadNotifications);
        $this->assertNotNull($this->provider->fresh()->readNotifications->first());
    }

    public function test_provider_cannot_dismiss_another_users_notification(): void
    {
        $otherProvider = User::factory()->create();
        $otherProvider->assignRole('service_provider');

        $timeslot = Timeslot::factory()->create([
            'provider_id' => $otherProvider->id,
            'start_time' => now()->addDays(3),
        ]);

        TimeslotBookedEvent::dispatch($timeslot, $this->client);

        $notification = $otherProvider->fresh()->unreadNotifications->first();

        $this->actingAs($this->provider)
            ->delete(route('notifications.destroy', $notification->id))
            ->assertNotFound();
    }

    public function test_client_cannot_access_dismiss_notification_route(): void
    {
        $this->actingAs($this->client)
            ->delete(route('notifications.destroy', 'fake-id'))
            ->assertForbidden();
    }

    public function test_unread_notifications_are_shared_via_inertia_for_providers(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => now()->addDays(3),
        ]);

        TimeslotBookedEvent::dispatch($timeslot, $this->client);

        $response = $this->actingAs($this->provider)->get(route('dashboard'));

        $response->assertInertia(fn ($page) =>
            $page->has('notifications', 1)
                 ->where('notifications.0.data.action', 'booked')
                 ->where('notifications.0.data.client_name', $this->client->name)
        );
    }

    public function test_notifications_are_empty_for_clients(): void
    {
        $response = $this->actingAs($this->client)->get(route('timeslots.index'));

        $response->assertInertia(fn ($page) =>
            $page->has('notifications', 0)
        );
    }
}

