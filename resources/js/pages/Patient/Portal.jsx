import React, { useState, useEffect } from 'react';
import api from '@/services/api';

export default function PatientPortal() {
    const [queues, setQueues] = useState([]);
    const [myQueue, setMyQueue] = useState(null);
    const [visitType, setVisitType] = useState('Check-up');

    const fetchQueueStatus = async () => {
        try {
            const response = await api.get('/queues');
            setQueues(response.data);
        } catch (error) {
            console.error('Failed to fetch queue status:', error);
        }
    };

    useEffect(() => {
        fetchQueueStatus();
        const interval = setInterval(fetchQueueStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleJoinQueue = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/queues', {
                visit_type: visitType,
            });
            setMyQueue(response.data);
            fetchQueueStatus();
        } catch (error) {
            console.error('Failed to join queue:', error);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-maroon mb-4">Patient Portal & Live Queue</h1>
            
            {!myQueue ? (
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-3">Select Visit Purpose</h2>
                    <form onSubmit={handleJoinQueue} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase mb-1">Purpose of Visit</label>
                            <select 
                                className="w-full p-2 border rounded"
                                value={visitType}
                                onChange={(e) => setVisitType(e.target.value)}
                            >
                                <option value="Check-up">Check-up</option>
                                <option value="Medicine Request">Medicine Request</option>
                                <option value="Follow-up Consultation">Follow-up Consultation</option>
                                <option value="Medical Certificate Request">Medical Certificate Request</option>
                            </select>
                        </div>
                        <button type="submit" className="px-4 py-2 bg-maroon text-white rounded font-bold text-sm">
                            Join Clinic Queue
                        </button>
                    </form>
                </div>
            ) : (
                <div className="bg-white shadow rounded-lg p-6 mb-6 text-center">
                    <h2 className="text-lg font-semibold mb-2">Your Current Queue Status</h2>
                    <div className="text-5xl font-bold text-maroon my-4">#{myQueue.queue_number}</div>
                    <p className="text-gray-600">Status: <span className="font-bold text-blue-600">{myQueue.status || 'Waiting'}</span></p>
                </div>
            )}

            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-3">Live Queue Board</h2>
                <ul className="divide-y">
                    {queues.map((q) => (
                        <li key={q.queue_id} className="py-2 flex justify-between items-center">
                            <span className="font-bold">#{q.queue_number}</span>
                            <span className="text-gray-600">{q.visit_type}</span>
                            <span className="px-2 py-0.5 text-xs bg-gray-100 rounded">{q.status || 'Waiting'}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}