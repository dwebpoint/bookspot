# Implementation Plan: Timeslot Booking Management System

**Branch**: `001-timeslot-booking` | **Date**: 2025-11-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-timeslot-booking/spec.md`

## Summary

Build a timeslot booking management system with three user roles (Admin, ServiceProvider, Client). Core functionality enables service providers to create available timeslots and clients to book them. The system uses Laravel 12 backend with React 19 frontend via Inertia.js, implementing role-based access control with Laravel Fortify authentication.

**Technical Approach**: Implement role-based authorization using Laravel policies/gates, create database schema with timeslots and bookings tables with proper foreign keys, build RESTful controllers with Inertia responses, develop React components using shadcn/ui for consistent UI, and write feature tests for critical paths (booking, cancellation, authorization).

## Technical Context

**Language/Version**: PHP 8.2+ (Laravel 12), TypeScript (React 19)  
**Primary Dependencies**: Laravel 12, Inertia.js 2.x, Laravel Fortify, React 19, shadcn/ui, Radix UI, Tailwind CSS 4  
**Storage**: MySQL/PostgreSQL (Laravel Eloquent ORM)  
**Testing**: PHPUnit (backend feature tests), Laravel's RefreshDatabase trait  
**Target Platform**: Web application (modern browsers)  
**Project Type**: Web (Laravel + React SPA via Inertia.js)  
**Performance Goals**: <500ms response time for booking operations, support 100+ concurrent users  
**Constraints**: No double-booking allowed, past timeslots cannot be created/booked, single timezone handling 
**Scale/Scope**: MVP with 3 roles, ~10 database tables, 5-8 main pages/views

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Feature-First Development
- Clear user-facing benefit: Enables online appointment booking system
- Self-contained feature with minimal dependencies on future features
- Specification document exists (spec.md)
- Can be independently tested and deployed

### ✅ Full-Stack Coherence
- Backend will define API contracts via Inertia controllers
- TypeScript interfaces will be created for all Inertia props
- Backend validation (FormRequests) will match frontend validation
- Database migrations will accompany all model changes

### ✅ Test-First for Critical Paths (NON-NEGOTIABLE)
- Feature tests required for:
  - Client booking a timeslot (authentication + data mutation)
  - Service provider creating timeslots (authentication + data mutation)
  - Authorization checks (role-based access control)
  - Preventing double-booking (data integrity)
  - Cancellation operations (data mutation)
- Tests will be written first, fail initially, then pass after implementation

### ✅ Type Safety Across the Stack
- All React components will use TypeScript with strict mode
- Inertia props will have defined TypeScript interfaces
- All PHP methods will declare parameter and return types
- Laravel Wayfinder will provide type-safe route generation

### ✅ Component Reusability
- UI components will use existing shadcn/ui + Radix UI patterns
- Reusable components: TimeslotCard, BookingForm, ScheduleCalendar, StatusBadge
- Controllers will follow single-responsibility principle
- Shared logic extracted into Actions (app/Actions)

### ✅ Database Integrity
- All schema changes via migrations
- Foreign keys: bookings.timeslot_id → timeslots.id, bookings.client_id → users.id, timeslots.provider_id → users.id
- Cascading deletes where appropriate (provider deleted → timeslots deleted)
- Form validation before persistence using FormRequest classes

## Project Structure

### Documentation (this feature)

```text
specs/001-timeslot-booking/
├── spec.md              # Feature specification (already exists)
├── plan.md              # This file
├── research.md          # Phase 0: Technical research findings
├── data-model.md        # Phase 1: Database schema & relationships
├── quickstart.md        # Phase 1: Setup & testing guide
├── contracts/           # Phase 1: API contracts (Inertia routes & props)
└── tasks.md             # Phase 2: Implementation task breakdown
```

### Source Code (repository root)

```text
# Laravel + React Web Application Structure
app/
├── Models/
│   ├── User.php (extend with role field)
│   ├── Timeslot.php (new)
│   └── Booking.php (new)
├── Http/
│   ├── Controllers/
│   │   ├── TimeslotController.php (new)
│   │   ├── BookingController.php (new)
│   │   └── Admin/
│   │       └── UserManagementController.php (new)
│   ├── Requests/
│   │   ├── StoreTimeslotRequest.php (new)
│   │   ├── BookTimeslotRequest.php (new)
│   │   └── Admin/
│   │       └── StoreUserRequest.php (new)
│   └── Middleware/
│       └── CheckRole.php (new - role-based middleware)
├── Policies/
│   ├── TimeslotPolicy.php (new)
│   └── BookingPolicy.php (new)
└── Actions/ (if complex business logic needed)
    └── Booking/
        └── CreateBooking.php (optional)

