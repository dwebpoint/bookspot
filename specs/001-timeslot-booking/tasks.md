# Implementation Tasks: Timeslot Booking Management System

**Branch**: `001-timeslot-booking`  
**Date**: 2025-11-22  
**Status**: Ready for Implementation

---

## Task Organization

Tasks are organized by:
1. **Dependency Order** - Backend → Frontend → Tests
2. **Priority** - P1 (MVP) → P2 (Enhanced) → P3 (Admin)
3. **Component** - Database → Models → Controllers → Frontend

---

## Phase 1: Database Schema (P1 - CRITICAL)

### Task 1.1: Add Role and Timezone to Users Table
**Priority**: P1  
**Depends On**: None  
**Estimated Time**: 15 minutes

**Steps**:
1. Create migration: `php artisan make:migration add_role_and_timezone_to_users_table`
2. Add columns:
   - `role` enum: admin, service_provider, client (default: client)
   - `timezone` string: default UTC
3. Run migration: `php artisan migrate`
4. Verify schema: `php artisan db:show users`

**Acceptance Criteria**:
- [ ] Migration file created
- [ ] Role column added with enum constraint
- [ ] Timezone column added with default UTC
- [ ] Migration runs without errors
- [ ] Can rollback successfully

---

### Task 1.2: Create Timeslots Table
**Priority**: P1  
**Depends On**: Task 1.1  
**Estimated Time**: 20 minutes

**Steps**:
1. Create migration: `php artisan make:migration create_timeslots_table`
2. Add columns:
   - `id` (PK)
   - `provider_id` (FK → users.id, CASCADE)
   - `start_time` (datetime, NOT NULL)
   - `duration_minutes` (unsigned int, NOT NULL)
   - `timestamps`
3. Add indexes:
   - `(provider_id, start_time)`
   - `start_time`
4. Run migration

**Acceptance Criteria**:
- [ ] Migration file created
- [ ] All columns defined with correct types
- [ ] Foreign key constraint on provider_id
- [ ] Cascade delete configured
- [ ] Indexes created for performance
- [ ] Migration runs without errors

---

### Task 1.3: Create Bookings Table
**Priority**: P1  
**Depends On**: Task 1.2  
**Estimated Time**: 20 minutes

**Steps**:
1. Create migration: `php artisan make:migration create_bookings_table`
2. Add columns:
   - `id` (PK)
   - `timeslot_id` (FK → timeslots.id, UNIQUE, CASCADE)
   - `client_id` (FK → users.id, CASCADE)
   - `status` enum: confirmed, cancelled (default: confirmed)
   - `timestamps`
3. Add indexes:
   - `client_id`
   - `(status, created_at)`
4. Run migration

**Acceptance Criteria**:
- [ ] Migration file created
- [ ] Unique constraint on timeslot_id
- [ ] Foreign keys with cascade deletes
- [ ] Status enum configured
- [ ] All indexes created
- [ ] Migration runs without errors

---

## Phase 2: Eloquent Models (P1 - CRITICAL)

### Task 2.1: Update User Model
**Priority**: P1  
**Depends On**: Task 1.1  
**Estimated Time**: 30 minutes

**Steps**:
1. Open `app/Models/User.php`
2. Add to `$fillable`: `role`, `timezone`
3. Add relationships:
   - `hasMany(Timeslot::class, 'provider_id')`
   - `hasMany(Booking::class, 'client_id')`
4. Add helper methods:
   - `isAdmin()`
   - `isServiceProvider()`
   - `isClient()`
5. Update factory if needed

**Acceptance Criteria**:
- [ ] Role and timezone in fillable array
- [ ] Relationships defined
- [ ] Helper methods implemented
- [ ] PHPDoc comments added
- [ ] Type hints on all methods

---

### Task 2.2: Create Timeslot Model
**Priority**: P1  
**Depends On**: Task 1.2  
**Estimated Time**: 45 minutes

