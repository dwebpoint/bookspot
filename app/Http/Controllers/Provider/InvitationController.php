<?php

namespace App\Http\Controllers\Provider;

use App\Http\Controllers\Controller;
use App\Http\Requests\Provider\StoreInvitationRequest;
use App\Mail\ClientInvitation;
use App\Models\Invitation;
use App\Models\ProviderClient;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class InvitationController extends Controller
{
    public function store(StoreInvitationRequest $request): RedirectResponse
    {
        /** @var User $provider */
        $provider = auth()->user();
        $email = $request->email;

        // If the email belongs to an existing user, auto-link them
        $existingUser = User::where('email', $email)->first();

        if ($existingUser) {
            if (! $existingUser->isClient()) {
                return redirect()->back()
                    ->with('error', 'A user with this email already exists with a different role.');
            }

            if ($provider->hasClient($existingUser->id)) {
                return redirect()->back()
                    ->with('error', 'This client is already linked to your account.');
            }

            ProviderClient::create([
                'provider_id' => $provider->id,
                'client_id' => $existingUser->id,
                'created_by_provider' => true,
                'status' => 'active',
            ]);

            return redirect()->back()
                ->with('success', "{$existingUser->name} already has an account and has been linked to your profile.");
        }

        // Check for an existing pending invitation for this email + provider
        $alreadyPending = Invitation::where('provider_id', $provider->id)
            ->where('email', $email)
            ->pending()
            ->exists();

        if ($alreadyPending) {
            return redirect()->back()
                ->with('error', "An invitation has already been sent to {$email}.");
        }

        // Delete any previously expired/accepted invitations from this provider to this email
        Invitation::where('provider_id', $provider->id)
            ->where('email', $email)
            ->delete();

        $invitation = Invitation::create([
            'provider_id' => $provider->id,
            'email' => $email,
            'token' => Str::random(64),
            'expires_at' => now()->addDays(7),
        ]);

        Mail::to($email)->send(new ClientInvitation($invitation));

        return redirect()->back()
            ->with('success', "Invitation sent to {$email}.");
    }

    public function destroy(Invitation $invitation): RedirectResponse
    {
        /** @var User $provider */
        $provider = auth()->user();

        if ($invitation->provider_id !== $provider->id && ! $provider->isAdmin()) {
            abort(403);
        }

        $invitation->delete();

        return redirect()->back()
            ->with('success', 'Invitation cancelled.');
    }
}
