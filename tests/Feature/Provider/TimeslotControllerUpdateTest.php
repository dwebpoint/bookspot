<?php

namespace Tests\Feature\Provider;

use App\Enums\TimeslotStatus;
use App\Models\Timeslot;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TimeslotControllerUpdateTest extends TestCase
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

    public function test_provider_can_update_duration_of_own_available_timeslot(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => Carbon::now()->addDays(2)->setTime(10, 0),
            'duration_minutes' => 60,
            'status' => 'available',
        ]);

        $response = $this->actingAs($this->provider)
            ->patch(route('provider.timeslots.update', $timeslot), [
                'duration_minutes' => 120,
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('timeslots', [
            'id' => $timeslot->id,
            'duration_minutes' => 120,
        ]);
    }

    public function test_provider_can_update_start_time_of_own_available_timeslot(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => Carbon::now()->addDays(2)->setTime(10, 0),
            'duration_minutes' => 60,
            'status' => 'available',
        ]);

        $newStartTime = Carbon::now()->addDays(3)->setTime(14, 0);

        $response = $this->actingAs($this->provider)
            ->patch(route('provider.timeslots.update', $timeslot), [
                'start_time' => $newStartTime->format('Y-m-d\TH:i'),
                'duration_minutes' => 60,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $timeslot->refresh();
        $this->assertEquals($newStartTime->format('Y-m-d H:i'), $timeslot->start_time->format('Y-m-d H:i'));
    }

    public function test_provider_can_update_both_start_time_and_duration(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => Carbon::now()->addDays(2)->setTime(10, 0),
            'duration_minutes' => 60,
            'status' => 'available',
        ]);

        $newStartTime = Carbon::now()->addDays(4)->setTime(15, 0);

        $response = $this->actingAs($this->provider)
            ->patch(route('provider.timeslots.update', $timeslot), [
                'start_time' => $newStartTime->format('Y-m-d\TH:i'),
                'duration_minutes' => 80,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $timeslot->refresh();
        $this->assertEquals($newStartTime->format('Y-m-d H:i'), $timeslot->start_time->format('Y-m-d H:i'));
        $this->assertEquals(80, $timeslot->duration_minutes);
    }

    public function test_provider_cannot_update_start_time_to_past(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => Carbon::now()->addDays(2)->setTime(10, 0),
            'duration_minutes' => 60,
            'status' => 'available',
        ]);

        $pastTime = Carbon::now()->subDay()->setTime(10, 0);

        $response = $this->actingAs($this->provider)
            ->patch(route('provider.timeslots.update', $timeslot), [
                'start_time' => $pastTime->format('Y-m-d\TH:i'),
                'duration_minutes' => 60,
            ]);

        $response->assertSessionHasErrors('start_time');
    }

    public function test_provider_cannot_update_to_create_overlap(): void
    {
        // Create an existing timeslot
        Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => Carbon::now()->addDays(3)->setTime(14, 0),
            'duration_minutes' => 60,
            'status' => 'available',
        ]);

        // Create the timeslot we'll try to move into the overlapping slot
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => Carbon::now()->addDays(5)->setTime(10, 0),
            'duration_minutes' => 60,
            'status' => 'available',
        ]);

        $response = $this->actingAs($this->provider)
            ->patch(route('provider.timeslots.update', $timeslot), [
                'start_time' => Carbon::now()->addDays(3)->setTime(14, 30)->format('Y-m-d\TH:i'),
                'duration_minutes' => 60,
            ]);

        $response->assertSessionHasErrors('start_time');
    }

    public function test_provider_can_update_own_booked_timeslot(): void
    {
        $timeslot = Timeslot::factory()->booked($this->client->id)->create([
            'provider_id' => $this->provider->id,
            'start_time' => Carbon::now()->addDays(2)->setTime(10, 0),
            'duration_minutes' => 60,
        ]);

        $newStartTime = Carbon::now()->addDays(3)->setTime(14, 0);

        $response = $this->actingAs($this->provider)
            ->patch(route('provider.timeslots.update', $timeslot), [
                'start_time' => $newStartTime->format('Y-m-d\TH:i'),
                'duration_minutes' => 120,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $timeslot->refresh();
        $this->assertEquals(120, $timeslot->duration_minutes);
        $this->assertEquals(TimeslotStatus::Booked, $timeslot->status);
    }

    public function test_provider_cannot_update_completed_timeslot(): void
    {
        $timeslot = Timeslot::factory()->completed($this->client->id)->create([
            'provider_id' => $this->provider->id,
        ]);

        $response = $this->actingAs($this->provider)
            ->patch(route('provider.timeslots.update', $timeslot), [
                'duration_minutes' => 120,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('error');
    }

    public function test_provider_cannot_update_another_providers_timeslot(): void
    {
        $otherProvider = User::factory()->create();
        $otherProvider->assignRole('service_provider');

        $timeslot = Timeslot::factory()->create([
            'provider_id' => $otherProvider->id,
            'start_time' => Carbon::now()->addDays(2)->setTime(10, 0),
            'duration_minutes' => 60,
            'status' => 'available',
        ]);

        $response = $this->actingAs($this->provider)
            ->patch(route('provider.timeslots.update', $timeslot), [
                'duration_minutes' => 120,
            ]);

        $response->assertForbidden();
    }

    public function test_client_cannot_update_timeslot(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => Carbon::now()->addDays(2)->setTime(10, 0),
            'duration_minutes' => 60,
            'status' => 'available',
        ]);

        $response = $this->actingAs($this->client)
            ->patch(route('provider.timeslots.update', $timeslot), [
                'duration_minutes' => 120,
            ]);

        $response->assertForbidden();
    }

    public function test_admin_can_update_any_available_timeslot(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => Carbon::now()->addDays(2)->setTime(10, 0),
            'duration_minutes' => 60,
            'status' => 'available',
        ]);

        $newStartTime = Carbon::now()->addDays(3)->setTime(16, 0);

        $response = $this->actingAs($admin)
            ->patch(route('provider.timeslots.update', $timeslot), [
                'start_time' => $newStartTime->format('Y-m-d\TH:i'),
                'duration_minutes' => 80,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $timeslot->refresh();
        $this->assertEquals(80, $timeslot->duration_minutes);
    }

    public function test_update_without_start_time_keeps_existing_start_time(): void
    {
        $originalStartTime = Carbon::now()->addDays(2)->setTime(10, 0);

        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => $originalStartTime,
            'duration_minutes' => 60,
            'status' => 'available',
        ]);

        $response = $this->actingAs($this->provider)
            ->patch(route('provider.timeslots.update', $timeslot), [
                'duration_minutes' => 80,
            ]);

        $response->assertRedirect();
        $timeslot->refresh();
        $this->assertEquals($originalStartTime->format('Y-m-d H:i'), $timeslot->start_time->format('Y-m-d H:i'));
        $this->assertEquals(80, $timeslot->duration_minutes);
    }

    public function test_provider_cannot_update_to_exact_same_time_as_another_timeslot(): void
    {
        $existingTime = Carbon::now()->addDays(3)->setTime(14, 0);

        Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => $existingTime,
            'duration_minutes' => 60,
            'status' => 'available',
        ]);

        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => Carbon::now()->addDays(5)->setTime(10, 0),
            'duration_minutes' => 60,
            'status' => 'available',
        ]);

        $response = $this->actingAs($this->provider)
            ->patch(route('provider.timeslots.update', $timeslot), [
                'start_time' => $existingTime->format('Y-m-d\TH:i'),
                'duration_minutes' => 60,
            ]);

        $response->assertSessionHasErrors('start_time');
    }

    public function test_provider_cannot_extend_duration_to_overlap_next_timeslot(): void
    {
        // Timeslot at 14:00-15:00
        Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => Carbon::now()->addDays(3)->setTime(14, 0),
            'duration_minutes' => 60,
            'status' => 'available',
        ]);

        // Timeslot at 13:00-14:00 — try to extend to 13:00-15:00 (overlap)
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => Carbon::now()->addDays(3)->setTime(13, 0),
            'duration_minutes' => 60,
            'status' => 'available',
        ]);

        $response = $this->actingAs($this->provider)
            ->patch(route('provider.timeslots.update', $timeslot), [
                'duration_minutes' => 120,
            ]);

        $response->assertSessionHasErrors('start_time');
    }

    public function test_provider_can_update_to_adjacent_non_overlapping_time(): void
    {
        // Existing timeslot at 14:00-15:00
        Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => Carbon::now()->addDays(3)->setTime(14, 0),
            'duration_minutes' => 60,
            'status' => 'available',
        ]);

        // Move timeslot to 15:00-16:00 (adjacent, no overlap)
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => Carbon::now()->addDays(5)->setTime(10, 0),
            'duration_minutes' => 60,
            'status' => 'available',
        ]);

        $response = $this->actingAs($this->provider)
            ->patch(route('provider.timeslots.update', $timeslot), [
                'start_time' => Carbon::now()->addDays(3)->setTime(15, 0)->format('Y-m-d\TH:i'),
                'duration_minutes' => 60,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    public function test_provider_cannot_create_overlapping_timeslot(): void
    {
        Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => Carbon::now()->addDays(3)->setTime(14, 0),
            'duration_minutes' => 60,
            'status' => 'available',
        ]);

        $response = $this->actingAs($this->provider)
            ->post(route('provider.timeslots.store'), [
                'start_time' => Carbon::now()->addDays(3)->setTime(14, 30)->format('Y-m-d\TH:i'),
                'duration_minutes' => 60,
            ]);

        $response->assertSessionHasErrors('start_time');
    }

    public function test_provider_can_create_adjacent_non_overlapping_timeslot(): void
    {
        Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => Carbon::now()->addDays(3)->setTime(14, 0),
            'duration_minutes' => 60,
            'status' => 'available',
        ]);

        $response = $this->actingAs($this->provider)
            ->post(route('provider.timeslots.store'), [
                'start_time' => Carbon::now()->addDays(3)->setTime(15, 0)->format('Y-m-d\TH:i'),
                'duration_minutes' => 60,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }
}
