import React, { useState, useEffect } from 'react';
import api from '@/services/api';

export default function NurseQueue() {
    const [queues, setQueues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedQueue, setSelectedQueue] = useState(null);
    const [triageData, setTriageData] = useState({
        blood_pressure: '',
        heart_rate: '',
        temperature: '',
        respiratory_rate: '',
        oxygen_saturation: '',
        weight: '',
        height: '',
        chief_complaint: '',
        initial_notes: '',
    });

    const fetchQueues = async () => {
        try {
            const response = await api.get('/queues');
            setQueues(response.data);
        } catch (error) {
            console.error('Failed to fetch queues:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueues();
        const interval = setInterval(fetchQueues, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleTriageSubmit = async (e) => {
        e.preventDefault();
        if (!selectedQueue) return;

        try {
            await api.post('/triage', {
                queue_id: selectedQueue.queue_id,
                ...triageData,
            });
            setSelectedQueue(null);
            setTriageData({
                blood_pressure: '',
                heart_rate: '',
                temperature: '',
                respiratory_rate: '',
                oxygen_saturation: '',
                weight: '',
                height: '',
                chief_complaint: '',
                initial_notes: '',
            });
            fetchQueues();
        } catch (error) {
            console.error('Failed to submit triage:', error);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-maroon mb-4">Nurse Queue Monitoring & Triage</h1>
            {loading ? (
                <p>Loading queue...</p>
            ) : (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-b">
                                <th className="p-3">Queue #</th>
                                <th className="p-3">Patient Name</th>
                                <th className="p-3">Purpose</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {queues.map((q) => (
                                <tr key={q.queue_id} className="border-b hover:bg-gray-50">
                                    <td className="p-3 font-bold text-maroon">#{q.queue_number}</td>
                                    <td className="p-3">{q.patient?.firstname} {q.patient?.lastname}</td>
                                    <td className="p-3">{q.visit_type}</td>
                                    <td className="p-3">
                                        <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">
                                            {q.status || 'Waiting'}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <button 
                                            onClick={() => setSelectedQueue(q)}
                                            className="px-3 py-1 bg-maroon text-white text-xs rounded hover:bg-maroon-dark"
                                        >
                                            Assess / Triage
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {selectedQueue && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Triage Assessment: #{selectedQueue.queue_number}</h2>
                        <form onSubmit={handleTriageSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1">Blood Pressure *</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2 border rounded" 
                                    placeholder="120/80"
                                    value={triageData.blood_pressure}
                                    onChange={(e) => setTriageData({...triageData, blood_pressure: e.target.value})}
                                    required 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase mb-1">Heart Rate (bpm)</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-2 border rounded" 
                                        value={triageData.heart_rate}
                                        onChange={(e) => setTriageData({...triageData, heart_rate: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase mb-1">Temperature (°C)</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-2 border rounded" 
                                        value={triageData.temperature}
                                        onChange={(e) => setTriageData({...triageData, temperature: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1">Chief Complaint *</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2 border rounded" 
                                    value={triageData.chief_complaint}
                                    onChange={(e) => setTriageData({...triageData, chief_complaint: e.target.value})}
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1">Initial Assessment Notes</label>
                                <textarea 
                                    className="w-full p-2 border rounded" 
                                    value={triageData.initial_notes}
                                    onChange={(e) => setTriageData({...triageData, initial_notes: e.target.value})}
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
                                    Save Triage
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}