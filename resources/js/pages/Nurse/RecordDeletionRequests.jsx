import { ListSkeleton } from '@/components/data-skeletons';
import PaginatedItems from '../../components/paginated-items.jsx';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// ─────────────────────────────────────────────────────────────
// Record Management › Record Deletion (request form)
// Ported from legacy nurse.js recTab('deletion'): Select Patient, Reason,
// Authorization Code, "Submit Deletion Request".
//
// The legacy button only showed a toast and never deleted anything, so this
// version logs the request (POST /api/records/deletion-requests) and does NOT
// remove any patient data. The "Authorization Code" is the requester's own
// account password, checked by the server.
// ─────────────────────────────────────────────────────────────

const STATUS_BADGE = {
    pending: { cls: 'b-gold', label: 'Pending review' },
    approved: { cls: 'b-green', label: 'Approved' },
    rejected: { cls: 'b-gray', label: 'Rejected' },
};

function firstError(e, fallback) {
    const errs = e.response?.data?.errors;
    if (errs) {
        const first = Object.values(errs)[0];
        if (first?.[0]) return first[0];
    }
    return e.response?.data?.message || fallback;
}

export default function RecordDeletionRequests({ patients, showToast }) {
    const [filter, setFilter] = useState('');
    const [patientId, setPatientId] = useState('');
    const [reason, setReason] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [confirming, setConfirming] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = useCallback(async () => {
        try {
            const res = await axios.get('/api/records/deletion-requests', { timeout: 20000 });
            setRequests(res.data.requests);
        } catch (e) {
            if (showToast) showToast('Failed to load deletion requests.', 'error');
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const ql = filter.trim().toLowerCase();
    const options = patients.filter(
        (p) => !ql || String(p.name || '').toLowerCase().includes(ql) || String(p.patientId || '').toLowerCase().includes(ql),
    );
    const selected = patients.find((p) => String(p.id) === String(patientId));

    function review() {
        if (!patientId) return setError('Please select a patient.');
        if (reason.trim().length < 10) return setError('Please give a reason of at least 10 characters.');
        if (!password) return setError('Enter your password to authorize this request.');
        setError(null);
        setConfirming(true);
    }

    async function submit() {
        setSubmitting(true);
        try {
            await axios.post('/api/records/deletion-requests', {
                patient_id: patientId,
                reason: reason.trim(),
                password,
            });
            if (showToast) showToast('Deletion request submitted.', 'info');
            setPatientId('');
            setReason('');
            setPassword('');
            setFilter('');
            setConfirming(false);
            fetchRequests();
        } catch (e) {
            setConfirming(false);
            setError(firstError(e, 'Failed to submit the deletion request.'));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
            <div className="card">
                <div className="card-title">Record Deletion</div>
                <div className="alert alert-danger text-sm mb8">
                    <i className="bi bi-exclamation-triangle"></i> This submits a deletion request for review. The patient&apos;s record is not
                    removed by this form, and your password is required to authorize it.
                </div>

                {error && (
                    <div className="alert alert-danger text-sm mb8">
                        <i className="bi bi-x-circle"></i> {error}
                    </div>
                )}

                <div className="field">
                    <label>Select Patient</label>
                    <input placeholder="Type to filter by name or ID..." value={filter} onChange={(e) => setFilter(e.target.value)} />
                    <select value={patientId} onChange={(e) => setPatientId(e.target.value)} style={{ marginTop: 6 }}>
                        <option value="">— Select patient —</option>
                        {options.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name} ({p.patientId})
                            </option>
                        ))}
                    </select>
                </div>
                <div className="field">
                    <label>Reason</label>
                    <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} />
                </div>
                <div className="field">
                    <label>Authorization (your account password)</label>
                    <input
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <button className="btn btn-danger" onClick={review}>
                    <i className="bi bi-trash"></i> Submit Deletion Request
                </button>
            </div>

            <div className="card" style={{ marginTop: 16 }}>
                <div className="card-title">Deletion Requests</div>
                {loading && <ListSkeleton />}
                {!loading && !requests.length && (
                    <div className="empty-state">
                        <p>No deletion requests submitted yet.</p>
                    </div>
                )}
                {!!requests.length && (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Patient</th>
                                    <th>Reason</th>
                                    <th>Requested By</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {<PaginatedItems items={requests} tableColumns={5} label="requests">{(r) => {
                                    const b = STATUS_BADGE[r.status] || { cls: 'b-gray', label: r.status };
                                    return (
                                        <tr key={r.id}>
                                            <td className="text-xs" style={{ whiteSpace: 'nowrap' }}>
                                                {(r.created_at || '').slice(0, 16)}
                                            </td>
                                            <td>
                                                <div className="fw6">{r.patientName || '—'}</div>
                                                <div className="text-xs text-muted">{r.patientId}</div>
                                            </td>
                                            <td style={{ maxWidth: 260 }} className="text-sm">
                                                {r.reason}
                                            </td>
                                            <td className="text-xs">{r.requestedBy || '—'}</td>
                                            <td>
                                                <span className={`badge ${b.cls}`}>{b.label}</span>
                                            </td>
                                        </tr>
                                    );
                                }}</PaginatedItems>}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {confirming && (
                <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && !submitting && setConfirming(false)}>
                    <div className="modal">
                        <button className="modal-close" onClick={() => !submitting && setConfirming(false)}>
                            &times;
                        </button>
                        <div className="modal-title">Confirm deletion request</div>
                        <p className="text-sm" style={{ marginBottom: 8 }}>
                            You are about to request deletion of the record of{' '}
                            <b>
                                {selected?.name} ({selected?.patientId})
                            </b>
                            .
                        </p>
                        <div className="info-item">
                            <div className="info-lbl">Reason</div>
                            <div className="info-val">{reason.trim()}</div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-outline btn-sm" disabled={submitting} onClick={() => setConfirming(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-danger btn-sm" disabled={submitting} onClick={submit}>
                                {submitting ? 'Submitting…' : 'Yes, submit request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