**Steps**:
1. Create model: `php artisan make:model Timeslot`
2. Add `$fillable`: provider_id, start_time, duration_minutes
3. Add `$casts`: start_time → datetime, duration_minutes → integer
4. Add relationships:
   - `belongsTo(User::class, 'provider_id')`
   - `hasOne(Booking::class)`
5. Add scopes:
   - `scopeAvailable($query)`
   - `scopeFuture($query)`
   - `scopeForProvider($query, $providerId)`
6. Add accessors:
   - `getEndTimeAttribute()`
   - `getIsAvailableAttribute()`
   - `getIsBookedAttribute()`

**Acceptance Criteria**:
- [ ] Model created with proper namespace
- [ ] Fillable properties defined
- [ ] Casts configured
- [ ] All relationships defined
- [ ] Scopes implemented and tested
- [ ] Accessors return correct values
- [ ] PHPDoc comments added

---

### Task 2.3: Create Booking Model
**Priority**: P1  
**Depends On**: Task 1.3  
**Estimated Time**: 30 minutes

**Steps**:
1. Create model: `php artisan make:model Booking`
2. Add `$fillable`: timeslot_id, client_id, status
3. Add `$casts`: created_at → datetime, updated_at → datetime
4. Add relationships:
   - `belongsTo(Timeslot::class)`
   - `belongsTo(User::class, 'client_id')`
5. Add scopes:
   - `scopeConfirmed($query)`
   - `scopeCancelled($query)`
   - `scopeForClient($query, $clientId)`
6. Add methods:
   - `cancel(): bool`
   - `isConfirmed(): bool`
   - `isCancelled(): bool`

**Acceptance Criteria**:
- [ ] Model created
- [ ] Fillable properties defined
- [ ] Relationships defined
- [ ] Scopes implemented
- [ ] Methods implemented
- [ ] PHPDoc comments added

---

## Phase 3: Factories and Seeders (P1 - CRITICAL)

### Task 3.1: Create Timeslot Factory
**Priority**: P1  
**Depends On**: Task 2.2  
**Estimated Time**: 20 minutes

**Steps**:
1. Create factory: `php artisan make:factory TimeslotFactory`
2. Define default state:
   - `provider_id`: User::factory() with role service_provider
   - `start_time`: faker future datetime
   - `duration_minutes`: random(30, 60, 90, 120)

**Acceptance Criteria**:
- [ ] Factory created
- [ ] Generates valid future datetimes
- [ ] Creates associated provider user
- [ ] Can create multiple timeslots

---

### Task 3.2: Create Booking Factory
**Priority**: P1  
**Depends On**: Task 2.3, Task 3.1  
**Estimated Time**: 20 minutes

**Steps**:
1. Create factory: `php artisan make:factory BookingFactory`
2. Define default state:
   - `timeslot_id`: Timeslot::factory()
   - `client_id`: User::factory() with role client
   - `status`: confirmed

**Acceptance Criteria**:
- [ ] Factory created
- [ ] Creates associated timeslot and client
- [ ] Default status is confirmed
- [ ] Can create cancelled bookings

---

### Task 3.3: Create Role Seeder
**Priority**: P1  
**Depends On**: Task 2.1  
**Estimated Time**: 30 minutes

**Steps**:
1. Create seeder: `php artisan make:seeder RoleSeeder`
2. Create test users:
   - 1 admin
   - 3 service providers
   - 5 clients
3. Add to DatabaseSeeder
4. Test: `php artisan db:seed --class=RoleSeeder`

**Acceptance Criteria**:
- [ ] Seeder created
- [ ] All users have correct roles
- [ ] Passwords are hashed
- [ ] Can login with seeded users
- [ ] Seeder is idempotent (can run multiple times)

---

## Phase 4: Authorization (P1 - CRITICAL)

### Task 4.1: Create CheckRole Middleware
**Priority**: P1  
**Depends On**: Task 2.1  
**Estimated Time**: 30 minutes

**Steps**:
1. Create middleware: `php artisan make:middleware CheckRole`
2. Implement role checking logic
3. Register in `bootstrap/app.php` or Kernel
4. Test with different roles

