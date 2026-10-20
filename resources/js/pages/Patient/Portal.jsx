import { useState, useEffect, useCallback, useRef } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import axios from 'axios';

function nowTime() {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

const STATUS_MAP = {
    waiting: { lbl: 'Waiting for Triage', badge: 'b-yellow' },
    triaged: { lbl: 'Triaged — Awaiting Doctor', badge: 'b-blue' },
    'with-doctor': { lbl: 'With the Doctor', badge: 'b-blue' },
    examined: { lbl: 'Examined — Finalizing', badge: 'b-blue' },
    done: { lbl: 'Consultation Complete', badge: 'b-green' },
    cancelled: { lbl: 'Cancelled', badge: 'b-gray' },
};

const CONSULT_OPTIONS = [
    { type: 'checkup', icon: 'bi-clipboard2-pulse', label: 'Check-up', desc: 'General medical check-up and assessment' },
    { type: 'medicine', icon: 'bi-capsule', label: 'Medicine Request', desc: 'Request for prescribed medicine issuance' },
    { type: 'follow-up', icon: 'bi-arrow-repeat', label: 'Follow-up', desc: 'Follow-up for a prior consultation or treatment' },
];

// ─────────────────────────────────────────────────────────────
// Sidebar (ported from legacy index.html #page-patient .sidebar)
// ─────────────────────────────────────────────────────────────
function Sidebar() {
    const { auth } = usePage().props;
    const user = auth?.user;
    const displayName = user ? [user.firstname, user.lastname].filter(Boolean).join(' ') : 'Patient';
    const initial = (user?.firstname || 'P').charAt(0).toUpperCase();

    return (
        <div className="sidebar">
            <div className="sidebar-brand">
                <img src="/assets/img/logo.png" className="logo-img" alt="USeP" />
                <div className="sidebar-brand-text">
                    <div className="sh-title">USeP Clinic</div>
                    <div className="sh-sub">Patient Portal</div>
                </div>
            </div>
            <div className="sidebar-nav">
                <div className="sidebar-section">Visit</div>
                <a className="active" onClick={(e) => e.preventDefault()}>
                    <i className="bi bi-hospital nav-icon"></i> Visit Purpose Selection
                </a>
            </div>
            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-avatar">{initial}</div>
                    <div>
                        <div className="sidebar-user-name">{displayName}</div>
                        <div className="sidebar-user-role">Patient Portal</div>
                    </div>
                </div>
                <button className="btn btn-outline btn-sm w100" onClick={() => router.post('/logout')}>
                    <i className="bi bi-box-arrow-left"></i> Sign Out
                </button>
            </div>
        </div>
    );
}

function Steps({ current }) {
    const steps = ['Select Purpose', 'Details / Queue', 'Queue Status'];
    return (
        <div className="steps" style={{ maxWidth: 800 }}>
            {steps.map((s, i) => (
                <div key={s} className={`step ${i < current ? 'done' : i === current ? 'active' : ''}`}>
                    {i + 1} · {s}
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Step 1: Purpose selection
// ─────────────────────────────────────────────────────────────
function PurposeSelect({ onPick }) {
    return (
        <>
            <div className="page-header">
                <h1>Visit Purpose Selection</h1>
                <p>Choose the type of service you need for your visit today.</p>
            </div>
            <Steps current={0} />
            <div style={{ maxWidth: 800, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="purpose-card" onClick={() => onPick('consult')}>
                    <div
                        style={{
                            width: 52,
                            height: 52,
                            borderRadius: 12,
                            background: '#f5e0e0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.6rem',
                            marginBottom: 14,
                            color: 'var(--maroon)',
                        }}
                    >
                        <i className="bi bi-heart-pulse"></i>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 5, color: 'var(--maroon)' }}>Consultation</div>
                    <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        Visit the clinic for a check-up, medicine request, or follow-up consultation.
                    </div>
                </div>
                <div className="purpose-card" onClick={() => onPick('medcert')}>
                    <div
                        style={{
                            width: 52,
                            height: 52,
                            borderRadius: 12,
                            background: '#e8edf6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.6rem',
                            marginBottom: 14,
                            color: 'var(--blue)',
                        }}
                    >
                        <i className="bi bi-file-earmark-medical"></i>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 5, color: 'var(--blue)' }}>Medical Certificate Request</div>
                    <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        Request an official medical certificate. Fill out a form and join the queue.
                    </div>
                </div>
            </div>
        </>
    );
}

// ─────────────────────────────────────────────────────────────
// Step 2a: Consultation sub-type
// ─────────────────────────────────────────────────────────────
function ConsultSubOptions({ onPick, onBack }) {
    return (
        <>
            <div className="page-header">
                <h1>Consultation — Select Type</h1>
                <p>Choose the specific type of consultation for your visit.</p>
            </div>
            <Steps current={1} />
            <div style={{ maxWidth: 800, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                {CONSULT_OPTIONS.map((o) => (
                    <div
                        key={o.type}
                        className="purpose-card"
                        style={{ padding: '24px 18px', textAlign: 'center' }}
                        onClick={() => onPick(o.type, o.label)}
                    >
                        <div style={{ fontSize: '2.2rem', marginBottom: 12, color: 'var(--maroon)' }}>
                            <i className={`bi ${o.icon}`}></i>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--maroon)', marginBottom: 6 }}>{o.label}</div>
                        <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{o.desc}</div>
                    </div>
                ))}
            </div>
            <div style={{ maxWidth: 800, marginTop: 16 }}>
                <button className="btn btn-outline btn-sm" onClick={onBack}>
                    <i className="bi bi-arrow-left"></i> Back
                </button>
            </div>
        </>
    );
}

// ─────────────────────────────────────────────────────────────
// Step 2b: Confirm queue entry (consultation path)
// ─────────────────────────────────────────────────────────────
function ConfirmQueue({ visitType, visitLabel, onBack, onConfirm, submitting }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const icons = { checkup: 'bi-clipboard2-pulse', medicine: 'bi-capsule', 'follow-up': 'bi-arrow-repeat' };

    return (
        <>
            <div className="page-header">
                <h1>Confirm Queue Entry</h1>
            </div>
            <Steps current={1} />
            <div className="card" style={{ maxWidth: 800 }}>
                <div className="card-title">Visit Details</div>
                <div
                    style={{
                        background: '#fdf5f5',
                        border: '1.5px solid #e8c0c0',
                        borderRadius: 10,
                        padding: '22px 24px',
                        marginBottom: 18,
                        display: 'flex',
                        gap: 18,
                        alignItems: 'center',
                    }}
                >
                    <div style={{ fontSize: '2.8rem', color: 'var(--maroon)' }}>
                        <i className={`bi ${icons[visitType] || 'bi-hospital'}`}></i>
                    </div>
                    <div>
                        <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>
                            Consultation
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--maroon)' }}>{visitLabel}</div>
                        <div style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            {user ? `${user.firstname} ${user.lastname}` : 'Patient'} · ID: {user?.clinic_id}
                        </div>
                    </div>
                </div>
                <div className="alert alert-info text-sm">
                    <i className="bi bi-info-circle"></i> After confirming, please proceed to the clinic waiting area. The nurse will call your
                    queue number.
                </div>
                <div className="flex gap10 mt16">
                    <button className="btn btn-outline" onClick={onBack}>
                        <i className="bi bi-arrow-left"></i> Back
                    </button>
                    <button className="btn btn-primary w100" disabled={submitting} onClick={onConfirm}>
                        {submitting ? 'Joining…' : 'Confirm & Enter Queue'}
                    </button>
                </div>
            </div>
        </>
    );
}

// ─────────────────────────────────────────────────────────────
// Step 2c: Medical certificate request form
// ─────────────────────────────────────────────────────────────
function MedCertForm({ onBack, onSubmit, submitting }) {
    const [reason, setReason] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState(null);

    function handleSubmit() {
        if (!reason.trim()) {
            setError('Please provide a reason for your request.');
            return;
        }
        onSubmit({ reason, dateFrom, dateTo, notes });
    }

    return (
        <>
            <div className="page-header">
                <h1>Medical Certificate Request</h1>
                <p>Fill out the form below, then join the queue.</p>
            </div>
            <Steps current={1} />
            <div className="card" style={{ maxWidth: 800 }}>
                <div className="card-title">Request Form</div>
                <div className="field">
                    <label>Reason / Purpose *</label>
                    <textarea placeholder="Briefly explain why you need this certificate..." value={reason} onChange={(e) => setReason(e.target.value)} />
                </div>
                <div className="field-row">
                    <div className="field">
                        <label>Date Needed From</label>
                        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    </div>
                    <div className="field">
                        <label>Date Needed To</label>
                        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    </div>
                </div>
                <div className="field">
                    <label>Additional Notes (optional)</label>
                    <input placeholder="Any additional information..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                {error && (
                    <p className="text-xs" style={{ color: '#C0392B' }}>
                        {error}
                    </p>
                )}
                <div className="flex gap10 mt16">
                    <button className="btn btn-outline" onClick={onBack}>
                        <i className="bi bi-arrow-left"></i> Back
                    </button>
                    <button className="btn btn-primary w100" disabled={submitting} onClick={handleSubmit}>
                        {submitting ? 'Submitting…' : 'Submit & Enter Queue'}
                    </button>
                </div>
            </div>
        </>
    );
}

// ─────────────────────────────────────────────────────────────
// Step 3: Queue ticket / live status
// ─────────────────────────────────────────────────────────────
function QueueTicket({ entry, onRefresh, onLeave, refreshing, countdown }) {
    const [allQueue, setAllQueue] = useState([]);

    const loadAll = useCallback(() => {
        axios
            .get('/api/v1/queues')
            .then((res) => setAllQueue(res.data))
            .catch(() => {});
    }, []);

    useEffect(() => {
        loadAll();
        if (entry.status === 'done') return;
        const id = setInterval(loadAll, 10000);
        return () => clearInterval(id);
    }, [loadAll, entry.status]);

    const s = STATUS_MAP[entry.status] || { lbl: entry.status, badge: 'b-gray' };
    const active = allQueue.filter((q) => !['done', 'cancelled'].includes(q.status));
    const aheadCount = active.filter((q) => (q.queue_number || 0) < (entry.queue_number || 0)).length;
    const currentlyServing = active.length ? Math.min(...active.map((q) => q.queue_number || Infinity)) : '--';
    const triage = entry.triage;

    return (
        <>
            <div className="page-header">
                <h1>Queue Status</h1>
                <p>Your current position in the clinic queue.</p>
            </div>
            <Steps current={entry.status === 'done' ? 3 : 2} />
            <div className="card" style={{ maxWidth: 800, padding: '36px 32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
                    <div>
                        <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
                            Queue Number
                        </div>
                        <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: '5rem', color: 'var(--maroon)', lineHeight: 1 }}>
                            {entry.queue_number}
                        </div>
                        <div className="text-sm text-muted mt8">
                            Time In: <b>{entry.time_in}</b>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ margin: '14px 0 12px' }}>
                            <span className={`badge ${s.badge}`} style={{ fontSize: '.85rem', padding: '8px 18px' }}>
                                {s.lbl}
                            </span>
                        </div>
                        <div
                            style={{
                                display: 'inline-block',
                                padding: '6px 16px',
                                borderRadius: 20,
                                fontSize: '.8rem',
                                fontWeight: 600,
                                background: '#f5e0e0',
                                color: 'var(--maroon)',
                            }}
                        >
                            {entry.visit_label}
                        </div>
                        <br />
                        <button className="btn btn-outline btn-sm mt16" disabled={refreshing} onClick={onRefresh}>
                            <i className="bi bi-arrow-clockwise"></i> {refreshing ? 'Refreshing…' : 'Refresh Status'}
                        </button>
                    </div>
                </div>

                {entry.status !== 'done' && (
                    <div
                        style={{
                            marginTop: 24,
                            background: '#fdf5f5',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '18px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                        }}
                    >
                        <div style={{ fontSize: '2.5rem', color: 'var(--maroon)' }}>
                            <i className="bi bi-people-fill"></i>
                        </div>
                        <div>
                            <div style={{ fontSize: '.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                                Live Queue Update
                            </div>
                            {aheadCount === 0 ? (
                                <div style={{ fontSize: '1.1rem', color: 'var(--green)', fontWeight: 700, marginTop: 4 }}>It is almost your turn!</div>
                            ) : (
                                <div style={{ fontSize: '1.1rem', color: 'var(--maroon)', fontWeight: 700, marginTop: 4 }}>
                                    There are {aheadCount} patient(s) ahead of you.
                                </div>
                            )}
                            <div style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginTop: 2 }}>Currently Serving: Ticket #{currentlyServing}</div>
                        </div>
                    </div>
                )}
            </div>

            {entry.status === 'done' && (
                <>
                    <div className="alert alert-success" style={{ maxWidth: 800 }}>
                        <i className="bi bi-check-circle-fill"></i> Your consultation is complete. Please collect prescriptions or documents at the
                        nurse's station. Thank you!
                    </div>
                    <div style={{ maxWidth: 800, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                        <button className="btn btn-primary" onClick={onLeave}>
                            <i className="bi bi-check2"></i> Done
                        </button>
                        {countdown !== null && countdown > 0 && (
                            <span className="text-sm text-muted">Returning to the start in {countdown}s…</span>
                        )}
                    </div>
                </>
            )}
            {entry.status === 'with-doctor' && (
                <div className="alert alert-info" style={{ maxWidth: 800 }}>
                    <i className="bi bi-person-badge"></i> The doctor is reviewing your records. Please remain nearby.
                </div>
            )}

            {triage?.blood_pressure && (
                <div className="card card-sm" style={{ maxWidth: 800, marginTop: 0 }}>
                    <div className="fw6 text-sm mb8" style={{ color: 'var(--maroon)' }}>
                        <i className="bi bi-activity"></i> Your Recorded Vital Signs
                    </div>
                    <div className="grid3">
                        {[
                            ['BP', triage.blood_pressure],
                            ['HR', triage.heart_rate ? `${triage.heart_rate} bpm` : ''],
                            ['Temp', triage.temperature ? `${triage.temperature}°C` : ''],
                            ['RR', triage.resp_rate || ''],
                            ['O₂', triage.o2_saturation ? `${triage.o2_saturation}%` : ''],
                            ['Weight', triage.weight ? `${triage.weight} kg` : ''],
                        ].map(([l, v]) => (
                            <div key={l} style={{ background: '#f9f8f6', borderRadius: 7, padding: '12px 14px' }}>
                                <div className="text-xs text-muted">{l}</div>
                                <div className="fw6 text-sm mt4">{v || '—'}</div>
                            </div>
                        ))}
                    </div>
                    <div className="text-sm mt12">
                        <span className="text-muted">Chief Complaint:</span> {triage.chief_complaint || '—'}
                    </div>
                </div>
            )}

            <div className="card" style={{ maxWidth: 800, marginTop: 20 }}>
                <div className="card-title" style={{ fontSize: '1.05rem' }}>
                    Current Clinic Queue
                </div>
                <div className="text-sm text-muted mb8">See all patients currently in line.</div>
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Queue #</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {active.map((q) => {
                                const isMe = q.queue_id === entry.queue_id;
                                const st = STATUS_MAP[q.status] || { lbl: q.status, badge: 'b-gray' };
                                return (
                                    <tr key={q.queue_id} style={isMe ? { background: '#fdf5f5' } : undefined}>
                                        <td style={isMe ? { fontWeight: 'bold', color: 'var(--maroon)' } : undefined}>
                                            <span className="num-badge" style={{ background: isMe ? 'var(--maroon)' : '#888' }}>
                                                {q.queue_number}
                                            </span>{' '}
                                            {isMe ? ' (You)' : ''}
                                        </td>
                                        <td>
                                            <span className={`badge ${st.badge}`}>{st.lbl}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────
export default function PatientPortal() {
    const [loading, setLoading] = useState(true);
    const [myEntry, setMyEntry] = useState(null);
    const [step, setStep] = useState('purpose'); // purpose | consult-type | confirm | medcert
    const [pendingVisit, setPendingVisit] = useState(null); // { type, label }
    const [submitting, setSubmitting] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [toastMsg, setToastMsg] = useState(null);
    const [countdown, setCountdown] = useState(null);
    const entryRef = useRef(null);

    useEffect(() => {
        entryRef.current = myEntry;
    }, [myEntry]);

    function showToast(msg, type = 'success') {
        setToastMsg({ msg, type });
        setTimeout(() => setToastMsg(null), 3000);
    }

    const loadMyQueue = useCallback(async () => {
        try {
            const res = await axios.get('/api/v1/queues', { params: { mine: 1 } });
            const byNewest = (a, b) => (b.queue_id || 0) - (a.queue_id || 0);
            const active = res.data.filter((q) => !['done', 'cancelled'].includes(q.status)).sort(byNewest)[0];
            const prev = entryRef.current;

            if (active) {
                setMyEntry(active);
            } else if (prev) {
                // The visit we were showing is no longer active.
                const updated = res.data.find((q) => q.queue_id === prev.queue_id);
                if (updated?.status === 'done') {
                    setMyEntry(updated); // show the short completion screen, then auto-leave
                } else {
                    if (updated?.status === 'cancelled') showToast('Your queue entry was cancelled by the clinic.', 'info');
                    setMyEntry(null);
                    setStep('purpose');
                }
            } else {
                // Fresh page load: finished visits are history, not a ticket to keep showing.
                setMyEntry(null);
            }
        } catch (e) {
            showToast('Failed to load your queue status.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMyQueue();
    }, [loadMyQueue]);

    // Real-time status: poll while the visit is in progress.
    useEffect(() => {
        if (!myEntry || myEntry.status === 'done') return;
        const id = setInterval(loadMyQueue, 10000);
        return () => clearInterval(id);
    }, [myEntry?.queue_id, myEntry?.status, loadMyQueue]);

    // When the visit completes, show the result briefly and then leave automatically.
    useEffect(() => {
        if (myEntry?.status !== 'done') {
            setCountdown(null);
            return;
        }
        setCountdown(15);
        const id = setInterval(() => setCountdown((c) => (c === null ? c : c - 1)), 1000);
        return () => clearInterval(id);
    }, [myEntry?.queue_id, myEntry?.status]);

    useEffect(() => {
        if (countdown !== null && countdown <= 0) handleLeave();
    }, [countdown]);

    async function joinQueue(visit_type, visit_label) {
        setSubmitting(true);
        try {
            const res = await axios.post('/api/v1/queues', { visit_type, visit_label });
            setMyEntry(res.data);
            showToast('You have joined the queue. Please wait in the clinic area.');
        } catch (e) {
            showToast('Failed to join queue. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    }

    async function submitMedCert({ reason, dateFrom, dateTo, notes }) {
        setSubmitting(true);
        try {
            const res = await axios.post('/api/v1/queues', { visit_type: 'medcert', visit_label: 'Med Cert Request' });
            setMyEntry(res.data);
            await axios.post('/api/v1/medical-certificates', {
                queue_id: res.data.queue_id,
                diagnosis_reason: reason,
                date_from: dateFrom || null,
                date_to: dateTo || null,
                additional_notes: notes || null,
            });
            showToast('Request submitted. You have joined the queue.');
        } catch (e) {
            showToast('Failed to submit request. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleRefresh() {
        setRefreshing(true);
        await loadMyQueue();
        setRefreshing(false);
        showToast('Live queue status updated!', 'info');
    }

    function handleLeave() {
        setMyEntry(null);
        setPendingVisit(null);
        setStep('purpose');
        setCountdown(null);
    }

    return (
        <>
            <Head title="Patient Portal">
                <link rel="stylesheet" href="/assets/css/main.css" />
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
            </Head>

            <div className="layout">
                <Sidebar />
                <div className="main-content">
                    {loading && <p className="text-muted">Loading…</p>}

                    {!loading && myEntry && (
                        <QueueTicket entry={myEntry} onRefresh={handleRefresh} onLeave={handleLeave} refreshing={refreshing} countdown={countdown} />
                    )}

                    {!loading && !myEntry && step === 'purpose' && (
                        <PurposeSelect onPick={(t) => setStep(t === 'consult' ? 'consult-type' : 'medcert')} />
                    )}

                    {!loading && !myEntry && step === 'consult-type' && (
                        <ConsultSubOptions
                            onBack={() => setStep('purpose')}
                            onPick={(type, label) => {
                                setPendingVisit({ type, label });
                                setStep('confirm');
                            }}
                        />
                    )}

                    {!loading && !myEntry && step === 'confirm' && pendingVisit && (
                        <ConfirmQueue
                            visitType={pendingVisit.type}
                            visitLabel={pendingVisit.label}
                            submitting={submitting}
                            onBack={() => setStep('consult-type')}
                            onConfirm={() => joinQueue(pendingVisit.type, pendingVisit.label)}
                        />
                    )}

                    {!loading && !myEntry && step === 'medcert' && (
                        <MedCertForm submitting={submitting} onBack={() => setStep('purpose')} onSubmit={submitMedCert} />
                    )}
                </div>
            </div>

            {toastMsg && <div className={`toast toast-${toastMsg.type}`}>{toastMsg.msg}</div>}
        </>
    );
}
