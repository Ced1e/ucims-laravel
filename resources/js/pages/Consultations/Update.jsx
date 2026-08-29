import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function Update({ consultation }) {
    const { data, setData, put, processing, errors } = useForm({
        diagnosis: consultation.diagnosis || '',
        treatment: consultation.treatment || '',
        notes: consultation.notes || '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(`/consultations/${consultation.id}`);
    };

    return (
        <AppLayout>
            <Head title="Edit Consultation" />
            <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow border border-gray-100 mt-6">
                <h1 className="text-xl font-bold text-gray-900 mb-6">Edit Consultation Entry</h1>
                
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Diagnosis</label>
                        <input
                            type="text"
                            value={data.diagnosis}
                            onChange={(e) => setData('diagnosis', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-600/20"
                        />
                        {errors.diagnosis && <p className="text-xs text-red-600 mt-1">{errors.diagnosis}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Treatment</label>
                        <textarea
                            value={data.treatment}
                            onChange={(e) => setData('treatment', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-600/20"
                        />
                        {errors.treatment && <p className="text-xs text-red-600 mt-1">{errors.treatment}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Notes</label>
                        <textarea
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-600/20"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full bg-blue-600 text-white rounded-lg py-3 font-semibold hover:bg-blue-700 transition"
                    >
                        Update Record
                    </button>
                </form>
            </div>
        </AppLayout>
    );
}