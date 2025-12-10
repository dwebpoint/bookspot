<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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

        $query = User::query();

        // Filter by role if specified
        if ($request->role) {
            $query->where('role', $request->role);
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

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => $request->only(['role', 'search']),
            'stats' => [
                'total_users' => User::count(),
                'admins' => User::where('role', 'admin')->count(),
                'service_providers' => User::where('role', 'service_provider')->count(),
                'clients' => User::where('role', 'client')->count(),
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

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'timezone' => $request->timezone ?? 'UTC',
        ]);

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
                'active_bookings' => $user->bookedTimeslots()->where('status', 'booked')->count(),
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
            'role' => $request->role,
            'timezone' => $request->timezone ?? $user->timezone,
        ];

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return redirect()->route('admin.users.index')
            ->with('success', 'User updated successfully!');
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
