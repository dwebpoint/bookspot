# Quickstart Guide: Timeslot Booking Feature

**Purpose**: Setup and testing instructions for the timeslot booking system

---

## Prerequisites

- PHP 8.2+
- Composer
- Node.js 18+ and npm
- MySQL or PostgreSQL
- Git

---

## Installation

### 1. Clone and Setup

```bash
# Clone repository
git clone https://github.com/dwebpoint/bookspot.git
cd bookspot

# Install dependencies
composer install
npm install

# Setup environment
cp .env.example .env
php artisan key:generate

# Configure database in .env
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=bookspot
# DB_USERNAME=root
# DB_PASSWORD=
```

### 2. Run Migrations and Seeders

```bash
# Run migrations
php artisan migrate

# (Optional) Seed test data
php artisan db:seed --class=RoleSeeder
```

### 3. Build Frontend Assets

```bash
# Development
npm run dev

# Production
npm run build
```

### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
php artisan serve
# Server running at http://localhost:8000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
# Vite running at http://localhost:5173
```

---

## Test Users

After running `RoleSeeder`, these test users are available:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@bookspot.test | password |
| Service Provider | provider1@bookspot.test | password |
| Service Provider | provider2@bookspot.test | password |
| Service Provider | provider3@bookspot.test | password |
| Client | client1@bookspot.test | password |
| Client | client2@bookspot.test | password |
| Client | client3@bookspot.test | password |
| Client | client4@bookspot.test | password |
| Client | client5@bookspot.test | password |

---

## Testing User Flows

### Flow 1: Client Books a Timeslot

1. **Login as Service Provider**
   - Go to http://localhost:8000/login
   - Email: `provider1@bookspot.test`
   - Password: `password`

2. **Create Timeslots**
   - Navigate to "My Schedule" or `/provider/timeslots`
   - Click "Create Timeslot"
   - Enter start time (future date/time)
   - Enter duration (e.g., 60 minutes)
   - Click "Save"
   - Create 2-3 more timeslots

3. **Logout and Login as Client**
   - Logout from provider account
   - Login with: `client1@bookspot.test` / `password`

4. **Browse Available Timeslots**
   - Navigate to "Available Timeslots" or `/timeslots`
   - See list of available slots from all providers
   - (Optional) Filter by provider or date

5. **Book a Timeslot**
   - Click "Book" on any available slot
   - Confirm booking
   - See success message
   - Navigate to "My Bookings" or `/bookings`
   - Verify booking appears

6. **Verify Slot No Longer Available**
   - Logout and login as another client (client2@bookspot.test)
   - Navigate to "Available Timeslots"
   - Verify the booked slot is NOT in the list

### Flow 2: Client Cancels Booking

1. **Login as Client with Booking**
   - Email: `client1@bookspot.test`
   - Password: `password`

2. **View Bookings**
   - Navigate to "My Bookings" or `/bookings`
   - See list of confirmed bookings

3. **Cancel a Booking**
   - Click "Cancel" on a booking
   - Confirm cancellation
   - Booking status changes to "Cancelled"

4. **Verify Slot Becomes Available**
   - Navigate to "Available Timeslots"
   - Verify the cancelled slot is now available again

### Flow 3: Service Provider Manages Schedule

1. **Login as Service Provider**
   - Email: `provider1@bookspot.test`
   - Password: `password`

2. **View Schedule**
   - Navigate to "My Schedule" or `/provider/timeslots`
   - See all timeslots (available and booked)
   - Filter by status: "Available", "Booked", "All"

3. **View Booked Slot Details**
   - See client name and email for booked slots
   - See booking time

4. **Cancel a Timeslot**
   - Click "Cancel Timeslot" on any slot
   - Confirm cancellation
   - Timeslot is deleted
   - If booked, client's booking is also cancelled

5. **Manually Add Client to Timeslot** (P2 Feature)
   - Click "Add Client" on an available slot
   - Select client from dropdown
   - Client now sees booking in their list

### Flow 4: Admin User Management

1. **Login as Admin**
   - Email: `admin@bookspot.test`
   - Password: `password`

2. **View All Users**
   - Navigate to "Admin" → "Users" or `/admin/users`
   - See list of all users with roles
   - Filter by role: Admin, Service Provider, Client

3. **Create New User**
   - Click "Create User"
   - Fill in details:
     - Name: "Test Provider"
     - Email: "testprovider@example.com"
     - Password: "password"
     - Role: "Service Provider"
     - Timezone: "America/New_York"
   - Click "Save"
   - User created and can login

4. **Edit User**
   - Click "Edit" on any user
   - Change role (e.g., Client → Service Provider)
   - Update name, email, or timezone
   - (Optional) Change password
   - Click "Save"

5. **View User Details**
   - Click on user name
   - See user activity:
     - For providers: list of timeslots
     - For clients: list of bookings
   - See statistics (total/active)

6. **Delete User**
   - Click "Delete" on any user (except self)
   - Confirm deletion
   - User deleted, cascades to timeslots/bookings

### Flow 5: Admin Acts as Service Provider

1. **Login as Admin**
   - Email: `admin@bookspot.test`
   - Password: `password`

2. **Access Provider's Schedule**
   - Navigate to "Admin" → "Users"
   - Click on a service provider
   - Click "Manage Schedule" or navigate to `/admin/providers/{id}/timeslots`

3. **Create Timeslot on Behalf**
   - Create timeslots as if you were the provider
   - Cancel timeslots
   - View bookings

---

## Running Tests

### Backend Tests (PHPUnit)

```bash
# Run all tests
php artisan test

