import { DetailSkeleton } from '@/components/data-skeletons';
import { certificateRequestError, requestError } from '@/lib/clinical-validation.mjs';
import PaginatedItems from '../../components/paginated-items.jsx';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import axios from 'axios';
import { Check, Clock, HeartPulse, RefreshCw } from 'lucide-react';

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

    return (
        <aside className="canvas-sidebar" id="patient-sidebar" aria-label="Patient navigation">
            <div className="canvas-brand"><img src="/assets/img/University of Southeastern Philippines Seal.png" width="42" height="42" alt="USeP" /><span>USeP Clinic<small>Patient portal</small></span></div>
            <div className="canvas-nav-area"><p className="canvas-nav-label">Workspace</p><nav><button type="button" className="active" aria-current="page" title="Patient portal" aria-label="Patient portal"><i className="bi bi-heart-pulse" aria-hidden="true" /><span>Patient portal</span></button></nav></div>
            <div className="canvas-user"><div><strong>{displayName}</strong><small>{user?.clinic_id || 'Patient portal'}</small></div><button type="button" title="Sign out" aria-label="Sign out" onClick={() => router.post('/logout')}><i className="bi bi-box-arrow-left" aria-hidden="true" /><span>Sign out</span></button></div>
        </aside>
    );
}

function Steps({ current }) {
    return <ol className="cq-progress" aria-label="Visit progress">{['Choose purpose', 'Confirm visit', 'Queue status'].map((label, i) => <li key={label} aria-current={i === current ? 'step' : undefined}><span>{i < current ? <Check size={13} /> : i + 1}</span>{label}</li>)}</ol>;
}

