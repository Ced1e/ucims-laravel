import PaginatedItems from '../../components/paginated-items.jsx';
import React from 'react';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ permanents }) {
    return (
        <div className="p-6">
            <Head title="Permanent Medical Records" />
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">PPR Permanents</h1>
                <Link href={"/ppr-permanents/create"} className="bg-blue-600 text-white px-4 py-2 rounded">
                    New Permanent Record
                </Link>
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden border">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">Patient ID</th>
                            <th className="p-4">Patient Type</th>
                            <th className="p-4">College / Department</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {<PaginatedItems items={permanents} tableColumns={5} label="permanents">{(item) => (
                            <tr key={item.permanent_id} className="border-b">
                                <td className="p-4">{item.permanent_id}</td>
                                <td className="p-4">{item.patient_id}</td>
                                <td className="p-4 font-semibold">{item.patient_type || 'Not recorded'}</td>
                                <td className="p-4">{item.college_dept || 'Not recorded'}</td>
                                <td className="p-4 space-x-2">
                                    <Link href={`/ppr-permanents/${item.permanent_id}/edit`} className="text-blue-600 hover:underline">Edit</Link>
                                    <button onClick={() => router.post(`/ppr-permanents/${item.permanent_id}/clone`)} className="text-green-600 hover:underline">Clone</button>
                                </td>
                            </tr>
                        )}</PaginatedItems>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}