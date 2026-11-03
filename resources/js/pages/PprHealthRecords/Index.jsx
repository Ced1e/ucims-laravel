import PaginatedItems from '../../components/paginated-items.jsx';
import React from 'react';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ records }) {
    return (
        <div className="p-6">
            <Head title="Health Records" />
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Patient Health Records</h1>
                <Link href={"/ppr-health-records/create"} className="bg-blue-600 text-white px-4 py-2 rounded">
                    New Health Record
                </Link>
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden border">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">Patient ID</th>
                            <th className="p-4">General Appearance</th>
                            <th className="p-4">Blood Pressure</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {<PaginatedItems items={records} tableColumns={5} label="records">{(item) => (
                            <tr key={item.hr_id} className="border-b">
                                <td className="p-4">{item.hr_id}</td>
                                <td className="p-4">{item.patient_id}</td>
                                <td className="p-4 font-semibold">{item.gen_appearance || 'Not recorded'}</td>
                                <td className="p-4">{item.blood_pressure || 'Not recorded'}</td>
                                <td className="p-4 space-x-2">
                                    <Link href={`/ppr-health-records/${item.hr_id}/edit`} className="text-blue-600 hover:underline">Edit</Link>
                                    <button onClick={() => router.post(`/ppr-health-records/${item.hr_id}/clone`)} className="text-green-600 hover:underline">Clone</button>
                                </td>
                            </tr>
                        )}</PaginatedItems>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}