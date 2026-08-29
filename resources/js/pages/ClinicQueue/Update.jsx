import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function Update({ clinicQueue }) {
    const { data, setData, put, processing, errors } = useForm({
        queue_number: clinicQueue?.queue_number || '',
        status: clinicQueue?.status || 'waiting',
    });

    const submit = (e) => {
        e.preventDefault();
        put(`/clinic-queue/${clinicQueue.id}`);
    };

    return (
        <AppLayout>
            <Head title="Edit Queue Entry" />
            <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow border border-gray-100 mt-6">
                <h1 className="text-xl font-bold text-gray-900 mb-6">Edit Queue Entry</h1>
                
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Queue Number</label>
                        <input
                            type="text"
                            value={data.queue_number}
                            onChange={(e) => setData('queue_number', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-600/20"
                        />
                        {errors.queue_number && <p className="text-xs text-red-600 mt-1">{errors.queue_number}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Status</label>
                        <select
                            value={data.status}
                            onChange={(e) => setData('status', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-600/20"
                        >
                            <option value="waiting">Waiting</option>
                            <option value="serving">Serving</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full bg-blue-600 text-white rounded-lg py-3 font-semibold hover:bg-blue-700 transition"
                    >
                        Update Queue Entry
                    </button>
                </form>
            </div>
        </AppLayout>
    );
}