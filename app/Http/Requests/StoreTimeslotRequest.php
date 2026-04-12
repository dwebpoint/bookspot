<?php

namespace App\Http\Requests;

use App\Models\Timeslot;
use Carbon\Carbon;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;

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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'start_time' => [
                'required',
                'date',
                function ($attribute, $value, $fail) {
                    // Parse incoming time as app timezone and validate it's in the future
                    $startTime = Carbon::parse($value, config('app.timezone'));
                    $now = Carbon::now(config('app.timezone'));

                    if ($startTime <= $now) {
                        $fail('The start time must be in the future.');

                        return;
                    }

                    $endTime = $startTime->copy()->addMinutes($this->duration_minutes);

                    // Check for overlapping timeslots for the same provider
                    $startTimeUtc = $startTime->copy()->utc()->format('Y-m-d H:i:s');
                    $endTimeUtc = $endTime->copy()->utc()->format('Y-m-d H:i:s');

                    $overlap = Timeslot::where('provider_id', auth()->id())
                        ->where('start_time', '<', $endTimeUtc)
                        ->whereRaw(
                            match (DB::connection()->getDriverName()) {
                                'sqlite' => "datetime(start_time, '+' || duration_minutes || ' minutes') > ?",
                                default => 'DATE_ADD(start_time, INTERVAL duration_minutes MINUTE) > ?',
                            },
                            [$startTimeUtc]
                        )
                        ->exists();

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
            'client_id' => [
                'nullable',
                'exists:users,id',
                function ($attribute, $value, $fail) {
                    if ($value) {
                        // Verify provider-client relationship
                        $provider = auth()->user();
                        if (! $provider->hasClient($value)) {
                            $fail('You can only assign clients you are linked to.');
                        }
                    }
                },
            ],
            'comment' => [
                'nullable',
                'string',
                'max:1000',
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
