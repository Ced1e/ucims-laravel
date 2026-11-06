import { MetricSkeleton, DetailSkeleton, ListSkeleton, TableSkeletonRows } from '@/components/data-skeletons';
import { prescriptionError, requestError } from '@/lib/clinical-validation.mjs';
import { isCalendarDate } from '@/lib/registration-validation.mjs';
import PaginatedItems from '../../components/paginated-items.jsx';
import { useState, useEffect, useCallback } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import axios from 'axios';
import DoctorRecordManagement from '../../components/doctor-record-management';

// ─────────────────────────────────────────────────────────────
// Display helpers (same conventions as Nurse/Dashboard.jsx)
// ─────────────────────────────────────────────────────────────
const VISIT_MAP = {
    checkup: { cls: 'b-maroon', icon: 'bi-clipboard2-pulse', label: 'Check-up' },
    medicine: { cls: 'b-gold', icon: 'bi-capsule', label: 'Medicine Req.' },
    'follow-up': { cls: 'b-blue', icon: 'bi-arrow-repeat', label: 'Follow-up' },
    medcert: { cls: 'b-green', icon: 'bi-file-earmark-medical', label: 'Med Cert' },
};

const STATUS_MAP = {
    waiting: { cls: 'b-yellow', label: 'Waiting' },
    triaged: { cls: 'b-yellow', label: 'Triaged' },
    'with-doctor': { cls: 'b-blue', label: 'With Doctor' },
    examined: { cls: 'b-green', label: 'Examined' },
    done: { cls: 'b-green', label: 'Done' },
    cancelled: { cls: 'b-gray', label: 'Cancelled' },
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
    const s = STATUS_MAP[status] || { cls: 'b-gray', label: status || '—' };
    return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

function patientName(patient) {
    if (!patient) return 'Unknown Patient';
    return [patient.firstname, patient.lastname].filter(Boolean).join(' ') || 'Unknown Patient';
}

function nowTime() {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

const LAB_OPTIONS = ['CBC', 'Urinalysis', 'Blood Chemistry', 'Chest X-Ray', 'ECG', 'Fecalysis'];

// ─────────────────────────────────────────────────────────────
// Sidebar (ported from legacy index.html #page-doctor .sidebar)
// ─────────────────────────────────────────────────────────────
function Sidebar({ section, onNavigate }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const displayName = user ? [user.firstname, user.lastname].filter(Boolean).join(' ') : 'Doctor';
    const initial = (user?.firstname || 'D').charAt(0).toUpperCase();

    const navItems = [
        { section: 'Consultations', items: [{ icon: 'bi-heart-pulse', label: 'Active Consultations', key: 'consultations' }] },
        {
            section: 'Services',
            items: [
                { icon: 'bi-file-earmark-medical', label: 'MedCert Requests', key: 'medcert' },
                { icon: 'bi-droplet', label: 'Lab Requests', key: 'labs' },
            ],
        },
        { section: 'Records', items: [{ icon: 'bi-folder2-open', label: 'Record Management', key: 'records' }] },
        { section: 'History', items: [{ icon: 'bi-clock-history', label: 'Examination History', key: 'history' }] },
    ];

    return (
        <div className="sidebar">
            <div className="sidebar-brand">
                <img src="/assets/img/logo.png" className="logo-img" alt="USeP" />
                <div className="sidebar-brand-text">
                    <div className="sh-title">USeP Clinic</div>
                    <div className="sh-sub">Doctor Interface</div>
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
                    <div className="sidebar-avatar" style={{ background: 'var(--green)' }}>
                        {initial}
                    </div>
                    <div>
                        <div className="sidebar-user-name">{displayName}</div>
                        <div className="sidebar-user-role">Doctor Interface</div>
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
// Active Consultations table row
// ─────────────────────────────────────────────────────────────
function ConsultRow({ item, onExamine, onQuickComplete }) {
    return (
        <tr>
            <td>
                <span className="num-badge" style={{ background: 'var(--maroon)' }}>
                    {item.queue_number ?? '—'}
                </span>
            </td>
            <td style={{ fontWeight: 600, color: 'var(--maroon)' }}>{patientName(item.patient)}</td>
            <td>
                <VisitBadge item={item} />
            </td>
            <td>
                <StatusBadge status={item.status} />
            </td>
            <td>
                <div className="flex gap6">
                    <button className="btn btn-primary btn-sm" onClick={onExamine}>
                        <i className="bi bi-file-medical"></i> Examine
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={onQuickComplete}>
                        <i className="bi bi-check-circle"></i> Completed
                    </button>
                </div>
            </td>
        </tr>
    );
}

// ─────────────────────────────────────────────────────────────
// Examine modal — 4-tab workflow
// ─────────────────────────────────────────────────────────────
function ExamineModal({ item, onClose, onFinalized, showToast }) {
    const [tab, setTab] = useState('triage-review');
    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState(null); // full ClinicQueue (patient, triage, endorsement.prescriptions/labRequests)
    const [saving, setSaving] = useState(false);

    const [diag, setDiag] = useState({
        exam_general: '',
        exam_heent: '',
        exam_chest: '',
        exam_cardio: '',
        exam_abdomen: '',
        exam_extremities: '',
        exam_neuro: '',
        diagnosis: '',
        icd_10_code: '',
    });
    const [labChecks, setLabChecks] = useState({});
    const [otherLab, setOtherLab] = useState('');
    const [rxRows, setRxRows] = useState([]);
    const [finalRemarks, setFinalRemarks] = useState('');

    useEffect(() => {
        axios.get(`/api/v1/queues/${item.queue_id}`, { timeout: 20000 })
            .then((res) => {
                const d = res.data;
                setDetail(d);
                if (d.endorsement) {
                    setDiag({
                        exam_general: d.endorsement.exam_general || '',
                        exam_heent: d.endorsement.exam_heent || '',
                        exam_chest: d.endorsement.exam_chest || '',
                        exam_cardio: d.endorsement.exam_cardio || '',
                        exam_abdomen: d.endorsement.exam_abdomen || '',
                        exam_extremities: d.endorsement.exam_extremities || '',
                        exam_neuro: d.endorsement.exam_neuro || '',
                        diagnosis: d.endorsement.diagnosis || '',
                        icd_10_code: d.endorsement.icd_10_code || '',
                    });
                    setFinalRemarks(d.endorsement.final_remarks || '');
                    setRxRows(
                        (d.endorsement.prescriptions || []).map((p) => ({
                            id: p.prescription_id,
                            drug_name: p.drug_name || '',
                            dosage: p.dosage || '',
                            frequency: p.frequency || '',
                            duration: p.duration || '',
                            route: p.route || 'Oral',
                            treatment_instructions: p.treatment_instructions || '',
                        }))
                    );
                    const existingLabs = (d.endorsement.labRequests || []).map((l) => l.laboratory_request);
                    const checks = {};
                    LAB_OPTIONS.forEach((l) => (checks[l] = existingLabs.includes(l)));
                    setLabChecks(checks);
                    const other = existingLabs.find((l) => !LAB_OPTIONS.includes(l));
                    if (other) setOtherLab(other);
                }
            })
            .catch(() => showToast('Failed to load consultation details.', 'error'))
            .finally(() => setLoading(false));
    }, [item.queue_id]);

    const endorsedId = detail?.endorsement?.endorsed_id;

    async function saveDiagnosis() {
        if (!diag.diagnosis.trim()) {
            showToast('Please enter a diagnosis.', 'error');
            return;
        }
        if (!endorsedId) {
            showToast('No endorsement record found for this patient.', 'error');
            return;
        }
        setSaving(true);
        try {
            await axios.put(`/api/v1/endorsed/${endorsedId}`, diag);
            showToast('Diagnosis and findings saved.');
            setTab('prescriptions');
        } catch (e) {
            showToast(requestError(e, 'Failed to save diagnosis.'), 'error');
        } finally {
            setSaving(false);
        }
    }

    function addRxRow() {
        setRxRows([...rxRows, { id: `new-${Date.now()}`, drug_name: '', dosage: '', frequency: '', duration: '', route: 'Oral', treatment_instructions: '' }]);
    }

    function updateRxRow(id, field, value) {
        setRxRows(rxRows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
    }

    function removeRxRow(id) {
        setRxRows(rxRows.filter((r) => r.id !== id));
    }

    async function savePrescriptions() {
        if (!endorsedId) return;
        const validationError = prescriptionError(rxRows, otherLab);
        if (validationError) { showToast(validationError, 'error'); return; }
        setSaving(true);
        try {
            // Labs: delete existing lab requests for this endorsement, then recreate from current checkboxes/other.
            const existingLabs = detail?.endorsement?.labRequests || [];
            await Promise.all(existingLabs.map((l) => axios.delete(`/api/v1/lab-requests/${l.lab_request_id}`)));

            const selectedLabs = LAB_OPTIONS.filter((l) => labChecks[l]);
            if (otherLab.trim()) selectedLabs.push(otherLab.trim());
            await Promise.all(
                selectedLabs.map((laboratory_request) =>
                    axios.post('/api/v1/lab-requests', { endorsed_id: endorsedId, laboratory_request })
                )
            );

            // Prescriptions: delete all existing rows for this endorsement, then recreate from
            // current form state. This keeps edits and removals consistent with lab requests above,
            // rather than only persisting newly-added rows.
            const existingRx = detail?.endorsement?.prescriptions || [];
            await Promise.all(existingRx.map((p) => axios.delete(`/api/v1/prescriptions/${p.prescription_id}`)));

            const filledRx = rxRows.filter((r) => r.drug_name.trim());
            await Promise.all(
                filledRx.map((r) =>
                    axios.post('/api/v1/prescriptions', {
                        endorsed_id: endorsedId,
                        drug_name: r.drug_name,
                        dosage: r.dosage,
                        frequency: r.frequency,
                        duration: r.duration,
                        route: r.route,
                        treatment_instructions: r.treatment_instructions,
                    })
                )
            );

            showToast('Prescriptions and lab requests saved.');
            setTab('finalize');
        } catch (e) {
            showToast(requestError(e, 'Failed to save prescriptions.'), 'error');
        } finally {
            setSaving(false);
        }
    }

    async function finalizeConsult() {
        if (!endorsedId) return;
        setSaving(true);
        try {
            await axios.put(`/api/v1/endorsed/${endorsedId}`, { ...diag, final_remarks: finalRemarks });
            await axios.put(`/api/v1/queues/${item.queue_id}`, { status: 'examined', time_out: nowTime() });
            showToast('Examination finalized! Patient returned to Nurse Station.');
            onFinalized();
        } catch (e) {
            showToast(requestError(e, 'Failed to finalize the examination.'), 'error');
        } finally {
            setSaving(false);
        }
    }

    const triage = detail?.triage;
    const vitalRows = triage
        ? [
              ['Blood Pressure', triage.blood_pressure],
              ['Heart Rate', triage.heart_rate ? `${triage.heart_rate} bpm` : ''],
              ['Temperature', triage.temperature ? `${triage.temperature}°C` : ''],
              ['Resp. Rate', triage.resp_rate || ''],
              ['O₂ Saturation', triage.o2_saturation ? `${triage.o2_saturation}%` : ''],
              ['Weight / Height', `${triage.weight || '—'}kg / ${triage.height || '—'}cm`],
          ]
        : [];

    const rxSummary = rxRows.filter((r) => r.drug_name.trim()).map((r) => `${r.drug_name} ${r.dosage}`).join(', ') || 'None';
    const labSummary = [...LAB_OPTIONS.filter((l) => labChecks[l]), ...(otherLab.trim() ? [otherLab.trim()] : [])].join(', ') || 'None';

    return (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal modal-lg">
                <button className="modal-close" onClick={onClose}>
                    &times;
                </button>
                <div className="modal-title">
                    <i className="bi bi-heart-pulse"></i> Medical Examination
                </div>
                <div className="text-sm text-muted mb8">
                    {patientName(item.patient)} · Queue #{item.queue_number} · {VISIT_MAP[item.visit_type]?.label || item.visit_label}
                </div>

                {loading ? (
                    <DetailSkeleton />
                ) : !detail ? <p role="alert">Unable to load consultation details. Close and reopen to try again.</p> : (
                    <>
                        <div className="tabs">
                            <button className={`tab ${tab === 'triage-review' ? 'active' : ''}`} onClick={() => setTab('triage-review')}>
                                1. Triage Assessment
                            </button>
                            <button className={`tab ${tab === 'diagnosis' ? 'active' : ''}`} onClick={() => setTab('diagnosis')}>
                                2. Physician Diagnosis
                            </button>
                            <button className={`tab ${tab === 'prescriptions' ? 'active' : ''}`} onClick={() => setTab('prescriptions')}>
                                3. Prescriptions
                            </button>
                            <button className={`tab ${tab === 'finalize' ? 'active' : ''}`} onClick={() => setTab('finalize')}>
                                4. Finalization
                            </button>
                        </div>

                        {tab === 'triage-review' && (
                            <div className="tab-panel active">
                                {triage ? (
                                    <>
                                        <div className="alert alert-info text-sm mb8">
                                            <i className="bi bi-info-circle"></i> Nurse-recorded vital signs. <b>View only — cannot be modified.</b>
                                        </div>
                                        <div className="grid3 mb8">
                                            {vitalRows.map(([l, v]) => (
                                                <div key={l} style={{ background: '#f9f8f6', padding: '10px 12px', borderRadius: 7 }}>
                                                    <div className="text-xs text-muted">{l}</div>
                                                    <div className="fw6 text-sm mt4">{v || '—'}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <div className="info-lbl">Chief Complaint</div>
                                                <div className="info-val">{triage.chief_complaint || '—'}</div>
                                            </div>
                                            <div className="info-item">
                                                <div className="info-lbl">Nurse Assessment</div>
                                                <div className="info-val">{triage.initial_notes || '—'}</div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="alert alert-warn text-sm">
                                        <i className="bi bi-exclamation-triangle"></i> No triage data recorded yet for this patient.
                                    </div>
                                )}
                                <div className="modal-footer" style={{ border: 'none', paddingTop: 8 }}>
                                    <button className="btn btn-primary" onClick={() => setTab('diagnosis')}>
                                        Next: Physician Diagnosis <i className="bi bi-arrow-right"></i>
                                    </button>
                                </div>
                            </div>
                        )}

                        {tab === 'diagnosis' && (
                            <div className="tab-panel active">
                                <div className="field-row">
                                    <div className="field">
                                        <label>General Appearance</label>
                                        <input
                                            placeholder="e.g. Conscious, coherent, not in distress"
                                            value={diag.exam_general}
                                            onChange={(e) => setDiag({ ...diag, exam_general: e.target.value })}
                                        />
                                    </div>
                                    <div className="field">
                                        <label>HEENT</label>
                                        <input
                                            placeholder="Head, Eyes, Ears, Nose, Throat"
                                            value={diag.exam_heent}
                                            onChange={(e) => setDiag({ ...diag, exam_heent: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="field-row">
                                    <div className="field">
                                        <label>Chest / Lungs</label>
                                        <input
                                            placeholder="Auscultation findings"
                                            value={diag.exam_chest}
                                            onChange={(e) => setDiag({ ...diag, exam_chest: e.target.value })}
                                        />
                                    </div>
                                    <div className="field">
                                        <label>Cardiovascular</label>
                                        <input
                                            placeholder="Heart sounds, pulses"
                                            value={diag.exam_cardio}
                                            onChange={(e) => setDiag({ ...diag, exam_cardio: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="field-row">
                                    <div className="field">
                                        <label>Abdomen</label>
                                        <input
                                            placeholder="Soft, non-tender, etc."
                                            value={diag.exam_abdomen}
                                            onChange={(e) => setDiag({ ...diag, exam_abdomen: e.target.value })}
                                        />
                                    </div>
                                    <div className="field">
                                        <label>Extremities</label>
                                        <input
                                            placeholder="Gross motor, sensation"
                                            value={diag.exam_extremities}
                                            onChange={(e) => setDiag({ ...diag, exam_extremities: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="field">
                                    <label>Neurological</label>
                                    <input
                                        placeholder="GCS, orientation..."
                                        value={diag.exam_neuro}
                                        onChange={(e) => setDiag({ ...diag, exam_neuro: e.target.value })}
                                    />
                                </div>
                                <hr className="div" />
                                <div className="field">
                                    <label>Diagnosis / Clinical Impression *</label>
                                    <textarea
                                        placeholder="Primary and secondary diagnoses..."
                                        value={diag.diagnosis}
                                        onChange={(e) => setDiag({ ...diag, diagnosis: e.target.value })}
                                    />
                                </div>
                                <div className="field">
                                    <label>ICD-10 Code (optional)</label>
                                    <input
                                        placeholder="e.g. J06.9"
                                        value={diag.icd_10_code}
                                        onChange={(e) => setDiag({ ...diag, icd_10_code: e.target.value })}
                                    />
                                </div>
                                <div className="modal-footer" style={{ border: 'none', paddingTop: 8 }}>
                                    <button className="btn btn-outline" onClick={() => setTab('triage-review')}>
                                        <i className="bi bi-arrow-left"></i> Back
                                    </button>
                                    <button className="btn btn-primary" disabled={saving} onClick={saveDiagnosis}>
                                        {saving ? 'Saving…' : 'Save & Continue'} <i className="bi bi-arrow-right"></i>
                                    </button>
                                </div>
                            </div>
                        )}

                        {tab === 'prescriptions' && (
                            <div className="tab-panel active">
                                <div className="card-title" style={{ fontSize: '.88rem', marginBottom: 10 }}>
                                    Laboratory Requests
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                                    {LAB_OPTIONS.map((l) => (
                                        <label className="field-check" key={l}>
                                            <input
                                                type="checkbox"
                                                style={{ width: 'auto' }}
                                                checked={!!labChecks[l]}
                                                onChange={(e) => setLabChecks({ ...labChecks, [l]: e.target.checked })}
                                            />{' '}
                                            {l}
                                        </label>
                                    ))}
                                </div>
                                <div className="field">
                                    <label>Other Lab Requests</label>
                                    <input placeholder="Specify other tests..." value={otherLab} onChange={(e) => setOtherLab(e.target.value)} />
                                </div>
                                <hr className="div" />
                                <div className="card-title" style={{ fontSize: '.88rem', marginBottom: 10 }}>
                                    Prescriptions
                                </div>
                                {rxRows.map((r) => (
                                    <div className="rx-block" key={r.id}>
                                        <button className="rx-remove" onClick={() => removeRxRow(r.id)}>
                                            <i className="bi bi-x"></i>
                                        </button>
                                        <div className="field-row">
                                            <div className="field">
                                                <label>Drug Name</label>
                                                <input
                                                    placeholder="Generic name"
                                                    value={r.drug_name}
                                                    onChange={(e) => updateRxRow(r.id, 'drug_name', e.target.value)}
                                                />
                                            </div>
                                            <div className="field">
                                                <label>Dosage</label>
                                                <input
                                                    placeholder="e.g. 500mg"
                                                    value={r.dosage}
                                                    onChange={(e) => updateRxRow(r.id, 'dosage', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                                            <div className="field">
                                                <label>Frequency</label>
                                                <input
                                                    placeholder="e.g. 3x a day"
                                                    value={r.frequency}
                                                    onChange={(e) => updateRxRow(r.id, 'frequency', e.target.value)}
                                                />
                                            </div>
                                            <div className="field">
                                                <label>Duration</label>
                                                <input
                                                    placeholder="e.g. 7 days"
                                                    value={r.duration}
                                                    onChange={(e) => updateRxRow(r.id, 'duration', e.target.value)}
                                                />
                                            </div>
                                            <div className="field">
                                                <label>Route</label>
                                                <select value={r.route} onChange={(e) => updateRxRow(r.id, 'route', e.target.value)}>
                                                    {['Oral', 'Topical', 'IV', 'IM', 'Inhaled'].map((opt) => (
                                                        <option key={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="field">
                                            <label>Instructions</label>
                                            <input
                                                placeholder="e.g. Take after meals"
                                                value={r.treatment_instructions}
                                                onChange={(e) => updateRxRow(r.id, 'treatment_instructions', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <button className="btn btn-outline btn-sm mb8" onClick={addRxRow}>
                                    <i className="bi bi-plus"></i> Add Medication
                                </button>
                                <div className="modal-footer" style={{ border: 'none', paddingTop: 8 }}>
                                    <button className="btn btn-outline" onClick={() => setTab('diagnosis')}>
                                        <i className="bi bi-arrow-left"></i> Back
                                    </button>
                                    <button className="btn btn-primary" disabled={saving} onClick={savePrescriptions}>
                                        {saving ? 'Saving…' : 'Save & Continue'} <i className="bi bi-arrow-right"></i>
                                    </button>
                                </div>
                            </div>
                        )}

                        {tab === 'finalize' && (
                            <div className="tab-panel active">
                                <div className="alert alert-info text-sm">
                                    <i className="bi bi-info-circle"></i> Review the consultation summary. Saving will securely store your clinical
                                    findings and return the patient to the Nurse for checkout.
                                </div>
                                <div style={{ background: '#f9f8f6', borderRadius: 8, padding: '16px 18px', margin: '14px 0' }}>
                                    <div
                                        className="text-xs fw6 text-muted"
                                        style={{ textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 12 }}
                                    >
                                        Consultation Summary
                                    </div>
                                    <div className="grid2 text-sm" style={{ gap: 10 }}>
                                        <div>
                                            <span className="text-muted">Patient:</span> <b>{patientName(item.patient)}</b>
                                        </div>
                                        <div>
                                            <span className="text-muted">Visit Type:</span> {VISIT_MAP[item.visit_type]?.label || item.visit_label}
                                        </div>
                                        <div>
                                            <span className="text-muted">Chief Complaint:</span> {triage?.chief_complaint || '—'}
                                        </div>
                                        <div>
                                            <span className="text-muted">Diagnosis:</span> <b>{diag.diagnosis || 'Not entered'}</b>
                                            {diag.icd_10_code ? ` (${diag.icd_10_code})` : ''}
                                        </div>
                                        <div>
                                            <span className="text-muted">Lab Requests:</span> {labSummary}
                                        </div>
                                        <div>
                                            <span className="text-muted">Prescriptions:</span> {rxSummary}
                                        </div>
                                    </div>
                                </div>
                                <div className="field">
                                    <label>
                                        <i className="bi bi-journal-text"></i> Final Remarks / Plan
                                    </label>
                                    <textarea
                                        placeholder="Recommendations, rest advice, or follow-up plans..."
                                        value={finalRemarks}
                                        onChange={(e) => setFinalRemarks(e.target.value)}
                                    />
                                </div>
                                <div className="modal-footer" style={{ border: 'none', paddingTop: 8 }}>
                                    <button className="btn btn-outline" onClick={() => setTab('prescriptions')}>
                                        <i className="bi bi-arrow-left"></i> Back
                                    </button>
                                    <button className="btn btn-primary" style={{ flex: 1 }} disabled={saving} onClick={finalizeConsult}>
                                        {saving ? 'Saving…' : <><i className="bi bi-check-circle"></i> Save Findings & Return to Nurse</>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// Lab Requests — Doctor view (attach results to pending lab tests)
// ─────────────────────────────────────────────────────────────
function groupLabsByVisit(labs) {
    const groups = {};
    labs.forEach((l) => {
        const eid = l.endorsed_id;
        if (!groups[eid]) {
            groups[eid] = {
                endorsed_id: eid,
                patient: l.endorsed?.queue?.patient,
                queue_number: l.endorsed?.queue?.queue_number,
                date: l.endorsed?.queue?.date,
                tests: [],
            };
        }
        groups[eid].tests.push(l);
    });
    return Object.values(groups);
}

function LabRequestsList({ labs, loading, onAttach }) {
    const groups = groupLabsByVisit(labs);
    return (
        <>
            <div className="page-header">
                <h1>Laboratory Requests</h1>
                <p>Pending laboratory tests awaiting results.</p>
            </div>
            {loading && <ListSkeleton />}
            {!loading && !groups.length && (
                <div className="empty-state">
                    <div className="ei">
                        <i className="bi bi-droplet text-muted" style={{ opacity: 0.5 }}></i>
                    </div>
                    <p>No pending laboratory submissions.</p>
                </div>
            )}
            {!!groups.length && (
                <div className="card">
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Patient</th>
                                    <th>Pending Tests</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {<PaginatedItems items={groups} tableColumns={4} label="groups">{(g) => (
                                    <tr key={g.endorsed_id}>
                                        <td className="text-xs fw6">{g.date || '—'}</td>
                                        <td>
                                            <div className="fw6" style={{ color: 'var(--maroon)' }}>
                                                {patientName(g.patient)}
                                            </div>
                                            <div className="text-xs text-muted">Queue #{g.queue_number}</div>
                                        </td>
                                        <td>
                                            <span className="badge b-blue">{g.tests.length} Test(s) Pending</span>
                                            <div className="text-xs text-muted mt4">{g.tests.map((t) => t.laboratory_request).join(', ')}</div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button className="btn btn-primary btn-sm" onClick={() => onAttach(g)}>
                                                <i className="bi bi-paperclip"></i> Attach Results
                                            </button>
                                        </td>
                                    </tr>
                                )}</PaginatedItems>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
    );
}

function AttachLabResultsModal({ group, onClose, showToast, onSaved }) {
    const [values, setValues] = useState(() => Object.fromEntries(group.tests.map((t) => [t.lab_request_id, ''])));
    const [saving, setSaving] = useState(false);

    async function handleSave() {
        const toSave = group.tests.filter((t) => values[t.lab_request_id]?.trim());
        if (!toSave.length) {
            showToast('Enter at least one result before saving.', 'error');
            return;
        }
        setSaving(true);
        try {
            await Promise.all(
                toSave.map((t) => axios.put(`/api/v1/lab-requests/${t.lab_request_id}`, { attachments: values[t.lab_request_id] }))
            );
            showToast('Laboratory results saved.');
            onSaved();
        } catch (e) {
            showToast(requestError(e, 'Failed to save results.'), 'error');
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
                <div className="profile-head" style={{ marginBottom: 16 }}>
                    <div className="profile-avatar">{patientName(group.patient).charAt(0)}</div>
                    <div>
                        <div className="profile-name">{patientName(group.patient)}</div>
                        <div className="profile-meta">Attaching results for visit on {group.date || 'today'}</div>
                    </div>
                </div>
                <div className="card-title" style={{ fontSize: '.9rem', marginBottom: 12 }}>
                    <i className="bi bi-file-earmark-medical"></i> Pending Laboratory Results
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {group.tests.map((t) => (
                        <div key={t.lab_request_id} className="field" style={{ borderLeft: '3px solid var(--maroon)', paddingLeft: 12 }}>
                            <label>{t.laboratory_request} *</label>
                            <textarea
                                placeholder="Enter result values / findings / interpretation..."
                                value={values[t.lab_request_id]}
                                onChange={(e) => setValues({ ...values, [t.lab_request_id]: e.target.value })}
                            />
                        </div>
                    ))}
                </div>
                <div className="modal-footer">
                    <button className="btn btn-outline btn-sm" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="btn btn-primary btn-sm" disabled={saving} onClick={handleSave}>
                        {saving ? 'Saving…' : <><i className="bi bi-check-circle"></i> Save Results</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Examination History
// ─────────────────────────────────────────────────────────────
function ExaminationHistory({ visits, loading, onViewSummary }) {
    const [q, setQ] = useState('');

    let filtered = visits;
    if (q.trim()) {
        const ql = q.toLowerCase();
        filtered = filtered.filter((v) => patientName(v.patient).toLowerCase().includes(ql) || String(v.patient?.clinic_id || '').toLowerCase().includes(ql));
    }
    filtered = [...filtered].sort((a, b) => (b.queue_id || 0) - (a.queue_id || 0));

    return (
        <>
            <div className="page-header">
                <h1>Examination History</h1>
                <p>View past consultations and complete patient histories.</p>
            </div>
            <div className="card">
                <input style={{ marginBottom: 16, width: '100%' }} placeholder="Search by patient name or ID..." value={q} onChange={(e) => setQ(e.target.value)} />
                {loading && <ListSkeleton />}
                {!loading && !filtered.length && (
                    <div className="empty-state">
                        <p className="text-muted">No examination history found.</p>
                    </div>
                )}
                {!!filtered.length && (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Patient</th>
                                    <th>Visit Type</th>
                                    <th>Diagnosis</th>
                                    <th>Summary</th>
                                </tr>
                            </thead>
                            <tbody>
                                {<PaginatedItems items={filtered} tableColumns={5} label="filtered">{(v) => (
                                    <tr key={v.queue_id}>
                                        <td className="text-xs fw6" style={{ whiteSpace: 'nowrap' }}>{v.date || '—'}</td>
                                        <td>
                                            <div className="fw6">{patientName(v.patient)}</div>
                                            <div className="text-xs text-muted">{v.patient?.clinic_id}</div>
                                        </td>
                                        <td>
                                            <VisitBadge item={v} />
                                        </td>
                                        <td className="text-xs fw6" style={{ color: 'var(--blue)' }}>{v.endorsement?.diagnosis || '—'}</td>
                                        <td>
                                            <button className="btn btn-outline btn-sm" onClick={() => onViewSummary(v)}>
                                                <i className="bi bi-eye"></i> View Summary
                                            </button>
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

function ExamSummaryModal({ visit, onClose }) {
    const t = visit.triage;
    const e = visit.endorsement;
    const rxList = (e?.prescriptions || []).map((r) => `${r.drug_name} ${r.dosage} (${r.frequency}, ${r.duration})`).join('; ');

    return (
        <div className="modal-overlay open" onClick={(ev) => ev.target === ev.currentTarget && onClose()}>
            <div className="modal">
                <button className="modal-close" onClick={onClose}>
                    &times;
                </button>
                <div className="card-title" style={{ marginBottom: 12 }}>
                    <i className="bi bi-clipboard2-pulse"></i> Examination Summary
                </div>
                <div style={{ background: '#f9f8f6', border: '1px solid var(--border)', borderRadius: 8, padding: 18, marginBottom: 14 }}>
                    <div className="grid2 mb8">
                        <div>
                            <span className="text-muted text-xs fw6" style={{ textTransform: 'uppercase' }}>Patient Name</span>
                            <div className="fw6">{patientName(visit.patient)}</div>
                        </div>
                        <div>
                            <span className="text-muted text-xs fw6" style={{ textTransform: 'uppercase' }}>Date &amp; Time</span>
                            <div>
                                {visit.date} | In: {visit.time_in} - Out: {visit.time_out || 'N/A'}
                            </div>
                        </div>
                    </div>
                    <div className="grid2">
                        <div>
                            <span className="text-muted text-xs fw6" style={{ textTransform: 'uppercase' }}>Purpose</span>
                            <div>{VISIT_MAP[visit.visit_type]?.label || visit.visit_label}</div>
                        </div>
                        <div>
                            <span className="text-muted text-xs fw6" style={{ textTransform: 'uppercase' }}>ICD-10 Code</span>
                            <div>{e?.icd_10_code || '—'}</div>
                        </div>
                    </div>
                </div>

                <div className="card-title" style={{ fontSize: '1rem', marginBottom: 10 }}>
                    <i className="bi bi-clipboard2-pulse"></i> Clinical Notes
                </div>
                <div className="info-grid mb16">
                    <div className="info-item">
                        <div className="info-lbl">Chief Complaint</div>
                        <div className="info-val">{t?.chief_complaint || '—'}</div>
                    </div>
                    <div className="info-item">
                        <div className="info-lbl">Nurse Notes</div>
                        <div className="info-val">{t?.initial_notes || '—'}</div>
                    </div>
                </div>

                <div className="card-title" style={{ fontSize: '1rem', marginBottom: 10 }}>
                    <i className="bi bi-heart-pulse"></i> Physician Findings
                </div>
                <div className="field mb16">
                    <div className="text-sm" style={{ background: '#fff', padding: 12, border: '1px solid var(--border)', borderRadius: 6 }}>
                        <span className="text-muted">Diagnosis:</span> <b>{e?.diagnosis || 'None recorded'}</b>
                        {e?.final_remarks && (
                            <>
                                <br />
                                <span className="text-muted">Remarks:</span> {e.final_remarks}
                            </>
                        )}
                    </div>
                </div>

                <div className="card-title" style={{ fontSize: '1rem', marginBottom: 10 }}>
                    <i className="bi bi-capsule"></i> Treatments &amp; Prescriptions
                </div>
                <div className="text-sm" style={{ background: '#fff', padding: 12, border: '1px solid var(--border)', borderRadius: 6, lineHeight: 1.6 }}>
                    {rxList || 'No treatments or prescriptions issued.'}
                </div>

                <div className="modal-footer">
                    <button className="btn btn-outline" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// MedCert Requests — Doctor view (review, finalize, release, print)
// ─────────────────────────────────────────────────────────────
function printCertificate(cert, patient, form) {
    const formatDt = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '_________________');
    const today = new Date();
    const logoUrl = `${window.location.origin}/assets/img/logo.png`;

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Medical Certificate</title>
<style>
    @page { size: portrait; margin: 18mm; }
    body { font-family: 'Times New Roman', Times, serif; margin: 0; padding: 30px; color: #111; }
    .letter { max-width: 680px; margin: 0 auto; }
    table.letterhead { width: 100%; border-collapse: collapse; border: 1.5px solid #000; margin-bottom: 26px; font-family: Arial, Helvetica, sans-serif; }
    table.letterhead td { padding: 10px 14px; vertical-align: middle; }
    table.letterhead td:first-child { width: 90px; text-align: center; border-right: 1.5px solid #000; }
    table.letterhead td:last-child { text-align: center; font-size: 9pt; }
    .body-text { line-height: 2.2; font-size: 1.05rem; }
    .sig { margin-top: 60px; text-align: right; font-family: Arial, Helvetica, sans-serif; }
    .sig .name { border-top: 1px solid #000; display: inline-block; padding-top: 4px; font-weight: bold; text-transform: uppercase; min-width: 240px; }
    .sig .lic { font-size: .85rem; margin-top: 6px; }
    u { text-underline-offset: 3px; }
</style>
</head>
<body>
<div class="letter">
    <table class="letterhead">
        <tr>
            <td><img src="${logoUrl}" style="width:72px;" onerror="this.style.display='none'" alt=""></td>
            <td>
                Republic of the Philippines<br><b style="font-size:10.5pt;">University of Southeastern Philippines</b><br>
                University Clinic &mdash; I&ntilde;igo St., Bo. Obrero, Davao City
            </td>
        </tr>
    </table>
    <div class="body-text">
        <p style="font-weight:bold;">TO WHOM IT MAY CONCERN:</p>
        <p style="text-indent:30px;">
            This is to certify that <b><u>&nbsp;${patientName(patient)}&nbsp;</u></b>
            of <b><u>&nbsp;${form.affiliation || 'N/A'}&nbsp;</u></b>
            has been examined by the undersigned at this office on <b><u>&nbsp;${formatDt(form.exam_date)}&nbsp;</u></b>
            and found him/her to be with <b><u>&nbsp;${form.findings || '_______________________'}&nbsp;</u></b>.
        </p>
        <p style="text-indent:30px;">
            This certification is issued upon his/her request for the purpose of:
            <b><u>&nbsp;${form.purpose || cert.diagnosis_reason || '_______________________'}&nbsp;</u></b>.
        </p>
        <p style="text-indent:30px;">Issued this ${today.getDate()} day of ${today.toLocaleDateString('en-US', { month: 'long' })}, ${today.getFullYear()} at Davao City, Philippines.</p>
    </div>
    <div class="sig">
        <div class="name">${form.physician_name || '_______________________'}</div>
        <div class="lic">License No. ${form.license_no || '_______________'}</div>
    </div>
</div>
<script>window.onload = function () { setTimeout(function () { window.print(); }, 150); };</script>
</body>
</html>`;

    const printTab = window.open('', '_blank');
    if (!printTab) {
        alert('Please allow pop-ups for this site to print the certificate.');
        return;
    }
    printTab.document.open();
    printTab.document.write(html);
    printTab.document.close();
}

function MedCertListDoctor({ certs, loading, onReview }) {
    return (
        <>
            <div className="page-header">
                <h1>Medical Certificate Requests</h1>
                <p>Process, finalize, and release official medical certificates.</p>
            </div>
            <div className="stats-row">
                <div className="stat-card">
                    <div className="stat-num">{loading ? <MetricSkeleton /> : certs.length}</div>
                    <div className="stat-label">Pending Releases</div>
                </div>
            </div>
            {loading && <ListSkeleton />}
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
                                {<PaginatedItems items={certs} tableColumns={5} label="certs">{(c) => (
                                    <tr key={c.certificate_id}>
                                        <td>
                                            <span className="num-badge" style={{ background: 'var(--maroon)' }}>
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
                                            <span className="badge b-green">Ready for Physician</span>
                                        </td>
                                        <td>
                                            <button className="btn btn-primary btn-sm" onClick={() => onReview(c)}>
                                                <i className="bi bi-pencil-square"></i> Review &amp; Process
                                            </button>
                                        </td>
                                    </tr>
                                )}</PaginatedItems>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
    );
}

function Blank({ value, onChange, width = 170, type = 'text', placeholder = '' }) {
    return (
        <input
            type={type}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            style={{
                border: 'none',
                borderBottom: '1.5px solid #333',
                background: 'transparent',
                textAlign: 'center',
                fontWeight: 600,
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: '1rem',
                padding: '2px 6px',
                outline: 'none',
                width,
                color: '#111',
            }}
        />
    );
}

function ReviewMedCertModal({ cert, onClose, onReleased, showToast }) {
    const { auth } = usePage().props;
    const patient = cert.queue?.patient;
    const [form, setForm] = useState({
        findings: cert.findings || '',
        purpose: cert.purpose || cert.diagnosis_reason || '',
        physician_name: cert.physician_name || (auth?.user ? `${auth.user.firstname} ${auth.user.lastname}`.toUpperCase() : ''),
        license_no: cert.license_no || '',
        exam_date: cert.exam_date || cert.queue?.date || new Date().toISOString().slice(0, 10),
        affiliation: 'N/A',
    });
    const [saving, setSaving] = useState(false);

    const issuedDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    async function handleRelease() {
        if (form.exam_date && !isCalendarDate(form.exam_date)) {
            showToast('Enter a valid examination date.', 'error'); return;
        }
        if (!form.license_no.trim()) {
            showToast('Please enter the physician license number before releasing.', 'error');
            return;
        }
        if (!form.findings.trim()) {
            showToast('Please fill in the findings blank before releasing.', 'error');
            return;
        }
        setSaving(true);
        try {
            await axios.put(`/api/v1/medical-certificates/${cert.certificate_id}`, {
                findings: form.findings,
                purpose: form.purpose,
                physician_name: form.physician_name,
                license_no: form.license_no,
                exam_date: form.exam_date,
                is_released: true,
            });
            if (cert.queue_id) {
                await axios.put(`/api/v1/queues/${cert.queue_id}`, { status: 'done', time_out: nowTime() });
            }
            printCertificate(cert, patient, form);
            showToast('Certificate released and sent to print.');
            onReleased();
        } catch (e) {
            showToast(requestError(e, 'Failed to release the certificate.'), 'error');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal modal-lg">
                <button className="modal-close" onClick={onClose}>
                    &times;
                </button>
                <div className="card-title" style={{ marginBottom: 16 }}>
                    <i className="bi bi-file-medical"></i> Medical Certificate Processing
                </div>
                <div className="alert alert-info text-sm mb16">
                    <i className="bi bi-info-circle"></i> <b>Status:</b> Visit is marked complete. Fill out the blanks below. The document will
                    be formatted properly with the USeP header upon clicking "Release &amp; Print".
                </div>

                <div
                    style={{
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        padding: '26px 30px',
                        fontFamily: "'Times New Roman', Times, serif",
                        lineHeight: 2.1,
                        fontSize: '1rem',
                    }}
                >
                    <p style={{ fontWeight: 700, marginBottom: 18 }}>TO WHOM IT MAY CONCERN:</p>

                    <p>
                        This is to certify that <Blank value={patientName(patient)} onChange={() => {}} width={180} /> of{' '}
                        <Blank value={form.affiliation} onChange={(v) => setForm({ ...form, affiliation: v })} width={140} /> has been
                    </p>
                    <p>
                        examined by the undersigned at this office on{' '}
                        <Blank type="date" value={form.exam_date} onChange={(v) => setForm({ ...form, exam_date: v })} width={160} /> and found
                        him/her to be with
                    </p>
                    <Blank
                        value={form.findings}
                        onChange={(v) => setForm({ ...form, findings: v })}
                        width="100%"
                        placeholder="Clinical findings (e.g. Upper Respiratory Tract Infection)"
                    />
                    <p style={{ marginTop: 18 }}>.</p>

                    <p style={{ marginTop: 6 }}>This certification is issued upon his/her request for the purpose of:</p>
                    <Blank
                        value={form.purpose}
                        onChange={(v) => setForm({ ...form, purpose: v })}
                        width="100%"
                        placeholder="e.g. Medical excuse from class / work"
                    />

                    <p style={{ marginTop: 18 }}>
                        Issued Date: <b>{issuedDate}</b> at Davao City, Philippines.
                    </p>

                    <div style={{ marginTop: 50, textAlign: 'right' }}>
                        <Blank
                            value={form.physician_name}
                            onChange={(v) => setForm({ ...form, physician_name: v.toUpperCase() })}
                            width={260}
                        />
                        <div style={{ marginTop: 6, fontSize: '.85rem' }}>
                            License No.{' '}
                            <Blank
                                value={form.license_no}
                                onChange={(v) => setForm({ ...form, license_no: v })}
                                width={130}
                                placeholder="0123456"
                            />
                        </div>
                    </div>
                </div>

                <p className="text-xs text-muted mt8" style={{ fontStyle: 'italic' }}>
                    The physician's typed name and license number above serve as the certificate's signature block.
                </p>

                <div className="modal-footer">
                    <button className="btn btn-outline" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="btn btn-primary" style={{ flex: 1 }} disabled={saving} onClick={handleRelease}>
                        {saving ? 'Releasing…' : <><i className="bi bi-printer"></i> Release &amp; Print</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function DoctorDashboard() {
    const [queue, setQueue] = useState([]);
    const [queueError, setQueueError] = useState('');
    const [loading, setLoading] = useState(true);
    const [toastMsg, setToastMsg] = useState(null);
    const [examineItem, setExamineItem] = useState(null);
    const [section, setSection] = useState('consultations');

    const [certs, setCerts] = useState([]);
    const [certsLoading, setCertsLoading] = useState(true);
    const [reviewCertModal, setReviewCertModal] = useState(null);

    const [labs, setLabs] = useState([]);
    const [labsLoading, setLabsLoading] = useState(true);
    const [attachLabsModal, setAttachLabsModal] = useState(null);

    const fetchLabs = useCallback(async () => {
        try {
            const res = await axios.get('/api/v1/lab-requests', { timeout: 20000, params: { pending: 1 } });
            setLabs(res.data);
        } catch (e) {
            showToast(requestError(e, 'Failed to load lab requests.'), 'error');
        } finally {
            setLabsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (section === 'labs') fetchLabs();
    }, [section, fetchLabs]);

    const [historyVisits, setHistoryVisits] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [summaryModal, setSummaryModal] = useState(null);

    const fetchHistory = useCallback(async () => {
        try {
            const res = await axios.get('/api/v1/queues', { timeout: 20000, params: { completed: 1, assigned_to_me: 1 } });
            setHistoryVisits(res.data);
        } catch (e) {
            showToast(requestError(e, 'Failed to load examination history.'), 'error');
        } finally {
            setHistoryLoading(false);
        }
    }, []);

    useEffect(() => {
        if (section === 'history') fetchHistory();
    }, [section, fetchHistory]);

    function showToast(msg, type = 'success') {
        setToastMsg({ msg, type });
        setTimeout(() => setToastMsg(null), 3000);
    }

    const fetchQueue = useCallback(async () => {
        try {
            const res = await axios.get('/api/v1/queues', { timeout: 20000, params: { assigned_to_me: 1 } });
            setQueue(res.data);
            setQueueError('');
        } catch (e) {
            setQueueError('Unable to load consultations. Retrying automatically.');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchCerts = useCallback(async () => {
        try {
            const res = await axios.get('/api/v1/medical-certificates', { timeout: 20000, params: { released: 0 } });
            setCerts(res.data);
        } catch (e) {
            showToast(requestError(e, 'Failed to load certificate requests.'), 'error');
        } finally {
            setCertsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchQueue();
        const id = setInterval(fetchQueue, 15000);
        return () => clearInterval(id);
    }, [fetchQueue]);

    useEffect(() => {
        if (section === 'medcert') fetchCerts();
    }, [section, fetchCerts]);

    const active = queue.filter((q) => q.status === 'with-doctor').sort((a, b) => (a.queue_number || 0) - (b.queue_number || 0));

    async function handleQuickComplete(item) {
        if (!confirm(`Mark visit for ${patientName(item.patient)} as completed?`)) return;
        try {
            await axios.put(`/api/v1/queues/${item.queue_id}`, { status: 'examined', time_out: nowTime() });
            showToast('Patient cleared and returned to Nurse Station.');
            fetchQueue();
        } catch (e) {
            showToast(requestError(e, 'Failed to complete the visit.'), 'error');
        }
    }

    return (
        <>
            <Head title="Doctor Dashboard">
                <link rel="stylesheet" href="/assets/css/main.css" />
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
            </Head>

            <div className="layout">
                <Sidebar section={section} onNavigate={setSection} />
                <div className="main-content">
                    {section === 'consultations' && (
                        <>
                            <div className="page-header">
                                <h1>Medical Consultations</h1>
                                <p>Patients endorsed to you, waiting for examination.</p>
                            </div>
                            <div className="card">
                                <div className="card-title">Patient Queue</div>
                                <div className="table-wrap">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Queue #</th>
                                                <th>Patient Name</th>
                                                <th>Purpose</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading && (
                                                <TableSkeletonRows columns={5} />
                                            )}
                                            {queueError && <tr><td colSpan={5} role="alert">{queueError}</td></tr>}
                                            {!loading && !queueError && active.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                                                        No patients waiting.
                                                    </td>
                                                </tr>
                                            )}
                                            {<PaginatedItems items={active} tableColumns={5} label="active">{(q) => (
                                                <ConsultRow
                                                    key={q.queue_id}
                                                    item={q}
                                                    onExamine={() => setExamineItem(q)}
                                                    onQuickComplete={() => handleQuickComplete(q)}
                                                />
                                            )}</PaginatedItems>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {section === 'medcert' && <MedCertListDoctor certs={certs} loading={certsLoading} onReview={setReviewCertModal} />}

                    {section === 'labs' && <LabRequestsList labs={labs} loading={labsLoading} onAttach={setAttachLabsModal} />}

                    {section === 'records' && <DoctorRecordManagement showToast={showToast} />}

                    {section === 'history' && (
                        <ExaminationHistory visits={historyVisits} loading={historyLoading} onViewSummary={setSummaryModal} />
                    )}
                </div>
            </div>

            {examineItem && (
                <ExamineModal
                    item={examineItem}
                    showToast={showToast}
                    onClose={() => setExamineItem(null)}
                    onFinalized={() => {
                        setExamineItem(null);
                        fetchQueue();
                    }}
                />
            )}

            {reviewCertModal && (
                <ReviewMedCertModal
                    cert={reviewCertModal}
                    showToast={showToast}
                    onClose={() => setReviewCertModal(null)}
                    onReleased={() => {
                        setReviewCertModal(null);
                        fetchCerts();
                    }}
                />
            )}

            {attachLabsModal && (
                <AttachLabResultsModal
                    group={attachLabsModal}
                    showToast={showToast}
                    onClose={() => setAttachLabsModal(null)}
                    onSaved={() => {
                        setAttachLabsModal(null);
                        fetchLabs();
                    }}
                />
            )}

            {summaryModal && <ExamSummaryModal visit={summaryModal} onClose={() => setSummaryModal(null)} />}

            {toastMsg && <div className={`toast toast-${toastMsg.type}`}>{toastMsg.msg}</div>}
        </>
    );
}
