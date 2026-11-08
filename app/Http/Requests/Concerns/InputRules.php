<?php

namespace App\Http\Requests\Concerns;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class InputRules
{
    public static function name(string $presence = 'required', int $max = 100): array
    {
        return [$presence, 'string', 'max:'.$max, "regex:/^[\\p{L}][\\p{L}\\p{M} .’'\\-]*$/u"];
    }

    public static function vital(int $maxLength = 50, string $presence = 'nullable', ?float $min = null, ?float $max = null): array
    {
        return ['bail', $presence, 'regex:/^\d+(?:\.\d+)?$/D', function ($attribute, $value, $fail) use ($maxLength, $min, $max) {
            if (strlen((string) $value) > $maxLength) {
                $fail("The {$attribute} must not exceed {$maxLength} characters.");
                return;
            }
            if ($value !== null && $value !== '' && $min !== null && $max !== null) {
                $number = (float) $value;
                if ($number < $min || $number > $max) {
                    $fail("The {$attribute} must be between {$min} and {$max}.");
                }
            }
        }];
    }

    public static function staffClinicId(string $presence = 'required'): array
    {
        return [$presence, 'string', 'max:5', 'regex:/^[ADN]-\d{3}$/D'];
    }

    public static function usepEmail(string $presence = 'required'): array
    {
        return [$presence, 'email', 'max:150', 'regex:/^[A-Za-z0-9._%+\-]+@usep\.edu\.ph$/i'];
    }

    public static function bloodPressure(string $presence = 'nullable', int $max = 50): array
    {
        return [$presence, 'string', 'max:'.$max, 'regex:/^\d{2,3}\/\d{2,3}$/D'];
    }

    public static function measurement(string $unit): array
    {
        // Registration stores cm/kg suffixes; generic record forms also accept bare values.
        return ['nullable', 'string', 'max:20', 'regex:/^\d+(?:\.\d+)?(?: '.preg_quote($unit, '/').')?$/D'];
    }

    public static function staffProfile(): array
    {
        return [
            'sex' => 'nullable|in:Male,Female',
            'dob' => 'nullable|date_format:Y-m-d|before_or_equal:today',
            'mobile_no' => ['nullable', 'string', 'max:20', 'regex:/^09\d{2}-?\d{3}-?\d{4}$/D'],
            'landline_no' => ['nullable', 'string', 'max:20', 'regex:/^[0-9+() .-]+$/D'],
            'address_block' => 'nullable|string|max:50',
            'address_street' => 'nullable|string|max:100',
            'address_brgy' => 'nullable|string|max:100',
            'address_city' => 'nullable|string|max:100',
            'address_province' => 'nullable|string|max:100',
            'role_description' => 'nullable|string',
            'employment_status' => 'nullable|in:Full-time,Part-time,Contractual',
            'schedule' => 'nullable|string|max:255',
        ];
    }

    public static function actor(FormRequest $request, string $field, array $roles, $record = null): array
    {
        $expected = $record ? $record->$field : $request->user()?->user_id;

        return [$record ? 'sometimes' : 'nullable', $record && $expected !== null ? 'required' : 'nullable',
            'integer', Rule::exists('users', 'user_id')->whereIn('role', $roles),
            Rule::in([$expected]),
        ];
    }

    public static function certificate(FormRequest $request, $record = null): array
    {
        $from = $request->input('date_from', $record?->date_from);
        $to = $request->input('date_to', $record?->date_to);
        $released = $request->boolean('is_released', (bool) $record?->is_released);
        $rules = [
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d'],
            'exam_date' => ['nullable', 'date_format:Y-m-d'],
            'purpose' => 'nullable|string|max:255',
            'physician_name' => 'nullable|string|max:255',
        ];
        // Compare against the effective stored counterpart when only one side changes.
        if (is_string($to) && preg_match('/^\d{4}-\d{2}-\d{2}$/D', $to)) {
            $rules['date_from'][] = 'before_or_equal:'.$to;
        }
        if (is_string($from) && preg_match('/^\d{4}-\d{2}-\d{2}$/D', $from)) {
            $rules['date_to'][] = 'after_or_equal:'.$from;
        }
        foreach (['findings', 'license_no'] as $field) {
            $rules[$field] = [Rule::requiredIf($released && ($request->exists($field) || blank($record?->$field))), 'nullable', 'string'];
        }
        $rules['license_no'][] = 'max:100';

        return $rules;
    }
}
