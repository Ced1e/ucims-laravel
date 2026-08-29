import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function Index({ endorsedItems }) {
    const { delete: destroy, post } = useForm();

    const handleClone = (id) => {
        post(`/endorsed/${id}/clone`);
    };

    return (
        <AppLayout>
            <Head title="Endorsements" />
            <div className="p-6 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Endorsed Records</h1>
                    <Link href="/endorsed/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition">
                        New Endorsement
                    </Link>
                </div>

                <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-600 uppercase tracking-wider">
                                <th className="p-4">Details</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {endorsedItems?.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/50">
                                    <td className="p-4 font-medium text-gray-900">Endorsement #{item.id}</td>
                                    <td className="p-4 text-right space-x-2">
                                        <Link href={`/endorsed/${item.id}/edit`} className="text-blue-600 hover:underline">Edit</Link>
                                        <button onClick={() => handleClone(item.id)} className="text-amber-600 hover:underline">Clone</button>
                                        <button onClick={() => destroy(`/endorsed/${item.id}`)} className="text-red-600 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}