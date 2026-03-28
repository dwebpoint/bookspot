<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ProviderClientStatus;
use App\Enums\TimeslotStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\ProviderClient;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of users.
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', User::class);

        $query = User::query()->with('roles');

        // Filter by Spatie role
        if ($request->role === 'none') {
            $query->whereDoesntHave('roles');
        } elseif ($request->role) {
            $query->role($request->role);
        }

        // Search by name or email
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('email', 'like', "%{$request->search}%");
            });
        }

        $users = $query->withCount(['timeslots'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        $serviceProviders = User::role('service_provider')->orderBy('name')->get(['id', 'name', 'email']);

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => $request->only(['role', 'search']),
            'serviceProviders' => $serviceProviders,
            'stats' => [
                'total_users' => User::count(),
                'admins' => User::role('admin')->count(),
                'service_providers' => User::role('service_provider')->count(),
                'clients' => User::role('client')->count(),
                'no_role' => User::whereDoesntHave('roles')->count(),
            ],
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create(): Response
    {
        $this->authorize('create', User::class);

        return Inertia::render('Admin/Users/Create', [
            'roles' => [
                ['value' => 'client', 'label' => 'Client'],
                ['value' => 'service_provider', 'label' => 'Service Provider'],
                ['value' => 'admin', 'label' => 'Admin'],
            ],
            'timezones' => timezone_identifiers_list(),
        ]);
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(StoreUserRequest $request): RedirectResponse
    {
        $this->authorize('create', User::class);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'timezone' => $request->timezone ?? 'UTC',
        ]);

        $user->syncRoles([$request->role]);

        return redirect()->route('admin.users.index')
            ->with('success', 'User created successfully!');
    }

    /**
     * Display the specified user.
     */
    public function show(User $user): Response
    {
        $this->authorize('view', $user);

        $data = [
            'user' => $user,
            'stats' => [],
        ];

        if ($user->isServiceProvider()) {
            $data['timeslots'] = $user->timeslots()
                ->with('client')
                ->latest()
                ->limit(10)
                ->get();
            $data['stats'] = [
                'total_timeslots' => $user->timeslots()->count(),
                'active_timeslots' => $user->timeslots()->future()->count(),
            ];
        }

        if ($user->isClient()) {
            $data['bookedTimeslots'] = $user->bookedTimeslots()
                ->with('provider')
                ->latest()
                ->limit(10)
                ->get();
            $data['stats'] = [
                'total_bookings' => $user->bookedTimeslots()->count(),
                'active_bookings' => $user->bookedTimeslots()->where('status', TimeslotStatus::Booked)->count(),
            ];
        }

        return Inertia::render('Admin/Users/Show', $data);
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit(User $user): Response
    {
        $this->authorize('update', $user);

        return Inertia::render('Admin/Users/Edit', [
            'user' => $user,
            'roles' => [
                ['value' => 'client', 'label' => 'Client'],
                ['value' => 'service_provider', 'label' => 'Service Provider'],
                ['value' => 'admin', 'label' => 'Admin'],
            ],
            'timezones' => timezone_identifiers_list(),
        ]);
    }

    /**
     * Update the specified user in storage.
     */
    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $this->authorize('update', $user);

        $data = [
            'name' => $request->name,
            'email' => $request->email,
            'timezone' => $request->timezone ?? $user->timezone,
        ];

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);
        $user->syncRoles([$request->role]);

        return redirect()->route('admin.users.index')
            ->with('success', 'User updated successfully!');
    }

    /**
     * Update a user's role inline (from the index page).
     */
    public function updateRole(Request $request, User $user): RedirectResponse
    {
        $this->authorize('update', $user);

        $validated = $request->validate([
            'role' => ['required', 'string', Rule::in(['admin', 'service_provider', 'client'])],
        ]);

        $user->syncRoles([$validated['role']]);

        return redirect()->route('admin.users.index')
            ->with('success', "Role updated for {$user->name}.");
    }

    /**
     * Attach a user (client) to a service provider.
     */
    public function attachProvider(Request $request, User $user): RedirectResponse
    {
        $this->authorize('update', $user);

        $validated = $request->validate([
            'provider_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $provider = User::findOrFail($validated['provider_id']);

        if (! $provider->hasRole('service_provider')) {
            return redirect()->route('admin.users.index')
                ->with('error', 'Selected user is not a service provider.');
        }

        if ($user->id === $provider->id) {
            return redirect()->route('admin.users.index')
                ->with('error', 'Cannot attach a user to themselves.');
        }

        $exists = ProviderClient::where('provider_id', $provider->id)
            ->where('client_id', $user->id)
            ->exists();

        if ($exists) {
            return redirect()->route('admin.users.index')
                ->with('error', "{$user->name} is already linked to {$provider->name}.");
        }

        ProviderClient::create([
            'provider_id' => $provider->id,
            'client_id' => $user->id,
            'created_by_provider' => false,
            'status' => ProviderClientStatus::Active,
        ]);

        return redirect()->route('admin.users.index')
            ->with('success', "{$user->name} linked to {$provider->name}.");
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(User $user): RedirectResponse
    {
        $this->authorize('delete', $user);

        $user->delete();

        return redirect()->route('admin.users.index')
            ->with('success', 'User deleted successfully.');
    }
}
