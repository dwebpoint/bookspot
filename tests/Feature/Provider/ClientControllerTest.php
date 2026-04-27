<?php

namespace Tests\Feature\Provider;

use App\Enums\TimeslotStatus;
use App\Events\TimeslotCancelled;
use App\Models\ProviderClient;
use App\Models\Timeslot;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
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

    public function test_provider_can_update_client_name_and_email_without_password(): void
    {
        $provider = User::factory()->create();
        $provider->assignRole('service_provider');

        $client = User::factory()->create(['name' => 'Old Name', 'email' => 'old@example.com']);
        $client->assignRole('client');
        ProviderClient::create([
            'provider_id' => $provider->id,
            'client_id' => $client->id,
            'created_by_provider' => true,
            'status' => 'active',
        ]);

        $response = $this->actingAs($provider)
            ->put(route('provider.clients.update', $client), [
                'name' => 'New Name',
                'email' => 'new@example.com',
            ]);

        $response->assertRedirect(route('provider.clients.index'));
        $client->refresh();
        $this->assertSame('New Name', $client->name);
        $this->assertSame('new@example.com', $client->email);
    }

    public function test_update_fails_validation_without_name(): void
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

        $response = $this->actingAs($provider)
            ->put(route('provider.clients.update', $client), [
                'email' => 'valid@example.com',
            ]);

        $response->assertSessionHasErrors('name');
    }

    public function test_update_fails_validation_when_email_taken_by_another_user(): void
    {
        $provider = User::factory()->create();
        $provider->assignRole('service_provider');

        $client = User::factory()->create(['email' => 'client@example.com']);
        $client->assignRole('client');
        ProviderClient::create([
            'provider_id' => $provider->id,
            'client_id' => $client->id,
            'created_by_provider' => true,
            'status' => 'active',
        ]);

        $other = User::factory()->create(['email' => 'taken@example.com']);

        $response = $this->actingAs($provider)
            ->put(route('provider.clients.update', $client), [
                'name' => 'New Name',
                'email' => 'taken@example.com',
            ]);

        $response->assertSessionHasErrors('email');
        $client->refresh();
        $this->assertSame('client@example.com', $client->email);
    }

    public function test_update_allows_keeping_own_email(): void
    {
        $provider = User::factory()->create();
        $provider->assignRole('service_provider');

        $client = User::factory()->create(['name' => 'Old Name', 'email' => 'same@example.com']);
        $client->assignRole('client');
        ProviderClient::create([
            'provider_id' => $provider->id,
            'client_id' => $client->id,
            'created_by_provider' => true,
            'status' => 'active',
        ]);

        $response = $this->actingAs($provider)
            ->put(route('provider.clients.update', $client), [
                'name' => 'New Name',
                'email' => 'same@example.com',
            ]);

        $response->assertRedirect(route('provider.clients.index'));
        $client->refresh();
        $this->assertSame('New Name', $client->name);
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

    public function test_destroy_does_not_dispatch_timeslot_cancelled_event(): void
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

        Timeslot::factory()->create([
            'provider_id' => $provider->id,
            'client_id' => $client->id,
            'start_time' => Carbon::now()->addDays(3)->setTime(10, 0),
            'duration_minutes' => 60,
            'status' => 'booked',
        ]);

        // Factory setup must precede Event::fake() to avoid suppressing model creation events
        Event::fake();

        $this->actingAs($provider)
            ->delete(route('provider.clients.destroy', $client));

        // Provider-initiated removal is intentionally silent — only client-initiated cancellations fire this event
        Event::assertNotDispatched(TimeslotCancelled::class);
    }
}
