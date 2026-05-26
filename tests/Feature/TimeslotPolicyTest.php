<?php

namespace Tests\Feature;

use App\Models\Timeslot;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TimeslotPolicyTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected User $provider;

    protected User $client;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        $this->provider = User::factory()->create();
        $this->provider->assignRole('service_provider');

        $this->client = User::factory()->create();
        $this->client->assignRole('client');

        $this->provider->clients()->attach($this->client->id);
    }

    public function test_client_can_cancel_future_booked_timeslot(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'client_id' => $this->client->id,
            'start_time' => now()->addDays(2),
            'status' => 'booked',
        ]);

        $this->assertTrue($this->client->can('cancelBooking', $timeslot));
    }

    public function test_client_cannot_cancel_past_booked_timeslot(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'client_id' => $this->client->id,
            'start_time' => now()->subDays(2),
            'status' => 'booked',
        ]);

        $this->assertFalse($this->client->can('cancelBooking', $timeslot));
    }

    public function test_provider_can_cancel_past_booked_timeslot(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'client_id' => $this->client->id,
            'start_time' => now()->subDays(2),
            'status' => 'booked',
        ]);

        $this->assertTrue($this->provider->can('cancelBooking', $timeslot));
    }

    public function test_admin_can_cancel_past_booked_timeslot(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'client_id' => $this->client->id,
            'start_time' => now()->subDays(2),
            'status' => 'booked',
        ]);

        $this->assertTrue($this->admin->can('cancelBooking', $timeslot));
    }

    public function test_client_cannot_cancel_available_timeslot(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => now()->addDays(2),
            'status' => 'available',
        ]);

        $this->assertFalse($this->client->can('cancelBooking', $timeslot));
    }

    public function test_client_cannot_cancel_another_clients_booking(): void
    {
        $anotherClient = User::factory()->create();
        $anotherClient->assignRole('client');

        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'client_id' => $anotherClient->id,
            'start_time' => now()->addDays(2),
            'status' => 'booked',
        ]);

        $this->assertFalse($this->client->can('cancelBooking', $timeslot));
    }

    public function test_client_can_book_available_future_timeslot_from_linked_provider(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => now()->addDays(2),
            'status' => 'available',
        ]);

        $this->assertTrue($this->client->can('book', $timeslot));
    }

    public function test_client_cannot_book_timeslot_from_unlinked_provider(): void
    {
        $anotherProvider = User::factory()->create();
        $anotherProvider->assignRole('service_provider');

        $timeslot = Timeslot::factory()->create([
            'provider_id' => $anotherProvider->id,
            'start_time' => now()->addDays(2),
            'status' => 'available',
        ]);

        $this->assertFalse($this->client->can('book', $timeslot));
    }

    public function test_provider_can_update_own_available_timeslot(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => now()->addDays(2),
            'status' => 'available',
        ]);

        $this->assertTrue($this->provider->can('update', $timeslot));
    }

    public function test_provider_can_update_own_booked_timeslot(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'client_id' => $this->client->id,
            'start_time' => now()->addDays(2),
            'status' => 'booked',
        ]);

        $this->assertTrue($this->provider->can('update', $timeslot));
    }

    public function test_admin_can_update_any_timeslot(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'client_id' => $this->client->id,
            'start_time' => now()->addDays(2),
            'status' => 'booked',
        ]);

        $this->assertTrue($this->admin->can('update', $timeslot));
    }

    public function test_provider_can_delete_own_available_timeslot(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => now()->addDays(2),
            'status' => 'available',
        ]);

        $this->assertTrue($this->provider->can('delete', $timeslot));
    }

    public function test_provider_can_delete_own_past_available_timeslot(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => now()->subDays(2),
            'status' => 'available',
        ]);

        $this->assertTrue($this->provider->can('delete', $timeslot));
    }

    public function test_provider_cannot_delete_booked_timeslot(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'client_id' => $this->client->id,
            'start_time' => now()->addDays(2),
            'status' => 'booked',
        ]);

        $this->assertFalse($this->provider->can('delete', $timeslot));
    }

    public function test_provider_can_delete_completed_timeslot(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'client_id' => $this->client->id,
            'start_time' => now()->subDays(2),
            'status' => 'completed',
        ]);

        $this->assertTrue($this->provider->can('delete', $timeslot));
    }

    public function test_provider_cannot_delete_another_providers_timeslot(): void
    {
        $anotherProvider = User::factory()->create();
        $anotherProvider->assignRole('service_provider');

        $timeslot = Timeslot::factory()->create([
            'provider_id' => $anotherProvider->id,
            'start_time' => now()->addDays(2),
            'status' => 'available',
        ]);

        $this->assertFalse($this->provider->can('delete', $timeslot));
    }

    public function test_admin_can_delete_any_timeslot(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'client_id' => $this->client->id,
            'start_time' => now()->addDays(2),
            'status' => 'booked',
        ]);

        $this->assertTrue($this->admin->can('delete', $timeslot));
    }

    public function test_client_cannot_delete_timeslot(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => now()->addDays(2),
            'status' => 'available',
        ]);

        $this->assertFalse($this->client->can('delete', $timeslot));
    }

    // assignClient policy tests

    public function test_provider_can_assign_client_to_available_timeslot(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => now()->addDays(2),
            'status' => 'available',
        ]);

        $this->assertTrue($this->provider->can('assignClient', $timeslot));
    }

    public function test_provider_can_reassign_client_to_booked_timeslot(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'client_id' => $this->client->id,
            'start_time' => now()->subDays(1),
            'status' => 'booked',
        ]);

        $this->assertTrue($this->provider->can('assignClient', $timeslot));
    }

    public function test_provider_can_reassign_client_to_completed_past_timeslot(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'client_id' => $this->client->id,
            'start_time' => now()->subDays(2),
            'status' => 'completed',
        ]);

        $this->assertTrue($this->provider->can('assignClient', $timeslot));
    }

    public function test_provider_cannot_assign_client_to_another_providers_timeslot(): void
    {
        $anotherProvider = User::factory()->create();
        $anotherProvider->assignRole('service_provider');

        $timeslot = Timeslot::factory()->create([
            'provider_id' => $anotherProvider->id,
            'start_time' => now()->subDays(2),
            'status' => 'completed',
        ]);

        $this->assertFalse($this->provider->can('assignClient', $timeslot));
    }

    public function test_admin_can_assign_client_to_completed_timeslot(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'client_id' => $this->client->id,
            'start_time' => now()->subDays(2),
            'status' => 'completed',
        ]);

        $this->assertTrue($this->admin->can('assignClient', $timeslot));
    }

    public function test_client_cannot_assign_client_to_timeslot(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => now()->addDays(2),
            'status' => 'available',
        ]);

        $this->assertFalse($this->client->can('assignClient', $timeslot));
    }
}
