# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BookSpot is a Laravel 12 + React 19 timeslot booking application using Inertia.js as the bridge between backend and frontend. The application allows service providers to create timeslots, manage clients, and handle bookings through a calendar-first interface.

**Tech Stack:**
- Backend: Laravel 12, PHP 8.3+, Spatie Laravel Permission, Laravel Fortify
- Frontend: React 19, TypeScript 5.7+, Tailwind CSS 4.x, shadcn/ui, Radix UI
- Bridge: Inertia.js 2.x (server-side rendering capable)
- Build: Vite 7.x with Laravel Wayfinder for type-safe routing
- Database: SQLite (testing), configurable for production
- Testing: PHPUnit with RefreshDatabase

## Development Commands

### Initial Setup
```bash
# Full setup (install dependencies, configure, migrate, seed)
composer setup

# Manual setup steps
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed --class=RolesAndPermissionsSeeder
php artisan db:seed --class=AssignRolesToExistingUsersSeeder
```

### Development
```bash
# Start all development servers (Laravel, queue, Vite)
composer dev

# Start with SSR support
composer dev:ssr

# Alternative: Run individually
php artisan serve          # Laravel server (port 8000)
npm run dev                # Vite dev server (port 5173)
php artisan queue:listen   # Queue worker
```

### Testing
```bash
# Run all tests
php artisan test
composer test

# Run specific test
php artisan test --filter TestName

# Run tests with coverage
php artisan test --coverage
```

### Code Quality
```bash
# PHP formatting (Laravel Pint)
./vendor/bin/pint

# TypeScript/React linting and formatting
npm run lint              # ESLint with auto-fix
npm run format            # Prettier format
npm run format:check      # Check formatting only
npm run types             # TypeScript type checking
```

### Building
```bash
npm run build             # Production build
npm run build:ssr         # Build with SSR support
```

### Permission Management
```bash
# Clear permission cache after changes
php artisan permission:cache-reset

# Reseed roles and permissions
php artisan db:seed --class=RolesAndPermissionsSeeder
```

## Architecture

### Role-Based Access Control (Spatie Permissions)

The application uses **Spatie Laravel Permission** for granular RBAC with three core roles:

**Roles:**
- `admin` - Full system access (superuser)
- `service_provider` - Manage own timeslots, own clients, and bookings
- `client` - Book timeslots, view, cancel own bookings

**Key Patterns:**
- User model uses `HasRoles` trait from Spatie
- Helper methods: `isAdmin()`, `isServiceProvider()`, `isClient()` delegate to `hasRole()`
- Route middleware: `middleware('role:admin')` or `middleware('role:service_provider,admin')`
- Policies combine role checks + permission checks + ownership verification
- The legacy `role` column exists for backward compatibility but Spatie's role system is authoritative

**Permission Checks:**
```php
// In controllers
$user->can('create timeslots')
$user->hasRole('admin')
$user->hasAnyRole(['admin', 'service_provider'])

// In policies
return $user->can('delete timeslots') && $timeslot->provider_id === $user->id;

// In middleware
Route::middleware('permission:create users')->group(...)
```

See `docs/SPATIE_PERMISSIONS.md` for complete permission structure and usage examples.

### Laravel Backend Structure

**Controllers:**
- `app/Http/Controllers/Admin/` - Admin-only controllers (user management)
- `app/Http/Controllers/Provider/` - Service provider controllers (timeslots, clients)
- `app/Http/Controllers/BookingController.php` - Booking management
- `app/Http/Controllers/CalendarController.php` - Calendar views
- `app/Http/Controllers/Settings/` - User settings and profile

**Key Models:**
- `User` - HasRoles trait, client/provider relationships via many-to-many
- `Timeslot` - Belongs to provider, has status (available/booked/cancelled)
- `Booking` - Links client to timeslot
- `ProviderClient` - Pivot table for provider-client relationships

#### Timeslot Model

The `Timeslot` model ([app/Models/Timeslot.php](app/Models/Timeslot.php)) represents time slots that service providers create for clients to book.

**Schema:**
- `id` - Primary key
- `provider_id` - Foreign key to users table (the service provider)
- `start_time` - DateTime when the slot begins
- `duration_minutes` - Integer duration of the slot
- `timestamps` - created_at, updated_at

**Relationships:**
- `belongsTo(User::class, 'provider_id')` - The provider who created the slot
- `hasOne(Booking::class)` - The booking for this slot (if booked)

**Computed Attributes (appended to array/JSON):**
- `end_time` - Calculated as `start_time + duration_minutes`
- `is_available` - Boolean: true if no confirmed booking exists
- `is_booked` - Boolean: true if confirmed booking exists

**Query Scopes:**
- `available()` - Slots without confirmed bookings and in the future
- `future()` - Slots where start_time > now
- `forProvider($providerId)` - Slots for specific provider
- `forClientProviders($client)` - Slots for all of client's linked providers
- `forProviders($providerIds)` - Slots for multiple provider IDs

