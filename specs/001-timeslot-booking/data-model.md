# Phase 1: Data Model - Timeslot Booking Management System

**Date**: 2025-11-22  
**Purpose**: Complete database schema design with relationships and constraints

## Entity Relationship Diagram

```
┌─────────────────┐
│     users       │
│─────────────────│
│ id              │──┐
│ name            │  │
│ email           │  │
│ password        │  │
│ role (enum)     │  │ (provider)
│ timezone        │  │
│ created_at      │  │
│ updated_at      │  │
└─────────────────┘  │
        │            │
        │ (client)   │
        │            │
        ▼            ▼
┌─────────────────┐  ┌─────────────────┐
│    bookings     │  │   timeslots     │
│─────────────────│  │─────────────────│
│ id              │  │ id              │
│ timeslot_id  ───┼──│                 │
│ client_id    ───┘  │ provider_id     │
│ status (enum)   │  │ start_time      │
│ created_at      │  │ duration_minutes│
│ updated_at      │  │ created_at      │
└─────────────────┘  │ updated_at      │
                     └─────────────────┘
```

**Relationships**:
- User hasMany Timeslots (as provider)
- User hasMany Bookings (as client)
- Timeslot belongsTo User (provider)
- Timeslot hasOne Booking
- Booking belongsTo Timeslot
- Booking belongsTo User (client)

---

## Database Tables

### 1. users (extend existing)

**Migration**: `YYYY_MM_DD_HHMMSS_add_role_and_timezone_to_users_table.php`

```php
Schema::table('users', function (Blueprint $table) {
    $table->enum('role', ['admin', 'service_provider', 'client'])
        ->default('client')
        ->after('email');
    
    $table->string('timezone', 50)
        ->default('UTC')
        ->after('role');
});
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint unsigned | PK, AUTO_INCREMENT | Primary key |
| name | varchar(255) | NOT NULL | User's full name |
| email | varchar(255) | UNIQUE, NOT NULL | Email address |
| email_verified_at | timestamp | NULL | Email verification time |
| password | varchar(255) | NOT NULL | Hashed password |
| role | enum | NOT NULL, DEFAULT 'client' | User role |
| timezone | varchar(50) | NOT NULL, DEFAULT 'UTC' | User's timezone |
| remember_token | varchar(100) | NULL | Remember me token |
| created_at | timestamp | NULL | Record creation time |
| updated_at | timestamp | NULL | Record update time |

**Indexes**:
- PRIMARY: `id`
- UNIQUE: `email`
- INDEX: `role` (for filtering by role)

---

### 2. timeslots (new)

**Migration**: `YYYY_MM_DD_HHMMSS_create_timeslots_table.php`

```php
Schema::create('timeslots', function (Blueprint $table) {
    $table->id();
    $table->foreignId('provider_id')
        ->constrained('users')
        ->onDelete('cascade');
    $table->dateTime('start_time');
    $table->unsignedInteger('duration_minutes');
    $table->timestamps();
    
    // Indexes for performance
    $table->index(['provider_id', 'start_time']);
    $table->index('start_time');
});
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint unsigned | PK, AUTO_INCREMENT | Primary key |
| provider_id | bigint unsigned | FK to users, NOT NULL | Service provider |
| start_time | datetime | NOT NULL | Timeslot start (UTC) |
| duration_minutes | int unsigned | NOT NULL | Duration in minutes |
| created_at | timestamp | NULL | Record creation time |
| updated_at | timestamp | NULL | Record update time |

**Indexes**:
- PRIMARY: `id`
- FOREIGN KEY: `provider_id` → `users.id` ON DELETE CASCADE
- INDEX: `(provider_id, start_time)` - For querying provider's schedule
- INDEX: `start_time` - For querying available future slots

**Business Rules**:
- `start_time` must be in the future (validated in FormRequest)
- `duration_minutes` must be between 15 and 480 (validated in FormRequest)
- No overlapping timeslots for the same provider (validated in FormRequest)

---

### 3. bookings (new)

**Migration**: `YYYY_MM_DD_HHMMSS_create_bookings_table.php`

```php
Schema::create('bookings', function (Blueprint $table) {
    $table->id();
    $table->foreignId('timeslot_id')
        ->unique() // One booking per timeslot
        ->constrained()
        ->onDelete('cascade');
    $table->foreignId('client_id')
        ->constrained('users')
        ->onDelete('cascade');
    $table->enum('status', ['confirmed', 'cancelled'])
        ->default('confirmed');
    $table->timestamps();
    
    // Indexes
    $table->index('client_id');
    $table->index(['status', 'created_at']);
});
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint unsigned | PK, AUTO_INCREMENT | Primary key |
| timeslot_id | bigint unsigned | UNIQUE, FK to timeslots | Booked timeslot |
| client_id | bigint unsigned | FK to users, NOT NULL | Client who booked |
| status | enum | NOT NULL, DEFAULT 'confirmed' | Booking status |
| created_at | timestamp | NULL | Booking time |
| updated_at | timestamp | NULL | Last status change |

**Indexes**:
- PRIMARY: `id`
- UNIQUE: `timeslot_id` - Prevents double-booking at database level
- FOREIGN KEY: `timeslot_id` → `timeslots.id` ON DELETE CASCADE
- FOREIGN KEY: `client_id` → `users.id` ON DELETE CASCADE
- INDEX: `client_id` - For querying user's bookings
- INDEX: `(status, created_at)` - For reporting/analytics

**Business Rules**:
- One booking per timeslot (enforced by UNIQUE constraint)
- Only 'confirmed' bookings count as active
- Cancelled bookings remain in database for history

---

## Eloquent Models

### User Model (extend)

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'timezone',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    // Relationships
    public function timeslots()
    {
        return $this->hasMany(Timeslot::class, 'provider_id');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'client_id');
    }

    // Helper methods
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isServiceProvider(): bool
    {
        return $this->role === 'service_provider';
    }

    public function isClient(): bool
    {
        return $this->role === 'client';
    }
}
```

