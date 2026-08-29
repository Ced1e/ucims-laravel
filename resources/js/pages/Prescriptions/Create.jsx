import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        details: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/prescriptions');
    };

    return (
        <AppLayout>
            <Head title="Create Prescription" />
            <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow border border-gray-100 mt-6">
                <h1 className="text-xl font-bold text-gray-900 mb-6">New Prescription Entry</h1>
                
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Prescription Details</label>
                        <textarea
                            value={data.details}
                            onChange={(e) => setData('details', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-600/20"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full bg-blue-600 text-white rounded-lg py-3 font-semibold hover:bg-blue-700 transition"
                    >
                        Save Prescription
                    </button>
                </form>
            </div>
        </AppLayout>
    );
}