import React from 'react';
import { Head, useForm } from '@inertiajs/react';

export default function Update({ issuance }) {
    const { data, setData, put, processing } = useForm({
        medicine_name: issuance.medicine_name || '',
        quantity: issuance.quantity || '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('medicine-issuances.update', issuance.issuance_id));
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <Head title="Update Medicine Issuance" />
            <h1 className="text-2xl font-bold mb-6">Update Medicine Issuance</h1>

            <form onSubmit={submit} className="bg-white p-6 rounded shadow-sm border space-y-4">
                <div>
                    <label className="block mb-1 font-bold">Medicine Name</label>
                    <input 
                        type="text" 
                        value={data.medicine_name} 
                        onChange={e => setData('medicine_name', e.target.value)} 
                        className="w-full border rounded p-2"
                    />
                </div>

                <div>
                    <label className="block mb-1 font-bold">Quantity</label>
                    <input 
                        type="number" 
                        value={data.quantity} 
                        onChange={e => setData('quantity', e.target.value)} 
                        className="w-full border rounded p-2"
                    />
                </div>

                <button disabled={processing} className="bg-blue-600 text-white px-4 py-2 rounded">
                    Update Issuance
                </button>
            </form>
        </div>
    );
}