---

### Timeslot Model (new)

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Timeslot extends Model
{
    protected $fillable = [
        'provider_id',
        'start_time',
        'duration_minutes',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'duration_minutes' => 'integer',
    ];

    // Relationships
    public function provider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'provider_id');
    }

    public function booking(): HasOne
    {
        return $this->hasOne(Booking::class);
    }

    // Scopes
    public function scopeAvailable($query)
    {
        return $query->whereDoesntHave('booking', function ($q) {
            $q->where('status', 'confirmed');
        })->where('start_time', '>', now());
    }

    public function scopeFuture($query)
    {
        return $query->where('start_time', '>', now());
    }

    public function scopeForProvider($query, int $providerId)
    {
        return $query->where('provider_id', $providerId);
    }

    // Accessors
    public function getEndTimeAttribute()
    {
        return $this->start_time->addMinutes($this->duration_minutes);
    }

    public function getIsAvailableAttribute(): bool
    {
        return !$this->booking || $this->booking->status === 'cancelled';
    }

    public function getIsBookedAttribute(): bool
    {
        return $this->booking && $this->booking->status === 'confirmed';
    }
}
```

---

### Booking Model (new)

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Booking extends Model
{
    protected $fillable = [
        'timeslot_id',
        'client_id',
        'status',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function timeslot(): BelongsTo
    {
        return $this->belongsTo(Timeslot::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    // Scopes
    public function scopeConfirmed($query)
    {
        return $query->where('status', 'confirmed');
    }

    public function scopeCancelled($query)
    {
        return $query->where('status', 'cancelled');
    }

    public function scopeForClient($query, int $clientId)
    {
        return $query->where('client_id', $clientId);
    }

    // Methods
    public function cancel(): bool
    {
        return $this->update(['status' => 'cancelled']);
    }

    public function isConfirmed(): bool
    {
        return $this->status === 'confirmed';
    }

    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }
}
```

---

## Database Queries (Common Patterns)

### Get Available Timeslots for Clients

```php
$availableTimeslots = Timeslot::with('provider')
    ->available()
    ->orderBy('start_time')
    ->paginate(20);
```

### Get Provider's Schedule

```php
$providerSchedule = Timeslot::with('booking.client')
    ->forProvider(auth()->id())
    ->future()
    ->orderBy('start_time')
    ->get();
```

### Get Client's Bookings

```php
$myBookings = Booking::with('timeslot.provider')
    ->forClient(auth()->id())
    ->confirmed()
    ->orderBy('created_at', 'desc')
    ->get();
```

### Check Slot Availability (with locking)

```php
DB::transaction(function () use ($timeslotId) {
    $timeslot = Timeslot::where('id', $timeslotId)
        ->whereDoesntHave('booking', fn($q) => $q->where('status', 'confirmed'))
        ->lockForUpdate()
        ->firstOrFail();
    
    // Create booking...
});
```

---

## Data Integrity Rules

### Database Level
1. ✅ Foreign key constraints ensure referential integrity
2. ✅ Unique constraint on `bookings.timeslot_id` prevents double-booking
3. ✅ Cascade deletes maintain consistency

### Application Level (Validation)
1. ✅ Start time must be in future
2. ✅ Duration between 15-480 minutes
3. ✅ No overlapping timeslots for same provider
4. ✅ Client cannot book past timeslots
5. ✅ Client cannot book already booked timeslots

### Transaction Level
1. ✅ Pessimistic locking during booking creation
2. ✅ Atomic status updates for cancellations

---

## Migration Order

Execute migrations in this order:

1. `add_role_and_timezone_to_users_table.php` - Extend users
2. `create_timeslots_table.php` - Create timeslots (depends on users)
3. `create_bookings_table.php` - Create bookings (depends on timeslots and users)

---

## Seeder Data (for testing)

```php
// RoleSeeder.php
User::factory()->create([
    'name' => 'Admin User',
    'email' => 'admin@bookspot.test',
    'role' => 'admin',
]);

User::factory()->count(3)->create(['role' => 'service_provider']);
User::factory()->count(5)->create(['role' => 'client']);
```

---

## Next Steps → Phase 1 Continued

1. ✅ Data model complete
2. ⏭️ Create `contracts/` directory with Inertia route definitions
3. ⏭️ Create `quickstart.md` with setup instructions
