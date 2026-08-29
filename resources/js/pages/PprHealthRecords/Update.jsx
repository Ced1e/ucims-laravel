import React from 'react';
import { Head, useForm } from '@inertiajs/react';

export default function Update({ record }) {
    const { data, setData, put, processing } = useForm({
        record_type: record.record_type || '',
        description: record.description || '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('ppr-health-records.update', record.health_record_id));
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <Head title="Update Health Record" />
            <h1 className="text-2xl font-bold mb-6">Update Patient Health Record</h1>

            <form onSubmit={submit} className="bg-white p-6 rounded shadow-sm border space-y-4">
                <div>
                    <label className="block mb-1 font-bold">Record Type</label>
                    <input 
                        type="text" 
                        value={data.record_type} 
                        onChange={e => setData('record_type', e.target.value)} 
                        className="w-full border rounded p-2"
                    />
                </div>

                <div>
                    <label className="block mb-1 font-bold">Description</label>
                    <textarea 
                        value={data.description} 
                        onChange={e => setData('description', e.target.value)} 
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