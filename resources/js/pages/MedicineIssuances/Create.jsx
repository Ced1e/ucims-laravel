import React from 'react';
import { Head, useForm } from '@inertiajs/react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        endorsed_id: '',
        medicine_name: '',
        quantity: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('medicine-issuances.store'));
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <Head title="Create Medicine Issuance" />
            <h1 className="text-2xl font-bold mb-6">Log Medicine Issuance</h1>

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
                    <label className="block mb-1 font-bold">Medicine Name</label>
                    <input 
                        type="text" 
                        value={data.medicine_name} 
                        onChange={e => setData('medicine_name', e.target.value)} 
                        className="w-full border rounded p-2"
                    />
                    {errors.medicine_name && <div className="text-red-500 text-sm mt-1">{errors.medicine_name}</div>}
                </div>

                <div>
                    <label className="block mb-1 font-bold">Quantity</label>
                    <input 
                        type="number" 
                        value={data.quantity} 
                        onChange={e => setData('quantity', e.target.value)} 
                        className="w-full border rounded p-2"
                    />
                    {errors.quantity && <div className="text-red-500 text-sm mt-1">{errors.quantity}</div>}
                </div>

                <button disabled={processing} className="bg-blue-600 text-white px-4 py-2 rounded">
                    Save Issuance
                </button>
            </form>
        </div>
    );
}