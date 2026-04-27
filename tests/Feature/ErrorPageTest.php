<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ErrorPageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
        config(['app.debug' => false]);
    }

    public function test_404_renders_error_page(): void
    {
        $response = $this->get('/nonexistent-page-xyz');

        $response->assertStatus(404);
        $response->assertInertia(fn ($page) => $page
            ->component('Error')
            ->where('status', 404),
        );
    }

    public function test_403_renders_error_page(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/admin/users');

        $response->assertStatus(403);
        $response->assertInertia(fn ($page) => $page
            ->component('Error')
            ->where('status', 403),
        );
    }

    public function test_405_renders_error_page_for_wrong_method(): void
    {
        // PATCH-only route accessed via GET should return 405, not crash
        $user = User::factory()->create();
        $user->assignRole('service_provider');

        $response = $this->actingAs($user)->get('/timeslots/999/complete');

        $response->assertStatus(405);
        $response->assertInertia(fn ($page) => $page
            ->component('Error')
            ->where('status', 405),
        );
    }

    public function test_inertia_request_gets_error_page_even_with_debug_enabled(): void
    {
        config(['app.debug' => true]);

        $response = $this->withHeaders([
            'X-Inertia' => 'true',
            'X-Inertia-Version' => '',
        ])->get('/nonexistent-page-xyz');

        $response->assertStatus(404);
        $response->assertHeader('X-Inertia', 'true');
        $response->assertJson(['component' => 'Error', 'props' => ['status' => 404]]);
    }
}
