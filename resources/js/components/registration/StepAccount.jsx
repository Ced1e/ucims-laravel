import React from 'react';
import { Field, SectionTitle } from './Common';

export default function StepAccount({ data, set, errors }) {
    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    return (
        <>
            <SectionTitle>Section 5: Confirmation &amp; Account Setup</SectionTitle>

            <div className="alert alert-info text-sm" style={{ marginBottom: 14 }}>
                <i className="bi bi-info-circle"></i> Your Student/Faculty ID and password are what you will use to sign in to the Patient Portal.
            </div>

            <div className="field-row">
                <Field label="Student / Faculty ID" required error={errors.clinic_id} hint="Format: 2024-00001">
                    <input placeholder="e.g. 2024-00001" value={data.clinic_id} onChange={(e) => set('clinic_id', e.target.value)} />
                </Field>
                <Field label="Account Type" required error={errors.patient_type}>
                    <select value={data.patient_type} onChange={(e) => set('patient_type', e.target.value)}>
                        <option value="">— Select —</option>
                        <option>Student</option>
                        <option>Faculty</option>
                    </select>
                </Field>
            </div>

            <div className="field-row">
                <Field label="USeP Email Address" required error={errors.usep_email}>
                    <input type="email" value={data.usep_email} onChange={(e) => set('usep_email', e.target.value)} />
                </Field>
                <Field label="Confirm Email" required error={errors.usep_email_confirmation}>
                    <input type="email" placeholder="Confirm your email" value={data.usep_email_confirmation} onChange={(e) => set('usep_email_confirmation', e.target.value)} />
                </Field>
            </div>

            <div className="field-row">
                <Field label="Password" required error={errors.password} hint="At least 8 characters">
                    <input type="password" value={data.password} onChange={(e) => set('password', e.target.value)} />
                </Field>
                <Field label="Confirm Password" required error={errors.password_confirmation}>
                    <input type="password" value={data.password_confirmation} onChange={(e) => set('password_confirmation', e.target.value)} />
                </Field>
            </div>

            <hr className="div" />

            <label className="field-check" style={{ alignItems: 'flex-start', textTransform: 'none', letterSpacing: 0, fontWeight: 500, fontSize: '.9rem' }}>
                <input type="checkbox" style={{ width: 'auto', marginTop: 3 }} checked={data.sworn} onChange={(e) => set('sworn', e.target.checked)} />
                <span>I confirm that all information I have provided in this form is true and correct. *</span>
            </label>
            {errors.sworn && <div className="text-xs" style={{ color: '#C0392B' }}>{errors.sworn}</div>}

            <label className="field-check" style={{ alignItems: 'flex-start', marginTop: 8, textTransform: 'none', letterSpacing: 0, fontWeight: 500, fontSize: '.9rem' }}>
                <input type="checkbox" style={{ width: 'auto', marginTop: 3 }} checked={data.privacy} onChange={(e) => set('privacy', e.target.checked)} />
                <span>I consent to the collection and processing of my personal and medical data for health service purposes. *</span>
            </label>
            {errors.privacy && <div className="text-xs" style={{ color: '#C0392B' }}>{errors.privacy}</div>}

            <div className="field-row mt16">
                <Field label="Digital Signature (type your full name in CAPITAL LETTERS)" required error={errors.signature}>
                    <input placeholder="JUAN DELA CRUZ" value={data.signature} onChange={(e) => set('signature', e.target.value.toUpperCase())} />
                </Field>
                <Field label="Date">
                    <input value={today} readOnly />
                </Field>
            </div>
        </>
    );
}
