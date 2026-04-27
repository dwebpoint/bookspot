<?php

namespace App\Http\Requests\Provider;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class AssignClientRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled by policy
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'client_id' => [
                'required',
                'exists:users,id',
            ],
        ];
    }

    /**
     * Additional validation run after all rules pass.
     *
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->has('client_id')) {
                    return;
                }

                $clientId = $this->integer('client_id');
                $user = User::find($clientId);

                if ($user && ! $user->hasRole('client')) {
                    $validator->errors()->add('client_id', 'The selected user is not a client.');

                    return;
                }

                if (! $this->user()->hasClient($clientId)) {
                    $validator->errors()->add('client_id', 'You can only assign clients you are linked to.');
                }
            },
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'client_id.required' => 'Please select a client.',
            'client_id.exists' => 'The selected client does not exist.',
        ];
    }
}
