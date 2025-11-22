# Timeslot Booking Feature - Testing Guide

## Setup Instructions

### 1. Run Database Migrations

```bash
php artisan migrate
```

This will create the following tables:
- Extended `users` table with `role` and `timezone` columns
- `timeslots` table with provider relationships
- `bookings` table with client and timeslot relationships

### 2. Seed Test Data

```bash
php artisan db:seed --class=RoleSeeder
```

This creates 9 test users:
- **Admins**: admin@example.com, alice@example.com, bob@example.com
- **Service Providers**: provider@example.com, charlie@example.com, diana@example.com
- **Clients**: client@example.com, emma@example.com, frank@example.com

All passwords: `password`

### 3. Install Frontend Dependencies

```bash
npm install
```

### 4. Build Frontend Assets

```bash
npm run dev
```

## Manual Testing Checklist

### Client User Flow

1. **Login as Client** (client@example.com / password)
2. **Browse Timeslots** (`/timeslots`)
   - [ ] Can see available timeslots
   - [ ] Can filter by provider
   - [ ] Can filter by date
   - [ ] Can book an available timeslot
   - [ ] Flash message appears on successful booking
3. **View Bookings** (`/bookings`)
   - [ ] Can see all bookings
   - [ ] Can filter by status (All/Confirmed/Cancelled)
   - [ ] Can cancel a confirmed booking
   - [ ] Cancelled bookings show correct status

### Service Provider Flow

1. **Login as Provider** (provider@example.com / password)
2. **View Schedule** (`/provider/timeslots`)
   - [ ] Can see own timeslots
   - [ ] Can see booking details (client name if booked)
   - [ ] Can filter by status (All/Available/Booked)
   - [ ] Can filter by date
3. **Create Timeslot** (`/provider/timeslots/create`)
   - [ ] Can select start time (datetime picker)
   - [ ] Can select duration (15min to 4 hours)
   - [ ] Validation prevents overlapping timeslots
   - [ ] Flash message appears on successful creation
4. **Cancel Timeslot** (from schedule page)
   - [ ] Confirmation dialog appears
   - [ ] Cancelling removes timeslot
   - [ ] If booked, client's booking is also cancelled

### Admin User Flow

1. **Login as Admin** (admin@example.com / password)
2. **Has All Permissions**
   - [ ] Can access `/timeslots` (browse as client)
   - [ ] Can access `/bookings` (view own bookings)
   - [ ] Can access `/provider/timeslots` (act as provider)
   - [ ] Can access `/admin/users` (user management)
3. **User Management** (`/admin/users`)
   - [ ] Can see all users in table
   - [ ] Can filter by role (Admin/Provider/Client)
   - [ ] Can search by name/email
4. **Create User** (`/admin/users/create`)
   - [ ] Can create user with all fields
   - [ ] Password confirmation required
   - [ ] Email validation works
5. **Edit User** (`/admin/users/{id}/edit`)
   - [ ] Can update user details
   - [ ] Can change role
   - [ ] Password is optional (leave blank to keep current)
6. **View User** (`/admin/users/{id}`)
   - [ ] Shows user details
   - [ ] Shows statistics (timeslots for providers, bookings for clients)
   - [ ] Can delete user with confirmation

## Navigation Testing

### For All Users
- [ ] Dashboard link works
- [ ] Available Timeslots link works
- [ ] My Bookings link works

### For Providers and Admins
- [ ] My Schedule link appears
- [ ] My Schedule link works

### For Admins Only
- [ ] User Management link appears
- [ ] User Management link works

## Authorization Testing

### Try Unauthorized Access
1. **As Client**
   - [ ] Cannot access `/provider/timeslots` (403)
   - [ ] Cannot access `/admin/users` (403)
2. **As Provider**
   - [ ] Cannot access `/admin/users` (403)
   - [ ] Cannot cancel another provider's timeslots
3. **As Any Role**
   - [ ] Cannot book already booked timeslot
   - [ ] Cannot cancel another client's booking

## Double-Booking Prevention

1. **Create Test Timeslot** as provider
2. **Open Two Browser Windows** (or use incognito + regular)
3. **Login as Two Different Clients**
4. **Try to Book Same Timeslot Simultaneously**
   - [ ] Only one booking succeeds
   - [ ] Other client sees error: "Timeslot is no longer available"

## Data Validation Testing

### Timeslot Creation
- [ ] Start time required
- [ ] Start time must be in future
- [ ] Duration required
- [ ] Overlapping timeslots rejected

### Booking Creation
- [ ] Cannot book past timeslots
- [ ] Cannot book already booked timeslots
- [ ] Cannot book own timeslots (if provider)

### User Management (Admin)
- [ ] Email must be unique
- [ ] Email must be valid format
- [ ] Password must be confirmed
- [ ] Name is required
- [ ] Role is required

## Edge Cases

### Timezone Handling
- [ ] Timeslots display in user's timezone
- [ ] Stored as UTC in database
- [ ] Filtering by date respects user timezone

### Concurrent Operations
- [ ] Multiple users can browse timeslots simultaneously
- [ ] Provider can create multiple timeslots
- [ ] Race condition on booking handled correctly

### Empty States
- [ ] No timeslots available shows empty state
- [ ] No bookings shows empty state with CTA
- [ ] Provider with no timeslots shows create button
- [ ] Admin user search with no results shows message

## Performance Checks

- [ ] Pagination works on timeslots page
- [ ] Pagination works on bookings page
- [ ] Pagination works on admin users page
- [ ] Filters don't cause page reload (use preserveState)

## Next Steps (Post-MVP)

### P2 Features (Nice to Have)
- [ ] Email notifications on booking/cancellation
- [ ] Recurring timeslots (weekly schedules)
- [ ] Booking notes/comments
- [ ] Export bookings to CSV
- [ ] Calendar view for timeslots

### P3 Features (Future)
- [ ] Multi-provider booking (teams)
- [ ] Payment integration
- [ ] Reminders (24hr before booking)
- [ ] Client booking history/analytics
- [ ] Provider analytics dashboard

## Troubleshooting

### Migrations Fail
```bash
php artisan migrate:fresh
php artisan db:seed --class=RoleSeeder
```

### Assets Not Loading
```bash
npm run build
php artisan optimize:clear
```

### Routes Not Found
```bash
php artisan route:clear
php artisan route:cache
```

### Policies Not Working
```bash
php artisan optimize:clear
```

## Running Tests

```bash
# Run all tests
php artisan test

# Run specific test suite
php artisan test --filter=TimeslotTest
php artisan test --filter=BookingTest

# Run with coverage
php artisan test --coverage
```

## Development Commands

```bash
# Watch frontend assets
npm run dev

# Build for production
npm run build

# Run PHP linter
./vendor/bin/pint

# Run static analysis
./vendor/bin/phpstan analyse
```
