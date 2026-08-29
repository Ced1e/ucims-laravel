import React from 'react';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ permanents }) {
    return (
        <div className="p-6">
            <Head title="Permanent Medical Records" />
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">PPR Permanents</h1>
                <Link href={route('ppr-permanents.create')} className="bg-blue-600 text-white px-4 py-2 rounded">
                    New Permanent Record
                </Link>
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden border">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">User ID</th>
                            <th className="p-4">Blood Type</th>
                            <th className="p-4">Chronic Conditions</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {permanents.map((item) => (
                            <tr key={item.permanent_id} className="border-b">
                                <td className="p-4">{item.permanent_id}</td>
                                <td className="p-4">{item.user_id}</td>
                                <td className="p-4 font-semibold">{item.blood_type || 'N/A'}</td>
                                <td className="p-4">{item.chronic_conditions || 'None'}</td>
                                <td className="p-4 space-x-2">
                                    <Link href={route('ppr-permanents.edit', item.permanent_id)} className="text-blue-600 hover:underline">Edit</Link>
                                    <button onClick={() => router.post(route('ppr-permanents.clone', item.permanent_id))} className="text-green-600 hover:underline">Clone</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}