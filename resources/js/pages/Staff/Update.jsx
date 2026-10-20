import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';

export default function Update({ staff }) {
    const { data, setData, put, processing, errors } = useForm({
        firstname: staff.user?.firstname || '',
        middlename: staff.user?.middlename || '',
        lastname: staff.user?.lastname || '',
        role: staff.user?.role || 'nurse',
        usep_email: staff.user?.usep_email || '',
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(`/staff/${staff.staff_profile_id}`);
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <Head title="Update Staff" />
            <h1 className="text-2xl font-bold mb-6">Update Staff Member</h1>

            <form onSubmit={submit} className="bg-white text-gray-900 p-6 rounded shadow-sm border space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-1 font-bold">First Name</label>
                        <input
                            type="text"
                            value={data.firstname}
                            onChange={(e) => setData('firstname', e.target.value)}
                            className="w-full border rounded p-2"
                        />
                        {errors.firstname && <div className="text-red-500 text-sm mt-1">{errors.firstname}</div>}
                    </div>
                    <div>
                        <label className="block mb-1 font-bold">Last Name</label>
                        <input
                            type="text"
                            value={data.lastname}
                            onChange={(e) => setData('lastname', e.target.value)}
                            className="w-full border rounded p-2"
                        />
                        {errors.lastname && <div className="text-red-500 text-sm mt-1">{errors.lastname}</div>}
                    </div>
                </div>

                <div>
                    <label className="block mb-1 font-bold">Role</label>
                    <select value={data.role} onChange={(e) => setData('role', e.target.value)} className="w-full border rounded p-2">
                        <option value="doctor">Doctor</option>
                        <option value="nurse">Nurse</option>
                        <option value="admin">Admin</option>
                    </select>
                    {errors.role && <div className="text-red-500 text-sm mt-1">{errors.role}</div>}
                </div>

                <div>
                    <label className="block mb-1 font-bold">USeP Email</label>
                    <input
                        type="email"
                        value={data.usep_email}
                        onChange={(e) => setData('usep_email', e.target.value)}
                        className="w-full border rounded p-2"
                    />
                    {errors.usep_email && <div className="text-red-500 text-sm mt-1">{errors.usep_email}</div>}
                </div>

                <div>
                    <label className="block mb-1 font-bold">Reset Password (leave blank to keep current)</label>
                    <input
                        type="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        className="w-full border rounded p-2"
                        placeholder="At least 8 characters"
                    />
                    {errors.password && <div className="text-red-500 text-sm mt-1">{errors.password}</div>}
                </div>

                <div className="flex items-center gap-3">
                    <button disabled={processing} className="bg-blue-600 text-white px-4 py-2 rounded">
                        {processing ? 'Saving…' : 'Update Staff'}
                    </button>
                    <Link href="/staff" className="text-gray-500 hover:underline">
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}
