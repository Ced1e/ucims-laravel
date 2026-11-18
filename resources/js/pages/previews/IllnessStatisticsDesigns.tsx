import { Head } from '@inertiajs/react';
import {
    Activity,
    ArrowUpRight,
    BarChart3,
    ClipboardList,
    ChevronLeft,
    ChevronRight,
    Filter,
    Layers,
    ListOrdered,
    Search,
    Stethoscope,
    TrendingUp,
} from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

/*
 * Illness Statistics — 5 styling directions for the Admin Reports panel.
 *
 * Preview only. Nothing here is wired into Admin/Analytics.jsx yet.
 * The data shown mirrors what the live panel computes (grouped by ICD-10
 * code, falling back to diagnosis text).
 */

type Mode = 'word' | 'code';

type Illness = {
    name: string;
    code: string;
    cases: number;
    chapter: string;
};

const FEW: Illness[] = [
    { name: 'Acute upper respiratory infection, unspecified', code: 'J06.9', cases: 1, chapter: 'Respiratory' },
    { name: 'Cough', code: 'R05', cases: 1, chapter: 'Symptoms' },
];

const TYPICAL: Illness[] = [
    { name: 'Acute upper respiratory infection, unspecified', code: 'J06.9', cases: 14, chapter: 'Respiratory' },
    { name: 'Acute nasopharyngitis [common cold]', code: 'J00', cases: 11, chapter: 'Respiratory' },
    { name: 'Acute pharyngitis, unspecified', code: 'J02.9', cases: 8, chapter: 'Respiratory' },
    { name: 'Fever, unspecified', code: 'R50.9', cases: 7, chapter: 'Symptoms' },
    { name: 'Headache', code: 'R51', cases: 6, chapter: 'Symptoms' },
    { name: 'Gastritis, unspecified, without bleeding', code: 'K29.70', cases: 5, chapter: 'Digestive' },
    { name: 'Essential (primary) hypertension', code: 'I10', cases: 4, chapter: 'Circulatory' },
    { name: 'Cough', code: 'R05', cases: 3, chapter: 'Symptoms' },
];

const MANY: Illness[] = [
    ...TYPICAL,
    { name: 'Dengue fever [classical dengue]', code: 'A90', cases: 3, chapter: 'Infectious' },
    { name: 'Typhoid fever', code: 'A01.0', cases: 3, chapter: 'Infectious' },
    { name: 'Allergic rhinitis due to pollen', code: 'J30.1', cases: 3, chapter: 'Respiratory' },
    { name: 'Acute bronchitis, unspecified', code: 'J20.9', cases: 2, chapter: 'Respiratory' },
    { name: 'Urinary tract infection, site not specified', code: 'N39.0', cases: 2, chapter: 'Genitourinary' },
    { name: 'Myalgia', code: 'M79.1', cases: 2, chapter: 'Musculoskeletal' },
    { name: 'Dermatitis, unspecified', code: 'L30.9', cases: 2, chapter: 'Skin' },
    { name: 'Constipation, unspecified', code: 'K59.00', cases: 2, chapter: 'Digestive' },
    { name: 'Migraine, unspecified', code: 'G43.9', cases: 1, chapter: 'Nervous' },
    { name: 'Conjunctivitis, unspecified', code: 'H10.9', cases: 1, chapter: 'Eye / ear' },
];

const SORTS: Record<string, Illness[]> = {
    few: FEW,
    typical: TYPICAL,
    many: MANY,
};

const COLORS = ['#7B1113', '#9B1E20', '#C9A227', '#1A3A6B', '#2D6A2D'];

function sumCases(rows: Illness[]): number {
    return rows.reduce((sum, row) => sum + row.cases, 0);
}

function share(cases: number, total: number): number {
    return total ? Math.round((cases / total) * 1000) / 10 : 0;
}

