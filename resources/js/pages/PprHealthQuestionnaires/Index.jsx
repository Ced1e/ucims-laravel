import React from 'react';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ questionnaires }) {
    return (
        <div className="p-6">
            <Head title="Health Questionnaires" />
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Health Questionnaires</h1>
                <Link href={route('ppr-health-questionnaires.create')} className="bg-blue-600 text-white px-4 py-2 rounded">
                    New Questionnaire
                </Link>
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden border">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">User ID</th>
                            <th className="p-4">Allergies</th>
                            <th className="p-4">Maintenance Meds</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {questionnaires.map((item) => (
                            <tr key={item.questionnaire_id} className="border-b">
                                <td className="p-4">{item.questionnaire_id}</td>
                                <td className="p-4">{item.user_id}</td>
                                <td className="p-4">{item.has_allergies ? 'Yes' : 'No'}</td>
                                <td className="p-4">{item.has_maintenance_meds ? 'Yes' : 'No'}</td>
                                <td className="p-4 space-x-2">
                                    <Link href={route('ppr-health-questionnaires.edit', item.questionnaire_id)} className="text-blue-600 hover:underline">Edit</Link>
                                    <button onClick={() => router.post(route('ppr-health-questionnaires.clone', item.questionnaire_id))} className="text-green-600 hover:underline">Clone</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}