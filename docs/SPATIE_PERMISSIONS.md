# Spatie Laravel Permission - Migration Guide

## Overview

The RBAC system has been re-implemented using [Spatie Laravel Permission](https://spatie.be/docs/laravel-permission/v6/introduction) package for more robust and flexible permission management.

## Installation Steps

### 1. Install Spatie Permission Package

```bash
composer require spatie/laravel-permission
```

### 2. Publish Configuration and Migrations

```bash
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
```

### 3. Run Migrations

Run all migrations including the new role column migration and Spatie's permission tables:

```bash
php artisan migrate
```

This will create the following tables:
- `roles` - Stores role definitions
- `permissions` - Stores permission definitions
- `model_has_permissions` - Links users to permissions
- `model_has_roles` - Links users to roles
- `role_has_permissions` - Links roles to permissions

### 4. Seed Roles and Permissions

```bash
php artisan db:seed --class=RolesAndPermissionsSeeder
```

This creates:
- **3 Roles**: admin, service_provider, client
- **19 Permissions**: timeslot management, booking management, client management, user management, calendar access

### 5. Assign Roles to Existing Users

```bash
php artisan db:seed --class=AssignRolesToExistingUsersSeeder
```

This migrates existing users from the `role` column to Spatie's role system.

## Role & Permission Structure

### Client Role
Permissions:
- `view calendar`
- `view own bookings`
- `create bookings`
- `cancel bookings`

### Service Provider Role
Permissions:
- `view calendar`
- `view timeslots`
- `create timeslots`
- `update timeslots`
- `delete timeslots`
- `assign timeslots`
- `view bookings`
- `cancel bookings`
- `view clients`
- `create clients`
- `update clients`
- `delete clients`

### Admin Role
Has all permissions (superuser)

## Changes Made

### 1. User Model (`app/Models/User.php`)
- Added `HasRoles` trait from Spatie
- Updated role check methods to use `hasRole()`:
  - `isAdmin()` → uses `hasRole('admin')`
  - `isServiceProvider()` → uses `hasRole('service_provider')`
  - `isClient()` → uses `hasRole('client')`
- Backward compatible with existing code

### 2. Middleware (`app/Http/Middleware/CheckRole.php`)
- Updated to use `hasAnyRole()` instead of checking `role` column
- Works seamlessly with existing route middleware: `middleware('role:client,admin')`

### 3. Policies
- **TimeslotPolicy**: Added permission checks alongside role checks
- **BookingPolicy**: Added permission checks alongside role checks
- Provides granular control: role + permission + ownership checks

### 4. New Migrations
- `2025_11_22_150000_add_role_to_users_table.php` - Ensures role column exists
- Spatie migrations (from vendor:publish)

### 5. New Seeders
- `RolesAndPermissionsSeeder.php` - Creates roles and permissions
- `AssignRolesToExistingUsersSeeder.php` - Migrates existing users

## Usage Examples

### Checking Permissions in Controllers

```php
// Check if user has permission
if ($user->can('create timeslots')) {
    // Allow action
}

// Check if user has role
if ($user->hasRole('admin')) {
    // Admin logic
}

// Check if user has any of multiple roles
if ($user->hasAnyRole(['admin', 'service_provider'])) {
    // Provider or admin logic
}

// Check if user has all roles
if ($user->hasAllRoles(['admin', 'service_provider'])) {
    // Must have both roles
}
```

### Checking Permissions in Blade/React

```php
@can('create timeslots')
    <button>Create Timeslot</button>
@endcan

@role('admin')
    <a href="/admin">Admin Panel</a>
@endrole
```

### Middleware Usage

```php
// In routes/web.php (already configured)
Route::middleware('role:admin')->group(function () {
    // Admin routes
});

// Or use permission middleware
Route::middleware('permission:create users')->group(function () {
    // Routes requiring specific permission
});
```

### Assigning Roles/Permissions

```php
// Assign role to user
$user->assignRole('client');

// Assign multiple roles
$user->assignRole(['client', 'service_provider']);

// Assign permission directly to user
$user->givePermissionTo('create timeslots');

// Remove role
$user->removeRole('client');

// Sync roles (removes all other roles)
$user->syncRoles(['admin']);
```

## Benefits

1. **Granular Control**: Separate permissions from roles
2. **Flexibility**: Easy to add new permissions without changing code
3. **Caching**: Spatie caches permissions for performance
4. **Database-Driven**: Manage permissions via database, not code
5. **Industry Standard**: Well-maintained, documented package
6. **Guard Support**: Works with multiple authentication guards
7. **Team Support**: Can assign roles per team/organization
8. **Wildcard Permissions**: Support for patterns like `posts.*`

## Backward Compatibility

The existing code continues to work because:
- `isAdmin()`, `isServiceProvider()`, `isClient()` methods still work
- Route middleware `role:admin` still works
- The `role` column is maintained for reference

## Testing

After migration, test:
1. ✅ Login with each role type
2. ✅ Access role-specific pages
3. ✅ Verify permissions work correctly
4. ✅ Check that unauthorized access is blocked
5. ✅ Test existing features (timeslots, bookings, clients)

## Troubleshooting

### Cache Issues
```bash
# Clear permission cache
php artisan permission:cache-reset

# Or clear all cache
php artisan cache:clear
php artisan config:clear
```

### Role Not Found
Ensure you've run the seeder:
```bash
php artisan db:seed --class=RolesAndPermissionsSeeder
```

### User Has No Role
Run the assignment seeder:
```bash
php artisan db:seed --class=AssignRolesToExistingUsersSeeder
```

## Future Enhancements

1. **Custom Permissions**: Add feature-specific permissions
2. **Team Permissions**: Scope permissions to organizations
3. **Permission UI**: Admin interface to manage permissions
4. **Audit Log**: Track permission changes
5. **API Permissions**: Separate API token permissions

## Documentation

- [Spatie Permission Docs](https://spatie.be/docs/laravel-permission/v6/introduction)
- [Laravel Authorization](https://laravel.com/docs/authorization)
