import PaginatedItems from '../../components/paginated-items.jsx';
import React from 'react';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ issuances }) {
    return (
        <div className="p-6">
            <Head title="Medicine Issuances" />
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Medicine Issuances</h1>
                <Link href={"/medicine-issuances/create"} className="bg-blue-600 text-white px-4 py-2 rounded">
                    New Issuance
                </Link>
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden border">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">Queue ID</th>
                            <th className="p-4">Medicine Name</th>
                            <th className="p-4">Quantity</th>
                            <th className="p-4">Date Issued</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {<PaginatedItems items={issuances} tableColumns={6} label="issuances">{(item) => (
                            <tr key={item.issuance_id} className="border-b">
                                <td className="p-4">{item.issuance_id}</td>
                                <td className="p-4">{item.queue_id}</td>
                                <td className="p-4 font-semibold">{item.medicine_name}</td>
                                <td className="p-4">{item.quantity}</td>
                                <td className="p-4">{item.issued_date}</td>
                                <td className="p-4 space-x-2">
                                    <Link href={`/medicine-issuances/${item.issuance_id}/edit`} className="text-blue-600 hover:underline">Edit</Link>
                                    <button onClick={() => router.post(`/medicine-issuances/${item.issuance_id}/clone`)} className="text-green-600 hover:underline">Clone</button>
                                </td>
                            </tr>
                        )}</PaginatedItems>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}