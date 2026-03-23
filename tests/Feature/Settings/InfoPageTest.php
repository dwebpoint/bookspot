<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InfoPageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_admin_can_view_info_page(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)
            ->get(route('info.edit'))
            ->assertOk();
    }

    public function test_service_provider_cannot_access_info_page(): void
    {
        $provider = User::factory()->create();
        $provider->assignRole('service_provider');

        $this->actingAs($provider)
            ->get(route('info.edit'))
            ->assertForbidden();
    }

    public function test_client_cannot_access_info_page(): void
    {
        $client = User::factory()->create();
        $client->assignRole('client');

        $this->actingAs($client)
            ->get(route('info.edit'))
            ->assertForbidden();
    }

    public function test_unauthenticated_user_is_redirected(): void
    {
        $this->get(route('info.edit'))
            ->assertRedirect(route('login'));
    }
}
