<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AssignRolesToExistingUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all users who don't have roles assigned via Spatie
        $users = User::whereDoesntHave('roles')->get();

        foreach ($users as $user) {
            // Assign role based on the role column value
            if (isset($user->role)) {
                $roleName = $user->role;
                
                // Map old role names to new role names if needed
                $roleMapping = [
                    'admin' => 'admin',
                    'service_provider' => 'service_provider',
                    'client' => 'client',
                ];

                if (isset($roleMapping[$roleName])) {
                    $user->assignRole($roleMapping[$roleName]);
                    $this->command->info("Assigned role '{$roleMapping[$roleName]}' to user: {$user->email}");
                }
            } else {
                // Default to client role if no role column exists
                $user->assignRole('client');
                $this->command->info("Assigned default 'client' role to user: {$user->email}");
            }
        }

        $this->command->info('Roles assigned to all existing users successfully!');
    }
}
