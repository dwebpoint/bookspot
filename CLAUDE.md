# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BookSpot is a Laravel 12 + React 19 timeslot booking application using Inertia.js as the bridge between backend and frontend. The application allows service providers to create timeslots, manage clients, and handle bookings through a calendar-first interface.

**Tech Stack:**
- Backend: Laravel 12, PHP 8.4+, Spatie Laravel Permission, Laravel Fortify
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
- `service_provider` - Manage own timeslots, own clients
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
- `Timeslot` - Belongs to provider, optionally to client, has status (available/booked/completed)
- `ProviderClient` - Pivot table for provider-client relationships

**Note:** The Booking model has been consolidated into the Timeslot model. Timeslots now directly reference clients via `client_id` and track their lifecycle through the `status` field.

#### Timeslot Model

The `Timeslot` model ([app/Models/Timeslot.php](app/Models/Timeslot.php)) represents time slots that service providers create for clients to book.

**Schema:**
- `id` - Primary key
- `provider_id` - Foreign key to users table (the service provider)
- `client_id` - Foreign key to users table (the client who booked, nullable)
- `start_time` - DateTime when the slot begins
- `duration_minutes` - Integer duration of the slot
- `status` - Enum: 'available', 'booked', 'completed'
- `timestamps` - created_at, updated_at

**Relationships:**
- `belongsTo(User::class, 'provider_id')` - The provider who created the slot
- `belongsTo(User::class, 'client_id')` - The client who booked the slot (if booked)

**Computed Attributes (appended to array/JSON):**
- `end_time` - Calculated as `start_time + duration_minutes`
- `is_available` - Boolean: true if status === 'available'
- `is_booked` - Boolean: true if status === 'booked'
- `is_completed` - Boolean: true if status === 'completed'

**Query Scopes:**
- `available()` - Slots with status 'available' and in the future
- `booked()` - Slots with status 'booked'
- `completed()` - Slots with status 'completed'
- `future()` - Slots where start_time > now
- `forProvider($providerId)` - Slots for specific provider
- `forClient($clientId)` - Slots for specific client
- `forClientProviders($client)` - Slots for all of client's linked providers
- `forProviders($providerIds)` - Slots for multiple provider IDs

**Helper Methods:**
- `book($clientId)` - Book the timeslot for a client (sets client_id, status='booked')
- `cancel()` - Cancel the timeslot (sets status='available')
- `complete()` - Mark as completed (sets status='completed')
- `makeAvailable()` - Clear booking and make available (clears client_id, sets status='available')

**Authorization (TimeslotPolicy):**
- `viewAny` - service_provider, admin, or 'view timeslots' permission
- `view` - Owner (provider) or admin
- `create` - service_provider, admin, or 'create timeslots' permission
- `update` - Owner + 'update timeslots' permission + not booked, or admin
- `delete` - Owner + 'delete timeslots' permission + not booked (can delete available and completed timeslots including past ones), or admin
- `book` - Client + linked to provider + timeslot is available
- `cancelBooking` - Client who booked (only for future timeslots) + provider + admin
- `assignClient` - Provider or admin + timeslot is available

**Key Patterns:**
```php
// Create a timeslot
$timeslot = Timeslot::create([
    'provider_id' => auth()->id(),
    'start_time' => '2025-11-26 14:00:00',
    'duration_minutes' => 60,
    'status' => 'available',
]);

// Book a timeslot for a client
$timeslot->book($clientId);

// Cancel a booking
$timeslot->cancel();

// Make timeslot available again
$timeslot->makeAvailable();

// Query available slots for a provider
$slots = Timeslot::forProvider($providerId)
    ->available()
    ->orderBy('start_time')
    ->get();

// Query booked slots for a client
$bookings = Timeslot::forClient($clientId)
    ->booked()
    ->with('provider')
    ->orderBy('start_time')
    ->get();

// Check statuses
if ($timeslot->is_available) { /* Can be booked */ }
if ($timeslot->is_booked) { /* Currently booked */ }
if ($timeslot->is_completed) { /* Past appointment */ }

// Get end time
$endTime = $timeslot->end_time; // Carbon instance
```

**Authorization:**
- Policies in `app/Policies/` (TimeslotPolicy)
- CheckRole middleware in `app/Http/Middleware/CheckRole.php`

**Routes:**
- `routes/web.php` - Main application routes with role-based middleware groups
- `routes/settings.php` - User settings routes

### React Frontend Structure

