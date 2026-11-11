import { ChartNoAxesCombined, Users, ShieldCheck, ClipboardCheck, PanelLeftOpen, PanelLeftClose, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DetailSkeleton, ListSkeleton, TableSkeletonRows, MetricSkeleton, ChartSkeleton } from '@/components/data-skeletons';
import { localToday } from '@/lib/registration-validation.mjs';
import { formatClinicId, formatPhilippineMobile, usepEmailError } from '@/lib/input-validation.mjs';
import PaginatedItems from '../../components/paginated-items.jsx';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import axios from 'axios';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const ROLE_LABELS = { admin: 'Admin', doctor: 'Doctor', nurse: 'Nurse' };
const ID_PREFIX = { nurse: 'N-', doctor: 'D-', admin: 'A-' };

function fullName(p) {
    if (!p) return '';
    return [p.firstname, p.lastname].filter(Boolean).join(' ');
}

function errMsg(e, fallback) {
    const d = e.response?.data;
    if (d?.errors) return Object.values(d.errors)[0]?.[0] || fallback;
    return d?.message || fallback;
}

const pad = (n) => String(n).padStart(2, '0');
const fmtLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function parseLocal(str) {
    const [y, m, d] = String(str).split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
}

let chartJsPromise = null;
function loadChartJs() {
    if (window.Chart) return Promise.resolve(window.Chart);
    if (!chartJsPromise) {
        chartJsPromise = new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
            s.onload = () => resolve(window.Chart);
            s.onerror = () => {
                chartJsPromise = null;
                reject(new Error('Chart.js failed to load'));
            };
            document.head.appendChild(s);
        });
    }
    return chartJsPromise;
}

// ─────────────────────────────────────────────────────────────
// Sidebar (legacy #page-admin design)
// ─────────────────────────────────────────────────────────────
function Sidebar({ section, onNavigate }) {
 const {auth}=usePage().props;const user=auth?.user;
 const items=[['analytics','Reports',ChartNoAxesCombined],['accounts','Account Management',Users],['authorization','Authorization Management',ShieldCheck],['validation','Record Validation',ClipboardCheck]];
 return <aside className="canvas-sidebar" id="admin-sidebar"><a href="/" className="canvas-brand"><img src="/assets/img/University of Southeastern Philippines Seal.png" width="44" height="44" alt="USeP home"/><span>USeP Clinic<small>Administration</small></span></a><div className="canvas-nav-area"><p className="canvas-nav-label">Workspace</p><nav aria-label="Administration">{items.map(([key,label,Icon])=><button key={key} type="button" className={section===key?'active':''} aria-current={section===key?'page':undefined} title={label} aria-label={label} onClick={()=>onNavigate(key)}><Icon size={18} aria-hidden="true"/><span>{label}</span></button>)}</nav></div><div className="canvas-user"><div><strong>{user?fullName(user):'Administrator'}</strong><small>Clinic administrator</small></div><button type="button" title="Sign out" aria-label="Sign out" onClick={()=>router.post('/logout')}><LogOut size={18}/><span>Sign out</span></button></div></aside>;
}

// ─────────────────────────────────────────────────────────────
// Analytics & Statistics (filters, KPIs, charts, grouped table)
// ─────────────────────────────────────────────────────────────
function groupVisits(rows, groupBy) {
    const groups = {};
    rows.forEach((r) => {
        let key = r.date;
        let sort = r.date;
        if (groupBy === 'week') {
            const d = parseLocal(r.date);
            const day = d.getDay();
            const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day + (day === 0 ? -6 : 1));
            sort = fmtLocal(monday);
            key = `Week of ${sort}`;
        } else if (groupBy === 'month') {
            const d = parseLocal(r.date);
            key = d.toLocaleString('default', { month: 'long', year: 'numeric' });
            sort = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
        }
        if (!groups[key]) groups[key] = { key, sort, total: 0, checkup: 0, medicine: 0, followup: 0, medcert: 0 };
        groups[key].total++;
        if (r.type === 'checkup') groups[key].checkup++;
        if (r.type === 'medicine') groups[key].medicine++;
        if (r.type === 'follow-up') groups[key].followup++;
        if (r.type === 'medcert') groups[key].medcert++;
    });
    return Object.values(groups).sort((a, b) => (a.sort < b.sort ? 1 : -1));
}

