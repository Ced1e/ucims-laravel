import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function Edit({ consultation, patients }: { consultation: any; patients: any[] }) {
    const { data, setData, put, processing, errors } = useForm({
        patient_id: consultation.patient_id || '',
        diagnosis: consultation.diagnosis || '',
        treatment_plan: consultation.treatment_plan || '',
        status: consultation.status || 'pending',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/consultations/${consultation.id}`);
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Consultations', href: '/consultations' }, { title: 'Edit', href: '#' }]}>
            <Head title="Edit Consultation" />
            <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow border border-[#DDD9D0] mt-6">
                <h1 className="text-xl font-bold text-[#5a0000] mb-4">Edit Consultation Entry</h1>
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-[#333] mb-1">Select Patient</label>
                        <select value={data.patient_id} onChange={e => setData('patient_id', e.target.value)} className="w-full p-2.5 border rounded-lg text-sm">
                            <option value="">-- Choose Patient --</option>
                            {patients?.map(p => (
                                <option key={p.user_id} value={p.user_id}>{p.firstname} {p.lastname}</option>
                            ))}
                        </select>
                        {errors.patient_id && <div className="text-red-600 text-xs mt-1">{errors.patient_id}</div>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-[#333] mb-1">Diagnosis</label>
                        <textarea value={data.diagnosis} onChange={e => setData('diagnosis', e.target.value)} className="w-full p-2.5 border rounded-lg text-sm" rows={3} required />
                        {errors.diagnosis && <div className="text-red-600 text-xs mt-1">{errors.diagnosis}</div>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-[#333] mb-1">Treatment Plan</label>
                        <textarea value={data.treatment_plan} onChange={e => setData('treatment_plan', e.target.value)} className="w-full p-2.5 border rounded-lg text-sm" rows={3} />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-[#333] mb-1">Status</label>
                        <select value={data.status} onChange={e => setData('status', e.target.value)} className="w-full p-2.5 border rounded-lg text-sm">
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <button type="submit" disabled={processing} className="w-full bg-[#760000] text-white py-2.5 rounded-lg font-semibold text-sm">
                        Update Consultation
                    </button>
                </form>
            </div>
        </AppLayout>
    );
}