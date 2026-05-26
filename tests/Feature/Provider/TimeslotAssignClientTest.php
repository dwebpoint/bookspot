<?php

namespace Tests\Feature\Provider;

use App\Enums\TimeslotStatus;
use App\Models\Timeslot;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class TimeslotAssignClientTest extends TestCase
{
    use LazilyRefreshDatabase;

    protected User $provider;

    protected User $client;

    protected User $otherClient;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);

        $this->provider = User::factory()->create();
        $this->provider->assignRole('service_provider');

        $this->client = User::factory()->create();
        $this->client->assignRole('client');
        $this->provider->clients()->attach($this->client->id);

        $this->otherClient = User::factory()->create();
        $this->otherClient->assignRole('client');
        $this->provider->clients()->attach($this->otherClient->id);
    }

    public function test_provider_can_assign_client_to_available_timeslot(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => now()->addDays(2),
            'status' => TimeslotStatus::Available,
        ]);

        $response = $this->actingAs($this->provider)
            ->post(route('provider.timeslots.assign', $timeslot), [
                'client_id' => $this->client->id,
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('timeslots', [
            'id' => $timeslot->id,
            'client_id' => $this->client->id,
            'status' => TimeslotStatus::Booked->value,
        ]);
    }

    public function test_provider_can_reassign_client_to_booked_timeslot(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'client_id' => $this->client->id,
            'start_time' => now()->addDays(2),
            'status' => TimeslotStatus::Booked,
        ]);

        $response = $this->actingAs($this->provider)
            ->post(route('provider.timeslots.assign', $timeslot), [
                'client_id' => $this->otherClient->id,
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('timeslots', [
            'id' => $timeslot->id,
            'client_id' => $this->otherClient->id,
            'status' => TimeslotStatus::Booked->value,
        ]);
    }

    public function test_provider_can_reassign_client_to_completed_past_timeslot(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'client_id' => $this->client->id,
            'start_time' => now()->subDays(2),
            'status' => TimeslotStatus::Completed,
        ]);

        $response = $this->actingAs($this->provider)
            ->post(route('provider.timeslots.assign', $timeslot), [
                'client_id' => $this->otherClient->id,
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('timeslots', [
            'id' => $timeslot->id,
            'client_id' => $this->otherClient->id,
            'status' => TimeslotStatus::Completed->value,
        ]);
    }

    public function test_reassigning_completed_timeslot_preserves_completed_status(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'client_id' => $this->client->id,
            'start_time' => now()->subDays(3),
            'status' => TimeslotStatus::Completed,
        ]);

        $this->actingAs($this->provider)
            ->post(route('provider.timeslots.assign', $timeslot), [
                'client_id' => $this->otherClient->id,
            ]);

        $timeslot->refresh();
        $this->assertEquals(TimeslotStatus::Completed, $timeslot->status);
        $this->assertEquals($this->otherClient->id, $timeslot->client_id);
    }

    public function test_provider_cannot_assign_client_not_in_their_list(): void
    {
        $unlinkedClient = User::factory()->create();
        $unlinkedClient->assignRole('client');

        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => now()->subDays(2),
            'status' => TimeslotStatus::Completed,
        ]);

        $response = $this->actingAs($this->provider)
            ->post(route('provider.timeslots.assign', $timeslot), [
                'client_id' => $unlinkedClient->id,
            ]);

        $response->assertSessionHasErrors('client_id');
    }

    public function test_provider_cannot_reassign_client_on_another_providers_completed_timeslot(): void
    {
        $otherProvider = User::factory()->create();
        $otherProvider->assignRole('service_provider');

        $timeslot = Timeslot::factory()->create([
            'provider_id' => $otherProvider->id,
            'client_id' => $this->client->id,
            'start_time' => now()->subDays(2),
            'status' => TimeslotStatus::Completed,
        ]);

        $response = $this->actingAs($this->provider)
            ->post(route('provider.timeslots.assign', $timeslot), [
                'client_id' => $this->otherClient->id,
            ]);

        $response->assertForbidden();
    }

    public function test_client_cannot_assign_client_to_timeslot(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => now()->addDays(2),
            'status' => TimeslotStatus::Available,
        ]);

        $response = $this->actingAs($this->client)
            ->post(route('provider.timeslots.assign', $timeslot), [
                'client_id' => $this->otherClient->id,
            ]);

        $response->assertForbidden();
    }
}
