<?php

namespace App\Http\Controllers;

use App\Enums\ProviderClientStatus;
use App\Models\Invitation;
use App\Models\ProviderClient;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class InvitationRegistrationController extends Controller
{
    public function show(string $token): Response|RedirectResponse
    {
        $invitation = Invitation::where('token', $token)->first();

        if (! $invitation) {
            abort(404);
        }

        if ($invitation->isExpired()) {
            return Inertia::render('Invitation/Invalid', ['reason' => 'expired']);
        }

        return Inertia::render('Invitation/Register', [
            'email' => $invitation->email,
            'token' => $invitation->token,
            'providerName' => $invitation->provider->name,
        ]);
    }

    public function register(Request $request, string $token): RedirectResponse
    {
        $invitation = Invitation::where('token', $token)->first();

        if (! $invitation) {
            abort(404);
        }

        if ($invitation->isExpired()) {
            return redirect()->route('invitation.show', $token);
        }

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $invitation->email,
            'password' => Hash::make($request->password),
        ]);

        $user->assignRole('client');

        ProviderClient::create([
            'provider_id' => $invitation->provider_id,
            'client_id' => $user->id,
            'created_by_provider' => false,
            'status' => ProviderClientStatus::Active,
        ]);

        $invitation->delete();

        Auth::login($user);

        return redirect()->route('dashboard');
    }
}