**Acceptance Criteria**:
- [ ] Middleware created
- [ ] Checks user role correctly
- [ ] Returns 403 for unauthorized
- [ ] Can chain multiple roles: `role:admin,service_provider`
- [ ] Registered in application

---

### Task 4.2: Create TimeslotPolicy
**Priority**: P1  
**Depends On**: Task 2.2  
**Estimated Time**: 45 minutes

**Steps**:
1. Create policy: `php artisan make:policy TimeslotPolicy --model=Timeslot`
2. Implement methods:
   - `viewAny`: service_provider, admin
   - `view`: owner or admin
   - `create`: service_provider, admin
   - `update`: owner or admin
   - `delete`: owner or admin
3. Register in `AuthServiceProvider`

**Acceptance Criteria**:
- [ ] Policy created
- [ ] All methods implemented
- [ ] Admin can access all timeslots
- [ ] Provider can only access own timeslots
- [ ] Clients cannot create timeslots
- [ ] Policy registered

---

### Task 4.3: Create BookingPolicy
**Priority**: P1  
**Depends On**: Task 2.3  
**Estimated Time**: 45 minutes

**Steps**:
1. Create policy: `php artisan make:policy BookingPolicy --model=Booking`
2. Implement methods:
   - `viewAny`: authenticated users (own bookings)
   - `view`: owner, provider, or admin
   - `create`: client, admin
   - `delete`: owner, provider, or admin
3. Register in `AuthServiceProvider`

**Acceptance Criteria**:
- [ ] Policy created
- [ ] Client can cancel own bookings
- [ ] Provider can cancel bookings for their timeslots
- [ ] Admin can cancel any booking
- [ ] Policy registered

---

## Phase 5: Form Requests (P1 - CRITICAL)

### Task 5.1: Create StoreTimeslotRequest
**Priority**: P1  
**Depends On**: Task 2.2  
**Estimated Time**: 60 minutes

**Steps**:
1. Create request: `php artisan make:request StoreTimeslotRequest`
2. Implement `authorize()`: return true (policy handles it)
3. Implement `rules()`:
   - start_time: required, date, after:now, custom overlap validation
   - duration_minutes: required, integer, min:15, max:480
4. Add custom validation message
5. Test overlap detection logic

**Acceptance Criteria**:
- [ ] Request created
- [ ] Validates start time is in future
- [ ] Detects overlapping timeslots for same provider
- [ ] Duration constraints enforced
- [ ] Clear error messages
- [ ] Works with timezone conversion

---

### Task 5.2: Create BookTimeslotRequest
**Priority**: P1  
**Depends On**: Task 2.3  
**Estimated Time**: 45 minutes

**Steps**:
1. Create request: `php artisan make:request BookTimeslotRequest`
2. Implement `rules()`:
   - timeslot_id: required, exists:timeslots, not booked, not past
3. Add custom validation rules:
   - Timeslot not already booked
   - Timeslot is in the future
4. Clear error messages

**Acceptance Criteria**:
- [ ] Request created
- [ ] Validates timeslot exists
- [ ] Prevents booking already booked timeslots
- [ ] Prevents booking past timeslots
- [ ] Clear error messages

---

## Phase 6: Backend Controllers (P1 - CRITICAL)

### Task 6.1: Create TimeslotController (Client View)
**Priority**: P1  
**Depends On**: Task 4.2  
**Estimated Time**: 60 minutes

**Steps**:
1. Create controller: `php artisan make:controller TimeslotController`
2. Implement `index()`:
   - Query available timeslots with pagination
   - Filter by provider_id, date (query params)
   - Eager load provider relationship
   - Return Inertia response with props
3. Add route: `GET /timeslots` → `timeslots.index`
4. Test with different filters

**Acceptance Criteria**:
- [ ] Controller created
- [ ] Returns paginated available timeslots
- [ ] Filters work correctly
- [ ] Eager loading prevents N+1
- [ ] Route registered
- [ ] Inertia response with correct props

