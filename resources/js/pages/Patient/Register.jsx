import { useRef, useState } from 'react';
import { validName, isCalendarDate, localToday, normalizePhone, lengthErrors, prepareRegistration, minBirthDate, minBirthYear } from '@/lib/registration-validation.mjs';
import { Head, router } from '@inertiajs/react';
import StepPersonal, { FACULTY_OPTION, calcAge } from '@/components/registration/StepPersonal';
import StepHealth, { SYSTEMS } from '@/components/registration/StepHealth';
import StepQuestionnaire from '@/components/registration/StepQuestionnaire';
import StepFemale from '@/components/registration/StepFemale';
import StepAccount from '@/components/registration/StepAccount';

// Validation rules ported from the legacy auth.js wizard
const NAME_RE = { test: validName };

const PHONE_RE = /^09\d{9}$/;
const ID_RE = /^20\d{2}-\d{5}$/;
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@usep\.edu\.ph$/i;
const SIGNATURE_RE = { test: (value) => validName(value) && value === value.toUpperCase() };

const digits = normalizePhone;
const blank = (v) => !String(v ?? '').trim();
const inRange = (v, min, max) => !blank(v) && !isNaN(Number(v)) && Number(v) >= min && Number(v) <= max;

const INITIAL = {
    lastname: '', firstname: '', middlename: '', dob: '', sex: '', civil_status: '', religion: '', nationality: 'Filipino',
    college_dept: '', year_level: '', birthplace: '', city_address: '', prov_address: '', contact_no: '',
    em_name: '', em_contact: '', em_rel: '',
    gen_appearance: '', height: '', weight: '', blood_pressure: '', pulse_rate: '', resp_rate: '', temp: '',
    cr_rest: '', cr_activity: '', infectious_diseases: '', social_hx: '', family_hx: '',
    ...Object.fromEntries(SYSTEMS.map(([k]) => [k, 'Unremarkable'])),
    hosp_admitted: 'No', hosp_illness: '', hosp_when: '', surgery: 'No', surg_type: '', surg_when: '', infectious: [], syncope: 'No',
    female_menarche: '', female_periods_yr: '', female_regular: 'Yes', female_irregular_spec: '', female_dysmenorrhea: 'No', female_symptoms: '',
    clinic_id: '', patient_type: '', usep_email: '', usep_email_confirmation: '', password: '', password_confirmation: '',
    sworn: false, privacy: false, signature: '',
};

const STEP_KEYS = {
    personal: ['lastname', 'firstname', 'middlename', 'dob', 'sex', 'civil_status', 'religion', 'nationality', 'college_dept', 'year_level', 'birthplace', 'city_address', 'prov_address', 'contact_no', 'em_name', 'em_contact', 'em_rel'],
    health: ['gen_appearance', 'height', 'weight', 'blood_pressure', 'pulse_rate', 'resp_rate', 'temp', 'cr_rest', 'cr_activity', 'infectious_diseases', 'social_hx', 'family_hx', ...SYSTEMS.map(([k]) => k)],
    questionnaire: ['hosp_admitted', 'hosp_illness', 'hosp_when', 'surgery', 'surg_type', 'surg_when', 'infectious', 'syncope'],
    female: ['female_menarche', 'female_periods_yr', 'female_regular', 'female_irregular_spec', 'female_dysmenorrhea', 'female_symptoms'],
    account: ['clinic_id', 'patient_type', 'usep_email', 'usep_email_confirmation', 'password', 'password_confirmation', 'sworn', 'privacy', 'signature'],
};

