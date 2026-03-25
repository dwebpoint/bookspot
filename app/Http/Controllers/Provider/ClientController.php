<?php

namespace App\Http\Controllers\Provider;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreClientRequest;
use App\Models\ProviderClient;
use App\Models\Timeslot;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of the provider's clients.
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAnyClients');

        $search = $request->input('search');

        $query = auth()->user()->clients()
            ->select('users.id', 'users.name', 'users.email', 'users.created_at')
            ->withPivot('created_at')
            ->withCount('providers');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('users.name', 'like', "%{$search}%")
                    ->orWhere('users.email', 'like', "%{$search}%");
            });
        }

        $clients = $query->orderBy('provider_client.created_at', 'desc')->paginate(15);

        return Inertia::render('Provider/Clients/Index', [
            'clients' => $clients,
            'search' => $search,
        ]);
    }

    /**
     * Show the form for creating a new client.
     */
    public function create(): Response
    {
        $this->authorize('viewAnyClients');

        return Inertia::render('Provider/Clients/Create');
    }

    /**
     * Store a newly created client in storage.
     */
    public function store(StoreClientRequest $request): RedirectResponse
    {
        $this->authorize('createClient');

        try {
            DB::transaction(function () use ($request) {
                // Check if user with this email already exists
                $existingUser = User::where('email', $request->email)->first();

                if ($existingUser) {
                    // User exists - check if they're a client
                    if (! $existingUser->isClient()) {
                        throw new \Exception('A user with this email already exists with a different role.');
                    }

                    // Check if relationship already exists
                    if (auth()->user()->hasClient($existingUser->id)) {
                        throw new \Exception('This client is already linked to your account.');
                    }

                    // Create relationship with existing client
                    ProviderClient::create([
                        'provider_id' => auth()->id(),
                        'client_id' => $existingUser->id,
                        'created_by_provider' => true,
                        'status' => 'active',
                    ]);
                } else {
                    // Create new client user
                    $client = User::create([
                        'name' => $request->name,
                        'email' => $request->email,
                        'password' => Hash::make($request->password),
                        'role' => 'client',
                    ]);

                    $client->assignRole('client');

                    // Create provider-client relationship
                    ProviderClient::create([
                        'provider_id' => auth()->id(),
                        'client_id' => $client->id,
                        'created_by_provider' => true,
                        'status' => 'active',
                    ]);

                    // Send password reset link to new client
                    // Password::sendResetLink(['email' => $client->email]);
                }
            });

            return redirect()->route('provider.clients.index')
                ->with('success', 'Client added successfully!');
        } catch (\Exception $e) {
            return redirect()->back()
                ->withInput()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Show the specified client's details and all timeslots.
     */
    public function show(User $client): Response
    {
        $this->authorize('viewClient', $client);

        $pivot = auth()->user()->clients()
            ->where('users.id', $client->id)
            ->withPivot('created_at')
            ->first()
            ?->pivot;

        $timeslots = auth()->user()->timeslots()
            ->where('client_id', $client->id)
            ->orderBy('start_time', 'desc')
            ->get(['id', 'start_time', 'duration_minutes', 'status']);

        return Inertia::render('Provider/Clients/Show', [
            'client' => [
                ...$client->only(['id', 'name', 'email', 'created_at']),
                'added_at' => $pivot?->created_at,
            ],
            'timeslots' => $timeslots,
        ]);
    }

    /**
     * Show the form for editing the specified client.
     */
    public function edit(User $client): Response
    {
        $this->authorize('viewClient', $client);

        return Inertia::render('Provider/Clients/Edit', [
            'client' => $client->only(['id', 'name', 'email']),
        ]);
    }

    /**
     * Update the specified client in storage.
     */
    public function update(StoreClientRequest $request, User $client): RedirectResponse
    {
        $this->authorize('updateClient', $client);

        try {
            // Check if email is being changed to an existing email
            if ($request->email !== $client->email) {
                $existingUser = User::where('email', $request->email)
                    ->where('id', '!=', $client->id)
                    ->first();

                if ($existingUser) {
                    throw new \Exception('A user with this email already exists.');
                }
            }

            $client->update([
                'name' => $request->name,
                'email' => $request->email,
            ]);

            return redirect()->route('provider.clients.index')
                ->with('success', 'Client updated successfully!');
        } catch (\Exception $e) {
            return redirect()->back()
                ->withInput()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Remove the client relationship.
     */
    public function destroy(User $client): RedirectResponse
    {
        $this->authorize('deleteClient', $client);

        try {
            DB::transaction(function () use ($client) {
                // Verify the relationship exists
                if (! auth()->user()->hasClient($client->id)) {
                    throw new \Exception('This client is not linked to your account.');
                }

                // Cancel all future bookings for this client's timeslots with this provider
                $futureTimeslotIds = auth()->user()->timeslots()
                    ->where('start_time', '>', now())
                    ->pluck('id');

                if ($futureTimeslotIds->isNotEmpty()) {
                    Timeslot::whereIn('id', $futureTimeslotIds)
                        ->where('client_id', $client->id)
                        ->where('status', 'booked')
                        ->update(['status' => 'available']);
                }

                // Remove the relationship
                ProviderClient::where('provider_id', auth()->id())
                    ->where('client_id', $client->id)
                    ->delete();
            });

            return redirect()->route('provider.clients.index')
                ->with('success', 'Client removed from your list.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', $e->getMessage());
        }
    }
}
