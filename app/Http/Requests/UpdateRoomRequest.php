<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoomRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array|string>
     */
    public function rules(): array
    {
        // Get the room instance from the route
        $room = $this->route('room');

        return [
            'code' => ['required', 'string', 'max:20', Rule::unique('rooms')->ignore($room)],
            'name' => 'required|string|max:255',
            'building_id' => 'required|exists:buildings,id',
        ];
    }
}
