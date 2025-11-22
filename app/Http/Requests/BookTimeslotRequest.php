<?php

namespace App\Http\Requests;

use App\Models\Timeslot;
use Illuminate\Foundation\Http\FormRequest;

class BookTimeslotRequest extends FormRequest
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
            'timeslot_id' => [
                'required',
                'exists:timeslots,id',
                function ($attribute, $value, $fail) {
                    $timeslot = Timeslot::with('booking')->find($value);

                    if (!$timeslot) {
                        $fail('The selected timeslot does not exist.');
                        return;
                    }

                    // Check if timeslot is in the past
                    if ($timeslot->start_time <= now()) {
                        $fail('This timeslot is no longer available for booking.');
                        return;
                    }

                    // Check if timeslot is already booked
                    if ($timeslot->booking && $timeslot->booking->status === 'confirmed') {
                        $fail('This timeslot has already been booked.');
                        return;
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
            'timeslot_id.required' => 'Please select a timeslot to book.',
            'timeslot_id.exists' => 'The selected timeslot does not exist.',
        ];
    }
}