function validateStep(key, d) {
    const e = {};
    const req = (k, msg = 'This field is required.') => {
        if (blank(d[k])) e[k] = msg;
    };

    if (key === 'personal') {
        // Names and letter-only fields: block digits while typing (input side) and
        // validate live with a clear inline message (feedback side).
        ['lastname', 'firstname', 'middlename', 'religion', 'nationality'].forEach((k) => {
            if (blank(d[k])) e[k] = 'Required.';
            else if (!NAME_RE.test(d[k].trim())) e[k] = "Use letters, spaces, apostrophes, dots or hyphens.";
        });
        if (blank(d.dob)) e.dob = 'Required.';
        else if (!isCalendarDate(d.dob) || d.dob < minBirthDate()) e.dob = `Enter a valid birthdate after January 1, ${minBirthYear()}.`;
        else if (d.dob > localToday()) e.dob = 'Birthdate cannot be in the future.';
        else if (calcAge(d.dob) === '' ) e.dob = 'Enter a valid birthdate.';
        ['sex', 'civil_status', 'college_dept', 'birthplace', 'city_address', 'prov_address'].forEach((k) => req(k, 'Required.'));
        if (d.college_dept !== FACULTY_OPTION) req('year_level', 'Required.');
        if (!PHONE_RE.test(digits(d.contact_no))) e.contact_no = 'Enter a valid number (09XXXXXXXXX).';
        if (blank(d.em_name)) e.em_name = 'Required.';
        else if (!NAME_RE.test(d.em_name.trim())) e.em_name = "Use letters, spaces, apostrophes, dots or hyphens.";
        if (!PHONE_RE.test(digits(d.em_contact))) e.em_contact = 'Enter a valid number (09XXXXXXXXX).';
        if (blank(d.em_rel)) e.em_rel = 'Required.';
        else if (/\d/.test(d.em_rel)) e.em_rel = 'Relationship should not contain numbers (e.g. Mother, Father, Sibling).';

    }

    if (key === 'health') {
        if (!inRange(d.height, 50, 250)) e.height = 'Enter height in cm (50-250).';
        if (!inRange(d.weight, 10, 300)) e.weight = 'Enter weight in kg (10-300).';
        if (!/^\d{2,3}\/\d{2,3}$/.test(String(d.blood_pressure).trim())) e.blood_pressure = 'Use the format 120/80.';
        if (!inRange(d.pulse_rate, 30, 220)) e.pulse_rate = 'Enter a value between 30 and 220.';
        if (!inRange(d.resp_rate, 5, 60)) e.resp_rate = 'Enter a value between 5 and 60.';
        if (!inRange(d.temp, 30, 45)) e.temp = 'Enter a value between 30 and 45.';
        if (!inRange(d.cr_rest, 30, 250)) e.cr_rest = 'Enter a value between 30 and 250.';
        if (!inRange(d.cr_activity, 30, 250)) e.cr_activity = 'Enter a value between 30 and 250.';
        SYSTEMS.forEach(([k]) => req(k, 'Required (write "Unremarkable" if normal).'));
        // History fields: numbers-only is rejected (e.g. "3" or "1985");
        // but a mix of letters and numbers is fine ("Type 2 Diabetes").
        for (const k of ['infectious_diseases', 'social_hx', 'family_hx']) {
            const v = String(d[k] ?? '').trim();
            if (!blank(v) && !/\p{L}/u.test(v)) e[k] = 'History must include letters - numbers alone are not enough.';
        }
    }

    if (key === 'questionnaire') {
        if (d.hosp_admitted === 'Yes') {
            req('hosp_illness', 'Please specify the illness.');
            req('hosp_when', 'Please say when.');
        }
        if (d.surgery === 'Yes') {
            req('surg_type', 'Please specify the operation.');
            req('surg_when', 'Please say when.');
        }
    }

    if (key === 'female') {
        if (d.female_menarche !== '' && !inRange(d.female_menarche, 5, 25)) e.female_menarche = 'Enter an age between 5 and 25.';
        if (d.female_periods_yr !== '' && !inRange(d.female_periods_yr, 0, 24)) e.female_periods_yr = 'Enter a number between 0 and 24.';
        if (d.female_regular === 'No') req('female_irregular_spec', 'Please specify.');
    }

    if (key === 'account') {
        if (!ID_RE.test(d.clinic_id.trim())) e.clinic_id = 'Use the format 2024-00001.';
        req('patient_type', 'Required.');
        if (!EMAIL_RE.test(d.usep_email.trim())) e.usep_email = 'Use your USeP email (name@usep.edu.ph).';
        if (d.usep_email.trim().toLowerCase() !== d.usep_email_confirmation.trim().toLowerCase()) e.usep_email_confirmation = 'Emails do not match.';
        if (d.password.length < 8) e.password = 'At least 8 characters.';
        if (d.password !== d.password_confirmation) e.password_confirmation = 'Passwords do not match.';
        if (!d.sworn) e.sworn = 'You must confirm this statement.';
        if (!d.privacy) e.privacy = 'You must give your consent to continue.';
        if (!SIGNATURE_RE.test(d.signature.trim())) e.signature = 'Type your full name in CAPITAL LETTERS.';
    }
    return { ...e, ...lengthErrors(d, STEP_KEYS[key] || []) };
}

