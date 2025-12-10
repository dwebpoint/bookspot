# Phase 0: Research - Timeslot Booking Management System

**Date**: 2025-11-22  
**Purpose**: Technical research to inform implementation decisions

## 1. Laravel Role-Based Authorization

### Approach: Policies + Gates

**Decision**: Use **Laravel Policies** for resource-based authorization (timeslots, bookings) and **string-based roles** stored in users table.

**Rationale**:
- Policies provide clean authorization logic per model
- Built-in Laravel feature, no extra dependencies needed
- Easy to test with `$this->actingAs($user)` in tests

**Implementation Pattern**:
```php
// Users table: add 'role' enum column
Schema::table('users', function (Blueprint $table) {
    $table->enum('role', ['admin', 'service_provider', 'client'])->default('client');
});

// Policy example: TimeslotPolicy
public function create(User $user): bool {
    return $user->role === 'service_provider' || $user->role === 'admin';
}

// Controller usage
$this->authorize('create', Timeslot::class);
```

**Middleware Strategy**:
- Create `CheckRole` middleware for route-level protection
- Use policies in controllers for fine-grained authorization
- Admin can impersonate service providers via policy checks

### Alternative Considered: Spatie Laravel-Permission
**Rejected because**: Adds unnecessary complexity for 3 simple roles. String enum is sufficient and more performant.

---

## 2. Timezone Handling

### Approach: Store UTC, Display Local

**Decision**: Store all timeslot dates/times in **UTC** in database, convert to user timezone in frontend.

**Implementation Pattern**:
```php
// Database: use datetime columns (stored as UTC by Laravel)
Schema::create('timeslots', function (Blueprint $table) {
    $table->dateTime('start_time'); // UTC
    $table->integer('duration_minutes');
});

// Model accessor (if needed for API)
protected function startTime(): Attribute {
    return Attribute::make(
        get: fn ($value) => Carbon::parse($value)->timezone(auth()->user()->timezone ?? 'UTC')
    );
}
```

**Frontend Handling**:
```typescript
// Use browser's Intl API or date-fns with timezone support
const localTime = new Date(timeslot.start_time); // Auto converts to local
// Or use date-fns-tz for explicit timezone conversion
```

**User Timezone Storage**:
- Add `timezone` column to users table (optional, defaults to UTC or system default)
- Or detect timezone in frontend and send with requests (simpler for MVP)

**Rationale**: UTC storage prevents DST issues and allows users in different timezones to book slots correctly.

---

## 3. Preventing Double-Booking

### Approach: Database Constraints + Application Logic

**Decision**: Use **unique constraint** on `timeslot_id` in bookings table + pessimistic locking during booking transaction.

**Implementation Pattern**:
```php
// Migration: Ensure one booking per timeslot
Schema::create('bookings', function (Blueprint $table) {
    $table->id();
    $table->foreignId('timeslot_id')->constrained()->onDelete('cascade');
    $table->foreignId('client_id')->constrained('users')->onDelete('cascade');
    $table->enum('status', ['confirmed', 'cancelled'])->default('confirmed');
    $table->timestamps();
    
    // Unique constraint: one active booking per timeslot
    $table->unique(['timeslot_id', 'status']); // Only if status = 'confirmed'
});

// Better approach: Single booking per timeslot (simpler)
Schema::create('bookings', function (Blueprint $table) {
    $table->id();
    $table->foreignId('timeslot_id')->unique()->constrained()->onDelete('cascade');
    $table->foreignId('client_id')->constrained('users')->onDelete('cascade');
    $table->timestamps();
    $table->softDeletes(); // For cancellations
});

// Booking Action with pessimistic locking
DB::transaction(function () use ($timeslotId, $clientId) {
    $timeslot = Timeslot::where('id', $timeslotId)
        ->whereDoesntHave('booking') // Check no active booking
        ->lockForUpdate() // Pessimistic lock
        ->firstOrFail();
    
    Booking::create([
        'timeslot_id' => $timeslotId,
        'client_id' => $clientId,
    ]);
});
```

**Additional Validation**:
- Check timeslot hasn't passed: `start_time > now()`
- Check timeslot belongs to a service provider
- Frontend shows only available slots (join query excluding booked)

**Rationale**: Database unique constraint is the final defense against race conditions. Pessimistic locking prevents concurrent bookings. Application logic provides user-friendly error messages.

---

## 4. Preventing Overlapping Timeslots (Service Provider)

### Approach: Validation Rule with Database Query

**Decision**: Validate in `StoreTimeslotRequest` by querying existing timeslots for the provider.