database/
├── migrations/
│   ├── YYYY_MM_DD_add_role_to_users_table.php (new)
│   ├── YYYY_MM_DD_create_timeslots_table.php (new)
│   └── YYYY_MM_DD_create_bookings_table.php (new)
├── factories/
│   ├── TimeslotFactory.php (new)
│   └── BookingFactory.php (new)
└── seeders/
    └── RoleSeeder.php (new - for testing)

resources/
├── js/
│   ├── pages/
│   │   ├── Timeslots/
│   │   │   ├── Index.tsx (client view - browse available)
│   │   │   ├── Create.tsx (provider - create timeslot)
│   │   │   └── Manage.tsx (provider - manage own timeslots)
│   │   ├── Bookings/
│   │   │   ├── Index.tsx (my bookings)
│   │   │   └── Show.tsx (booking details)
│   │   └── Admin/
│   │       └── Users/
│   │           ├── Index.tsx (user management)
│   │           ├── Create.tsx
│   │           └── Edit.tsx
│   ├── components/
│   │   ├── TimeslotCard.tsx (new - reusable timeslot display)
│   │   ├── BookingForm.tsx (new - booking form)
│   │   ├── ScheduleCalendar.tsx (new - calendar view)
│   │   ├── StatusBadge.tsx (new - booking/timeslot status)
│   │   └── RoleGuard.tsx (new - conditional rendering by role)
│   └── types/
│       ├── timeslot.ts (new - Timeslot interface)
│       ├── booking.ts (new - Booking interface)
│       └── user.ts (extend - add role types)
└── css/
    └── app.css (extend if custom styles needed)

routes/
└── web.php (add timeslot, booking, admin routes)

tests/
├── Feature/
│   ├── Timeslots/
│   │   ├── CreateTimeslotTest.php (new)
│   │   ├── ViewTimeslotsTest.php (new)
│   │   └── ManageTimeslotsTest.php (new)
│   ├── Bookings/
│   │   ├── BookTimeslotTest.php (new)
│   │   ├── CancelBookingTest.php (new)
│   │   └── ViewBookingsTest.php (new)
│   └── Admin/
│       └── UserManagementTest.php (new)
└── Unit/
    └── Models/
        ├── TimeslotTest.php (optional - relationship tests)
        └── BookingTest.php (optional - relationship tests)
```

**Structure Decision**: Using standard Laravel + Inertia.js web application structure. Backend follows Laravel conventions with Models, Controllers, Policies in `app/` directory. Frontend React components in `resources/js/` organized by feature (pages) and reusability (components). Database migrations provide version control for schema. Feature tests mirror application structure in `tests/Feature/`.

## Complexity Tracking

> **No constitution violations identified. This section intentionally left minimal.**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

---

## Next Steps

1. **Phase 0 - Research** (`research.md`):
   - Research Laravel role-based authorization patterns (policies vs gates)
   - Investigate timezone handling in Laravel for timeslot scheduling
   - Research preventing double-booking patterns (database constraints vs application logic)
   - Review Inertia.js prop sharing patterns for authenticated user context

2. **Phase 1 - Design** (`data-model.md`, `quickstart.md`, `contracts/`):
   - Design complete database schema with relationships
   - Define Inertia route contracts (endpoints, props, responses)
   - Document API contracts for each controller action
   - Create quickstart guide for running/testing the feature

3. **Phase 2 - Tasks** (`tasks.md`):
   - Break down implementation into atomic tasks
   - Order tasks by dependency (migrations → models → tests → controllers → frontend)
   - Define test scenarios for each critical path

4. **Implementation**:
   - Follow TDD for critical paths (booking, cancellation)
   - Implement backend first (migrations, models, policies, controllers)
   - Then implement frontend (pages, components, forms)
   - Run linters (Laravel Pint, ESLint) before committing
