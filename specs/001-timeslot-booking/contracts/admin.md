# API Contracts: Admin Routes

**Purpose**: Define all Inertia routes for admin user management

---

## Route: GET /admin/users (List Users)

**Name**: `admin.users.index`  
**Access**: Admin only  
**Purpose**: View and manage all users

### Request
```http
GET /admin/users?role=&search=&page=1
```

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| role | string | No | Filter: admin, service_provider, client |
| search | string | No | Search by name or email |
| page | integer | No | Pagination page number |

### Response (Inertia Props)

**TypeScript Interface**:
```typescript
interface AdminUsersIndexProps extends PageProps {
    users: PaginatedResponse<User>;
    filters: {
        role?: 'admin' | 'service_provider' | 'client';
        search?: string;
    };
    stats: {
        total_users: number;
        admins: number;
        service_providers: number;
        clients: number;
    };
}

interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'service_provider' | 'client';
    timezone: string;
    created_at: string;
    email_verified_at: string | null;
    // For service providers
    timeslots_count?: number;
    // For clients
    bookings_count?: number;
}
```

**Laravel Controller**:
```php
public function index(Request $request): Response
{
    $this->authorize('viewAny', User::class);

    $query = User::query();

    if ($request->role) {
        $query->where('role', $request->role);
    }

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
```

---

## Route: GET /admin/users/create (Create User Form)

**Name**: `admin.users.create`  
**Access**: Admin only  
**Purpose**: Display user creation form

### Request
```http
GET /admin/users/create
```

### Response (Inertia Props)

**TypeScript Interface**:
```typescript
interface AdminUsersCreateProps extends PageProps {
    roles: Array<{
        value: string;
        label: string;
    }>;
    timezones: string[];
}
```

**Laravel Controller**:
```php
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
```

---

## Route: POST /admin/users (Store User)

**Name**: `admin.users.store`  
**Access**: Admin only  
**Purpose**: Create a new user

### Request
```http
POST /admin/users
Content-Type: application/json

{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePassword123!",
    "password_confirmation": "SecurePassword123!",
    "role": "client",
    "timezone": "America/New_York"
}
```

**Body Parameters**:
| Parameter | Type | Required | Validation |
|-----------|------|----------|------------|
| name | string | Yes | max:255 |
| email | string | Yes | email, unique:users,email |
| password | string | Yes | min:8, confirmed |
| password_confirmation | string | Yes | same:password |
| role | string | Yes | in:admin,service_provider,client |
| timezone | string | No | in:timezone_identifiers_list() |

### Response

**Success (302 Redirect)**:
```
Redirect to: /admin/users
Flash: { success: "User created successfully!" }
```

**Error (422 Validation)**:
```json
{
    "errors": {
        "email": ["The email has already been taken."],
        "password": ["The password confirmation does not match."]
    }
}
```

**TypeScript (Form Handling)**:
```typescript
import { useForm } from '@inertiajs/react';

const { data, setData, post, processing, errors } = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'client',
    timezone: 'UTC',
});

const submit = (e: FormEvent) => {
    e.preventDefault();
    post(route('admin.users.store'));
};
```

**Laravel Controller**:
```php
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
```

---

## Route: GET /admin/users/{user}/edit (Edit User Form)

**Name**: `admin.users.edit`  
**Access**: Admin only  
**Purpose**: Display user edit form

### Request
```http
GET /admin/users/123/edit
```

### Response (Inertia Props)

**TypeScript Interface**:
```typescript
interface AdminUsersEditProps extends PageProps {
    user: User;
    roles: Array<{
        value: string;
        label: string;
    }>;
    timezones: string[];
}

interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'service_provider' | 'client';
    timezone: string;
    created_at: string;
}
```

**Laravel Controller**:
```php
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
```

---

## Route: PUT /admin/users/{user} (Update User)

**Name**: `admin.users.update`  
**Access**: Admin only  
**Purpose**: Update user information

### Request
```http
PUT /admin/users/123
Content-Type: application/json

{
    "name": "John Doe Updated",
    "email": "john.updated@example.com",
    "role": "service_provider",
    "timezone": "America/New_York",
    "password": "",  // Optional - leave empty to keep current password
    "password_confirmation": ""
}
```