---

### Task 6.2: Create BookingController
**Priority**: P1  
**Depends On**: Task 4.3, Task 5.2  
**Estimated Time**: 90 minutes

**Steps**:
1. Create controller: `php artisan make:controller BookingController`
2. Implement `index()`:
   - Show authenticated user's bookings
   - Filter by status (query param)
   - Eager load timeslot and provider
   - Return Inertia response
3. Implement `store()`:
   - Validate with BookTimeslotRequest
   - Use DB transaction with pessimistic locking
   - Create booking
   - Redirect with success message
4. Implement `destroy()`:
   - Authorize with policy
   - Update booking status to cancelled
   - Redirect with success message
5. Add routes:
   - `GET /bookings` → `bookings.index`
   - `POST /bookings` → `bookings.store`
   - `DELETE /bookings/{booking}` → `bookings.destroy`

**Acceptance Criteria**:
- [ ] Controller created
- [ ] Index shows user's bookings with filters
- [ ] Store prevents double-booking with locking
- [ ] Destroy cancels booking correctly
- [ ] Authorization enforced
- [ ] Routes registered
- [ ] Flash messages work

---

### Task 6.3: Create Provider/TimeslotController
**Priority**: P1  
**Depends On**: Task 4.2, Task 5.1  
**Estimated Time**: 90 minutes

**Steps**:
1. Create controller: `php artisan make:controller Provider/TimeslotController`
2. Implement `index()`:
   - Show provider's own timeslots
   - Filter by status, date
   - Eager load bookings and clients
3. Implement `create()`:
   - Return form view
4. Implement `store()`:
   - Validate with StoreTimeslotRequest
   - Create timeslot for authenticated provider
   - Redirect with success
5. Implement `destroy()`:
   - Authorize with policy
   - Delete timeslot (cascades to booking)
   - Redirect with success
6. Add routes:
   - `GET /provider/timeslots` → `provider.timeslots.index`
   - `GET /provider/timeslots/create` → `provider.timeslots.create`
   - `POST /provider/timeslots` → `provider.timeslots.store`
   - `DELETE /provider/timeslots/{timeslot}` → `provider.timeslots.destroy`

**Acceptance Criteria**:
- [ ] Controller created
- [ ] Provider sees own timeslots only
- [ ] Create form displays correctly
- [ ] Store validates overlap and past dates
- [ ] Destroy works with authorization
- [ ] Routes registered with middleware

---

## Phase 7: Frontend TypeScript Types (P1 - CRITICAL)

### Task 7.1: Define TypeScript Interfaces
**Priority**: P1  
**Depends On**: None  
**Estimated Time**: 30 minutes

**Steps**:
1. Create `resources/js/types/timeslot.ts`:
   - Timeslot interface
   - TimeslotWithProvider interface
2. Create `resources/js/types/booking.ts`:
   - Booking interface
   - BookingWithTimeslot interface
3. Update `resources/js/types/index.ts`:
   - Extend User with role property
   - Add PageProps with auth and flash
   - Export all types

**Acceptance Criteria**:
- [ ] All TypeScript interfaces defined
- [ ] Matches backend data structure
- [ ] No `any` types
- [ ] Exported from index.ts
- [ ] TypeScript compiles without errors

---

## Phase 8: Frontend Components (P1 - CRITICAL)

### Task 8.1: Create TimeslotCard Component
**Priority**: P1  
**Depends On**: Task 7.1  
**Estimated Time**: 60 minutes

**Steps**:
1. Create `resources/js/components/TimeslotCard.tsx`
2. Props: timeslot, onBook callback (optional), showProvider (boolean)
3. Display:
   - Start time (formatted)
   - Duration
   - Provider name (if showProvider)
   - "Book" button (if client and onBook provided)
4. Use shadcn/ui Card component
5. Format dates with date-fns

**Acceptance Criteria**:
- [ ] Component created
- [ ] TypeScript props interface defined
- [ ] Responsive design
- [ ] Accessible (ARIA labels)
- [ ] Handles loading state
- [ ] Formats dates correctly

