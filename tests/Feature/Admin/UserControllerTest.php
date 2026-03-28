<?php

namespace Tests\Feature\Admin;

use App\Models\ProviderClient;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);

        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->admin->assignRole('admin');
    }

    public function test_index_lists_all_users_including_those_without_role(): void
    {
        $userWithoutRole = User::factory()->create();
        $client = User::factory()->create(['role' => 'client']);
        $client->assignRole('client');

        $response = $this->actingAs($this->admin)->get('/admin/users');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Users/Index')
            ->has('users.data', 3)
            ->has('stats')
            ->where('stats.no_role', 1)
        );
    }

    public function test_index_filters_by_no_role(): void
    {
        $userWithoutRole = User::factory()->create();
        $client = User::factory()->create(['role' => 'client']);
        $client->assignRole('client');

        $response = $this->actingAs($this->admin)->get('/admin/users?role=none');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Users/Index')
            ->has('users.data', 1)
            ->where('users.data.0.id', $userWithoutRole->id)
        );
    }

    public function test_index_filters_by_spatie_role(): void
    {
        $client = User::factory()->create(['role' => 'client']);
        $client->assignRole('client');
        $provider = User::factory()->create(['role' => 'service_provider']);
        $provider->assignRole('service_provider');

        $response = $this->actingAs($this->admin)->get('/admin/users?role=client');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Users/Index')
            ->has('users.data', 1)
            ->where('users.data.0.id', $client->id)
        );
    }

    public function test_update_role_syncs_spatie_role(): void
    {
        $user = User::factory()->create(['role' => 'client']);
        $user->assignRole('client');

        $response = $this->actingAs($this->admin)
            ->patch("/admin/users/{$user->id}/role", ['role' => 'service_provider']);

        $response->assertRedirect('/admin/users');
        $user->refresh();
        $this->assertTrue($user->hasRole('service_provider'));
        $this->assertFalse($user->hasRole('client'));
    }

    public function test_attach_provider_creates_provider_client_link(): void
    {
        $client = User::factory()->create(['role' => 'client']);
        $client->assignRole('client');
        $provider = User::factory()->create(['role' => 'service_provider']);
        $provider->assignRole('service_provider');

        $response = $this->actingAs($this->admin)
            ->post("/admin/users/{$client->id}/attach-provider", [
                'provider_id' => $provider->id,
            ]);

        $response->assertRedirect('/admin/users');
        $response->assertSessionHas('success');
        $this->assertDatabaseHas('provider_client', [
            'provider_id' => $provider->id,
            'client_id' => $client->id,
            'status' => 'active',
        ]);
    }

    public function test_attach_provider_rejects_non_provider(): void
    {
        $user = User::factory()->create(['role' => 'client']);
        $user->assignRole('client');
        $otherClient = User::factory()->create(['role' => 'client']);
        $otherClient->assignRole('client');

        $response = $this->actingAs($this->admin)
            ->post("/admin/users/{$user->id}/attach-provider", [
                'provider_id' => $otherClient->id,
            ]);

        $response->assertRedirect('/admin/users');
        $response->assertSessionHas('error');
        $this->assertDatabaseMissing('provider_client', [
            'provider_id' => $otherClient->id,
            'client_id' => $user->id,
        ]);
    }

    public function test_attach_provider_rejects_duplicate(): void
    {
        $client = User::factory()->create(['role' => 'client']);
        $client->assignRole('client');
        $provider = User::factory()->create(['role' => 'service_provider']);
        $provider->assignRole('service_provider');

        ProviderClient::create([
            'provider_id' => $provider->id,
            'client_id' => $client->id,
            'created_by_provider' => false,
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->admin)
            ->post("/admin/users/{$client->id}/attach-provider", [
                'provider_id' => $provider->id,
            ]);

        $response->assertRedirect('/admin/users');
        $response->assertSessionHas('error');
    }

    public function test_non_admin_cannot_access_index(): void
    {
        $client = User::factory()->create(['role' => 'client']);
        $client->assignRole('client');

        $response = $this->actingAs($client)->get('/admin/users');
        $response->assertStatus(403);
    }

    public function test_store_assigns_spatie_role(): void
    {
        $response = $this->actingAs($this->admin)->post('/admin/users', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'client',
            'timezone' => 'UTC',
        ]);

        $response->assertRedirect('/admin/users');
        $user = User::where('email', 'test@example.com')->first();
        $this->assertNotNull($user);
        $this->assertTrue($user->hasRole('client'));
    }

    public function test_update_syncs_spatie_role(): void
    {
        $user = User::factory()->create(['role' => 'client']);
        $user->assignRole('client');

        $response = $this->actingAs($this->admin)->put("/admin/users/{$user->id}", [
            'name' => $user->name,
            'email' => $user->email,
            'role' => 'service_provider',
            'timezone' => $user->timezone,
        ]);

        $response->assertRedirect('/admin/users');
        $user->refresh();
        $this->assertTrue($user->hasRole('service_provider'));
        $this->assertFalse($user->hasRole('client'));
    }
}
