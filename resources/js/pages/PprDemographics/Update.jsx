import React from 'react';
import { Head, useForm } from '@inertiajs/react';

export default function Update({ demographic }) {
    const { data, setData, put, processing } = useForm({
        civil_status: demographic.civil_status || '',
        contact_number: demographic.contact_number || '',
        home_address: demographic.home_address || '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('ppr-demographics.update', demographic.demo_id));
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <Head title="Update Demographics" />
            <h1 className="text-2xl font-bold mb-6">Update Patient Demographics</h1>

            <form onSubmit={submit} className="bg-white p-6 rounded shadow-sm border space-y-4">
                <div>
                    <label className="block mb-1 font-bold">Civil Status</label>
                    <input 
                        type="text" 
                        value={data.civil_status} 
                        onChange={e => setData('civil_status', e.target.value)} 
                        className="w-full border rounded p-2"
                    />
                </div>

                <div>
                    <label className="block mb-1 font-bold">Contact Number</label>
                    <input 
                        type="text" 
                        value={data.contact_number} 
                        onChange={e => setData('contact_number', e.target.value)} 
                        className="w-full border rounded p-2"
                    />
                </div>

                <div>
                    <label className="block mb-1 font-bold">Home Address</label>
                    <textarea 
                        value={data.home_address} 
                        onChange={e => setData('home_address', e.target.value)} 
                        className="w-full border rounded p-2"
                    />
                </div>

                <button disabled={processing} className="bg-blue-600 text-white px-4 py-2 rounded">
                    Update Demographics
                </button>
            </form>
        </div>
    );
}