**Organization:**
- `resources/js/pages/` - Inertia page components (route-level components)
  - Organized by feature: `Admin/`, `Bookings/`, `Calendar/`, `Settings/`, etc.
  - Note: Service provider timeslot management is integrated into the Calendar page
- `resources/js/components/` - Reusable UI components (shadcn/ui architecture)
- `resources/js/layouts/` - Page layouts (authenticated, guest)
- `resources/js/types/` - TypeScript type definitions
- `resources/js/lib/` - Utility functions and helpers
- `resources/js/hooks/` - Custom React hooks

**Key Patterns:**
- All components are functional with TypeScript strict mode
- Inertia props are typed via TypeScript interfaces
- Routes are type-safe via Laravel Wayfinder: `route('calendar')`
- shadcn/ui components use Radix UI primitives with Tailwind styling
- Forms use Inertia's `useForm` hook with validation
- Modal dialogs are used for inline create/edit operations (e.g., timeslot creation)

**TypeScript Configuration:**
- Strict mode enabled (`strict: true`, `noImplicitAny: true`)
- Path alias: `@/*` maps to `resources/js/*`
- JSX: `react-jsx` (automatic React import)

**Navigation Structure:**

The application sidebar (`app-sidebar.tsx`) provides role-based navigation:

*Common (All Users):*
- Calendar
- Timeslots

*Service Provider Only:*
- Clients (manage linked clients)

*Admin Only:*
- User Management

**Note:** Service providers no longer have a separate "Schedule" menu item. All timeslot management is integrated into the Calendar page through modal-based creation and inline operations.

### Inertia.js Bridge

Inertia connects Laravel controllers to React components without building a separate API:

**Controller → Component:**
```php
// In controller
return Inertia::render('Calendar/Index', [
    'timeslots' => $timeslots,
    'clients' => $clients,
]);
```

**Component receives typed props:**
```tsx
// In React component
interface Props {
    timeslots: Timeslot[];
    clients?: Client[];
}

export default function Index({ timeslots, clients }: Props) { ... }
```

**Form Submissions:**
```tsx
const form = useForm({ name: '', email: '' });
form.post(route('provider.clients.store'));

// Modal-based form submission (e.g., timeslot creation)
const createForm = useForm({
    start_time: '',
    duration_minutes: 60,
});
createForm.post(route('provider.timeslots.store'), {
    onSuccess: () => {
        setShowModal(false);
        createForm.reset();
    },
});
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

## User Workflows

### Service Provider Timeslot Management

Service providers manage their timeslots through the calendar interface with modal-based creation:

**Timeslot Creation Flow:**
1. Navigate to `/calendar`
2. Click "+ Create Timeslot" button or click on a date in the calendar
3. Modal dialog opens with pre-filled date/time
4. Select start time (datetime-local input)
5. Select duration (15 minutes to 4 hours)
6. Submit form → redirects back to calendar with success message

**Routes:**
- `POST /provider/timeslots` - Create new timeslot
- `DELETE /provider/timeslots/{timeslot}` - Delete timeslot
- `POST /provider/timeslots/{timeslot}/assign` - Assign client to timeslot
- `DELETE /provider/timeslots/{timeslot}/remove` - Remove client from timeslot

**Implementation Details:**
- Modal uses shadcn/ui Dialog component
- Form state managed via Inertia's `useForm` hook
- Default values: selected date at 9:00 AM, 60 minutes duration
- Success callback closes modal and resets form
- All operations redirect to `/calendar` for consistent user experience

**Calendar Page Routing Pattern:**
When users perform actions on `/calendar` (create/delete timeslots, assign/remove clients, book/cancel), they remain on `/calendar` after the operation completes. Controllers should redirect back to `route('calendar')` after successful operations to maintain user context and provide seamless workflow.

**Note:** There are no separate timeslot index or create pages. All timeslot management happens on the calendar page for a streamlined, context-aware workflow.

### Client Booking Flow

Clients book timeslots through the calendar or bookings page:

1. Browse available timeslots on `/calendar`
2. Filter by provider if needed
3. Click "Book" button on an available timeslot
4. Confirm booking
5. View confirmed bookings at `/bookings`

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
Route::post('provider/timeslots', [TimeslotController::class, 'store'])
    ->name('provider.timeslots.store');
```

