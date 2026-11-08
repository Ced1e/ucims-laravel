<?php

namespace Tests\Feature;

use App\Http\Requests\PatientRegistrationRequest;
use App\Http\Requests\StoreEndorsedRequest;
use App\Http\Requests\StoreMedicineIssuanceRequest;
use App\Http\Requests\StoreQueueRequest;
use App\Http\Requests\StoreStaffProfileRequest;
use App\Http\Requests\StoreTriageRequest;
use App\Http\Requests\UpdateClinicQueueRequest;
use App\Http\Requests\UpdateEndorsedRequest;
use App\Http\Requests\UpdateMedicalCertificateRequest;
use App\Http\Requests\UpdatePprHealthQuestionnaireRequest;
use App\Http\Requests\UpdatePprHealthRecordRequest;
use App\Http\Requests\UpdateStaffProfileRequest;
use App\Http\Requests\UpdateTriageRecordRequest;
use App\Models\Endorsed;
use App\Models\MedicalCertificate;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Routing\Route;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class PriorityValidationTest extends TestCase
{
    public function test_health_record_accepts_registration_units_without_accepting_wrong_units(): void
    {
        foreach ([\App\Http\Requests\StorePprHealthRecordRequest::class, UpdatePprHealthRecordRequest::class] as $class) {
            $this->assertTrue($this->check($class, ['height' => '170 cm', 'weight' => '62.5 kg'], ['height', 'weight'])->passes());
            $this->assertTrue($this->check($class, ['height' => '170', 'weight' => '62.5'], ['height', 'weight'])->passes());
            $this->assertTrue($this->check($class, ['height' => '170 kg', 'weight' => 'abc'], ['height', 'weight'])->fails());
        }
    }

    protected function setUp(): void
    {
        parent::setUp();
        $this->assertSame('sqlite', config('database.default'));
        $this->assertSame(':memory:', config('database.connections.sqlite.database'));
    }

    private function check(string $class, array $data, array $fields, ?Model $record = null, ?User $user = null)
    {
        $request = $class::create('/', 'POST', $data);
        $route = new Route('POST', '/', fn () => null);
        $route->bind($request);
        if ($record) {
            foreach (['medicalCertificate', 'triageRecord', 'medicineIssuance', 'endorsed', 'consultation'] as $key) {
                $route->setParameter($key, $record);
            }
        }
        $request->setUserResolver(fn () => $user);
        $request->setRouteResolver(fn () => $route);

        return Validator::make($data, array_intersect_key($request->rules(), array_flip($fields)));
    }

    public function test_registration_accepts_unicode_names_and_rejects_oversize_relationship(): void
    {
        $v = $this->check(PatientRegistrationRequest::class, ['firstname' => 'Élodie O’Neill', 'em_rel' => str_repeat('a', 51)], ['firstname', 'em_rel']);
        $this->assertFalse($v->errors()->has('firstname'));
        $this->assertTrue($v->errors()->has('em_rel'));
    }

    public function test_registration_discards_inapplicable_female_fields(): void
    {
        $v = $this->check(PatientRegistrationRequest::class, ['sex' => 'Male', 'female_menarche' => 'garbage'], ['female_menarche']);
        $this->assertTrue($v->passes());
        $this->assertSame([], $v->validated());
    }

    public function test_triage_requires_complaint_and_bp_and_rejects_malformed_vitals(): void
    {
        $v = $this->check(StoreTriageRequest::class, ['heart_rate' => '-1', 'temperature' => 'warm'], ['blood_pressure', 'chief_complaint', 'heart_rate', 'temperature']);
        foreach (['blood_pressure', 'chief_complaint', 'heart_rate', 'temperature'] as $field) {
            $this->assertTrue($v->errors()->has($field), $field);
        }
        $this->assertTrue($this->check(StoreTriageRequest::class, ['heart_rate' => ['bad']], ['heart_rate'])->fails());
        $this->assertTrue($this->check(StoreTriageRequest::class, ['blood_pressure' => '120/80', 'chief_complaint' => 'Headache', 'temperature' => '36.8'], ['blood_pressure', 'chief_complaint', 'temperature'])->passes());
    }

    public function test_certificate_dates_are_real_iso_dates_and_ordered_on_partial_update(): void
    {
        $record = new MedicalCertificate(['date_from' => '2026-10-10', 'date_to' => '2026-10-20']);
        foreach ([['date_to' => '2026-10-09'], ['date_from' => '2026-10-21'], ['exam_date' => '2026-02-30'], ['date_from' => 'tomorrow']] as $data) {
            $this->assertTrue($this->check(UpdateMedicalCertificateRequest::class, $data, array_keys($data), $record)->fails(), json_encode($data));
        }
        $this->assertTrue($this->check(UpdateMedicalCertificateRequest::class, ['date_to' => '2026-10-10'], ['date_to'], $record)->passes());
    }

    public function test_release_requires_findings_and_license_but_accepts_stored_values(): void
    {
        $data = ['is_released' => true];
        $fields = ['is_released', 'findings', 'license_no'];
        $v = $this->check(UpdateMedicalCertificateRequest::class, $data, $fields, new MedicalCertificate);
        $this->assertTrue($v->errors()->has('findings'));
        $this->assertTrue($v->errors()->has('license_no'));
        $this->assertTrue($this->check(UpdateMedicalCertificateRequest::class, $data, $fields, new MedicalCertificate(['findings' => 'Well', 'license_no' => '123']))->passes());
    }

    public function test_questionnaire_uses_yes_no_and_database_widths(): void
    {
        $this->assertTrue($this->check(UpdatePprHealthQuestionnaireRequest::class, ['syncope' => 'Yes', 'surgery' => 'No'], ['syncope', 'surgery'])->passes());
        $this->assertTrue($this->check(UpdatePprHealthQuestionnaireRequest::class, ['syncope' => 'maybe', 'hosp_illness' => str_repeat('a', 256)], ['syncope', 'hosp_illness'])->fails());
        $this->assertTrue($this->check(UpdatePprHealthRecordRequest::class, ['sr_skin' => str_repeat('a', 101)], ['sr_skin'])->fails());
    }

    public function test_queue_rejects_unknown_visit_types_and_statuses(): void
    {
        $v = $this->check(UpdateClinicQueueRequest::class, ['visit_type' => 'garbage', 'status' => 'invented'], ['visit_type', 'status']);
        $this->assertTrue($v->errors()->has('visit_type'));
        $this->assertTrue($v->errors()->has('status'));
        $this->assertTrue($this->check(UpdateClinicQueueRequest::class, ['time_in' => str_repeat('x', 51), 'time_out' => ['bad']], ['time_in', 'time_out'])->fails());
    }

    public function test_staff_rejects_future_dob_and_malformed_mobile(): void
    {
        $v = $this->check(UpdateStaffProfileRequest::class, ['dob' => '2099-01-01', 'mobile_no' => 'abc'], ['dob', 'mobile_no']);
        $this->assertTrue($v->errors()->has('dob'));
        $this->assertTrue($v->errors()->has('mobile_no'));
        $this->assertTrue($this->check(UpdateStaffProfileRequest::class, ['mobile_no' => '0912-345-6789'], ['mobile_no'])->passes());
    }

    public function test_staff_credentials_require_usep_email_and_structured_clinic_id(): void
    {
        $v = $this->check(StoreStaffProfileRequest::class, [
            'clinic_id' => 'invalid-id',
            'usep_email' => 'staff@example.com',
        ], ['clinic_id', 'usep_email']);

        $this->assertTrue($v->errors()->has('clinic_id'));
        $this->assertTrue($v->errors()->has('usep_email'));

        $valid = $this->check(StoreStaffProfileRequest::class, [
            'clinic_id' => 'N-001',
            'usep_email' => 'nurse@usep.edu.ph',
        ], ['clinic_id', 'usep_email']);
        $this->assertFalse($valid->errors()->has('clinic_id'));
        $this->assertFalse($valid->errors()->has('usep_email'));
    }

    public function test_triage_rejects_measurements_outside_safe_entry_ranges(): void
    {
        $v = $this->check(StoreTriageRequest::class, [
            'heart_rate' => '221',
            'temperature' => '46',
            'resp_rate' => '61',
            'o2_saturation' => '101',
            'weight' => '301',
            'height' => '251',
        ], ['heart_rate', 'temperature', 'resp_rate', 'o2_saturation', 'weight', 'height']);

        foreach (['heart_rate', 'temperature', 'resp_rate', 'o2_saturation', 'weight', 'height'] as $field) {
            $this->assertTrue($v->errors()->has($field), $field);
        }
    }

    public function test_role_references_and_actor_attribution_cannot_be_forged(): void
    {
        Schema::create('users', function ($table) {
            $table->integer('user_id')->primary();
            $table->string('role');
            $table->string('usep_email')->nullable();
        });
        DB::table('users')->insert([
            ['user_id' => 1, 'role' => 'nurse'], ['user_id' => 2, 'role' => 'patient'],
            ['user_id' => 3, 'role' => 'doctor'], ['user_id' => 4, 'role' => 'nurse'],
        ]);
        $nurse = (new User)->forceFill(['user_id' => 1, 'role' => 'nurse']);
        foreach ([2, 3, 4] as $id) {
            $this->assertTrue($this->check(StoreTriageRequest::class, ['nurse_id' => $id], ['nurse_id'], null, $nurse)->fails());
        }
        $this->assertTrue($this->check(StoreTriageRequest::class, ['nurse_id' => 1], ['nurse_id'], null, $nurse)->passes());
        $this->assertTrue($this->check(StoreQueueRequest::class, ['patient_id' => 3], ['patient_id'])->fails());
        $this->assertTrue($this->check(StoreEndorsedRequest::class, ['doctor_id' => 2], ['doctor_id'])->fails());
        $record = new Endorsed(['doctor_id' => 3]);
        $this->assertTrue($this->check(UpdateEndorsedRequest::class, ['doctor_id' => 4], ['doctor_id'], $record)->fails());
        $this->assertTrue($this->check(UpdateEndorsedRequest::class, ['doctor_id' => 3], ['doctor_id'], $record)->passes());
        $email = str_repeat('a', 64).'@'.str_repeat('b', 63).'.'.str_repeat('c', 20).'.com';
        $this->assertTrue($this->check(UpdateStaffProfileRequest::class, ['usep_email' => $email], ['usep_email'])->fails());
    }

    public function test_medicine_quantities_keep_units_and_partial_triage_does_not_erase_required_values(): void
    {
        $this->assertTrue($this->check(StoreMedicineIssuanceRequest::class, ['quantity' => '10 tabs'], ['quantity'])->passes());
        $this->assertTrue($this->check(UpdateTriageRecordRequest::class, [], ['blood_pressure', 'chief_complaint'])->passes());
        $this->assertTrue($this->check(UpdateTriageRecordRequest::class, ['blood_pressure' => null], ['blood_pressure'])->fails());
    }

    public function test_registration_rejects_invented_colleges_and_invalid_calendar_dates(): void
    {
        $this->assertTrue($this->check(PatientRegistrationRequest::class, ['college_dept' => 'Invented College'], ['college_dept'])->fails());
        $this->assertTrue($this->check(PatientRegistrationRequest::class, ['college_dept' => 'College of Information and Computing (CIC)'], ['college_dept'])->passes());
        foreach (['2001-02-29', '2000-02-30', '01/01/2000', '2000-2-01'] as $dob) {
            $this->assertTrue($this->check(PatientRegistrationRequest::class, ['dob' => $dob], ['dob'])->fails(), $dob);
        }
        $this->assertTrue($this->check(PatientRegistrationRequest::class, ['dob' => '2000-02-29'], ['dob'])->passes());
        $this->assertTrue($this->check(PatientRegistrationRequest::class, ['signature' => 'ÉLODIE O’NEILL'], ['signature'])->passes());
        $this->assertTrue($this->check(PatientRegistrationRequest::class, ['religion' => '   '], ['religion'])->fails());
    }
}