**Authorization (TimeslotPolicy):**
- `viewAny` - service_provider, admin, or 'view timeslots' permission
- `view` - Owner (provider) or admin
- `create` - service_provider, admin, or 'create timeslots' permission
- `update` - Owner + 'update timeslots' permission, or admin
- `delete` - Owner + 'delete timeslots' permission, or admin

**Key Patterns:**
```php
// Create a timeslot
$timeslot = Timeslot::create([
    'provider_id' => auth()->id(),
    'start_time' => '2025-11-26 14:00:00',
    'duration_minutes' => 60,
]);

// Query available slots for a provider
$slots = Timeslot::forProvider($providerId)
    ->available()
    ->orderBy('start_time')
    ->get();

// Check if slot is available
if ($timeslot->is_available) {
    // Can be booked
}

// Get end time
$endTime = $timeslot->end_time; // Carbon instance
```

**Authorization:**
- Policies in `app/Policies/` (TimeslotPolicy, BookingPolicy)
- CheckRole middleware in `app/Http/Middleware/CheckRole.php`

**Routes:**
- `routes/web.php` - Main application routes with role-based middleware groups
- `routes/settings.php` - User settings routes

### React Frontend Structure

**Organization:**
- `resources/js/pages/` - Inertia page components (route-level components)
  - Organized by role: `Admin/`, `Provider/`, `Bookings/`, `Calendar/`, etc.
- `resources/js/components/` - Reusable UI components (shadcn/ui architecture)
- `resources/js/layouts/` - Page layouts (authenticated, guest)
- `resources/js/types/` - TypeScript type definitions
- `resources/js/lib/` - Utility functions and helpers
- `resources/js/hooks/` - Custom React hooks

**Key Patterns:**
- All components are functional with TypeScript strict mode
- Inertia props are typed via TypeScript interfaces
- Routes are type-safe via Laravel Wayfinder: `route('provider.timeslots.index')`
- shadcn/ui components use Radix UI primitives with Tailwind styling
- Forms use Inertia's `useForm` hook with validation

**TypeScript Configuration:**
- Strict mode enabled (`strict: true`, `noImplicitAny: true`)
- Path alias: `@/*` maps to `resources/js/*`
- JSX: `react-jsx` (automatic React import)

### Inertia.js Bridge

Inertia connects Laravel controllers to React components without building a separate API:

**Controller → Component:**
```php
// In controller
return Inertia::render('Provider/Timeslots/Index', [
    'timeslots' => $timeslots,
    'clients' => $clients,
]);
```

**Component receives typed props:**
```tsx
// In React component
interface Props {
    timeslots: Timeslot[];
    clients: Client[];
}

export default function Index({ timeslots, clients }: Props) { ... }
```

**Form Submissions:**
```tsx
const form = useForm({ name: '', email: '' });
form.post(route('provider.clients.store'));
```

### Database Schema

**Core Tables:**
- `users` - User accounts with `role` column (legacy), timezone
- `timeslots` - Provider's available slots with status
- `bookings` - Client bookings for timeslots
- `provider_client` - Many-to-many provider-client relationships
- `roles`, `permissions`, `model_has_roles`, etc. - Spatie permission tables

**Key Relationships:**
- User hasMany Timeslots (as provider)
- User hasMany Bookings (as client)
- User belongsToMany User (providers ↔ clients via `provider_client`)
- Timeslot hasOne Booking
- Foreign keys enforce referential integrity

**Migrations:**
All schema changes use migrations. Never modify database directly.

### Testing Strategy

**Test Organization:**
- `tests/Feature/` - Feature/integration tests for HTTP routes, policies, business logic
- `tests/Unit/` - Unit tests for isolated logic
- `tests/TestCase.php` - Base test case with common setup

**Testing Patterns:**
- Use `RefreshDatabase` trait to reset DB between tests
- Test authentication: `$this->actingAs($user)`
- Test authorization: Verify 403 responses for unauthorized access
- Test critical paths (auth, data modification, RBAC) before implementation
- SQLite in-memory database for fast test execution

**Running Specific Tests:**
```bash
php artisan test --filter=TimeslotTest
php artisan test tests/Feature/Provider/TimeslotControllerTest.php
```

## Development Workflow (SpecKit)

This project follows a structured development workflow using custom agents in `.github/agents/` and `.github/prompts/`:

**SpecKit Agents (invoked via `/speckit.*` commands):**
1. `/speckit.specify` - Create feature specifications with user stories
2. `/speckit.clarify` - Resolve ambiguities and edge cases
3. `/speckit.plan` - Design technical implementation plan
4. `/speckit.tasks` - Break down into actionable tasks
5. `/speckit.implement` - Execute implementation with tests
6. `/speckit.analyze` - Analyze existing features
7. `/speckit.constitution` - Review constitution compliance

