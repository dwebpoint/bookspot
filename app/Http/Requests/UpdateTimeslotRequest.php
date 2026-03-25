<?php

namespace App\Http\Requests;

use App\Models\Timeslot;
use Carbon\Carbon;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $timeslot = $this->route('timeslot');

        return [
            'start_time' => [
                'sometimes',
                'required',
                'date',
                function ($attribute, $value, $fail) {
                    $startTime = Carbon::parse($value, config('app.timezone'));
                    $now = Carbon::now(config('app.timezone'));

                    if ($startTime <= $now) {
                        $fail('The start time must be in the future.');
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
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $timeslot = $this->route('timeslot');
            $startTime = $this->has('start_time')
                ? Carbon::parse($this->start_time, config('app.timezone'))
                : Carbon::parse($timeslot->start_time);
            $durationMinutes = $this->duration_minutes;
            $endTime = $startTime->copy()->addMinutes($durationMinutes);

            $overlap = Timeslot::where('provider_id', $timeslot->provider_id)
                ->where('id', '!=', $timeslot->id)
                ->get()
                ->contains(function ($existing) use ($startTime, $endTime) {
                    $existingStart = $existing->start_time;
                    $existingEnd = $existingStart->copy()->addMinutes($existing->duration_minutes);

                    return $existingStart < $endTime && $existingEnd > $startTime;
                });

            if ($overlap) {
                $validator->errors()->add('start_time', 'This timeslot would overlap with an existing timeslot.');
            }
        });
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
            'duration_minutes.required' => 'The duration is required.',
            'duration_minutes.integer' => 'The duration must be a number.',
            'duration_minutes.min' => 'The duration must be at least 15 minutes.',
            'duration_minutes.max' => 'The duration cannot exceed 8 hours (480 minutes).',
        ];
    }
}
