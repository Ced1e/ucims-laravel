import React from 'react';
import { Head, useForm } from '@inertiajs/react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        user_id: '',
        password_hash: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('patient-auth.store'));
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <Head title="Create Patient Auth" />
            <h1 className="text-2xl font-bold mb-6">Add Patient Credentials</h1>

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
                    <label className="block mb-1 font-bold">Password</label>
                    <input 
                        type="password" 
                        value={data.password_hash} 
                        onChange={e => setData('password_hash', e.target.value)} 
                        className="w-full border rounded p-2"
                    />
                    {errors.password_hash && <div className="text-red-500 text-sm mt-1">{errors.password_hash}</div>}
                </div>

                <button disabled={processing} className="bg-blue-600 text-white px-4 py-2 rounded">
                    Save Credentials
                </button>
            </form>
        </div>
    );
}