import { Head } from '@inertiajs/react';
import {
    Activity,
    ArrowUpRight,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Grid3x3,
    Layers,
    Rows3,
    Search,
    Sparkles,
    TrendingUp,
} from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

/*
 * Illness Statistics — round 2, four new directions.
 *
 *  06 Bento Overview   — asymmetric modular tiles (bento-box-grid)
 *  07 Swiss Ledger     — typographic grid, hairlines, no cards (minimalism/swiss)
 *  08 Explorer Split   — body-system tree + selected-condition detail (progressive disclosure)
 *  09 Heatmap Matrix   — condition × month intensity grid with printed values
 *
 * Preview only. Nothing is wired into Admin/Analytics.jsx yet.
 */

type Mode = 'word' | 'code';

type Illness = {
    name: string;
    code: string;
    cases: number;
    chapter: string;
};

const MONTHS = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];

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

const SORTS: Record<string, Illness[]> = { few: FEW, typical: TYPICAL, many: MANY };

// Deterministic month split so the preview looks stable between renders.
const MONTH_WEIGHTS = [0.55, 1.15, 0.8, 1.35, 0.85, 1.2];

function monthValue(row: Illness, index: number): number {
    if (!row.cases) return 0;
    const weight = MONTH_WEIGHTS[(index + row.code.length) % MONTH_WEIGHTS.length];
    return Math.max(0, Math.round((row.cases / MONTHS.length) * weight));
}

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
    const deferredQ = useDeferredValue(q);
    const filtered = useMemo(() => filterRows(rows, mode, deferredQ), [rows, mode, deferredQ]);

    return { mode, setMode, q, setQ, filtered };
}

// ─────────────────────────────────────────────────────────────
// Shared pieces
// ─────────────────────────────────────────────────────────────

function Chip({ children, tone = 'plain' }: { children: ReactNode; tone?: 'plain' | 'maroon' | 'gold' }) {
    return <span className={`isd2-chip isd2-chip-${tone}`}>{children}</span>;
}

function SearchBox({
    mode,
    setMode,
    q,
    setQ,
    variant = 'default',
}: {
    mode: Mode;
    setMode: (mode: Mode) => void;
    q: string;
    setQ: (value: string) => void;
    variant?: 'default' | 'bare';
}) {
    return (
        <div className={`isd2-search${variant === 'bare' ? ' isd2-search-bare' : ''}`}>
            <div className="isd2-search-seg" role="group" aria-label="Search illnesses by">
                <button type="button" aria-pressed={mode === 'word'} onClick={() => setMode('word')}>
                    Word
                </button>
                <button type="button" aria-pressed={mode === 'code'} onClick={() => setMode('code')}>
                    ICD-10
                </button>
            </div>
            <label className="isd2-search-field">
                <Search size={15} aria-hidden="true" />
                <input
                    type="search"
                    value={q}
                    onChange={(event) => setQ(event.target.value)}
                    aria-label={mode === 'code' ? 'Search by ICD-10 code' : 'Search by disease or condition'}
                    placeholder={mode === 'code' ? 'Code, e.g. J06.9' : 'Condition, e.g. cough'}
                />
            </label>
        </div>
    );
}

function Empty() {
    return (
        <div className="isd2-empty">
            <Search size={18} aria-hidden="true" />
            <p>No condition matches this search.</p>
        </div>
    );
}

function Bar({ value, max, tone = 'maroon' }: { value: number; max: number; tone?: 'maroon' | 'gold' | 'blue' }) {
    return (
        <span className={`isd2-bar isd2-bar-${tone}`} aria-hidden="true">
            <span style={{ width: `${max ? Math.max(3, (value / max) * 100) : 0}%` }} />
        </span>
    );
}

