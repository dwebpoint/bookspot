<?php

namespace Tests\Feature\Provider;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClientControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_new_client_created_by_provider_gets_client_role(): void
    {
        $provider = User::factory()->create();
        $provider->assignRole('service_provider');

        $response = $this->actingAs($provider)
            ->post(route('provider.clients.store'), [
                'name' => 'New Client',
                'email' => 'newclient@example.com',
                'password' => 'password',
                'password_confirmation' => 'password',
            ]);

        $response->assertRedirect(route('provider.clients.index'));

        $client = User::where('email', 'newclient@example.com')->first();
        $this->assertNotNull($client);
        $this->assertTrue($client->hasRole('client'));
    }
}
