import React from 'react';
import { Head, useForm } from '@inertiajs/react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        clinic_id: '',
        first_name: '',
        last_name: '',
        role: 'Doctor',
        email: '',
        password_hash: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('staff.store'));
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <Head title="Create Staff" />
            <h1 className="text-2xl font-bold mb-6">New Staff Member</h1>

            <form onSubmit={submit} className="bg-white p-6 rounded shadow-sm border space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-1 font-bold">Clinic ID</label>
                        <input 
                            type="text" 
                            value={data.clinic_id} 
                            onChange={e => setData('clinic_id', e.target.value)} 
                            className="w-full border rounded p-2"
                            placeholder="D-002"
                        />
                        {errors.clinic_id && <div className="text-red-500 text-sm mt-1">{errors.clinic_id}</div>}
                    </div>
                    <div>
                        <label className="block mb-1 font-bold">Role</label>
                        <select 
                            value={data.role} 
                            onChange={e => setData('role', e.target.value)} 
                            className="w-full border rounded p-2"
                        >
                            <option value="Doctor">Doctor</option>
                            <option value="Nurse">Nurse</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>
                </div>

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
                    {errors.email && <div className="text-red-500 text-sm mt-1">{errors.email}</div>}
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
                    Save Staff Member
                </button>
            </form>
        </div>
    );
}