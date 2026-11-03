import PaginatedItems from '../../components/paginated-items.jsx';
import React from 'react';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ questionnaires }) {
    return (
        <div className="p-6">
            <Head title="Health Questionnaires" />
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Health Questionnaires</h1>
                <Link href={"/ppr-health-questionnaires/create"} className="bg-blue-600 text-white px-4 py-2 rounded">
                    New Questionnaire
                </Link>
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden border">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">Patient ID</th>
                            <th className="p-4">Previously Hospitalized</th>
                            <th className="p-4">Previous Surgery</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {<PaginatedItems items={questionnaires} tableColumns={5} label="questionnaires">{(item) => (
                            <tr key={item.questionnaire_id} className="border-b">
                                <td className="p-4">{item.questionnaire_id}</td>
                                <td className="p-4">{item.patient_id}</td>
                                <td className="p-4">{item.hosp_admitted === null || item.hosp_admitted === undefined || item.hosp_admitted === '' ? 'Not recorded' : String(item.hosp_admitted)}</td>
                                <td className="p-4">{item.surgery === null || item.surgery === undefined || item.surgery === '' ? 'Not recorded' : String(item.surgery)}</td>
                                <td className="p-4 space-x-2">
                                    <Link href={`/ppr-health-questionnaires/${item.questionnaire_id}/edit`} className="text-blue-600 hover:underline">Edit</Link>
                                    <button onClick={() => router.post(`/ppr-health-questionnaires/${item.questionnaire_id}/clone`)} className="text-green-600 hover:underline">Clone</button>
                                </td>
                            </tr>
                        )}</PaginatedItems>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}