**Constitution:**
The project follows principles defined in `.specify/memory/constitution.md`:
- Feature-first development with clear user value
- Full-stack coherence (backend/frontend contracts)
- Test-first for critical paths (auth, data modification, RBAC)
- Type safety across stack (TypeScript strict + PHP types)
- Component reusability (shadcn/ui patterns)
- Database integrity (migrations only, foreign keys, validation)

**Feature Specifications:**
Located in `specs/###-feature-name/`:
- `spec.md` - User stories and acceptance criteria
- `plan.md` - Technical implementation plan
- `tasks.md` - Task breakdown
- `data-model.md` - Database schema changes
- `contracts/` - API contract definitions

Examples: `specs/001-timeslot-booking/`, `specs/002-client-provider-link/`

## Common Patterns

### Creating a New Feature

1. **Specification Phase:**
   - Run `/speckit.specify` to create feature spec in `specs/`
   - Define user stories and acceptance criteria
   - Run `/speckit.clarify` if ambiguities exist

2. **Planning Phase:**
   - Run `/speckit.plan` for technical design
   - Identify database changes (migrations)
   - Define backend routes and controller actions
   - Define Inertia props and React components

3. **Implementation:**
   - Create migration: `php artisan make:migration create_xyz_table`
   - Create model with relationships and fillable properties
   - Create policy: `php artisan make:policy XyzPolicy`
   - Create controller: `php artisan make:controller XyzController`
   - Create form request for validation: `php artisan make:request StoreXyzRequest`
   - Create TypeScript types in `resources/js/types/`
   - Create React page component in `resources/js/pages/`
   - Write tests in `tests/Feature/`

4. **Testing:**
   - Run tests: `php artisan test`
   - Manually test in browser
   - Check code quality: `./vendor/bin/pint && npm run lint && npm run types`

### Adding a New Role or Permission

```bash
# 1. Update RolesAndPermissionsSeeder
# 2. Clear cache and reseed
php artisan permission:cache-reset
php artisan db:seed --class=RolesAndPermissionsSeeder

# 3. Update policies to check new permissions
# 4. Write tests for new authorization rules
```

### Type-Safe Routing

**Backend (routes/web.php):**
```php
Route::get('provider/timeslots', [TimeslotController::class, 'index'])
    ->name('provider.timeslots.index');
```

**Frontend (React):**
```tsx
import { route } from '@laravel/vite-plugin-wayfinder';

// Type-safe route generation
<Link href={route('provider.timeslots.index')}>Timeslots</Link>

// With parameters
<Link href={route('provider.timeslots.show', { timeslot: timeslot.id })}>View</Link>
```

### Form Validation

**Backend (Form Request):**
```php
class StoreTimeslotRequest extends FormRequest {
    public function rules(): array {
        return [
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
        ];
    }
}
```

**Frontend (Inertia Form):**
```tsx
const form = useForm({
    start_time: '',
    end_time: '',
});

form.post(route('provider.timeslots.store'));

// Display errors
{form.errors.start_time && <span>{form.errors.start_time}</span>}
```

## Important Constraints

**MUST:**
- Use Inertia.js for all page rendering (no separate API/SPA)
- Use Laravel Wayfinder for type-safe routing
- Use Eloquent ORM for database operations
- Use PHPUnit RefreshDatabase trait for tests
- Use shadcn/ui patterns for React components
- Use functional React components with hooks
- Declare PHP types for all method signatures
- Use TypeScript strict mode (no `any` without justification)
- Use migrations for all schema changes
- Run Laravel Pint before committing PHP code
- Run Prettier/ESLint before committing frontend code

**MUST NOT:**
- Use direct SQL queries (use Eloquent or Query Builder)
- Use inline styles in React (use Tailwind classes)
- Use class-based React components
- Modify database schema directly (use migrations)
- Skip tests for critical paths (auth, data modification, RBAC)
- Use `dangerouslySetInnerHTML` without review

## Default Credentials (Development)

After running seeders:
- Provider 1: `provider1@example.com` / `password`
- Provider 2: `provider2@example.com` / `password`
- Client 1: `client1@example.com` / `password`
- Client 2: `client2@example.com` / `password`
- Client 3: `client3@example.com` / `password`

## Troubleshooting

### Permission Cache Issues
```bash
php artisan permission:cache-reset
php artisan cache:clear
php artisan config:clear
```

### Vite HMR Not Working
Check that Vite dev server is running on port 5173 and Laravel `.env` has:
```
VITE_DEV_SERVER_URL=http://localhost:5173
```

### TypeScript Errors
```bash
npm run types  # Check for type errors
```

### Inertia Version Mismatch
Clear browser cache or hard refresh (Ctrl+Shift+R) after updating Inertia assets.
