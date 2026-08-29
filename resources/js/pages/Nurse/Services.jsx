import React, { useState, useEffect } from 'react';
import api from '@/services/api';

export default function NurseServices() {
    const [queues, setQueues] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [selectedQueue, setSelectedQueue] = useState(null);
    const [medForm, setMedForm] = useState({
        medicine_name: '',
        quantity: '',
        dosage: '',
    });

    const fetchData = async () => {
        try {
            const qResponse = await api.get('/queues');
            setQueues(qResponse.data);
            const mResponse = await api.get('/medicine-issuances');
            setMedicines(mResponse.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleIssueMedicine = async (e) => {
        e.preventDefault();
        if (!selectedQueue) return;

        try {
            await api.post('/medicine-issuances', {
                queue_id: selectedQueue.queue_id,
                ...medForm,
                quantity: parseInt(medForm.quantity),
            });
            setMedForm({ medicine_name: '', quantity: '', dosage: '' });
            setSelectedQueue(null);
            fetchData();
        } catch (error) {
            console.error('Failed to issue medicine:', error);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-maroon mb-4">Medicine Issuance & Clinical Services</h1>
            
            <div className="bg-white shadow rounded-lg p-4 mb-6">
                <h2 className="text-lg font-semibold mb-3">Active Patient Queue</h2>
                <div className="space-y-2">
                    {queues.map((q) => (
                        <div key={q.queue_id} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
                            <div>
                                <span className="font-bold text-maroon">#{q.queue_number}</span> — {q.patient?.firstname} {q.patient?.lastname}
                            </div>
                            <button
                                onClick={() => setSelectedQueue(q)}
                                className="px-3 py-1 bg-maroon text-white text-xs rounded hover:bg-maroon-dark"
                            >
                                Issue Medicine
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white shadow rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3">Recent Issuances</h2>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-100 border-b">
                            <th className="p-2">Patient</th>
                            <th className="p-2">Medicine</th>
                            <th className="p-2">Quantity</th>
                            <th className="p-2">Dosage</th>
                        </tr>
                    </thead>
                    <tbody>
                        {medicines.map((m) => (
                            <tr key={m.id} className="border-b">
                                <td className="p-2">{m.queue?.patient?.firstname} {m.queue?.patient?.lastname}</td>
                                <td className="p-2">{m.medicine_name}</td>
                                <td className="p-2">{m.quantity}</td>
                                <td className="p-2">{m.dosage || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedQueue && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Issue Medicine: #{selectedQueue.queue_number}</h2>
                        <form onSubmit={handleIssueMedicine} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1">Medicine Name *</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded"
                                    value={medForm.medicine_name}
                                    onChange={(e) => setMedForm({ ...medForm, medicine_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1">Quantity *</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded"
                                    value={medForm.quantity}
                                    onChange={(e) => setMedForm({ ...medForm, quantity: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1">Dosage</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded"
                                    placeholder="e.g. 500mg"
                                    value={medForm.dosage}
                                    onChange={(e) => setMedForm({ ...medForm, dosage: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setSelectedQueue(null)}
                                    className="px-4 py-2 border rounded text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-maroon text-white rounded text-sm font-bold"
                                >
                                    Save Issuance
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}