export default function Register() {
    const [data, setData] = useState(INITIAL);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [stepIdx, setStepIdx] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    const isFemale = data.sex === 'Female';
    const steps = [
        { key: 'personal', label: 'Personal Info' },
        { key: 'health', label: 'Health Record' },
        { key: 'questionnaire', label: 'Questionnaire' },
        ...(isFemale ? [{ key: 'female', label: 'Females Only' }] : []),
        { key: 'account', label: 'Account Setup' },
    ];
    const current = steps[Math.min(stepIdx, steps.length - 1)];
    const isLast = stepIdx >= steps.length - 1;

    const currentKey = current?.key;

    // Refs hold the latest form state so handlers that call set() multiple
    // times (e.g. the college dropdown) always validate against the newest data.
    const dataRef = useRef(INITIAL);
    const touchedRef = useRef({});

    // Live inline validation: revalidate the current step on every change and
    // show errors only for fields the user has already touched. A field goes
    // red as soon as its value becomes wrong, and clears itself when fixed.
    const validate = (candidate, stepKey, touchedSet) => {
        const errs = validateStep(stepKey, candidate);
        const next = {};
        for (const k of Object.keys(errs)) if (touchedSet[k]) next[k] = errs[k];
        setErrors(next);
    };

    const set = (k, v) => {
        const candidate = { ...dataRef.current, [k]: v };
        if (k === 'sex' && v !== 'Female') {
            for (const field of STEP_KEYS.female) candidate[field] = INITIAL[field];
        }
        dataRef.current = candidate;
        setData(candidate);
        const tset = { ...touchedRef.current, [k]: true };
        touchedRef.current = tset;
        setTouched(tset);
        if (currentKey) validate(candidate, currentKey, tset);
    };

    function next() {
        const stepKeys = STEP_KEYS[current.key] || [];
        const tset = { ...touchedRef.current };
        for (const k of stepKeys) tset[k] = true;
        touchedRef.current = tset;
        setTouched(tset);
        const e = validateStep(current.key, dataRef.current);
        const visible = {};
        for (const k of Object.keys(e)) if (tset[k]) visible[k] = e[k];
        if (Object.keys(visible).length) {
            setErrors(visible);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        setErrors({});
        touchedRef.current = {};
        setTouched({});
        setStepIdx(stepIdx + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function back() {
        setErrors({});
        touchedRef.current = {};
        setTouched({});
        setStepIdx(Math.max(0, stepIdx - 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function submit() {
        // Re-validate every step so nothing slips through.
        for (let i = 0; i < steps.length; i++) {
            const e = validateStep(steps[i].key, dataRef.current);
            if (Object.keys(e).length) {
                const stepKeys = STEP_KEYS[steps[i].key] || [];
                const all = { ...touchedRef.current };
                for (const k of stepKeys) all[k] = true;
                touchedRef.current = all;
                setTouched(all);
                setStepIdx(i);
                setErrors(e);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
        }
        const payload = prepareRegistration(dataRef.current);
        setSubmitting(true);
        router.post('/register', payload, {
            preserveScroll: true,
            onError: (serverErrors) => {
                setErrors(serverErrors);
                // Jump to the first step that contains a field the server rejected.
                const firstKey = Object.keys(serverErrors)[0];
                const idx = steps.findIndex((s) => STEP_KEYS[s.key].includes(firstKey) || (firstKey === 'usep_email' && s.key === 'account'));
                if (idx >= 0) setStepIdx(idx);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            },
            onFinish: () => setSubmitting(false),
        });
    }

    const errorCount = Object.values(errors).filter(Boolean).length;
    const props = { data, set, errors };

    return (
        <>
            <Head title="Patient Registration">
                <link rel="stylesheet" href="/assets/css/main.css" />
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
            </Head>

            <div style={{ maxWidth: 880, margin: '0 auto', padding: '28px 16px 60px' }}>
                <div style={{ textAlign: 'center', marginBottom: 22 }}>
                    <h1 style={{ color: 'var(--maroon)', margin: 0, fontSize: '1.7rem' }}>Patient Registration</h1>
                    <p className="text-muted" style={{ margin: '6px 0 0' }}>
                        Create your Permanent Patient Record and your Patient Portal account.
                    </p>
                </div>

                <div className="steps">
                    {steps.map((s, i) => (
                        <div key={s.key} className={`step ${i < stepIdx ? 'done' : i === stepIdx ? 'active' : ''}`}>
                            {i + 1} {String.fromCharCode(0x00B7)} {s.label}
                        </div>
                    ))}
                </div>

                <div className="card" style={{ padding: '26px 28px' }}>
                    {errorCount > 0 && (
                        <div className="alert alert-warn text-sm" style={{ marginBottom: 16 }}>
                            <i className="bi bi-exclamation-triangle"></i> Please correct the highlighted fields.
                            <ul style={{ marginTop: 8 }}>{Object.entries(errors).filter(([,message]) => message).map(([field,message]) => <li key={field}>{message}</li>)}</ul>
                        </div>
                    )}

                    {current.key === 'personal' && <StepPersonal {...props} />}
                    {current.key === 'health' && <StepHealth {...props} />}
                    {current.key === 'questionnaire' && <StepQuestionnaire {...props} />}
                    {current.key === 'female' && <StepFemale {...props} />}
                    {current.key === 'account' && <StepAccount {...props} />}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 26, gap: 12 }}>
                        {stepIdx === 0 ? (
                            <a href="/login" className="btn btn-outline">
                                <i className="bi bi-arrow-left"></i> Back to Login
                            </a>
                        ) : (
                            <button className="btn btn-outline" onClick={back} disabled={submitting}>
                                <i className="bi bi-arrow-left"></i> Back
                            </button>
                        )}
                        {isLast ? (
                            <button className="btn btn-primary" onClick={submit} disabled={submitting}>
                                {submitting ? 'Creating account...' : <><i className="bi bi-person-check"></i> Create My Account</>}
                            </button>
                        ) : (
                            <button className="btn btn-primary" onClick={next}>
                                Next <i className="bi bi-arrow-right"></i>
                            </button>
                        )}
                    </div>
                </div>

                <p className="text-sm text-muted" style={{ textAlign: 'center', marginTop: 16 }}>
                    Already registered? <a href="/login" style={{ color: 'var(--maroon)', fontWeight: 600 }}>Sign in</a>
                </p>
            </div>
        </>
    );
}
