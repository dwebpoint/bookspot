<?php

namespace Database\Factories;

use App\Models\Timeslot;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Timeslot>
 */
class TimeslotFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<\Illuminate\Database\Eloquent\Model>
     */
    protected $model = Timeslot::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'provider_id' => User::factory()->state(['role' => 'service_provider']),
            'client_id' => null,
            'start_time' => fake()->dateTimeBetween('+1 day', '+30 days'),
            'duration_minutes' => fake()->randomElement([30, 45, 60, 90, 120]),
            'status' => 'available',
        ];
    }

    /**
     * Indicate that the timeslot is booked.
     */
    public function booked(?int $clientId = null): static
    {
        return $this->state(fn (array $attributes) => [
            'client_id' => $clientId ?? User::factory()->state(['role' => 'client']),
            'status' => 'booked',
        ]);
    }

    /**
     * Indicate that the timeslot is cancelled.
     */
    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'cancelled',
        ]);
    }

    /**
     * Indicate that the timeslot is completed.
     */
    public function completed(?int $clientId = null): static
    {
        return $this->state(fn (array $attributes) => [
            'client_id' => $clientId ?? User::factory()->state(['role' => 'client']),
            'status' => 'completed',
            'start_time' => fake()->dateTimeBetween('-30 days', '-1 day'),
        ]);
    }
}
