<?php

namespace Tests\Feature;

use Tests\TestCase;

class SeoTechnicalTest extends TestCase
{
    public function test_home_page_exposes_seo_related_props_for_the_welcome_page(): void
    {
        $response = $this->get(route('home'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('welcome')
            ->where('appUrl', rtrim(config('app.url'), '/'))
            ->where('seoImageUrl', rtrim(config('app.url'), '/').config('seo.default_image_path'))
        );
    }

    public function test_sitemap_xml_is_available_and_lists_public_pages(): void
    {
        $response = $this->get(route('sitemap'));

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/xml');
        $response->assertSee('<?xml version="1.0" encoding="UTF-8"?>', false);
        $response->assertSee(route('home'), false);
        $response->assertSee(route('contact.show'), false);
    }

    public function test_robots_endpoint_references_the_sitemap(): void
    {
        $response = $this->get(route('robots'));

        $response->assertOk();
        $response->assertHeader('Content-Type', 'text/plain; charset=UTF-8');
        $response->assertSee('Sitemap: '.rtrim(config('app.url'), '/').'/sitemap.xml');
        $response->assertSee('Disallow: /dashboard');
    }
}
