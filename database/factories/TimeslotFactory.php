<?php

namespace Database\Factories;

use App\Enums\TimeslotStatus;
use App\Models\Timeslot;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Model;

/**
 * @extends Factory<Timeslot>
 */
class TimeslotFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<Model>
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
            'status' => TimeslotStatus::Available,
        ];
    }

    /**
     * Indicate that the timeslot is booked.
     */
    public function booked(?int $clientId = null): static
    {
        return $this->state(fn (array $attributes) => [
            'client_id' => $clientId ?? User::factory()->state(['role' => 'client']),
            'status' => TimeslotStatus::Booked,
        ]);
    }

    /**
     * Indicate that the timeslot is completed.
     */
    public function completed(?int $clientId = null): static
    {
        return $this->state(fn (array $attributes) => [
            'client_id' => $clientId ?? User::factory()->state(['role' => 'client']),
            'status' => TimeslotStatus::Completed,
            'start_time' => fake()->dateTimeBetween('-30 days', '-1 day'),
        ]);
    }
}
