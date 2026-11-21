import UCIMSSelect from '@/components/UCIMSSelect';
import { ChartNoAxesCombined, Users, ShieldCheck, ClipboardCheck, PanelLeftOpen, PanelLeftClose, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DetailSkeleton, ListSkeleton, TableSkeletonRows, MetricSkeleton, ChartSkeleton } from '@/components/data-skeletons';
import { localToday, validName, isCalendarDate, minBirthDate, minBirthYear } from '@/lib/registration-validation.mjs';
import { formatClinicId, formatPhilippineMobile, usepEmailError } from '@/lib/input-validation.mjs';
import DatePicker from '../../components/date-picker.jsx';
import PaginatedItems from '../../components/paginated-items.jsx';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { ALL_COLLEGES, ALL_YEAR_LEVELS, sameCollege } from '../../lib/option-order.mjs';
import axios from 'axios';

// --------------------------------------------------
// Helpers
// --------------------------------------------------
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

// Mirrors the Patient Registration validation: letter-only names, a valid
// calendar birthdate within the human range, 11-digit PH mobile, USeP mail,
// and required engagement details. Used for the account creation form.
function staffFormErrors(form) {
    const e = {};
    const blank = (v) => !String(v ?? '').trim();
    ['firstname', 'lastname'].forEach((k) => {
        if (blank(form[k])) e[k] = 'Required.';
        else if (!validName(String(form[k]).trim())) e[k] = 'Use letters, spaces, apostrophes, dots or hyphens.';
    });
    if (!blank(form.middlename) && !validName(String(form.middlename).trim())) {
        e.middlename = 'Use letters, spaces, apostrophes, dots or hyphens.';
    }
    if (blank(form.sex)) e.sex = 'Required.';
    if (blank(form.dob)) e.dob = 'Required.';
    else if (!isCalendarDate(form.dob) || form.dob < minBirthDate()) e.dob = `Enter a valid birthdate after January 1, ${minBirthYear()}.`;
    else if (form.dob > localToday()) e.dob = 'Birthdate cannot be in the future.';
    const mobile = String(form.mobile_no ?? '').replace(/\D/g, '');
    if (blank(form.mobile_no)) e.mobile_no = 'Required.';
    else if (!/^09\d{9}$/.test(mobile)) e.mobile_no = 'Enter a valid 11-digit mobile number (09XXXXXXXXX).';
    if (blank(form.usep_email)) e.usep_email = 'Required.';
    else { const err = usepEmailError(form.usep_email); if (err) e.usep_email = err; }
    if (blank(form.address_brgy)) e.address_brgy = 'Required.';
    if (blank(form.address_city)) e.address_city = 'Required.';
    if (blank(form.employment_status)) e.employment_status = 'Required.';
    if (blank(form.schedule)) e.schedule = 'Required.';
    if (blank(form.clinic_id)) e.clinic_id = 'Required.';
    else if (!/^[ADN]-\d{3}$/.test(String(form.clinic_id).trim())) e.clinic_id = 'Format: N-001, D-001, or A-001.';
    if (!form.password || String(form.password).length < 8) e.password = 'At least 8 characters.';
    return e;
}

const pad = (n) => String(n).padStart(2, '0');
const fmtLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function parseLocal(str) {
    const [y, m, d] = String(str).split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
}

let chartJsPromise = null;

// Diagnoses don't carry a body system, so derive one from the ICD-10 code
// prefix. Text-only diagnoses land in "Not classified".
const CHAPTER_ORDER = ['Infectious', 'Neoplasms', 'Blood & immunity', 'Endocrine', 'Nervous', 'Eye & ear', 'Circulatory', 'Respiratory', 'Digestive', 'Skin', 'Musculoskeletal', 'Genitourinary', 'Pregnancy', 'Perinatal', 'Congenital', 'Symptoms & signs', 'Injury', 'Not classified', 'Other'];

// Out of scope for the clinic's illness statistics: mental health (F-codes)
// and health services / factors influencing health status (Z-codes).
const ILLNESS_EXCLUDED_CHAPTERS = new Set(['Mental health', 'Health services']);

function chapterFor(code) {
    const c = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!c) return 'Not classified';

    const letter = c.charAt(0);
    const num = parseInt(c.slice(1, 3), 10) || 0;

    switch (letter) {
        case 'A': case 'B': return 'Infectious';
        case 'C': return 'Neoplasms';
        case 'D': return num <= 48 ? 'Neoplasms' : 'Blood & immunity';
        case 'E': return 'Endocrine';
        case 'F': return 'Mental health';
        case 'G': return 'Nervous';
        case 'H': return 'Eye & ear';
        case 'I': return 'Circulatory';
        case 'J': return 'Respiratory';
        case 'K': return 'Digestive';
        case 'L': return 'Skin';
        case 'M': return 'Musculoskeletal';
        case 'N': return 'Genitourinary';
        case 'O': return 'Pregnancy';
        case 'P': return 'Perinatal';
        case 'Q': return 'Congenital';
        case 'R': return 'Symptoms & signs';
        case 'S': case 'T': return 'Injury';
        case 'Z': return 'Health services';
        default: return 'Other';
    }
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthKey(dateStr) {
    return String(dateStr || '').slice(0, 7);
}

function monthShort(key) {
    const m = Number(String(key).slice(5, 7));

    return MONTH_LABELS[m - 1] || key;
}

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

// --------------------------------------------------
// Sidebar (legacy #page-admin design)
// --------------------------------------------------
function Sidebar({ section, onNavigate }) {
 const {auth}=usePage().props;const user=auth?.user;
 const items=[['analytics','Reports',ChartNoAxesCombined],['accounts','Account Management',Users],['authorization','Authorization Management',ShieldCheck],['validation','Record Validation',ClipboardCheck]];
 return <aside className="canvas-sidebar" id="admin-sidebar"><a href="/" className="canvas-brand"><img src="/assets/img/University of Southeastern Philippines Seal.png" width="44" height="44" alt="USeP home"/><span>USeP Clinic<small>Administration</small></span></a><div className="canvas-nav-area"><p className="canvas-nav-label">Workspace</p><nav aria-label="Administration">{items.map(([key,label,Icon])=><button key={key} type="button" className={section===key?'active':''} aria-current={section===key?'page':undefined} title={label} aria-label={label} onClick={()=>onNavigate(key)}><Icon size={18} aria-hidden="true"/><span>{label}</span></button>)}</nav></div><div className="canvas-user"><div><strong>{user?fullName(user):'Administrator'}</strong><small>Clinic administrator</small></div><button type="button" title="Sign out" aria-label="Sign out" onClick={()=>router.post('/logout')}><LogOut size={18}/><span>Sign out</span></button></div></aside>;
}

// --------------------------------------------------
// Analytics & Statistics (filters, KPIs, charts, grouped table)
// --------------------------------------------------
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
    const [illnessQ, setIllnessQ] = useState('');
    const [illnessSystem, setIllnessSystem] = useState('All');
    const [conditions, setConditions] = useState([]);
    // The full active clinical staff list for the "Handled By" filter, fetched
