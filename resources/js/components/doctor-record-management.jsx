import PaginatedItems from './paginated-items.jsx';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// ─────────────────────────────────────────────────────────────
// Doctor › Record Management (read-only)
// Ported from the legacy doctor.js, which reused the nurse record logic
// (docNav('records') -> renderNurseRecords). Same APIs as Nurse/Dashboard.jsx:
//   GET /api/records/patients
//   GET /api/records/patients/{patient}
//   GET /api/records/patients/{patient}/visits
// Doctors can only view. There is deliberately no edit or delete here.
// ─────────────────────────────────────────────────────────────

const VISIT_MAP = {
    checkup: { cls: 'b-maroon', icon: 'bi-clipboard2-pulse', label: 'Check-up' },
    medicine: { cls: 'b-gold', icon: 'bi-capsule', label: 'Medicine Req.' },
    'follow-up': { cls: 'b-blue', icon: 'bi-arrow-repeat', label: 'Follow-up' },
    medcert: { cls: 'b-green', icon: 'bi-file-earmark-medical', label: 'Med Cert' },
};

function VisitBadge({ item }) {
    const v = VISIT_MAP[item.visit_type] || { cls: 'b-gray', icon: '', label: item.visit_label || item.visit_type || 'Visit' };
    return (
        <span className={`badge ${v.cls}`}>
            {v.icon && <i className={`bi ${v.icon}`}></i>} {v.label}
        </span>
    );
}

function fullName(person) {
    if (!person) return 'Unknown Patient';
    return [person.firstname, person.lastname].filter(Boolean).join(' ') || 'Unknown Patient';
}

function uniqueVals(list, key) {
    return [...new Set(list.map((p) => p[key]).filter(Boolean))];
}

function Field({ label, value }) {
    return (
        <div className="field mb0">
            <div className="text-xs text-muted">{label}</div>
            <div className="fw6 text-sm mt4">{value || '—'}</div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Search & filter table
// ─────────────────────────────────────────────────────────────
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
        const ql = q.trim().toLowerCase();
        filtered = filtered.filter(
            (p) => String(p.name || '').toLowerCase().includes(ql) || String(p.patientId || '').toLowerCase().includes(ql),
        );
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
                                {<PaginatedItems items={filtered} tableColumns={5} label="filtered">{(p) => (
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
                                )}</PaginatedItems>}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}

// ─────────────────────────────────────────────────────────────
// View Record modal (4 tabs, read-only)
// ─────────────────────────────────────────────────────────────
function ViewRecordModal({ patientRef, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    const [tab, setTab] = useState('personal');

    useEffect(() => {
        let alive = true;
        axios
            .get(`/api/records/patients/${patientRef.id}`)
            .then((res) => alive && setData(res.data.patient))
            .catch(() => alive && setFailed(true))
            .finally(() => alive && setLoading(false));
        return () => {
            alive = false;
        };
    }, [patientRef.id]);

    const perm = data?.ppr_permanent;
    const demo = data?.ppr_demographic;
    const hr = data?.ppr_health_record;
    const q = data?.ppr_health_questionnaire;

    const scroll = { maxHeight: '50vh', overflowY: 'auto', paddingRight: 8 };
    const sub = { fontSize: '.95rem' };

    return (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal modal-lg">
                <button className="modal-close" onClick={onClose}>
                    &times;
                </button>
                <div className="profile-head" style={{ marginBottom: 16 }}>
                    <div className="profile-avatar">{(data ? fullName(data) : patientRef.name || 'P').charAt(0)}</div>
                    <div>
                        <div className="profile-name">{data ? fullName(data) : patientRef.name}</div>
                        <div className="profile-meta">
                            ID: {data?.clinic_id || patientRef.patientId} · {perm?.patient_type || 'Patient'} · {perm?.college_dept || ''}
                        </div>
                    </div>
                </div>

                {loading && <p className="text-muted">Loading…</p>}
                {!loading && failed && <p className="text-muted">Unable to load this patient&apos;s record.</p>}

                {!loading && !failed && (
                    <>
                        {!perm && !demo && !hr && !q && (
                            <p className="text-muted" style={{ marginBottom: 12 }}>
                                This patient has no permanent record on file yet.
                            </p>
                        )}
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
                            <div style={scroll}>
                                <div className="card-title" style={sub}>
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
                                <div className="card-title mt16" style={sub}>
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
                            <div style={scroll}>
                                <div className="card-title" style={sub}>
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
                                <div className="card-title mt16" style={sub}>
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
                            <div style={scroll}>
                                <div className="card-title" style={sub}>
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
                            <div style={scroll}>
                                <div className="card-title" style={sub}>
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
                                        <div className="card-title mt16" style={sub}>
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

// ─────────────────────────────────────────────────────────────
// Visit History modal (read-only)
// ─────────────────────────────────────────────────────────────
function VisitHistoryModal({ patientRef, onClose }) {
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let alive = true;
        axios
            .get(`/api/records/patients/${patientRef.id}/visits`)
            .then((res) => alive && setVisits(res.data.visits))
            .catch(() => alive && setFailed(true))
            .finally(() => alive && setLoading(false));
        return () => {
            alive = false;
        };
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
                {!loading && failed && <p className="text-muted">Unable to load visit history.</p>}
                {!loading && !failed && !visits.length && (
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
                                {<PaginatedItems items={visits} tableColumns={5} label="visits">{(v) => (
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
                                )}</PaginatedItems>}
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
// Section entry point: owns its own data loading, so the doctor
// dashboard only has to render <DoctorRecordManagement />.
// ─────────────────────────────────────────────────────────────
export default function DoctorRecordManagement({ showToast }) {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewRecord, setViewRecord] = useState(null);
    const [history, setHistory] = useState(null);

    const fetchPatients = useCallback(async () => {
        try {
            const res = await axios.get('/api/records/patients');
            setPatients(res.data.patients);
        } catch (e) {
            if (showToast) showToast('Failed to load patient records.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchPatients();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            <RecordsSearch patients={patients} loading={loading} onView={setViewRecord} onHistory={setHistory} />
            {viewRecord && <ViewRecordModal patientRef={viewRecord} onClose={() => setViewRecord(null)} />}
            {history && <VisitHistoryModal patientRef={history} onClose={() => setHistory(null)} />}
        </>
    );
}
