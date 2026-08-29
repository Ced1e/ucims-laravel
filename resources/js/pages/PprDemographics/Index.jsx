import React from 'react';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ demographics }) {
    return (
        <div className="p-6">
            <Head title="PPR Demographics" />
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Patient Demographics</h1>
                <Link href={route('ppr-demographics.create')} className="bg-blue-600 text-white px-4 py-2 rounded">
                    New Demographics
                </Link>
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden border">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">User ID</th>
                            <th className="p-4">Contact Number</th>
                            <th className="p-4">Address</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {demographics.map((item) => (
                            <tr key={item.demo_id} className="border-b">
                                <td className="p-4">{item.demo_id}</td>
                                <td className="p-4">{item.user_id}</td>
                                <td className="p-4">{item.contact_number}</td>
                                <td className="p-4">{item.home_address}</td>
                                <td className="p-4 space-x-2">
                                    <Link href={route('ppr-demographics.edit', item.demo_id)} className="text-blue-600 hover:underline">Edit</Link>
                                    <button onClick={() => router.post(route('ppr-demographics.clone', item.demo_id))} className="text-green-600 hover:underline">Clone</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}