function AnalyticsSection({ showToast }) {
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [q, setQ] = useState('');
    const [college, setCollege] = useState('');
    const [year, setYear] = useState('');
    const [staffFilter, setStaffFilter] = useState('');
    const [groupBy, setGroupBy] = useState('day');
    const [chartReady, setChartReady] = useState(!!window.Chart);

    const trendRef = useRef(null);
    const dayRef = useRef(null);
    const typeRef = useRef(null);
    const charts = useRef({});

    useEffect(() => {
        axios.get('/api/v1/queues', { timeout: 20000, params: { completed: 1 } })
            .then((res) => setVisits(res.data))
            .catch(() => setLoadError('Unable to load consultation data. Please refresh to try again.'))
            .finally(() => setLoading(false));
        loadChartJs()
            .then(() => setChartReady(true))
            .catch(() => showToast('Charts could not load (check your internet connection).', 'error'));
    }, []);

    const rows = useMemo(
        () =>
            visits.map((v) => ({
                date: v.date,
                name: fullName(v.patient),
                patientId: v.patient?.clinic_id || '',
                college: v.patient?.ppr_permanent?.college_dept || '',
                year: v.patient?.ppr_permanent?.year_level || '',
                doctor: v.endorsement?.doctor ? fullName(v.endorsement.doctor) : '',
                type: v.visit_type,
            })).filter((r) => r.date),
        [visits]
    );

    const colleges = [...new Set(rows.map((r) => r.college).filter(Boolean))];
    const years = [...new Set(rows.map((r) => r.year).filter(Boolean))];
    const staffOptions = [...new Set(rows.map((r) => r.doctor).filter(Boolean))];

    const filtered = useMemo(() => {
        const ql = q.trim().toLowerCase();
        return rows.filter((r) => {
            if (ql && !r.name.toLowerCase().includes(ql) && !String(r.patientId).toLowerCase().includes(ql)) return false;
            if (college && r.college !== college) return false;
            if (year && r.year !== year) return false;
            if (staffFilter && r.doctor !== staffFilter) return false;
            return true;
        });
    }, [rows, q, college, year, staffFilter]);

    const uniqueDates = [...new Set(filtered.map((r) => r.date))];
    const avgPerDay = uniqueDates.length ? (filtered.length / uniqueDates.length).toFixed(1) : '0';
    const table = useMemo(() => groupVisits(filtered, groupBy), [filtered, groupBy]);

    useEffect(() => {
        if (!chartReady || !window.Chart) return;
        const Chart = window.Chart;
        Object.values(charts.current).forEach((c) => c && c.destroy());
        charts.current = {};

        const dateGroups = {};
        filtered.forEach((r) => {
            dateGroups[r.date] = (dateGroups[r.date] || 0) + 1;
        });
        const sortedDates = Object.keys(dateGroups).sort();

        if (trendRef.current) {
            charts.current.trend = new Chart(trendRef.current, {
                type: 'line',
                data: {
                    labels: sortedDates,
                    datasets: [
                        {
                            label: 'Total Consultations',
                            data: sortedDates.map((d) => dateGroups[d]),
                            borderColor: '#7B1113',
                            backgroundColor: 'rgba(123,17,19,0.1)',
                            borderWidth: 3,
                            tension: 0.3,
                            fill: true,
                            pointBackgroundColor: '#C9A227',
                            pointRadius: 4,
                        },
                    ],
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } },
            });
        }

        if (dayRef.current) {
            const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            const occurrences = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set(), 5: new Set() };
            filtered.forEach((r) => {
                const idx = parseLocal(r.date).getDay();
                if (idx >= 1 && idx <= 5) {
                    counts[idx]++;
                    occurrences[idx].add(r.date);
                }
            });
            const avgData = [1, 2, 3, 4, 5].map((i) => (counts[i] === 0 ? 0 : Number((counts[i] / (occurrences[i].size || 1)).toFixed(1))));
            charts.current.day = new Chart(dayRef.current, {
                type: 'pie',
                data: {
                    labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                    datasets: [{ data: avgData, backgroundColor: ['#7B1113', '#9B1E20', '#C9A227', '#1A3A6B', '#2D6A2D'], borderWidth: 1 }],
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } },
            });
        }

        if (typeRef.current) {
            const t = { checkup: 0, medicine: 0, 'follow-up': 0, medcert: 0 };
            filtered.forEach((r) => {
                if (t[r.type] !== undefined) t[r.type]++;
            });
            charts.current.type = new Chart(typeRef.current, {
                type: 'bar',
                data: {
                    labels: ['Check-up', 'Med Request', 'Follow-up', 'Med Cert'],
                    datasets: [
                        {
                            label: 'Count',
                            data: [t.checkup, t.medicine, t['follow-up'], t.medcert],
                            backgroundColor: ['#7B1113', '#C9A227', '#1A3A6B', '#2D6A2D'],
                            borderRadius: 4,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                },
            });
        }

        return () => {
            Object.values(charts.current).forEach((c) => c && c.destroy());
            charts.current = {};
        };
    }, [chartReady, filtered]);

    return (
        <>
            <div className="page-header">
                <h1>Reports</h1>

            </div>

            <div className="card canvas-report-panel" style={{ marginBottom: 20 }}>
                <div className="card-title" style={{ fontSize: '0.9rem' }}>
                    <i className="bi bi-funnel"></i> Filter Data
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <div className="field mb0">
                        <div className="text-xs text-muted mb4">Search Patient</div>
                        <input placeholder="Name or ID..." value={q} onChange={(e) => setQ(e.target.value)} />
                    </div>
                    <div className="field mb0">
                        <div className="text-xs text-muted mb4">College</div>
                        <select value={college} onChange={(e) => setCollege(e.target.value)}>
                            <option value="">All Colleges</option>
                            {colleges.map((c) => (
                                <option key={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div className="field mb0">
                        <div className="text-xs text-muted mb4">Year Level</div>
                        <select value={year} onChange={(e) => setYear(e.target.value)}>
                            <option value="">All Years</option>
                            {years.map((y) => (
                                <option key={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <div className="field mb0">
                        <div className="text-xs text-muted mb4">Handled By (Staff)</div>
                        <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)}>
                            <option value="">All Staff</option>
                            {staffOptions.map((s) => (
                                <option key={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div className="stat-card">
                    <div className="stat-num">{loading ? <MetricSkeleton /> : loadError ? '—' : filtered.length}</div>
                    <div className="stat-label">Total Consultations Filtered</div>
                </div>
                <div className="stat-card">
                    <div className="stat-num" style={{ color: 'var(--gold)' }}>
                        {loading ? <MetricSkeleton /> : loadError ? '—' : avgPerDay}
                    </div>
                    <div className="stat-label">Overall Average / Day</div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-title">Overall Consultation Trends</div>
                <div style={{ position: 'relative', height: 250 }}>
                    {loading && <ChartSkeleton />}{!loading && (loadError || !filtered.length) && <p role={loadError ? "alert" : undefined}>{loadError || "No consultation data for these filters."}</p>}<canvas ref={trendRef} style={{ visibility: loading || loadError || !filtered.length ? 'hidden' : 'visible' }}></canvas>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div className="card">
                    <div className="card-title">Average Consults by Day of Week</div>
                    <div style={{ position: 'relative', height: 250 }}>
                        {loading && <ChartSkeleton />}{!loading && (loadError || !filtered.length) && <p role={loadError ? "alert" : undefined}>{loadError || "No consultation data for these filters."}</p>}<canvas ref={dayRef} style={{ visibility: loading || loadError || !filtered.length ? 'hidden' : 'visible' }}></canvas>
                    </div>
                </div>
                <div className="card">
                    <div className="card-title">Consultation Types Comparison</div>
                    <div style={{ position: 'relative', height: 250 }}>
                        {loading && <ChartSkeleton />}{!loading && (loadError || !filtered.length) && <p role={loadError ? "alert" : undefined}>{loadError || "No consultation data for these filters."}</p>}<canvas ref={typeRef} style={{ visibility: loading || loadError || !filtered.length ? 'hidden' : 'visible' }}></canvas>
                    </div>
                </div>
            </div>

            <div className="card canvas-report-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border)', marginBottom: 16 }}>
                    <div className="card-title" style={{ marginBottom: 0 }}>
                        Consultation Data Table
                    </div>
                    <div className="tabs" style={{ border: 'none', marginBottom: 0 }}>
                        {[
                            ['day', 'Daily'],
                            ['week', 'Weekly'],
                            ['month', 'Monthly'],
                        ].map(([k, label]) => (
                            <button key={k} className={`tab ${groupBy === k ? 'active' : ''}`} onClick={() => setGroupBy(k)}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
                {!table.length ? (
                    <div className="empty-state">
                        {loading ? <ListSkeleton columns={6} /> : <p role={loadError ? 'alert' : undefined}>{loadError || 'No data matches the selected filters.'}</p>}
                    </div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Time Period</th>
                                    <th>Total Patients</th>
                                    <th>Check-ups</th>
                                    <th>Med Requests</th>
                                    <th>Follow-ups</th>
                                    <th>Med Certs</th>
                                </tr>
                            </thead>
                            <tbody>
                                {<PaginatedItems items={table} tableColumns={6} label="table">{(g) => (
                                    <tr key={g.key}>
                                        <td className="fw6">{g.key}</td>
                                        <td>
                                            <span className="badge b-blue" style={{ fontSize: '0.9rem' }}>
                                                {g.total}
                                            </span>
                                        </td>
                                        <td>{g.checkup}</td>
                                        <td>{g.medicine}</td>
                                        <td>{g.followup}</td>
                                        <td>{g.medcert}</td>
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
// Account Creation & Management
// ─────────────────────────────────────────────────────────────
const emptyForm = (role = 'nurse') => ({
    role,
    firstname: '',
    middlename: '',
    lastname: '',
    sex: 'Male',
    dob: '',
    mobile_no: '',
    landline_no: '',
    usep_email: '',
    address_block: '',
    address_street: '',
    address_brgy: '',
    address_city: '',
    address_province: '',
    employment_status: 'Full-time',
    schedule: '',
    role_description: '',
    clinic_id: ID_PREFIX[role],
    password: '',
});

function EditStaffModal({ member, onClose, onSaved, showToast }) {
    const p = member.profile || {};
    const [form, setForm] = useState({
        firstname: member.firstname || '',
        middlename: member.middlename || '',
        lastname: member.lastname || '',
        usep_email: member.email || '',
        sex: p.sex || 'Male',
        dob: p.dob || '',
        mobile_no: p.mobile_no || '',
        landline_no: p.landline_no || '',
        address_block: p.address_block || '',
        address_street: p.address_street || '',
        address_brgy: p.address_brgy || '',
        address_city: p.address_city || '',
        address_province: p.address_province || '',
        employment_status: p.employment_status || 'Full-time',
        schedule: p.schedule || '',
        role_description: p.role_description || '',
    });
    const [saving, setSaving] = useState(false);
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    async function handleSave() {
        if (!form.firstname.trim() || !form.lastname.trim() || !form.usep_email.trim()) {
            showToast('First name, last name and email are required.', 'error');
            return;
        }
        const emailErr = usepEmailError(form.usep_email);
        if (emailErr) {
            showToast(emailErr, 'error');
            return;
        }
        if (form.mobile_no && !/^09\d{2}-?\d{3}-?\d{4}$/.test(form.mobile_no.trim()) && !/^09\d{9}$/.test(form.mobile_no.trim())) {
            showToast('Enter a valid mobile number (e.g. 0912-345-6789 or 09123456789).', 'error');
            return;
        }
        setSaving(true);
        try {
            await axios.put(`/api/records/staff/${member.id}`, form);
            showToast('Staff profile updated successfully!');
            onSaved();
        } catch (e) {
            showToast(errMsg(e, 'Failed to update the staff profile.'), 'error');
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
                <div className="card-title" style={{ marginBottom: 4 }}>
                    <i className="bi bi-pencil-square"></i> Edit Staff Profile
                </div>
                <div className="text-sm text-muted mb16">
                    <b>{member.clinicId}</b> · {(member.role || '').toUpperCase()}
                </div>
                <div style={{ maxHeight: '58vh', overflowY: 'auto', paddingRight: 8 }}>
                    <div className="card-title" style={{ fontSize: '.9rem', color: 'var(--maroon)' }}>
                        <i className="bi bi-person-badge"></i> 1. Personal &amp; Contact
                    </div>
                    <div className="grid3">
                        <div className="field"><label>First Name *</label><input maxLength={100} value={form.firstname} onChange={set('firstname')} /></div>
                        <div className="field"><label>Middle Name</label><input maxLength={100} value={form.middlename} onChange={set('middlename')} /></div>
                        <div className="field"><label>Last Name *</label><input maxLength={100} value={form.lastname} onChange={set('lastname')} /></div>
                    </div>
                    <div className="grid3">
                        <div className="field">
                            <label>Sex *</label>
                            <select value={form.sex} onChange={set('sex')}>
                                <option>Male</option>
                                <option>Female</option>
                            </select>
                        </div>
                        <div className="field"><label>Date of Birth *</label><input type="date" max={localToday()} value={form.dob} onChange={set('dob')} /></div>
                        <div className="field"><label>Mobile No. *</label><input placeholder="09XXXXXXXXX" maxLength={11} inputMode="numeric" value={form.mobile_no} onChange={(e) => setForm({ ...form, mobile_no: formatPhilippineMobile(e.target.value) })} /></div>
                    </div>
                    <div className="grid2">
                        <div className="field"><label>Landline No.</label><input placeholder="(082) xxx-xxxx" maxLength={20} value={form.landline_no} onChange={set('landline_no')} /></div>
                        <div className="field"><label>USeP Email *</label><input type="email" placeholder="staff@usep.edu.ph" maxLength={150} pattern="^[A-Za-z0-9._%+\-]+@usep\.edu\.ph$" value={form.usep_email} onChange={set('usep_email')} /></div>
                    </div>
                    <div className="card-title mt16" style={{ fontSize: '.9rem', color: 'var(--maroon)' }}>
                        <i className="bi bi-geo-alt"></i> 2. Complete Address
                    </div>
                    <div className="grid3">
                        <div className="field"><label>Block/House No.</label><input maxLength={50} value={form.address_block} onChange={set('address_block')} /></div>
                        <div className="field"><label>Street</label><input maxLength={100} value={form.address_street} onChange={set('address_street')} /></div>
                        <div className="field"><label>Barangay *</label><input maxLength={100} value={form.address_brgy} onChange={set('address_brgy')} /></div>
                    </div>
                    <div className="grid2">
                        <div className="field"><label>City/Municipality *</label><input maxLength={100} value={form.address_city} onChange={set('address_city')} /></div>
                        <div className="field"><label>Province</label><input maxLength={100} value={form.address_province} onChange={set('address_province')} /></div>
                    </div>
                    <div className="card-title mt16" style={{ fontSize: '.9rem', color: 'var(--maroon)' }}>
                        <i className="bi bi-briefcase"></i> 3. Employment Details
                    </div>
                    <div className="grid3 mb16">
                        <div className="field">
                            <label>Status *</label>
                            <select value={form.employment_status} onChange={set('employment_status')}>
                                <option>Full-time</option>
                                <option>Part-time</option>
                                <option>Contractual</option>
                            </select>
                        </div>
                        <div className="field"><label>Schedule *</label><input maxLength={255} value={form.schedule} onChange={set('schedule')} /></div>
                        <div className="field"><label>Role Description</label><input value={form.role_description} onChange={set('role_description')} /></div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-outline" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="btn btn-primary" disabled={saving} onClick={handleSave}>
                        {saving ? 'Saving…' : <><i className="bi bi-check-circle"></i> Save Changes</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ResetPasswordModal({ member, onClose, showToast }) {
    const [pw, setPw] = useState('');
    const [pw2, setPw2] = useState('');
    const [saving, setSaving] = useState(false);

    async function handleReset() {
        if (pw.length < 8) {
            showToast('Password must be at least 8 characters.', 'error');
            return;
        }
        if (pw !== pw2) {
            showToast('The two passwords do not match.', 'error');
            return;
        }
        setSaving(true);
        try {
            await axios.put(`/api/records/staff/${member.id}/password`, { password: pw });
            showToast('Password reset successfully.');
            onClose();
        } catch (e) {
            showToast(errMsg(e, 'Failed to reset the password.'), 'error');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal" style={{ maxWidth: 440 }}>
                <button className="modal-close" onClick={onClose}>
                    &times;
                </button>
                <div className="card-title" style={{ marginBottom: 4 }}>
                    <i className="bi bi-key"></i> Reset Password
                </div>
                <div className="text-sm text-muted mb16">
                    {member.name} · <b>{member.clinicId}</b>
                </div>
                <div className="field">
                    <label>New Password (min 8 characters)</label>
                    <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
                </div>
                <div className="field">
                    <label>Confirm New Password</label>
                    <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
                </div>
                <div className="modal-footer">
                    <button className="btn btn-outline" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="btn btn-primary" disabled={saving} onClick={handleReset}>
                        {saving ? 'Saving…' : 'Reset Password'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function AccountsSection({ staff, loading, patientCount, showToast, reload }) {
    const { auth } = usePage().props;
    const myId = auth?.user?.user_id;
    const [form, setForm] = useState(emptyForm('nurse'));
    const [creating, setCreating] = useState(false);
    const [editMember, setEditMember] = useState(null);
    const [resetMember, setResetMember] = useState(null);

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
    const count = (role) => staff.filter((u) => u.role === role && u.is_active).length;

    function pickRole(role) {
        setForm({ ...form, role, clinic_id: ID_PREFIX[role] });
    }

    async function handleCreate() {
        const required = ['firstname', 'lastname', 'sex', 'dob', 'mobile_no', 'usep_email', 'address_brgy', 'address_city', 'employment_status', 'schedule'];
        const missing = required.some((k) => !String(form[k] || '').trim());
        if (missing || form.clinic_id.trim().length <= 2 || form.password.length < 8) {
            showToast('Please fill all required (*) fields. Password min 8 chars.', 'error');
            return;
        }
        if (!/^[ADN]-\d{3}$/.test(form.clinic_id.trim())) {
            showToast('Clinic ID must match staff format (A-001, D-001, or N-001).', 'error');
            return;
        }
        const emailErr = usepEmailError(form.usep_email);
        if (emailErr) {
            showToast(emailErr, 'error');
            return;
        }
        if (form.mobile_no && !/^09\d{9}$/.test(form.mobile_no.replace(/\D/g, ''))) {
            showToast('Mobile number must be a valid 11-digit Philippine mobile (09XXXXXXXXX).', 'error');
            return;
        }
        setCreating(true);
        try {
            await axios.post('/staff', form);
            showToast(`Account for ${form.firstname} created successfully!`);
            setForm(emptyForm(form.role));
            reload();
        } catch (e) {
            showToast(errMsg(e, 'Failed to create the account.'), 'error');
        } finally {
            setCreating(false);
        }
    }

    async function toggleActive(member) {
        const disabling = member.is_active;
        const msg = disabling
            ? `Disable ${member.name}? They will no longer be able to log in.`
            : `Re-enable ${member.name}? They will be able to log in again.`;
        if (!confirm(msg)) return;
        try {
            await axios.put(`/api/records/staff/${member.id}/status`, { is_active: !member.is_active });
            showToast(disabling ? 'Staff account disabled.' : 'Staff account re-enabled.');
            reload();
        } catch (e) {
            showToast(errMsg(e, 'Failed to update the account status.'), 'error');
        }
    }

    return (
        <>
            <div className="page-header">
                <h1>Account Creation &amp; Management</h1>
                <p>Manage staff accounts — nurses, doctors, and administrators.</p>
            </div>

            <div className="stats-row mb16">
                <div className="stat-card">
                    <div className="stat-num" style={{ color: 'var(--maroon)' }}>{count('nurse')}</div>
                    <div className="stat-label">NURSES</div>
                </div>
                <div className="stat-card">
                    <div className="stat-num" style={{ color: 'var(--gold)' }}>{count('doctor')}</div>
                    <div className="stat-label">DOCTORS</div>
                </div>
                <div className="stat-card">
                    <div className="stat-num" style={{ color: 'var(--blue)' }}>{count('admin')}</div>
                    <div className="stat-label">ADMINS</div>
                </div>
                <div className="stat-card">
                    <div className="stat-num" style={{ color: 'var(--green)' }}>{patientCount ?? '…'}</div>
                    <div className="stat-label">PATIENTS</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1fr)', gap: 20, alignItems: 'start' }}>
                <div className="card">
                    <div className="card-title">Create Staff Account</div>
                    <div className="tabs mb16">
                        {['nurse', 'doctor', 'admin'].map((r) => (
                            <button key={r} className={`tab ${form.role === r ? 'active' : ''}`} onClick={() => pickRole(r)}>
                                {ROLE_LABELS[r]}
                            </button>
                        ))}
                    </div>

                    <div className="card-title" style={{ fontSize: '.9rem', color: 'var(--maroon)' }}>
                        <i className="bi bi-person-badge"></i> 1. Personal &amp; Contact
                    </div>
                    <div className="grid3">
                        <div className="field"><label>First Name *</label><input placeholder="Juan" maxLength={100} value={form.firstname} onChange={set('firstname')} /></div>
                        <div className="field"><label>Middle Name</label><input placeholder="Santos" maxLength={100} value={form.middlename} onChange={set('middlename')} /></div>
                        <div className="field"><label>Last Name *</label><input placeholder="dela Cruz" maxLength={100} value={form.lastname} onChange={set('lastname')} /></div>
                    </div>
                    <div className="grid3">
                        <div className="field">
                            <label>Sex *</label>
                            <select value={form.sex} onChange={set('sex')}>
                                <option>Male</option>
                                <option>Female</option>
                            </select>
                        </div>
                        <div className="field"><label>Date of Birth *</label><input type="date" max={localToday()} value={form.dob} onChange={set('dob')} /></div>
                        <div className="field"><label>Mobile No. *</label><input placeholder="09XXXXXXXXX" maxLength={11} inputMode="numeric" value={form.mobile_no} onChange={(e) => setForm({ ...form, mobile_no: formatPhilippineMobile(e.target.value) })} /></div>
                    </div>
                    <div className="grid2">
                        <div className="field"><label>Landline No.</label><input placeholder="(082) xxx-xxxx" maxLength={20} value={form.landline_no} onChange={set('landline_no')} /></div>
                        <div className="field"><label>USeP Email *</label><input type="email" placeholder="staff@usep.edu.ph" maxLength={150} pattern="^[A-Za-z0-9._%+\-]+@usep\.edu\.ph$" value={form.usep_email} onChange={set('usep_email')} /></div>
                    </div>

                    <div className="card-title mt16" style={{ fontSize: '.9rem', color: 'var(--maroon)' }}>
                        <i className="bi bi-geo-alt"></i> 2. Complete Address
                    </div>
                    <div className="grid3">
                        <div className="field"><label>Block/House No.</label><input placeholder="Blk 1 Lot 2" maxLength={50} value={form.address_block} onChange={set('address_block')} /></div>
                        <div className="field"><label>Street</label><input placeholder="Main St." maxLength={100} value={form.address_street} onChange={set('address_street')} /></div>
                        <div className="field"><label>Barangay *</label><input placeholder="Obrero" maxLength={100} value={form.address_brgy} onChange={set('address_brgy')} /></div>
                    </div>
                    <div className="grid2">
                        <div className="field"><label>City/Municipality *</label><input placeholder="Davao City" maxLength={100} value={form.address_city} onChange={set('address_city')} /></div>
                        <div className="field"><label>Province</label><input placeholder="Davao del Sur" maxLength={100} value={form.address_province} onChange={set('address_province')} /></div>
                    </div>

                    <div className="card-title mt16" style={{ fontSize: '.9rem', color: 'var(--maroon)' }}>
                        <i className="bi bi-briefcase"></i> 3. Employment Details
                    </div>
                    <div className="grid3">
                        <div className="field">
                            <label>Status *</label>
                            <select value={form.employment_status} onChange={set('employment_status')}>
                                <option>Full-time</option>
                                <option>Part-time</option>
                                <option>Contractual</option>
                            </select>
                        </div>
                        <div className="field"><label>Schedule *</label><input placeholder="MWF 8AM-5PM" maxLength={255} value={form.schedule} onChange={set('schedule')} /></div>
                        <div className="field"><label>Role Description</label><input placeholder="e.g. Triage Nurse" value={form.role_description} onChange={set('role_description')} /></div>
                    </div>

                    <div className="card-title mt16" style={{ fontSize: '.9rem', color: 'var(--maroon)' }}>
                        <i className="bi bi-shield-lock"></i> 4. System Credentials
                    </div>
                    <div className="grid2 mb16">
                        <div className="field mb0"><label>Clinic ID Number *</label><input placeholder="N-001" maxLength={5} pattern="^[ADN]-\d{3}$" value={form.clinic_id} onChange={(e) => setForm({ ...form, clinic_id: formatClinicId(e.target.value, 'staff') })} /></div>
                        <div className="field mb0"><label>Password * (min 8)</label><input type="password" placeholder="••••••••" value={form.password} onChange={set('password')} /></div>
                    </div>
                    <button className="btn btn-primary w100" disabled={creating} onClick={handleCreate}>
                        {creating ? 'Creating…' : <><i className="bi bi-person-plus"></i> Create Account</>}
                    </button>
                </div>

                <div className="card">
                    <div className="card-title">Active Staff</div>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name &amp; Role</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <TableSkeletonRows columns={4} />
                                )}
                                {!loading && !staff.length && (
                                    <tr>
                                        <td colSpan={4} className="text-center text-muted p16">No staff found in database.</td>
                                    </tr>
                                )}
                                {<PaginatedItems items={staff} tableColumns={4} label="staff">{(u) => {
                                    const isMe = String(u.id) === String(myId);
                                    return (
                                        <tr key={u.id} style={u.is_active ? undefined : { opacity: 0.6 }}>
                                            <td className="text-xs fw6">{u.clinicId}</td>
                                            <td>
                                                <div className="fw6">
                                                    {u.name} {isMe && <span className="text-xs text-muted">(you)</span>}
                                                </div>
                                                <div className="text-xs text-muted" style={{ textTransform: 'capitalize' }}>{u.role}</div>
                                            </td>
                                            <td>
                                                {u.is_active ? <span className="badge b-green">Active</span> : <span className="badge b-red">Disabled</span>}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button className="btn btn-outline btn-sm" title="Edit Profile" onClick={() => setEditMember(u)}>
                                                        <i className="bi bi-pencil"></i>
                                                    </button>
                                                    <button className="btn btn-outline btn-sm" title="Reset Password" onClick={() => setResetMember(u)}>
                                                        <i className="bi bi-key"></i>
                                                    </button>
                                                    {u.is_active ? (
                                                        <button
                                                            className="btn btn-danger btn-sm"
                                                            title={isMe ? "You can't disable your own account" : 'Disable Account'}
                                                            disabled={isMe}
                                                            onClick={() => toggleActive(u)}
                                                        >
                                                            <i className="bi bi-person-x"></i>
                                                        </button>
                                                    ) : (
                                                        <button className="btn btn-outline btn-sm" title="Re-enable Account" onClick={() => toggleActive(u)}>
                                                            <i className="bi bi-person-check"></i>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }}</PaginatedItems>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {editMember && (
                <EditStaffModal
                    member={editMember}
                    showToast={showToast}
                    onClose={() => setEditMember(null)}
                    onSaved={() => {
                        setEditMember(null);
                        reload();
                    }}
                />
            )}
            {resetMember && <ResetPasswordModal member={resetMember} showToast={showToast} onClose={() => setResetMember(null)} />}
        </>
    );
}

// ─────────────────────────────────────────────────────────────
// System Authorization Management
// ─────────────────────────────────────────────────────────────
const CHECK = <i className="bi bi-check-lg" style={{ color: 'var(--green)' }}></i>;
const PERMISSIONS = [
    ['Patient Registration', CHECK, '', '', CHECK],
    ['Queue Entry', CHECK, '', '', ''],
    ['Queue Monitoring', '', CHECK, '', ''],
    ['Triage Assessment', '', CHECK, '', ''],
    ['Record Management', '', CHECK, '', ''],
    ['Certificate Processing', '', CHECK, '', ''],
    ['Daily Patient Log', '', CHECK, CHECK, CHECK],
    ['Medical Examination', '', '', CHECK, ''],
    ['Prescriptions', '', '', CHECK, ''],
    ['Account Creation', '', '', '', CHECK],
];

function AuthorizationSection({ staff, loading, showToast, reload }) {
    const { auth } = usePage().props;
    const myId = auth?.user?.user_id;
    const [selected, setSelected] = useState('');
    const [newRole, setNewRole] = useState('nurse');
    const [saving, setSaving] = useState(false);

    const options = staff.filter((u) => u.is_active && String(u.id) !== String(myId));
    const selectedStaff = options.find((s) => String(s.id) === String(selected));

    async function handleUpdate() {
        if (!selectedStaff) {
            showToast('Please select a user.', 'error');
            return;
        }
        setSaving(true);
        try {
            await axios.put(`/api/records/staff/${selectedStaff.id}/role`, { role: newRole });
            showToast(`${selectedStaff.name}'s role updated to ${ROLE_LABELS[newRole]}.`);
            setSelected('');
            reload();
        } catch (e) {
            showToast(errMsg(e, 'Failed to update role authorization.'), 'error');
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <div className="page-header">
                <h1>System Authorization Management</h1>
                <p>Control user roles and feature access permissions across the system.</p>
            </div>
            <div className="canvas-authorization">
                <div className="card canvas-role-editor">
                    <div className="card-title"><ShieldCheck size={20} aria-hidden="true" /> Modify user role</div>
                    <div className="text-sm text-muted mb8">Update the role assigned to an existing staff member.</div>
                    <div className="canvas-role-fields mt12">
                        <div className="field">
                            <label htmlFor="role-staff">Select user</label>
                            <select id="role-staff" value={selected} onChange={(e) => setSelected(e.target.value)} disabled={loading}>
                                <option value="">— Select Staff —</option>
                                {options.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name} ({(u.role || '').toUpperCase()})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="role-new">New role</label>
                            <select id="role-new" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                                <option value="nurse">Nurse</option>
                                <option value="doctor">Doctor</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>
                    <button className="btn btn-primary w100 mt8" disabled={saving} onClick={handleUpdate}>
                        {saving ? 'Updating…' : <><i className="bi bi-arrow-repeat"></i> Update Role Authorization</>}
                    </button>
                    <p className="text-xs text-muted mt8">You can't change your own role — ask another admin to do it.</p>
                </div>

                <div className="card canvas-permissions">
                    <div className="card-title">Role permissions overview</div>
                    <p className="text-sm text-muted">Existing feature access by role · Reference only</p>
                    <div className="canvas-role-cards">
                        {['Patient', 'Nurse', 'Doctor', 'Admin'].map((role, index) => {
                            const modules = PERMISSIONS.filter(row => Boolean(row[index + 1]));
                            return <section key={role} className="canvas-role-card">
                                <h2>{role}<span>{modules.length} modules</span></h2>
                                <ul>{modules.map(row => <li key={row[0]}><i className="bi bi-check-lg" aria-hidden="true" />{row[0]}</li>)}</ul>
                            </section>;
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}

// ─────────────────────────────────────────────────────────────
// Record Validation
// ─────────────────────────────────────────────────────────────
function RecordValidation({ data, loading }) {
    const summary = data?.summary;
    const patients = data?.patients || [];

    const ModuleDot = ({ ok }) => (
        <i className={`bi ${ok ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`} style={{ color: ok ? 'var(--green)' : '#C0392B' }}></i>
    );

    return (
        <>
            <div className="page-header">
                <h1>Record Validation</h1>
                <p>Review and validate system data integrity and record completeness.</p>
            </div>

            {loading && <DetailSkeleton />}

            {!loading && summary && (
                <div className="stats-row">
                    <div className="stat-card">
                        <div className="stat-num">{summary.total_patients}</div>
                        <div className="stat-label">Total Patients</div>
                    </div>
                    <div className="stat-card stat-green">
                        <div className="stat-num">{summary.complete_profiles}</div>
                        <div className="stat-label">Complete Profiles</div>
                    </div>
                    <div className="stat-card stat-gold">
                        <div className="stat-num">{summary.incomplete_profiles}</div>
                        <div className="stat-label">Incomplete Profiles</div>
                    </div>
                    <div className="stat-card stat-blue">
                        <div className="stat-num">{summary.total_log_entries}</div>
                        <div className="stat-label">Total Log Entries</div>
                    </div>
                </div>
            )}

            {!loading && (
                <div className="card">
                    <div className="card-title">Patient Record Completeness Report</div>
                    <div className="text-sm text-muted mb12">Identifies which patients are missing critical data modules.</div>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Patient</th>
                                    <th scope="col" style={{ textAlign: 'center' }}>Demographics</th>
                                    <th scope="col" style={{ textAlign: 'center' }}>Health Records</th>
                                    <th scope="col" style={{ textAlign: 'center' }}>Questionnaire</th>
                                    <th scope="col" style={{ textAlign: 'center' }}>Permanent</th>
                                    <th scope="col" style={{ textAlign: 'center' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!patients.length && (
                                    <tr>
                                        <td colSpan={6} className="text-center text-muted p16">No patients registered.</td>
                                    </tr>
                                )}
                                {<PaginatedItems items={patients} tableColumns={6} label="patients">{(p) => (
                                    <tr key={p.id}>
                                        <td>
                                            <div className="fw6">{p.name}</div>
                                            <div className="text-xs text-muted">{p.patientId}</div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}><ModuleDot ok={p.modules.demographics} /></td>
                                        <td style={{ textAlign: 'center' }}><ModuleDot ok={p.modules.health_record} /></td>
                                        <td style={{ textAlign: 'center' }}><ModuleDot ok={p.modules.questionnaire} /></td>
                                        <td style={{ textAlign: 'center' }}><ModuleDot ok={p.modules.permanent} /></td>
                                        <td style={{ textAlign: 'center' }}>
                                            {p.complete ? <span className="badge b-green">Complete</span> : <span className="badge b-yellow">Incomplete</span>}
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

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
export default function AdminAnalytics() {
    const [section, setSection] = useState('analytics');
    const [collapsed, setCollapsed] = useState(false);
    const [toastMsg, setToastMsg] = useState(null);

    const showToast = useCallback((msg, type = 'success') => {
        setToastMsg({ msg, type });
        setTimeout(() => setToastMsg(null), 3200);
    }, []);

    const [patientCount, setPatientCount] = useState(null);
    useEffect(() => {
        axios.get('/api/v1/admin/stats', { timeout: 20000 })
            .then((res) => setPatientCount(res.data.total_patients))
            .catch(() => {});
    }, []);

    const [staffList, setStaffList] = useState([]);
    const [staffLoading, setStaffLoading] = useState(true);
    const fetchStaff = useCallback(async () => {
        try {
            const res = await axios.get('/api/records/staff', { timeout: 20000 });
            setStaffList(res.data.staff);
        } catch (e) {
            showToast('Failed to load staff list.', 'error');
        } finally {
            setStaffLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        if (section === 'accounts' || section === 'authorization') fetchStaff();
    }, [section, fetchStaff]);

    const [validationData, setValidationData] = useState(null);
    const [validationLoading, setValidationLoading] = useState(true);
    useEffect(() => {
        if (section !== 'validation') return;
        setValidationLoading(true);
        axios.get('/api/records/validation', { timeout: 20000 })
            .then((res) => setValidationData(res.data))
            .catch(() => showToast('Failed to load record validation data.', 'error'))
            .finally(() => setValidationLoading(false));
    }, [section, showToast]);

    return (
        <>
            <Head title="Admin Dashboard">
                <link rel="stylesheet" href="/assets/css/main.css" />
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
            </Head>

            <div className={`layout canvas-admin ${collapsed ? 'canvas-collapsed' : ''}`}>
                <Sidebar section={section} onNavigate={setSection} />
                <div className="main-content"><div className="canvas-topbar"><Button variant="ghost" size="icon" aria-label={collapsed?'Expand sidebar':'Collapse sidebar'} aria-expanded={!collapsed} aria-controls="admin-sidebar" onClick={()=>setCollapsed(v=>!v)}>{collapsed?<PanelLeftOpen/>:<PanelLeftClose/>}</Button><strong>{{analytics:'Reports',accounts:'Account Management',authorization:'Authorization Management',validation:'Record Validation'}[section]}</strong><span>USeP · Clinic administration</span></div>
                    <section hidden={section !== 'analytics'}><AnalyticsSection showToast={showToast} /></section>
                    {section === 'accounts' && (
                        <AccountsSection staff={staffList} loading={staffLoading} patientCount={patientCount} showToast={showToast} reload={fetchStaff} />
                    )}
                    {section === 'authorization' && <AuthorizationSection staff={staffList} loading={staffLoading} showToast={showToast} reload={fetchStaff} />}
                    {section === 'validation' && <RecordValidation data={validationData} loading={validationLoading} />}
                </div>
            </div>

            {toastMsg && <div className={`toast toast-${toastMsg.type}`}>{toastMsg.msg}</div>}
        </>
    );
}
