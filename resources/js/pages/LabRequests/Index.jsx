import PaginatedItems from '../../components/paginated-items.jsx';
import React from 'react';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ requests }) {
    return (
        <div className="p-6">
            <Head title="Lab Requests" />
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Laboratory Requests</h1>
                <Link href={"/lab-requests/create"} className="bg-blue-600 text-white px-4 py-2 rounded">
                    New Lab Request
                </Link>
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden border">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">Endorsement ID</th>
                            <th className="p-4">Laboratory Request</th>
                            <th className="p-4">Result / Attachment</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {<PaginatedItems items={requests} tableColumns={5} label="requests">{(req) => (
                            <tr key={req.lab_request_id} className="border-b">
                                <td className="p-4">{req.lab_request_id}</td>
                                <td className="p-4">{req.endorsed_id}</td>
                                <td className="p-4 font-semibold">{req.laboratory_request}</td>
                                <td className="p-4">
                                    <span className="px-2 py-1 bg-gray-100 rounded text-sm">{req.attachments || 'Not recorded'}</span>
                                </td>
                                <td className="p-4 space-x-2">
                                    <Link href={`/lab-requests/${req.lab_request_id}/edit`} className="text-blue-600 hover:underline">Edit</Link>
                                    <button onClick={() => router.post(`/lab-requests/${req.lab_request_id}/clone`)} className="text-green-600 hover:underline">Clone</button>
                                </td>
                            </tr>
                        )}</PaginatedItems>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}