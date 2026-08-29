import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function Index({ clinicQueues }) {
    const { delete: destroy, post } = useForm();

    return (
        <AppLayout>
            <Head title="Clinic Queue" />
            <div className="p-6 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Clinic Queue Management</h1>
                    <Link href="/clinic-queue/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition">
                        Add to Queue
                    </Link>
                </div>

                <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-600 uppercase tracking-wider">
                                <th className="p-4">Queue Number</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {clinicQueues?.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/50">
                                    <td className="p-4 font-medium text-gray-900">{item.queue_number}</td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                            item.status === 'waiting' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <Link href={`/clinic-queue/${item.id}/edit`} className="text-blue-600 hover:underline">Edit</Link>
                                        <button onClick={() => destroy(`/clinic-queue/${item.id}`)} className="text-red-600 hover:underline">Delete</button>
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