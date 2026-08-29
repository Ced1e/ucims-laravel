import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function Update({ triageRecord }) {
    const { data, setData, put, processing, errors } = useForm({
        temperature: triageRecord?.temperature || '',
        blood_pressure: triageRecord?.blood_pressure || '',
        pulse_rate: triageRecord?.pulse_rate || '',
        notes: triageRecord?.notes || '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(`/triage-records/${triageRecord.id}`);
    };

    return (
        <AppLayout>
            <Head title="Edit Triage Record" />
            <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow border border-gray-100 mt-6">
                <h1 className="text-xl font-bold text-gray-900 mb-6">Edit Triage Entry</h1>
                
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Temperature (°C)</label>
                        <input
                            type="text"
                            value={data.temperature}
                            onChange={(e) => setData('temperature', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-600/20"
                        />
                        {errors.temperature && <p className="text-xs text-red-600 mt-1">{errors.temperature}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Blood Pressure</label>
                        <input
                            type="text"
                            value={data.blood_pressure}
                            onChange={(e) => setData('blood_pressure', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-600/20"
                        />
                        {errors.blood_pressure && <p className="text-xs text-red-600 mt-1">{errors.blood_pressure}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Pulse Rate</label>
                        <input
                            type="text"
                            value={data.pulse_rate}
                            onChange={(e) => setData('pulse_rate', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-600/20"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full bg-blue-600 text-white rounded-lg py-3 font-semibold hover:bg-blue-700 transition"
                    >
                        Update Triage Record
                    </button>
                </form>
            </div>
        </AppLayout>
    );
}