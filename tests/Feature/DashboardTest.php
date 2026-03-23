<?php

namespace Tests\Feature;

use App\Models\Timeslot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $this->get(route('dashboard'))->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $this->actingAs($user = User::factory()->create());

        $this->get(route('dashboard'))->assertOk();
    }

    public function test_provider_dashboard_includes_completed_count(): void
    {
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

        $provider = User::factory()->create(['role' => 'service_provider']);
        $provider->assignRole('service_provider');

        Timeslot::factory()->count(3)->completed()->create(['provider_id' => $provider->id]);
        Timeslot::factory()->count(2)->create(['provider_id' => $provider->id]); // available

        $response = $this->actingAs($provider)->get(route('dashboard'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('stats.role', 'service_provider')
            ->where('stats.completed_count', 3)
            ->has('stats.completed_heatmap')
        );
    }
}
