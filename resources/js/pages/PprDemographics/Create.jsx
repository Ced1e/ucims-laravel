import React from 'react';
import { Head, useForm } from '@inertiajs/react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        user_id: '',
        civil_status: 'Single',
        sex: 'Male',
        birth_date: '',
        contact_number: '',
        home_address: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('ppr-demographics.store'));
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <Head title="Create Demographics" />
            <h1 className="text-2xl font-bold mb-6">Add Patient Demographics</h1>

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

                <div className="grid grid-cols-2 gap-4">
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
                        <label className="block mb-1 font-bold">Sex</label>
                        <input 
                            type="text" 
                            value={data.sex} 
                            onChange={e => setData('sex', e.target.value)} 
                            className="w-full border rounded p-2"
                        />
                    </div>
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
                    Save Demographics
                </button>
            </form>
        </div>
    );
}