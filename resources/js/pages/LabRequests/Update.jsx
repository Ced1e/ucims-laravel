import React from 'react';
import { Head, useForm } from '@inertiajs/react';

export default function Update({ labRequest }) {
    const { data, setData, put, processing } = useForm({
        test_type: labRequest.test_type || '',
        notes: labRequest.notes || '',
        result: labRequest.result || '',
        status: labRequest.status || 'requested',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('lab-requests.update', labRequest.lab_id));
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <Head title="Update Lab Request" />
            <h1 className="text-2xl font-bold mb-6">Update Laboratory Request</h1>

            <form onSubmit={submit} className="bg-white p-6 rounded shadow-sm border space-y-4">
                <div>
                    <label className="block mb-1 font-bold">Test Type</label>
                    <input 
                        type="text" 
                        value={data.test_type} 
                        onChange={e => setData('test_type', e.target.value)} 
                        className="w-full border rounded p-2"
                    />
                </div>

                <div>
                    <label className="block mb-1 font-bold">Result</label>
                    <textarea 
                        value={data.result} 
                        onChange={e => setData('result', e.target.value)} 
                        className="w-full border rounded p-2"
                    />
                </div>

                <div>
                    <label className="block mb-1 font-bold">Status</label>
                    <select 
                        value={data.status} 
                        onChange={e => setData('status', e.target.value)} 
                        className="w-full border rounded p-2"
                    >
                        <option value="requested">Requested</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>

                <button disabled={processing} className="bg-blue-600 text-white px-4 py-2 rounded">
                    Update Request
                </button>
            </form>
        </div>
    );
}