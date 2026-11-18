import { Head } from '@inertiajs/react';
import {
    Check,
    ChevronDown,
    Hash,
    Stethoscope,
    Tag,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

/*
 * Illness statistics — search-mode control lab.
 * Six options for the "Disease / condition  ↔  ICD-10 code" toggle in the
 * Reports panel header. All are clickable and keyboard reachable.
 * Preview only. /previews/illness-dropdowns
 */

type Mode = 'word' | 'code';

const OPTIONS: Array<{ id: Mode; label: string; short: string }> = [
    { id: 'word', label: 'Disease / condition', short: 'Word' },
    { id: 'code', label: 'ICD-10 code', short: 'ICD-10' },
];

function CodeSearchIcon() {
    return <Hash size={14} aria-hidden="true" />;
}

function WordSearchIcon() {
    return <Stethoscope size={14} aria-hidden="true" />;
}

function StatusLine({ mode }: { mode: Mode }) {
    return (
        <p className="idd-status" role="status">
            Searching by <b>{mode === 'code' ? 'ICD-10 code' : 'disease / condition'}</b>
            {mode === 'code' ? ' — matching strips punctuation (J06.9 ≈ j069)' : ' — matching substrings, case-insensitive'}
        </p>
    );
}

/* 01 — native select (what it looks like today) */
function Variant01() {
    const [mode, setMode] = useState<Mode>('word');

    return (
        <>
            <select
                aria-label="Search illnesses by"
                className="idd-native"
                value={mode}
                onChange={(e) => setMode(e.target.value as Mode)}
            >
                {OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            <StatusLine mode={mode} />
        </>
    );
}

/* 02 — pill toggle */
function Variant02() {
    const [mode, setMode] = useState<Mode>('word');

    return (
        <>
            <div className="idd-pills" role="group" aria-label="Search illnesses by">
                {OPTIONS.map((o) => (
                    <button
                        key={o.id}
                        type="button"
                        aria-pressed={mode === o.id}
                        className={mode === o.id ? 'is-active' : ''}
                        onClick={() => setMode(o.id)}
                    >
                        {o.label}
                    </button>
                ))}
            </div>
            <StatusLine mode={mode} />
        </>
    );
}

/* 03 — pill toggle with icons */
function Variant03() {
    const [mode, setMode] = useState<Mode>('word');

    return (
        <>
            <div className="idd-pills idd-pills-icon" role="group" aria-label="Search illnesses by">
                {OPTIONS.map((o) => {
                    const Icon = o.id === 'code' ? CodeSearchIcon : WordSearchIcon;

                    return (
                        <button
                            key={o.id}
                            type="button"
                            aria-pressed={mode === o.id}
                            className={mode === o.id ? 'is-active' : ''}
                            onClick={() => setMode(o.id)}
                        >
                            <Icon />
                            {o.short}
                        </button>
                    );
                })}
            </div>
            <StatusLine mode={mode} />
        </>
    );
}

/* 04 — line tabs (minimal) */
function Variant04() {
    const [mode, setMode] = useState<Mode>('word');

    return (
        <>
            <div className="idd-linetabs" role="group" aria-label="Search illnesses by">
                {OPTIONS.map((o) => (
                    <button
                        key={o.id}
                        type="button"
                        aria-pressed={mode === o.id}
                        className={mode === o.id ? 'is-active' : ''}
                        onClick={() => setMode(o.id)}
                    >
                        {o.short}
                    </button>
                ))}
            </div>
            <StatusLine mode={mode} />
        </>
    );
}

function useDismiss(open: boolean, close: () => void) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        const onDown = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) close();
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close();
        };

        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);

        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open, close]);

    return ref;
}

function MenuItems({ mode, onPick }: { mode: Mode; onPick: (m: Mode) => void }) {
    return (
        <div className="idd-menu" role="listbox" aria-label="Search illnesses by">
            {OPTIONS.map((o) => (
                <button
                    key={o.id}
                    type="button"
                    role="option"
                    aria-selected={mode === o.id}
                    className={`idd-menu-item${mode === o.id ? ' is-active' : ''}`}
                    onClick={() => onPick(o.id)}
                >
                    <span>{o.id === 'code' ? <CodeSearchIcon /> : <WordSearchIcon />}</span>
                    <span className="idd-menu-label">{o.label}</span>
                    {mode === o.id && <Check size={15} aria-hidden="true" />}
                </button>
            ))}
        </div>
    );
}