---

### Task 8.2: Create StatusBadge Component
**Priority**: P1  
**Depends On**: None  
**Estimated Time**: 20 minutes

**Steps**:
1. Create `resources/js/components/StatusBadge.tsx`
2. Props: status ('available' | 'booked' | 'confirmed' | 'cancelled')
3. Use shadcn/ui Badge component
4. Color coding:
   - available: green
   - booked/confirmed: blue
   - cancelled: gray

**Acceptance Criteria**:
- [ ] Component created
- [ ] Props typed
- [ ] Colors match status
- [ ] Accessible

---

### Task 8.3: Create RoleGuard Component
**Priority**: P1  
**Depends On**: Task 7.1  
**Estimated Time**: 30 minutes

**Steps**:
1. Create `resources/js/components/RoleGuard.tsx`
2. Props: allowedRoles (array), children, fallback (optional)
3. Use `usePage()` to access auth.user.role
4. Render children if role matches, otherwise fallback

**Acceptance Criteria**:
- [ ] Component created
- [ ] Props typed
- [ ] Checks user role correctly
- [ ] Renders fallback if unauthorized

---

## Phase 9: Frontend Pages - Timeslots (P1 - CRITICAL)

### Task 9.1: Create Timeslots Index Page (Client View)
**Priority**: P1  
**Depends On**: Task 6.1, Task 8.1, Task 8.2  
**Estimated Time**: 90 minutes

**Steps**:
1. Create `resources/js/pages/Timeslots/Index.tsx`
2. Receive props: timeslots (paginated), filters, providers
3. Implement UI:
   - Filter by provider (dropdown)
   - Filter by date (date picker)
   - List of TimeslotCard components
   - Pagination controls
   - "Book" button on each card
4. Handle booking action:
   - Use `useForm` from Inertia
   - POST to `bookings.store`
   - Show loading state
   - Handle errors
5. Use shadcn/ui components: Select, Button, Calendar

**Acceptance Criteria**:
- [ ] Page created
- [ ] Props interface defined
- [ ] Filters work and update URL
- [ ] Booking action works
- [ ] Pagination works
- [ ] Responsive design
- [ ] Loading states
- [ ] Error handling

---

### Task 9.2: Create Provider Timeslots Index Page
**Priority**: P1  
**Depends On**: Task 6.3, Task 8.1, Task 8.2  
**Estimated Time**: 90 minutes

**Steps**:
1. Create `resources/js/pages/Provider/Timeslots/Index.tsx`
2. Receive props: timeslots, filters
3. Implement UI:
   - Filter by status (tabs: All, Available, Booked)
   - Filter by date
   - List of timeslots with status badges
   - Show client info for booked slots
   - "Cancel Timeslot" button (with confirmation)
   - "Create Timeslot" button (link to create page)
4. Handle cancel action:
   - Confirmation dialog
   - DELETE request
5. Protected with RoleGuard (service_provider)

**Acceptance Criteria**:
- [ ] Page created
- [ ] Shows provider's timeslots only
- [ ] Filters work
- [ ] Cancel confirmation works
- [ ] Displays client info for bookings
- [ ] Responsive design
- [ ] Role guard enforced

---

### Task 9.3: Create Provider Timeslot Create Page
**Priority**: P1  
**Depends On**: Task 6.3  
**Estimated Time**: 90 minutes

**Steps**:
1. Create `resources/js/pages/Provider/Timeslots/Create.tsx`
2. Implement form:
   - Start time (datetime picker)
   - Duration (select: 15, 30, 45, 60, 90, 120 minutes)
   - Submit button
3. Use `useForm` from Inertia
4. Handle validation errors
5. Use shadcn/ui Form components

**Acceptance Criteria**:
- [ ] Page created
- [ ] Form validates client-side
- [ ] Submits to backend
- [ ] Shows validation errors
- [ ] Redirects on success
- [ ] Shows flash message

---

