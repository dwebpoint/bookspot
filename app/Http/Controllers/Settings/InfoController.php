<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateSiteSettingsRequest;
use App\Models\SiteSettings;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class InfoController extends Controller
{
    use AuthorizesRequests;

    public function edit(): Response
    {
        $this->authorize('manageSiteSettings');

        return Inertia::render('settings/info', [
            'contactEmail' => SiteSettings::get(SiteSettings::CONTACT_EMAIL),
        ]);
    }

    public function update(UpdateSiteSettingsRequest $request): RedirectResponse
    {
        $this->authorize('manageSiteSettings');

        SiteSettings::set(SiteSettings::CONTACT_EMAIL, $request->validated()['contact_email']);

        return to_route('info.edit');
    }
}
