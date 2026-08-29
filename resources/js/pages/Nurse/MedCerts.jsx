import React, { useState, useEffect } from 'react';
import api from '@/services/api';

export default function MedicalCertificates() {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [certForm, setCertForm] = useState({
        queue_id: '',
        diagnosis: '',
        fit_to_return_date: '',
        remarks: '',
    });

    const fetchCertificates = async () => {
        try {
            const response = await api.get('/medical-certificates');
            setCertificates(response.data);
        } catch (error) {
            console.error('Failed to fetch medical certificates:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCertificates();
    }, []);

    const handleCreateCertificate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/medical-certificates', {
                ...certForm,
                queue_id: parseInt(certForm.queue_id),
            });
            setCertForm({ queue_id: '', diagnosis: '', fit_to_return_date: '', remarks: '' });
            setShowCreateModal(false);
            fetchCertificates();
        } catch (error) {
            console.error('Failed to create medical certificate:', error);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-maroon">Medical Certificate Management</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-maroon text-white rounded font-bold text-sm hover:bg-maroon-dark"
                >
                    Issue New Certificate
                </button>
            </div>

            {loading ? (
                <p>Loading certificates...</p>
            ) : (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-b">
                                <th className="p-3">ID</th>
                                <th className="p-3">Patient Name</th>
                                <th className="p-3">Diagnosis</th>
                                <th className="p-3">Fit to Return Date</th>
                                <th className="p-3">Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {certificates.map((cert) => (
                                <tr key={cert.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3 font-bold text-maroon">#{cert.id}</td>
                                    <td className="p-3">{cert.queue?.patient?.firstname} {cert.queue?.patient?.lastname}</td>
                                    <td className="p-3">{cert.diagnosis}</td>
                                    <td className="p-3">{cert.fit_to_return_date || '—'}</td>
                                    <td className="p-3">{cert.remarks || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 max-w-lg w-full">
                        <h2 className="text-xl font-bold mb-4">Issue Medical Certificate</h2>
                        <form onSubmit={handleCreateCertificate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1">Queue ID *</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded"
                                    placeholder="Enter associated Queue ID"
                                    value={certForm.queue_id}
                                    onChange={(e) => setCertForm({ ...certForm, queue_id: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1">Diagnosis *</label>
                                <textarea
                                    className="w-full p-2 border rounded"
                                    placeholder="Medical diagnosis details..."
                                    value={certForm.diagnosis}
                                    onChange={(e) => setCertForm({ ...certForm, diagnosis: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1">Fit to Return Date</label>
                                <input
                                    type="date"
                                    className="w-full p-2 border rounded"
                                    value={certForm.fit_to_return_date}
                                    onChange={(e) => setCertForm({ ...certForm, fit_to_return_date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1">Remarks / Restrictions</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded"
                                    placeholder="e.g. Complete rest for 3 days"
                                    value={certForm.remarks}
                                    onChange={(e) => setCertForm({ ...certForm, remarks: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 border rounded text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-maroon text-white rounded text-sm font-bold"
                                >
                                    Save & Issue
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}