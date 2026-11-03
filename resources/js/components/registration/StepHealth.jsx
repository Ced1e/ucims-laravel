import { registrationLimits } from '@/lib/registration-validation.mjs';
import React from 'react';
import { Field, SectionTitle } from './Common';

export const SYSTEMS = [
    ['sr_skin', 'Skin'],
    ['sr_lymph', 'Lymph Nodes'],
    ['sr_integument', 'Integument System'],
    ['sr_circulatory', 'Circulatory System'],
    ['sr_endocrine', 'Endocrine System'],
    ['sr_allergic', 'Allergic / Immunologic'],
    ['sr_heent', 'HEENT'],
    ['sr_mouth', 'Mouth'],
    ['sr_breast', 'Breast'],
    ['sr_respiratory', 'Respiratory System'],
    ['sr_cardiovascular', 'Cardiovascular System'],
    ['sr_gastrointestinal', 'Gastrointestinal System'],
    ['sr_genitourinary', 'Genitourinary Tract'],
    ['sr_psychiatric', 'Psychiatric History'],
];

export default function StepHealth({ data, set, errors }) {
    const bind = (k, extra = {}) => ({ maxLength: k.startsWith('sr_') ? 100 : registrationLimits[k], value: data[k], onChange: (e) => set(k, e.target.value), ...extra });

    return (
        <>
            <SectionTitle>Section 2: Patient Health Record</SectionTitle>

            <Field label="General Appearance" error={errors.gen_appearance}>
                <input placeholder="e.g. Conscious, coherent, not in distress..." {...bind('gen_appearance')} />
            </Field>

            <div className="card-title" style={{ fontSize: '.9rem' }}>
                Initial Vitals
            </div>
            <div className="field-row3">
                <Field label="Height (cm)" required error={errors.height}>
                    <input type="number" step="0.1" placeholder="e.g. 165" {...bind('height')} />
                </Field>
                <Field label="Weight (kg)" required error={errors.weight}>
                    <input type="number" step="0.1" placeholder="e.g. 60" {...bind('weight')} />
                </Field>
                <Field label="Blood Pressure" required error={errors.blood_pressure}>
                    <input placeholder="e.g. 120/80" {...bind('blood_pressure')} />
                </Field>
            </div>
            <div className="field-row3">
                <Field label="Pulse Rate (bpm)" required error={errors.pulse_rate}>
                    <input type="number" placeholder="e.g. 72" {...bind('pulse_rate')} />
                </Field>
                <Field label="Resp. Rate (/min)" required error={errors.resp_rate}>
                    <input type="number" placeholder="e.g. 18" {...bind('resp_rate')} />
                </Field>
                <Field label="Temperature (°C)" required error={errors.temp}>
                    <input type="number" step="0.1" placeholder="e.g. 36.5" {...bind('temp')} />
                </Field>
            </div>
            <div className="field-row">
                <Field label="Cardiac Rate — At Rest (bpm)" required error={errors.cr_rest}>
                    <input type="number" placeholder="e.g. 70" {...bind('cr_rest')} />
                </Field>
                <Field label="Cardiac Rate — After Activity (bpm)" required error={errors.cr_activity}>
                    <input type="number" placeholder="e.g. 98" {...bind('cr_activity')} />
                </Field>
            </div>

            <div className="card-title mt16" style={{ fontSize: '.9rem' }}>
                History
            </div>
            <Field label="Infectious Diseases" error={errors.infectious_diseases}>
                <input placeholder="Prior or current diseases..." {...bind('infectious_diseases')} />
            </Field>
            <div className="field-row">
                <Field label="Social History" error={errors.social_hx}>
                    <input placeholder="Smoking, alcohol, lifestyle..." {...bind('social_hx')} />
                </Field>
                <Field label="Family History" error={errors.family_hx}>
                    <input placeholder="e.g. Hypertension (father)..." {...bind('family_hx')} />
                </Field>
            </div>

            <div className="card-title mt16" style={{ fontSize: '.9rem' }}>
                Review of Systems
            </div>
            <div className="text-xs text-muted mb8">Leave as "Unremarkable" if you have nothing to report.</div>
            <div className="field-row3">
                {SYSTEMS.map(([key, label]) => (
                    <Field key={key} label={label} required error={errors[key]}>
                        <input {...bind(key)} />
                    </Field>
                ))}
            </div>
        </>
    );
}
