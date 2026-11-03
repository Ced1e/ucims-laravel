import PaginatedItems from '../../components/paginated-items.jsx';
import React from 'react';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ certificates }) {
    return (
        <div className="p-6">
            <Head title="Medical Certificates" />
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Medical Certificates</h1>
                <Link href={"/medical-certificates/create"} className="bg-blue-600 text-white px-4 py-2 rounded">
                    New Certificate
                </Link>
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden border">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">Queue ID</th>
                            <th className="p-4">Purpose</th>
                            <th className="p-4">Date Issued</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {<PaginatedItems items={certificates} tableColumns={5} label="certificates">{(cert) => (
                            <tr key={cert.certificate_id} className="border-b">
                                <td className="p-4">{cert.certificate_id}</td>
                                <td className="p-4">{cert.queue_id}</td>
                                <td className="p-4 font-semibold">{cert.purpose}</td>
                                <td className="p-4">{cert.issued_date}</td>
                                <td className="p-4 space-x-2">
                                    <Link href={`/medical-certificates/${cert.certificate_id}/edit`} className="text-blue-600 hover:underline">Edit</Link>
                                    <button onClick={() => router.post(`/medical-certificates/${cert.certificate_id}/clone`)} className="text-green-600 hover:underline">Clone</button>
                                </td>
                            </tr>
                        )}</PaginatedItems>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}