// ─────────────────────────────────────────────────────────────
// Step 1: Purpose selection
// ─────────────────────────────────────────────────────────────
function PurposeSelect({ onPick }) {
    const { auth } = usePage().props;
    return <>
        <div className="page-header"><h1>{auth?.user?.firstname ? `Welcome, ${auth.user.firstname}.` : 'Welcome to your patient portal.'}</h1><p>Your connection to the university clinic.</p></div>
        <div className="patient-services">
            <article className="patient-service"><span className="patient-service-icon"><i className="bi bi-heart-pulse" /></span><h2>Consultation</h2><p>Visit the clinic for a check-up, medicine request, or follow-up consultation.</p><button className="btn btn-primary" onClick={() => onPick('consult')}>Choose consultation <i className="bi bi-arrow-right" /></button></article>
            <article className="patient-service"><span className="patient-service-icon"><i className="bi bi-file-earmark-medical" /></span><h2>Medical certificate</h2><p>Complete a request form and join the clinic queue for your medical certificate.</p><button className="btn btn-outline" onClick={() => onPick('medcert')}>Request certificate <i className="bi bi-arrow-right" /></button></article>
        </div>
        <section className="patient-visit-guide"><h2>Your clinic visit</h2><ol>{[['Choose your purpose','Select the service you need.'],['Confirm your visit','Review your details before joining.'],['Follow your queue','Wait for your number to be called.']].map(([title,description],i)=><li key={title}><span>{i+1}</span><div><strong>{title}</strong><p>{description}</p></div></li>)}</ol></section>
    </>;
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
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onPick(o.type, o.label); } }}
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
        const validationError = certificateRequestError(reason, dateFrom, dateTo);
        if (validationError) {
            setError(validationError);
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
                    <textarea maxLength={255} placeholder="Briefly explain why you need this certificate..." value={reason} onChange={(e) => setReason(e.target.value)} />
                </div>
                <div className="field-row">
                    <div className="field">
                        <label>Date Needed From</label>
                        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    </div>
                    <div className="field">
                        <label>Date Needed To</label>
                        <input type="date" min={dateFrom || undefined} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    </div>
                </div>
                <div className="field">
                    <label>Additional Notes (optional)</label>
                    <input placeholder="Any additional information..." maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} />
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
        axios.get('/api/v1/queues', { timeout: 20000 })
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
    const triage = entry.triage;
    const done = entry.status === 'done';
    const message = entry.status === 'with-doctor' ? 'The doctor is reviewing your records. Please remain nearby.'
        : entry.status === 'examined' ? 'Please proceed to the nurse station to finish your visit.'
        : entry.status === 'triaged' ? 'Your assessment is recorded. Please wait for the doctor.'
        : 'Please remain in the waiting area until your number is called.';
    return <>
        <div className="page-header"><h1>{done ? 'Visit completed' : 'Your queue status'}</h1><p>Follow the status of your clinic visit.</p></div>
        <div className="cq-wrap">
            <Steps current={done ? 3 : 2} />
            <section className="cq-ticket">
                <div className="cq-ticket-header"><span className="cq-kicker">Your clinic visit</span><span className="cq-status" role="status"><span />{s.lbl}</span></div>
                <div className="cq-ticket-body">
                    <div><span className="cq-number-label">QUEUE NUMBER</span><strong className="cq-number">{entry.queue_number ?? '—'}</strong><div className="cq-details"><span>{entry.visit_label || 'Clinic visit'}</span><span>Time in · {entry.time_in || '—'}</span></div></div>
                    <div className="cq-guidance"><span className="cq-guidance-icon">{done ? <Check size={22} /> : <Clock size={22} />}</span><h2>{done ? 'Your visit is complete.' : entry.status === 'waiting' ? 'You’re in the queue.' : s.lbl}</h2><p>{done ? 'Please collect prescriptions or documents at the nurse station. Thank you for visiting.' : message}</p>
                        {done ? <button className="btn btn-primary" onClick={onLeave}>Done <Check size={14} /></button> : <button className="btn btn-outline" disabled={refreshing} onClick={onRefresh}><RefreshCw size={14} />{refreshing ? 'Refreshing…' : 'Refresh status'}</button>}
                    </div>
                </div>
                <footer className="cq-ticket-footer"><span><span className="cq-dot" />{done ? 'Visit completed' : 'Updates automatically'}</span><span>{done && countdown !== null && countdown > 0 ? `Returning to the start in ${countdown}s…` : 'USeP · University Clinic'}</span></footer>
            </section>
            {!done && <div className="cq-position"><span><strong>{aheadCount}</strong> patient(s) ahead</span><span>Follow the clinic staff’s instructions when called.</span></div>}
            {triage?.blood_pressure && <section className="cq-vitals"><div className="cq-section-heading"><div><h2><HeartPulse size={18} /> Your recorded vital signs</h2><p>From your nurse assessment</p></div></div><dl>{[
                ['Blood pressure', triage.blood_pressure, 'mmHg'],
                ['Heart rate', triage.heart_rate, 'bpm'],
                ['Temperature', triage.temperature, '°C'],
                ['Respiratory rate', triage.resp_rate, '/min'],
                ['Oxygen saturation', triage.o2_saturation, '%'],
                ['Weight', triage.weight, 'kg'],
            ].map(([name, value, unit]) => <div key={name}><dt>{name}</dt><dd>{value || '—'}{value && <small>{unit}</small>}</dd></div>)}</dl><p className="cq-complaint"><span>Chief complaint</span>{triage.chief_complaint || '—'}</p></section>}
            {!done && <section className="cq-queue"><div className="cq-section-heading"><div><h2>Current clinic queue</h2><p>Queue numbers only. Your entry is highlighted.</p></div><span className="cq-small-count">{active.length} active</span></div><div className="cq-table"><table><thead><tr><th>Queue number</th><th>Status</th></tr></thead><tbody>
                {active.length === 0 && <tr><td colSpan={2}>No active queue entries to display.</td></tr>}
                <PaginatedItems items={active} tableColumns={2} label="active">{q => {
                    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
                    const isMe = String(entry.date).slice(0, 10) === today && Number(q.queue_number) === Number(entry.queue_number);
                    const st = STATUS_MAP[q.status] || { lbl: q.status };
                    return <tr key={q.queue_number} className={isMe ? 'cq-your-row' : ''}><td><strong>{q.queue_number}</strong>{isMe && <span className="cq-you">You</span>}</td><td><span className="cq-table-status">{st.lbl}</span></td></tr>;
                }}</PaginatedItems>
            </tbody></table></div></section>}
        </div>
    </>;

}

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────
export default function PatientPortal() {
    const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 800);
    const [loading, setLoading] = useState(true);
    const [queueError, setQueueError] = useState('');
    const [queueLoaded, setQueueLoaded] = useState(false);
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
            const res = await axios.get('/api/v1/queues', { timeout: 20000, params: { mine: 1 } });
            setQueueError('');
            setQueueLoaded(true);
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
            setQueueError('Unable to load your queue status. Please refresh to try again.');
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
            showToast(requestError(e, 'Failed to join queue. Please try again.'), 'error');
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
            showToast(requestError(e, 'Failed to submit request. Please try again.'), 'error');
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

            <div className={`layout canvas-admin patient-centered ${collapsed ? 'canvas-collapsed' : ''}`}>
                <Sidebar />
                <div className="main-content">
                    <header className="canvas-topbar"><button type="button" className="btn btn-outline btn-sm" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed} aria-controls="patient-sidebar" onClick={() => setCollapsed(v => !v)}><i className="bi bi-layout-sidebar" aria-hidden="true" /></button><strong>Patient portal</strong><span>USeP · University Clinic</span></header>
                    <div className="patient-center-content">
                    {loading && <DetailSkeleton fields={2} label="Loading your clinic status" />}
                    {queueError && <p role="alert">{queueError}</p>}

                    {!loading && myEntry && (
                        <QueueTicket entry={myEntry} onRefresh={handleRefresh} onLeave={handleLeave} refreshing={refreshing} countdown={countdown} />
                    )}

                    {!loading && (!queueError || queueLoaded) && !myEntry && step === 'purpose' && (
                        <PurposeSelect onPick={(t) => setStep(t === 'consult' ? 'consult-type' : 'medcert')} />
                    )}

                    {!loading && (!queueError || queueLoaded) && !myEntry && step === 'consult-type' && (
                        <ConsultSubOptions
                            onBack={() => setStep('purpose')}
                            onPick={(type, label) => {
                                setPendingVisit({ type, label });
                                setStep('confirm');
                            }}
                        />
                    )}

                    {!loading && (!queueError || queueLoaded) && !myEntry && step === 'confirm' && pendingVisit && (
                        <ConfirmQueue
                            visitType={pendingVisit.type}
                            visitLabel={pendingVisit.label}
                            submitting={submitting}
                            onBack={() => setStep('consult-type')}
                            onConfirm={() => joinQueue(pendingVisit.type, pendingVisit.label)}
                        />
                    )}

                    {!loading && (!queueError || queueLoaded) && !myEntry && step === 'medcert' && (
                        <MedCertForm submitting={submitting} onBack={() => setStep('purpose')} onSubmit={submitMedCert} />
                    )}
                    <footer className="patient-footer">University Clinic Information Management System</footer>
                    </div>
                </div>
            </div>

            {toastMsg && <div className={`toast toast-${toastMsg.type}`}>{toastMsg.msg}</div>}
        </>
    );
}
