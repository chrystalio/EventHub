<?php

namespace App\Http\Requests;

use App\Models\Event;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;

class UpdateEventRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'organizer' => 'required|string|max:255',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'max_guests_per_registration' => 'required|integer|min:0',
            'building_id' => 'required|exists:buildings,id',
            'room_id' => [
                'required',
                'exists:rooms,id',
                function ($attribute, $value, $fail) {
                    try {
                        $startTime = Carbon::parse(request()->input('start_time'), 'Asia/Jakarta');
                        $endTime = Carbon::parse(request()->input('end_time'), 'Asia/Jakarta');

                        $conflict = Event::where('room_id', $value)
                            ->where('id', '!=', $this->route('event')->id)
                            ->where('start_time', '<', $endTime)
                            ->where('end_time', '>', $startTime)
                            ->exists();

                        if ($conflict) {
                            $fail('The selected room is already booked during this time period.');
                        }
                    } catch (\Exception $e) {
                        $fail('Invalid date format provided.');
                    }
                },
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->start_time) {
            try {
                $startTime = Carbon::parse($this->start_time, 'Asia/Jakarta');
                $this->merge(['start_time' => $startTime->format('Y-m-d H:i:s')]);
            } catch (\Exception $e) {
                // Handle silently
            }
        }

        if ($this->end_time) {
            try {
                $endTime = Carbon::parse($this->end_time, 'Asia/Jakarta');
                $this->merge(['end_time' => $endTime->format('Y-m-d H:i:s')]);
            } catch (\Exception $e) {
                // Handle silently
            }
        }
    }
}
