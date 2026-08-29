import React, { useState, useEffect } from 'react';
import api from '@/services/api';

export default function NurseDashboard() {
    const [queues, setQueues] = useState([]);
    const [loading, setLoading] = useState(true);

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
        const interval = setInterval(fetchQueues, 5000); // Poll every 5s for real-time updates
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Nurse Dashboard</h1>
            {loading ? (
                <p>Loading active queues...</p>
            ) : (
                <div className="space-y-2">
                    {queues.map((q) => (
                        <div key={q.queue_id} className="p-4 bg-white shadow rounded flex justify-between items-center">
                            <div>
                                <span className="font-bold text-lg text-maroon">#{q.queue_number}</span>
                                <span className="ml-4 text-gray-700">{q.visit_type}</span>
                            </div>
                            <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">
                                {q.status || 'Waiting'}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}