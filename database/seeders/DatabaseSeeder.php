<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed roles and users
        $this->call([
            RolesAndPermissionsSeeder::class,
            RoleSeeder::class,
            TimeslotBookingSeeder::class,
        ]);

    }
}
