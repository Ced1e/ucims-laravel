import React, { useState, useEffect } from 'react';
import api from '@/services/api';

export default function DoctorConsultation() {
    const [queues, setQueues] = useState([]);
    const [selectedQueue, setSelectedQueue] = useState(null);
    const [activeTab, setActiveTab] = useState('lab');
    const [labForm, setLabForm] = useState({ test_type: '', results: '' });
    const [rxForm, setRxForm] = useState({ medication_details: '', instructions: '' });

    const fetchQueues = async () => {
        try {
            const response = await api.get('/queues');
            setQueues(response.data);
        } catch (error) {
            console.error('Failed to fetch queues:', error);
        }
    };

    useEffect(() => {
        fetchQueues();
    }, []);

    const handleLabSubmit = async (e) => {
        e.preventDefault();
        if (!selectedQueue) return;

        try {
            await api.post('/lab-requests', {
                queue_id: selectedQueue.queue_id,
                status: 'Requested',
                ...labForm,
            });
            setLabForm({ test_type: '', results: '' });
            alert('Lab request successfully created!');
        } catch (error) {
            console.error('Failed to save lab request:', error);
        }
    };

    const handleRxSubmit = async (e) => {
        e.preventDefault();
        if (!selectedQueue) return;

        try {
            await api.post('/prescriptions', {
                queue_id: selectedQueue.queue_id,
                ...rxForm,
            });
            setRxForm({ medication_details: '', instructions: '' });
            alert('Prescription successfully saved!');
        } catch (error) {
            console.error('Failed to save prescription:', error);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-maroon mb-4">Doctor Consultation & Examination</h1>

            <div className="bg-white shadow rounded-lg p-4 mb-6">
                <h2 className="text-lg font-semibold mb-3">Active Patients Waiting</h2>
                <div className="space-y-2">
                    {queues.map((q) => (
                        <div key={q.queue_id} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
                            <div>
                                <span className="font-bold text-maroon">#{q.queue_number}</span> — {q.patient?.firstname} {q.patient?.lastname} ({q.visit_type})
                            </div>
                            <button
                                onClick={() => setSelectedQueue(q)}
                                className="px-3 py-1 bg-maroon text-white text-xs rounded hover:bg-maroon-dark"
                            >
                                Examine Patient
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {selectedQueue && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Examination: #{selectedQueue.queue_number} ({selectedQueue.patient?.firstname} {selectedQueue.patient?.lastname})</h2>
                            <button onClick={() => setSelectedQueue(null)} className="text-gray-500 font-bold">✕</button>
                        </div>

                        <div className="flex border-b mb-4">
                            <button
                                className={`py-2 px-4 font-semibold text-sm border-b-2 ${activeTab === 'lab' ? 'border-maroon text-maroon' : 'border-transparent text-gray-500'}`}
                                onClick={() => setActiveTab('lab')}
                            >
                                Lab Requests
                            </button>
                            <button
                                className={`py-2 px-4 font-semibold text-sm border-b-2 ${activeTab === 'rx' ? 'border-maroon text-maroon' : 'border-transparent text-gray-500'}`}
                                onClick={() => setActiveTab('rx')}
                            >
                                Prescriptions
                            </button>
                        </div>

                        {activeTab === 'lab' ? (
                            <form onSubmit={handleLabSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase mb-1">Test Type *</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border rounded"
                                        placeholder="e.g. Complete Blood Count (CBC)"
                                        value={labForm.test_type}
                                        onChange={(e) => setLabForm({ ...labForm, test_type: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase mb-1">Results / Notes</label>
                                    <textarea
                                        className="w-full p-2 border rounded"
                                        placeholder="Optional preliminary notes..."
                                        value={labForm.results}
                                        onChange={(e) => setLabForm({ ...labForm, results: e.target.value })}
                                    />
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-maroon text-white rounded text-sm font-bold"
                                    >
                                        Submit Lab Request
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleRxSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase mb-1">Medication Details *</label>
                                    <textarea
                                        className="w-full p-2 border rounded"
                                        placeholder="e.g. Amoxicillin 500mg capsules"
                                        value={rxForm.medication_details}
                                        onChange={(e) => setRxForm({ ...rxForm, medication_details: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase mb-1">Instructions</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border rounded"
                                        placeholder="e.g. Take 1 capsule 3 times a day after meals"
                                        value={rxForm.instructions}
                                        onChange={(e) => setRxForm({ ...rxForm, instructions: e.target.value })}
                                    />
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-maroon text-white rounded text-sm font-bold"
                                    >
                                        Save Prescription
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}