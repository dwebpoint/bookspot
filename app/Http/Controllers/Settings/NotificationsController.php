<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateNotificationPreferencesRequest;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class NotificationsController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('settings/notifications');
    }

    public function update(UpdateNotificationPreferencesRequest $request): RedirectResponse
    {
        $request->user()->update($request->validated());

        return back()->with('success', 'Notification preferences saved.');
    }
}
