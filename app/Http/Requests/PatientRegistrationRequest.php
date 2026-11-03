<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\InputRules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PatientRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        // Emails are matched case-insensitively; store them lowercase.
        foreach (['usep_email', 'usep_email_confirmation'] as $key) {
            if (is_string($this->input($key))) {
                $this->merge([$key => strtolower($this->input($key))]);
            }
        }
    }

    public function rules(): array
    {
        $name = InputRules::name();
        $words = ['required', 'string', 'max:100'];
        $phone = ['required', 'regex:/^09\\d{9}$/'];
        $text = ['required', 'string', 'max:255'];
        $yesNo = ['required', Rule::in(['Yes', 'No'])];
        $isFemale = $this->input('sex') === 'Female';

        $rules = [
            // Account
            'clinic_id' => ['required', 'regex:/^20\\d{2}-\\d{5}$/', 'unique:users,clinic_id'],
            'usep_email' => ['required', 'email', 'max:150', 'regex:/^[A-Za-z0-9._%+\\-]+@usep\\.edu\\.ph$/i', 'unique:users,usep_email', 'confirmed'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'patient_type' => ['required', Rule::in(['Student', 'Faculty'])],

            // Personal information
            'lastname' => $name,
            'firstname' => $name,
            'middlename' => $name,
            'dob' => ['required', 'date_format:Y-m-d', 'before_or_equal:today', 'after:1900-01-01'],
            'sex' => ['required', Rule::in(['Male', 'Female'])],
            'civil_status' => ['required', Rule::in(['Single', 'Married', 'Widowed', 'Separated'])],
            'religion' => $words,
            'nationality' => $words,
            'college_dept' => ['required', Rule::in([
                'College of Information and Computing (CIC)',
                'College of Technology (CT)',
                'College of Engineering (COE)',
                'College of Arts and Sciences (CAS)',
                'College of Applied Economics (CAEC)',
                'College of Business Administration (CBA)',
                'College of Education (CED)',
                'Faculty / Staff',
            ])],
            'year_level' => ['required', Rule::in(['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'N/A'])],
            'birthplace' => $text,
            'city_address' => $text,
            'prov_address' => $text,
            'contact_no' => $phone,
            'em_name' => $name,
            'em_contact' => $phone,
            'em_rel' => ['required', 'string', 'max:50'],

            // Health record
            'gen_appearance' => ['nullable', 'string', 'max:1000'],
            'height' => ['required', 'numeric', 'between:50,250'],
            'weight' => ['required', 'numeric', 'between:10,300'],
            'blood_pressure' => ['required', 'regex:/^\\d{2,3}\\/\\d{2,3}$/'],
            'pulse_rate' => ['required', 'numeric', 'between:30,220'],
            'resp_rate' => ['required', 'numeric', 'between:5,60'],
            'temp' => ['required', 'numeric', 'between:30,45'],
            'cr_rest' => ['required', 'numeric', 'between:30,250'],
            'cr_activity' => ['required', 'numeric', 'between:30,250'],
            'infectious_diseases' => ['nullable', 'string', 'max:1000'],
            'social_hx' => ['nullable', 'string', 'max:1000'],
            'family_hx' => ['nullable', 'string', 'max:1000'],

            // Questionnaire
            'hosp_admitted' => $yesNo,
            'hosp_illness' => ['nullable', 'required_if:hosp_admitted,Yes', 'string', 'max:255'],
            'hosp_when' => ['nullable', 'required_if:hosp_admitted,Yes', 'string', 'max:100'],
            'surgery' => $yesNo,
            'surg_type' => ['nullable', 'required_if:surgery,Yes', 'string', 'max:255'],
            'surg_when' => ['nullable', 'required_if:surgery,Yes', 'string', 'max:100'],
            'infectious' => ['nullable', 'array'],
            'infectious.*' => [Rule::in(['Measles', 'German Measles', 'Chickenpox', 'Hepatitis A', 'Tetanus', 'PTB'])],
            'syncope' => $yesNo,

            // Females only
            'female_menarche' => ['nullable', 'numeric', 'between:5,25'],
            'female_periods_yr' => ['nullable', 'numeric', 'between:0,24'],
            'female_regular' => ['nullable', Rule::in(['Yes', 'No'])],
            'female_irregular_spec' => ['nullable', Rule::requiredIf($isFemale && $this->input('female_regular') === 'No'), 'string', 'max:1000'],
            'female_dysmenorrhea' => ['nullable', Rule::in(['Yes', 'No'])],
            'female_symptoms' => ['nullable', 'string', 'max:1000'],

            // Confirmation
            'sworn' => ['accepted'],
            'privacy' => ['accepted'],
            'signature' => InputRules::name('required', 150),
        ];

        foreach (['skin', 'lymph', 'integument', 'circulatory', 'endocrine', 'allergic', 'heent', 'mouth', 'breast',
            'respiratory', 'cardiovascular', 'gastrointestinal', 'genitourinary', 'psychiatric'] as $system) {
            $rules["sr_{$system}"] = ['required', 'string', 'max:100'];
        }

        foreach ($rules as $field => &$rule) {
            if (str_starts_with($field, 'female_')) {
                array_unshift($rule, Rule::excludeIf(! $isFemale));
            }
        }
        unset($rule);

        return $rules;
    }

    public function messages(): array
    {
        return [
            'clinic_id.regex' => 'Use the format 2024-00001.',
            'clinic_id.unique' => 'This ID number is already registered. Please sign in instead.',
            'usep_email.regex' => 'Use your USeP email (name@usep.edu.ph).',
            'usep_email.unique' => 'This email address is already registered.',
            'usep_email.confirmed' => 'The email addresses do not match.',
            'password.confirmed' => 'The passwords do not match.',
            'contact_no.regex' => 'Enter a valid number (09XXXXXXXXX).',
            'em_contact.regex' => 'Enter a valid number (09XXXXXXXXX).',
            'signature.regex' => 'Type your full name in CAPITAL LETTERS.',
            'sworn.accepted' => 'You must confirm this statement.',
            'privacy.accepted' => 'You must give your consent to continue.',
        ];
    }
}
