<?php

namespace Tests\Feature\Admin;

use App\Models\SiteSettings;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InfoControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->admin = User::factory()->admin()->create();
    }

    public function test_admin_can_view_info_page_with_contact_email(): void
    {
        SiteSettings::set(SiteSettings::CONTACT_EMAIL, 'test@example.com');

        $response = $this->actingAs($this->admin)->get('/settings/info');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('settings/info')
            ->where('contactEmail', 'test@example.com')
        );
    }

    public function test_info_page_shows_empty_contact_email_when_not_configured(): void
    {
        $response = $this->actingAs($this->admin)->get('/settings/info');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('settings/info')
            ->where('contactEmail', '')
        );
    }

    public function test_admin_can_update_contact_email(): void
    {
        $response = $this->actingAs($this->admin)->patch('/settings/info', [
            'contact_email' => 'newcontact@example.com',
        ]);

        $response->assertRedirect('/settings/info');
        $this->assertSame('newcontact@example.com', SiteSettings::get(SiteSettings::CONTACT_EMAIL));
    }

    public function test_contact_email_must_be_valid(): void
    {
        $response = $this->actingAs($this->admin)->patch('/settings/info', [
            'contact_email' => 'not-an-email',
        ]);

        $response->assertSessionHasErrors('contact_email');
    }

    public function test_non_admin_cannot_access_info_page(): void
    {
        $provider = User::factory()->serviceProvider()->create();

        $response = $this->actingAs($provider)->get('/settings/info');
        $response->assertStatus(403);
    }

    public function test_non_admin_cannot_update_site_settings(): void
    {
        $provider = User::factory()->serviceProvider()->create();

        $response = $this->actingAs($provider)->patch('/settings/info', [
            'contact_email' => 'hacked@example.com',
        ]);

        $response->assertStatus(403);
    }
}
