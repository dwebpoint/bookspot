<?php

namespace Tests\Feature\Provider;

use App\Enums\ProviderClientStatus;
use App\Models\ClientNote;
use App\Models\ProviderClient;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClientNoteControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    /** @return array{User, User} */
    private function createProviderWithClient(): array
    {
        $provider = User::factory()->create();
        $provider->assignRole('service_provider');

        $client = User::factory()->create();
        $client->assignRole('client');

        ProviderClient::create([
            'provider_id' => $provider->id,
            'client_id' => $client->id,
            'created_by_provider' => true,
            'status' => ProviderClientStatus::Active,
        ]);

        return [$provider, $client];
    }

    public function test_provider_can_create_note_for_client(): void
    {
        [$provider, $client] = $this->createProviderWithClient();

        $response = $this->actingAs($provider)
            ->post(route('provider.clients.notes.store', $client), [
                'note_date' => '2026-04-17',
                'body' => 'Initial consultation went well.',
            ]);

        $response->assertRedirect(route('provider.clients.show', $client));
        $this->assertTrue(
            ClientNote::where('provider_id', $provider->id)
                ->where('client_id', $client->id)
                ->whereDate('note_date', '2026-04-17')
                ->where('body', 'Initial consultation went well.')
                ->exists(),
        );
    }

    public function test_provider_cannot_create_note_for_unlinked_client(): void
    {
        $provider = User::factory()->create();
        $provider->assignRole('service_provider');

        $unlinkedClient = User::factory()->create();
        $unlinkedClient->assignRole('client');

        $response = $this->actingAs($provider)
            ->post(route('provider.clients.notes.store', $unlinkedClient), [
                'note_date' => '2026-04-17',
                'body' => 'Should not be saved.',
            ]);

        $response->assertForbidden();
        $this->assertDatabaseEmpty('client_notes');
    }

    public function test_provider_can_update_own_note(): void
    {
        [$provider, $client] = $this->createProviderWithClient();

        $note = ClientNote::create([
            'provider_id' => $provider->id,
            'client_id' => $client->id,
            'note_date' => '2026-04-16',
            'body' => 'Original note.',
        ]);

        $response = $this->actingAs($provider)
            ->put(route('provider.clients.notes.update', [$client, $note]), [
                'note_date' => '2026-04-17',
                'body' => 'Updated note.',
            ]);

        $response->assertRedirect(route('provider.clients.show', $client));
        $this->assertTrue(
            ClientNote::where('id', $note->id)
                ->whereDate('note_date', '2026-04-17')
                ->where('body', 'Updated note.')
                ->exists(),
        );
    }

    public function test_provider_cannot_update_another_providers_note(): void
    {
        [$provider, $client] = $this->createProviderWithClient();

        $otherProvider = User::factory()->create();
        $otherProvider->assignRole('service_provider');

        $note = ClientNote::create([
            'provider_id' => $otherProvider->id,
            'client_id' => $client->id,
            'note_date' => '2026-04-16',
            'body' => 'Other provider note.',
        ]);

        $response = $this->actingAs($provider)
            ->put(route('provider.clients.notes.update', [$client, $note]), [
                'note_date' => '2026-04-17',
                'body' => 'Attempted overwrite.',
            ]);

        $response->assertForbidden();
        $this->assertDatabaseHas('client_notes', ['id' => $note->id, 'body' => 'Other provider note.']);
    }

    public function test_provider_can_delete_own_note(): void
    {
        [$provider, $client] = $this->createProviderWithClient();

        $note = ClientNote::create([
            'provider_id' => $provider->id,
            'client_id' => $client->id,
            'note_date' => '2026-04-16',
            'body' => 'To be deleted.',
        ]);

        $response = $this->actingAs($provider)
            ->delete(route('provider.clients.notes.destroy', [$client, $note]));

        $response->assertRedirect(route('provider.clients.show', $client));
        $this->assertDatabaseMissing('client_notes', ['id' => $note->id]);
    }

    public function test_notes_appear_on_client_show_page(): void
    {
        [$provider, $client] = $this->createProviderWithClient();

        ClientNote::create([
            'provider_id' => $provider->id,
            'client_id' => $client->id,
            'note_date' => '2026-04-15',
            'body' => 'First note.',
        ]);

        ClientNote::create([
            'provider_id' => $provider->id,
            'client_id' => $client->id,
            'note_date' => '2026-04-17',
            'body' => 'Second note.',
        ]);

        $response = $this->actingAs($provider)
            ->get(route('provider.clients.show', $client));

        $response->assertOk();
        $response->assertInertia(
            fn ($page) => $page
                ->component('Provider/Clients/Show')
                ->has('notes', 2)
                ->where('notes.0.note_date', '2026-04-17')
                ->where('notes.0.body', 'Second note.')
                ->where('notes.1.note_date', '2026-04-15')
                ->where('notes.1.body', 'First note.'),
        );
    }

    public function test_notes_not_visible_to_client(): void
    {
        [$provider, $client] = $this->createProviderWithClient();

        $response = $this->actingAs($client)
            ->get(route('provider.clients.show', $client));

        $response->assertForbidden();
    }
}
