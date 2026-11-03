import { registrationLimits, isCalendarDate, localToday } from '@/lib/registration-validation.mjs';
import React from 'react';
import { Field, SectionTitle } from './Common';

export const COLLEGES = [
    'College of Information and Computing (CIC)',
    'College of Technology (CT)',
    'College of Engineering (COE)',
    'College of Arts and Sciences (CAS)',
    'College of Applied Economics (CAEC)',
    'College of Business Administration (CBA)',
    'College of Education (CED)',
    'Faculty / Staff',
];
export const FACULTY_OPTION = 'Faculty / Staff';
export const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'N/A'];
export const CIVIL_STATUS = ['Single', 'Married', 'Widowed', 'Separated'];

export function calcAge(dob) {
    if (!isCalendarDate(dob) || dob > localToday() || dob <= '1900-01-01') return '';
    const [y, m, d] = String(dob).split('-').map(Number);
    if (!y || !m || !d) return '';
    const today = new Date();
    let age = today.getFullYear() - y;
    if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age--;
    return age >= 0 ? age : '';
}

export default function StepPersonal({ data, set, errors }) {
    const bind = (k, extra = {}) => ({ maxLength: k.startsWith('sr_') ? 100 : registrationLimits[k], value: data[k], onChange: (e) => set(k, e.target.value), ...extra });
    const isFaculty = data.college_dept === FACULTY_OPTION;

    return (
        <>
            <SectionTitle>Section 1: Personal Information</SectionTitle>

            <div className="field-row3">
                <Field label="Surname" required error={errors.lastname}>
                    <input placeholder="Dela Cruz" {...bind('lastname')} />
                </Field>
                <Field label="First Name" required error={errors.firstname}>
                    <input placeholder="Juan" {...bind('firstname')} />
                </Field>
                <Field label="Middle Name" required error={errors.middlename}>
                    <input placeholder="Santos" {...bind('middlename')} />
                </Field>
            </div>

            <div className="field-row3">
                <Field label="Birthdate" required error={errors.dob}>
                    <input type="date" max={localToday()} min="1900-01-02" {...bind('dob')} />
                </Field>
                <Field label="Age" hint="Calculated from your birthdate">
                    <input value={calcAge(data.dob)} readOnly placeholder="—" />
                </Field>
                <Field label="Sex" required error={errors.sex}>
                    <select {...bind('sex')}>
                        <option value="">— Select —</option>
                        <option>Male</option>
                        <option>Female</option>
                    </select>
                </Field>
            </div>

            <div className="field-row3">
                <Field label="Civil Status" required error={errors.civil_status}>
                    <select {...bind('civil_status')}>
                        <option value="">— Select —</option>
                        {CIVIL_STATUS.map((c) => (
                            <option key={c}>{c}</option>
                        ))}
                    </select>
                </Field>
                <Field label="Religion" required error={errors.religion}>
                    <input placeholder="e.g. Roman Catholic" {...bind('religion')} />
                </Field>
                <Field label="Nationality" required error={errors.nationality}>
                    <input placeholder="e.g. Filipino" {...bind('nationality')} />
                </Field>
            </div>

            <div className="field-row">
                <Field label="College / Designation" required error={errors.college_dept}>
                    <select
                        value={data.college_dept}
                        onChange={(e) => {
                            set('college_dept', e.target.value);
                            set('year_level', e.target.value === FACULTY_OPTION ? 'N/A' : '');
                            set('patient_type', e.target.value === FACULTY_OPTION ? 'Faculty' : e.target.value ? 'Student' : '');
                        }}
                    >
                        <option value="">— Select —</option>
                        {COLLEGES.map((c) => (
                            <option key={c}>{c}</option>
                        ))}
                    </select>
                </Field>
                <Field label="Year Level" required={!isFaculty} error={errors.year_level}>
                    <select {...bind('year_level')} disabled={isFaculty}>
                        <option value="">— Select —</option>
                        {YEAR_LEVELS.map((y) => (
                            <option key={y}>{y}</option>
                        ))}
                    </select>
                </Field>
            </div>

            <Field label="Birthplace" required error={errors.birthplace}>
                <input placeholder="City / Municipality, Province" {...bind('birthplace')} />
            </Field>
            <div className="field-row">
                <Field label="City Address" required error={errors.city_address}>
                    <input placeholder="Street, Barangay, City" {...bind('city_address')} />
                </Field>
                <Field label="Provincial Address" required error={errors.prov_address}>
                    <input placeholder="Municipality, Province" {...bind('prov_address')} />
                </Field>
            </div>

            <Field label="Your Contact No." required error={errors.contact_no} hint="Format: 09XXXXXXXXX">
                <input type="tel" placeholder="09XXXXXXXXX" {...bind('contact_no')} />
            </Field>

            <div className="card-title mt16" style={{ fontSize: '.9rem' }}>
                Emergency Contact
            </div>
            <div className="field-row3">
                <Field label="Name" required error={errors.em_name}>
                    <input placeholder="Full name" {...bind('em_name')} />
                </Field>
                <Field label="Contact No." required error={errors.em_contact}>
                    <input type="tel" placeholder="09XXXXXXXXX" {...bind('em_contact')} />
                </Field>
                <Field label="Relationship" required error={errors.em_rel}>
                    <input placeholder="e.g. Mother" {...bind('em_rel')} />
                </Field>
            </div>
        </>
    );
}
