import React from 'react';
import { Head, useForm } from '@inertiajs/react';

export default function Update({ staff }) {
    const { data, setData, put, processing } = useForm({
        first_name: staff.first_name || '',
        last_name: staff.last_name || '',
        role: staff.role || 'Doctor',
        email: staff.email || '',
        password_hash: '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('staff.update', staff.staff_id));
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <Head title="Update Staff" />
            <h1 className="text-2xl font-bold mb-6">Update Staff Member</h1>

            <form onSubmit={submit} className="bg-white p-6 rounded shadow-sm border space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-1 font-bold">First Name</label>
                        <input 
                            type="text" 
                            value={data.first_name} 
                            onChange={e => setData('first_name', e.target.value)} 
                            className="w-full border rounded p-2"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-bold">Last Name</label>
                        <input 
                            type="text" 
                            value={data.last_name} 
                            onChange={e => setData('last_name', e.target.value)} 
                            className="w-full border rounded p-2"
                        />
                    </div>
                </div>

                <div>
                    <label className="block mb-1 font-bold">Email</label>
                    <input 
                        type="email" 
                        value={data.email} 
                        onChange={e => setData('email', e.target.value)} 
                        className="w-full border rounded p-2"
                    />
                </div>

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
                    Update Staff
                </button>
            </form>
        </div>
    );
}