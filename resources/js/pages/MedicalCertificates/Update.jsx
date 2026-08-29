import React from 'react';
import { Head, useForm } from '@inertiajs/react';

export default function Update({ certificate }) {
    const { data, setData, put, processing } = useForm({
        purpose: certificate.purpose || '',
        recommendation: certificate.recommendation || '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('medical-certificates.update', certificate.cert_id));
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <Head title="Update Medical Certificate" />
            <h1 className="text-2xl font-bold mb-6">Update Medical Certificate</h1>

            <form onSubmit={submit} className="bg-white p-6 rounded shadow-sm border space-y-4">
                <div>
                    <label className="block mb-1 font-bold">Purpose</label>
                    <textarea 
                        value={data.purpose} 
                        onChange={e => setData('purpose', e.target.value)} 
                        className="w-full border rounded p-2"
                    />
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
                    Update Certificate
                </button>
            </form>
        </div>
    );
}