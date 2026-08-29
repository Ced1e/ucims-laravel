import React from 'react';
import { Head, useForm } from '@inertiajs/react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        user_id: '',
        blood_type: '',
        disability_info: '',
        chronic_conditions: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('ppr-permanents.store'));
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <Head title="Create Permanent Record" />
            <h1 className="text-2xl font-bold mb-6">Add Permanent Medical Record</h1>

            <form onSubmit={submit} className="bg-white p-6 rounded shadow-sm border space-y-4">
                <div>
                    <label className="block mb-1 font-bold">User ID</label>
                    <input 
                        type="number" 
                        value={data.user_id} 
                        onChange={e => setData('user_id', e.target.value)} 
                        className="w-full border rounded p-2"
                    />
                    {errors.user_id && <div className="text-red-500 text-sm mt-1">{errors.user_id}</div>}
                </div>

                <div>
                    <label className="block mb-1 font-bold">Blood Type</label>
                    <input 
                        type="text" 
                        value={data.blood_type} 
                        onChange={e => setData('blood_type', e.target.value)} 
                        className="w-full border rounded p-2"
                        placeholder="e.g., O+"
                    />
                </div>

                <div>
                    <label className="block mb-1 font-bold">Chronic Conditions</label>
                    <textarea 
                        value={data.chronic_conditions} 
                        onChange={e => setData('chronic_conditions', e.target.value)} 
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