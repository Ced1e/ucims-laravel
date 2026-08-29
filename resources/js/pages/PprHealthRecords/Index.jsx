import React from 'react';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ records }) {
    return (
        <div className="p-6">
            <Head title="Health Records" />
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Patient Health Records</h1>
                <Link href={route('ppr-health-records.create')} className="bg-blue-600 text-white px-4 py-2 rounded">
                    New Health Record
                </Link>
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden border">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">User ID</th>
                            <th className="p-4">Record Type</th>
                            <th className="p-4">Date Recorded</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((item) => (
                            <tr key={item.health_record_id} className="border-b">
                                <td className="p-4">{item.health_record_id}</td>
                                <td className="p-4">{item.user_id}</td>
                                <td className="p-4 font-semibold">{item.record_type}</td>
                                <td className="p-4">{item.date_recorded}</td>
                                <td className="p-4 space-x-2">
                                    <Link href={route('ppr-health-records.edit', item.health_record_id)} className="text-blue-600 hover:underline">Edit</Link>
                                    <button onClick={() => router.post(route('ppr-health-records.clone', item.health_record_id))} className="text-green-600 hover:underline">Clone</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}