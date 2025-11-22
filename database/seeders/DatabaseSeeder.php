<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
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
            RoleSeeder::class,
            TimeslotBookingSeeder::class,
        ]);

        // Original test user (kept for backward compatibility)
        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => 'password',
                'role' => 'client',
                'timezone' => 'UTC',
                'email_verified_at' => now(),
            ]
        );
    }
}
