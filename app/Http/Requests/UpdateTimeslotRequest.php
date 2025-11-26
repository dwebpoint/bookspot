<?php

namespace App\Http\Requests;

use App\Models\Timeslot;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;

class UpdateTimeslotRequest extends FormRequest
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
        $timeslot = $this->route('timeslot');

        return [
            'duration_minutes' => [
                'required',
                'integer',
                'min:15',
                'max:480',
                function ($attribute, $value, $fail) use ($timeslot) {
                    $startTime = Carbon::parse($timeslot->start_time);
                    $endTime = $startTime->copy()->addMinutes($value);

                    // Check for overlapping timeslots for the same provider (excluding current timeslot)
                    $overlap = Timeslot::where('provider_id', $timeslot->provider_id)
                        ->where('id', '!=', $timeslot->id)
                        ->whereRaw(
                            '(start_time < ? AND DATE_ADD(start_time, INTERVAL duration_minutes MINUTE) > ?)',
                            [$endTime->toDateTimeString(), $startTime->toDateTimeString()]
                        )
                        ->exists();
                    if ($overlap) {
                        $fail('This duration would cause the timeslot to overlap with an existing timeslot.');
                    }
                },
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
            'duration_minutes.required' => 'The duration is required.',
            'duration_minutes.integer' => 'The duration must be a number.',
            'duration_minutes.min' => 'The duration must be at least 15 minutes.',
            'duration_minutes.max' => 'The duration cannot exceed 8 hours (480 minutes).',
        ];
    }
}
