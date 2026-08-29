import React from 'react';
import { Head, useForm } from '@inertiajs/react';

export default function Update({ auth }) {
    const { data, setData, put, processing } = useForm({
        password_hash: '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('patient-auth.update', auth.patient_auth_id));
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <Head title="Update Patient Auth" />
            <h1 className="text-2xl font-bold mb-6">Update Patient Password</h1>

            <form onSubmit={submit} className="bg-white p-6 rounded shadow-sm border space-y-4">
                <div>
                    <label className="block mb-1 font-bold">New Password (leave blank to keep current)</label>
                    <input 
                        type="password" 
                        value={data.password_hash} 
                        onChange={e => setData('password_hash', e.target.value)} 
                        className="w-full border rounded p-2"
                    />
                </div>

                <button disabled={processing} className="bg-blue-600 text-white px-4 py-2 rounded">
                    Update Password
                </button>
            </form>
        </div>
    );
}