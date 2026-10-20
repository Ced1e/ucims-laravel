import { useState, useEffect, useCallback } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import axios from 'axios';

// ─────────────────────────────────────────────────────────────
// Display helpers (ported from legacy assets/js/shared.js + nurse.js)
// ─────────────────────────────────────────────────────────────
const VISIT_MAP = {
    checkup: { cls: 'b-maroon', icon: 'bi-clipboard2-pulse', label: 'Check-up' },
    medicine: { cls: 'b-gold', icon: 'bi-capsule', label: 'Medicine Req.' },
    'follow-up': { cls: 'b-blue', icon: 'bi-arrow-repeat', label: 'Follow-up' },
    medcert: { cls: 'b-green', icon: 'bi-file-earmark-medical', label: 'Med Cert' },
};

const STATUS_MAP = {
    waiting: { cls: 'b-yellow', icon: 'bi-hourglass-split', label: 'Waiting' },
    triaged: { cls: 'b-blue', icon: 'bi-clipboard-check', label: 'Triaged' },
    'with-doctor': { cls: 'b-blue', icon: 'bi-person-badge', label: 'With Doctor' },
    examined: { cls: 'b-green', icon: 'bi-check2-circle', label: 'Examined' },
    done: { cls: 'b-green', icon: 'bi-check-circle-fill', label: 'Done' },
    cancelled: { cls: 'b-gray', icon: 'bi-x-circle', label: 'Cancelled' },
};

function VisitBadge({ item }) {
    const v = VISIT_MAP[item.visit_type] || { cls: 'b-gray', icon: '', label: item.visit_label || item.visit_type || 'Visit' };
    return (
        <span className={`badge ${v.cls}`}>
            {v.icon && <i className={`bi ${v.icon}`}></i>} {v.label}
        </span>
    );
}

function StatusBadge({ status }) {
    const s = STATUS_MAP[status] || { cls: 'b-gray', icon: '', label: status || '—' };
    return (
        <span className={`badge ${s.cls}`}>
            {s.icon && <i className={`bi ${s.icon}`}></i>} {s.label}
        </span>
    );
}

function patientName(patient) {
    if (!patient) return 'Unknown Patient';
    return [patient.firstname, patient.lastname].filter(Boolean).join(' ') || 'Unknown Patient';
}

