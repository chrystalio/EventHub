<?php

namespace App\Http\Requests;

use App\Models\Event; // Make sure Event is imported
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule; // <-- IMPORTANT: Add this import

class StoreRegistrationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        /** @var Event $event */
        $event = $this->event;

        return Auth::check() && !$event->isUserRegistered(auth()->id());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array|string>
     */
    public function rules(): array
    {
        /** @var Event $event */
        $event = $this->event;
        $guestCount = (int)$this->input('guest_count', 0);

        return [
            'guest_count' => ['required', 'integer', 'min:0', 'max:' . $event->max_guests_per_registration],
            'guests' => [
                Rule::requiredIf($guestCount > 0),
                'array',
                'size:' . $guestCount
            ],
            'guests.*.name' => [Rule::requiredIf($guestCount > 0), 'string', 'max:255'],
            'guests.*.phone' => [Rule::requiredIf($guestCount > 0), 'string', 'max:20'],
        ];
    }

    public function messages(): array
    {
        return [
            'guests.size' => 'The number of guests provided does not match the guest count.',
        ];
    }
}
