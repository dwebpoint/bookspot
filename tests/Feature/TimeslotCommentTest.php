<?php

namespace Tests\Feature;

use App\Enums\TimeslotStatus;
use App\Models\Timeslot;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TimeslotCommentTest extends TestCase
{
    use RefreshDatabase;

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
        $this->provider->clients()->attach($this->client->id, [
            'created_by_provider' => true,
            'status' => 'active',
        ]);

        $this->otherClient = User::factory()->create();
        $this->otherClient->assignRole('client');
    }

    public function test_provider_can_create_timeslot_with_comment(): void
    {
        $startTime = Carbon::now()->addDays(2)->setTime(10, 0);

        $response = $this->actingAs($this->provider)
            ->post(route('provider.timeslots.store'), [
                'start_time' => $startTime->format('Y-m-d\TH:i'),
                'duration_minutes' => 60,
                'comment' => 'Initial consultation',
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('timeslots', [
            'provider_id' => $this->provider->id,
            'comment' => 'Initial consultation',
        ]);
    }

    public function test_provider_can_create_timeslot_without_comment(): void
    {
        $startTime = Carbon::now()->addDays(2)->setTime(10, 0);

        $response = $this->actingAs($this->provider)
            ->post(route('provider.timeslots.store'), [
                'start_time' => $startTime->format('Y-m-d\TH:i'),
                'duration_minutes' => 60,
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('timeslots', [
            'provider_id' => $this->provider->id,
            'comment' => null,
        ]);
    }

    public function test_provider_can_update_comment_on_own_timeslot(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => Carbon::now()->addDays(2)->setTime(10, 0),
            'duration_minutes' => 60,
            'status' => TimeslotStatus::Available,
        ]);

        $response = $this->actingAs($this->provider)
            ->patch(route('timeslots.updateComment', $timeslot), [
                'comment' => 'Updated comment',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertDatabaseHas('timeslots', [
            'id' => $timeslot->id,
            'comment' => 'Updated comment',
        ]);
    }

    public function test_client_can_update_comment_on_their_booked_timeslot(): void
    {
        $timeslot = Timeslot::factory()->booked($this->client->id)->create([
            'provider_id' => $this->provider->id,
            'start_time' => Carbon::now()->addDays(2)->setTime(10, 0),
        ]);

        $response = $this->actingAs($this->client)
            ->patch(route('timeslots.updateComment', $timeslot), [
                'comment' => 'Client note',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertDatabaseHas('timeslots', [
            'id' => $timeslot->id,
            'comment' => 'Client note',
        ]);
    }

    public function test_client_cannot_update_comment_on_others_timeslot(): void
    {
        $timeslot = Timeslot::factory()->booked($this->client->id)->create([
            'provider_id' => $this->provider->id,
            'start_time' => Carbon::now()->addDays(2)->setTime(10, 0),
        ]);

        $response = $this->actingAs($this->otherClient)
            ->patch(route('timeslots.updateComment', $timeslot), [
                'comment' => 'Unauthorized comment',
            ]);

        $response->assertForbidden();
    }

    public function test_comment_can_be_cleared(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => Carbon::now()->addDays(2)->setTime(10, 0),
            'duration_minutes' => 60,
            'comment' => 'Some comment',
        ]);

        $response = $this->actingAs($this->provider)
            ->patch(route('timeslots.updateComment', $timeslot), [
                'comment' => null,
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('timeslots', [
            'id' => $timeslot->id,
            'comment' => null,
        ]);
    }

    public function test_comment_max_length_validation(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => Carbon::now()->addDays(2)->setTime(10, 0),
            'duration_minutes' => 60,
        ]);

        $response = $this->actingAs($this->provider)
            ->patch(route('timeslots.updateComment', $timeslot), [
                'comment' => str_repeat('a', 1001),
            ]);

        $response->assertSessionHasErrors('comment');
    }

    public function test_provider_can_update_timeslot_with_comment(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => Carbon::now()->addDays(2)->setTime(10, 0),
            'duration_minutes' => 60,
            'status' => TimeslotStatus::Available,
        ]);

        $response = $this->actingAs($this->provider)
            ->patch(route('provider.timeslots.update', $timeslot), [
                'duration_minutes' => 90,
                'comment' => 'Extended session',
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('timeslots', [
            'id' => $timeslot->id,
            'duration_minutes' => 90,
            'comment' => 'Extended session',
        ]);
    }

    public function test_admin_can_update_comment_on_any_timeslot(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'start_time' => Carbon::now()->addDays(2)->setTime(10, 0),
            'duration_minutes' => 60,
        ]);

        $response = $this->actingAs($admin)
            ->patch(route('timeslots.updateComment', $timeslot), [
                'comment' => 'Admin note',
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('timeslots', [
            'id' => $timeslot->id,
            'comment' => 'Admin note',
        ]);
    }

    public function test_comment_is_cleared_when_client_unbooks_timeslot(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'client_id' => $this->client->id,
            'start_time' => Carbon::now()->addDays(2)->setTime(10, 0),
            'duration_minutes' => 60,
            'status' => TimeslotStatus::Booked,
            'comment' => 'Please bring documents',
        ]);

        $response = $this->actingAs($this->client)
            ->delete(route('timeslots.destroy', $timeslot));

        $response->assertRedirect();
        $this->assertDatabaseHas('timeslots', [
            'id' => $timeslot->id,
            'status' => TimeslotStatus::Available->value,
            'client_id' => null,
            'comment' => null,
        ]);
    }

    public function test_comment_is_cleared_when_provider_removes_client(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'client_id' => $this->client->id,
            'start_time' => Carbon::now()->addDays(2)->setTime(10, 0),
            'duration_minutes' => 60,
            'status' => TimeslotStatus::Booked,
            'comment' => 'Important notes here',
        ]);

        $response = $this->actingAs($this->provider)
            ->delete(route('provider.timeslots.remove', $timeslot));

        $response->assertRedirect();
        $this->assertDatabaseHas('timeslots', [
            'id' => $timeslot->id,
            'status' => TimeslotStatus::Available->value,
            'client_id' => null,
            'comment' => null,
        ]);
    }

    public function test_comment_is_cleared_when_timeslot_reassigned_to_another_client(): void
    {
        $this->provider->clients()->attach($this->otherClient->id, [
            'created_by_provider' => true,
            'status' => 'active',
        ]);

        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'client_id' => $this->client->id,
            'start_time' => Carbon::now()->addDays(2)->setTime(10, 0),
            'duration_minutes' => 60,
            'status' => TimeslotStatus::Booked,
            'comment' => 'Notes for original client',
        ]);

        $response = $this->actingAs($this->provider)
            ->post(route('provider.timeslots.assign', $timeslot), [
                'client_id' => $this->otherClient->id,
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('timeslots', [
            'id' => $timeslot->id,
            'client_id' => $this->otherClient->id,
            'comment' => null,
        ]);
    }

    public function test_comment_is_preserved_when_reassigning_same_client(): void
    {
        $timeslot = Timeslot::factory()->create([
            'provider_id' => $this->provider->id,
            'client_id' => $this->client->id,
            'start_time' => Carbon::now()->addDays(2)->setTime(10, 0),
            'duration_minutes' => 60,
            'status' => TimeslotStatus::Booked,
            'comment' => 'Keep this note',
        ]);

        $response = $this->actingAs($this->provider)
            ->post(route('provider.timeslots.assign', $timeslot), [
                'client_id' => $this->client->id,
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('timeslots', [
            'id' => $timeslot->id,
            'client_id' => $this->client->id,
            'comment' => 'Keep this note',
        ]);
    }
}