## Phase 10: Frontend Pages - Bookings (P1 - CRITICAL)

### Task 10.1: Create Bookings Index Page
**Priority**: P1  
**Depends On**: Task 6.2, Task 8.2  
**Estimated Time**: 90 minutes

**Steps**:
1. Create `resources/js/pages/Bookings/Index.tsx`
2. Receive props: bookings, filters
3. Implement UI:
   - Filter by status (tabs: All, Confirmed, Cancelled)
   - List of bookings with:
     - Timeslot date/time
     - Provider name
     - Status badge
     - "Cancel Booking" button (if confirmed)
   - Empty state if no bookings
4. Handle cancel action:
   - Confirmation dialog
   - DELETE request
5. Use shadcn/ui Table or Card components

**Acceptance Criteria**:
- [ ] Page created
- [ ] Shows user's bookings
- [ ] Filters work
- [ ] Cancel confirmation dialog
- [ ] Status badges display
- [ ] Empty state displays
- [ ] Responsive design

---

## Phase 11: Backend Tests (P1 - CRITICAL)

### Task 11.1: Write Timeslot Feature Tests
**Priority**: P1  
**Depends On**: Task 6.1, Task 6.3  
**Estimated Time**: 120 minutes

**Steps**:
1. Create test: `php artisan make:test Feature/Timeslots/CreateTimeslotTest`
2. Test scenarios:
   - Provider can create valid timeslot
   - Cannot create overlapping timeslot
   - Cannot create past timeslot
   - Client cannot create timeslot
   - Unauthenticated cannot create
3. Create test: `php artisan make:test Feature/Timeslots/ViewTimeslotsTest`
4. Test scenarios:
   - Client can view available timeslots
   - Booked timeslots not shown
   - Can filter by provider
   - Can filter by date
5. Use RefreshDatabase trait
6. Use factories for test data

**Acceptance Criteria**:
- [ ] Test files created
- [ ] All scenarios covered
- [ ] Tests pass
- [ ] Uses factories
- [ ] Tests are isolated (RefreshDatabase)

---

### Task 11.2: Write Booking Feature Tests
**Priority**: P1  
**Depends On**: Task 6.2  
**Estimated Time**: 120 minutes

**Steps**:
1. Create test: `php artisan make:test Feature/Bookings/BookTimeslotTest`
2. Test scenarios:
   - Client can book available timeslot
   - Cannot book already booked timeslot (double-booking prevention)
   - Cannot book past timeslot
   - Provider cannot book timeslot
   - Race condition handling (concurrent bookings)
3. Create test: `php artisan make:test Feature/Bookings/CancelBookingTest`
4. Test scenarios:
   - Client can cancel own booking
   - Provider can cancel booking for their timeslot
   - Admin can cancel any booking
   - Cannot cancel already cancelled booking
5. Create test: `php artisan make:test Feature/Bookings/ViewBookingsTest`
6. Test scenarios:
   - Client sees only own bookings
   - Can filter by status

**Acceptance Criteria**:
- [ ] Test files created
- [ ] All critical scenarios covered
- [ ] Double-booking prevention tested
- [ ] Authorization tested
- [ ] Tests pass
- [ ] Uses transactions where appropriate

---

## Phase 12: Admin User Management (P3)

### Task 12.1: Create UserPolicy
**Priority**: P3  
**Depends On**: Task 2.1  
**Estimated Time**: 45 minutes

**Steps**:
1. Create policy: `php artisan make:policy UserPolicy --model=User`
2. Implement methods:
   - `viewAny`: admin only
   - `view`: admin only
   - `create`: admin only
   - `update`: admin only
   - `delete`: admin only, cannot delete self
3. Register policy

**Acceptance Criteria**:
- [ ] Policy created
- [ ] Only admins can manage users
- [ ] Admin cannot delete themselves
- [ ] Policy registered

---

### Task 12.2: Create StoreUserRequest and UpdateUserRequest
**Priority**: P3  
**Depends On**: None  
**Estimated Time**: 60 minutes

