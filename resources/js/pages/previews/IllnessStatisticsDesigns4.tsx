import { Head } from '@inertiajs/react';
import {
    Activity,
    Apple,
    Bone,
    Brain,
    Bug,
    ChevronDown,
    ChevronRight,
    Droplets,
    Eye,
    Heart,
    Layers3,
    Keyboard,
    Search,
    Thermometer,
    Wind,
} from 'lucide-react';
import { useDeferredValue, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

/*
 * Illness Statistics — round 4, five variants of Design 08 "Explorer Split".
 *
 *  13 Command Explorer — search-first, arrow keys + Enter, grouped by system
 *  14 Swiss Split      — strict typographic ledger, hairlines, no cards
 *  15 Console Density  — data-dense BI: micro bars, per-row trend, mono numerals
 *  16 Tabbed Explorer  — chapter tree + tabbed detail (Overview / Trend / Same system)
 *  17 Focus Explorer   — slim chapter rail + hero-scale detail
 *
 * Preview only. Admin/Analytics.jsx stays untouched until you pick one.
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

const SETS: Record<'few' | 'typical' | 'many', Illness[]> = { few: FEW, typical: TYPICAL, many: MANY };

const MONTH_WEIGHTS = [0.55, 1.15, 0.8, 1.35, 0.85, 1.2];

function monthValue(row: Illness, index: number): number {
    if (!row.cases) return 0;
    const weight = MONTH_WEIGHTS[(index + row.code.length) % MONTH_WEIGHTS.length];
    return Math.max(0, Math.round((row.cases / MONTHS.length) * weight));
}

function sumCases(rows: Illness[]): number {
    return rows.reduce((total, row) => total + row.cases, 0);
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

    return {
        mode,
        setMode: (value: string | string[]) => setMode((Array.isArray(value) ? value[0] : value) as Mode),
        q,
        setQ,
        filtered,
    };
}

const iconFor = (chapter: string) => {
    const map: Record<string, typeof Wind> = {
        Respiratory: Wind,
        Symptoms: Thermometer,
        Digestive: Apple,
        Circulatory: Heart,
        Infectious: Bug,
        Genitourinary: Droplets,
        Musculoskeletal: Bone,
        Skin: Layers3,
        Nervous: Brain,
        'Eye / ear': Eye,
    };

    return map[chapter] ?? Activity;
};

function buildTree(rows: Illness[]) {
    const map = new Map<string, Illness[]>();
    rows.forEach((row) => {
        map.set(row.chapter, [...(map.get(row.chapter) ?? []), row]);
    });

    return [...map.entries()]
        .map(([name, items]) => ({ name, items, cases: sumCases(items) }))
        .sort((a, b) => b.cases - a.cases || a.name.localeCompare(b.name));
}

function Empty({ children = 'No condition matches this search.' }: { children?: ReactNode }) {
    return (
        <div className="isd4-empty">
            <Search size={16} aria-hidden="true" />
            <p>{children}</p>
        </div>
    );
}

function SearchSeg({
    mode,
    setMode,
    q,
    setQ,
    bare = false,
    id = 'search',
}: {
    mode: Mode;
    setMode: (value: string | string[]) => void;
    q: string;
    setQ: (value: string) => void;
    bare?: boolean;
    id?: string;
}) {
    return (
        <div className={`isd4-controls${bare ? ' isd4-controls-bare' : ''}`}>
            <div className="isd4-seg" role="group" aria-label="Search illnesses by">
                <button type="button" aria-pressed={mode === 'word'} onClick={() => setMode('word')}>Word</button>
                <button type="button" aria-pressed={mode === 'code'} onClick={() => setMode('code')}>ICD-10</button>
            </div>
            <label className="isd4-field" htmlFor={id}>
                <Search size={14} aria-hidden="true" />
                <input
                    id={id}
                    type="search"
                    value={q}
                    onChange={(event) => setQ(event.target.value)}
                    placeholder={mode === 'code' ? 'Code, e.g. J06.9' : 'Condition, e.g. cough'}
                    aria-label={mode === 'code' ? 'Search by ICD-10 code' : 'Search by disease or condition'}
                />
            </label>
        </div>
    );
}

function ShareBar({ value, max, tone = 'maroon' }: { value: number; max: number; tone?: 'maroon' | 'gold' | 'soft' }) {
    const width = max ? Math.max(3, (value / max) * 100) : 0;

    return (
        <span className={`isd4-bar isd4-bar-${tone}`} aria-hidden="true">
            <span style={{ width: `${width}%` }} />
        </span>
    );
}

const keyOf = (row: Illness) => `${row.code}-${row.name}`;

// ─────────────────────────────────────────────────────────────
// 13 — Command Explorer
// ─────────────────────────────────────────────────────────────

function Design13({ rows }: { rows: Illness[] }) {
    const { mode, setMode, q, setQ, filtered } = useSearch(rows);
    const total = sumCases(filtered);
    const max = filtered[0]?.cases ?? 1;
    const [cursor, setCursor] = useState(0);
    const [activeKey, setActiveKey] = useState<string | null>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const active = filtered.find((row) => keyOf(row) === activeKey) ?? filtered[cursor] ?? filtered[0];
    const activeIndex = active ? filtered.findIndex((row) => keyOf(row) === keyOf(active)) : -1;
    const groups = useMemo(() => buildTree(filtered), [filtered]);
    const monthly = active ? MONTHS.map((_, i) => monthValue(active, i)) : [];
    const monthMax = Math.max(...monthly, 1);
    const related = active ? filtered.filter((row) => row.chapter === active.chapter && keyOf(row) !== keyOf(active)).slice(0, 4) : [];

    function onKey(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setCursor((value) => Math.min(filtered.length - 1, value + 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setCursor((value) => Math.max(0, value - 1));
        } else if (event.key === 'Enter' && filtered[cursor]) {
            event.preventDefault();
            setActiveKey(keyOf(filtered[cursor]));
        }
    }

    return (
        <div className="isd4-command card">
            <div className="isd4-command-left">
                <div className="isd4-command-head">
                    <Keyboard size={15} aria-hidden="true" className="isd4-kbd-icon" />
                    <span className="isd4-kicker">Command explorer</span>
                    <kbd className="isd4-kbd">↑ ↓</kbd>
                    <span className="isd4-kbd-hint">Enter to open</span>
                </div>
                <div className="isd4-command-search">
                    <Search size={15} aria-hidden="true" />
                    <input
                        type="search"
                        value={q}
                        autoFocus
                        onChange={(event) => { setQ(event.target.value); setCursor(0); }}
                        onKeyDown={onKey}
                        placeholder={mode === 'code' ? 'Code, e.g. J06.9' : 'Type to filter…'}
                        aria-label={mode === 'code' ? 'Search by ICD-10 code' : 'Search illnesses'}
                        aria-activedescendant={active ? `cmd-opt-${keyOf(active)}` : undefined}
                        aria-autocomplete="list"
                        role="combobox"
                        aria-expanded="true"
                        aria-controls="cmd-listbox"
                    />
                    <div className="isd4-seg isd4-seg-bare" role="group" aria-label="Search mode">
                        <button type="button" aria-pressed={mode === 'word'} onClick={() => setMode('word')}>Word</button>
                        <button type="button" aria-pressed={mode === 'code'} onClick={() => setMode('code')}>Code</button>
                    </div>
                </div>

                <div className="isd4-command-list" id="cmd-listbox" role="listbox" aria-label="Matching conditions" ref={listRef}>
                    {groups.map((group) => (
                        <div key={group.name} className="isd4-command-group" role="group" aria-label={group.name}>
                            <div className="isd4-command-group-head">
                                <span>{group.name}</span>
                                <b>{group.items.length}</b>
                            </div>
                            {group.items.map((row) => {
                                const isActive = active && keyOf(row) === keyOf(active);

                                return (
                                    <button
                                        key={keyOf(row)}
                                        type="button"
                                        id={`cmd-opt-${keyOf(row)}`}
                                        role="option"
                                        aria-selected={!!isActive}
                                        className={`isd4-command-item${isActive ? ' is-active' : ''}`}
                                        onClick={() => setActiveKey(keyOf(row))}
                                        onMouseEnter={() => setCursor(filtered.findIndex((item) => keyOf(item) === keyOf(row)))}
                                    >
                                        <span className="isd4-command-name" title={row.name}>{row.name}</span>
                                        <span className="isd4-command-code">{row.code || '—'}</span>
                                        <b className="isd4-command-cases">{row.cases}</b>
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                    {!filtered.length && <Empty>Nothing matches. Try a broader word or a code prefix.</Empty>}
                </div>
                <p className="isd4-command-foot">{filtered.length} conditions · {total} diagnoses · arrow keys move, Enter selects</p>
            </div>

            <section className="isd4-detail" aria-live="polite">
                {active ? (
                    <>
                        <div className="isd4-detail-head">
                            <div>
                                <span className="isd4-chapter-pill">{active.chapter}</span>
                                <h3>{active.name}</h3>
                            </div>
                            <span className="isd4-code-badge">{active.code}</span>
                        </div>
                        <div className="isd4-stat-grid">
                            <div><strong>{active.cases}</strong><span>cases</span></div>
                            <div><strong>{share(active.cases, total)}%</strong><span>of filtered</span></div>
                            <div><strong>#{activeIndex + 1}</strong><span>rank by volume</span></div>
                        </div>
                        <div className="isd4-block">
                            <div className="isd4-block-head"><span>Monthly spread</span><span>{MONTHS[0]}–{MONTHS[MONTHS.length - 1]}</span></div>
                            <div className="isd4-month-bars">
                                {monthly.map((value, index) => (
                                    <div className="isd4-month" key={MONTHS[index]}>
                                        <div className="isd4-month-track"><span style={{ height: `${Math.max(4, (value / monthMax) * 100)}%` }} /></div>
                                        <b>{value}</b>
                                        <span>{MONTHS[index]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="isd4-block">
                            <div className="isd4-block-head"><span>Also recorded in {active.chapter}</span><span>top {Math.min(4, related.length)}</span></div>
                            {related.length ? (
                                <div className="isd4-chip-row">
                                    {related.map((row) => (
                                        <button key={keyOf(row)} type="button" className="isd4-chip" onClick={() => setActiveKey(keyOf(row))}>
                                            <span title={row.name}>{row.name}</span>
                                            <b>{row.cases}</b>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="isd4-detail-note">Only this condition in the system so far.</p>
                            )}
                        </div>
                    </>
                ) : (
                    <Empty>Nothing selected yet — type to filter, then press Enter.</Empty>
                )}
            </section>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// 14 — Swiss Split
// ─────────────────────────────────────────────────────────────

function Design14({ rows }: { rows: Illness[] }) {
    const { mode, setMode, q, setQ, filtered } = useSearch(rows);
    const total = sumCases(filtered);
    const [activeKey, setActiveKey] = useState(filtered[0] ? keyOf(filtered[0]) : '');
    const active = filtered.find((row) => keyOf(row) === activeKey) ?? filtered[0];
    const shades = ['#111111', '#3d3d3d', '#6b6b6b', '#9a9a9a', '#c4c4c4'];
    const top5 = filtered.slice(0, 5);
    const top5Total = sumCases(top5);

    return (
        <div className="isd4-swiss card">
            <div className="isd4-swiss-left">
                <div className="isd4-swiss-head">
                    <div>
                        <span className="isd4-kicker isd4-kicker-dark">Illness register</span>
                        <h3 className="isd4-swiss-title">All conditions</h3>
                    </div>
                    <SearchSeg id="swiss-search" mode={mode} setMode={setMode} q={q} setQ={setQ} bare />
                </div>
                <div className="isd4-swiss-index-head" aria-hidden="true">
                    <span>№</span><span>Condition</span><span>ICD-10</span><span>Cases</span>
                </div>
                <div className="isd4-swiss-list" role="listbox" aria-label="Conditions index">
                    {filtered.map((row, index) => {
                        const isActive = active && keyOf(row) === keyOf(active);

                        return (
                            <button
                                key={keyOf(row)}
                                type="button"
                                role="option"
                                aria-selected={!!isActive}
                                className={`isd4-swiss-row${isActive ? ' is-active' : ''}`}
                                onClick={() => setActiveKey(keyOf(row))}
                            >
                                <span className="isd4-swiss-idx">{String(index + 1).padStart(2, '0')}</span>
                                <span className="isd4-swiss-name" title={row.name}>{row.name}</span>
                                <span className="isd4-swiss-code">{row.code || '—'}</span>
                                <b className="isd4-swiss-cases">{row.cases}</b>
                            </button>
                        );
                    })}
                    {!filtered.length && <Empty />}
                </div>
                <div className="isd4-swiss-foot"><span>{filtered.length} entries</span><span>Jun–Nov 2026</span></div>
            </div>

            <section className="isd4-swiss-detail" aria-live="polite">
                {active && (
                    <>
                        <div className="isd4-swiss-detail-head">
                            <span className="isd4-kicker isd4-kicker-dark">{active.chapter}</span>
                            <h3>{active.name}</h3>
                        </div>
                        <div className="isd4-swiss-hero">
                            <span className="isd4-swiss-num">{active.cases}</span>
                            <div className="isd4-swiss-hero-meta">
                                <span>case{active.cases === 1 ? '' : 's'} recorded</span>
                                <span>{share(active.cases, total)}% of the filtered register</span>
                                <span>ICD-10 {active.code || '—'}</span>
                            </div>
                        </div>
                        <div className="isd4-swiss-stack" role="img" aria-label="Top five conditions compared by share of diagnoses">
                            {top5.map((row, index) => (
                                <span
                                    key={keyOf(row)}
                                    style={{ width: `${total ? (row.cases / total) * 100 : 0}%`, background: shades[index] }}
                                    title={`${row.name}: ${share(row.cases, total)}%`}
                                />
                            ))}
                            {top5Total < total && <span style={{ flex: 1, background: '#e5e2da' }} title="All other conditions" />}
                        </div>
                        <ol className="isd4-swiss-legend">
                            {top5.map((row, index) => (
                                <li key={keyOf(row)}>
                                    <i style={{ background: shades[index] }} aria-hidden="true" />
                                    <span title={row.name}>{row.name}</span>
                                    <b>{share(row.cases, total)}%</b>
                                </li>
                            ))}
                            {top5Total < total && (
                                <li><i style={{ background: '#e5e2da' }} aria-hidden="true" /><span>All other conditions</span><b>{share(total - top5Total, total)}%</b></li>
                            )}
                        </ol>
                        <p className="isd4-swiss-note">Black-segment highlight marks the selected condition among the top five. The index on the left stays printable as-is.</p>
                    </>
                )}
            </section>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// 15 — Console Density
// ─────────────────────────────────────────────────────────────

function Design15({ rows }: { rows: Illness[] }) {
    const { mode, setMode, q, setQ, filtered } = useSearch(rows);
    const total = sumCases(filtered);
    const max = filtered[0]?.cases ?? 1;
    const groups = useMemo(() => buildTree(filtered), [filtered]);
    const [open, setOpen] = useState<string[]>(() => groups.slice(0, 2).map((group) => group.name));
    const [activeKey, setActiveKey] = useState<string | null>(filtered[0] ? keyOf(filtered[0]) : null);
    const active = filtered.find((row) => keyOf(row) === activeKey) ?? filtered[0];
    const rank = active ? filtered.findIndex((row) => keyOf(row) === keyOf(active)) + 1 : 0;
    const monthly = active ? MONTHS.map((_, i) => monthValue(active, i)) : [];
    const monthMax = Math.max(...monthly, 1);
    const trendUp = monthly[5] >= monthly[0];

    function toggle(chapter: string) {
        setOpen((current) => current.includes(chapter)
            ? current.filter((item) => item !== chapter)
            : [...current, chapter]);
    }

    return (
        <div className="isd4-console card">
            <div className="isd4-console-left">
                <div className="isd4-console-head">
                    <span className="isd4-kicker">CONSOLE · v1.0</span>
                    <SearchSeg id="console-search" mode={mode} setMode={setMode} q={q} setQ={setQ} bare />
                </div>
                <div className="isd4-console-cols" aria-hidden="true"><span>Condition</span><span>Cases</span><span>%</span><span>Δ</span></div>
                <div className="isd4-console-tree" role="tree" aria-label="Conditions by system, compact">
                    {groups.map((group) => {
                        const isOpen = open.includes(group.name);

                        return (
                            <div className="isd4-console-group" key={group.name} role="none">
                                <button type="button" role="treeitem" aria-expanded={isOpen} aria-owns={`con-${group.name}`} className="isd4-console-grouphead" onClick={() => toggle(group.name)}>
                                    {isOpen ? <ChevronDown size={12} aria-hidden="true" /> : <ChevronRight size={12} aria-hidden="true" />}
                                    <span>{group.name}</span>
                                    <em>Σ{group.cases}</em>
                                    <b>{group.items.length}</b>
                                </button>
                                {isOpen && (
                                    <div role="group" id={`con-${group.name}`} className="isd4-console-items">
                                        {group.items.map((row, index) => {
                                            const isActive = active && keyOf(row) === keyOf(active);
                                            const delta = monthValue(row, 5) - monthValue(row, 0);

                                            return (
                                                <button
                                                    key={keyOf(row)}
                                                    type="button"
                                                    role="treeitem"
                                                    aria-selected={!!isActive}
                                                    className={`isd4-console-item${isActive ? ' is-active' : ''}`}
                                                    onClick={() => setActiveKey(keyOf(row))}
                                                >
                                                    <span className="isd4-console-name" title={row.name}>{row.name}</span>
                                                    <b>{row.cases}</b>
                                                    <i>{share(row.cases, total)}</i>
                                                    <span className={delta >= 0 ? 'isd4-up' : 'isd4-down'}>{delta >= 0 ? '▲' : '▼'}{Math.abs(delta)}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {!groups.length && <Empty />}
                </div>
                <div className="isd4-console-summary"><span>Σ {total} diagnoses</span><span>{filtered.length} conditions</span><span>{MONTHS[0]}→{MONTHS[MONTHS.length - 1]}</span></div>
            </div>

            <section className="isd4-console-detail" aria-live="polite">
                {active && (
                    <>
                        <div className="isd4-console-top">
                            <span className="isd4-chapter-pill">{active.chapter}</span>
                            <span className="isd4-code-badge">{active.code}</span>
                            <span className="isd4-console-rank">RANK #{rank}</span>
                        </div>
                        <h3 className="isd4-console-name">{active.name}</h3>
                        <div className="isd4-console-metrics">
                            <div><strong>{active.cases}</strong><span>cases</span></div>
                            <div><strong>{share(active.cases, total)}%</strong><span>share</span></div>
                            <div><strong>{active.cases / 6 < 1 ? '1' : Math.round(active.cases / 6)}</strong><span>/month avg</span></div>
                            <div><strong className={trendUp ? 'isd4-up' : 'isd4-down'}>{trendUp ? '▲' : '▼'}</strong><span>6-month trend</span></div>
                        </div>
                        <div className="isd4-console-block">
                            <div className="isd4-console-block-head"><span>monthly distribution · raw</span><span>n={active.cases}</span></div>
                            <div className="isd4-console-bars">
                                {monthly.map((value, index) => (
                                    <div className="isd4-console-bar" key={MONTHS[index]}>
                                        <span style={{ height: `${Math.max(6, (value / monthMax) * 100)}%` }} />
                                        <b>{value}</b>
                                        <i>{MONTHS[index]}</i>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="isd4-console-block">
                            <div className="isd4-console-block-head"><span>share of register</span><span>max {max}</span></div>
                            <ShareBar value={active.cases} max={max} />
                        </div>
                        <div className="isd4-console-foot"><span>Source: completed visits · diagnoses as recorded</span><span>UCIMS · 2026-11</span></div>
                    </>
                )}
            </section>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// 16 — Tabbed Explorer
// ─────────────────────────────────────────────────────────────

function Design16({ rows }: { rows: Illness[] }) {
    const { mode, setMode, q, setQ, filtered } = useSearch(rows);
    const total = sumCases(filtered);
    const max = filtered[0]?.cases ?? 1;
    const groups = useMemo(() => buildTree(filtered), [filtered]);
    const [open, setOpen] = useState<string[]>(() => groups.slice(0, 1).map((group) => group.name));
    const [activeKey, setActiveKey] = useState<string | null>(filtered[0] ? keyOf(filtered[0]) : null);
    const [tab, setTab] = useState<'overview' | 'trend' | 'same'>('overview');
    const active = filtered.find((row) => keyOf(row) === activeKey) ?? filtered[0];
    const monthly = active ? MONTHS.map((_, i) => monthValue(active, i)) : [];
    const monthMax = Math.max(...monthly, 1);
    const rank = active ? filtered.findIndex((row) => keyOf(row) === keyOf(active)) + 1 : 0;
    const related = active ? filtered.filter((row) => row.chapter === active.chapter && keyOf(row) !== keyOf(active)) : [];

    function toggle(chapter: string) {
        setOpen((current) => current.includes(chapter)
            ? current.filter((item) => item !== chapter)
            : [...current, chapter]);
    }

    return (
        <div className="isd4-tabbed card">
            <div className="isd4-tabbed-left">
                <div className="isd4-tabbed-head">
                    <div><span className="isd4-kicker">Browse</span><h3 className="isd4-title">By body system</h3></div>
                    <SearchSeg id="tabbed-search" mode={mode} setMode={setMode} q={q} setQ={setQ} />
                </div>
                <div className="isd4-tabbed-tree" aria-label="Conditions grouped by body system">
                    {groups.map((group) => {
                        const isOpen = open.includes(group.name);

                        return (
                            <div className="isd4-tabbed-group" key={group.name}>
                                <button type="button" className="isd4-tabbed-grouphead" aria-expanded={isOpen} onClick={() => toggle(group.name)}>
                                    <ChevronDown size={13} aria-hidden="true" className={isOpen ? 'is-open' : ''} />
                                    <span>{group.name}</span>
                                    <b>{group.items.length}</b>
                                </button>
                                {isOpen && (
                                    <ul className="isd4-tabbed-items">
                                        {group.items.map((row) => {
                                            const isActive = active && keyOf(row) === keyOf(active);

                                            return (
                                                <li key={keyOf(row)}>
                                                    <button type="button" className={`isd4-tabbed-item${isActive ? ' is-selected' : ''}`} aria-current={isActive ? 'true' : undefined} onClick={() => setActiveKey(keyOf(row))}>
                                                        <span className="isd4-tabbed-item-name" title={row.name}>{row.name}</span>
                                                        <span className="isd4-tabbed-item-bar"><ShareBar value={row.cases} max={max} /></span>
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
                    {!groups.length && <Empty />}
                </div>
                <p className="isd4-tabbed-foot">{filtered.length} conditions · {total} diagnoses · {groups.length} systems</p>
            </div>

            <section className="isd4-tabbed-detail" aria-live="polite">
                {active && (
                    <>
                        <div className="isd4-tabbed-detail-head">
                            <div>
                                <span className="isd4-chapter-pill">{active.chapter}</span>
                                <h3>{active.name}</h3>
                            </div>
                            <span className="isd4-code-badge">{active.code}</span>
                        </div>

                        <div className="isd4-tabs" role="tablist" aria-label="Condition detail sections">
                            <button type="button" role="tab" aria-selected={tab === 'overview'} aria-controls="tab-overview" id="tabbtn-overview" className={tab === 'overview' ? 'is-active' : ''} onClick={() => setTab('overview')}>Overview</button>
                            <button type="button" role="tab" aria-selected={tab === 'trend'} aria-controls="tab-trend" id="tabbtn-trend" className={tab === 'trend' ? 'is-active' : ''} onClick={() => setTab('trend')}>Month-by-month</button>
                            <button type="button" role="tab" aria-selected={tab === 'same'} aria-controls="tab-same" id="tabbtn-same" className={tab === 'same' ? 'is-active' : ''} onClick={() => setTab('same')}>Same system ({related.length})</button>
                        </div>

                        <div className="isd4-tab-panels">
                            {tab === 'overview' && (
                                <div role="tabpanel" id="tab-overview" aria-labelledby="tabbtn-overview">
                                    <div className="isd4-stat-grid">
                                        <div><strong>{active.cases}</strong><span>cases</span></div>
                                        <div><strong>{share(active.cases, total)}%</strong><span>of filtered</span></div>
                                        <div><strong>#{rank}</strong><span>rank by volume</span></div>
                                    </div>
                                    <div className="isd4-block">
                                        <div className="isd4-block-head"><span>Share of every diagnosis recorded</span><span>{share(active.cases, total)}%</span></div>
                                        <ShareBar value={active.cases} max={max} />
                                    </div>
                                    <div className="isd4-block">
                                        <div className="isd4-block-head"><span>Quick takeaway</span><span/></div>
                                        <p className="isd4-detail-note">
                                            {active.name} accounts for <b>{share(active.cases, total)}%</b> of {total} diagnoses across {filtered.length} conditions this period
                                            {rank === 1 ? ' — the single most common condition seen.' : ` — ranked #${rank} by volume.`}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {tab === 'trend' && (
                                <div role="tabpanel" id="tab-trend" aria-labelledby="tabbtn-trend">
                                    <div className="isd4-month-bars isd4-month-bars-tall">
                                        {monthly.map((value, index) => (
                                            <div className="isd4-month" key={MONTHS[index]}>
                                                <div className="isd4-month-track"><span style={{ height: `${Math.max(4, (value / monthMax) * 100)}%` }} /></div>
                                                <b>{value}</b>
                                                <span>{MONTHS[index]}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="isd4-detail-note">Column height is scaled to the busiest month ({Math.max(...monthly)}). Hover-equivalent: each column is labelled, so the trend stays readable without a pointer.</p>
                                </div>
                            )}

                            {tab === 'same' && (
                                <div role="tabpanel" id="tab-same" aria-labelledby="tabbtn-same">
                                    {related.length ? (
                                        <ul className="isd4-same-list">
                                            {related.map((row) => (
                                                <li key={keyOf(row)}>
                                                    <button type="button" onClick={() => setActiveKey(keyOf(row))}>
                                                        <span className="isd4-same-name" title={row.name}>{row.name}</span>
                                                        <span className="isd4-same-bar"><ShareBar value={row.cases} max={max} /></span>
                                                        <span className="isd4-same-meta"><em>{row.code || '—'}</em><b>{row.cases}</b></span>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="isd4-detail-note">No other {active.chapter} condition recorded this period.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
                {!active && <Empty>Nothing selected — pick a condition on the left.</Empty>}
            </section>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// 17 — Focus Explorer
// ─────────────────────────────────────────────────────────────

function Design17({ rows }: { rows: Illness[] }) {
    const { mode, setMode, q, setQ, filtered } = useSearch(rows);
    const groups = useMemo(() => buildTree(filtered), [filtered]);
    const [activeKey, setActiveKey] = useState<string | null>(filtered[0] ? keyOf(filtered[0]) : null);
    const active = filtered.find((row) => keyOf(row) === activeKey) ?? filtered[0];
    const total = sumCases(filtered);
    const max = filtered[0]?.cases ?? 1;
    const monthly = active ? MONTHS.map((_, i) => monthValue(active, i)) : [];
    const monthMax = Math.max(...monthly, 1);

    return (
        <div className="isd4-focus card">
            <div className="isd4-focus-rail" aria-label="Body systems">
                <div className="isd4-focus-rail-summary">
                    <strong>{filtered.length}</strong>
                    <span>conditions<br />tracked</span>
                </div>
                {groups.map((group) => {
                    const Icon = iconFor(group.name);
                    const isActive = active?.chapter === group.name;

                    return (
                        <button
                            key={group.name}
                            type="button"
                            className={`isd4-focus-tile${isActive ? ' is-active' : ''}`}
                            aria-pressed={isActive}
                            onClick={() => {
                                const first = group.items[0];
                                if (first) setActiveKey(keyOf(first));
                            }}
                        >
                            <Icon size={20} aria-hidden="true" />
                            <span className="isd4-focus-tile-name">{group.name}</span>
                            <b>{group.cases}</b>
                        </button>
                    );
                })}
                {!groups.length && <Empty />}
            </div>

            <section className="isd4-focus-detail" aria-live="polite">
                <div className="isd4-focus-head">
                    <SearchSeg id="focus-search" mode={mode} setMode={setMode} q={q} setQ={setQ} bare />
                    <span className="isd4-focus-meta">{total} diagnoses · Jun–Nov</span>
                </div>
                {active && (
                    <>
                        <div className="isd4-focus-kicker"><span>{active.chapter}</span><span>{active.code}</span></div>
                        <h3 className="isd4-focus-name">{active.name}</h3>
                        <div className="isd4-focus-hero">
                            <span className="isd4-focus-num">{active.cases}</span>
                            <div className="isd4-focus-hero-side">
                                <span>cases this period</span>
                                <span className="isd4-focus-share"><b>{share(active.cases, total)}%</b> of every diagnosis recorded</span>
                                <div className="isd4-focus-bar"><ShareBar value={active.cases} max={max} tone="gold" /></div>
                            </div>
                        </div>
                        <div className="isd4-focus-months" aria-hidden="true">
                            {monthly.map((value, index) => (
                                <div key={MONTHS[index]} className="isd4-focus-month">
                                    <span style={{ height: `${Math.max(6, (value / monthMax) * 100)}%` }} />
                                    <b>{value}</b>
                                    <i>{MONTHS[index]}</i>
                                </div>
                            ))}
                        </div>
                        <div className="isd4-focus-chips">
                            {filtered.filter((row) => row.chapter === active.chapter && keyOf(row) !== keyOf(active)).slice(0, 3).map((row) => (
                                <button key={keyOf(row)} type="button" className="isd4-focus-chip" onClick={() => setActiveKey(keyOf(row))}>
                                    <span>{row.name}</span><b>{row.cases}</b>
                                </button>
                            ))}
                            {filtered.filter((row) => row.chapter === active.chapter && keyOf(row) !== keyOf(active)).length === 0 && (
                                <span className="isd4-focus-note">First and only {active.chapter} condition on record.</span>
                            )}
                        </div>
                    </>
                )}
                {!active && <Empty />}
            </section>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Page shell
// ─────────────────────────────────────────────────────────────

const DESIGNS = [
    {
        n: 13,
        name: 'Command Explorer',
        best: 'Power users who live at the keyboard',
        detail: 'Search-first master list grouped by system. Arrow keys move, Enter selects, and the detail stays anchored on the right. Home–end of every interaction is the input.',
        Component: Design13,
    },
    {
        n: 14,
        name: 'Swiss Split',
        best: 'Medical auditors, print, formal output',
        detail: 'Tabular index rows on hairlines, an oversized Barlow Condensed numeral, a five-shade composition bar with direct labels. No cards, no chrome — a register page with a reading pane.',
        Component: Design14,
    },
    {
        n: 15,
        name: 'Console Density',
        best: 'Analysts who want signal per pixel',
        detail: 'Ultra-compact tree: per-row percentage, month-over-month arrow, Σ group totals, sticky column header. Detail packs rank, trend and a raw-values bar strip.',
        Component: Design15,
    },
    {
        n: 16,
        name: 'Tabbed Explorer',
        best: 'Guided drill-down, training junior staff',
        detail: 'Chapter tree on the left and a tabbed detail on the right: Overview, Month-by-month, Same system. Each tab answers one question before moving to the next.',
        Component: Design16,
    },
    {
        n: 17,
        name: 'Focus Explorer',
        best: 'Ward rounds, slide-deck reviews',
        detail: 'Slim system rail on terracotta-friendly tiles; the right side carries an oversized serif numeral, share bar and a six-column month strip. Quiet, visual, decisive.',
        Component: Design17,
    },
];

export default function IllnessStatisticsDesigns4() {
    const [dataKey, setDataKey] = useState<'few' | 'typical' | 'many'>('typical');

    const rows = useMemo(
        () => [...SETS[dataKey]].sort((a, b) => b.cases - a.cases || a.name.localeCompare(b.name)),
        [dataKey],
    );

    return (
        <>
            <Head title="Illness statistics — round 4" />

            <div className="isd4-page">
                <header className="isd4-top">
                    <div>
                        <span className="isd4-kicker">Admin · Reports · round 4</span>
                        <h1>Explorer Split, five ways</h1>
                        <p>
                            You liked <a href="/previews/illness-statistics-2#design-8">design 08</a> — this round keeps the master-detail
                            idea (system tree left, condition detail right) and pushes it in five different directions: keyboard-first,
                            typographic, dense BI, tabbed, and focus-mode. Nothing is wired into <code>Admin/Analytics.jsx</code> yet.
                        </p>
                    </div>
                    <div className="isd4-top-controls">
                        <span className="isd4-kicker">Sample data</span>
                        <div className="isd4-seg" role="group" aria-label="Sample data set">
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

                <nav className="isd4-jump" aria-label="Jump to a design">
                    {DESIGNS.map((design) => (
                        <a key={design.n} href={`#design-${design.n}`} className="isd4-jump-link">
                            <b>{String(design.n).padStart(2, '0')}</b>
                            {design.name}
                        </a>
                    ))}
                </nav>

                {DESIGNS.map(({ n, name, best, detail, Component }) => (
                    <section key={n} id={`design-${n}`} className="isd4-section">
                        <div className="isd4-section-head">
                            <span className="isd4-section-num">{String(n).padStart(2, '0')}</span>
                            <div>
                                <h2>{name}</h2>
                                <p>{detail}</p>
                            </div>
                            <span className="isd4-best"><b>Best for</b> {best}</span>
                        </div>
                        <Component rows={rows} />
                    </section>
                ))}

                <footer className="isd4-footer">
                    <p>
                        Sample data is deterministic; production computes the same figures from the visit dates Reports already loads.
                        Pick one (13–17 — or combine) and I'll port it into <code>Admin/Analytics.jsx</code> and push.
                    </p>
                </footer>
            </div>
        </>
    );
}
