<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationsControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $provider;

    protected User $client;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);

        $this->provider = User::factory()->create(['email_notifications_enabled' => false]);
        $this->provider->assignRole('service_provider');

        $this->client = User::factory()->create(['email_notifications_enabled' => false]);
        $this->client->assignRole('client');

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');
    }

    /** @test */
    public function service_provider_can_view_notification_settings_page(): void
    {
        $this->actingAs($this->provider)
            ->get(route('notifications.edit'))
            ->assertOk();
    }

    /** @test */
    public function client_can_view_notification_settings_page(): void
    {
        $this->actingAs($this->client)
            ->get(route('notifications.edit'))
            ->assertOk();
    }

    /** @test */
    public function admin_cannot_access_notification_settings_page(): void
    {
        $this->actingAs($this->admin)
            ->get(route('notifications.edit'))
            ->assertForbidden();
    }

    /** @test */
    public function unauthenticated_user_is_redirected_from_notification_settings(): void
    {
        $this->get(route('notifications.edit'))
            ->assertRedirect(route('login'));
    }

    /** @test */
    public function service_provider_can_enable_email_notifications(): void
    {
        $this->actingAs($this->provider)
            ->patch(route('notifications.update'), ['email_notifications_enabled' => true])
            ->assertRedirect();

        $this->assertTrue($this->provider->fresh()->email_notifications_enabled);
    }

    /** @test */
    public function service_provider_can_disable_email_notifications(): void
    {
        $this->provider->update(['email_notifications_enabled' => true]);

        $this->actingAs($this->provider)
            ->patch(route('notifications.update'), ['email_notifications_enabled' => false])
            ->assertRedirect();

        $this->assertFalse($this->provider->fresh()->email_notifications_enabled);
    }

    /** @test */
    public function client_can_update_email_notification_preference(): void
    {
        $this->actingAs($this->client)
            ->patch(route('notifications.update'), ['email_notifications_enabled' => true])
            ->assertRedirect();

        $this->assertTrue($this->client->fresh()->email_notifications_enabled);
    }

    /** @test */
    public function admin_cannot_update_notification_preferences(): void
    {
        $this->actingAs($this->admin)
            ->patch(route('notifications.update'), ['email_notifications_enabled' => true])
            ->assertForbidden();
    }

    /** @test */
    public function email_notifications_enabled_field_is_required(): void
    {
        $this->actingAs($this->provider)
            ->patch(route('notifications.update'), [])
            ->assertSessionHasErrors('email_notifications_enabled');
    }
}