function Sparkline({ values, width = 190, height = 46 }: { values: number[]; width?: number; height?: number }) {
    const max = Math.max(...values, 1);
    const step = values.length > 1 ? width / (values.length - 1) : width;
    const coords = values.map((value, index) => ({
        x: index * step,
        y: height - 4 - (value / max) * (height - 10),
    }));
    const points = coords.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
    const last = coords[coords.length - 1];

    return (
        <svg
            className="isd2-spark"
            viewBox={`0 0 ${width} ${height}`}
            width={width}
            height={height}
            role="img"
            aria-label={`Monthly case trend: ${values.join(', ')}`}
        >
            <polyline points={points} fill="none" stroke="#C9A227" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {last && <circle cx={last.x} cy={last.y} r="3.5" fill="#fff" stroke="#C9A227" strokeWidth="2.5" />}
        </svg>
    );
}

function Pager({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
    if (pages <= 1) return null;

    return (
        <div className="isd2-pager">
            <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
                <ChevronLeft size={15} />
            </button>
            <span>{String(page).padStart(2, '0')} / {String(pages).padStart(2, '0')}</span>
            <button type="button" onClick={() => onChange(page + 1)} disabled={page >= pages} aria-label="Next page">
                <ChevronRight size={15} />
            </button>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// 06 — Bento Overview
// ─────────────────────────────────────────────────────────────

function Design6({ rows }: { rows: Illness[] }) {
    const { mode, setMode, q, setQ, filtered } = useSearch(rows);
    const total = sumCases(filtered);
    const leader = filtered[0];
    const monthTotals = MONTHS.map((_, index) => filtered.reduce((sum, row) => sum + monthValue(row, index), 0));
    const max = leader?.cases ?? 1;

    return (
        <div className="card isd2-bento-shell">
            <div className="isd2-bento-head">
                <div>
                    <span className="isd2-kicker">Illness statistics</span>
                    <h2 className="isd2-title">Clinic overview</h2>
                </div>
                <SearchBox mode={mode} setMode={setMode} q={q} setQ={setQ} />
            </div>

            <div className="isd2-bento">
                <section className="isd2-tile isd2-tile-hero">
                    <span className="isd2-tile-label"><Activity size={14} aria-hidden="true" /> Diagnoses recorded</span>
                    <div className="isd2-hero-num">{total}</div>
                    <div className="isd2-hero-meta">
                        <span>{filtered.length} conditions tracked</span>
                        <span className="isd2-delta"><TrendingUp size={13} aria-hidden="true" /> 3 months of data</span>
                    </div>
                    <Sparkline values={monthTotals} />
                    <div className="isd2-spark-labels" aria-hidden="true">
                        {MONTHS.map((month) => <span key={month}>{month}</span>)}
                    </div>
                </section>

                <section className="isd2-tile">
                    <span className="isd2-tile-label"><Grid3x3 size={14} aria-hidden="true" /> Unique</span>
                    <div className="isd2-tile-num">{filtered.length}</div>
                    <p className="isd2-tile-note">distinct conditions</p>
                </section>

                <section className="isd2-tile isd2-tile-lead">
                    <span className="isd2-tile-label isd2-on-dark"><Sparkles size={14} aria-hidden="true" /> Most common</span>
                    <h3>{leader ? leader.name : 'No diagnoses yet'}</h3>
                    {leader && (
                        <div className="isd2-tile-lead-meta">
                            <Chip tone="gold">{leader.code}</Chip>
                            <span>{leader.cases} {leader.cases === 1 ? 'case' : 'cases'}</span>
                        </div>
                    )}
                </section>

                <section className="isd2-tile isd2-tile-bars">
                    <span className="isd2-tile-label"><Rows3 size={14} aria-hidden="true" /> Top 5 conditions</span>
                    <div className="isd2-bar-list">
                        {filtered.slice(0, 5).map((row) => (
                            <div className="isd2-bar-item" key={`${row.code}-${row.name}`}>
                                <div className="isd2-bar-top">
                                    <span title={row.name}>{row.name}</span>
                                    <b>{row.cases}</b>
                                </div>
                                <Bar value={row.cases} max={max} />
                            </div>
                        ))}
                        {!filtered.length && <Empty />}
                    </div>
                </section>

                <section className="isd2-tile isd2-tile-table">
                    <div className="isd2-tile-row">
                        <span className="isd2-tile-label">All recorded conditions</span>
                        <span className="isd2-tile-note">{filtered.length} total</span>
                    </div>
                    <div className="table-wrap isd2-table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th scope="col">Condition</th>
                                    <th scope="col">ICD-10</th>
                                    <th scope="col" className="isd2-num">Cases</th>
                                    <th scope="col">Share</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.slice(0, 6).map((row) => (
                                    <tr key={`${row.code}-${row.name}`}>
                                        <td className="isd2-strong">{row.name}</td>
                                        <td>{row.code || '—'}</td>
                                        <td className="isd2-num">{row.cases}</td>
                                        <td>
                                            <div className="isd2-share-cell">
                                                <Bar value={row.cases} max={max} />
                                                <span>{share(row.cases, total)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!filtered.length && (
                                    <tr><td colSpan={4}><Empty /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// 07 — Swiss Ledger
// ─────────────────────────────────────────────────────────────

function Design7({ rows }: { rows: Illness[] }) {
    const { mode, setMode, q, setQ, filtered } = useSearch(rows);
    const total = sumCases(filtered);
    const leader = filtered[0];
    const top5 = filtered.slice(0, 5);
    const top5Total = sumCases(top5);
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const current = Math.min(page, pages);
    const pageRows = filtered.slice((current - 1) * pageSize, current * pageSize);
    const shades = ['#7B1113', '#9B1E20', '#B8453F', '#D07A6B', '#E0B7AE'];

    return (
        <div className="isd2-swiss">
            <header className="isd2-swiss-head">
                <div>
                    <p className="isd2-kicker">Reports / Illness register</p>
                    <h2>Illness register</h2>
                </div>
                <div className="isd2-swiss-head-right">
                    <SearchBox mode={mode} setMode={setMode} q={q} setQ={setQ} variant="bare" />
                    <span className="isd2-swiss-meta">Jun–Nov 2026 · {filtered.length} conditions</span>
                </div>
            </header>

            <div className="isd2-swiss-grid">
                <div className="isd2-swiss-figure">
                    <div className="isd2-swiss-num">{total}</div>
                    <p className="isd2-swiss-caption">diagnoses recorded</p>
                    <dl className="isd2-swiss-facts">
                        <div>
                            <dt>Unique conditions</dt>
                            <dd>{filtered.length}</dd>
                        </div>
                        <div>
                            <dt>Leading diagnosis</dt>
                            <dd>{leader ? `${leader.code} · ${share(leader.cases, total)}%` : '—'}</dd>
                        </div>
                        <div>
                            <dt>Top five share</dt>
                            <dd>{total ? Math.round((top5Total / total) * 100) : 0}%</dd>
                        </div>
                    </dl>
                </div>

                <div className="isd2-swiss-stack">
                    <p className="isd2-swiss-label">Composition of the top five</p>
                    <div className="isd2-stack-bar" role="img" aria-label={top5.map((row) => `${row.name}: ${share(row.cases, total)}%`).join('. ')}>
                        {top5.map((row, index) => (
                            <span
                                key={`${row.code}-${row.name}`}
                                style={{ width: `${total ? (row.cases / total) * 100 : 0}%`, background: shades[index] }}
                            />
                        ))}
                        {top5Total < total && <span className="isd2-stack-rest" style={{ flex: 1 }} />}
                    </div>
                    <ol className="isd2-stack-legend">
                        {top5.map((row, index) => (
                            <li key={`${row.code}-${row.name}`}>
                                <i style={{ background: shades[index] }} aria-hidden="true" />
                                <span className="isd2-stack-name" title={row.name}>{row.name}</span>
                                <span className="isd2-stack-code">{row.code}</span>
                                <b>{share(row.cases, total)}%</b>
                            </li>
                        ))}
                        {top5Total < total && (
                            <li>
                                <i className="isd2-stack-rest-dot" aria-hidden="true" />
                                <span className="isd2-stack-name">All other conditions</span>
                                <span className="isd2-stack-code" />
                                <b>{share(total - top5Total, total)}%</b>
                            </li>
                        )}
                        {!top5.length && <li className="isd2-stack-empty">No diagnoses in this view.</li>}
                    </ol>
                </div>
            </div>

            <div className="isd2-swiss-rule" aria-hidden="true" />

            <div className="isd2-swiss-index">
                <div className="isd2-swiss-index-head">
                    <span>Condition</span>
                    <span>ICD-10</span>
                    <span className="isd2-num">Cases</span>
                    <span className="isd2-num">Share</span>
                </div>
                {pageRows.map((row) => (
                    <div className="isd2-swiss-row" key={`${row.code}-${row.name}`}>
                        <span className="isd2-swiss-name" title={row.name}>{row.name}</span>
                        <span className="isd2-swiss-code">{row.code || '—'}</span>
                        <span className="isd2-num isd2-strong">{row.cases}</span>
                        <span className="isd2-num">{share(row.cases, total)}%</span>
                    </div>
                ))}
                {!pageRows.length && <Empty />}
            </div>

            <footer className="isd2-swiss-foot">
                <span>
                    Showing {filtered.length ? (current - 1) * pageSize + 1 : 0}–
                    {Math.min(current * pageSize, filtered.length)} of {filtered.length}
                </span>
                <Pager page={current} pages={pages} onChange={setPage} />
            </footer>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// 08 — Explorer Split
// ─────────────────────────────────────────────────────────────

function Design8({ rows }: { rows: Illness[] }) {
    const { mode, setMode, q, setQ, filtered } = useSearch(rows);
    const total = sumCases(filtered);

    const chapters = useMemo(() => {
        const map = new Map<string, Illness[]>();
        filtered.forEach((row) => {
            map.set(row.chapter, [...(map.get(row.chapter) ?? []), row]);
        });

        return [...map.entries()]
            .map(([name, items]) => ({ name, items, cases: sumCases(items) }))
            .sort((a, b) => b.cases - a.cases || a.name.localeCompare(b.name));
    }, [filtered]);

    const [open, setOpen] = useState<string[]>(() => (chapters[0] ? [chapters[0].name] : []));
    const [activeKey, setActiveKey] = useState<string>(filtered[0] ? `${filtered[0].code}-${filtered[0].name}` : '');

    const active = filtered.find((row) => `${row.code}-${row.name}` === activeKey) ?? filtered[0];
    const related = active ? filtered.filter((row) => row.chapter === active.chapter && row !== active).slice(0, 4) : [];
    const max = filtered[0]?.cases ?? 1;

    function toggle(chapter: string) {
        setOpen((current) => (current.includes(chapter)
            ? current.filter((item) => item !== chapter)
            : [...current, chapter]));
    }

    return (
        <div className="card isd2-explorer">
            <div className="isd2-explorer-head">
                <div>
                    <span className="isd2-kicker">Illness statistics</span>
                    <h2 className="isd2-title">Browse by body system</h2>
                </div>
                <SearchBox mode={mode} setMode={setMode} q={q} setQ={setQ} />
            </div>

            <div className="isd2-explorer-body">
                <aside className="isd2-tree" aria-label="Conditions by body system">
                    <div className="isd2-tree-summary">
                        <span>{filtered.length} conditions</span>
                        <span>{total} diagnoses</span>
                    </div>

                    {chapters.map((chapter) => {
                        const isOpen = open.includes(chapter.name);

                        return (
                            <div className="isd2-tree-group" key={chapter.name}>
                                <button
                                    type="button"
                                    className="isd2-tree-group-head"
                                    aria-expanded={isOpen}
                                    onClick={() => toggle(chapter.name)}
                                >
                                    <ChevronDown size={14} aria-hidden="true" className={isOpen ? 'is-open' : ''} />
                                    <span>{chapter.name}</span>
                                    <b>{chapter.items.length}</b>
                                </button>

                                {isOpen && (
                                    <ul className="isd2-tree-list">
                                        {chapter.items.map((row) => {
                                            const key = `${row.code}-${row.name}`;
                                            const selected = active && key === `${active.code}-${active.name}`;

                                            return (
                                                <li key={key}>
                                                    <button
                                                        type="button"
                                                        className={`isd2-tree-item${selected ? ' is-selected' : ''}`}
                                                        aria-current={selected ? 'true' : undefined}
                                                        onClick={() => setActiveKey(key)}
                                                    >
                                                        <span title={row.name}>{row.name}</span>
                                                        <em>{row.cases}</em>
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        );
                    })}

                    {!chapters.length && <Empty />}
                </aside>

                <section className="isd2-detail" aria-live="polite">
                    {active ? (
                        <>
                            <div className="isd2-detail-head">
                                <div>
                                    <span className="isd2-detail-chapter">{active.chapter}</span>
                                    <h3>{active.name}</h3>
                                </div>
                                <Chip tone="maroon">{active.code}</Chip>
                            </div>

                            <div className="isd2-detail-stats">
                                <div>
                                    <strong>{active.cases}</strong>
                                    <span>cases</span>
                                </div>
                                <div>
                                    <strong>{share(active.cases, total)}%</strong>
                                    <span>of filtered</span>
                                </div>
                                <div>
                                    <strong>{related.length + 1}</strong>
                                    <span>in {active.chapter}</span>
                                </div>
                            </div>

                            <div className="isd2-detail-block">
                                <div className="isd2-detail-block-head">
                                    <span>Monthly spread</span>
                                    <span>{MONTHS[0]}–{MONTHS[MONTHS.length - 1]}</span>
                                </div>
                                <div className="isd2-month-bars">
                                    {MONTHS.map((month, index) => {
                                        const value = monthValue(active, index);
                                        const monthMax = Math.max(...MONTHS.map((_, i) => monthValue(active, i)), 1);

                                        return (
                                            <div className="isd2-month" key={month}>
                                                <div className="isd2-month-track">
                                                    <span style={{ height: `${Math.max(4, (value / monthMax) * 100)}%` }} />
                                                </div>
                                                <b>{value}</b>
                                                <span className="isd2-month-label">{month}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="isd2-detail-block">
                                <div className="isd2-detail-block-head">
                                    <span>Also recorded in {active.chapter}</span>
                                    <span>{related.length} more</span>
                                </div>
                                {related.length ? (
                                    <ul className="isd2-related">
                                        {related.map((row) => (
                                            <li key={`${row.code}-${row.name}`}>
                                                <button type="button" onClick={() => setActiveKey(`${row.code}-${row.name}`)}>
                                                    <span title={row.name}>{row.name}</span>
                                                    <span className="isd2-related-meta">
                                                        <Chip>{row.code}</Chip>
                                                        <b>{row.cases}</b>
                                                    </span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="isd2-detail-empty">No other condition in this system yet.</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <Empty />
                    )}

                    <div className="isd2-detail-table">
                        <div className="isd2-detail-block-head">
                            <span>Quick scan</span>
                            <span>Top {Math.min(6, filtered.length)}</span>
                        </div>
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th scope="col">Condition</th>
                                        <th scope="col">ICD-10</th>
                                        <th scope="col" className="isd2-num">Cases</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.slice(0, 6).map((row) => (
                                        <tr
                                            key={`${row.code}-${row.name}`}
                                            className={active && `${row.code}-${row.name}` === `${active.code}-${active.name}` ? 'is-active' : ''}
                                        >
                                            <td className="isd2-strong">{row.name}</td>
                                            <td>{row.code || '—'}</td>
                                            <td className="isd2-num">{row.cases}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="isd2-detail-foot">
                            <span>Bars are scaled to the most common condition.</span>
                            <Bar value={filtered[0]?.cases ?? 0} max={max} />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// 09 — Heatmap Matrix
// ─────────────────────────────────────────────────────────────

function heatStyle(value: number, max: number): { background: string; color: string } {
    if (!value) return { background: '#F7F4EE', color: '#B3ADA2' };

    const ratio = max ? Math.min(1, value / max) : 0;
    const alpha = 0.16 + ratio * 0.74;

    return {
        background: `rgba(123, 17, 19, ${alpha.toFixed(2)})`,
        color: ratio > 0.52 ? '#fff' : '#401214',
    };
}

function Design9({ rows }: { rows: Illness[] }) {
    const { mode, setMode, q, setQ, filtered } = useSearch(rows);
    const total = sumCases(filtered);
    const visible = filtered.slice(0, 8);
    const leader = filtered[0];
    const maxCell = Math.max(...visible.flatMap((row) => MONTHS.map((_, index) => monthValue(row, index))), 1);
    const monthTotals = MONTHS.map((_, index) => visible.reduce((sum, row) => sum + monthValue(row, index), 0));
    const busiest = monthTotals.indexOf(Math.max(...monthTotals));
    const max = leader?.cases ?? 1;

    return (
        <div className="card isd2-heat">
            <div className="isd2-heat-head">
                <div>
                    <span className="isd2-kicker">Illness statistics</span>
                    <h2 className="isd2-title">Condition intensity</h2>
                </div>
                <SearchBox mode={mode} setMode={setMode} q={q} setQ={setQ} />
            </div>

            <div className="isd2-heat-kpis">
                <div>
                    <strong>{total}</strong>
                    <span>diagnoses</span>
                </div>
                <div>
                    <strong>{filtered.length}</strong>
                    <span>conditions</span>
                </div>
                <div>
                    <strong>{monthTotals[busiest] ?? 0}</strong>
                    <span>busiest month · {MONTHS[busiest] ?? '—'}</span>
                </div>
                <div>
                    <strong>{leader ? leader.code : '—'}</strong>
                    <span>{leader ? leader.name : 'leading diagnosis'}</span>
                </div>
            </div>

            <div className="isd2-heat-scroll">
                <table className="isd2-heat-table">
                    <thead>
                        <tr>
                            <th scope="col">Condition</th>
                            {MONTHS.map((month) => <th scope="col" key={month}>{month}</th>)}
                            <th scope="col" className="isd2-num">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visible.map((row) => (
                            <tr key={`${row.code}-${row.name}`}>
                                <th scope="row">
                                    <span className="isd2-heat-name" title={row.name}>{row.name}</span>
                                    <Chip>{row.code}</Chip>
                                </th>
                                {MONTHS.map((month, index) => {
                                    const value = monthValue(row, index);
                                    const tone = heatStyle(value, maxCell);

                                    return (
                                        <td key={month}>
                                            <span
                                                className="isd2-heat-cell"
                                                style={tone}
                                                title={`${row.name} · ${month}: ${value} cases`}
                                                aria-label={`${month}: ${value} cases`}
                                            >
                                                {value || '·'}
                                            </span>
                                        </td>
                                    );
                                })}
                                <td className="isd2-num isd2-strong">{row.cases}</td>
                            </tr>
                        ))}
                        {!visible.length && (
                            <tr><td colSpan={MONTHS.length + 2}><Empty /></td></tr>
                        )}
                    </tbody>
                    <tfoot>
                        <tr>
                            <th scope="row">All conditions</th>
                            {monthTotals.map((value, index) => (
                                <td key={MONTHS[index]} className="isd2-strong">{value}</td>
                            ))}
                            <td className="isd2-num isd2-strong">{total}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className="isd2-heat-legend">
                <span className="isd2-heat-legend-label">Fewer</span>
                <span className="isd2-heat-scale" aria-hidden="true">
                    {[0.16, 0.32, 0.48, 0.64, 0.8].map((alpha) => (
                        <i key={alpha} style={{ background: `rgba(123, 17, 19, ${alpha})` }} />
                    ))}
                </span>
                <span className="isd2-heat-legend-label">More</span>
                <span className="isd2-heat-note">Each cell prints its count, so the colour is never the only cue.</span>
            </div>

            <div className="isd2-heat-below">
                <div className="isd2-heat-rank">
                    <div className="isd2-detail-block-head">
                        <span>Ranked shortlist</span>
                        <span>Top {Math.min(5, filtered.length)}</span>
                    </div>
                    <div className="isd2-bar-list">
                        {filtered.slice(0, 5).map((row) => (
                            <div className="isd2-bar-item" key={`${row.code}-${row.name}`}>
                                <div className="isd2-bar-top">
                                    <span title={row.name}>{row.name}</span>
                                    <b>{row.cases}</b>
                                </div>
                                <Bar value={row.cases} max={max} />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="isd2-heat-callout">
                    <span className="isd2-callout-icon"><ArrowUpRight size={18} aria-hidden="true" /></span>
                    <div>
                        <span className="isd2-kicker">Peak month</span>
                        <h3>{MONTHS[busiest] ?? '—'}</h3>
                        <p>
                            {monthTotals[busiest] ?? 0} diagnoses in the busiest month across the
                            top {visible.length} conditions.
                        </p>
                    </div>
                </div>
            </div>

            {filtered.length > visible.length && (
                <p className="isd2-heat-foot">
                    <Layers size={14} aria-hidden="true" /> Showing the top {visible.length} of {filtered.length} conditions — search narrows the matrix.
                </p>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Page shell
// ─────────────────────────────────────────────────────────────

const DESIGNS = [
    {
        n: 6,
        name: 'Bento Overview',
        best: 'A single glance before reading any table.',
        detail: 'Asymmetric modular tiles: hero trend, unique count, leading condition, top-five bars and a compact register. The grid stays composed as tiles resize.',
        Component: Design6,
    },
    {
        n: 7,
        name: 'Swiss Ledger',
        best: 'Printing, formal reporting, executive review.',
        detail: 'No cards, no shadows. Hairline rules, oversized figures, tabular numerals and a single accent. The register reads like an index page.',
        Component: Design7,
    },
    {
        n: 8,
        name: 'Explorer Split',
        best: 'Hundreds of conditions, staff drilling in.',
        detail: 'A body-system tree on the left, the selected condition on the right with its monthly spread and related diagnoses. Progressive disclosure keeps the screen small.',
        Component: Design8,
    },
    {
        n: 9,
        name: 'Heatmap Matrix',
        best: 'Spotting seasonal or monthly patterns.',
        detail: 'Conditions against months, each cell printing its count on a maroon intensity scale, with month totals and a ranked shortlist underneath.',
        Component: Design9,
    },
];

export default function IllnessStatisticsDesigns2() {
    const [dataKey, setDataKey] = useState<'few' | 'typical' | 'many'>('typical');

    const rows = useMemo(
        () => [...SORTS[dataKey]].sort((a, b) => b.cases - a.cases || a.name.localeCompare(b.name)),
        [dataKey],
    );

    return (
        <>
            <Head title="Illness statistics — round 2">
                <link rel="stylesheet" href="/assets/css/main.css" />
            </Head>

            <div className="isd2-page">
                <header className="isd2-top">
                    <div>
                        <span className="isd2-kicker">Admin · Reports · round 2</span>
                        <h1>Four more directions</h1>
                        <p>
                            Different information structures, not just different skins. Preview only —{' '}
                            <code>Admin/Analytics.jsx</code> stays untouched. The first five are still at{' '}
                            <a href="/previews/illness-statistics">/previews/illness-statistics</a>.
                        </p>
                    </div>

                    <div className="isd2-top-controls">
                        <span className="isd2-kicker">Data set</span>
                        <div className="isd2-seg" role="group" aria-label="Preview data set">
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

                <nav className="isd2-jump" aria-label="Jump to a design">
                    {DESIGNS.map((design) => (
                        <a key={design.n} href={`#design-${design.n}`}>
                            <b>{String(design.n).padStart(2, '0')}</b>
                            {design.name}
                        </a>
                    ))}
                </nav>

                {DESIGNS.map(({ n, name, best, detail, Component }) => (
                    <section key={n} id={`design-${n}`} className="isd2-section">
                        <div className="isd2-section-head">
                            <span className="isd2-section-num">{String(n).padStart(2, '0')}</span>
                            <div>
                                <h2>{name}</h2>
                                <p>{detail}</p>
                            </div>
                            <span className="isd2-best"><b>Best for</b> {best}</span>
                        </div>
                        <Component rows={rows} />
                    </section>
                ))}

                <footer className="isd2-footer">
                    <p>
                        Month splits are deterministic sample data for the preview; the live implementation will use the
                        visit dates already loaded by Reports. Pick a number and I'll port it in.
                    </p>
                </footer>
            </div>
        </>
    );
}