**Implementation Pattern**:
```php
// StoreTimeslotRequest validation
public function rules(): array {
    return [
        'start_time' => [
            'required',
            'date',
            'after:now',
            function ($attribute, $value, $fail) {
                $endTime = Carbon::parse($value)->addMinutes($this->duration_minutes);
                
                $overlap = Timeslot::where('provider_id', auth()->id())
                    ->where(function ($query) use ($value, $endTime) {
                        $query->whereBetween('start_time', [$value, $endTime])
                            ->orWhere(function ($q) use ($value) {
                                $q->where('start_time', '<=', $value)
                                  ->whereRaw('DATE_ADD(start_time, INTERVAL duration_minutes MINUTE) > ?', [$value]);
                            });
                    })
                    ->exists();
                
                if ($overlap) {
                    $fail('This timeslot overlaps with an existing timeslot.');
                }
            },
        ],
        'duration_minutes' => 'required|integer|min:15|max:480',
    ];
}
```

**Alternative**: Database check constraint (more complex, less flexible)

**Rationale**: Application-level validation provides clear error messages and is easier to maintain than database constraints for complex date/time logic.

---

## 5. Inertia.js Prop Sharing for Auth Context

### Approach: Share User Role in HandleInertiaRequests

**Decision**: Share authenticated user with role in every Inertia response via `HandleInertiaRequests` middleware.

**Implementation Pattern**:
```php
// app/Http/Middleware/HandleInertiaRequests.php
public function share(Request $request): array {
    return array_merge(parent::share($request), [
        'auth' => [
            'user' => $request->user() ? [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'role' => $request->user()->role,
            ] : null,
        ],
        'flash' => [
            'success' => $request->session()->get('success'),
            'error' => $request->session()->get('error'),
        ],
    ]);
}
```

**TypeScript Interface**:
```typescript
// resources/js/types/index.ts
export interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'service_provider' | 'client';
}

export interface PageProps {
    auth: {
        user: User | null;
    };
    flash: {
        success?: string;
        error?: string;
    };
}

// Use in components
import { usePage } from '@inertiajs/react';

const { auth } = usePage<PageProps>().props;
const isProvider = auth.user?.role === 'service_provider';
```

**Rationale**: Sharing auth in every request eliminates prop drilling and provides consistent access to user role across all pages/components.

---

## 6. Cascade Delete Behavior

### Decision Matrix

| Scenario | Behavior | Rationale |
|----------|----------|-----------|
| User (Provider) deleted | **CASCADE delete timeslots** | Provider's availability should be removed |
| Timeslot deleted | **CASCADE delete bookings** | No orphaned bookings; clients notified via event |
| User (Client) deleted | **SET NULL or CASCADE delete bookings** | Depends on requirements; CASCADE simpler |

**Implementation**:
```php
// Timeslots migration
$table->foreignId('provider_id')
    ->constrained('users')
    ->onDelete('cascade'); // Delete timeslots when provider deleted

// Bookings migration
$table->foreignId('timeslot_id')
    ->constrained()
    ->onDelete('cascade'); // Delete booking when timeslot cancelled

$table->foreignId('client_id')
    ->constrained('users')
    ->onDelete('cascade'); // Delete booking when client deleted
```

**Event Listeners** (optional future enhancement):
- Fire `BookingCancelled` event when timeslot deleted
- Send email notification to client
- Not required for MVP but architecture supports it

---

## 7. Additional Research Findings

### Soft Deletes for Bookings?
**Decision**: Use **soft deletes** for bookings to maintain history.
- Allows "cancelled" bookings to remain in database for reporting
- Use `status` enum instead: `confirmed`, `cancelled`
- Simpler than soft deletes for querying available slots

### Date/Time Display Format
**Frontend**: Use `date-fns` or `Intl.DateTimeFormat` for consistent formatting
```typescript
import { format } from 'date-fns';
format(new Date(timeslot.start_time), 'd MMM yyyy, p'); // "29 Apr 2025, 9:00 AM"
```

### Performance Considerations
- Index on `timeslots.start_time` for fast querying of available slots
- Index on `bookings.timeslot_id` (already indexed via foreign key)
- Eager load relationships to avoid N+1: `Timeslot::with('provider', 'booking')`

### Validation Summary
| Field | Rules |
|-------|-------|
| `start_time` | required, date, after:now, no overlap |
| `duration_minutes` | required, integer, min:15, max:480 |
| `timeslot_id` (booking) | required, exists, not already booked, not in past |

---

## 8. Technology Decisions Summary

| Aspect | Decision | Alternative Rejected |
|--------|----------|---------------------|
| Authorization | Policies + string role | Spatie Laravel-Permission |
| Timezone | Store UTC, display local | Store in provider timezone |
| Double-booking prevention | Unique constraint + locking | Application logic only |
| Overlap prevention | Validation rule with query | Database check constraint |
| Auth context sharing | HandleInertiaRequests | Prop passing per route |
| Delete behavior | Cascade deletes | Soft deletes everywhere |
| Booking status | Status enum in bookings | Separate cancelled_bookings table |

---

## Next Steps → Phase 1: Design

1. Create `data-model.md` with complete database schema
2. Create `contracts/` directory with Inertia route definitions
3. Create `quickstart.md` with setup instructions
4. Validate design against constitution (re-check gate)
