import React from 'react';
import { Head, useForm } from '@inertiajs/react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        endorsed_id: '',
        purpose: '',
        recommendation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('medical-certificates.store'));
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <Head title="Create Medical Certificate" />
            <h1 className="text-2xl font-bold mb-6">New Medical Certificate</h1>

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
                    <label className="block mb-1 font-bold">Purpose</label>
                    <textarea 
                        value={data.purpose} 
                        onChange={e => setData('purpose', e.target.value)} 
                        className="w-full border rounded p-2"
                    />
                    {errors.purpose && <div className="text-red-500 text-sm mt-1">{errors.purpose}</div>}
                </div>

                <div>
                    <label className="block mb-1 font-bold">Recommendation</label>
                    <textarea 
                        value={data.recommendation} 
                        onChange={e => setData('recommendation', e.target.value)} 
                        className="w-full border rounded p-2"
                    />
                </div>

                <button disabled={processing} className="bg-blue-600 text-white px-4 py-2 rounded">
                    Save Certificate
                </button>
            </form>
        </div>
    );
}