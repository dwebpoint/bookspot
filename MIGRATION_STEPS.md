# Quick Migration Steps

## Prerequisites
Ensure you have backed up your database before proceeding.

## Step-by-Step Migration

### 0. Clean Up Duplicate Migrations (One-Time)
```bash
# Remove the duplicate role migration file
rm database/migrations/2025_11_22_150000_add_role_to_users_table.php
```

### 1. Install Package
```bash
composer require spatie/laravel-permission
```

### 2. Publish Spatie Files
```bash
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
```

### 3. Run All Migrations
```bash
php artisan migrate
```

### 4. Seed Roles & Permissions
```bash
php artisan db:seed --class=RolesAndPermissionsSeeder
```

### 5. Migrate Existing Users
```bash
php artisan db:seed --class=AssignRolesToExistingUsersSeeder
```

### 6. Clear Cache
```bash
php artisan permission:cache-reset
php artisan config:clear
```

### 7. Test the Application
- Login as different user types (admin, provider, client)
- Verify all features work correctly
- Check that permissions are enforced properly

## Verification Commands

### Check user roles:
```bash
php artisan tinker
```

```php
$user = \App\Models\User::find(1);
$user->roles->pluck('name'); // Should show assigned roles
$user->hasRole('admin'); // Should return true/false
$user->getAllPermissions(); // Shows all permissions
```

### List all roles:
```php
\Spatie\Permission\Models\Role::with('permissions')->get();
```

### List all permissions:
```php
\Spatie\Permission\Models\Permission::all()->pluck('name');
```

## Rollback (if needed)

If you need to rollback:

```bash
# Rollback Spatie migrations
php artisan migrate:rollback --step=6

# Remove package
composer remove spatie/laravel-permission
```

Then restore the original User model and CheckRole middleware from git history.

## What Changed?

✅ **User Model**: Now uses `HasRoles` trait
✅ **Middleware**: Updated to use `hasAnyRole()` 
✅ **Policies**: Enhanced with permission checks
✅ **Database**: New permission tables added
✅ **Backward Compatible**: Existing code still works

## Need Help?

See full documentation: `docs/SPATIE_PERMISSIONS.md`
