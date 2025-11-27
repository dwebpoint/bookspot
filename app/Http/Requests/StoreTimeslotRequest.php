<?php

namespace App\Http\Requests;

use App\Models\Timeslot;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;

class StoreTimeslotRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Policy handles authorization
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'start_time' => [
                'required',
                'date',
                'after:now',
                function ($attribute, $value, $fail) {
                    $startTime = Carbon::parse($value);
                    $endTime = $startTime->copy()->addMinutes($this->duration_minutes);

                    // Check for overlapping timeslots for the same provider
                    $overlap = Timeslot::where('provider_id', auth()->id())
                        ->get()
                        ->contains(function ($existing) use ($startTime, $endTime) {
                            $existingStart = Carbon::parse($existing->start_time);
                            $existingEnd = $existingStart->copy()->addMinutes($existing->duration_minutes);

                            // Overlap if existing slot starts before new slot ends and ends after new slot starts
                            return $existingStart < $endTime && $existingEnd > $startTime;
                        });

                    if ($overlap) {
                        $fail('This timeslot overlaps with an existing timeslot.');
                    }
                },
            ],
            'duration_minutes' => [
                'required',
                'integer',
                'min:15',
                'max:480',
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'start_time.required' => 'The start time is required.',
            'start_time.date' => 'The start time must be a valid date.',
            'start_time.after' => 'The start time must be in the future.',
            'duration_minutes.required' => 'The duration is required.',
            'duration_minutes.integer' => 'The duration must be a number.',
            'duration_minutes.min' => 'The duration must be at least 15 minutes.',
            'duration_minutes.max' => 'The duration cannot exceed 8 hours (480 minutes).',
        ];
    }
}
