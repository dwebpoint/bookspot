<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ClientSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get or create service providers
        $provider1 = User::firstOrCreate(
            ['email' => 'provider1@example.com'],
            [
                'name' => 'John Provider',
                'role' => 'service_provider',
                'password' => Hash::make('password'),
            ]
        );

        $provider2 = User::firstOrCreate(
            ['email' => 'provider2@example.com'],
            [
                'name' => 'Jane Provider',
                'role' => 'service_provider',
                'password' => Hash::make('password'),
            ]
        );

        // Create clients
        $client1 = User::firstOrCreate(
            ['email' => 'client1@example.com'],
            [
                'name' => 'Alice Client',
                'role' => 'client',
                'password' => Hash::make('password'),
            ]
        );

        $client2 = User::firstOrCreate(
            ['email' => 'client2@example.com'],
            [
                'name' => 'Bob Client',
                'role' => 'client',
                'password' => Hash::make('password'),
            ]
        );

        $client3 = User::firstOrCreate(
            ['email' => 'client3@example.com'],
            [
                'name' => 'Charlie Client',
                'role' => 'client',
                'password' => Hash::make('password'),
            ]
        );

        // Link clients to providers
        // Client 1 linked to Provider 1 only
        if (! $provider1->hasClient($client1->id)) {
            $provider1->clients()->attach($client1->id, [
                'created_by_provider' => true,
                'status' => 'active',
            ]);
        }

        // Client 2 linked to Provider 2 only
        if (! $provider2->hasClient($client2->id)) {
            $provider2->clients()->attach($client2->id, [
                'created_by_provider' => true,
                'status' => 'active',
            ]);
        }

        // Client 3 linked to both providers (shared client)
        if (! $provider1->hasClient($client3->id)) {
            $provider1->clients()->attach($client3->id, [
                'created_by_provider' => true,
                'status' => 'active',
            ]);
        }
        if (! $provider2->hasClient($client3->id)) {
            $provider2->clients()->attach($client3->id, [
                'created_by_provider' => false,
                'status' => 'active',
            ]);
        }

        $this->command->info('Client seeder completed successfully!');
        $this->command->info('Created/verified:');
        $this->command->info('- 2 service providers');
        $this->command->info('- 3 clients (1 shared between providers)');
    }
}
