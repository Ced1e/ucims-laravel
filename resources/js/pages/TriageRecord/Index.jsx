import React from 'react';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ records }) {
    return (
        <div className="p-6">
            <Head title="Triage Records" />
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Triage Records</h1>
                <Link href={route('triage-records.create')} className="bg-blue-600 text-white px-4 py-2 rounded">
                    New Triage Record
                </Link>
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden border">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">Queue ID</th>
                            <th className="p-4">BP</th>
                            <th className="p-4">Temp</th>
                            <th className="p-4">Chief Complaint</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((r) => (
                            <tr key={r.triage_id} className="border-b">
                                <td className="p-4">{r.triage_id}</td>
                                <td className="p-4">{r.queue_id}</td>
                                <td className="p-4">{r.blood_pressure || 'N/A'}</td>
                                <td className="p-4">{r.temperature || 'N/A'}</td>
                                <td className="p-4">{r.chief_complaint || 'N/A'}</td>
                                <td className="p-4 space-x-2">
                                    <Link href={route('triage-records.edit', r.triage_id)} className="text-blue-600 hover:underline">Edit</Link>
                                    <button onClick={() => router.post(route('triage-records.clone', r.triage_id))} className="text-green-600 hover:underline">Clone</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}