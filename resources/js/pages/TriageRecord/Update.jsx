import React from 'react';
import { Head, useForm } from '@inertiajs/react';

export default function Update({ record }) {
    const { data, setData, put, processing } = useForm({
        blood_pressure: record.blood_pressure || '',
        temperature: record.temperature || '',
        chief_complaint: record.chief_complaint || '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('triage-records.update', record.triage_id));
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <Head title="Update Triage Record" />
            <h1 className="text-2xl font-bold mb-6">Update Triage Record</h1>

            <form onSubmit={submit} className="bg-white p-6 rounded shadow-sm border space-y-4">
                <div>
                    <label className="block mb-1 font-bold">Blood Pressure</label>
                    <input 
                        type="text" 
                        value={data.blood_pressure} 
                        onChange={e => setData('blood_pressure', e.target.value)} 
                        className="w-full border rounded p-2"
                    />
                </div>

                <div>
                    <label className="block mb-1 font-bold">Temperature (°C)</label>
                    <input 
                        type="text" 
                        value={data.temperature} 
                        onChange={e => setData('temperature', e.target.value)} 
                        className="w-full border rounded p-2"
                    />
                </div>

                <div>
                    <label className="block mb-1 font-bold">Chief Complaint</label>
                    <textarea 
                        value={data.chief_complaint} 
                        onChange={e => setData('chief_complaint', e.target.value)} 
                        className="w-full border rounded p-2"
                    />
                </div>

                <button disabled={processing} className="bg-blue-600 text-white px-4 py-2 rounded">
                    Update Record
                </button>
            </form>
        </div>
    );
}