**Frontend (React):**
```tsx
import { router } from '@inertiajs/react';

// Type-safe route generation
<Link href={route('calendar')}>Calendar</Link>

// Form submission with type-safe routing
form.post(route('provider.timeslots.store'));
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

===

<laravel-boost-guidelines>
=== foundation rules ===

# Laravel Boost Guidelines

The Laravel Boost guidelines are specifically curated by Laravel maintainers for this application. These guidelines should be followed closely to enhance the user's satisfaction building Laravel applications.

## Foundational Context
This application is a Laravel application and its main Laravel ecosystems package & versions are below. You are an expert with them all. Ensure you abide by these specific packages & versions.

- php - 8.4.14
- inertiajs/inertia-laravel (INERTIA) - v2
- laravel/fortify (FORTIFY) - v1
- laravel/framework (LARAVEL) - v12
- laravel/prompts (PROMPTS) - v0
- laravel/wayfinder (WAYFINDER) - v0
- laravel/mcp (MCP) - v0
- laravel/pint (PINT) - v1
- laravel/sail (SAIL) - v1
- phpunit/phpunit (PHPUNIT) - v11
- @inertiajs/react (INERTIA) - v2
- react (REACT) - v19
- tailwindcss (TAILWINDCSS) - v4
- @laravel/vite-plugin-wayfinder (WAYFINDER) - v0
- eslint (ESLINT) - v9
- prettier (PRETTIER) - v3

## Conventions
- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

## Verification Scripts
- Do not create verification scripts or tinker when tests cover that functionality and prove it works. Unit and feature tests are more important.

## Application Structure & Architecture
- Stick to existing directory structure - don't create new base folders without approval.
- Do not change the application's dependencies without approval.

## Frontend Bundling
- If the user doesn't see a frontend change reflected in the UI, it could mean they need to run `npm run build`, `npm run dev`, or `composer run dev`. Ask them.

## Replies
- Be concise in your explanations - focus on what's important rather than explaining obvious details.

## Documentation Files
- You must only create documentation files if explicitly requested by the user.


=== boost rules ===

## Laravel Boost
- Laravel Boost is an MCP server that comes with powerful tools designed specifically for this application. Use them.

## Artisan
- Use the `list-artisan-commands` tool when you need to call an Artisan command to double check the available parameters.

## URLs
- Whenever you share a project URL with the user you should use the `get-absolute-url` tool to ensure you're using the correct scheme, domain / IP, and port.

## Tinker / Debugging
- You should use the `tinker` tool when you need to execute PHP to debug code or query Eloquent models directly.
- Use the `database-query` tool when you only need to read from the database.

## Reading Browser Logs With the `browser-logs` Tool
- You can read browser logs, errors, and exceptions using the `browser-logs` tool from Boost.
- Only recent browser logs will be useful - ignore old logs.

## Searching Documentation (Critically Important)
- Boost comes with a powerful `search-docs` tool you should use before any other approaches. This tool automatically passes a list of installed packages and their versions to the remote Boost API, so it returns only version-specific documentation specific for the user's circumstance. You should pass an array of packages to filter on if you know you need docs for particular packages.
- The 'search-docs' tool is perfect for all Laravel related packages, including Laravel, Inertia, Livewire, Filament, Tailwind, Pest, Nova, Nightwatch, etc.
- You must use this tool to search for Laravel-ecosystem documentation before falling back to other approaches.
- Search the documentation before making code changes to ensure we are taking the correct approach.
- Use multiple, broad, simple, topic based queries to start. For example: `['rate limiting', 'routing rate limiting', 'routing']`.
- Do not add package names to queries - package information is already shared. For example, use `test resource table`, not `filament 4 test resource table`.

### Available Search Syntax
- You can and should pass multiple queries at once. The most relevant results will be returned first.

1. Simple Word Searches with auto-stemming - query=authentication - finds 'authenticate' and 'auth'
2. Multiple Words (AND Logic) - query=rate limit - finds knowledge containing both "rate" AND "limit"
3. Quoted Phrases (Exact Position) - query="infinite scroll" - Words must be adjacent and in that order
4. Mixed Queries - query=middleware "rate limit" - "middleware" AND exact phrase "rate limit"
5. Multiple Queries - queries=["authentication", "middleware"] - ANY of these terms


=== php rules ===

## PHP

- Always use curly braces for control structures, even if it has one line.

### Constructors
- Use PHP 8 constructor property promotion in `__construct()`.
    - <code-snippet>public function __construct(public GitHub $github) { }</code-snippet>
- Do not allow empty `__construct()` methods with zero parameters.

### Type Declarations
- Always use explicit return type declarations for methods and functions.
- Use appropriate PHP type hints for method parameters.

<code-snippet name="Explicit Return Types and Method Params" lang="php">
protected function isAccessible(User $user, ?string $path = null): bool
{
    ...
}
</code-snippet>

## Comments
- Prefer PHPDoc blocks over comments. Never use comments within the code itself unless there is something _very_ complex going on.

## PHPDoc Blocks
- Add useful array shape type definitions for arrays when appropriate.

## Enums
- Typically, keys in an Enum should be TitleCase. For example: `FavoritePerson`, `BestLake`, `Monthly`.


=== tests rules ===

## Test Enforcement

- Every change must be programmatically tested. Write a new test or update an existing test, then run the affected tests to make sure they pass.
- Run the minimum number of tests needed to ensure code quality and speed. Use `php artisan test` with a specific filename or filter.


=== inertia-laravel/core rules ===

## Inertia Core

- Inertia.js components should be placed in the `resources/js/Pages` directory unless specified differently in the JS bundler (vite.config.js).
- Use `Inertia::render()` for server-side routing instead of traditional Blade views.
- Use `search-docs` for accurate guidance on all things Inertia.

<code-snippet lang="php" name="Inertia::render Example">
// routes/web.php example
Route::get('/users', function () {
    return Inertia::render('Users/Index', [
        'users' => User::all()
    ]);
});
</code-snippet>


=== inertia-laravel/v2 rules ===

## Inertia v2

- Make use of all Inertia features from v1 & v2. Check the documentation before making any changes to ensure we are taking the correct approach.

### Inertia v2 New Features
- Polling
- Prefetching
- Deferred props
- Infinite scrolling using merging props and `WhenVisible`
- Lazy loading data on scroll

### Deferred Props & Empty States
- When using deferred props on the frontend, you should add a nice empty state with pulsing / animated skeleton.

### Inertia Form General Guidance
- The recommended way to build forms when using Inertia is with the `<Form>` component - a useful example is below. Use `search-docs` with a query of `form component` for guidance.
- Forms can also be built using the `useForm` helper for more programmatic control, or to follow existing conventions. Use `search-docs` with a query of `useForm helper` for guidance.
- `resetOnError`, `resetOnSuccess`, and `setDefaultsOnSuccess` are available on the `<Form>` component. Use `search-docs` with a query of 'form component resetting' for guidance.


=== laravel/core rules ===

## Do Things the Laravel Way

- Use `php artisan make:` commands to create new files (i.e. migrations, controllers, models, etc.). You can list available Artisan commands using the `list-artisan-commands` tool.
- If you're creating a generic PHP class, use `php artisan make:class`.
- Pass `--no-interaction` to all Artisan commands to ensure they work without user input. You should also pass the correct `--options` to ensure correct behavior.

### Database
- Always use proper Eloquent relationship methods with return type hints. Prefer relationship methods over raw queries or manual joins.
- Use Eloquent models and relationships before suggesting raw database queries
- Avoid `DB::`; prefer `Model::query()`. Generate code that leverages Laravel's ORM capabilities rather than bypassing them.
- Generate code that prevents N+1 query problems by using eager loading.
- Use Laravel's query builder for very complex database operations.

### Model Creation
- When creating new models, create useful factories and seeders for them too. Ask the user if they need any other things, using `list-artisan-commands` to check the available options to `php artisan make:model`.

### APIs & Eloquent Resources
- For APIs, default to using Eloquent API Resources and API versioning unless existing API routes do not, then you should follow existing application convention.

### Controllers & Validation
- Always create Form Request classes for validation rather than inline validation in controllers. Include both validation rules and custom error messages.
- Check sibling Form Requests to see if the application uses array or string based validation rules.

### Queues
- Use queued jobs for time-consuming operations with the `ShouldQueue` interface.

### Authentication & Authorization
- Use Laravel's built-in authentication and authorization features (gates, policies, Sanctum, etc.).

### URL Generation
- When generating links to other pages, prefer named routes and the `route()` function.

### Configuration
- Use environment variables only in configuration files - never use the `env()` function directly outside of config files. Always use `config('app.name')`, not `env('APP_NAME')`.

### Testing
- When creating models for tests, use the factories for the models. Check if the factory has custom states that can be used before manually setting up the model.
- Faker: Use methods such as `$this->faker->word()` or `fake()->randomDigit()`. Follow existing conventions whether to use `$this->faker` or `fake()`.
- When creating tests, make use of `php artisan make:test [options] {name}` to create a feature test, and pass `--unit` to create a unit test. Most tests should be feature tests.

### Vite Error
- If you receive an "Illuminate\Foundation\ViteException: Unable to locate file in Vite manifest" error, you can run `npm run build` or ask the user to run `npm run dev` or `composer run dev`.


=== laravel/v12 rules ===

## Laravel 12

- Use the `search-docs` tool to get version specific documentation.
- Since Laravel 11, Laravel has a new streamlined file structure which this project uses.

### Laravel 12 Structure
- No middleware files in `app/Http/Middleware/`.
- `bootstrap/app.php` is the file to register middleware, exceptions, and routing files.
- `bootstrap/providers.php` contains application specific service providers.
- **No app\Console\Kernel.php** - use `bootstrap/app.php` or `routes/console.php` for console configuration.
- **Commands auto-register** - files in `app/Console/Commands/` are automatically available and do not require manual registration.

### Database
- When modifying a column, the migration must include all of the attributes that were previously defined on the column. Otherwise, they will be dropped and lost.
- Laravel 11 allows limiting eagerly loaded records natively, without external packages: `$query->latest()->limit(10);`.

### Models
- Casts can and likely should be set in a `casts()` method on a model rather than the `$casts` property. Follow existing conventions from other models.


=== wayfinder/core rules ===

## Laravel Wayfinder

Wayfinder generates TypeScript functions and types for Laravel controllers and routes which you can import into your client side code. It provides type safety and automatic synchronization between backend routes and frontend code.

### Development Guidelines
- Always use `search-docs` to check wayfinder correct usage before implementing any features.
- Always Prefer named imports for tree-shaking (e.g., `import { show } from '@/actions/...'`)
- Avoid default controller imports (prevents tree-shaking)
- Run `php artisan wayfinder:generate` after route changes if Vite plugin isn't installed

### Feature Overview
- Form Support: Use `.form()` with `--with-form` flag for HTML form attributes — `<form {...store.form()}>` → `action="/posts" method="post"`
- HTTP Methods: Call `.get()`, `.post()`, `.patch()`, `.put()`, `.delete()` for specific methods — `show.head(1)` → `{ url: "/posts/1", method: "head" }`
- Invokable Controllers: Import and invoke directly as functions. For example, `import StorePost from '@/actions/.../StorePostController'; StorePost()`
- Named Routes: Import from `@/routes/` for non-controller routes. For example, `import { show } from '@/routes/post'; show(1)` for route name `post.show`
- Parameter Binding: Detects route keys (e.g., `{post:slug}`) and accepts matching object properties — `show("my-post")` or `show({ slug: "my-post" })`
- Query Merging: Use `mergeQuery` to merge with `window.location.search`, set values to `null` to remove — `show(1, { mergeQuery: { page: 2, sort: null } })`
- Query Parameters: Pass `{ query: {...} }` in options to append params — `show(1, { query: { page: 1 } })` → `"/posts/1?page=1"`
- Route Objects: Functions return `{ url, method }` shaped objects — `show(1)` → `{ url: "/posts/1", method: "get" }`
- URL Extraction: Use `.url()` to get URL string — `show.url(1)` → `"/posts/1"`

### Example Usage

<code-snippet name="Wayfinder Basic Usage" lang="typescript">
    // Import controller methods (tree-shakable)
    import { show, store, update } from '@/actions/App/Http/Controllers/PostController'

    // Get route object with URL and method...
    show(1) // { url: "/posts/1", method: "get" }

    // Get just the URL...
    show.url(1) // "/posts/1"

    // Use specific HTTP methods...
    show.get(1) // { url: "/posts/1", method: "get" }
    show.head(1) // { url: "/posts/1", method: "head" }

    // Import named routes...
    import { show as postShow } from '@/routes/post' // For route name 'post.show'
    postShow(1) // { url: "/posts/1", method: "get" }
</code-snippet>


### Wayfinder + Inertia
If your application uses the `<Form>` component from Inertia, you can use Wayfinder to generate form action and method automatically.
<code-snippet name="Wayfinder Form Component (React)" lang="typescript">

<Form {...store.form()}><input name="title" /></Form>

</code-snippet>


=== pint/core rules ===

## Laravel Pint Code Formatter

- You must run `vendor/bin/pint --dirty` before finalizing changes to ensure your code matches the project's expected style.
- Do not run `vendor/bin/pint --test`, simply run `vendor/bin/pint` to fix any formatting issues.


=== phpunit/core rules ===

## PHPUnit Core

- This application uses PHPUnit for testing. All tests must be written as PHPUnit classes. Use `php artisan make:test --phpunit {name}` to create a new test.
- If you see a test using "Pest", convert it to PHPUnit.
- Every time a test has been updated, run that singular test.
- When the tests relating to your feature are passing, ask the user if they would like to also run the entire test suite to make sure everything is still passing.
- Tests should test all of the happy paths, failure paths, and weird paths.
- You must not remove any tests or test files from the tests directory without approval. These are not temporary or helper files, these are core to the application.

### Running Tests
- Run the minimal number of tests, using an appropriate filter, before finalizing.
- To run all tests: `php artisan test`.
- To run all tests in a file: `php artisan test tests/Feature/ExampleTest.php`.
- To filter on a particular test name: `php artisan test --filter=testName` (recommended after making a change to a related file).


=== inertia-react/core rules ===

## Inertia + React

- Use `router.visit()` or `<Link>` for navigation instead of traditional links.

<code-snippet name="Inertia Client Navigation" lang="react">

import { Link } from '@inertiajs/react'
<Link href="/">Home</Link>

</code-snippet>


=== inertia-react/v2/forms rules ===

## Inertia + React Forms

<code-snippet name="`<Form>` Component Example" lang="react">

import { Form } from '@inertiajs/react'

export default () => (
    <Form action="/users" method="post">
        {({
            errors,
            hasErrors,
            processing,
            wasSuccessful,
            recentlySuccessful,
            clearErrors,
            resetAndClearErrors,
            defaults
        }) => (
        <>
        <input type="text" name="name" />

        {errors.name && <div>{errors.name}</div>}

        <button type="submit" disabled={processing}>
            {processing ? 'Creating...' : 'Create User'}
        </button>

        {wasSuccessful && <div>User created successfully!</div>}
        </>
    )}
    </Form>
)

</code-snippet>


=== tailwindcss/core rules ===

## Tailwind Core

- Use Tailwind CSS classes to style HTML, check and use existing tailwind conventions within the project before writing your own.
- Offer to extract repeated patterns into components that match the project's conventions (i.e. Blade, JSX, Vue, etc..)
- Think through class placement, order, priority, and defaults - remove redundant classes, add classes to parent or child carefully to limit repetition, group elements logically
- You can use the `search-docs` tool to get exact examples from the official documentation when needed.

### Spacing
- When listing items, use gap utilities for spacing, don't use margins.

    <code-snippet name="Valid Flex Gap Spacing Example" lang="html">
        <div class="flex gap-8">
            <div>Superior</div>
            <div>Michigan</div>
            <div>Erie</div>
        </div>
    </code-snippet>


### Dark Mode
- If existing pages and components support dark mode, new pages and components must support dark mode in a similar way, typically using `dark:`.


=== tailwindcss/v4 rules ===

## Tailwind 4

- Always use Tailwind CSS v4 - do not use the deprecated utilities.
- `corePlugins` is not supported in Tailwind v4.
- In Tailwind v4, configuration is CSS-first using the `@theme` directive — no separate `tailwind.config.js` file is needed.
<code-snippet name="Extending Theme in CSS" lang="css">
@theme {
  --color-brand: oklch(0.72 0.11 178);
}
</code-snippet>

- In Tailwind v4, you import Tailwind using a regular CSS `@import` statement, not using the `@tailwind` directives used in v3:

<code-snippet name="Tailwind v4 Import Tailwind Diff" lang="diff">
   - @tailwind base;
   - @tailwind components;
   - @tailwind utilities;
   + @import "tailwindcss";
</code-snippet>


### Replaced Utilities
- Tailwind v4 removed deprecated utilities. Do not use the deprecated option - use the replacement.
- Opacity values are still numeric.

| Deprecated |	Replacement |
|------------+--------------|
| bg-opacity-* | bg-black/* |
| text-opacity-* | text-black/* |
| border-opacity-* | border-black/* |
| divide-opacity-* | divide-black/* |
| ring-opacity-* | ring-black/* |
| placeholder-opacity-* | placeholder-black/* |
| flex-shrink-* | shrink-* |
| flex-grow-* | grow-* |
| overflow-ellipsis | text-ellipsis |
| decoration-slice | box-decoration-slice |
| decoration-clone | box-decoration-clone |
</laravel-boost-guidelines>
