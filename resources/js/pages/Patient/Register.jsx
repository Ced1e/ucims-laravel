import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import StepPersonal, { FACULTY_OPTION, calcAge } from '@/components/registration/StepPersonal';
import StepHealth, { SYSTEMS } from '@/components/registration/StepHealth';
import StepQuestionnaire from '@/components/registration/StepQuestionnaire';
import StepFemale from '@/components/registration/StepFemale';
import StepAccount from '@/components/registration/StepAccount';

// ── Validation rules ported from the legacy auth.js wizard ──────────────────
const NAME_RE = /^[A-ZÑ][A-Za-zÑñ\s\-.']*$/;
const WORDS_RE = /^[A-Za-zÑñ][A-Za-zÑñ\s\-.']*$/;
const PHONE_RE = /^09\d{9}$/;
const ID_RE = /^20\d{2}-\d{5}$/;
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@usep\.edu\.ph$/i;
const SIGNATURE_RE = /^[A-ZÑ][A-ZÑ\s\-.]*$/;

const digits = (v) => String(v || '').replace(/\D/g, '');
const blank = (v) => !String(v ?? '').trim();
const inRange = (v, min, max) => v !== '' && !isNaN(Number(v)) && Number(v) >= min && Number(v) <= max;

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
        ['lastname', 'firstname', 'middlename'].forEach((k) => {
            if (blank(d[k])) e[k] = 'Required.';
            else if (!NAME_RE.test(d[k].trim())) e[k] = 'Start with a capital letter; letters only.';
        });
        if (blank(d.dob)) e.dob = 'Required.';
        else if (new Date(d.dob) > new Date()) e.dob = 'Birthdate cannot be in the future.';
        else if (calcAge(d.dob) === '' ) e.dob = 'Enter a valid birthdate.';
        ['sex', 'civil_status', 'college_dept', 'birthplace', 'city_address', 'prov_address'].forEach((k) => req(k, 'Required.'));
        ['religion', 'nationality'].forEach((k) => {
            if (blank(d[k])) e[k] = 'Required.';
            else if (!WORDS_RE.test(d[k].trim())) e[k] = 'Letters only.';
        });
        if (d.college_dept !== FACULTY_OPTION) req('year_level', 'Required.');
        if (!PHONE_RE.test(digits(d.contact_no))) e.contact_no = 'Enter a valid number (09XXXXXXXXX).';
        if (blank(d.em_name)) e.em_name = 'Required.';
        else if (!NAME_RE.test(d.em_name.trim())) e.em_name = 'Start with a capital letter; letters only.';
        if (!PHONE_RE.test(digits(d.em_contact))) e.em_contact = 'Enter a valid number (09XXXXXXXXX).';
        if (blank(d.em_rel)) e.em_rel = 'Required.';
        else if (!WORDS_RE.test(d.em_rel.trim())) e.em_rel = 'Letters only.';
    }

    if (key === 'health') {
        if (!inRange(d.height, 50, 250)) e.height = 'Enter height in cm (50–250).';
        if (!inRange(d.weight, 10, 300)) e.weight = 'Enter weight in kg (10–300).';
        if (!/^\d{2,3}\/\d{2,3}$/.test(String(d.blood_pressure).trim())) e.blood_pressure = 'Use the format 120/80.';
        if (!inRange(d.pulse_rate, 30, 220)) e.pulse_rate = 'Enter a value between 30 and 220.';
        if (!inRange(d.resp_rate, 5, 60)) e.resp_rate = 'Enter a value between 5 and 60.';
        if (!inRange(d.temp, 30, 45)) e.temp = 'Enter a value between 30 and 45.';
        if (!inRange(d.cr_rest, 30, 250)) e.cr_rest = 'Enter a value between 30 and 250.';
        if (!inRange(d.cr_activity, 30, 250)) e.cr_activity = 'Enter a value between 30 and 250.';
        SYSTEMS.forEach(([k]) => req(k, 'Required (write "Unremarkable" if normal).'));
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
    return e;
}

export default function Register() {
    const [data, setData] = useState(INITIAL);
    const [errors, setErrors] = useState({});
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

    const set = (k, v) => {
        setData((d) => ({ ...d, [k]: v }));
        if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
    };

    function next() {
        const e = validateStep(current.key, data);
        if (Object.keys(e).length) {
            setErrors(e);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        setErrors({});
        setStepIdx(stepIdx + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function back() {
        setErrors({});
        setStepIdx(Math.max(0, stepIdx - 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function submit() {
        // Re-validate every step so nothing slips through.
        for (let i = 0; i < steps.length; i++) {
            const e = validateStep(steps[i].key, data);
            if (Object.keys(e).length) {
                setStepIdx(i);
                setErrors(e);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
        }
        const payload = {
            ...data,
            contact_no: digits(data.contact_no),
            em_contact: digits(data.em_contact),
            usep_email: data.usep_email.trim().toLowerCase(),
            usep_email_confirmation: data.usep_email_confirmation.trim().toLowerCase(),
        };
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
                    <img src="/assets/img/logo.png" alt="USeP" style={{ width: 64, marginBottom: 8 }} />
                    <h1 style={{ color: 'var(--maroon)', margin: 0, fontSize: '1.7rem' }}>Patient Registration</h1>
                    <p className="text-muted" style={{ margin: '6px 0 0' }}>
                        Create your Permanent Patient Record and your Patient Portal account.
                    </p>
                </div>

                <div className="steps">
                    {steps.map((s, i) => (
                        <div key={s.key} className={`step ${i < stepIdx ? 'done' : i === stepIdx ? 'active' : ''}`}>
                            {i + 1} · {s.label}
                        </div>
                    ))}
                </div>

                <div className="card" style={{ padding: '26px 28px' }}>
                    {errorCount > 0 && (
                        <div className="alert alert-warn text-sm" style={{ marginBottom: 16 }}>
                            <i className="bi bi-exclamation-triangle"></i> Please fix the {errorCount} highlighted field{errorCount > 1 ? 's' : ''} below.
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
                                {submitting ? 'Creating account…' : <><i className="bi bi-person-check"></i> Create My Account</>}
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
