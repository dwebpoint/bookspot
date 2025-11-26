<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            // Timeslot permissions
            'view timeslots',
            'create timeslots',
            'update timeslots',
            'delete timeslots',
            'assign timeslots',

            // Booking permissions
            'view bookings',
            'create bookings',
            'cancel bookings',
            'view own bookings',

            // Client management permissions
            'view clients',
            'create clients',
            'update clients',
            'delete clients',

            // User management permissions (admin only)
            'view users',
            'create users',
            'update users',
            'delete users',

            // Calendar permissions
            'view calendar',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Create roles and assign permissions

        // Client role
        $clientRole = Role::firstOrCreate(['name' => 'client']);
        $clientRole->givePermissionTo([
            'view calendar',
            'view own bookings',
            'create bookings',
            'cancel bookings',
        ]);

        // Service Provider role
        $providerRole = Role::firstOrCreate(['name' => 'service_provider']);
        $providerRole->givePermissionTo([
            'view calendar',
            'view timeslots',
            'create timeslots',
            'update timeslots',
            'delete timeslots',
            'assign timeslots',
            'view bookings',
            'cancel bookings',
            'view clients',
            'create clients',
            'update clients',
            'delete clients',
        ]);

        // Admin role (has all permissions)
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $adminRole->givePermissionTo(Permission::all());

        $this->command->info('Roles and permissions seeded successfully!');
    }
}
