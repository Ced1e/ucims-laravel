import React from 'react';
import { Head, useForm } from '@inertiajs/react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        endorsed_id: '',
        test_type: '',
        notes: '',
        status: 'requested',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('lab-requests.store'));
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <Head title="Create Lab Request" />
            <h1 className="text-2xl font-bold mb-6">New Laboratory Request</h1>

            <form onSubmit={submit} className="bg-white p-6 rounded shadow-sm border space-y-4">
                <div>
                    <label className="block mb-1 font-bold">Consultation (Endorsed) ID</label>
                    <input 
                        type="number" 
                        value={data.endorsed_id} 
                        onChange={e => setData('endorsed_id', e.target.value)} 
                        className="w-full border rounded p-2"
                    />
                    {errors.endorsed_id && <div className="text-red-500 text-sm mt-1">{errors.endorsed_id}</div>}
                </div>

                <div>
                    <label className="block mb-1 font-bold">Test Type</label>
                    <input 
                        type="text" 
                        value={data.test_type} 
                        onChange={e => setData('test_type', e.target.value)} 
                        className="w-full border rounded p-2"
                        placeholder="e.g., Complete Blood Count (CBC)"
                    />
                    {errors.test_type && <div className="text-red-500 text-sm mt-1">{errors.test_type}</div>}
                </div>

                <div>
                    <label className="block mb-1 font-bold">Notes</label>
                    <textarea 
                        value={data.notes} 
                        onChange={e => setData('notes', e.target.value)} 
                        className="w-full border rounded p-2"
                    />
                </div>

                <button disabled={processing} className="bg-blue-600 text-white px-4 py-2 rounded">
                    Save Request
                </button>
            </form>
        </div>
    );
}