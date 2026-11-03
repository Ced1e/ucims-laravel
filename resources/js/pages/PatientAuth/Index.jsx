import PaginatedItems from '../../components/paginated-items.jsx';
import React from 'react';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ auths }) {
    return (
        <div className="p-6">
            <Head title="Patient Authentication" />
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Patient Authentication Records</h1>
                <Link href={"/patient-auth/create"} className="bg-blue-600 text-white px-4 py-2 rounded">
                    New Patient Auth
                </Link>
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden border">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">User ID</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {<PaginatedItems items={auths} tableColumns={3} label="auths">{(item) => (
                            <tr key={item.patient_auth_id} className="border-b">
                                <td className="p-4">{item.patient_auth_id}</td>
                                <td className="p-4">{item.user_id}</td>
                                <td className="p-4 space-x-2">
                                    <Link href={`/patient-auth/${item.patient_auth_id}/edit`} className="text-blue-600 hover:underline">Edit</Link>
                                    <button onClick={() => router.post(`/patient-auth/${item.patient_auth_id}/clone`)} className="text-green-600 hover:underline">Clone</button>
                                </td>
                            </tr>
                        )}</PaginatedItems>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}