function normalizeCode(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function filterRows(rows: Illness[], mode: Mode, query: string): Illness[] {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;

    return rows.filter((row) =>
        mode === 'code'
            ? normalizeCode(row.code).includes(normalizeCode(needle))
            : row.name.toLowerCase().includes(needle),
    );
}

function useSearch(rows: Illness[]) {
    const [mode, setMode] = useState<Mode>('word');
    const [q, setQ] = useState('');
    // Keep typing responsive on large registers: the list follows a deferred
    // copy of the query instead of filtering on every keystroke.
    const deferredQ = useDeferredValue(q);
    const filtered = useMemo(() => filterRows(rows, mode, deferredQ), [rows, mode, deferredQ]);

    return { mode, setMode, q, setQ, filtered };
}

// ─────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────

function Chip({ children, tone = 'maroon' }: { children: ReactNode; tone?: 'maroon' | 'gold' | 'plain' }) {
    return <span className={`isd-chip isd-chip-${tone}`}>{children}</span>;
}

function Empty({ children = 'No condition matches this search.' }: { children?: ReactNode }) {
    return (
        <div className="isd-empty">
            <Search size={18} aria-hidden="true" />
            <p>{children}</p>
        </div>
    );
}

function SearchBox({
    mode,
    setMode,
    q,
    setQ,
    compact = false,
}: {
    mode: Mode;
    setMode: (mode: Mode) => void;
    q: string;
    setQ: (value: string) => void;
    compact?: boolean;
}) {
    return (
        <div className={`isd-search${compact ? ' isd-search-compact' : ''}`}>
            <div className="isd-search-seg" role="group" aria-label="Search illnesses by">
                <button
                    type="button"
                    aria-pressed={mode === 'word'}
                    onClick={() => setMode('word')}
                >
                    Word
                </button>
                <button
                    type="button"
                    aria-pressed={mode === 'code'}
                    onClick={() => setMode('code')}
                >
                    ICD-10
                </button>
            </div>
            <label className="isd-search-input">
                <Search size={15} aria-hidden="true" />
                <input
                    type="search"
                    value={q}
                    onChange={(event) => setQ(event.target.value)}
                    aria-label={mode === 'code' ? 'Search by ICD-10 code' : 'Search by disease or condition'}
                    placeholder={mode === 'code' ? 'Search code, e.g. J06.9' : 'Search condition, e.g. cough'}
                />
            </label>
        </div>
    );
}

function ShareBar({ value, max, tone = '#7B1113' }: { value: number; max: number; tone?: string }) {
    const width = max ? Math.max(3, (value / max) * 100) : 0;

    return (
        <span className="isd-share" aria-hidden="true">
            <span style={{ width: `${width}%`, background: tone }} />
        </span>
    );
}

function DonutChart({ rows, total, size = 176 }: { rows: Illness[]; total: number; size?: number }) {
    const top = rows.slice(0, 4);
    const rest = total - sumCases(top);
    const stops: string[] = [];
    let running = 0;

    top.forEach((row, index) => {
        const from = total ? (running / total) * 100 : 0;
        running += row.cases;
        const to = total ? (running / total) * 100 : 0;
        stops.push(`${COLORS[index]} ${from}% ${to}%`);
    });

    if (rest > 0 && total) {
        stops.push(`#CFC9BE ${(running / total) * 100}% 100%`);
    }

    const background = total
        ? `conic-gradient(${stops.join(', ')})`
        : 'conic-gradient(#EDEBE5 0 100%)';

    const summary = total
        ? `${total} diagnoses across ${rows.length} conditions. Leading condition: ${rows[0]?.name}, ${rows[0]?.cases} cases.`
        : 'No diagnoses recorded for this view.';

    return (
        <div className="isd-donut-wrap">
            <div
                className="isd-donut"
                style={{ width: size, height: size, background }}
                role="img"
                aria-label={summary}
            >
                <div className="isd-donut-hole">
                    <strong>{total}</strong>
                    <span>diagnoses</span>
                </div>
            </div>
            <ul className="isd-legend">
                {top.map((row, index) => (
                    <li key={`${row.code}-${row.name}`}>
                        <i style={{ background: COLORS[index] }} aria-hidden="true" />
                        <span title={row.name}>{row.name}</span>
                        <b>{row.cases}</b>
                    </li>
                ))}
                {rest > 0 && (
                    <li>
                        <i style={{ background: '#CFC9BE' }} aria-hidden="true" />
                        <span>Other conditions</span>
                        <b>{rest}</b>
                    </li>
                )}
                {!top.length && <li className="isd-legend-empty">Nothing to chart yet.</li>}
            </ul>
        </div>
    );
}

function Pager({
    page,
    pages,
    onChange,
}: {
    page: number;
    pages: number;
    onChange: (page: number) => void;
}) {
    if (pages <= 1) return null;

    return (
        <div className="isd-pager">
            <button
                type="button"
                onClick={() => onChange(page - 1)}
                disabled={page <= 1}
                aria-label="Previous page"
            >
                <ChevronLeft size={15} />
            </button>
            <span>
                Page {page} of {pages}
            </span>
            <button
                type="button"
                onClick={() => onChange(page + 1)}
                disabled={page >= pages}
                aria-label="Next page"
            >
                <ChevronRight size={15} />
            </button>
        </div>
    );
}

function Rank({ index }: { index: number }) {
    return <span className={`isd-rank${index < 3 ? ` isd-rank-${index + 1}` : ''}`}>{index + 1}</span>;
}

// ─────────────────────────────────────────────────────────────
// Design 1 — Polished Baseline
// ─────────────────────────────────────────────────────────────

function Design1({ rows }: { rows: Illness[] }) {
    const { mode, setMode, q, setQ, filtered } = useSearch(rows);
    const total = sumCases(filtered);
    const leader = filtered[0];
    const top = filtered.slice(0, 8);
    const max = top[0]?.cases ?? 1;
    const [page, setPage] = useState(1);
    const pageSize = 8;
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const current = Math.min(page, pages);
    const pageRows = filtered.slice((current - 1) * pageSize, current * pageSize);

    return (
        <div className="card isd-panel">
            <div className="isd-panel-head">
                <div>
                    <h2 className="isd-title">Illness Statistics</h2>
                    <p className="isd-sub">Conditions recorded across the filtered consultations.</p>
                </div>
                <SearchBox mode={mode} setMode={setMode} q={q} setQ={setQ} />
            </div>

            <div className="isd-kpis">
                <div className="stat-card isd-kpi">
                    <span className="isd-kpi-icon isd-tone-maroon"><Activity size={18} /></span>
                    <div>
                        <div className="stat-num">{filtered.length}</div>
                        <div className="stat-label">Unique illnesses</div>
                    </div>
                </div>
                <div className="stat-card isd-kpi isd-stat-gold">
                    <span className="isd-kpi-icon isd-tone-gold"><ClipboardList size={18} /></span>
                    <div>
                        <div className="stat-num">{total}</div>
                        <div className="stat-label">Diagnoses recorded</div>
                    </div>
                </div>
                <div className="isd-kpi-feature">
                    <div className="isd-feature-label"><TrendingUp size={15} aria-hidden="true" /> Most common</div>
                    <div className="isd-feature-name">{leader ? leader.name : 'No diagnoses yet'}</div>
                    {leader && (
                        <div className="isd-feature-meta">
                            <Chip>{leader.code}</Chip>
                            <span>{leader.cases} {leader.cases === 1 ? 'case' : 'cases'}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="isd-split">
                <div className="isd-block">
                    <div className="isd-block-head">
                        <h3>Top conditions</h3>
                        <span>Ranked by cases</span>
                    </div>
                    <div className="isd-bars">
                        {top.map((row) => (
                            <div className="isd-bar-row" key={`${row.code}-${row.name}`}>
                                <div className="isd-bar-label">
                                    <span title={row.name}>{row.name}</span>
                                    <Chip tone="plain">{row.code}</Chip>
                                </div>
                                <div className="isd-bar-track">
                                    <span style={{ width: `${(row.cases / max) * 100}%` }} />
                                    <em>{row.cases}</em>
                                </div>
                            </div>
                        ))}
                        {!top.length && <Empty />}
                    </div>
                </div>

                <div className="isd-block">
                    <div className="isd-block-head">
                        <h3>All recorded conditions</h3>
                        <span>{filtered.length} total</span>
                    </div>
                    <div className="table-wrap isd-table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th scope="col">Condition</th>
                                    <th scope="col">ICD-10</th>
                                    <th scope="col" className="isd-num">Cases</th>
                                    <th scope="col">Share</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.map((row) => (
                                    <tr key={`${row.code}-${row.name}`}>
                                        <td className="isd-strong">{row.name}</td>
                                        <td>{row.code || '—'}</td>
                                        <td className="isd-num">{row.cases}</td>
                                        <td>
                                            <div className="isd-share-cell">
                                                <ShareBar value={row.cases} max={max} />
                                                <span>{share(row.cases, total)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!pageRows.length && (
                                    <tr>
                                        <td colSpan={4}><Empty /></td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="isd-foot">
                        <span className="isd-foot-note">Showing {pageRows.length} of {filtered.length}</span>
                        <Pager page={current} pages={pages} onChange={setPage} />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Design 2 — Registry (table-first)
// ─────────────────────────────────────────────────────────────

function Design2({ rows }: { rows: Illness[] }) {
    const { mode, setMode, q, setQ, filtered } = useSearch(rows);
    const total = sumCases(filtered);
    const leader = filtered[0];
    const max = leader?.cases ?? 1;
    const [page, setPage] = useState(1);
    const pageSize = 9;
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const current = Math.min(page, pages);
    const start = (current - 1) * pageSize;
    const pageRows = filtered.slice(start, start + pageSize);

    return (
        <div className="card isd-panel isd-d2">
            <div className="isd-panel-head isd-panel-head-tight">
                <div className="isd-d2-heading">
                    <span className="isd-eyebrow"><Layers size={13} aria-hidden="true" /> Clinic register</span>
                    <h2 className="isd-title isd-title-lg">Illness register</h2>
                </div>
                <SearchBox mode={mode} setMode={setMode} q={q} setQ={setQ} compact />
            </div>

            <div className="isd-summary">
                <div>
                    <strong>{filtered.length}</strong>
                    <span>unique conditions</span>
                </div>
                <div>
                    <strong>{total}</strong>
                    <span>diagnoses recorded</span>
                </div>
                <div className="isd-summary-leader">
                    {leader ? (
                        <>
                            <strong>{leader.code}</strong>
                            <span>{leader.name}</span>
                        </>
                    ) : (
                        <>
                            <strong>—</strong>
                            <span>no diagnoses yet</span>
                        </>
                    )}
                </div>
            </div>

            <div className="table-wrap isd-registry-wrap">
                <table className="isd-registry">
                    <thead>
                        <tr>
                            <th scope="col" className="isd-rank-col">#</th>
                            <th scope="col">Condition</th>
                            <th scope="col">ICD-10</th>
                            <th scope="col" className="isd-dist-col">Distribution</th>
                            <th scope="col" className="isd-num">Cases</th>
                            <th scope="col" className="isd-num">Share</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageRows.map((row, index) => (
                            <tr key={`${row.code}-${row.name}`}>
                                <td><Rank index={start + index} /></td>
                                <td className="isd-strong">{row.name}</td>
                                <td><Chip tone="plain">{row.code || '—'}</Chip></td>
                                <td className="isd-dist-col"><ShareBar value={row.cases} max={max} /></td>
                                <td className="isd-num isd-strong">{row.cases}</td>
                                <td className="isd-num">{share(row.cases, total)}%</td>
                            </tr>
                        ))}
                        {!pageRows.length && (
                            <tr>
                                <td colSpan={6}><Empty /></td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="isd-foot isd-foot-registry">
                <span className="isd-foot-note">
                    Showing {filtered.length ? start + 1 : 0}–{Math.min(start + pageSize, filtered.length)} of {filtered.length}
                </span>
                <Pager page={current} pages={pages} onChange={setPage} />
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Design 3 — Insight Split
// ─────────────────────────────────────────────────────────────

function Design3({ rows }: { rows: Illness[] }) {
    const { mode, setMode, q, setQ, filtered } = useSearch(rows);
    const total = sumCases(filtered);
    const leader = filtered[0];
    const top3 = sumCases(filtered.slice(0, 3));
    const [page, setPage] = useState(1);
    const pageSize = 6;
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const current = Math.min(page, pages);
    const pageRows = filtered.slice((current - 1) * pageSize, current * pageSize);
    const max = leader?.cases ?? 1;

    return (
        <div className="card isd-panel isd-flush isd-d3">
            <div className="isd-d3-hero">
                <div className="isd-d3-lead">
                    <span className="isd-eyebrow isd-eyebrow-light"><Stethoscope size={13} aria-hidden="true" /> Most common condition</span>
                    <h2>{leader ? leader.name : 'No diagnoses recorded yet'}</h2>
                    {leader && (
                        <div className="isd-d3-meta">
                            <Chip tone="gold">{leader.code}</Chip>
                            <span>{leader.cases} {leader.cases === 1 ? 'case' : 'cases'} · {share(leader.cases, total)}% of filtered</span>
                        </div>
                    )}
                </div>
                <div className="isd-d3-stats">
                    <div>
                        <strong>{filtered.length}</strong>
                        <span>Unique</span>
                    </div>
                    <div>
                        <strong>{total}</strong>
                        <span>Diagnoses</span>
                    </div>
                    <div>
                        <strong>{total ? Math.round((top3 / total) * 100) : 0}%</strong>
                        <span>Top 3 share</span>
                    </div>
                </div>
            </div>

            <div className="isd-d3-search">
                <SearchBox mode={mode} setMode={setMode} q={q} setQ={setQ} compact />
            </div>

            <div className="isd-d3-body">
                <div className="isd-d3-chart">
                    <DonutChart rows={filtered} total={total} />
                </div>

                <div className="isd-d3-ranked">
                    <div className="isd-block-head">
                        <h3><BarChart3 size={15} aria-hidden="true" /> Ranked conditions</h3>
                        <span>Top {Math.min(6, filtered.length)}</span>
                    </div>
                    <ol className="isd-rank-list">
                        {filtered.slice(0, 6).map((row, index) => (
                            <li key={`${row.code}-${row.name}`}>
                                <Rank index={index} />
                                <div className="isd-rank-body">
                                    <div className="isd-rank-top">
                                        <span className="isd-rank-name" title={row.name}>{row.name}</span>
                                        <span className="isd-rank-count">{row.cases}</span>
                                    </div>
                                    <ShareBar value={row.cases} max={max} tone={COLORS[index % COLORS.length]} />
                                </div>
                                <Chip tone="plain">{row.code}</Chip>
                            </li>
                        ))}
                    </ol>
                    {!filtered.length && <Empty />}
                </div>
            </div>

            <div className="isd-d3-foot">
                <details className="isd-disclosure">
                    <summary>
                        <span><ListOrdered size={14} aria-hidden="true" /> View the full condition list</span>
                        <span className="isd-disclosure-count">{filtered.length}</span>
                    </summary>
                    <div className="table-wrap isd-table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th scope="col">Condition</th>
                                    <th scope="col">ICD-10</th>
                                    <th scope="col" className="isd-num">Cases</th>
                                    <th scope="col" className="isd-num">Share</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.map((row) => (
                                    <tr key={`${row.code}-${row.name}`}>
                                        <td className="isd-strong">{row.name}</td>
                                        <td>{row.code || '—'}</td>
                                        <td className="isd-num">{row.cases}</td>
                                        <td className="isd-num">{share(row.cases, total)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="isd-foot">
                        <span className="isd-foot-note">Page {current} of {pages}</span>
                        <Pager page={current} pages={pages} onChange={setPage} />
                    </div>
                </details>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Design 4 — Category Tabs
// ─────────────────────────────────────────────────────────────

function Design4({ rows }: { rows: Illness[] }) {
    const { mode, setMode, q, setQ, filtered } = useSearch(rows);
    const [chapter, setChapter] = useState('All');

    const chapters = useMemo(() => {
        const map = new Map<string, number>();

        rows.forEach((row) => {
            map.set(row.chapter, (map.get(row.chapter) ?? 0) + row.cases);
        });

        return [...map.entries()]
            .map(([name, cases]) => ({ name, cases }))
            .sort((a, b) => b.cases - a.cases || a.name.localeCompare(b.name));
    }, [rows]);

    const scoped = filtered.filter((row) => chapter === 'All' || row.chapter === chapter);
    const total = sumCases(scoped);
    const grandTotal = sumCases(filtered);
    const max = scoped[0]?.cases ?? 1;
    const chaptersInView = new Set(filtered.map((row) => row.chapter)).size;
    const countIn = (name: string) => filtered.filter((row) => row.chapter === name).length;

    return (
        <div className="card isd-panel isd-d4">
            <div className="isd-panel-head">
                <div>
                    <h2 className="isd-title">Illness Statistics</h2>
                    <p className="isd-sub">
                        {filtered.length} conditions across {chaptersInView} body systems. Pick a tab to narrow the view.
                    </p>
                </div>
                <SearchBox mode={mode} setMode={setMode} q={q} setQ={setQ} compact />
            </div>

            <div className="isd-tabs" role="group" aria-label="Filter illnesses by body system">
                <button
                    type="button"
                    aria-pressed={chapter === 'All'}
                    className={chapter === 'All' ? 'is-active' : ''}
                    onClick={() => setChapter('All')}
                >
                    All <b>{filtered.length}</b>
                </button>
                {chapters.map((item) => (
                    <button
                        key={item.name}
                        type="button"
                        aria-pressed={chapter === item.name}
                        className={chapter === item.name ? 'is-active' : ''}
                        onClick={() => setChapter(item.name)}
                    >
                        {item.name} <b>{countIn(item.name)}</b>
                    </button>
                ))}
            </div>

            <div className="isd-d4-body">
                <div className="isd-d4-chart">
                    <DonutChart rows={scoped} total={total} size={164} />
                    <div className="isd-d4-note">
                        {chapter === 'All' ? 'All body systems' : chapter} · {total} diagnoses
                    </div>
                </div>

                <div className="isd-d4-list">
                    <div className="isd-block-head">
                        <h3><Filter size={14} aria-hidden="true" /> {chapter === 'All' ? 'Most frequent overall' : `Most frequent in ${chapter}`}</h3>
                        <span>{scoped.length} conditions</span>
                    </div>
                    <div className="isd-bars">
                        {scoped.slice(0, 6).map((row) => (
                            <div className="isd-bar-row" key={`${row.code}-${row.name}`}>
                                <div className="isd-bar-label">
                                    <span title={row.name}>{row.name}</span>
                                    <Chip tone="plain">{row.code}</Chip>
                                </div>
                                <div className="isd-bar-track">
                                    <span style={{ width: `${(row.cases / max) * 100}%` }} />
                                    <em>{row.cases}</em>
                                </div>
                            </div>
                        ))}
                        {!scoped.length && <Empty />}
                    </div>
                </div>
            </div>

            <div className="isd-d4-table">
                <div className="isd-block-head">
                    <h3>Conditions in this view</h3>
                    <span>{share(total, grandTotal)}% of all diagnoses</span>
                </div>
                <div className="table-wrap isd-table-scroll isd-table-short">
                    <table>
                        <thead>
                            <tr>
                                <th scope="col">Condition</th>
                                <th scope="col">ICD-10</th>
                                <th scope="col">System</th>
                                <th scope="col" className="isd-num">Cases</th>
                                <th scope="col" className="isd-num">Share</th>
                            </tr>
                        </thead>
                        <tbody>
                            {scoped.slice(0, 6).map((row) => (
                                <tr key={`${row.code}-${row.name}`}>
                                    <td className="isd-strong">{row.name}</td>
                                    <td>{row.code || '—'}</td>
                                    <td><span className="isd-system">{row.chapter}</span></td>
                                    <td className="isd-num">{row.cases}</td>
                                    <td className="isd-num">{share(row.cases, total)}%</td>
                                </tr>
                            ))}
                            {!scoped.length && (
                                <tr>
                                    <td colSpan={5}><Empty /></td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {scoped.length > 6 && (
                    <div className="isd-foot">
                        <span className="isd-foot-note">6 of {scoped.length} shown — use search or a tab to narrow down.</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Design 5 — Editorial Podium
// ─────────────────────────────────────────────────────────────

function Design5({ rows }: { rows: Illness[] }) {
    const { mode, setMode, q, setQ, filtered } = useSearch(rows);
    const total = sumCases(filtered);
    const podium = filtered.slice(0, 3);
    const rest = filtered.slice(3);
    const max = podium[0]?.cases ?? 1;

    return (
        <div className="card isd-panel isd-d5">
            <div className="isd-d5-head">
                <div>
                    <span className="isd-eyebrow"><SparkMark /> Clinic intelligence</span>
                    <h2 className="isd-title isd-title-lg">What the clinic is treating</h2>
                    <div className="isd-gold-rule" aria-hidden="true" />
                    <p className="isd-sub">
                        {filtered.length} conditions · {total} diagnoses · top 3 account for{' '}
                        {total ? Math.round((sumCases(podium) / total) * 100) : 0}% of cases
                    </p>
                </div>
                <SearchBox mode={mode} setMode={setMode} q={q} setQ={setQ} compact />
            </div>

            <div className="isd-podium">
                {podium[0] && (
                    <article className="isd-podium-card isd-podium-first">
                        <span className="isd-podium-rank">01</span>
                        <div className="isd-podium-top">
                            <Chip tone="gold">{podium[0].code}</Chip>
                            <span className="isd-podium-trend"><ArrowUpRight size={13} aria-hidden="true" /> most common</span>
                        </div>
                        <h3>{podium[0].name}</h3>
                        <div className="isd-podium-figure">
                            <strong>{podium[0].cases}</strong>
                            <span>cases · {share(podium[0].cases, total)}%</span>
                        </div>
                        <div className="isd-podium-meter" aria-hidden="true">
                            <span style={{ width: '100%' }} />
                        </div>
                    </article>
                )}

                <div className="isd-podium-side">
                    {podium.slice(1).map((row, index) => (
                        <article className="isd-podium-card isd-podium-minor" key={`${row.code}-${row.name}`}>
                            <span className="isd-podium-rank">{String(index + 2).padStart(2, '0')}</span>
                            <div className="isd-podium-minor-body">
                                <h3>{row.name}</h3>
                                <div className="isd-podium-minor-meta">
                                    <Chip tone="plain">{row.code}</Chip>
                                    <span>{row.cases} cases · {share(row.cases, total)}%</span>
                                </div>
                                <div className="isd-podium-meter" aria-hidden="true">
                                    <span style={{ width: `${(row.cases / max) * 100}%` }} />
                                </div>
                            </div>
                        </article>
                    ))}
                    {!podium.length && <Empty />}
                </div>
            </div>

            <div className="isd-ledger">
                <div className="isd-ledger-head">
                    <h3><ClipboardList size={14} aria-hidden="true" /> Condition ledger</h3>
                    <span>{rest.length} more recorded</span>
                </div>
                <div className="isd-ledger-grid">
                    {rest.map((row, index) => (
                        <div className="isd-ledger-row" key={`${row.code}-${row.name}`}>
                            <span className="isd-ledger-idx">{String(index + 4).padStart(2, '0')}</span>
                            <span className="isd-ledger-name" title={row.name}>{row.name}</span>
                            <Chip tone="plain">{row.code}</Chip>
                            <span className="isd-ledger-count">{row.cases}</span>
                        </div>
                    ))}
                    {!rest.length && filtered.length > 0 && (
                        <p className="isd-ledger-empty">Every recorded condition is already on the podium.</p>
                    )}
                    {!filtered.length && <Empty />}
                </div>
            </div>
        </div>
    );
}

function SparkMark() {
    return (
        <span className="isd-spark" aria-hidden="true">
            <i />
            <i />
            <i />
        </span>
    );
}

// ─────────────────────────────────────────────────────────────
// Page shell
// ─────────────────────────────────────────────────────────────

const DESIGNS = [
    {
        n: 1,
        name: 'Polished Baseline',
        best: 'Lowest risk — closest to what is live today.',
        detail: 'Keeps the familiar KPI cards, bars and table, but adds value labels, a maroon "most common" card, a compact word/code switch and a calmer hierarchy.',
        Component: Design1,
    },
    {
        n: 2,
        name: 'Registry',
        best: 'Dozens of conditions, admin scans a list.',
        detail: 'One table does all the work: rank, condition, code, inline distribution bar, cases and share. The summary strip replaces the chart, so nothing overflows.',
        Component: Design2,
    },
    {
        n: 3,
        name: 'Insight Split',
        best: 'Monthly report or presentation screen.',
        detail: 'A maroon hero band leads with the most common condition, then a donut beside a ranked top-6 list. The full list stays tucked inside a disclosure.',
        Component: Design3,
    },
    {
        n: 4,
        name: 'Category Tabs',
        best: 'The list keeps growing every semester.',
        detail: 'Groups conditions by body system with tabs and per-tab counts, then shows a donut, top-6 bars and a short table for the active group. Overflow is absorbed by the tabs.',
        Component: Design4,
    },
    {
        n: 5,
        name: 'Editorial Podium',
        best: 'An executive summary at the top of Reports.',
        detail: 'Gold rules and serif type frame a top-3 podium, followed by a dense two-column condition ledger. Feels like a clinic bulletin rather than a dashboard widget.',
        Component: Design5,
    },
];

export default function IllnessStatisticsDesigns() {
    const [dataKey, setDataKey] = useState<'few' | 'typical' | 'many'>('typical');

    const rows = useMemo(
        () => [...SORTS[dataKey]].sort((a, b) => b.cases - a.cases || a.name.localeCompare(b.name)),
        [dataKey],
    );

    return (
        <>
            <Head title="Illness statistics — design previews">
                <link rel="stylesheet" href="/assets/css/main.css" />
            </Head>

            <div className="isd-page">
                <header className="isd-top">
                    <div className="isd-top-copy">
                        <span className="isd-eyebrow">Admin · Reports · design review</span>
                        <h1>Illness statistics, five ways</h1>
                        <p>
                            Same data, five ways to organise it. Preview only — <code>Admin/Analytics.jsx</code> is
                            untouched until you choose one.
                        </p>
                    </div>

                    <div className="isd-top-controls">
                        <span className="isd-control-label">Data set</span>
                        <div className="isd-seg" role="group" aria-label="Preview data set">
                            {(['few', 'typical', 'many'] as const).map((key) => (
                                <button
                                    key={key}
                                    type="button"
                                    aria-pressed={dataKey === key}
                                    onClick={() => setDataKey(key)}
                                >
                                    {key === 'few' ? 'Few · 2' : key === 'typical' ? 'Typical · 8' : 'Many · 18'}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                <nav className="isd-jump" aria-label="Jump to a design">
                    {DESIGNS.map((design) => (
                        <a key={design.n} href={`#design-${design.n}`}>
                            <b>{String(design.n).padStart(2, '0')}</b>
                            {design.name}
                        </a>
                    ))}
                </nav>

                {DESIGNS.map(({ n, name, best, detail, Component }) => (
                    <section key={n} id={`design-${n}`} className="isd-section">
                        <div className="isd-section-head">
                            <span className="isd-section-num">{String(n).padStart(2, '0')}</span>
                            <div>
                                <h2>{name}</h2>
                                <p>{detail}</p>
                            </div>
                            <span className="isd-best"><b>Best for</b> {best}</span>
                        </div>
                        <Component rows={rows} />
                    </section>
                ))}

                <footer className="isd-footer">
                    <p>
                        These previews reuse the live palette and type system. Once you pick a direction, I'll port it
                        into the Reports page and keep the existing filters, grouping and pagination intact.
                    </p>
                </footer>
            </div>
        </>
    );
}