/* 05 — shadcn-style Select button */
function Variant05() {
    const [mode, setMode] = useState<Mode>('word');
    const [open, setOpen] = useState(false);
    const ref = useDismiss(open, () => setOpen(false));

    return (
        <div className="idd-popover-root" ref={ref}>
            <button
                type="button"
                className="idd-select"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
            >
                <Tag size={14} aria-hidden="true" />
                <span>{OPTIONS.find((o) => o.id === mode)?.label}</span>
                <ChevronDown size={15} aria-hidden="true" className={open ? 'is-open' : ''} />
            </button>
            {open && (
                <MenuItems mode={mode} onPick={(m) => { setMode(m); setOpen(false); }} />
            )}
            <StatusLine mode={mode} />
        </div>
    );
}

/* 06 — dropdown menu button */
function Variant06() {
    const [mode, setMode] = useState<Mode>('word');
    const [open, setOpen] = useState(false);
    const ref = useDismiss(open, () => setOpen(false));

    return (
        <div className="idd-popover-root" ref={ref}>
            <button
                type="button"
                className="idd-menu-button"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
            >
                <span>Search: <b>{mode === 'code' ? 'ICD-10 code' : 'Disease / condition'}</b></span>
                <ChevronDown size={15} aria-hidden="true" className={open ? 'is-open' : ''} />
            </button>
            {open && (
                <MenuItems mode={mode} onPick={(m) => { setMode(m); setOpen(false); }} />
            )}
            <StatusLine mode={mode} />
        </div>
    );
}

const VARIANTS: Array<{ n: number; name: string; best: string; note: string; Node: () => ReactNode }> = [
    { n: 1, name: 'Native select', best: 'Zero effort', note: 'What you have today. Works on every browser, screen reader native, but looks unpolished.', Node: Variant01 },
    { n: 2, name: 'Pill toggle', best: 'Glance & tap', note: 'Two equal pills, maroon when active. Instantly readable state; matches the preview pages.', Node: Variant02 },
    { n: 3, name: 'Pill toggle + icons', best: 'Scanning fast', note: 'Same as 02 with clinical glyphs. Two hard visual anchors; best "no reading required" balance.', Node: Variant03 },
    { n: 4, name: 'Line tabs', best: 'Minimal, editorial', note: 'Text-only underline tabs. Zero chrome; feels like a document tab, not a control.', Node: Variant04 },
    { n: 5, name: 'Select popover', best: 'Modern, compact', note: 'Button showing current value with a dropdown panel and check marks. Closest to shadcn/Select.', Node: Variant05 },
    { n: 6, name: 'Menu button', best: 'One-button simplicity', note: 'Single "Search: X" button. The most compact footprint; state is spelled out in the label.', Node: Variant06 },
];

export default function IllnessDropdownPreview() {
    return (
        <>
            <Head title="Illness statistics — control lab" />
            <div className="idd-page">
                <header className="idd-top">
                    <span className="idd-kicker">Admin · Reports · illness statistics · control lab</span>
                    <h1>The Word / ICD-10 toggle, six ways</h1>
                    <p>
                        Click each one — they all work. Below the switch is a live readout of what "search by…" currently means,
                        mirroring the real panel header. Pick a number and it ships.
                    </p>
                </header>

                <div className="idd-grid">
                    {VARIANTS.map(({ n, name, best, note, Node }) => (
                        <section key={n} className="idd-card" aria-labelledby={`v-${n}`}>
                            <header className="idd-card-head">
                                <span className="idd-num">{String(n).padStart(2, '0')}</span>
                                <div>
                                    <h2 id={`v-${n}`}>{name}</h2>
                                    <p className="idd-best"><b>Best for</b> {best}</p>
                                </div>
                            </header>
                            <div className="idd-sample">
                                <span className="idd-sample-kicker">Illness statistics</span>
                                <Node />
                            </div>
                            <p className="idd-note">{note}</p>
                        </section>
                    ))}
                </div>

                <footer className="idd-foot">
                    <p>
                        All six keep keyboard and screen-reader support (<code>role="group"</code> / <code>listbox</code>, visible focus,
                        Escape to dismiss). 02 and 03 are the closest visual siblings of what you already have in the preview rounds.
                        Say <b>"02"</b>…<b>"06"</b> and I'll wire it into the real Reports panel.
                    </p>
                </footer>
            </div>
        </>
    );
}