# Run specific test file
php artisan test --filter=BookTimeslotTest

# Run with coverage (requires xdebug)
php artisan test --coverage

# Run feature tests only
php artisan test tests/Feature

# Run unit tests only
php artisan test tests/Unit
```

**Key Test Files**:
- `tests/Feature/Timeslots/CreateTimeslotTest.php`
- `tests/Feature/Timeslots/ViewTimeslotsTest.php`
- `tests/Feature/Bookings/BookTimeslotTest.php`
- `tests/Feature/Bookings/CancelBookingTest.php`
- `tests/Feature/Admin/UserManagementTest.php`

### Frontend Type Checking

```bash
# Check TypeScript types
npm run types

# Run linter
npm run lint

# Format code
npm run format
```

---

## Common Issues and Solutions

### Issue: "Database not found"
**Solution**: Create database manually:
```bash
mysql -u root -p
CREATE DATABASE bookspot;
exit;
```

### Issue: "Access denied for user"
**Solution**: Update `.env` with correct database credentials:
```
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

### Issue: "Class not found"
**Solution**: Regenerate autoload files:
```bash
composer dump-autoload
```

### Issue: "Vite manifest not found"
**Solution**: Build frontend assets:
```bash
npm run build
```

### Issue: "Port already in use"
**Solution**: Use different port:
```bash
php artisan serve --port=8001
```

### Issue: "Cannot book timeslot - already booked"
**Solution**: This is expected behavior (double-booking prevention). Choose a different timeslot or cancel existing booking.

### Issue: "Overlapping timeslot validation error"
**Solution**: Check provider's schedule. Timeslots cannot overlap. Choose a different time.

---

## API Endpoints Quick Reference

### Timeslots
- `GET /timeslots` - Browse available timeslots
- `GET /provider/timeslots` - Provider's schedule
- `GET /provider/timeslots/create` - Create timeslot form
- `POST /provider/timeslots` - Store new timeslot
- `DELETE /provider/timeslots/{id}` - Cancel timeslot

### Bookings
- `GET /bookings` - My bookings
- `POST /bookings` - Book a timeslot

### Admin
- `GET /admin/users` - List all users
- `GET /admin/users/create` - Create user form
- `POST /admin/users` - Store new user
- `GET /admin/users/{id}` - View user details
- `GET /admin/users/{id}/edit` - Edit user form
- `PUT /admin/users/{id}` - Update user
- `DELETE /admin/users/{id}` - Delete user

---

## Database Schema Quick Reference

### users
- `id`, `name`, `email`, `password`, `role`, `timezone`
- **Roles**: `admin`, `service_provider`, `client`

### timeslots
- `id`, `provider_id` (FK → users), `start_time`, `duration_minutes`

### bookings
- `id`, `timeslot_id` (FK → timeslots, UNIQUE), `client_id` (FK → users), `status`
- **Status**: `confirmed`, `cancelled`

---

## Development Workflow

### Making Changes

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Write Tests First** (TDD)
   ```bash
   # Create test file
   php artisan make:test Feature/YourFeatureTest
   
   # Write failing test
   # Run test (should fail)
   php artisan test --filter=YourFeatureTest
   ```

3. **Implement Feature**
   - Write migration if needed: `php artisan make:migration create_table_name`
   - Write model: `php artisan make:model ModelName`
   - Write controller: `php artisan make:controller ControllerName`
   - Write frontend component

4. **Run Tests** (should pass)
   ```bash
   php artisan test --filter=YourFeatureTest
   ```

5. **Run Code Quality Tools**
   ```bash
   # Backend
   composer pint
   
   # Frontend
   npm run lint
   npm run format
   npm run types
   ```

6. **Commit and Push**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

---

## Performance Optimization

### Database Indexes
All necessary indexes are created in migrations:
- `timeslots.start_time`
- `timeslots.(provider_id, start_time)`
- `bookings.timeslot_id` (unique)
- `bookings.client_id`

### Query Optimization
Use eager loading to prevent N+1 queries:
```php
// ✅ Good
$timeslots = Timeslot::with('provider', 'booking')->get();

// ❌ Bad (N+1 query)
$timeslots = Timeslot::all();
foreach ($timeslots as $slot) {
    echo $slot->provider->name; // Query for each slot
}
```

### Frontend Optimization
- Vite automatically code-splits
- React 19 compiler optimizes re-renders
- Use pagination for large lists

---

## Security Checklist

- ✅ All routes protected with authentication middleware
- ✅ Authorization checks in controllers using policies
- ✅ CSRF protection enabled (Laravel default)
- ✅ SQL injection prevented (Eloquent ORM)
- ✅ XSS prevention (React escapes by default)
- ✅ Password hashing (bcrypt)

- ✅ Rate limiting on authentication routes

---

## Support and Resources

- **Laravel Docs**: https://laravel.com/docs
- **Inertia.js Docs**: https://inertiajs.com
- **React Docs**: https://react.dev
- **Project Spec**: `/specs/001-timeslot-booking/spec.md`
- **API Contracts**: `/specs/001-timeslot-booking/contracts/`

---

## Next Steps After Setup

1. ✅ Complete setup and verify all test users can login
2. ✅ Test each user flow (see "Testing User Flows" above)
3. ✅ Run all tests and ensure they pass
4. ⏭️ Proceed to implementation (see `tasks.md`)
5. ⏭️ Implement P1 features (Client booking, Provider timeslots)
6. ⏭️ Implement P2 features (Provider manages bookings, Client cancels)
7. ⏭️ Implement P3 features (Admin user management)
