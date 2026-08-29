import React from 'react';
import { Head, useForm } from '@inertiajs/react';

export default function Update({ questionnaire }) {
    const { data, setData, put, processing } = useForm({
        has_allergies: questionnaire.has_allergies || false,
        allergy_details: questionnaire.allergy_details || '',
        family_medical_history: questionnaire.family_medical_history || '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('ppr-health-questionnaires.update', questionnaire.questionnaire_id));
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <Head title="Update Health Questionnaire" />
            <h1 className="text-2xl font-bold mb-6">Update Health Questionnaire</h1>

            <form onSubmit={submit} className="bg-white p-6 rounded shadow-sm border space-y-4">
                <div className="flex items-center space-x-2">
                    <input 
                        type="checkbox" 
                        checked={data.has_allergies} 
                        onChange={e => setData('has_allergies', e.target.checked)} 
                    />
                    <label className="font-bold">Has Allergies?</label>
                </div>

                <div>
                    <label className="block mb-1 font-bold">Allergy Details</label>
                    <textarea 
                        value={data.allergy_details} 
                        onChange={e => setData('allergy_details', e.target.value)} 
                        className="w-full border rounded p-2"
                    />
                </div>

                <div>
                    <label className="block mb-1 font-bold">Family Medical History</label>
                    <textarea 
                        value={data.family_medical_history} 
                        onChange={e => setData('family_medical_history', e.target.value)} 
                        className="w-full border rounded p-2"
                    />
                </div>

                <button disabled={processing} className="bg-blue-600 text-white px-4 py-2 rounded">
                    Update Questionnaire
                </button>
            </form>
        </div>
    );
}