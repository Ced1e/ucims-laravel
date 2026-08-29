import React from 'react';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ staff }) {
    return (
        <div className="p-6">
            <Head title="Staff Management" />
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Staff Profiles</h1>
                <Link href={route('staff.create')} className="bg-blue-600 text-white px-4 py-2 rounded">
                    New Staff Member
                </Link>
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden border">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">Clinic ID</th>
                            <th className="p-4">Name</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {staff.map((s) => (
                            <tr key={s.staff_id} className="border-b">
                                <td className="p-4 font-bold">{s.clinic_id}</td>
                                <td className="p-4">{s.first_name} {s.last_name}</td>
                                <td className="p-4">{s.role}</td>
                                <td className="p-4">{s.email}</td>
                                <td className="p-4 space-x-2">
                                    <Link href={route('staff.edit', s.staff_id)} className="text-blue-600 hover:underline">Edit</Link>
                                    <button onClick={() => router.post(route('staff.clone', s.staff_id))} className="text-green-600 hover:underline">Clone</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}