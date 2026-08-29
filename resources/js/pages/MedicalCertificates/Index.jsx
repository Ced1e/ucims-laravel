import React from 'react';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ certificates }) {
    return (
        <div className="p-6">
            <Head title="Medical Certificates" />
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Medical Certificates</h1>
                <Link href={route('medical-certificates.create')} className="bg-blue-600 text-white px-4 py-2 rounded">
                    New Certificate
                </Link>
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden border">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">Consultation ID</th>
                            <th className="p-4">Purpose</th>
                            <th className="p-4">Date Issued</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {certificates.map((cert) => (
                            <tr key={cert.cert_id} className="border-b">
                                <td className="p-4">{cert.cert_id}</td>
                                <td className="p-4">{cert.endorsed_id}</td>
                                <td className="p-4 font-semibold">{cert.purpose}</td>
                                <td className="p-4">{cert.date_issued}</td>
                                <td className="p-4 space-x-2">
                                    <Link href={route('medical-certificates.edit', cert.cert_id)} className="text-blue-600 hover:underline">Edit</Link>
                                    <button onClick={() => router.post(route('medical-certificates.clone', cert.cert_id))} className="text-green-600 hover:underline">Clone</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}