**Body Parameters**:
| Parameter | Type | Required | Validation |
|-----------|------|----------|------------|
| name | string | Yes | max:255 |
| email | string | Yes | email, unique:users,email,{id} |
| role | string | Yes | in:admin,service_provider,client |
| timezone | string | No | in:timezone_identifiers_list() |
| password | string | No | nullable, min:8, confirmed |
| password_confirmation | string | No (if password) | same:password |

### Response

**Success (302 Redirect)**:
```
Redirect to: /admin/users
Flash: { success: "User updated successfully!" }
```

**Laravel Controller**:
```php
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
```

---

## Route: DELETE /admin/users/{user} (Delete User)

**Name**: `admin.users.destroy`  
**Access**: Admin only  
**Purpose**: Delete a user (cascades to timeslots/bookings)

### Request
```http
DELETE /admin/users/123
```

### Authorization
```php
// UserPolicy
public function delete(User $user, User $model): bool
{
    // Admin cannot delete themselves
    return $user->isAdmin() && $user->id !== $model->id;
}
```

### Response

**Success (302 Redirect)**:
```
Redirect to: /admin/users
Flash: { success: "User deleted successfully." }
```

**Error (403 Forbidden)**:
```json
{
    "message": "You cannot delete yourself."
}
```

**Laravel Controller**:
```php
public function destroy(User $user): RedirectResponse
{
    $this->authorize('delete', $user);

    $user->delete(); // Cascades to timeslots and bookings

    return redirect()->route('admin.users.index')
        ->with('success', 'User deleted successfully.');
}
```

---

## Route: GET /admin/users/{user} (View User Details)

**Name**: `admin.users.show`  
**Access**: Admin only  
**Purpose**: View detailed user information and activity

### Request
```http
GET /admin/users/123
```

### Response (Inertia Props)

**TypeScript Interface**:
```typescript
interface AdminUsersShowProps extends PageProps {
    user: User;
    timeslots?: Timeslot[]; // If service provider
    bookings?: Booking[]; // If client
    stats: {
        total_timeslots?: number;
        active_timeslots?: number;
        total_bookings?: number;
        active_bookings?: number;
    };
}
```

**Laravel Controller**:
```php
public function show(User $user): Response
{
    $this->authorize('view', $user);

    $data = [
        'user' => $user,
        'stats' => [],
    ];

    if ($user->isServiceProvider()) {
        $data['timeslots'] = $user->timeslots()
            ->with('booking.client')
            ->latest()
            ->limit(10)
            ->get();
        $data['stats'] = [
            'total_timeslots' => $user->timeslots()->count(),
            'active_timeslots' => $user->timeslots()->future()->count(),
        ];
    }

    if ($user->isClient()) {
        $data['bookings'] = $user->bookings()
            ->with('timeslot.provider')
            ->latest()
            ->limit(10)
            ->get();
        $data['stats'] = [
            'total_bookings' => $user->bookings()->count(),
            'active_bookings' => $user->bookings()->confirmed()->count(),
        ];
    }

    return Inertia::render('Admin/Users/Show', $data);
}
```

---

## Summary of Admin Routes

| Method | URI | Name | Access | Purpose |
|--------|-----|------|--------|---------|
| GET | /admin/users | admin.users.index | Admin | List all users |
| GET | /admin/users/create | admin.users.create | Admin | Create user form |
| POST | /admin/users | admin.users.store | Admin | Store new user |
| GET | /admin/users/{id} | admin.users.show | Admin | View user details |
| GET | /admin/users/{id}/edit | admin.users.edit | Admin | Edit user form |
| PUT | /admin/users/{id} | admin.users.update | Admin | Update user |
| DELETE | /admin/users/{id} | admin.users.destroy | Admin | Delete user |

---

## Admin Acting on Behalf of Service Provider

**Implementation Strategy**: Admin can view and manage any service provider's timeslots by accessing the same routes with policy overrides.

```php
// TimeslotPolicy
public function viewAny(User $user): bool
{
    return $user->isServiceProvider() || $user->isAdmin();
}

public function create(User $user): bool
{
    return $user->isServiceProvider() || $user->isAdmin();
}

public function delete(User $user, Timeslot $timeslot): bool
{
    return $user->id === $timeslot->provider_id || $user->isAdmin();
}
```

Admin can access `/provider/timeslots` with a query parameter to act on behalf:
```http
GET /provider/timeslots?provider_id=123
```

Or create a dedicated admin route:
```http
GET /admin/providers/{provider}/timeslots
```
