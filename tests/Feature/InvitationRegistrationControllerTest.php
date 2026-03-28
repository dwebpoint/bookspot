<?php

namespace Tests\Feature;

use App\Models\Invitation;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvitationRegistrationControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_valid_invitation_shows_registration_page(): void
    {
        $provider = User::factory()->create();
        $provider->assignRole('service_provider');

        $invitation = Invitation::factory()->create([
            'provider_id' => $provider->id,
            'email' => 'invited@example.com',
        ]);

        $response = $this->get(route('invitation.show', $invitation->token));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Invitation/Register')
            ->where('email', 'invited@example.com')
            ->where('token', $invitation->token)
        );
    }

    public function test_expired_invitation_shows_invalid_page(): void
    {
        $provider = User::factory()->create();
        $provider->assignRole('service_provider');

        $invitation = Invitation::factory()->expired()->create([
            'provider_id' => $provider->id,
        ]);

        $response = $this->get(route('invitation.show', $invitation->token));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Invitation/Invalid')
            ->where('reason', 'expired')
        );
    }

    public function test_used_invitation_token_returns_404(): void
    {
        // Once a client registers, the invitation is deleted — the token is no longer valid
        $response = $this->get(route('invitation.show', 'already-used-token'));

        $response->assertNotFound();
    }

    public function test_invalid_token_returns_404(): void
    {
        $response = $this->get(route('invitation.show', 'invalid-token-xyz'));

        $response->assertNotFound();
    }

    public function test_user_can_register_via_invitation(): void
    {
        $provider = User::factory()->create();
        $provider->assignRole('service_provider');

        $invitation = Invitation::factory()->create([
            'provider_id' => $provider->id,
            'email' => 'new@example.com',
        ]);

        $response = $this->post(route('invitation.register', $invitation->token), [
            'name' => 'New User',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertRedirect(route('dashboard'));

        $this->assertDatabaseHas('users', [
            'name' => 'New User',
            'email' => 'new@example.com',
        ]);
    }

    public function test_user_is_linked_to_provider_after_registration(): void
    {
        $provider = User::factory()->create();
        $provider->assignRole('service_provider');

        $invitation = Invitation::factory()->create([
            'provider_id' => $provider->id,
            'email' => 'linked@example.com',
        ]);

        $this->post(route('invitation.register', $invitation->token), [
            'name' => 'Linked User',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $newUser = User::where('email', 'linked@example.com')->first();
        $this->assertNotNull($newUser);

        $this->assertDatabaseHas('provider_client', [
            'provider_id' => $provider->id,
            'client_id' => $newUser->id,
            'created_by_provider' => false,
            'status' => 'active',
        ]);
    }

    public function test_user_is_logged_in_after_registration(): void
    {
        $provider = User::factory()->create();
        $provider->assignRole('service_provider');

        $invitation = Invitation::factory()->create([
            'provider_id' => $provider->id,
            'email' => 'autologin@example.com',
        ]);

        $this->post(route('invitation.register', $invitation->token), [
            'name' => 'Auto Login User',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $this->assertAuthenticated();
    }

    public function test_invitation_is_deleted_after_registration(): void
    {
        $provider = User::factory()->create();
        $provider->assignRole('service_provider');

        $invitation = Invitation::factory()->create([
            'provider_id' => $provider->id,
            'email' => 'accept@example.com',
        ]);

        $invitationId = $invitation->id;

        $this->post(route('invitation.register', $invitation->token), [
            'name' => 'Accept User',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $this->assertDatabaseMissing('invitations', ['id' => $invitationId]);
    }

    public function test_registration_fails_with_expired_invitation(): void
    {
        $provider = User::factory()->create();
        $provider->assignRole('service_provider');

        $invitation = Invitation::factory()->expired()->create([
            'provider_id' => $provider->id,
        ]);

        $response = $this->post(route('invitation.register', $invitation->token), [
            'name' => 'Test User',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertRedirect(route('invitation.show', $invitation->token));
        $this->assertGuest();
    }
}
