<?php

namespace Tests\Feature\Provider;

use App\Enums\TimeslotStatus;
use App\Models\ProviderClient;
use App\Models\Timeslot;
use App\Models\User;
use Carbon\Carbon;
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

    public function test_destroy_resets_client_id_on_future_booked_timeslots(): void
    {
        $provider = User::factory()->create();
        $provider->assignRole('service_provider');

        $client = User::factory()->create();
        $client->assignRole('client');

        ProviderClient::create([
            'provider_id' => $provider->id,
            'client_id' => $client->id,
            'created_by_provider' => true,
            'status' => 'active',
        ]);

        $futureBooked = Timeslot::factory()->create([
            'provider_id' => $provider->id,
            'client_id' => $client->id,
            'start_time' => Carbon::now()->addDays(3)->setTime(10, 0),
            'duration_minutes' => 60,
            'status' => 'booked',
        ]);

        $pastBooked = Timeslot::factory()->create([
            'provider_id' => $provider->id,
            'client_id' => $client->id,
            'start_time' => Carbon::now()->subDays(1)->setTime(10, 0),
            'duration_minutes' => 60,
            'status' => 'booked',
        ]);

        $this->actingAs($provider)
            ->delete(route('provider.clients.destroy', $client));

        $futureBooked->refresh();
        $this->assertEquals(TimeslotStatus::Available, $futureBooked->status);
        $this->assertNull($futureBooked->client_id);

        $pastBooked->refresh();
        $this->assertEquals(TimeslotStatus::Booked, $pastBooked->status);
        $this->assertEquals($client->id, $pastBooked->client_id);
    }
}