// --------------------------------------------------
    // in the loaded rows.
    const [staffOptions, setStaffOptions] = useState([]);
    // All body-system chips are shown for systems with records; empty systems
    // join the chip row only while the toggle is on.
    const [showEmptySystems, setShowEmptySystems] = useState(false);
    // typeof window guard: SSR renders this module in Node too.
    const [chartReady, setChartReady] = useState(() => typeof window !== 'undefined' && !!window.Chart);

    const trendRef = useRef(null);
    const dayRef = useRef(null);
    const typeRef = useRef(null);
    const charts = useRef({});
    // Signature of the last completed-visit payload, so the silent sync below
    // only re-renders (and redraws charts) when a new visit actually landed.
    const liveSignature = useRef('');

    useEffect(() => {
        axios.get('/api/v1/queues', { timeout: 20000, params: { completed: 1, with_conditions: 1 } })
            .then((res) => {
                liveSignature.current = `${res.data.length}:${res.data[0]?.queue_id ?? ''}`;
                setVisits(res.data);
            })
            .catch(() => setLoadError('Unable to load consultation data. Please refresh to try again.'))
            .finally(() => setLoading(false));
        // The standardized catalogue pre-populates the illness tree, so the
        // structure is visible before the first completed visit.
        axios.get('/api/v1/conditions', { timeout: 20000 })
            .then((res) => setConditions(Array.isArray(res.data) ? res.data : []))
            .catch(() => setConditions([]));
// --------------------------------------------------
        // the doctor, triage tags the nurse, so both roles can have handled a
        // completed visit. Admins are management and never handle consultations.
        axios.get('/api/records/staff', { timeout: 20000 })
            .then((res) => {
                // The endpoint wraps the list: { status, staff: [...] }.
                const list = Array.isArray(res.data) ? res.data : (res.data?.staff ?? []);
                setStaffOptions(
                    list
                        .filter((m) => m.is_active !== false && (m.role === 'doctor' || m.role === 'nurse'))
                        .map((m) => m.name)
                        .sort((a, b) => a.localeCompare(b)),
                );
            })
            .catch(() => setStaffOptions([]));
        loadChartJs()
            .then(() => setChartReady(true))
            .catch(() => showToast('Charts could not load (check your internet connection).', 'error'));
    }, []);

    // Keep the reports close to live: a completed consultation appears in the
    // illness tree within a minute, or as soon as the tab is focused again.
    useEffect(() => {
        const sync = () => {
            if (document.visibilityState === 'hidden') return;

            axios.get('/api/v1/queues', { timeout: 20000, params: { completed: 1, with_conditions: 1 } })
                .then((res) => {
                    const signature = `${res.data.length}:${res.data[0]?.queue_id ?? ''}`;
                    if (signature === liveSignature.current) return;

                    liveSignature.current = signature;
                    setVisits(res.data);
                    setLoadError('');
                })
                .catch(() => {});
        };

        const timer = window.setInterval(sync, 60000);
        document.addEventListener('visibilitychange', sync);

        return () => {
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', sync);
        };
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
                nurse: v.triage?.nurse ? fullName(v.triage.nurse) : '',
                type: v.visit_type,
                diagnosis: (v.endorsement?.diagnosis || '').trim(),
                icd: (v.endorsement?.icd_10_code || '').trim(),
                condition: v.condition || null,
            })).filter((r) => r.date),
        [visits]
    );

    const colleges = ALL_COLLEGES;
    const years = ALL_YEAR_LEVELS;

    const filtered = useMemo(() => {
        const ql = q.trim().toLowerCase();
        return rows.filter((r) => {
            if (ql && !r.name.toLowerCase().includes(ql) && !String(r.patientId).toLowerCase().includes(ql)) return false;
            if (college && !sameCollege(r.college, college)) return false;
            if (year && r.year !== year) return false;
            if (staffFilter && r.doctor !== staffFilter && r.nurse !== staffFilter) return false;
            return true;
        });
    }, [rows, q, college, year, staffFilter]);

    const uniqueDates = [...new Set(filtered.map((r) => r.date))];
    const avgPerDay = uniqueDates.length ? (filtered.length / uniqueDates.length).toFixed(1) : '0';
    const table = useMemo(() => groupVisits(filtered, groupBy), [filtered, groupBy]);

    // Illness statistics: one row per standardized condition. The API attaches
    // a resolved `condition` (canonical label + ICD-10 code + body system) to
    // every completed visit, so "cough", "Cough" and "dry cough" count once.
    // Rows the catalogue does not know still appear, flagged as unstandardized.
    const illnesses = useMemo(() => {
        const groups = new Map();

        filtered.forEach((r) => {
            const resolved = r.condition;
            if (!resolved && !r.diagnosis && !r.icd) return;

            const code = String(resolved?.code || r.icd || '').toUpperCase();
            const chapter = resolved?.chapter || chapterFor(code);
            if (ILLNESS_EXCLUDED_CHAPTERS.has(chapter)) return;
            const key = resolved?.key || (code ? `code:${code}` : `text:${r.diagnosis.toLowerCase().replace(/\s+/g, ' ')}`);
            const name = resolved?.label || r.diagnosis || r.icd;
            const month = monthKey(r.date);
            const current = groups.get(key) || {
                key,
                code,
                name,
                count: 0,
                chapter,
                standard: resolved?.standard ?? false,
                months: {},
                variants: {},
            };

            if (name && (!current.name || current.name === current.code)) current.name = name;
            current.count += 1;
            if (month) current.months[month] = (current.months[month] || 0) + 1;

            // Keep the exact wording staff recorded, so the detail pane can
            // show what was folded into each standard condition.
            const recorded = (r.diagnosis || r.icd || '').trim();
            if (recorded) {
                const variantKey = recorded.toLowerCase();
                current.variants[variantKey] = current.variants[variantKey] || { label: recorded, count: 0 };
                current.variants[variantKey].count += 1;
            }

            groups.set(key, current);
        });

        const rows = [...groups.values()].map((row) => {
            const variants = Object.values(row.variants)
                .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

            return {
                ...row,
                variants,
                haystack: `${row.name} ${row.code} ${variants.map((v) => v.label).join(' ')}`.toLowerCase(),
            };
        });

        const total = rows.reduce((sum, row) => sum + row.count, 0);
        const standardized = rows.filter((row) => row.standard).reduce((sum, row) => sum + row.count, 0);

        return {
            total,
            unique: rows.length,
            standardized,
            standardShare: total ? Math.round((standardized / total) * 100) : 0,
            rows: rows
                .map((row) => ({ ...row, percent: total ? Math.round((row.count / total) * 1000) / 10 : 0 }))
                .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
        };
    }, [filtered]);

    const topIllness = illnesses.rows[0];

    // Body-system tree for the Tabbed Explorer detail pane, plus selection
    // state (kept across searches when the condition still matches).
    const [illnessTab, setIllnessTab] = useState('overview');
    const [activeIllnessKey, setActiveIllnessKey] = useState(null);

    // Ranked explorer: recorded conditions drive the list and the system
    // chips; catalogue placeholders join only while searching or when the
    // picked system has no records yet, so the default view stays focused
    // on real diagnoses.
    const catalogueIndex = useMemo(
        () => new Map(conditions.map((entry) => [entry.key, entry])),
        [conditions]
    );

    const cataloguePlaceholders = useMemo(() => {
        const recorded = new Set(illnesses.rows.map((row) => row.key));
        return conditions
            .filter((entry) => !recorded.has(entry.key) && !ILLNESS_EXCLUDED_CHAPTERS.has(entry.chapter || 'Not classified'))
            .map((entry) => ({
                key: entry.key,
                code: entry.code,
                name: entry.label,
                chapter: entry.chapter || 'Not classified',
                standard: true,
                count: 0,
                percent: 0,
                months: {},
                variants: [],
                haystack: `${entry.label} ${entry.code} ${(entry.aliases || []).join(' ')}`.toLowerCase(),
            }));
    }, [conditions, illnesses.rows]);

    const searchNeedle = illnessQ.trim().toLowerCase();
    const searching = searchNeedle.length > 0;

    const rankByKey = useMemo(() => new Map(illnesses.rows.map((row, index) => [row.key, index + 1])), [illnesses.rows]);

    // Chips show recorded systems, biggest workload first; empty systems join
    // the row only while the toggle is on.
    const illnessSystems = useMemo(() => {
        const bySystem = new Map();
        illnesses.rows.forEach((row) => {
            const name = row.chapter || 'Not classified';
            const current = bySystem.get(name) || { name, conditions: 0, cases: 0 };
            current.conditions += 1;
            current.cases += row.count;
            bySystem.set(name, current);
        });
        return [...bySystem.values()].sort(
            (a, b) => b.cases - a.cases || a.name.localeCompare(b.name)
        );
    }, [illnesses.rows]);

    const emptySystemNames = useMemo(() => {
        const seen = new Set(illnessSystems.map((system) => system.name));
        const catalogueSystems = new Set(conditions.map((entry) => entry.chapter || 'Not classified'));
        return [...catalogueSystems]
            .filter((name) => !seen.has(name) && !ILLNESS_EXCLUDED_CHAPTERS.has(name))
            .sort((a, b) => (CHAPTER_ORDER.indexOf(a) - CHAPTER_ORDER.indexOf(b)));
    }, [illnessSystems, conditions]);

    const visibleChips = showEmptySystems
        ? [...illnessSystems, ...emptySystemNames.map((name) => ({ name, conditions: 0, cases: 0 }))]
        : illnessSystems;

    const visibleNodes = useMemo(() => {
        const inSystem = (row) => illnessSystem === 'All' || (row.chapter || 'Not classified') === illnessSystem;
        const matchesSearch = (row) => {
            if (!searchNeedle) return true;
            if (row.haystack.includes(searchNeedle)) return true;
            if (String(row.code || '').toLowerCase().includes(searchNeedle)) return true;
            const aliases = catalogueIndex.get(row.key)?.aliases;
            return Array.isArray(aliases) && aliases.join(' ').toLowerCase().includes(searchNeedle);
        };
        let list = illnesses.rows.filter((row) => inSystem(row) && matchesSearch(row));
        // Placeholders appear while searching or when the picked system has no
        // records yet — never in the default view.
        const systemHasRecords = illnesses.rows.some(inSystem);
        if (searching || (illnessSystem !== 'All' && !systemHasRecords) || !illnesses.rows.length) {
            const placeholders = cataloguePlaceholders.filter((row) => inSystem(row) && matchesSearch(row));
            list = [...list, ...placeholders].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
        }
        return list;
    }, [illnesses.rows, cataloguePlaceholders, illnessSystem, searchNeedle, searching, catalogueIndex]);

    const treeReady = conditions.length > 0 || illnesses.rows.length > 0;

    const activeIllness = visibleNodes.find((row) => row.key === activeIllnessKey)
        ?? visibleNodes.find((row) => row.count > 0)
        ?? visibleNodes[0]
        ?? null;
    const activeIllnessIndex = activeIllness && activeIllness.count
        ? (rankByKey.get(activeIllness.key) ?? 0)
        : 0;
    const activeMax = illnesses.rows[0]?.count ?? 1;
    const recordMonths = useMemo(
        () => [...new Set(filtered.map((r) => monthKey(r.date)).filter(Boolean))].sort(),
        [filtered]
    );
    const trendMonths = recordMonths.slice(-6);
    const activeMonthSeries = activeIllness
        ? trendMonths.map((key) => activeIllness.months[key] || 0)
        : [];
    const activeMonthMax = Math.max(...activeMonthSeries, 1);
    const activeTrendTotal = activeMonthSeries.reduce((sum, value) => sum + value, 0);
    const sameSystem = activeIllness
        ? illnesses.rows.filter((row) => row.chapter === activeIllness.chapter && row.key !== activeIllness.key)
        : [];
    const activeShare = activeIllness ? activeIllness.percent : 0;

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
            // Stripe-style structure recolored to UCIMS maroon/gold: a soft
            // gradient area fill, a single clean maroon line, and restrained
            // gridlines. Dates are shown in human form on the X axis, and a
            // hover tooltip reveals the exact date and consultation count.
            const gradient = trendRef.current.getContext('2d').createLinearGradient(0, 0, 0, 260);
            gradient.addColorStop(0, 'rgba(123,17,19,0.22)');
            gradient.addColorStop(1, 'rgba(123,17,19,0)');
            const humanDate = (iso) => {
                const d = parseLocal(iso);
                return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
            };

            charts.current.trend = new Chart(trendRef.current, {
                type: 'line',
                data: {
                    labels: sortedDates,
                    datasets: [
                        {
                            label: 'Total Consultations',
                            data: sortedDates.map((d) => dateGroups[d]),
                            borderColor: '#7B1113',
                            backgroundColor: gradient,
                            borderWidth: 2.5,
                            tension: 0.35,
                            fill: true,
                            pointBackgroundColor: '#fff',
                            pointBorderColor: '#7B1113',
                            pointBorderWidth: 2,
                            pointRadius: 3,
                            pointHoverRadius: 6,
                            pointHoverBackgroundColor: '#7B1113',
                            pointHoverBorderColor: '#fff',
                            pointHoverBorderWidth: 2,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'nearest', intersect: false, axis: 'x' },
                    layout: { padding: { top: 8, right: 8 } },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            align: 'end',
                            labels: { color: '#4a4446', usePointStyle: true, pointStyle: 'circle', boxWidth: 8, padding: 14, font: { size: 11 } },
                        },
                        tooltip: {
                            enabled: true,
                            backgroundColor: '#650d1c',
                            titleColor: '#fff',
                            bodyColor: '#f6e9ec',
                            borderColor: '#7B1113',
                            borderWidth: 1,
                            padding: 10,
                            cornerRadius: 8,
                            displayColors: false,
                            callbacks: {
                                title: (items) => humanDate(sortedDates[items[0].dataIndex]),
                                label: (item) => ` ${item.parsed.y} consultation${item.parsed.y === 1 ? '' : 's'}`,
                            },
                        },
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            border: { color: '#e3dcde' },
                            ticks: {
                                color: '#6b5e61',
                                font: { size: 10 },
                                maxRotation: 45,
                                minRotation: 45,
                                autoSkip: true,
                                maxTicksLimit: 12,
                                // Show "Nov 18, 2026" instead of the raw YYYY-MM-DD key.
                                callback(value) { return humanDate(sortedDates[value]); },
                            },
                        },
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(123,17,19,0.07)' },
                            border: { display: false },
                            ticks: { stepSize: 1, color: '#6b5e61', font: { size: 10 }, precision: 0 },
                        },
                    },
                },
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
            // Stripe structure, UCIMS palette: donut with a maroon/gold ramp,
            // clean point-style legend, and hover tooltips.
            charts.current.day = new Chart(dayRef.current, {
                type: 'doughnut',
                data: {
                    labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                    datasets: [{
                        data: avgData,
                        backgroundColor: ['#7B1113', '#9B1E20', '#C9A227', '#DFC66B', '#5c0d24'],
                        borderColor: '#fff',
                        borderWidth: 2,
                        hoverOffset: 8,
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '62%',
                    layout: { padding: 8 },
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: { color: '#4a4446', usePointStyle: true, pointStyle: 'circle', boxWidth: 8, padding: 12, font: { size: 11 } },
                        },
                        tooltip: {
                            enabled: true,
                            backgroundColor: '#650d1c',
                            titleColor: '#fff',
                            bodyColor: '#f6e9ec',
                            borderColor: '#7B1113',
                            borderWidth: 1,
                            padding: 10,
                            cornerRadius: 8,
                            displayColors: false,
                            callbacks: { label: (item) => ` ${item.parsed} avg consults/day` },
                        },
                    },
                },
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
                            backgroundColor: ['#7B1113', '#C9A227', '#9B1E20', '#DFC66B'],
                            borderRadius: 8,
                            borderSkipped: false,
                            barPercentage: 0.6,
                            hoverBackgroundColor: '#5c0d24',
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: { padding: { top: 8, right: 8 } },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            enabled: true,
                            backgroundColor: '#650d1c',
                            titleColor: '#fff',
                            bodyColor: '#f6e9ec',
                            borderColor: '#7B1113',
                            borderWidth: 1,
                            padding: 10,
                            cornerRadius: 8,
                            displayColors: false,
                            callbacks: { label: (item) => ` ${item.parsed.y} consultation${item.parsed.y === 1 ? '' : 's'}` },
                        },
                    },
                    scales: {
                        x: { grid: { display: false }, border: { color: '#e3dcde' }, ticks: { color: '#6b5e61', font: { size: 10 } } },
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(123,17,19,0.07)' },
                            border: { display: false },
                            ticks: { stepSize: 1, color: '#6b5e61', font: { size: 10 }, precision: 0 },
                        },
                    },
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, alignItems: 'end' }}>
                    <div>
                        <label className="ucims-text-label" htmlFor="analytics-filter-q">Search Patient</label>
                        <input id="analytics-filter-q" className="ucims-text-input" placeholder="Name or ID..." value={q} onChange={(e) => setQ(e.target.value)} />
                    </div>
                    <UCIMSSelect label="College" value={college} onChange={(e) => setCollege(e.target.value)}>
                        <option value="">All Colleges</option>
                        {colleges.map((c) => (
                            <option key={c}>{c}</option>
                        ))}
                    </UCIMSSelect>
                    <UCIMSSelect label="Year Level" value={year} onChange={(e) => setYear(e.target.value)}>
                        <option value="">All Years</option>
                        {years.map((y) => (
                            <option key={y}>{y}</option>
                        ))}
                    </UCIMSSelect>
                    <UCIMSSelect label="Handled By (Staff)" value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)}>
                        <option value="">All Staff</option>
                        {staffOptions.map((s) => (
                            <option key={s}>{s}</option>
                        ))}
                    </UCIMSSelect>
                </div>
            </div>

            <div className="analytics-duo" style={{ marginBottom: 20 }}>
                <div className="stat-card">
                    <div className="stat-num">{loading ? <MetricSkeleton /> : loadError ? '-' : filtered.length}</div>
                    <div className="stat-label">Total Consultations Filtered</div>
                </div>
                <div className="stat-card">
                    <div className="stat-num" style={{ color: 'var(--gold)' }}>
                        {loading ? <MetricSkeleton /> : loadError ? '-' : avgPerDay}
                    </div>
                    <div className="stat-label">Overall Average / Day</div>
                </div>
            </div>

            <div className="analytics-chart-duo">
                <div className="card">
                    <div className="card-title">Overall Consultation Trends</div>
                    <div style={{ position: 'relative', height: 250 }}>
                        {loading && <ChartSkeleton />}{!loading && (loadError || !filtered.length) && <p role={loadError ? "alert" : undefined}>{loadError || "No consultation data for these filters."}</p>}<canvas ref={trendRef} style={{ visibility: loading || loadError || !filtered.length ? 'hidden' : 'visible' }}></canvas>
                    </div>
                </div>
                <div className="card">
                    <div className="card-title">Average Consults by Day of Week</div>
                    <div style={{ position: 'relative', height: 250 }}>
                        {loading && <ChartSkeleton />}{!loading && (loadError || !filtered.length) && <p role={loadError ? "alert" : undefined}>{loadError || "No consultation data for these filters."}</p>}<canvas ref={dayRef} style={{ visibility: loading || loadError || !filtered.length ? 'hidden' : 'visible' }}></canvas>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-title">Consultation Types Comparison</div>
                <div style={{ position: 'relative', height: 250 }}>
                    {loading && <ChartSkeleton />}{!loading && (loadError || !filtered.length) && <p role={loadError ? "alert" : undefined}>{loadError || "No consultation data for these filters."}</p>}<canvas ref={typeRef} style={{ visibility: loading || loadError || !filtered.length ? 'hidden' : 'visible' }}></canvas>
                </div>
            </div>

            <div className="card canvas-report-panel" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap', borderBottom: '2px solid var(--border)', marginBottom: 16, paddingBottom: 10 }}>
                    <div>
                        <h2 className="card-title" style={{ marginBottom: 0 }}>
                            Illness Statistics
                        </h2>
                        <p className="text-xs text-muted" style={{ margin: '4px 0 0' }}>
                            Conditions are grouped into standardized names and ICD-10 codes, so spelling variations count once.
                        </p>
                    </div>
                    <input
                        type="search"
                        className="illx-search"
                        aria-label="Search condition or ICD-10 code"
                        placeholder="Search a condition or ICD-10 code"
                        value={illnessQ}
                        onChange={(e) => setIllnessQ(e.target.value)}
                    />
                </div>

                <div className="illx-kpis">
                    <div className="stat-card">
                        <div className="stat-num">{loading ? <MetricSkeleton /> : illnesses.unique}</div>
                        <div className="stat-label">Unique Conditions</div>
                    </div>
                    <div className="stat-card stat-gold">
                        <div className="stat-num">{loading ? <MetricSkeleton /> : illnesses.total}</div>
                        <div className="stat-label">Diagnoses Recorded</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-num">{loading ? <MetricSkeleton /> : `${illnesses.standardShare}%`}</div>
                        <div className="stat-label" title={illnesses.total ? `${illnesses.standardized} of ${illnesses.total} diagnoses matched a standardized condition` : undefined}>
                            Standardized
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="illx-most-common" title={topIllness ? topIllness.name : undefined}>
                            {loading ? <MetricSkeleton /> : topIllness ? topIllness.name : '-'}
                        </div>
                        <div className="stat-label">
                            Most Common{topIllness ? ` - ${topIllness.count} case${topIllness.count === 1 ? '' : 's'}` : ''}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <DetailSkeleton />
                ) : treeReady && (
                    <>
                    <div className="illx-chips" role="group" aria-label="Filter conditions by body system">
                        <button
                            type="button"
                            className={`illx-chip${illnessSystem === 'All' ? ' is-active' : ''}`}
                            aria-pressed={illnessSystem === 'All'}
                            onClick={() => setIllnessSystem('All')}
                        >
                            All systems <b>{illnesses.unique}</b>
                        </button>
                        {visibleChips.map((chip) => (
                            <button
                                key={chip.name}
                                type="button"
                                className={`illx-chip${illnessSystem === chip.name ? ' is-active' : ''}${chip.cases ? '' : ' is-empty'}`}
                                aria-pressed={illnessSystem === chip.name}
                                onClick={() => setIllnessSystem(chip.name)}
                            >
                                {chip.name} <b>{chip.conditions}</b>
                            </button>
                        ))}
                        {emptySystemNames.length > 0 && (
                            <label className="illx-toggle">
                                <input
                                    type="checkbox"
                                    checked={showEmptySystems}
                                    onChange={(e) => setShowEmptySystems(e.target.checked)}
                                />
                                Show empty systems
                            </label>
                        )}
                    </div>

                    <div className="illx-main">
                        <div className="illx-list" aria-label="Conditions ranked by recorded cases">
                            {!visibleNodes.length && (
                                <p role="status" className="illx-empty">
                                    {searching ? 'Nothing matches that search.' : 'No conditions in the catalogue yet.'}
                                </p>
                            )}
                            {visibleNodes.map((row) => {
                                const selected = activeIllness && row.key === activeIllness.key;
                                const rank = row.count > 0 ? rankByKey.get(row.key) : null;
                                return (
                                    <button
                                        key={row.key}
                                        type="button"
                                        aria-current={selected ? 'true' : undefined}
                                        className={`illx-row${selected ? ' is-selected' : ''}${row.count ? '' : ' is-unrecorded'}`}
                                        onClick={() => setActiveIllnessKey(row.key)}
                                    >
                                        <span className="illx-rank">{rank ? `#${rank}` : '-'}</span>
                                        <span className="illx-rowmain">
                                            <span className="illx-name" title={row.name}>
                                                <span className="illx-name-text">{row.name}</span>
                                                {row.code && <span className="illx-code">{row.code}</span>}
                                            </span>
                                            <span className="illx-bar" aria-hidden="true">
                                                <span style={{ width: row.count && activeMax ? `${Math.max(4, (row.count / activeMax) * 100)}%` : '0%' }} />
                                            </span>
                                        </span>
                                        <span className="illx-n">
                                            {row.count}
                                            <small>{row.count ? `${Math.round((row.count / illnesses.total) * 100)}%` : 'no records'}</small>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <aside className="illx-detail" aria-live="polite">
                            {activeIllness ? (
                                <>
                                    <div className="illx-detail-head">
                                        <div className="illx-badges">
                                            <span className="illx-tag">{activeIllness.chapter}</span>
                                            <span className={`illx-tag${activeIllness.standard ? '' : ' is-unmapped'}`}>
                                                {activeIllness.standard ? 'Standardized' : 'Not standardized'}
                                            </span>
                                        </div>
                                        <span className="illx-code-chip">{activeIllness.code || '-'}</span>
                                    </div>
                                    <h3 className="illx-title">{activeIllness.name}</h3>

                                    <div className="illx-stat-grid">
                                        <div><b>{activeIllness.count}</b><span>cases</span></div>
                                        <div><b>{activeShare}%</b><span>of all diagnoses</span></div>
                                        <div><b>{activeIllnessIndex ? `#${activeIllnessIndex}` : '-'}</b><span>rank by volume</span></div>
                                    </div>

                                    <div
                                        className="illx-tabs"
                                        role="tablist"
                                        aria-label="Condition detail sections"
                                        onKeyDown={(e) => {
                                            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
                                            e.preventDefault();
                                            const tabs = ['overview', 'trend', 'same'];
                                            const delta = e.key === 'ArrowRight' ? 1 : -1;
                                            const next = tabs[(tabs.indexOf(illnessTab) + delta + tabs.length) % tabs.length];
                                            setIllnessTab(next);
                                        }}
                                    >
                                        {['overview', 'trend', 'same'].map((name) => (
                                            <button
                                                key={name}
                                                type="button"
                                                role="tab"
                                                id={`ill-tab-${name}`}
                                                aria-selected={illnessTab === name}
                                                aria-controls={`ill-tab-panel-${name}`}
                                                className={illnessTab === name ? 'is-active' : ''}
                                                onClick={() => setIllnessTab(name)}
                                            >
                                                {name === 'overview' ? 'Overview' : name === 'trend' ? 'Month by month' : `Same system (${sameSystem.length})`}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="illx-tabpanels">
                                        {illnessTab === 'overview' && (
                                            <div role="tabpanel" id="ill-tab-panel-overview" aria-labelledby="ill-tab-overview">
                                                <div className="illx-block">
                                                    <div className="illx-block-head"><span>Share of every diagnosis</span><span>{activeShare}%</span></div>
                                                    <span className="illx-bigbar" aria-hidden="true"><span style={{ width: activeIllness.count && activeMax ? `${Math.max(4, (activeIllness.count / activeMax) * 100)}%` : '0%' }} /></span>
                                                </div>
                                                <div className="illx-block">
                                                    <div className="illx-block-head"><span>Quick takeaway</span></div>
                                                    {activeIllness.count ? (
                                                        <p className="illx-note">
                                                            {activeIllness.name} accounts for <b>{activeShare}%</b> of {illnesses.total} diagnoses across {illnesses.unique} condition{illnesses.unique === 1 ? '' : 's'} this period
                                                            {activeIllnessIndex === 1 ? ' - the single most common condition seen.' : ` - ranked #${activeIllnessIndex} by volume.`}
                                                        </p>
                                                    ) : (
                                                        <p className="illx-note">
                                                            <b>{activeIllness.name}</b> is predefined in the standardized catalogue but no completed visit has recorded it yet.
                                                            It will count here automatically as soon as a consultation is completed with this diagnosis.
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="illx-block">
                                                    <div className="illx-block-head">
                                                        <span>Recorded as</span>
                                                        <span>{activeIllness.variants.length} wording{activeIllness.variants.length === 1 ? '' : 's'}</span>
                                                    </div>
                                                    {activeIllness.variants.length ? (
                                                        <>
                                                            <div className="illx-variants">
                                                                {activeIllness.variants.map((variant) => (
                                                                    <span className="illx-variant" key={variant.label} title={`${variant.count} recorded entr${variant.count === 1 ? 'y' : 'ies'}`}>
                                                                        {variant.label}
                                                                        <b>{variant.count}</b>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            <p className="illx-note">
                                                                Every wording above is counted once as <b>{activeIllness.name}</b>
                                                                {activeIllness.code ? ` (${activeIllness.code})` : ''}, so equivalent diagnoses never split the statistics.
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <p className="illx-note">No diagnosis wording has been recorded for this condition yet.</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {illnessTab === 'trend' && (
                                            <div role="tabpanel" id="ill-tab-panel-trend" aria-labelledby="ill-tab-trend">
                                                <div className="illx-block">
                                                    <div className="illx-block-head"><span>Monthly spread</span><span>{activeTrendTotal} case{activeTrendTotal === 1 ? '' : 's'} in view</span></div>
                                                    {activeIllness.count && trendMonths.length ? (
                                                        <div className="illx-months">
                                                            {trendMonths.map((key, i) => (
                                                                <div className="illx-month" key={key} title={`${monthShort(key)} ${String(key).slice(0, 4)}: ${activeMonthSeries[i] ?? 0} cases`}>
                                                                    <div className="illx-month-track">
                                                                        <span style={{ height: `${Math.max(4, ((activeMonthSeries[i] ?? 0) / activeMonthMax) * 100)}%` }} />
                                                                    </div>
                                                                    <b>{activeMonthSeries[i] ?? 0}</b>
                                                                    <span>{monthShort(key)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="illx-note">No dated diagnoses to chart yet.</p>
                                                    )}
                                                </div>
                                                <p className="illx-note">Columns scale to the busiest month in view and each prints its count, so the trend reads without colour alone. Only months present in the filtered data are shown (last {trendMonths.length}).</p>
                                            </div>
                                        )}

                                        {illnessTab === 'same' && (
                                            <div role="tabpanel" id="ill-tab-panel-same" aria-labelledby="ill-tab-same">
                                                {sameSystem.length ? (
                                                    <ul className="illx-same-list">
                                                        {sameSystem.map((row) => (
                                                            <li key={row.key}>
                                                                <button type="button" onClick={() => setActiveIllnessKey(row.key)}>
                                                                    <span className="illx-same-name" title={row.name}>{row.name}{row.code && <span className="illx-same-code">{row.code}</span>}</span>
                                                                    <span className="illx-same-n">{row.count}</span>
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="illx-note">No other {activeIllness.chapter} condition recorded for the current filters.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <p className="illx-note">No condition selected - type to filter or pick one on the left.</p>
                            )}
                        </aside>
                    </div>
                    </>
                )}

                {!loading && !treeReady && (
                    <div className="empty-state">
                        <p role={loadError ? 'alert' : undefined}>
                            {loadError || 'No conditions to show.'}
                        </p>
                    </div>
                )}
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

// --------------------------------------------------
// Account Management
// --------------------------------------------------
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
    // Letter-only for names (like Patient Registration); other keys take raw values.
    const set = (k) => (e) => setForm({ ...form, [k]: ['firstname', 'middlename', 'lastname'].includes(k) ? e.target.value.replace(/\d/g, '') : e.target.value });
    const setValue = (k, v) => setForm({ ...form, [k]: v });
    const setMobile = (e) => setForm({ ...form, mobile_no: formatPhilippineMobile(e.target.value) });

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
                    <b>{member.clinicId}</b> - {(member.role || '').toUpperCase()}
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
                            <UCIMSSelect value={form.sex} onChange={set('sex')}>
                                <option>Male</option>
                                <option>Female</option>
                            </UCIMSSelect>
                        </div>
                        <div className="field"><label>Date of Birth *</label><DatePicker id="edit-dob" label="Date of birth" placeholder="Select birthdate" value={form.dob} min={minBirthDate()} max={localToday()} initialMonth={`${new Date().getFullYear() - 30}-01-01`} onChange={(v) => setValue('dob', v)} /></div>
                        <div className="field"><label>Mobile No. *</label><input placeholder="09XXXXXXXXX" maxLength={11} inputMode="numeric" pattern="^09\d{9}$" title="11-digit Philippine mobile (09XXXXXXXXX)" value={form.mobile_no} onChange={setMobile} /></div>
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
                            <UCIMSSelect value={form.employment_status} onChange={set('employment_status')}>
                                <option>Full-time</option>
                                <option>Part-time</option>
                                <option>Contractual</option>
                            </UCIMSSelect>
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
                        {saving ? 'Saving-' : <><i className="bi bi-check-circle"></i> Save Changes</>}
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
                    {member.name} - <b>{member.clinicId}</b>
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
                        {saving ? 'Saving-' : 'Reset Password'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function DeleteAccountModal({ target, onClose, onDeleted, showToast }) {
    const isPatient = target.kind === 'patient';
    const [confirmed, setConfirmed] = useState(false);
    const [deleting, setDeleting] = useState(false);

    async function handleDelete() {
        if (!confirmed || deleting) return;
        setDeleting(true);
        try {
            const url = isPatient ? `/api/records/patients/${target.id}` : `/api/records/staff/${target.id}`;
            await axios.delete(url);
            showToast(`Account for ${target.name} deleted successfully.`);
            onDeleted(target);
        } catch (e) {
            showToast(errMsg(e, 'Failed to delete the account.'), 'error');
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal acct-delete-modal" role="dialog" aria-modal="true" aria-labelledby="acct-delete-title">
                <button className="modal-close" onClick={onClose} aria-label="Close">
                    &times;
                </button>
                <div className="acct-delete-head">
                    <span className="acct-delete-icon" aria-hidden="true">
                        <i className="bi bi-trash3"></i>
                    </span>
                    <div>
                        <h2 id="acct-delete-title" className="acct-delete-title">
                            {isPatient ? 'Delete patient account' : 'Delete staff account'}
                        </h2>
                        <p className="acct-delete-sub">The account is removed from the directory once confirmed.</p>
                    </div>
                </div>
                <dl className="acct-delete-summary">
                    <div>
                        <dt>Account</dt>
                        <dd>{target.name}</dd>
                    </div>
                    <div>
                        <dt>Clinic ID</dt>
                        <dd>{target.clinicId || '-'}</dd>
                    </div>
                    <div>
                        <dt>{isPatient ? 'Patient type' : 'Role'}</dt>
                        <dd>{isPatient ? target.role : ROLE_LABELS[target.role] || target.role}</dd>
                    </div>
                </dl>
                <p className="acct-delete-warning">
                    <i className="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
                    <span>
                        {isPatient
                            ? 'The patient account and the clinic records linked to it (visits, consultations, prescriptions, and health records) are deleted permanently. This cannot be undone.'
                            : 'The staff account and its profile are deleted permanently. Clinic activity linked to this staff member may also be removed. This cannot be undone.'}
                    </span>
                </p>
                <label className="acct-delete-confirm">
                    <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
                    <span>I understand this account will be permanently deleted.</span>
                </label>
                <div className="modal-footer">
                    <button className="btn btn-outline" onClick={onClose} disabled={deleting}>
                        Cancel
                    </button>
                    <button className="btn btn-danger" disabled={!confirmed || deleting} onClick={handleDelete}>
                        {deleting ? 'Deleting...' : <><i className="bi bi-trash3"></i> Delete account</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ReviewDeletionRequestModal({ request, mode, onClose, onDone, showToast }) {
    const approving = mode === 'approve';
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    async function submit() {
        setSaving(true);
        try {
            const { data } = await axios.post(`/api/records/deletion-requests/${request.id}/${mode}`, { notes });
            showToast(data.message || (approving ? 'Request approved.' : 'Request rejected.'));
            onDone();
        } catch (e) {
            showToast(errMsg(e, 'Failed to update the deletion request.'), 'error');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && !saving && onClose()}>
            <div className="modal acct-delete-modal" role="dialog" aria-modal="true" aria-labelledby="req-review-title">
                <button className="modal-close" onClick={onClose} aria-label="Close" disabled={saving}>
                    &times;
                </button>
                <div className="acct-delete-head">
                    <span className={`acct-delete-icon ${approving ? 'acct-delete-icon--approve' : 'acct-delete-icon--reject'}`} aria-hidden="true">
                        <i className={`bi ${approving ? 'bi-check2-circle' : 'bi-x-circle'}`}></i>
                    </span>
                    <div>
                        <h2 id="req-review-title" className="acct-delete-title">
                            {approving ? 'Approve deletion request' : 'Reject deletion request'}
                        </h2>
                        <p className="acct-delete-sub">
                            {approving
                                ? 'The patient account and every clinic record linked to it will be deleted permanently.'
                                : 'The patient record stays intact. The request is closed and kept for the audit trail.'}
                        </p>
                    </div>
                </div>

                <dl className="acct-delete-summary">
                    <div>
                        <dt>Patient</dt>
                        <dd>{request.patientName || '—'}</dd>
                    </div>
                    <div>
                        <dt>Clinic ID</dt>
                        <dd>{request.patientId || '—'}</dd>
                    </div>
                    <div>
                        <dt>Requested by</dt>
                        <dd>{request.requestedBy || '—'}{request.requestedByRole ? ` (${request.requestedByRole})` : ''}</dd>
                    </div>
                </dl>

                <div className="acct-review-reason">
                    <div className="info-lbl">Reason given</div>
                    <p>{request.reason || 'No reason recorded.'}</p>
                </div>

                <div className="field">
                    <label htmlFor="review-notes">Review notes (optional)</label>
                    <textarea
                        id="review-notes"
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={approving ? 'Why the record is cleared for deletion…' : 'Why the request is being rejected…'}
                    />
                </div>

                <div className="modal-footer">
                    <button className="btn btn-outline" onClick={onClose} disabled={saving}>
                        Cancel
                    </button>
                    <button className={`btn ${approving ? 'btn-danger' : 'btn-primary'}`} disabled={saving} onClick={submit}>
                        {saving
                            ? 'Saving…'
                            : approving
                                ? <><i className="bi bi-trash3"></i> Approve &amp; delete record</>
                                : <><i className="bi bi-x-circle"></i> Reject request</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

function BatchDeleteAccountsModal({ accounts, onClose, onDeleted, showToast }) {
    const [confirmed, setConfirmed] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const count = accounts.length;
    const preview = accounts.slice(0, 5);
    const rest = count - preview.length;

    async function handleDelete() {
        if (!confirmed || deleting) return;
        setDeleting(true);
        try {
            const { data } = await axios.post('/api/records/accounts/batch-delete', {
                accounts: accounts.map((a) => ({ kind: a.kind, id: a.id })),
            });
            showToast(data.message || `${count} accounts deleted permanently.`);
            onDeleted(data);
        } catch (e) {
            showToast(errMsg(e, 'Failed to delete the selected accounts.'), 'error');
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && !deleting && onClose()}>
            <div className="modal acct-delete-modal" role="dialog" aria-modal="true" aria-labelledby="batch-delete-title">
                <button className="modal-close" onClick={onClose} aria-label="Close" disabled={deleting}>
                    &times;
                </button>
                <div className="acct-delete-head">
                    <span className="acct-delete-icon" aria-hidden="true">
                        <i className="bi bi-trash3"></i>
                    </span>
                    <div>
                        <h2 id="batch-delete-title" className="acct-delete-title">
                            Delete {count} aging account{count === 1 ? '' : 's'}
                        </h2>
                        <p className="acct-delete-sub">
                            These accounts are at least five years old. Deleting them also removes their linked clinic records.
                        </p>
                    </div>
                </div>

                <div className="acct-batch-list">
                    {preview.map((a) => (
                        <div key={`${a.kind}:${a.id}`} className="acct-batch-row">
                            <span className={`badge ${a.kind === 'patient' ? 'b-maroon' : 'b-blue'}`}>
                                {a.kind === 'patient' ? 'Patient' : 'Staff'}
                            </span>
                            <span className="fw6">{a.name}</span>
                            <span className="text-xs text-muted">{a.clinicId || '—'}</span>
                            <span className="text-xs text-muted acct-batch-age">{a.age_label}</span>
                        </div>
                    ))}
                    {rest > 0 && <div className="acct-batch-more">and {rest} more account{rest === 1 ? '' : 's'}…</div>}
                </div>

                <p className="acct-delete-warning">
                    <i className="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
                    <span>This permanently deletes the selected accounts and their linked records. This cannot be undone.</span>
                </p>

                <label className="acct-delete-confirm">
                    <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
                    <span>I understand these {count} account{count === 1 ? '' : 's'} will be permanently deleted.</span>
                </label>

                <div className="modal-footer">
                    <button className="btn btn-outline" onClick={onClose} disabled={deleting}>
                        Cancel
                    </button>
                    <button className="btn btn-danger" disabled={!confirmed || deleting} onClick={handleDelete}>
                        {deleting ? 'Deleting…' : <><i className="bi bi-trash3"></i> Delete {count} account{count === 1 ? '' : 's'}</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

const REQUEST_BADGE = {
    pending: { cls: 'b-gold', label: 'Pending review' },
    approved: { cls: 'b-green', label: 'Approved' },
    rejected: { cls: 'b-gray', label: 'Rejected' },
};

function agingKey(account) {
    return `${account.kind}:${account.id}`;
}

function agingMatches(account, query, kind, minYears) {
    const q = String(query || '').trim().toLowerCase();
    const name = String(account.name || '').toLowerCase();
    const clinicId = String(account.clinicId || '').toLowerCase();
    const email = String(account.email || '').toLowerCase();

    return (!q || name.includes(q) || clinicId.includes(q) || email.includes(q))
        && (!kind || account.kind === kind)
        && (Number(account.age_years) || 0) >= minYears;
}

function AccountsSection({ staff, loading, patientCount, showToast, reload }) {
    const { auth } = usePage().props;
    const myId = auth?.user?.user_id;
    const [form, setForm] = useState(emptyForm('nurse'));
    const [creating, setCreating] = useState(false);
    const [editMember, setEditMember] = useState(null);
    const [resetMember, setResetMember] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [listTab, setListTab] = useState('staff');
    const [errors, setErrors] = useState({});

    // Staff and patient directories
    const [patients, setPatients] = useState([]);
    const [patientsLoading, setPatientsLoading] = useState(true);
    const [staffQuery, setStaffQuery] = useState('');
    const [staffRole, setStaffRole] = useState('');
    const [staffStatus, setStaffStatus] = useState('');
    const [patientQuery, setPatientQuery] = useState('');
    const [patientType, setPatientType] = useState('');

    // Deletion requests raised by nurses (and other staff)
    const [requests, setRequests] = useState([]);
    const [requestsLoading, setRequestsLoading] = useState(true);
    const [requestQuery, setRequestQuery] = useState('');
    const [requestStatus, setRequestStatus] = useState('pending');
    const [reviewRequest, setReviewRequest] = useState(null); // { request, mode }

    // Accounts five years old or older
    const [oldAccounts, setOldAccounts] = useState([]);
    const [oldLoading, setOldLoading] = useState(true);
    const [agingCutoff, setAgingCutoff] = useState('');
    const [agingQuery, setAgingQuery] = useState('');
    const [agingKind, setAgingKind] = useState('');
    const [agingMinYears, setAgingMinYears] = useState(5);
    const [selectedAging, setSelectedAging] = useState(() => new Set());
    const [batchOpen, setBatchOpen] = useState(false);

    const fetchPatients = useCallback(async () => {
        try {
            const res = await axios.get('/api/records/patients', { timeout: 20000 });
            setPatients(res.data.patients || []);
        } catch (e) {
            showToast(errMsg(e, 'Failed to load patient accounts.'), 'error');
        } finally {
            setPatientsLoading(false);
        }
    }, [showToast]);

    const fetchRequests = useCallback(async () => {
        try {
            const res = await axios.get('/api/records/deletion-requests', { timeout: 20000 });
            setRequests(res.data.requests || []);
        } catch (e) {
            showToast(errMsg(e, 'Failed to load deletion requests.'), 'error');
        } finally {
            setRequestsLoading(false);
        }
    }, [showToast]);

    const fetchOldAccounts = useCallback(async () => {
        try {
            const res = await axios.get('/api/records/old-accounts', { timeout: 20000 });
            setOldAccounts(res.data.accounts || []);
            setAgingCutoff(res.data.cutoff || '');
        } catch (e) {
            showToast(errMsg(e, 'Failed to load aging accounts.'), 'error');
        } finally {
            setOldLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchPatients();
        fetchRequests();
        fetchOldAccounts();
    }, [fetchPatients, fetchRequests, fetchOldAccounts]);

    // Registration-grade live validation. Only fields the admin has touched
    // show errors; clicking Create flags everything that is still wrong.
    const formRef = useRef(form);
    const touchedRef = useRef({});
    const revalidate = (candidate, touched) => {
        const errs = staffFormErrors(candidate);
        const visible = {};
        for (const k of Object.keys(errs)) if (touched[k]) visible[k] = errs[k];
        setErrors(visible);
    };
    const setValue = (k, v) => {
        const candidate = { ...formRef.current, [k]: v };
        formRef.current = candidate;
        setForm(candidate);
        const tset = { ...touchedRef.current, [k]: true };
        touchedRef.current = tset;
        revalidate(candidate, tset);
    };
    // Letter-only for the name fields (like Patient Registration).
    const set = (k) => (e) => setValue(k, ['firstname', 'middlename', 'lastname'].includes(k) ? e.target.value.replace(/\d/g, '') : e.target.value);
    const setMobile = (e) => setValue('mobile_no', formatPhilippineMobile(e.target.value));
    const invalid = (k) => errors[k] ? '' : undefined;
    const FieldError = ({ name }) => (errors[name] ? <div className="field-error">{errors[name]}</div> : null);
    const count = (role) => staff.filter((u) => u.role === role && u.is_active).length;

    function pickRole(role) {
        const candidate = { ...formRef.current, role, clinic_id: ID_PREFIX[role] };
        formRef.current = candidate;
        setForm(candidate);
        revalidate(candidate, touchedRef.current);
    }

    async function handleCreate() {
        const errs = staffFormErrors(formRef.current);
        if (Object.keys(errs).length) {
            touchedRef.current = Object.fromEntries(Object.keys(errs).map((k) => [k, true]));
            setErrors(errs);
            showToast('Please fix the highlighted fields.', 'error');
            return;
        }
        setCreating(true);
        try {
            await axios.post('/staff', formRef.current);
            showToast(`Account for ${formRef.current.firstname} created successfully!`);
            const fresh = emptyForm(formRef.current.role);
            formRef.current = fresh;
            touchedRef.current = {};
            setErrors({});
            setForm(fresh);
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

    // ---- Directory filters -------------------------------------------------
    const filteredStaff = useMemo(() => {
        const q = staffQuery.trim().toLowerCase();
        return staff.filter((u) => {
            const matchQuery = !q
                || String(u.name || '').toLowerCase().includes(q)
                || String(u.clinicId || '').toLowerCase().includes(q);
            const matchRole = !staffRole || u.role === staffRole;
            const matchStatus = !staffStatus
                || (staffStatus === 'active' ? Boolean(u.is_active) : !u.is_active);
            return matchQuery && matchRole && matchStatus;
        });
    }, [staff, staffQuery, staffRole, staffStatus]);

    const patientTypes = useMemo(
        () => [...new Set(patients.map((p) => p.patient_type).filter(Boolean))].sort(),
        [patients],
    );

    const filteredPatients = useMemo(() => {
        const q = patientQuery.trim().toLowerCase();
        return patients.filter((p) => {
            const matchQuery = !q
                || String(p.name || '').toLowerCase().includes(q)
                || String(p.patientId || '').toLowerCase().includes(q)
                || String(p.email || '').toLowerCase().includes(q);
            const matchType = !patientType || p.patient_type === patientType;
            return matchQuery && matchType;
        });
    }, [patients, patientQuery, patientType]);

    const pendingRequestCount = useMemo(
        () => requests.filter((r) => r.status === 'pending').length,
        [requests],
    );

    const filteredRequests = useMemo(() => {
        const q = requestQuery.trim().toLowerCase();
        return requests.filter((r) => {
            const matchQuery = !q
                || String(r.patientName || '').toLowerCase().includes(q)
                || String(r.patientId || '').toLowerCase().includes(q)
                || String(r.requestedBy || '').toLowerCase().includes(q)
                || String(r.reason || '').toLowerCase().includes(q);
            const matchStatus = !requestStatus || r.status === requestStatus;
            return matchQuery && matchStatus;
        });
    }, [requests, requestQuery, requestStatus]);

    const filteredAging = useMemo(
        () => oldAccounts.filter((a) => agingMatches(a, agingQuery, agingKind, agingMinYears)),
        [oldAccounts, agingQuery, agingKind, agingMinYears],
    );

    const selectedAccounts = useMemo(
        () => oldAccounts.filter((a) => selectedAging.has(agingKey(a))),
        [oldAccounts, selectedAging],
    );

    const allAgingSelected = filteredAging.length > 0
        && filteredAging.every((a) => selectedAging.has(agingKey(a)));

    // Keep the selection honest when the filters change: a hidden account must
    // never ride along into a batch delete.
    useEffect(() => {
        setSelectedAging((previous) => {
            if (!previous.size) return previous;
            const next = new Set(
                [...previous].filter((key) => {
                    const account = oldAccounts.find((a) => agingKey(a) === key);
                    return account && agingMatches(account, agingQuery, agingKind, agingMinYears);
                }),
            );
            return next.size === previous.size ? previous : next;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [oldAccounts, agingQuery, agingKind, agingMinYears]);

    function toggleAging(account) {
        const key = agingKey(account);
        setSelectedAging((previous) => {
            const next = new Set(previous);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }

    function toggleAllAging() {
        setSelectedAging((previous) => {
            const next = new Set(previous);
            if (allAgingSelected) filteredAging.forEach((a) => next.delete(agingKey(a)));
            else filteredAging.forEach((a) => next.add(agingKey(a)));
            return next;
        });
    }

    function refreshActive() {
        if (listTab === 'staff') reload();
        else if (listTab === 'patients') fetchPatients();
        else if (listTab === 'requests') fetchRequests();
        else fetchOldAccounts();
    }

    function afterRequestReviewed() {
        setReviewRequest(null);
        fetchRequests();
        fetchPatients();
        fetchOldAccounts();
        reload();
    }

    function afterBatchDeleted() {
        setBatchOpen(false);
        setSelectedAging(new Set());
        // The modal already announced how many accounts were deleted.
        fetchOldAccounts();
        fetchPatients();
        reload();
    }

    return (
        <>
            <div className="page-header">
                <h1>Account Management</h1>
                <p>Manage staff and patient accounts, review deletion requests, and clear accounts that are five years or older.</p>
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
                    <div className="stat-num" style={{ color: 'var(--green)' }}>{patientsLoading ? (patientCount ?? '-') : patients.length}</div>
                    <div className="stat-label">PATIENTS</div>
                </div>
                <div className="stat-card">
                    <div className="stat-num" style={{ color: '#8a5a12' }}>{oldLoading ? '-' : oldAccounts.length}</div>
                    <div className="stat-label">AGING 5+ YRS</div>
                </div>
            </div>

            <div className="acct-top-grid">
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
                        <div className="field" data-invalid={invalid('firstname')}><label>First Name *</label><input placeholder="Juan" maxLength={100} value={form.firstname} onChange={set('firstname')} /><FieldError name="firstname" /></div>
                        <div className="field" data-invalid={invalid('middlename')}><label>Middle Name</label><input placeholder="Santos" maxLength={100} value={form.middlename} onChange={set('middlename')} /><FieldError name="middlename" /></div>
                        <div className="field" data-invalid={invalid('lastname')}><label>Last Name *</label><input placeholder="dela Cruz" maxLength={100} value={form.lastname} onChange={set('lastname')} /><FieldError name="lastname" /></div>
                    </div>
                    <div className="grid3">
                        <div className="field" data-invalid={invalid('sex')}>
                            <label>Sex *</label>
                            <UCIMSSelect value={form.sex} onChange={set('sex')}>
                                <option>Male</option>
                                <option>Female</option>
                            </UCIMSSelect>
                            <FieldError name="sex" />
                        </div>
                        <div className="field" data-invalid={invalid('dob')}><label>Date of Birth *</label><DatePicker id="dob" label="Date of birth" placeholder="Select birthdate" value={form.dob} min={minBirthDate()} max={localToday()} initialMonth={`${new Date().getFullYear() - 30}-01-01`} onChange={(v) => setValue('dob', v)} /><FieldError name="dob" /></div>
                        <div className="field" data-invalid={invalid('mobile_no')}><label>Mobile No. *</label><input placeholder="09XXXXXXXXX" maxLength={11} inputMode="numeric" pattern="^09\d{9}$" title="11-digit Philippine mobile (09XXXXXXXXX)" value={form.mobile_no} onChange={setMobile} /><FieldError name="mobile_no" /></div>
                    </div>
                    <div className="grid2">
                        <div className="field"><label>Landline No.</label><input placeholder="(082) xxx-xxxx" maxLength={20} value={form.landline_no} onChange={set('landline_no')} /></div>
                        <div className="field" data-invalid={invalid('usep_email')}><label>USeP Email *</label><input type="email" placeholder="staff@usep.edu.ph" maxLength={150} pattern="^[A-Za-z0-9._%+\-]+@usep\.edu\.ph$" value={form.usep_email} onChange={set('usep_email')} /><FieldError name="usep_email" /></div>
                    </div>

                    <div className="card-title mt16" style={{ fontSize: '.9rem', color: 'var(--maroon)' }}>
                        <i className="bi bi-geo-alt"></i> 2. Complete Address
                    </div>
                    <div className="grid3">
                        <div className="field"><label>Block/House No.</label><input placeholder="Blk 1 Lot 2" maxLength={50} value={form.address_block} onChange={set('address_block')} /></div>
                        <div className="field"><label>Street</label><input placeholder="Main St." maxLength={100} value={form.address_street} onChange={set('address_street')} /></div>
                        <div className="field" data-invalid={invalid('address_brgy')}><label>Barangay *</label><input placeholder="Obrero" maxLength={100} value={form.address_brgy} onChange={set('address_brgy')} /><FieldError name="address_brgy" /></div>
                    </div>
                    <div className="grid2">
                        <div className="field" data-invalid={invalid('address_city')}><label>City/Municipality *</label><input placeholder="Davao City" maxLength={100} value={form.address_city} onChange={set('address_city')} /><FieldError name="address_city" /></div>
                        <div className="field"><label>Province</label><input placeholder="Davao del Sur" maxLength={100} value={form.address_province} onChange={set('address_province')} /></div>
                    </div>

                    <div className="card-title mt16" style={{ fontSize: '.9rem', color: 'var(--maroon)' }}>
                        <i className="bi bi-briefcase"></i> 3. Employment Details
                    </div>
                    <div className="grid3">
                        <div className="field" data-invalid={invalid('employment_status')}>
                            <label>Status *</label>
                            <UCIMSSelect value={form.employment_status} onChange={set('employment_status')}>
                                <option>Full-time</option>
                                <option>Part-time</option>
                                <option>Contractual</option>
                            </UCIMSSelect>
                            <FieldError name="employment_status" />
                        </div>
                        <div className="field" data-invalid={invalid('schedule')}><label>Schedule *</label><input placeholder="MWF 8AM-5PM" maxLength={255} value={form.schedule} onChange={set('schedule')} /><FieldError name="schedule" /></div>
                        <div className="field"><label>Role Description</label><input placeholder="e.g. Triage Nurse" value={form.role_description} onChange={set('role_description')} /></div>
                    </div>

                    <div className="card-title mt16" style={{ fontSize: '.9rem', color: 'var(--maroon)' }}>
                        <i className="bi bi-shield-lock"></i> 4. System Credentials
                    </div>
                    <div className="grid2 mb16">
                        <div className="field mb0" data-invalid={invalid('clinic_id')}><label>Clinic ID Number *</label><input placeholder="N-001" maxLength={5} pattern="^[ADN]-\d{3}$" value={form.clinic_id} onChange={(e) => setValue('clinic_id', formatClinicId(e.target.value, 'staff'))} /><FieldError name="clinic_id" /></div>
                        <div className="field mb0" data-invalid={invalid('password')}><label>Password * (min 8)</label><input type="password" placeholder="At least 8 characters" value={form.password} onChange={set('password')} /><FieldError name="password" /></div>
                    </div>
                    <button className="btn btn-primary w100" disabled={creating} onClick={handleCreate}>
                        {creating ? 'Creating...' : <><i className="bi bi-person-plus"></i> Create Account</>}
                    </button>
                </div>

                <div className="card">
                    <div className="card-title" style={{ fontSize: '.95rem' }}>
                        <i className="bi bi-list-check"></i> Account Management Guide
                    </div>
                    <p className="text-sm text-muted mb8">Complete each staff profile before saving. New accounts are active immediately and sign in with the Clinic ID and password you set here. Disabled accounts stay visible so they can be re-enabled or deleted.</p>
                    <div className="guide-list">
                        <div className="guide-row"><span className="guide-chip guide-chip--nurse">N-</span><div><div className="fw6 text-sm">Nurse</div><div className="text-xs text-muted">Triage, endorsements, and nurse services.</div></div></div>
                        <div className="guide-row"><span className="guide-chip guide-chip--doctor">D-</span><div><div className="fw6 text-sm">Doctor</div><div className="text-xs text-muted">Consultations, prescriptions, medical certificates.</div></div></div>
                        <div className="guide-row"><span className="guide-chip guide-chip--admin">A-</span><div><div className="fw6 text-sm">Administrator</div><div className="text-xs text-muted">Reports, account management and clinic administration.</div></div></div>
                    </div>
                    <div className="guide-rules">
                        <div className="guide-rule"><i className="bi bi-shield-check"></i><span>Password must be at least 8 characters.</span></div>
                        <div className="guide-rule"><i className="bi bi-phone"></i><span>Mobile: exactly 11 digits, format 09XXXXXXXXX.</span></div>
                        <div className="guide-rule"><i className="bi bi-envelope"></i><span>USeP email must end in @usep.edu.ph.</span></div>
                        <div className="guide-rule"><i className="bi bi-calendar-check"></i><span>Birthdate must be a valid date within the human range (110 years max).</span></div>
                        <div className="guide-rule"><i className="bi bi-pencil"></i><span>The Edit button reuses this same validation.</span></div>
                        <div className="guide-rule"><i className="bi bi-trash3"></i><span>Deleting an account is permanent; the account leaves the directory once you confirm.</span></div>
                        <div className="guide-rule"><i className="bi bi-clock-history"></i><span>Accounts at least five years old move to Aging Accounts for batch deletion.</span></div>
                    </div>
                </div>
            </div>

            <div className="card acct-directory-card">
                <div className="acct-directory-head">
                    <div>
                        <div className="card-title" style={{ marginBottom: 2 }}>Account Directory</div>
                        <p className="text-xs text-muted">Search, filter, review deletion requests, and clear accounts that are due for retention cleanup.</p>
                    </div>
                    <span className="acct-directory-total">{staff.length + patients.length} accounts</span>
                </div>

                <div className="tabs acct-tabs" role="tablist" aria-label="Account directory view">
                    <button type="button" role="tab" aria-selected={listTab === 'staff'} className={`tab ${listTab === 'staff' ? 'active' : ''}`} onClick={() => setListTab('staff')}>
                        Staff Accounts <span className="tab-count">{staff.length}</span>
                    </button>
                    <button type="button" role="tab" aria-selected={listTab === 'patients'} className={`tab ${listTab === 'patients' ? 'active' : ''}`} onClick={() => setListTab('patients')}>
                        Patient Accounts <span className="tab-count">{patients.length}</span>
                    </button>
                    <button type="button" role="tab" aria-selected={listTab === 'requests'} className={`tab ${listTab === 'requests' ? 'active' : ''}`} onClick={() => setListTab('requests')}>
                        Deletion Requests <span className={`tab-count ${pendingRequestCount ? 'tab-count--alert' : ''}`}>{pendingRequestCount}</span>
                    </button>
                    <button type="button" role="tab" aria-selected={listTab === 'aging'} className={`tab ${listTab === 'aging' ? 'active' : ''}`} onClick={() => setListTab('aging')}>
                        Aging Accounts <span className="tab-count">{oldAccounts.length}</span>
                    </button>
                </div>

                {listTab === 'staff' && (
                    <>
                        <div className="dir-toolbar">
                            <div className="dir-search">
                                <i className="bi bi-search" aria-hidden="true"></i>
                                <input type="search" placeholder="Search name or Clinic ID…" aria-label="Search staff accounts" value={staffQuery} onChange={(e) => setStaffQuery(e.target.value)} />
                            </div>
                            <div className="dir-filter">
                                <UCIMSSelect value={staffRole} onChange={(e) => setStaffRole(e.target.value)} title="Filter by role">
                                    <option value="">All roles</option>
                                    <option value="nurse">Nurse</option>
                                    <option value="doctor">Doctor</option>
                                    <option value="admin">Administrator</option>
                                </UCIMSSelect>
                            </div>
                            <div className="dir-filter">
                                <UCIMSSelect value={staffStatus} onChange={(e) => setStaffStatus(e.target.value)} title="Filter by status">
                                    <option value="">All statuses</option>
                                    <option value="active">Active</option>
                                    <option value="disabled">Disabled</option>
                                </UCIMSSelect>
                            </div>
                            <button type="button" className="btn btn-outline btn-sm" onClick={refreshActive} title="Reload staff accounts">
                                <i className="bi bi-arrow-clockwise"></i> Refresh
                            </button>
                            <span className="dir-count">{filteredStaff.length} of {staff.length}</span>
                        </div>

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
                                    {!loading && !filteredStaff.length && (
                                        <tr>
                                            <td colSpan={4} className="text-center text-muted p16">
                                                {staff.length ? 'No staff match this search or filter.' : 'No staff found in database.'}
                                            </td>
                                        </tr>
                                    )}
                                    {<PaginatedItems items={filteredStaff} tableColumns={4} label="staff">{(u) => {
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
                                                    <div className="acct-row-actions">
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
                                                        <button
                                                            className="btn btn-outline btn-sm acct-delete-btn"
                                                            title={isMe ? "You can't delete your own account" : 'Delete Account'}
                                                            aria-label={`Delete ${u.name}`}
                                                            disabled={isMe}
                                                            onClick={() => setDeleteTarget({ kind: 'staff', id: u.id, name: u.name, clinicId: u.clinicId, role: u.role })}
                                                        >
                                                            <i className="bi bi-trash3"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }}</PaginatedItems>}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {listTab === 'patients' && (
                    <>
                        <div className="dir-toolbar">
                            <div className="dir-search">
                                <i className="bi bi-search" aria-hidden="true"></i>
                                <input type="search" placeholder="Search name, Clinic ID or email…" aria-label="Search patient accounts" value={patientQuery} onChange={(e) => setPatientQuery(e.target.value)} />
                            </div>
                            <div className="dir-filter">
                                <UCIMSSelect value={patientType} onChange={(e) => setPatientType(e.target.value)} title="Filter by patient type">
                                    <option value="">All patient types</option>
                                    {patientTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                                </UCIMSSelect>
                            </div>
                            <button type="button" className="btn btn-outline btn-sm" onClick={refreshActive} title="Reload patient accounts">
                                <i className="bi bi-arrow-clockwise"></i> Refresh
                            </button>
                            <span className="dir-count">{filteredPatients.length} of {patients.length}</span>
                        </div>

                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Name &amp; Email</th>
                                        <th>Patient Type</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {patientsLoading && (
                                        <TableSkeletonRows columns={4} />
                                    )}
                                    {!patientsLoading && !filteredPatients.length && (
                                        <tr>
                                            <td colSpan={4} className="text-center text-muted p16">
                                                {patients.length ? 'No patients match this search or filter.' : 'No patient accounts found.'}
                                            </td>
                                        </tr>
                                    )}
                                    {<PaginatedItems items={filteredPatients} tableColumns={4} label="patients">{(p) => (
                                        <tr key={p.id}>
                                            <td className="text-xs fw6">{p.patientId || '-'}</td>
                                            <td>
                                                <div className="fw6">{p.name}</div>
                                                <div className="text-xs text-muted">{p.email || 'No email on file'}</div>
                                            </td>
                                            <td>
                                                <span className="badge b-maroon">{p.patient_type || 'Patient'}</span>
                                                {(p.college_dept || p.year_level) && (
                                                    <div className="text-xs text-muted mt4">{[p.college_dept, p.year_level].filter(Boolean).join(' - ')}</div>
                                                )}
                                            </td>
                                            <td>
                                                <div className="acct-row-actions">
                                                    <button
                                                        className="btn btn-outline btn-sm acct-delete-btn"
                                                        title="Delete Account"
                                                        aria-label={`Delete ${p.name}`}
                                                        onClick={() => setDeleteTarget({ kind: 'patient', id: p.id, name: p.name, clinicId: p.patientId, role: p.patient_type || 'Patient' })}
                                                    >
                                                        <i className="bi bi-trash3"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}</PaginatedItems>}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {listTab === 'requests' && (
                    <>
                        <div className="dir-toolbar">
                            <div className="dir-search">
                                <i className="bi bi-search" aria-hidden="true"></i>
                                <input type="search" placeholder="Search patient, requester or reason…" aria-label="Search deletion requests" value={requestQuery} onChange={(e) => setRequestQuery(e.target.value)} />
                            </div>
                            <div className="dir-filter">
                                <UCIMSSelect value={requestStatus} onChange={(e) => setRequestStatus(e.target.value)} title="Filter by request status">
                                    <option value="pending">Pending review</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="">All statuses</option>
                                </UCIMSSelect>
                            </div>
                            <button type="button" className="btn btn-outline btn-sm" onClick={refreshActive} title="Reload deletion requests">
                                <i className="bi bi-arrow-clockwise"></i> Refresh
                            </button>
                            <span className="dir-count">{filteredRequests.length} of {requests.length}</span>
                        </div>

                        <p className="acct-muted-note mb12">
                            <i className="bi bi-info-circle"></i> Nurse and staff requests for patient-record deletion land here. Approving removes the patient account; rejecting keeps the record and closes the request.
                        </p>

                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Patient</th>
                                        <th>Reason</th>
                                        <th>Requested By</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requestsLoading && <TableSkeletonRows columns={6} />}
                                    {!requestsLoading && !filteredRequests.length && (
                                        <tr>
                                            <td colSpan={6} className="text-center text-muted p16">
                                                {requests.length ? 'No deletion requests match this filter.' : 'No deletion requests have been submitted yet.'}
                                            </td>
                                        </tr>
                                    )}
                                    {<PaginatedItems items={filteredRequests} tableColumns={6} label="deletion requests">{(r) => {
                                        const badge = REQUEST_BADGE[r.status] || { cls: 'b-gray', label: r.status };
                                        return (
                                            <tr key={r.id}>
                                                <td className="text-xs" style={{ whiteSpace: 'nowrap' }}>{(r.created_at || '').slice(0, 16)}</td>
                                                <td>
                                                    <div className="fw6">{r.patientName || '—'}</div>
                                                    <div className="text-xs text-muted">{r.patientId || ''}</div>
                                                </td>
                                                <td className="text-sm req-reason">{r.reason}</td>
                                                <td>
                                                    <div className="text-xs fw6">{r.requestedBy || '—'}</div>
                                                    <div className="text-xs text-muted">{r.requestedByRole || ''}</div>
                                                </td>
                                                <td>
                                                    <span className={`badge ${badge.cls}`}>{badge.label}</span>
                                                    {r.reviewedBy && (
                                                        <div className="text-xs text-muted mt4">by {r.reviewedBy}</div>
                                                    )}
                                                    {r.review_notes && (
                                                        <div className="text-xs text-muted mt4">“{r.review_notes}”</div>
                                                    )}
                                                </td>
                                                <td>
                                                    {r.status === 'pending' ? (
                                                        <div className="acct-row-actions">
                                                            <button className="btn btn-primary btn-sm" onClick={() => setReviewRequest({ request: r, mode: 'approve' })} title="Approve and delete the patient record">
                                                                <i className="bi bi-check2"></i> Approve
                                                            </button>
                                                            <button className="btn btn-outline btn-sm" onClick={() => setReviewRequest({ request: r, mode: 'reject' })} title="Reject the request">
                                                                <i className="bi bi-x"></i> Reject
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted">Reviewed</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    }}</PaginatedItems>}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {listTab === 'aging' && (
                    <>
                        <p className="acct-muted-note mb12">
                            <i className="bi bi-hourglass-split"></i> The clinic clears records once they are five years old. Ages are counted from the account creation date
                            {agingCutoff ? `; the current cutoff is ${agingCutoff}.` : '.'}
                        </p>

                        <div className="dir-toolbar">
                            <div className="dir-search">
                                <i className="bi bi-search" aria-hidden="true"></i>
                                <input type="search" placeholder="Search name, Clinic ID or email…" aria-label="Search aging accounts" value={agingQuery} onChange={(e) => setAgingQuery(e.target.value)} />
                            </div>
                            <div className="dir-filter">
                                <UCIMSSelect value={agingKind} onChange={(e) => setAgingKind(e.target.value)} title="Filter by account type">
                                    <option value="">All account types</option>
                                    <option value="patient">Patient accounts</option>
                                    <option value="staff">Staff accounts</option>
                                </UCIMSSelect>
                            </div>
                            <div className="dir-filter">
                                <UCIMSSelect value={String(agingMinYears)} onChange={(e) => setAgingMinYears(Number(e.target.value))} title="Minimum account age">
                                    <option value="5">5+ years old</option>
                                    <option value="6">6+ years old</option>
                                    <option value="8">8+ years old</option>
                                    <option value="10">10+ years old</option>
                                </UCIMSSelect>
                            </div>
                            <button type="button" className="btn btn-outline btn-sm" onClick={refreshActive} title="Reload aging accounts">
                                <i className="bi bi-arrow-clockwise"></i> Refresh
                            </button>
                            <span className="dir-count">{filteredAging.length} of {oldAccounts.length}</span>
                        </div>

                        {selectedAging.size > 0 && (
                            <div className="dir-bulkbar">
                                <i className="bi bi-check2-square" aria-hidden="true"></i>
                                <span><b>{selectedAccounts.length}</b> account{selectedAccounts.length === 1 ? '' : 's'} selected</span>
                                <span className="acct-muted-note">Only accounts five years or older are included.</span>
                                <span className="spacer" />
                                <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelectedAging(new Set())}>Clear</button>
                                <button type="button" className="btn btn-danger btn-sm" onClick={() => setBatchOpen(true)}>
                                    <i className="bi bi-trash3"></i> Delete selected
                                </button>
                            </div>
                        )}

                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th className="acct-cb">
                                            <input
                                                type="checkbox"
                                                className="acct-check"
                                                checked={allAgingSelected}
                                                onChange={toggleAllAging}
                                                aria-label="Select all filtered aging accounts"
                                                title="Select all filtered accounts"
                                            />
                                        </th>
                                        <th>ID</th>
                                        <th>Account</th>
                                        <th>Type</th>
                                        <th>Created</th>
                                        <th>Age</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {oldLoading && <TableSkeletonRows columns={7} />}
                                    {!oldLoading && !filteredAging.length && (
                                        <tr>
                                            <td colSpan={7} className="text-center text-muted p16">
                                                {oldAccounts.length
                                                    ? 'No aging accounts match this search or filter.'
                                                    : 'No accounts are five years or older yet.'}
                                            </td>
                                        </tr>
                                    )}
                                    {<PaginatedItems items={filteredAging} tableColumns={7} label="aging accounts">{(a) => {
                                        const key = agingKey(a);
                                        return (
                                            <tr key={key}>
                                                <td className="acct-cb">
                                                    <input
                                                        type="checkbox"
                                                        className="acct-check"
                                                        checked={selectedAging.has(key)}
                                                        onChange={() => toggleAging(a)}
                                                        aria-label={`Select ${a.name}`}
                                                    />
                                                </td>
                                                <td className="text-xs fw6">{a.clinicId || '—'}</td>
                                                <td>
                                                    <div className="fw6">{a.name}</div>
                                                    <div className="text-xs text-muted">{a.email || 'No email on file'}</div>
                                                </td>
                                                <td>
                                                    <span className={`badge ${a.kind === 'patient' ? 'b-maroon' : 'b-blue'}`}>
                                                        {a.kind === 'patient' ? (a.patient_type || 'Patient') : (ROLE_LABELS[a.role] || a.role)}
                                                    </span>
                                                    <div className="text-xs text-muted mt4">{a.kind === 'patient' ? 'Patient account' : 'Staff account'}</div>
                                                </td>
                                                <td className="text-xs" style={{ whiteSpace: 'nowrap' }}>{a.created_at}</td>
                                                <td className="acct-age">
                                                    {a.age_label}
                                                    <small>{a.age_total_days.toLocaleString()} days old</small>
                                                </td>
                                                <td>
                                                    <div className="acct-row-actions">
                                                        <button
                                                            className="btn btn-outline btn-sm acct-delete-btn"
                                                            title="Delete this account"
                                                            aria-label={`Delete ${a.name}`}
                                                            onClick={() => setDeleteTarget({ kind: a.kind, id: a.id, name: a.name, clinicId: a.clinicId, role: a.kind === 'patient' ? (a.patient_type || 'Patient') : a.role })}
                                                        >
                                                            <i className="bi bi-trash3"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }}</PaginatedItems>}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
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
            {deleteTarget && (
                <DeleteAccountModal
                    target={deleteTarget}
                    showToast={showToast}
                    onClose={() => setDeleteTarget(null)}
                    onDeleted={(target) => {
                        setDeleteTarget(null);
                        if (target.kind === 'patient') {
                            setPatients((list) => list.filter((p) => String(p.id) !== String(target.id)));
                        }
                        setSelectedAging((previous) => {
                            const next = new Set(previous);
                            next.delete(`${target.kind}:${target.id}`);
                            return next;
                        });
                        reload();
                        fetchPatients();
                        fetchOldAccounts();
                        fetchRequests();
                    }}
                />
            )}
            {reviewRequest && (
                <ReviewDeletionRequestModal
                    request={reviewRequest.request}
                    mode={reviewRequest.mode}
                    showToast={showToast}
                    onClose={() => setReviewRequest(null)}
                    onDone={afterRequestReviewed}
                />
            )}
            {batchOpen && (
                <BatchDeleteAccountsModal
                    accounts={selectedAccounts}
                    showToast={showToast}
                    onClose={() => setBatchOpen(false)}
                    onDeleted={afterBatchDeleted}
                />
            )}
        </>
    );
}

// --------------------------------------------------
// System Authorization Management
// --------------------------------------------------
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
    ['Account Deletion', '', '', '', CHECK],
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
                            <UCIMSSelect id="role-staff" value={selected} onChange={(e) => setSelected(e.target.value)} disabled={loading}>
                                <option value="">- Select Staff -</option>
                                {options.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name} ({(u.role || '').toUpperCase()})
                                    </option>
                                ))}
                            </UCIMSSelect>
                        </div>
                        <div className="field">
                            <label htmlFor="role-new">New role</label>
                            <UCIMSSelect id="role-new" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                                <option value="nurse">Nurse</option>
                                <option value="doctor">Doctor</option>
                                <option value="admin">Admin</option>
                            </UCIMSSelect>
                        </div>
                    </div>
                    <button className="btn btn-primary w100 mt8" disabled={saving} onClick={handleUpdate}>
                        {saving ? 'Updating-' : <><i className="bi bi-arrow-repeat"></i> Update Role Authorization</>}
                    </button>
                </div>

                <div className="card canvas-permissions">
                    <div className="card-title">Role permissions overview</div>
                    <p className="text-sm text-muted">Existing feature access by role - Reference only</p>
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

// --------------------------------------------------
// Record Validation
// --------------------------------------------------
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

// --------------------------------------------------
// Page
// --------------------------------------------------
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
                <div className="main-content"><div className="canvas-topbar"><Button variant="ghost" size="icon" aria-label={collapsed?'Expand sidebar':'Collapse sidebar'} aria-expanded={!collapsed} aria-controls="admin-sidebar" onClick={()=>setCollapsed(v=>!v)}>{collapsed?<PanelLeftOpen/>:<PanelLeftClose/>}</Button><strong>{{analytics:'Reports',accounts:'Account Management',authorization:'Authorization Management',validation:'Record Validation'}[section]}</strong><span>USeP - Clinic administration</span></div>
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
