<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin user
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password'),
                'timezone' => 'UTC',
            ]
        );
        $admin->syncRoles(['admin']);

        // Create service provider users
        $providerEmails = [
            'provider1@bookspot.test',
            'provider2@bookspot.test',
            'provider3@bookspot.test',
        ];

        foreach ($providerEmails as $index => $email) {
            $provider = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => 'Service Provider '.($index + 1),
                    'password' => Hash::make('password'),
                    'timezone' => 'UTC',
                ]
            );
            $provider->syncRoles(['service_provider']);
        }

        // Create client users
        $clientEmails = [
            'client1@bookspot.test',
            'client2@bookspot.test',
            'client3@bookspot.test',
            'client4@bookspot.test',
            'client5@bookspot.test',
        ];

        foreach ($clientEmails as $index => $email) {
            $client = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => 'Client '.($index + 1),
                    'password' => Hash::make('password'),
                    'timezone' => 'UTC',
                ]
            );
            $client->syncRoles(['client']);
        }
    }
}
