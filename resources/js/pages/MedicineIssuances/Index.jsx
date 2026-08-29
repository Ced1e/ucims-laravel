import React from 'react';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ issuances }) {
    return (
        <div className="p-6">
            <Head title="Medicine Issuances" />
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Medicine Issuances</h1>
                <Link href={route('medicine-issuances.create')} className="bg-blue-600 text-white px-4 py-2 rounded">
                    New Issuance
                </Link>
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden border">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">Consultation ID</th>
                            <th className="p-4">Medicine Name</th>
                            <th className="p-4">Quantity</th>
                            <th className="p-4">Date Issued</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {issuances.map((item) => (
                            <tr key={item.issuance_id} className="border-b">
                                <td className="p-4">{item.issuance_id}</td>
                                <td className="p-4">{item.endorsed_id}</td>
                                <td className="p-4 font-semibold">{item.medicine_name}</td>
                                <td className="p-4">{item.quantity}</td>
                                <td className="p-4">{item.date_issued}</td>
                                <td className="p-4 space-x-2">
                                    <Link href={route('medicine-issuances.edit', item.issuance_id)} className="text-blue-600 hover:underline">Edit</Link>
                                    <button onClick={() => router.post(route('medicine-issuances.clone', item.issuance_id))} className="text-green-600 hover:underline">Clone</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}