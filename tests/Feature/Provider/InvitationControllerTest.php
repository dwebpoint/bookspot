<?php

namespace Tests\Feature\Provider;

use App\Mail\ClientInvitation;
use App\Models\Invitation;
use App\Models\ProviderClient;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class InvitationControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_provider_can_send_invitation(): void
    {
        Mail::fake();

        $provider = User::factory()->create();
        $provider->assignRole('service_provider');

        $response = $this->actingAs($provider)
            ->post(route('provider.invitations.store'), [
                'email' => 'newclient@example.com',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('invitations', [
            'provider_id' => $provider->id,
            'email' => 'newclient@example.com',
        ]);
    }

    public function test_invitation_email_is_dispatched(): void
    {
        Mail::fake();

        $provider = User::factory()->create();
        $provider->assignRole('service_provider');

        $this->actingAs($provider)
            ->post(route('provider.invitations.store'), [
                'email' => 'newclient@example.com',
            ]);

        Mail::assertSent(ClientInvitation::class, function (ClientInvitation $mail) {
            return $mail->hasTo('newclient@example.com');
        });
    }

    public function test_provider_cannot_send_duplicate_pending_invitation(): void
    {
        Mail::fake();

        $provider = User::factory()->create();
        $provider->assignRole('service_provider');

        Invitation::factory()->create([
            'provider_id' => $provider->id,
            'email' => 'client@example.com',
        ]);

        $response = $this->actingAs($provider)
            ->post(route('provider.invitations.store'), [
                'email' => 'client@example.com',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('error');

        Mail::assertNotSent(ClientInvitation::class);
    }

    public function test_provider_auto_links_existing_client_user(): void
    {
        Mail::fake();

        $provider = User::factory()->create();
        $provider->assignRole('service_provider');

        $existingClient = User::factory()->create(['email' => 'existing@example.com']);
        $existingClient->assignRole('client');

        $response = $this->actingAs($provider)
            ->post(route('provider.invitations.store'), [
                'email' => 'existing@example.com',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('provider_client', [
            'provider_id' => $provider->id,
            'client_id' => $existingClient->id,
        ]);

        Mail::assertNotSent(ClientInvitation::class);
    }

    public function test_existing_linked_client_shows_already_linked_message(): void
    {
        Mail::fake();

        $provider = User::factory()->create();
        $provider->assignRole('service_provider');

        $client = User::factory()->create(['email' => 'linked@example.com']);
        $client->assignRole('client');

        ProviderClient::create([
            'provider_id' => $provider->id,
            'client_id' => $client->id,
            'created_by_provider' => true,
            'status' => 'active',
        ]);

        $response = $this->actingAs($provider)
            ->post(route('provider.invitations.store'), [
                'email' => 'linked@example.com',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('error');
    }

    public function test_provider_can_cancel_invitation(): void
    {
        $provider = User::factory()->create();
        $provider->assignRole('service_provider');

        $invitation = Invitation::factory()->create([
            'provider_id' => $provider->id,
        ]);

        $response = $this->actingAs($provider)
            ->delete(route('provider.invitations.destroy', $invitation->id));

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('invitations', ['id' => $invitation->id]);
    }

    public function test_provider_cannot_cancel_another_providers_invitation(): void
    {
        $provider = User::factory()->create();
        $provider->assignRole('service_provider');

        $otherProvider = User::factory()->create();
        $otherProvider->assignRole('service_provider');

        $invitation = Invitation::factory()->create([
            'provider_id' => $otherProvider->id,
        ]);

        $response = $this->actingAs($provider)
            ->delete(route('provider.invitations.destroy', $invitation->id));

        $response->assertForbidden();
    }

    public function test_client_cannot_send_invitation(): void
    {
        $client = User::factory()->create();
        $client->assignRole('client');

        $response = $this->actingAs($client)
            ->post(route('provider.invitations.store'), [
                'email' => 'someone@example.com',
            ]);

        $response->assertForbidden();
    }
}