function nowTime() {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// ─────────────────────────────────────────────────────────────
// Sidebar (ported from legacy index.html #page-nurse .sidebar)
// ─────────────────────────────────────────────────────────────
function Sidebar({ section, onNavigate }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const displayName = user ? [user.firstname, user.lastname].filter(Boolean).join(' ') : 'Nurse';
    const initial = (user?.firstname || 'N').charAt(0).toUpperCase();

    const navItems = [
        { section: 'Queue', items: [{ icon: 'bi-people', label: 'Queue Monitoring', key: 'queue' }] },
        {
            section: 'Services',
            items: [
                { icon: 'bi-capsule', label: 'Medicine Issuance', key: 'medicine' },
                { icon: 'bi-file-earmark-text', label: 'MedCert Requests', key: 'medcert' },
            ],
        },
        {
            section: 'Records',
            items: [
                { icon: 'bi-folder2-open', label: 'Record Management', key: 'records' },
                { icon: 'bi-clipboard-pulse', label: 'Daily Patient Records', key: 'dpr' },
            ],
        },
        { section: 'Logs', items: [{ icon: 'bi-calendar3', label: 'Daily Patient Log', key: 'dpl' }] },
    ];

    return (
        <div className="sidebar">
            <div className="sidebar-brand">
                <img src="/assets/img/logo.png" className="logo-img" alt="USeP" />
                <div className="sidebar-brand-text">
                    <div className="sh-title">USeP Clinic</div>
                    <div className="sh-sub">Nurse Interface</div>
                </div>
            </div>
            <div className="sidebar-nav">
                {navItems.map((group) => (
                    <div key={group.section}>
                        <div className="sidebar-section">{group.section}</div>
                        {group.items.map((item) => (
                            <a
                                key={item.label}
                                className={item.key === section ? 'active' : ''}
                                style={item.soon ? { opacity: 0.55, cursor: 'default' } : undefined}
                                title={item.soon ? 'Coming soon' : undefined}
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (item.soon) return;
                                    onNavigate(item.key);
                                }}
                            >
                                <i className={`bi ${item.icon} nav-icon`}></i> {item.label}
                                {item.soon && <span style={{ fontSize: '0.7rem', marginLeft: 6, opacity: 0.8 }}>(soon)</span>}
                            </a>
                        ))}
                    </div>
                ))}
            </div>
            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-avatar" style={{ background: 'var(--blue)' }}>
                        {initial}
                    </div>
                    <div>
                        <div className="sidebar-user-name">{displayName}</div>
                        <div className="sidebar-user-role">Nurse Interface</div>
                    </div>
                </div>
                <button className="btn btn-outline btn-sm w100" onClick={() => router.post('/logout')}>
                    <i className="bi bi-box-arrow-left"></i> Sign Out
                </button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Queue item row (ported from legacy renderNurseQueue())
// ─────────────────────────────────────────────────────────────
function QueueItem({ item, onTriage, onViewTriage, onEndorse, onUndoEndorse, onComplete, onRecord, onCancel }) {
    const isMedcert = item.visit_type === 'medcert';

    return (
        <div className="queue-item">
            <div className="queue-num">#{item.queue_number ?? '—'}</div>
            <div className="queue-info">
                <div className="queue-name">{patientName(item.patient)}</div>
                <div className="flex gap6 mt4" style={{ flexWrap: 'wrap' }}>
                    <VisitBadge item={item} />
                    <StatusBadge status={item.status} />
                </div>
                <div className="queue-detail mt4">
                    Arrived: {item.time_in || '—'}
                    {item.triage?.chief_complaint ? ` · "${item.triage.chief_complaint}"` : ''}
                </div>
            </div>
            <div className="queue-actions">
                {!item.triaged && (
                    <button className={`btn ${isMedcert ? 'btn-outline' : 'btn-primary'} btn-sm`} onClick={onTriage}>
                        <i className="bi bi-heart-pulse"></i> {isMedcert ? 'Optional Triage' : 'Triage'}
                    </button>
                )}
                {item.triaged && (
                    <button className="btn btn-outline btn-sm" onClick={onViewTriage}>
                        <i className="bi bi-eye"></i> View Triage
                    </button>
                )}
                {item.triaged && !item.endorsed && (
                    <button className="btn btn-outline btn-sm" onClick={onEndorse}>
                        <i className="bi bi-arrow-right-circle"></i> Endorse
                    </button>
                )}
                {item.endorsed && item.status !== 'examined' && (
                    <button className="btn btn-outline btn-sm" style={{ color: 'var(--blue)' }} onClick={onUndoEndorse}>
                        <i className="bi bi-arrow-counterclockwise"></i> Undo Endorse
                    </button>
                )}
                {!item.endorsed && (item.triaged || isMedcert) && (
                    <button className="btn btn-primary btn-sm" onClick={onComplete}>
                        <i className="bi bi-check-circle"></i> Complete Visit
                    </button>
                )}
                {item.status === 'examined' && (
                    <button className="btn btn-primary btn-sm" onClick={onComplete}>
                        <i className="bi bi-check-circle"></i> Complete Checkout
                    </button>
                )}
                <button className="btn btn-outline btn-sm" onClick={onRecord}>
                    <i className="bi bi-file-medical"></i> Record
                </button>
                <button
                    className="btn btn-outline btn-sm"
                    style={{ color: 'var(--text-muted)' }}
                    title="Cancel & remove from queue"
                    onClick={onCancel}
                >
                    <i className="bi bi-x-circle"></i> Cancel
                </button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Triage modal — edit mode (vitals form) or view mode (read-only)
// ─────────────────────────────────────────────────────────────
function TriageModal({ mode: initialMode, item, onClose, onSaved }) {
    const [mode, setMode] = useState(initialMode);
    const [form, setForm] = useState({
        blood_pressure: '',
        heart_rate: '',
        temperature: '',
        resp_rate: '',
        o2_saturation: '',
        weight: '',
        height: '',
        chief_complaint: '',
        initial_notes: '',
    });
    const [existing, setExisting] = useState(null);
    const [loading, setLoading] = useState(initialMode === 'view');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!item.triaged) return;
        setLoading(true);
        axios
            .get(`/api/v1/triage/${item.queue_id}`)
            .then((res) => setExisting(res.data))
            .catch(() => setError('Could not load the existing triage record.'))
            .finally(() => setLoading(false));
    }, [item.queue_id, item.triaged]);

    async function handleSave() {
        if (!form.blood_pressure || !form.chief_complaint) {
            setError('Blood pressure and chief complaint are required.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await axios.post('/api/v1/triage', { queue_id: item.queue_id, ...form });
            onSaved();
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to save triage assessment.');
        } finally {
            setSaving(false);
        }
    }

    function startEdit() {
        const v = (k) => (existing && existing[k] != null ? String(existing[k]) : '');
        setForm({
            blood_pressure: v('blood_pressure'),
            heart_rate: v('heart_rate'),
            temperature: v('temperature'),
            resp_rate: v('resp_rate'),
            o2_saturation: v('o2_saturation'),
            weight: v('weight'),
            height: v('height'),
            chief_complaint: v('chief_complaint'),
            initial_notes: v('initial_notes'),
        });
        setError(null);
        setMode('edit');
    }

    const vitalRows = existing
        ? [
              ['BP', existing.blood_pressure],
              ['HR', existing.heart_rate ? `${existing.heart_rate} bpm` : ''],
              ['Temp', existing.temperature ? `${existing.temperature}°C` : ''],
              ['RR', existing.resp_rate || ''],
              ['O₂', existing.o2_saturation ? `${existing.o2_saturation}%` : ''],
              ['Wt / Ht', `${existing.weight || '—'}kg / ${existing.height || '—'}cm`],
          ]
        : [];

    return (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <button className="modal-close" onClick={onClose}>
                    &times;
                </button>
                <div className="modal-title">
                    {mode === 'edit' && existing ? 'Edit Triage Assessment' : 'Triage Assessment'} — {patientName(item.patient)}
                </div>

                {loading && <p className="text-muted">Loading…</p>}

                {mode === 'view' && !loading && existing && (
                    <>
                        <div className="grid3 mb8">
                            {vitalRows.map(([l, v]) => (
                                <div key={l} style={{ background: '#f9f8f6', padding: '10px 12px', borderRadius: 7 }}>
                                    <div className="text-xs text-muted">{l}</div>
                                    <div className="fw6 text-sm mt4">{v || '—'}</div>
                                </div>
                            ))}
                        </div>
                        <div className="info-item">
                            <div className="info-lbl">Chief Complaint</div>
                            <div className="info-val">{existing.chief_complaint || '—'}</div>
                        </div>
                        {existing.initial_notes && (
                            <div className="info-item mt8">
                                <div className="info-lbl">Initial Notes</div>
                                <div className="info-val">{existing.initial_notes}</div>
                            </div>
                        )}
                    </>
                )}

                {mode === 'view' && !loading && !existing && <p className="text-muted">No triage record found.</p>}

                {mode === 'edit' && (
                    <>
                        <div className="card-title" style={{ fontSize: '.88rem', marginBottom: 10 }}>
                            Vital Signs
                        </div>
                        <div className="field-row">
                            <div className="field">
                                <label>Blood Pressure (mmHg) *</label>
                                <input
                                    placeholder="e.g. 120/80"
                                    value={form.blood_pressure}
                                    onChange={(e) => setForm({ ...form, blood_pressure: e.target.value })}
                                />
                            </div>
                            <div className="field">
                                <label>Heart Rate (bpm)</label>
                                <input
                                    placeholder="e.g. 78"
                                    value={form.heart_rate}
                                    onChange={(e) => setForm({ ...form, heart_rate: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="field-row">
                            <div className="field">
                                <label>Temperature (°C)</label>
                                <input
                                    placeholder="e.g. 36.8"
                                    value={form.temperature}
                                    onChange={(e) => setForm({ ...form, temperature: e.target.value })}
                                />
                            </div>
                            <div className="field">
                                <label>Respiratory Rate</label>
                                <input
                                    placeholder="e.g. 18 br/min"
                                    value={form.resp_rate}
                                    onChange={(e) => setForm({ ...form, resp_rate: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="field-row3">
                            <div className="field">
                                <label>O₂ Saturation (%)</label>
                                <input
                                    placeholder="e.g. 98"
                                    value={form.o2_saturation}
                                    onChange={(e) => setForm({ ...form, o2_saturation: e.target.value })}
                                />
                            </div>
                            <div className="field">
                                <label>Weight (kg)</label>
                                <input
                                    placeholder="e.g. 60"
                                    value={form.weight}
                                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                                />
                            </div>
                            <div className="field">
                                <label>Height (cm)</label>
                                <input
                                    placeholder="e.g. 165"
                                    value={form.height}
                                    onChange={(e) => setForm({ ...form, height: e.target.value })}
                                />
                            </div>
                        </div>
                        <hr className="div" />
                        <div className="card-title" style={{ fontSize: '.88rem', marginBottom: 10 }}>
                            Chief Complaint &amp; Assessment
                        </div>
                        <div className="field">
                            <label>Chief Complaint *</label>
                            <input
                                placeholder="Patient's primary concern"
                                value={form.chief_complaint}
                                onChange={(e) => setForm({ ...form, chief_complaint: e.target.value })}
                            />
                        </div>
                        <div className="field">
                            <label>Initial Assessment Notes</label>
                            <textarea
                                placeholder="Nurse's initial observations..."
                                value={form.initial_notes}
                                onChange={(e) => setForm({ ...form, initial_notes: e.target.value })}
                            />
                        </div>
                    </>
                )}

                {error && (
                    <p className="text-xs" style={{ color: '#C0392B' }}>
                        {error}
                    </p>
                )}

                <div className="modal-footer">
                    <button
                        className="btn btn-outline btn-sm"
                        onClick={
                            mode === 'edit' && existing
                                ? () => {
                                      setError(null);
                                      setMode('view');
                                  }
                                : onClose
                        }
                    >
                        {mode === 'view' ? 'Close' : 'Cancel'}
                    </button>
                    {mode === 'view' && !loading && existing && (
                        <button className="btn btn-primary btn-sm" onClick={startEdit}>
                            <i className="bi bi-pencil"></i> Edit Triage Details
                        </button>
                    )}
                    {mode === 'edit' && (
                        <button className="btn btn-primary btn-sm" disabled={saving} onClick={handleSave}>
                            {saving ? 'Saving…' : existing ? 'Save Changes' : 'Save Triage'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Endorse-to-doctor modal
// ─────────────────────────────────────────────────────────────
function EndorseModal({ item, doctors, onClose, onConfirm }) {
    const [docId, setDocId] = useState('');
    const [error, setError] = useState(null);

    return (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <button className="modal-close" onClick={onClose}>
                    &times;
                </button>
                <div className="modal-title">Endorse {patientName(item.patient)} to Doctor</div>

                <div className="field">
                    <label>Select Doctor</label>
                    <select value={docId} onChange={(e) => setDocId(e.target.value)}>
                        <option value="">— Choose a doctor —</option>
                        {doctors.map((d) => (
                            <option key={d.user_id} value={d.user_id}>
                                Dr. {d.firstname} {d.lastname}
                            </option>
                        ))}
                    </select>
                </div>
                {doctors.length === 0 && (
                    <p className="text-xs text-muted mt8">No doctor accounts found yet. An admin needs to create one first.</p>
                )}
                {error && (
                    <p className="text-xs" style={{ color: '#C0392B' }}>
                        {error}
                    </p>
                )}

                <div className="modal-footer">
                    <button className="btn btn-outline btn-sm" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => (docId ? onConfirm(docId) : setError('Please select a doctor first.'))}
                    >
                        <i className="bi bi-arrow-right-circle"></i> Endorse
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// Record Management
// ─────────────────────────────────────────────────────────────
function uniqueVals(list, path) {
    const vals = list.map((p) => path.split('.').reduce((o, k) => o?.[k], p)).filter(Boolean);
    return [...new Set(vals)];
}

function RecordsSearch({ patients, loading, onView, onHistory }) {
    const [q, setQ] = useState('');
    const [college, setCollege] = useState('');
    const [year, setYear] = useState('');
    const [ptype, setPtype] = useState('');

    const colleges = uniqueVals(patients, 'college_dept');
    const years = uniqueVals(patients, 'year_level');
    const ptypes = uniqueVals(patients, 'patient_type');

    let filtered = patients;
    if (q.trim()) {
        const ql = q.toLowerCase();
        filtered = filtered.filter((p) => p.name.toLowerCase().includes(ql) || String(p.patientId).toLowerCase().includes(ql));
    }
    if (college) filtered = filtered.filter((p) => p.college_dept === college);
    if (year) filtered = filtered.filter((p) => p.year_level === year);
    if (ptype) filtered = filtered.filter((p) => p.patient_type === ptype);

    return (
        <>
            <div className="page-header">
                <h1>Record Management</h1>
                <p>Search, filter, and view permanent patient records.</p>
            </div>
            <div className="tabs" style={{ marginBottom: 16 }}>
                <button className="tab active">
                    <i className="bi bi-search"></i> Search &amp; Filter
                </button>
                <button className="tab" style={{ opacity: 0.55, cursor: 'default' }} title="Coming soon">
                    <i className="bi bi-trash"></i> Record Deletion (soon)
                </button>
            </div>
            <div className="card">
                <div className="card-title">Search &amp; Filter Patient Records</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                    <input
                        style={{ flex: 2, minWidth: 200 }}
                        placeholder="Search by name or ID..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                    <select style={{ flex: 1, minWidth: 140 }} value={college} onChange={(e) => setCollege(e.target.value)}>
                        <option value="">All Colleges</option>
                        {colleges.map((c) => (
                            <option key={c}>{c}</option>
                        ))}
                    </select>
                    <select style={{ flex: 1, minWidth: 120 }} value={year} onChange={(e) => setYear(e.target.value)}>
                        <option value="">All Year Levels</option>
                        {years.map((y) => (
                            <option key={y}>{y}</option>
                        ))}
                    </select>
                    <select style={{ flex: 1, minWidth: 120 }} value={ptype} onChange={(e) => setPtype(e.target.value)}>
                        <option value="">All Types</option>
                        {ptypes.map((t) => (
                            <option key={t}>{t}</option>
                        ))}
                    </select>
                </div>

                {loading && <p className="text-muted">Loading…</p>}
                {!loading && !filtered.length && (
                    <div className="empty-state">
                        <p>No records found.</p>
                    </div>
                )}
                {!!filtered.length && (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>College</th>
                                    <th>Yr</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((p) => (
                                    <tr key={p.id}>
                                        <td className="text-xs">{p.patientId}</td>
                                        <td className="fw6">{p.name}</td>
                                        <td className="text-xs">{p.college_dept || '—'}</td>
                                        <td>{p.year_level || '—'}</td>
                                        <td>
                                            <div className="flex gap6">
                                                <button className="btn btn-outline btn-sm" onClick={() => onView(p)}>
                                                    <i className="bi bi-file-medical"></i> View Record
                                                </button>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    style={{ background: 'var(--blue)' }}
                                                    onClick={() => onHistory(p)}
                                                >
                                                    <i className="bi bi-clock-history"></i> Visit History
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}

function ViewRecordModal({ patientRef, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('personal');

    useEffect(() => {
        axios
            .get(`/api/records/patients/${patientRef.id}`)
            .then((res) => setData(res.data.patient))
            .finally(() => setLoading(false));
    }, [patientRef.id]);

    const perm = data?.ppr_permanent;
    const demo = data?.ppr_demographic;
    const hr = data?.ppr_health_record;
    const q = data?.ppr_health_questionnaire;

    const Field = ({ label, value }) => (
        <div className="field mb0">
            <div className="text-xs text-muted">{label}</div>
            <div className="fw6 text-sm mt4">{value || '—'}</div>
        </div>
    );

    return (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal modal-lg">
                <button className="modal-close" onClick={onClose}>
                    &times;
                </button>
                <div className="profile-head" style={{ marginBottom: 16 }}>
                    <div className="profile-avatar">{patientName(data).charAt(0)}</div>
                    <div>
                        <div className="profile-name">{patientName(data)}</div>
                        <div className="profile-meta">
                            ID: {data?.clinic_id} · {perm?.patient_type || 'Patient'} · {perm?.college_dept || ''}
                        </div>
                    </div>
                </div>

                {loading && <p className="text-muted">Loading…</p>}

                {!loading && (
                    <>
                        <div className="tabs" style={{ marginBottom: 16 }}>
                            <button className={`tab ${tab === 'personal' ? 'active' : ''}`} onClick={() => setTab('personal')}>
                                1. Personal Info
                            </button>
                            <button className={`tab ${tab === 'health' ? 'active' : ''}`} onClick={() => setTab('health')}>
                                2. Health &amp; Vitals
                            </button>
                            <button className={`tab ${tab === 'systems' ? 'active' : ''}`} onClick={() => setTab('systems')}>
                                3. System Review
                            </button>
                            <button className={`tab ${tab === 'questionnaire' ? 'active' : ''}`} onClick={() => setTab('questionnaire')}>
                                4. Questionnaire
                            </button>
                        </div>

                        {tab === 'personal' && (
                            <div style={{ maxHeight: '50vh', overflowY: 'auto', paddingRight: 8 }}>
                                <div className="card-title" style={{ fontSize: '.95rem' }}>
                                    Name &amp; Designation
                                </div>
                                <div className="grid3 mb8">
                                    <Field label="First Name" value={data?.firstname} />
                                    <Field label="Middle Name" value={data?.middlename} />
                                    <Field label="Last Name" value={data?.lastname} />
                                </div>
                                <div className="grid3 mb8">
                                    <Field label="Patient Type" value={perm?.patient_type} />
                                    <Field label="College/Dept" value={perm?.college_dept} />
                                    <Field label="Year Level" value={perm?.year_level} />
                                </div>
                                <div className="card-title mt16" style={{ fontSize: '.95rem' }}>
                                    Demographics
                                </div>
                                <div className="grid3 mb8">
                                    <Field label="Date of Birth" value={demo?.dob} />
                                    <Field label="Sex" value={demo?.sex} />
                                    <Field label="Civil Status" value={demo?.civil_status} />
                                </div>
                                <div className="grid3 mb8">
                                    <Field label="Contact No." value={demo?.contact_no} />
                                    <Field label="Religion" value={demo?.religion} />
                                    <Field label="Nationality" value={demo?.nationality} />
                                </div>
                                <div className="grid2 mb8">
                                    <Field label="City Address" value={demo?.city_address} />
                                    <Field label="Provincial Address" value={demo?.prov_address} />
                                </div>
                                <div className="grid3">
                                    <Field label="Emergency Contact" value={demo?.em_name} />
                                    <Field label="Contact No." value={demo?.em_contact} />
                                    <Field label="Relationship" value={demo?.em_rel} />
                                </div>
                            </div>
                        )}

                        {tab === 'health' && (
                            <div style={{ maxHeight: '50vh', overflowY: 'auto', paddingRight: 8 }}>
                                <div className="card-title" style={{ fontSize: '.95rem' }}>
                                    Initial Vitals
                                </div>
                                <div className="grid3 mb8">
                                    <Field label="Height" value={hr?.height} />
                                    <Field label="Weight" value={hr?.weight} />
                                    <Field label="Blood Pressure" value={hr?.blood_pressure} />
                                </div>
                                <div className="grid3 mb8">
                                    <Field label="Pulse Rate" value={hr?.pulse_rate} />
                                    <Field label="Resp. Rate" value={hr?.resp_rate} />
                                    <Field label="Temperature" value={hr?.temp} />
                                </div>
                                <div className="grid2 mb8">
                                    <Field label="CR at Rest" value={hr?.cr_rest} />
                                    <Field label="CR after Activity" value={hr?.cr_activity} />
                                </div>
                                <div className="card-title mt16" style={{ fontSize: '.95rem' }}>
                                    History
                                </div>
                                <Field label="General Appearance" value={hr?.gen_appearance} />
                                <div className="grid2 mt12">
                                    <Field label="Infectious Diseases" value={hr?.infectious_diseases} />
                                    <Field label="Social History" value={hr?.social_hx} />
                                </div>
                                <div className="mt12">
                                    <Field label="Family History" value={hr?.family_hx} />
                                </div>
                            </div>
                        )}

                        {tab === 'systems' && (
                            <div style={{ maxHeight: '50vh', overflowY: 'auto', paddingRight: 8 }}>
                                <div className="card-title" style={{ fontSize: '.95rem' }}>
                                    Review of Systems
                                </div>
                                <div className="grid3 mb8">
                                    <Field label="Skin" value={hr?.sr_skin} />
                                    <Field label="Lymphatic" value={hr?.sr_lymph} />
                                    <Field label="Integument" value={hr?.sr_integument} />
                                    <Field label="Circulatory" value={hr?.sr_circulatory} />
                                    <Field label="Endocrine" value={hr?.sr_endocrine} />
                                    <Field label="Allergic" value={hr?.sr_allergic} />
                                    <Field label="HEENT" value={hr?.sr_heent} />
                                    <Field label="Mouth" value={hr?.sr_mouth} />
                                    <Field label="Breast" value={hr?.sr_breast} />
                                    <Field label="Respiratory" value={hr?.sr_respiratory} />
                                    <Field label="Cardiovascular" value={hr?.sr_cardiovascular} />
                                    <Field label="Gastrointestinal" value={hr?.sr_gastrointestinal} />
                                    <Field label="Genitourinary" value={hr?.sr_genitourinary} />
                                    <Field label="Psychiatric" value={hr?.sr_psychiatric} />
                                </div>
                            </div>
                        )}

                        {tab === 'questionnaire' && (
                            <div style={{ maxHeight: '50vh', overflowY: 'auto', paddingRight: 8 }}>
                                <div className="card-title" style={{ fontSize: '.95rem' }}>
                                    Health Questionnaire
                                </div>
                                <div className="grid3 mb8">
                                    <Field label="Hospitalized Before" value={q?.hosp_admitted} />
                                    <Field label="Illness" value={q?.hosp_illness} />
                                    <Field label="When" value={q?.hosp_when} />
                                </div>
                                <div className="grid3 mb8">
                                    <Field label="Had Surgery" value={q?.surgery} />
                                    <Field label="Surgery Type" value={q?.surg_type} />
                                    <Field label="When" value={q?.surg_when} />
                                </div>
                                <div className="grid2 mb8">
                                    <Field label="Infectious Diseases" value={q?.infectious_list} />
                                    <Field label="Fainting/Syncope" value={q?.syncope} />
                                </div>
                                {demo?.sex === 'Female' && (
                                    <>
                                        <div className="card-title mt16" style={{ fontSize: '.95rem' }}>
                                            Female Health History
                                        </div>
                                        <div className="grid3 mb8">
                                            <Field label="Age at Menarche" value={q?.female_menarche} />
                                            <Field label="Periods / Year" value={q?.female_periods_yr} />
                                            <Field label="Regular?" value={q?.female_regular} />
                                        </div>
                                        <div className="grid2">
                                            <Field label="If Irregular, Specify" value={q?.female_irregular_spec} />
                                            <Field label="Dysmenorrhea" value={q?.female_dysmenorrhea} />
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}

                <div className="modal-footer">
                    <button className="btn btn-outline btn-sm" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

function VisitHistoryModal({ patientRef, onClose }) {
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios
            .get(`/api/records/patients/${patientRef.id}/visits`)
            .then((res) => setVisits(res.data.visits))
            .finally(() => setLoading(false));
    }, [patientRef.id]);

    return (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal modal-lg">
                <button className="modal-close" onClick={onClose}>
                    &times;
                </button>
                <div className="profile-head" style={{ marginBottom: 16, background: 'linear-gradient(135deg, var(--blue), #2c5282)' }}>
                    <div className="profile-avatar">{(patientRef.name || 'P').charAt(0)}</div>
                    <div>
                        <div className="profile-name">{patientRef.name}</div>
                        <div className="profile-meta">
                            ID: {patientRef.patientId} · Clinic Visit History
                        </div>
                    </div>
                </div>
                <div className="card-title" style={{ fontSize: '1rem' }}>
                    <i className="bi bi-journal-medical"></i> Consultation &amp; Service History
                </div>

                {loading && <p className="text-muted">Loading…</p>}
                {!loading && !visits.length && (
                    <div className="empty-state" style={{ padding: 30 }}>
                        <div className="ei">
                            <i className="bi bi-calendar-x text-muted" style={{ opacity: 0.5 }}></i>
                        </div>
                        <p>No past visits recorded for this patient.</p>
                    </div>
                )}
                {!!visits.length && (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Time (In-Out)</th>
                                    <th>Purpose</th>
                                    <th>Physician</th>
                                    <th>Findings</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visits.map((v) => (
                                    <tr key={v.queue_id}>
                                        <td className="text-xs fw6" style={{ whiteSpace: 'nowrap' }}>
                                            {v.date}
                                        </td>
                                        <td className="text-xs" style={{ whiteSpace: 'nowrap' }}>
                                            {v.time_in} - {v.time_out || 'N/A'}
                                        </td>
                                        <td>
                                            <VisitBadge item={v} />
                                        </td>
                                        <td>
                                            {v.endorsement?.doctor ? (
                                                <div className="fw6" style={{ color: 'var(--blue)' }}>
                                                    Dr. {v.endorsement.doctor.firstname} {v.endorsement.doctor.lastname}
                                                </div>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td style={{ maxWidth: 220 }}>
                                            <div className="fw6 text-sm" style={{ color: 'var(--maroon)' }}>
                                                {v.endorsement?.diagnosis || v.triage?.chief_complaint || '—'}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="modal-footer">
                    <button className="btn btn-outline btn-sm" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Daily Patient Log & Daily Patient Records (share the same completed-visits data)
// ─────────────────────────────────────────────────────────────
function calcAge(dob) {
    if (!dob) return null;
    const d = new Date(dob);
    if (isNaN(d)) return null;
    const diff = Date.now() - d.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function filterVisits(visits, q) {
    if (!q.trim()) return visits;
    const ql = q.toLowerCase();
    return visits.filter(
        (v) =>
            patientName(v.patient).toLowerCase().includes(ql) ||
            String(v.patient?.clinic_id || '').toLowerCase().includes(ql) ||
            (v.date || '').includes(ql)
    );
}

function DailyPatientLog({ visits, loading }) {
    const [q, setQ] = useState('');
    const filtered = filterVisits(visits, q);

    return (
        <>
            <div className="page-header">
                <h1>Daily Patient Log</h1>
                <p>Comprehensive master list of all completed clinic visits.</p>
            </div>
            <div className="card">
                <div className="flex gap10 mb16 hide-print">
                    <input style={{ flex: 1 }} placeholder="Search by name, ID, or date..." value={q} onChange={(e) => setQ(e.target.value)} />
                    <button className="btn btn-outline" onClick={() => window.print()}>
                        <i className="bi bi-printer"></i> Print Log
                    </button>
                </div>
                {loading && <p className="text-muted">Loading…</p>}
                {!loading && !filtered.length && (
                    <div className="empty-state" style={{ padding: 40 }}>
                        <p className="text-muted">No records found.</p>
                    </div>
                )}
                {!!filtered.length && (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>ID</th>
                                    <th>Patient Name</th>
                                    <th>Age/Sex</th>
                                    <th>College/Yr</th>
                                    <th>Time In</th>
                                    <th>Time Out</th>
                                    <th>Purpose</th>
                                    <th>Attending Nurse</th>
                                    <th>Attending Physician</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((v) => {
                                    const age = calcAge(v.patient?.ppr_demographic?.dob);
                                    const sex = v.patient?.ppr_demographic?.sex;
                                    return (
                                        <tr key={v.queue_id}>
                                            <td className="text-xs fw6" style={{ whiteSpace: 'nowrap' }}>{v.date || '—'}</td>
                                            <td className="text-xs">{v.patient?.clinic_id || '—'}</td>
                                            <td className="fw6">{patientName(v.patient)}</td>
                                            <td className="text-xs">
                                                {age ?? '—'} / {sex ? sex.charAt(0) : '—'}
                                            </td>
                                            <td className="text-xs">
                                                {v.patient?.ppr_permanent?.college_dept || '—'} - {v.patient?.ppr_permanent?.year_level || '—'}
                                            </td>
                                            <td className="text-xs" style={{ whiteSpace: 'nowrap' }}>{v.time_in || '—'}</td>
                                            <td className="text-xs" style={{ whiteSpace: 'nowrap' }}>{v.time_out || '—'}</td>
                                            <td>
                                                <VisitBadge item={v} />
                                            </td>
                                            <td className="fw6" style={{ color: 'var(--maroon)' }}>
                                                {v.triage?.nurse ? patientName(v.triage.nurse) : 'Nurse'}
                                            </td>
                                            <td className="fw6" style={{ color: 'var(--blue)' }}>
                                                {v.endorsement?.doctor ? `Dr. ${patientName(v.endorsement.doctor)}` : 'N/A'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}

function DailyPatientRecords({ visits, loading, onViewDetails }) {
    const [q, setQ] = useState('');
    const filtered = filterVisits(visits, q);

    return (
        <>
            <div className="page-header">
                <h1>Daily Patient Records</h1>
                <p>Searchable archive of complete clinical visits and medical data.</p>
            </div>
            <div className="card">
                <div className="flex gap10 mb16 hide-print">
                    <input
                        style={{ flex: 1 }}
                        placeholder="Search by patient name, ID, or date (YYYY-MM-DD)..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                    <button className="btn btn-outline" onClick={() => window.print()}>
                        <i className="bi bi-printer"></i> Print Records
                    </button>
                </div>
                {loading && <p className="text-muted">Loading…</p>}
                {!loading && !filtered.length && (
                    <div className="empty-state" style={{ padding: 40 }}>
                        <p className="text-muted">No records found.</p>
                    </div>
                )}
                {!!filtered.length && (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>ID</th>
                                    <th>Patient Name</th>
                                    <th>Notes / Complaint</th>
                                    <th>Physician Diagnosis</th>
                                    <th>Treatment</th>
                                    <th className="hide-print">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((v) => {
                                    const rxList = (v.endorsement?.prescriptions || []).map((r) => r.drug_name).join(', ');
                                    return (
                                        <tr key={v.queue_id}>
                                            <td className="text-xs fw6" style={{ whiteSpace: 'nowrap' }}>{v.date || '—'}</td>
                                            <td className="text-xs">{v.patient?.clinic_id || '—'}</td>
                                            <td className="fw6">{patientName(v.patient)}</td>
                                            <td className="text-xs" style={{ maxWidth: 220 }}>
                                                <div>
                                                    <b>Complaint:</b> {v.triage?.chief_complaint || 'N/A'}
                                                </div>
                                                <div>
                                                    <b>Notes:</b> {v.triage?.initial_notes || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="text-xs fw6" style={{ maxWidth: 180, color: 'var(--blue)' }}>
                                                {v.endorsement?.diagnosis || 'N/A'}
                                            </td>
                                            <td className="text-xs fw6" style={{ maxWidth: 180, color: 'var(--green)' }}>
                                                {rxList || v.endorsement?.final_remarks || 'N/A'}
                                            </td>
                                            <td className="hide-print">
                                                <button className="btn btn-outline btn-sm" onClick={() => onViewDetails(v)}>
                                                    <i className="bi bi-file-text"></i> View
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}

function VisitDetailModal({ visit, onClose }) {
    const [tab, setTab] = useState('overview');
    const t = visit.triage;
    const e = visit.endorsement;
    const rx = e?.prescriptions || [];
    const meds = visit.medicine_issuances || [];
    const cert = visit.medical_certificate;

    return (
        <div className="modal-overlay open" onClick={(ev) => ev.target === ev.currentTarget && onClose()}>
            <div className="modal modal-lg">
                <button className="modal-close" onClick={onClose}>
                    &times;
                </button>
                <div className="profile-head" style={{ marginBottom: 16 }}>
                    <div className="profile-avatar">{patientName(visit.patient).charAt(0)}</div>
                    <div>
                        <div className="profile-name">{patientName(visit.patient)}</div>
                        <div className="profile-meta">
                            {visit.date} · #{visit.queue_number} · {VISIT_MAP[visit.visit_type]?.label || visit.visit_label}
                        </div>
                    </div>
                </div>
                <div className="tabs" style={{ marginBottom: 16 }}>
                    <button className={`tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>
                        Overview
                    </button>
                    <button className={`tab ${tab === 'clinical' ? 'active' : ''}`} onClick={() => setTab('clinical')}>
                        Full Clinical Details
                    </button>
                </div>

                {tab === 'overview' && (
                    <div style={{ maxHeight: '50vh', overflowY: 'auto', paddingRight: 8 }}>
                        <div className="info-grid mb8">
                            <div className="info-item">
                                <div className="info-lbl">Time In / Out</div>
                                <div className="info-val">
                                    {visit.time_in} - {visit.time_out || 'N/A'}
                                </div>
                            </div>
                            <div className="info-item">
                                <div className="info-lbl">Status</div>
                                <div className="info-val">
                                    <StatusBadge status={visit.status} />
                                </div>
                            </div>
                        </div>
                        <div className="info-item mb8">
                            <div className="info-lbl">Chief Complaint</div>
                            <div className="info-val">{t?.chief_complaint || '—'}</div>
                        </div>
                        <div className="info-item mb8">
                            <div className="info-lbl">Physician Diagnosis</div>
                            <div className="info-val">{e?.diagnosis || 'Not applicable to this visit'}</div>
                        </div>
                        <div className="info-item">
                            <div className="info-lbl">Final Remarks / Plan</div>
                            <div className="info-val">{e?.final_remarks || '—'}</div>
                        </div>
                    </div>
                )}

                {tab === 'clinical' && (
                    <div style={{ maxHeight: '50vh', overflowY: 'auto', paddingRight: 8 }}>
                        {t && (
                            <>
                                <div className="card-title" style={{ fontSize: '.9rem' }}>
                                    Triage Vitals
                                </div>
                                <div className="grid3 mb8">
                                    {[
                                        ['BP', t.blood_pressure],
                                        ['HR', t.heart_rate],
                                        ['Temp', t.temperature],
                                        ['RR', t.resp_rate],
                                        ['O₂', t.o2_saturation],
                                        ['Wt/Ht', `${t.weight || '—'} / ${t.height || '—'}`],
                                    ].map(([l, v]) => (
                                        <div key={l} style={{ background: '#f9f8f6', padding: '8px 12px', borderRadius: 7 }}>
                                            <div className="text-xs text-muted">{l}</div>
                                            <div className="fw6 text-sm mt4">{v || '—'}</div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        {!!rx.length && (
                            <>
                                <div className="card-title" style={{ fontSize: '.9rem' }}>
                                    Prescriptions
                                </div>
                                {rx.map((r) => (
                                    <div key={r.prescription_id} className="text-sm mb8">
                                        <b>{r.drug_name}</b> {r.dosage} — {r.frequency}, {r.duration} ({r.route})
                                    </div>
                                ))}
                            </>
                        )}
                        {!!meds.length && (
                            <>
                                <div className="card-title" style={{ fontSize: '.9rem' }}>
                                    Medicine Issued
                                </div>
                                {meds.map((m) => (
                                    <div key={m.issuance_id} className="text-sm mb8">
                                        <b>{m.medicine_name}</b> {m.dosage} — Qty {m.quantity}, by {m.nurse ? patientName(m.nurse) : '—'}
                                    </div>
                                ))}
                            </>
                        )}
                        {cert && (
                            <>
                                <div className="card-title" style={{ fontSize: '.9rem' }}>
                                    Medical Certificate
                                </div>
                                <div className="text-sm">
                                    {cert.is_released ? (
                                        <span className="badge b-green">Released</span>
                                    ) : (
                                        <span className="badge b-yellow">Pending</span>
                                    )}{' '}
                                    {cert.purpose || cert.diagnosis_reason}
                                </div>
                            </>
                        )}
                        {!t && !rx.length && !meds.length && !cert && <p className="text-muted text-sm">No additional clinical data recorded.</p>}
                    </div>
                )}

                <div className="modal-footer">
                    <button className="btn btn-outline btn-sm" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Medicine Issuance
// ─────────────────────────────────────────────────────────────
function MedicineList({ patients, loading, onManage, issuanceCounts }) {
    return (
        <>
            <div className="page-header">
                <h1>Medicine Issuance</h1>
                <p>Issue medicines and treatments to active patients.</p>
            </div>
            {loading && <p className="text-muted">Loading…</p>}
            {!loading && !patients.length && (
                <div className="empty-state">
                    <div className="ei">
                        <i className="bi bi-capsule text-muted" style={{ opacity: 0.5 }}></i>
                    </div>
                    <p>No active patients require services.</p>
                </div>
            )}
            {!!patients.length && (
                <div className="card">
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Patient</th>
                                    <th>Type</th>
                                    <th>Services Issued</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {patients.map((q) => (
                                    <tr key={q.queue_id}>
                                        <td>
                                            <span className="num-badge">{q.queue_number}</span>
                                        </td>
                                        <td>
                                            <div className="fw6">{patientName(q.patient)}</div>
                                        </td>
                                        <td>
                                            <VisitBadge item={q} />
                                        </td>
                                        <td>
                                            {issuanceCounts[q.queue_id] ? (
                                                <span className="badge b-green">{issuanceCounts[q.queue_id]} item(s) issued</span>
                                            ) : (
                                                <span className="badge b-gray">None</span>
                                            )}
                                        </td>
                                        <td>
                                            <button className="btn btn-primary btn-sm" onClick={() => onManage(q)}>
                                                <i className="bi bi-capsule"></i> Manage
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
    );
}

function ManageMedsModal({ item, onClose, showToast, onIssued }) {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [doctorRx, setDoctorRx] = useState([]);
    const [form, setForm] = useState({ medicine_name: '', dosage: '', quantity: '', frequency: '', duration: '', instructions: '' });
    const [saving, setSaving] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        axios
            .get('/api/v1/medicine-issuances', { params: { queue_id: item.queue_id } })
            .then((res) => setList(res.data))
            .finally(() => setLoading(false));
    }, [item.queue_id]);

    useEffect(() => {
        load();
        axios
            .get(`/api/v1/queues/${item.queue_id}`)
            .then((res) => setDoctorRx(res.data.endorsement?.prescriptions || []))
            .catch(() => {});
    }, [load, item.queue_id]);

    async function handleSave() {
        if (!form.medicine_name.trim() || !form.quantity.trim()) {
            showToast('Medicine name and quantity are required.', 'error');
            return;
        }
        setSaving(true);
        try {
            await axios.post('/api/v1/medicine-issuances', { queue_id: item.queue_id, ...form });
            showToast(`Medicine issued to ${patientName(item.patient)}.`);
            setForm({ medicine_name: '', dosage: '', quantity: '', frequency: '', duration: '', instructions: '' });
            load();
            onIssued();
        } catch (e) {
            showToast('Failed to log medicine issuance.', 'error');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <button className="modal-close" onClick={onClose}>
                    &times;
                </button>
                <div className="card-title" style={{ marginBottom: 4 }}>
                    <i className="bi bi-capsule"></i> Issue Medicine
                </div>
                <div className="text-sm text-muted mb16">
                    {patientName(item.patient)} · #{item.queue_number} · {item.visit_label}
                </div>

                {!!doctorRx.length && (
                    <div className="mb16" style={{ background: '#fdf5f5', borderRadius: 8, padding: '12px 14px' }}>
                        <div className="fw6 text-sm mb8" style={{ color: 'var(--maroon)' }}>
                            <i className="bi bi-prescription2"></i> Doctor's Prescription (reference)
                        </div>
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Medicine</th>
                                        <th>Dosage</th>
                                        <th>Frequency</th>
                                        <th>Duration</th>
                                        <th>Route</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {doctorRx.map((rx) => (
                                        <tr key={rx.prescription_id}>
                                            <td className="fw6">{rx.drug_name}</td>
                                            <td>{rx.dosage}</td>
                                            <td>{rx.frequency}</td>
                                            <td>{rx.duration}</td>
                                            <td>{rx.route}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="field-row">
                    <div className="field">
                        <label>Medicine Name *</label>
                        <input value={form.medicine_name} onChange={(e) => setForm({ ...form, medicine_name: e.target.value })} />
                    </div>
                    <div className="field">
                        <label>Dosage</label>
                        <input placeholder="e.g. 500mg" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} />
                    </div>
                </div>
                <div className="field-row3">
                    <div className="field">
                        <label>Quantity *</label>
                        <input placeholder="e.g. 10 tabs" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                    </div>
                    <div className="field">
                        <label>Frequency</label>
                        <input placeholder="e.g. 3x a day" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} />
                    </div>
                    <div className="field">
                        <label>Duration</label>
                        <input placeholder="e.g. 5 days" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
                    </div>
                </div>
                <div className="field">
                    <label>Instructions</label>
                    <input value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
                </div>
                <button className="btn btn-primary btn-sm mb8" disabled={saving} onClick={handleSave}>
                    {saving ? 'Saving…' : <><i className="bi bi-plus"></i> Add to Issued List</>}
                </button>

                <hr className="div" />
                <div className="text-xs fw6 text-muted mb4" style={{ textTransform: 'uppercase', letterSpacing: '.5px' }}>
                    Issued Medicines
                </div>
                {loading && <p className="text-muted text-sm">Loading…</p>}
                {!loading && !list.length && <p className="text-muted text-sm">No services issued yet.</p>}
                {list.map((s) => (
                    <div key={s.issuance_id} style={{ background: '#f9f8f6', padding: '8px 12px', borderRadius: 7, marginBottom: 5, fontSize: '.845rem' }}>
                        <i className="bi bi-capsule" style={{ color: 'var(--maroon)' }}></i> <b>{s.medicine_name}</b> {s.dosage} — {s.quantity}
                        <br />
                        <span className="text-muted">{s.instructions}</span> · by {s.nurse ? patientName(s.nurse) : '—'}
                    </div>
                ))}

                <div className="modal-footer">
                    <button className="btn btn-outline btn-sm" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// MedCert Requests — Nurse view (view-only; release is a Doctor action)
// ─────────────────────────────────────────────────────────────
function MedCertList({ certs, loading, onView }) {
    return (
        <>
            <div className="page-header">
                <h1>Medical Certificate Requests</h1>
                <p>View requested certificates. Release access is restricted to physicians.</p>
            </div>
            <div className="stats-row">
                <div className="stat-card">
                    <div className="stat-num">{certs.length}</div>
                    <div className="stat-label">Pending Doctor Release</div>
                </div>
            </div>
            {loading && <p className="text-muted">Loading…</p>}
            {!loading && !certs.length && (
                <div className="empty-state">
                    <div className="ei">
                        <i className="bi bi-file-earmark-check text-muted" style={{ opacity: 0.5 }}></i>
                    </div>
                    <p>No pending certificate requests.</p>
                </div>
            )}
            {!!certs.length && (
                <div className="card">
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Queue #</th>
                                    <th>Patient</th>
                                    <th>Request Details</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {certs.map((c) => (
                                    <tr key={c.certificate_id}>
                                        <td>
                                            <span className="num-badge" style={{ background: 'var(--blue)' }}>
                                                {c.queue?.queue_number ?? '—'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="fw6">{patientName(c.queue?.patient)}</div>
                                        </td>
                                        <td>
                                            <div className="fw6 text-sm" style={{ color: 'var(--maroon)' }}>
                                                {c.diagnosis_reason || 'Medical Certificate'}
                                            </div>
                                            <div className="text-xs text-muted">Req. Date: {c.queue?.date || 'N/A'}</div>
                                        </td>
                                        <td>
                                            <span className="badge b-blue">Awaiting Physician</span>
                                        </td>
                                        <td>
                                            <button className="btn btn-outline btn-sm" onClick={() => onView(c)}>
                                                <i className="bi bi-eye"></i> View Request
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
    );
}

function ViewMedCertModal({ cert, onClose }) {
    const p = cert.queue?.patient;
    return (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <button className="modal-close" onClick={onClose}>
                    &times;
                </button>
                <div className="card-title" style={{ marginBottom: 16 }}>
                    <i className="bi bi-file-medical"></i> Medical Certificate Request
                </div>
                <div className="alert alert-warn text-sm mb16">
                    <i className="bi bi-shield-lock"></i> <b>Role Restriction:</b> Only the attending physician can finalize, sign, and release
                    this document.
                </div>
                <div className="info-grid mb8">
                    <div className="info-item">
                        <div className="info-lbl">Patient</div>
                        <div className="info-val">{patientName(p)}</div>
                    </div>
                    <div className="info-item">
                        <div className="info-lbl">Requested Dates</div>
                        <div className="info-val">
                            {cert.date_from || '—'} to {cert.date_to || '—'}
                        </div>
                    </div>
                </div>
                <div className="info-item mb8">
                    <div className="info-lbl">Reason / Purpose</div>
                    <div className="info-val">{cert.diagnosis_reason || '—'}</div>
                </div>
                {cert.additional_notes && (
                    <div className="info-item">
                        <div className="info-lbl">Additional Notes</div>
                        <div className="info-val">{cert.additional_notes}</div>
                    </div>
                )}
                <div className="modal-footer">
                    <button className="btn btn-outline btn-sm" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function NurseDashboard() {
    const [section, setSection] = useState('queue');
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [doctors, setDoctors] = useState([]);
    const [toastMsg, setToastMsg] = useState(null);

    const [triageModal, setTriageModal] = useState(null); // { mode, item }
    const [endorseModal, setEndorseModal] = useState(null); // item

    const [certs, setCerts] = useState([]);
    const [certsLoading, setCertsLoading] = useState(true);
    const [viewCertModal, setViewCertModal] = useState(null);

    const fetchCerts = useCallback(async () => {
        try {
            const res = await axios.get('/api/v1/medical-certificates', { params: { released: 0 } });
            setCerts(res.data);
        } catch (e) {
            showToast('Failed to load certificate requests.', 'error');
        } finally {
            setCertsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (section === 'medcert') fetchCerts();
    }, [section, fetchCerts]);

    const [issuanceCounts, setIssuanceCounts] = useState({});
    const [manageMedsModal, setManageMedsModal] = useState(null);

    const fetchIssuanceCounts = useCallback(async () => {
        try {
            const res = await axios.get('/api/v1/medicine-issuances');
            const counts = {};
            res.data.forEach((i) => {
                if (i.queue_id) counts[i.queue_id] = (counts[i.queue_id] || 0) + 1;
            });
            setIssuanceCounts(counts);
        } catch (e) {
            // non-fatal; counts just stay at 0
        }
    }, []);

    useEffect(() => {
        if (section === 'medicine') fetchIssuanceCounts();
    }, [section, fetchIssuanceCounts]);

    const medsEligible = queue.filter((q) => q.triaged && !['done', 'cancelled'].includes(q.status));

    const [patients, setPatients] = useState([]);
    const [patientsLoading, setPatientsLoading] = useState(true);
    const [viewRecordModal, setViewRecordModal] = useState(null);
    const [historyModal, setHistoryModal] = useState(null);

    const fetchPatients = useCallback(async () => {
        try {
            const res = await axios.get('/api/records/patients');
            setPatients(res.data.patients);
        } catch (e) {
            showToast('Failed to load patient records.', 'error');
        } finally {
            setPatientsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (section === 'records') fetchPatients();
    }, [section, fetchPatients]);

    const [completedVisits, setCompletedVisits] = useState([]);
    const [visitsLoading, setVisitsLoading] = useState(true);
    const [visitDetailModal, setVisitDetailModal] = useState(null);

    const fetchCompletedVisits = useCallback(async () => {
        try {
            const res = await axios.get('/api/v1/queues', { params: { completed: 1 } });
            setCompletedVisits(res.data);
        } catch (e) {
            showToast('Failed to load completed visits.', 'error');
        } finally {
            setVisitsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (section === 'dpr' || section === 'dpl') fetchCompletedVisits();
    }, [section, fetchCompletedVisits]);

    function showToast(msg, type = 'success') {
        setToastMsg({ msg, type });
        setTimeout(() => setToastMsg(null), 3000);
    }

    const fetchQueue = useCallback(async () => {
        try {
            const res = await axios.get('/api/v1/queues');
            setQueue(res.data);
        } catch (e) {
            showToast('Failed to load the queue.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchQueue();
        const id = setInterval(fetchQueue, 15000);
        return () => clearInterval(id);
    }, [fetchQueue]);

    useEffect(() => {
        axios
            .get('/api/v1/doctors')
            .then((res) => setDoctors(res.data))
            .catch(() => {});
    }, []);

    const active = queue
        .filter((q) => q.status !== 'done' && q.status !== 'cancelled')
        .sort((a, b) => (a.queue_number || 0) - (b.queue_number || 0));
    const doneToday = queue.filter((q) => q.status === 'done').length;

    async function handleUndoEndorse(item) {
        if (!confirm(`Undo endorsement for ${patientName(item.patient)}?`)) return;
        try {
            await axios.put(`/api/v1/queues/${item.queue_id}`, { endorsed: false, status: 'triaged' });
            showToast('Endorsement undone.');
            fetchQueue();
        } catch (e) {
            showToast('Failed to undo endorsement.', 'error');
        }
    }

    async function handleCancel(item) {
        if (!confirm(`Cancel ${patientName(item.patient)} from the queue?`)) return;
        try {
            await axios.put(`/api/v1/queues/${item.queue_id}`, { status: 'cancelled' });
            showToast('Removed from queue.');
            fetchQueue();
        } catch (e) {
            showToast('Failed to cancel.', 'error');
        }
    }

    async function handleComplete(item) {
        try {
            await axios.put(`/api/v1/queues/${item.queue_id}`, { status: 'done', time_out: nowTime() });
            showToast(`Visit completed for ${patientName(item.patient)}.`);
            fetchQueue();
        } catch (e) {
            showToast('Failed to complete the visit.', 'error');
        }
    }

    async function handleEndorseConfirm(doctorId) {
        try {
            await axios.post(`/api/v1/queues/${endorseModal.queue_id}/endorse`, { doctor_id: doctorId });
            showToast(`${patientName(endorseModal.patient)} endorsed to the doctor.`);
            setEndorseModal(null);
            fetchQueue();
        } catch (e) {
            showToast('Failed to endorse patient.', 'error');
        }
    }

    return (
        <>
            <Head title="Nurse Dashboard">
                <link rel="stylesheet" href="/assets/css/main.css" />
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
                <style>{`
                    @media print {
                        @page { size: landscape; margin: 10mm; }
                        .sidebar, .page-header p, .hide-print, .modal-overlay { display: none !important; }
                        .main-content { margin: 0 !important; padding: 0 !important; width: 100% !important; }
                        .card { box-shadow: none !important; border: none !important; padding: 0 !important; }
                        table { font-size: 10px !important; }
                        th, td { padding: 4px 6px !important; }
                        .badge { background: none !important; border: 1px solid #999 !important; color: #000 !important; }
                        .num-badge { background: none !important; border: 1px solid #000 !important; color: #000 !important; }
                    }
                `}</style>
            </Head>

            <div className="layout">
                <Sidebar section={section} onNavigate={setSection} />
                <div className="main-content">
                    {section === 'queue' && (
                        <>
                            <div className="page-header">
                                <h1>Queue Monitoring</h1>
                                <p>Real-time patient queue — {active.length} patient(s) currently active.</p>
                            </div>

                            <div className="stats-row">
                                <div className="stat-card">
                                    <div className="stat-num">{active.length}</div>
                                    <div className="stat-label">Active in Queue</div>
                                </div>
                                <div className="stat-card stat-green">
                                    <div className="stat-num">{doneToday}</div>
                                    <div className="stat-label">Done Today</div>
                                </div>
                            </div>

                            <div className="card-title" style={{ marginBottom: 10 }}>
                                Queue List
                            </div>

                            {loading && <p className="text-muted">Loading queue…</p>}

                            {!loading && !active.length && (
                                <div className="empty-state">
                                    <div className="ei">
                                        <i className="bi bi-check2-circle text-muted" style={{ opacity: 0.5 }}></i>
                                    </div>
                                    <p>Queue is clear. All patients attended to.</p>
                                </div>
                            )}

                            {active.map((q) => (
                                <QueueItem
                                    key={q.queue_id}
                                    item={q}
                                    onTriage={() => setTriageModal({ mode: 'edit', item: q })}
                                    onViewTriage={() => setTriageModal({ mode: 'view', item: q })}
                                    onEndorse={() => setEndorseModal(q)}
                                    onUndoEndorse={() => handleUndoEndorse(q)}
                                    onComplete={() => handleComplete(q)}
                                    onRecord={() =>
                                        setViewRecordModal({ id: q.patient_id, name: patientName(q.patient), patientId: q.patient?.clinic_id })
                                    }
                                    onCancel={() => handleCancel(q)}
                                />
                            ))}
                        </>
                    )}

                    {section === 'medicine' && (
                        <MedicineList
                            patients={medsEligible}
                            loading={loading}
                            issuanceCounts={issuanceCounts}
                            onManage={setManageMedsModal}
                        />
                    )}

                    {section === 'medcert' && <MedCertList certs={certs} loading={certsLoading} onView={setViewCertModal} />}

                    {section === 'records' && (
                        <RecordsSearch
                            patients={patients}
                            loading={patientsLoading}
                            onView={setViewRecordModal}
                            onHistory={setHistoryModal}
                        />
                    )}

                    {section === 'dpr' && (
                        <DailyPatientRecords visits={completedVisits} loading={visitsLoading} onViewDetails={setVisitDetailModal} />
                    )}

                    {section === 'dpl' && <DailyPatientLog visits={completedVisits} loading={visitsLoading} />}
                </div>
            </div>

            {viewCertModal && <ViewMedCertModal cert={viewCertModal} onClose={() => setViewCertModal(null)} />}

            {viewRecordModal && <ViewRecordModal patientRef={viewRecordModal} onClose={() => setViewRecordModal(null)} />}

            {historyModal && <VisitHistoryModal patientRef={historyModal} onClose={() => setHistoryModal(null)} />}

            {visitDetailModal && <VisitDetailModal visit={visitDetailModal} onClose={() => setVisitDetailModal(null)} />}

            {manageMedsModal && (
                <ManageMedsModal
                    item={manageMedsModal}
                    showToast={showToast}
                    onClose={() => setManageMedsModal(null)}
                    onIssued={fetchIssuanceCounts}
                />
            )}

            {triageModal && (
                <TriageModal
                    mode={triageModal.mode}
                    item={triageModal.item}
                    onClose={() => setTriageModal(null)}
                    onSaved={() => {
                        setTriageModal(null);
                        showToast('Triage assessment saved.');
                        fetchQueue();
                    }}
                />
            )}

            {endorseModal && (
                <EndorseModal item={endorseModal} doctors={doctors} onClose={() => setEndorseModal(null)} onConfirm={handleEndorseConfirm} />
            )}


            {toastMsg && <div className={`toast toast-${toastMsg.type}`}>{toastMsg.msg}</div>}
        </>
    );
}
