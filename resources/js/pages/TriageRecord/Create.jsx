import React from 'react';
import { Head, useForm } from '@inertiajs/react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        queue_id: '',
        blood_pressure: '',
        heart_rate: '',
        temperature: '',
        chief_complaint: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('triage-records.store'));
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <Head title="Create Triage Record" />
            <h1 className="text-2xl font-bold mb-6">Create Triage Record</h1>

            <form onSubmit={submit} className="bg-white p-6 rounded shadow-sm border space-y-4">
                <div>
                    <label className="block mb-1 font-bold">Queue ID</label>
                    <input 
                        type="number" 
                        value={data.queue_id} 
                        onChange={e => setData('queue_id', e.target.value)} 
                        className="w-full border rounded p-2"
                    />
                    {errors.queue_id && <div className="text-red-500 text-sm mt-1">{errors.queue_id}</div>}
                </div>

                <div>
                    <label className="block mb-1 font-bold">Blood Pressure</label>
                    <input 
                        type="text" 
                        value={data.blood_pressure} 
                        onChange={e => setData('blood_pressure', e.target.value)} 
                        className="w-full border rounded p-2"
                        placeholder="120/80"
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
                    Save Record
                </button>
            </form>
        </div>
    );
}