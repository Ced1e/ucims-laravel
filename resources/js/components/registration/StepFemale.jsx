import React from 'react';
import { Field, YesNo, SectionTitle } from './Common';

export default function StepFemale({ data, set, errors }) {
    return (
        <>
            <SectionTitle>Section 4: For Females Only</SectionTitle>
            <div className="field-row">
                <Field label="Age at First Menstruation" error={errors.female_menarche}>
                    <input type="number" min="5" max="25" placeholder="e.g. 13" value={data.female_menarche} onChange={(e) => set('female_menarche', e.target.value)} />
                </Field>
                <Field label="How many periods per year?" error={errors.female_periods_yr}>
                    <input type="number" min="0" max="24" placeholder="e.g. 12" value={data.female_periods_yr} onChange={(e) => set('female_periods_yr', e.target.value)} />
                </Field>
            </div>

            <div className="fw6 text-sm">Do you have regular monthly periods?</div>
            <YesNo name="regular" value={data.female_regular} onChange={(v) => set('female_regular', v)} />
            {data.female_regular === 'No' && (
                <Field label="If No — please specify" required error={errors.female_irregular_spec}>
                    <input placeholder="Describe irregularity..." value={data.female_irregular_spec} onChange={(e) => set('female_irregular_spec', e.target.value)} />
                </Field>
            )}

            <div className="fw6 text-sm mt12">Do you experience dysmenorrhea (painful periods)?</div>
            <YesNo name="dysmenorrhea" value={data.female_dysmenorrhea} onChange={(v) => set('female_dysmenorrhea', v)} />

            <Field label="Other Premenstrual / Menstrual Symptoms" error={errors.female_symptoms}>
                <textarea placeholder="Describe any other symptoms experienced..." value={data.female_symptoms} onChange={(e) => set('female_symptoms', e.target.value)} />
            </Field>
        </>
    );
}
