import React from 'react';
import { Head, Link, router } from '@inertiajs/react';

const ROLE_LABELS = { admin: 'Admin', doctor: 'Doctor', nurse: 'Nurse' };

export default function Index({ staff }) {
    function handleDelete(member) {
        const name = `${member.user?.firstname ?? ''} ${member.user?.lastname ?? ''}`.trim();
        if (!confirm(`Disable the staff account for ${name || 'this staff member'}? This cannot be undone.`)) return;
        router.delete(`/staff/${member.staff_profile_id}`);
    }

    return (
        <div className="p-6">
            <Head title="Staff Management" />
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Staff Accounts</h1>
                <Link href="/staff/create" className="bg-blue-600 text-white px-4 py-2 rounded">
                    New Staff Member
                </Link>
            </div>

            <div className="bg-white text-gray-900 shadow-sm rounded-lg overflow-hidden border">
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
                        {staff.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">
                                    No staff accounts yet. Click "New Staff Member" to create one.
                                </td>
                            </tr>
                        )}
                        {staff.map((s) => (
                            <tr key={s.staff_profile_id} className="border-b">
                                <td className="p-4 font-bold">{s.user?.clinic_id}</td>
                                <td className="p-4">
                                    {s.user?.firstname} {s.user?.lastname}
                                </td>
                                <td className="p-4">{ROLE_LABELS[s.user?.role] || s.user?.role}</td>
                                <td className="p-4">{s.user?.usep_email}</td>
                                <td className="p-4 space-x-3">
                                    <Link href={`/staff/${s.staff_profile_id}/edit`} className="text-blue-600 hover:underline">
                                        Edit
                                    </Link>
                                    <button onClick={() => router.post(`/staff/${s.staff_profile_id}/clone`)} className="text-green-600 hover:underline">
                                        Clone
                                    </button>
                                    <button onClick={() => handleDelete(s)} className="text-red-600 hover:underline">
                                        Disable
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