**Steps**:
1. Create: `php artisan make:request Admin/StoreUserRequest`
2. Validation rules:
   - name: required, max:255
   - email: required, email, unique:users
   - password: required, min:8, confirmed
   - role: required, in:admin,service_provider,client
   - timezone: nullable, in:timezone_identifiers_list()
3. Create: `php artisan make:request Admin/UpdateUserRequest`
4. Validation rules (password optional):
   - Same as above, but password nullable
   - Email unique except current user

**Acceptance Criteria**:
- [ ] Requests created
- [ ] Validation rules correct
- [ ] Password confirmation works
- [ ] Unique email validation works

---

### Task 12.3: Create Admin/UserController
**Priority**: P3  
**Depends On**: Task 12.1, Task 12.2  
**Estimated Time**: 120 minutes

**Steps**:
1. Create: `php artisan make:controller Admin/UserController --resource`
2. Implement all CRUD methods:
   - `index()`: list all users with filters and stats
   - `create()`: show create form
   - `store()`: create user
   - `show()`: view user details with timeslots/bookings
   - `edit()`: show edit form
   - `update()`: update user
   - `destroy()`: delete user
3. Add routes with admin middleware
4. Authorize all actions with policy

**Acceptance Criteria**:
- [ ] Controller created
- [ ] All methods implemented
- [ ] Routes registered
- [ ] Admin middleware applied
- [ ] Authorization enforced
- [ ] Inertia responses correct

---

### Task 12.4: Create Admin User Pages
**Priority**: P3  
**Depends On**: Task 12.3  
**Estimated Time**: 180 minutes

**Steps**:
1. Create `resources/js/pages/Admin/Users/Index.tsx`:
   - User list with filters (role, search)
   - User stats
   - Pagination
   - Actions: Create, Edit, Delete, View
2. Create `resources/js/pages/Admin/Users/Create.tsx`:
   - User creation form
3. Create `resources/js/pages/Admin/Users/Edit.tsx`:
   - User edit form
4. Create `resources/js/pages/Admin/Users/Show.tsx`:
   - User details
   - Activity (timeslots or bookings)
   - Stats
5. Protected with RoleGuard (admin)

**Acceptance Criteria**:
- [ ] All pages created
- [ ] Forms work correctly
- [ ] Filters work
- [ ] Delete confirmation
- [ ] Role guard enforced
- [ ] Responsive design

---

### Task 12.5: Write Admin Feature Tests
**Priority**: P3  
**Depends On**: Task 12.3  
**Estimated Time**: 90 minutes

**Steps**:
1. Create: `php artisan make:test Feature/Admin/UserManagementTest`
2. Test scenarios:
   - Admin can view all users
   - Admin can create user
   - Admin can update user
   - Admin can delete user (not self)
   - Admin cannot delete self
   - Non-admin cannot access admin routes

**Acceptance Criteria**:
- [ ] Test file created
- [ ] All scenarios covered
- [ ] Authorization tested
- [ ] Tests pass

---

## Phase 13: Navigation and Layout (P1)

### Task 13.1: Update Navigation Menu
**Priority**: P1  
**Depends On**: Task 8.3  
**Estimated Time**: 60 minutes

**Steps**:
1. Update main layout navigation
2. Add role-based menu items:
   - All: "Available Timeslots", "My Bookings"
   - Provider: "My Schedule", "Create Timeslot"
   - Admin: "Admin", "Users"
3. Use RoleGuard for conditional rendering
4. Highlight active route

**Acceptance Criteria**:
- [ ] Navigation updated
- [ ] Role-based items display correctly
- [ ] Active route highlighted
- [ ] Responsive mobile menu
- [ ] Accessible

---

### Task 13.2: Add Flash Messages Component
**Priority**: P1  
**Depends On**: None  
**Estimated Time**: 45 minutes

**Steps**:
1. Create `resources/js/components/FlashMessages.tsx`
2. Use `usePage()` to access flash props
3. Display success/error toasts
4. Auto-dismiss after 5 seconds
5. Use shadcn/ui Toast component
6. Add to main layout

