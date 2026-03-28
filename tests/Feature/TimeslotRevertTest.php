<?php

namespace Tests\Feature;

use App\Models\Timeslot;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TimeslotRevertTest extends TestCase
{
    use RefreshDatabase;

    protected User $provider;

    protected User $client;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);

        $this->provider = User::factory()->create();
        $this->provider->assignRole('service_provider');

        $this->client = User::factory()->create();
        $this->client->assignRole('client');
    }

    public function test_provider_can_revert_completed_timeslot_to_booked(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'client_id' => $this->client->id,
            'start_time' => Carbon::now()->subDay(),
            'status' => 'completed',
        ]);

        $response = $this->actingAs($this->provider)
            ->patch(route('timeslots.revert', $timeslot));

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertDatabaseHas('timeslots', [
            'id' => $timeslot->id,
            'status' => 'booked',
            'client_id' => $this->client->id,
        ]);
    }

    public function test_client_cannot_revert_completed_timeslot(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'client_id' => $this->client->id,
            'start_time' => Carbon::now()->subDay(),
            'status' => 'completed',
        ]);

        $response = $this->actingAs($this->client)
            ->patch(route('timeslots.revert', $timeslot));

        $response->assertForbidden();
        $this->assertDatabaseHas('timeslots', [
            'id' => $timeslot->id,
            'status' => 'completed',
        ]);
    }

    public function test_provider_cannot_revert_a_timeslot_they_do_not_own(): void
    {
        $otherProvider = User::factory()->create();
        $otherProvider->assignRole('service_provider');

        $timeslot = Timeslot::factory()->create([
            'provider_id' => $otherProvider->id,
            'client_id' => $this->client->id,
            'start_time' => Carbon::now()->subDay(),
            'status' => 'completed',
        ]);

        $response = $this->actingAs($this->provider)
            ->patch(route('timeslots.revert', $timeslot));

        $response->assertForbidden();
        $this->assertDatabaseHas('timeslots', [
            'id' => $timeslot->id,
            'status' => 'completed',
        ]);
    }

    public function test_provider_cannot_revert_a_booked_timeslot(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'client_id' => $this->client->id,
            'start_time' => Carbon::now()->addDay(),
            'status' => 'booked',
        ]);

        $response = $this->actingAs($this->provider)
            ->patch(route('timeslots.revert', $timeslot));

        $response->assertForbidden();
        $this->assertDatabaseHas('timeslots', [
            'id' => $timeslot->id,
            'status' => 'booked',
        ]);
    }

    public function test_provider_cannot_revert_an_available_timeslot(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'client_id' => null,
            'start_time' => Carbon::now()->addDay(),
            'status' => 'available',
        ]);

        $response = $this->actingAs($this->provider)
            ->patch(route('timeslots.revert', $timeslot));

        $response->assertForbidden();
    }

    public function test_admin_can_revert_any_completed_timeslot(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'client_id' => $this->client->id,
            'start_time' => Carbon::now()->subDay(),
            'status' => 'completed',
        ]);

        $response = $this->actingAs($admin)
            ->patch(route('timeslots.revert', $timeslot));

        $response->assertRedirect();
        $this->assertDatabaseHas('timeslots', [
            'id' => $timeslot->id,
            'status' => 'booked',
        ]);
    }

    public function test_unauthenticated_user_cannot_revert_timeslot(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'client_id' => $this->client->id,
            'start_time' => Carbon::now()->subDay(),
            'status' => 'completed',
        ]);

        $response = $this->patch(route('timeslots.revert', $timeslot));

        $response->assertRedirect(route('login'));
        $this->assertDatabaseHas('timeslots', [
            'id' => $timeslot->id,
            'status' => 'completed',
        ]);
    }
}
