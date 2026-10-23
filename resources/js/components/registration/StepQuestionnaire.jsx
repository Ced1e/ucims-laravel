import React from 'react';
import { Field, YesNo, SectionTitle } from './Common';

export const INFECTIOUS = ['Measles', 'German Measles', 'Chickenpox', 'Hepatitis A', 'Tetanus', 'PTB'];

export default function StepQuestionnaire({ data, set, errors }) {
    const toggleInfectious = (name) => {
        const cur = data.infectious || [];
        set('infectious', cur.includes(name) ? cur.filter((x) => x !== name) : [...cur, name]);
    };

    return (
        <>
            <SectionTitle>Section 3: Applicant Questionnaire</SectionTitle>

            <div className="fw6 text-sm">1. Have you ever been admitted / hospitalized?</div>
            <YesNo name="hosp" value={data.hosp_admitted} onChange={(v) => set('hosp_admitted', v)} />
            {data.hosp_admitted === 'Yes' && (
                <div className="field-row">
                    <Field label="Illness / Reason" required error={errors.hosp_illness}>
                        <input placeholder="e.g. Dengue Fever" value={data.hosp_illness} onChange={(e) => set('hosp_illness', e.target.value)} />
                    </Field>
                    <Field label="When" required error={errors.hosp_when}>
                        <input placeholder="e.g. March 2019" value={data.hosp_when} onChange={(e) => set('hosp_when', e.target.value)} />
                    </Field>
                </div>
            )}

            <div className="fw6 text-sm mt12">2. Have you ever had a surgical operation?</div>
            <YesNo name="surg" value={data.surgery} onChange={(v) => set('surgery', v)} />
            {data.surgery === 'Yes' && (
                <div className="field-row">
                    <Field label="Type of Operation" required error={errors.surg_type}>
                        <input placeholder="e.g. Appendectomy" value={data.surg_type} onChange={(e) => set('surg_type', e.target.value)} />
                    </Field>
                    <Field label="When" required error={errors.surg_when}>
                        <input placeholder="e.g. 2020" value={data.surg_when} onChange={(e) => set('surg_when', e.target.value)} />
                    </Field>
                </div>
            )}

            <div className="fw6 text-sm mt12">3. Have you had any of the following infectious diseases?</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, margin: '8px 0 12px' }}>
                {INFECTIOUS.map((d) => (
                    <label key={d} className="field-check" style={{ textTransform: 'none', letterSpacing: 0, fontSize: '.9rem', fontWeight: 500 }}>
                        <input type="checkbox" style={{ width: 'auto' }} checked={(data.infectious || []).includes(d)} onChange={() => toggleInfectious(d)} /> {d}
                    </label>
                ))}
            </div>

            <div className="fw6 text-sm">4. Do you experience headache, dizziness, or syncope at any time?</div>
            <YesNo name="syncope" value={data.syncope} onChange={(v) => set('syncope', v)} />
        </>
    );
}
