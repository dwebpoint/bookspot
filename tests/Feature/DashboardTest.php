<?php

namespace Tests\Feature;

use App\Models\Timeslot;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
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
        $this->seed(RolesAndPermissionsSeeder::class);

        $provider = User::factory()->serviceProvider()->create();

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

    public function test_admin_dashboard_returns_admin_stats(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->get(route('dashboard'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('stats.role', 'admin')
            ->has('stats.total_users')
            ->has('stats.total_providers')
            ->has('stats.total_clients')
            ->has('stats.active_bookings')
            ->has('stats.available_slots')
            ->has('stats.completed_today')
        );
    }

    public function test_admin_stats_count_roles_accurately(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $admin = User::factory()->admin()->create();
        User::factory()->serviceProvider()->count(2)->create();
        User::factory()->client()->count(3)->create();

        $response = $this->actingAs($admin)->get(route('dashboard'));

        $response->assertInertia(fn ($page) => $page
            ->where('stats.total_providers', 2)
            ->where('stats.total_clients', 3)
        );
    }

    public function test_admin_stats_count_active_bookings(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $admin = User::factory()->admin()->create();
        Timeslot::factory()->booked()->count(2)->create();
        Timeslot::factory()->count(1)->create(); // available, not booked

        $response = $this->actingAs($admin)->get(route('dashboard'));

        $response->assertInertia(fn ($page) => $page
            ->where('stats.active_bookings', 2)
        );
    }
}