**Acceptance Criteria**:
- [ ] Component created
- [ ] Shows success messages
- [ ] Shows error messages
- [ ] Auto-dismisses
- [ ] Accessible
- [ ] Added to layout

---

## Phase 14: Final Polish (P1)

### Task 14.1: Run Code Quality Tools
**Priority**: P1  
**Depends On**: All implementation tasks  
**Estimated Time**: 30 minutes

**Steps**:
1. Run Laravel Pint: `composer pint`
2. Run ESLint: `npm run lint`
3. Run Prettier: `npm run format`
4. Run TypeScript check: `npm run types`
5. Fix any issues

**Acceptance Criteria**:
- [ ] No Pint violations
- [ ] No ESLint errors
- [ ] Code formatted with Prettier
- [ ] No TypeScript errors

---

### Task 14.2: Run All Tests
**Priority**: P1  
**Depends On**: All test tasks  
**Estimated Time**: 30 minutes

**Steps**:
1. Run all tests: `php artisan test`
2. Ensure all tests pass
3. Check test coverage (optional)
4. Fix any failing tests

**Acceptance Criteria**:
- [ ] All tests pass
- [ ] No skipped tests
- [ ] Coverage meets requirements

---

### Task 14.3: Manual Testing
**Priority**: P1  
**Depends On**: All implementation tasks  
**Estimated Time**: 90 minutes

**Steps**:
1. Follow quickstart.md test flows
2. Test all user roles
3. Test all user stories from spec.md
4. Test edge cases:
   - Concurrent bookings
   - Timezone edge cases
   - Validation errors
   - Authorization failures
5. Document any bugs found

**Acceptance Criteria**:
- [ ] All user flows work
- [ ] All acceptance criteria met
- [ ] No critical bugs
- [ ] Performance acceptable

---

### Task 14.4: Update Documentation
**Priority**: P1  
**Depends On**: All implementation tasks  
**Estimated Time**: 60 minutes

**Steps**:
1. Update README.md if needed
2. Update .github/copilot-instructions.md
3. Add any missing JSDoc/PHPDoc comments
4. Update API contracts if routes changed
5. Update quickstart.md if setup changed

**Acceptance Criteria**:
- [ ] All documentation current
- [ ] No outdated information
- [ ] All code commented

---

## Task Summary

**Total Estimated Time**: ~35-40 hours

**Priority Breakdown**:
- P1 (MVP): ~30 hours - Client booking, Provider timeslots
- P2 (Enhanced): Included in P1 (cancellation features)
- P3 (Admin): ~10 hours - User management

**Phase Breakdown**:
1. Database: 1 hour
2. Models: 1.75 hours
3. Factories/Seeders: 1.25 hours
4. Authorization: 2 hours
5. Form Requests: 1.75 hours
6. Controllers: 4 hours
7. TypeScript Types: 0.5 hours
8. Components: 1.83 hours
9. Timeslot Pages: 4.5 hours
10. Booking Pages: 1.5 hours
11. Backend Tests: 4 hours
12. Admin Feature: 8.25 hours
13. Navigation: 1.75 hours
14. Final Polish: 3.5 hours

---

## Implementation Order

**Week 1 (P1 Core)**:
1. Phase 1-3: Database, Models, Factories (Day 1)
2. Phase 4-5: Authorization, Form Requests (Day 2)
3. Phase 6: Backend Controllers (Day 3)
4. Phase 7-9: Frontend Types, Components, Pages (Day 4-5)
5. Phase 11: Backend Tests (Day 5)

**Week 2 (P1 Polish + P3 Admin)**:
1. Phase 10: Booking Pages (Day 1)
2. Phase 13: Navigation (Day 1)
3. Phase 12: Admin Feature (Day 2-3)
4. Phase 14: Final Polish (Day 4-5)

---

## Ready to Start!

Begin with **Task 1.1: Add Role and Timezone to Users Table**
