import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad = (n) => String(n).padStart(2, '0');
const toISO = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

function parseISO(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ''));
    if (!match) return null;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return Number.isNaN(date.getTime()) ? null : date;
}

const addDays = (date, days) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const firstOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const sameDay = (a, b) => Boolean(a && b)
    && a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();

const formatHuman = (iso) => {
    const date = parseISO(iso);
    return date ? date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
};
const formatLong = (date) => date.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

/** Monday-first index (0 = Monday … 6 = Sunday). */
const mondayIndex = (date) => (date.getDay() + 6) % 7;

/** Six stable rows starting on the Monday on or before the first of the month. */
function monthCells(view) {
    const first = firstOfMonth(view);
    const start = addDays(first, -mondayIndex(first));
    return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

export default function DatePicker({
    id,
    value = '',
    onChange,
    min,
    max,
    label = 'date',
    placeholder = 'Select date',
    disabled = false,
    initialMonth,
}) {
    const baseDate = () => parseISO(value) || parseISO(initialMonth) || parseISO(min) || new Date();
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState(value || '');
    const [view, setView] = useState(() => firstOfMonth(baseDate()));
    const [focusISO, setFocusISO] = useState(() => toISO(baseDate()));
    const [mode, setMode] = useState('days'); // 'days' | 'months' | 'years'
    const [position, setPosition] = useState({ left: 0, top: 0, ready: false });

    const wrapRef = useRef(null);
    const triggerRef = useRef(null);
    const panelRef = useRef(null);
    const panelId = useId();

    const close = (returnFocus = false) => {
        setOpen(false);
        setMode('days');
        if (returnFocus) triggerRef.current?.focus();
    };

    const openPicker = () => {
        const base = baseDate();
        setDraft(value || '');
        setView(firstOfMonth(base));
        setFocusISO(toISO(base));
        setMode('days');
        setOpen(true);
    };

    // Keep a value controlled from outside (e.g. auto-clear) in sync while closed.
    useEffect(() => {
        if (open) return;
        setDraft(value || '');
        const base = parseISO(value);
        if (base) {
            setView(firstOfMonth(base));
            setFocusISO(toISO(base));
        }
    }, [value, open]);

    // The panel is portalled to <body>, so it is never clipped by a scrolling
    // ancestor. Anchor it to the trigger and flip above when space runs out.
    useLayoutEffect(() => {
        if (!open) {
            setPosition((previous) => (previous.ready ? { ...previous, ready: false } : previous));
            return undefined;
        }
        const place = () => {
            const rect = triggerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const width = panelRef.current?.offsetWidth || 344;
            const height = panelRef.current?.offsetHeight || 400;
            const left = Math.min(Math.max(12, rect.left), Math.max(12, window.innerWidth - width - 12));
            let top = rect.bottom + 8;
            let maxHeight;
            if (top + height > window.innerHeight - 12) {
                const above = rect.top - height - 8;
                if (above >= 0) {
                    top = above;
                } else {
                    // Neither side fits: open below and let the panel scroll.
                    top = rect.bottom + 8;
                    maxHeight = Math.max(240, window.innerHeight - top - 8);
                }
            }
            setPosition({ left, top, ready: true, maxHeight });
        };
        place();
        window.addEventListener('scroll', place, true);
        window.addEventListener('resize', place);
        return () => {
            window.removeEventListener('scroll', place, true);
            window.removeEventListener('resize', place);
        };
    }, [open]);

    // Keep the day grid focused only in day mode; month/year grids are plain buttons.
    useEffect(() => {
        if (!open || !position.ready || mode !== 'days') return;
        panelRef.current?.querySelector(`[data-date="${focusISO}"]`)?.focus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, position.ready, mode]);

    // Roving tabindex: follow the focused day as the keyboard moves.
    useEffect(() => {
        if (!open || !position.ready || mode !== 'days') return;
        const node = panelRef.current?.querySelector(`[data-date="${focusISO}"]`);
        if (node && document.activeElement !== node) node.focus();
    }, [focusISO, open, view, position.ready, mode]);

    useEffect(() => {
        if (!open) return undefined;
        const onPointerDown = (event) => {
            if (!wrapRef.current?.contains(event.target) && !panelRef.current?.contains(event.target)) setOpen(false);
        };
        const onKeyDown = (event) => {
            if (event.key === 'Escape') close(true);
        };
        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    const isDisabledDay = (date) => {
        const iso = toISO(date);
        if (min && iso < min) return true;
        if (max && iso > max) return true;
        return false;
    };

    const moveFocus = (days) => {
        const current = parseISO(focusISO) || new Date();
        const next = addDays(current, days);
        setFocusISO(toISO(next));
        if (next.getMonth() !== view.getMonth() || next.getFullYear() !== view.getFullYear()) {
            setView(firstOfMonth(next));
        }
    };

    const moveMonth = (offset) => {
        const next = new Date(view.getFullYear(), view.getMonth() + offset, 1);
        setView(next);
        setFocusISO(toISO(next));
    };

    const moveYear = (offset) => {
        const next = new Date(view.getFullYear() + offset, view.getMonth(), 1);
        const day = (parseISO(focusISO) || next).getDate();
        const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
        setView(next);
        setFocusISO(toISO(new Date(next.getFullYear(), next.getMonth(), Math.min(day, maxDay))));
    };

    const jumpToDecade = (offset) => {
        const next = new Date(view.getFullYear() + offset, view.getMonth(), 1);
        setView(next);
    };

    const pickMonth = (monthIndex) => {
        const next = new Date(view.getFullYear(), monthIndex, 1);
        const day = (parseISO(focusISO) || next).getDate();
        const maxDay = new Date(next.getFullYear(), monthIndex + 1, 0).getDate();
        setView(next);
        setFocusISO(toISO(new Date(next.getFullYear(), monthIndex, Math.min(day, maxDay))));
        setMode('days');
    };

    const pickYear = (year) => {
        const next = new Date(year, view.getMonth(), 1);
        const day = (parseISO(focusISO) || next).getDate();
        const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
        setView(next);
        setFocusISO(toISO(new Date(year, next.getMonth(), Math.min(day, maxDay))));
        setMode('months');
    };

    const onGridKeyDown = (event) => {
        const current = parseISO(focusISO) || new Date();
        if (event.key === 'ArrowLeft') { event.preventDefault(); moveFocus(-1); }
        else if (event.key === 'ArrowRight') { event.preventDefault(); moveFocus(1); }
        else if (event.key === 'ArrowUp') { event.preventDefault(); moveFocus(-7); }
        else if (event.key === 'ArrowDown') { event.preventDefault(); moveFocus(7); }
        else if (event.key === 'Home') { event.preventDefault(); moveFocus(-mondayIndex(current)); }
        else if (event.key === 'End') { event.preventDefault(); moveFocus(6 - mondayIndex(current)); }
        else if (event.key === 'PageUp') { event.preventDefault(); moveMonth(-1); }
        else if (event.key === 'PageDown') { event.preventDefault(); moveMonth(1); }
    };

    const pickDay = (date) => {
        if (isDisabledDay(date)) return;
        const iso = toISO(date);
        setDraft(iso);
        setFocusISO(iso);
        if (date.getMonth() !== view.getMonth() || date.getFullYear() !== view.getFullYear()) {
            setView(firstOfMonth(date));
        }
    };

    const applyValue = () => {
        onChange?.(draft || '');
        close(true);
    };

    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const cells = monthCells(view);
    const monthLabel = view.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });

    const minYear = min ? Number(String(min).slice(0, 4)) : null;
    const maxYear = max ? Number(String(max).slice(0, 4)) : null;
    const minMonth = min && min.length >= 7 ? Number(String(min).slice(5, 7)) - 1 : 0;
    const maxMonth = max && max.length >= 7 ? Number(String(max).slice(5, 7)) - 1 : 11;

    // Years view: 12-cell window anchored on the view year.
    const decadeBase = Math.floor(view.getFullYear() / 12) * 12;
    const yearsInGrid = Array.from({ length: 12 }, (_, i) => decadeBase + i);

    const draftYear = draft ? Number(draft.slice(0, 4)) : null;
    const draftMonth = draft ? Number(draft.slice(5, 7)) - 1 : null;

    const navPrev = () => {
        if (mode === 'days') moveMonth(-1);
        else if (mode === 'months') moveYear(-1);
        else jumpToDecade(-12);
    };
    const navNext = () => {
        if (mode === 'days') moveMonth(1);
        else if (mode === 'months') moveYear(1);
        else jumpToDecade(12);
    };
    const navHint = mode === 'days' ? 'month' : mode === 'months' ? 'year' : 'decade';

    return (
        <div className="uc-datepicker" ref={wrapRef}>
            <button
                ref={triggerRef}
                type="button"
                id={id}
                className={`uc-dp-trigger${value ? '' : ' is-empty'}`}
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-controls={open ? panelId : undefined}
                aria-label={value ? `${label}: ${formatHuman(value)}` : `${label}: ${placeholder}`}
                disabled={disabled}
                onClick={() => (open ? close(true) : openPicker())}
            >
                <span className="uc-dp-value">{value ? formatHuman(value) : placeholder}</span>
                <CalendarDays size={16} aria-hidden="true" />
            </button>

            {open && typeof document !== 'undefined' && createPortal(
                <div
                    ref={panelRef}
                    id={panelId}
                    className="uc-dp-panel"
                    style={{
                        left: position.left,
                        top: position.top,
                        maxHeight: position.maxHeight ? `${position.maxHeight}px` : undefined,
                        visibility: position.ready ? 'visible' : 'hidden',
                    }}
                    role="dialog"
                    aria-modal="false"
                    aria-label={`Choose ${label}`}
                >
                    <div className="uc-dp-head">
                        <button
                            type="button"
                            className="uc-dp-nav"
                            aria-label={`Previous ${navHint}`}
                            onClick={navPrev}
                        >
                            <ChevronLeft size={18} aria-hidden="true" />
                        </button>
                        {mode === 'years' ? (
                            <div className="uc-dp-title" aria-live="polite">{decadeBase}&ndash;{decadeBase + 11}</div>
                        ) : (
                            <button
                                type="button"
                                className="uc-dp-title uc-dp-title-btn"
                                aria-label={mode === 'days' ? 'Switch to month and year selection' : 'Switch to year selection'}
                                onClick={() => setMode(mode === 'days' ? 'months' : 'years')}
                            >
                                {mode === 'days' ? monthLabel : view.getFullYear()}
                            </button>
                        )}
                        <button
                            type="button"
                            className="uc-dp-nav"
                            aria-label={`Next ${navHint}`}
                            onClick={navNext}
                        >
                            <ChevronRight size={18} aria-hidden="true" />
                        </button>
                    </div>

                    {mode === 'days' && (
                        <>
                            <div className="uc-dp-weekdays" aria-hidden="true">
                                {WEEKDAYS.map((day) => (
                                    <span key={day}>{day}</span>
                                ))}
                            </div>

                            <div className="uc-dp-grid" role="group" aria-label={monthLabel} onKeyDown={onGridKeyDown}>
                                {cells.map((date) => {
                                    const iso = toISO(date);
                                    const outside = date.getMonth() !== view.getMonth();
                                    const selected = draft === iso;
                                    const isToday = sameDay(date, today);
                                    const disabledDay = isDisabledDay(date);
                                    return (
                                        <button
                                            key={iso}
                                            type="button"
                                            data-date={iso}
                                            tabIndex={focusISO === iso ? 0 : -1}
                                            className={[
                                                'uc-dp-day',
                                                outside ? 'is-outside' : '',
                                                selected ? 'is-selected' : '',
                                                isToday ? 'is-today' : '',
                                            ].filter(Boolean).join(' ')}
                                            aria-label={formatLong(date)}
                                            aria-pressed={selected}
                                            aria-current={isToday ? 'date' : undefined}
                                            disabled={disabledDay}
                                            onClick={() => pickDay(date)}
                                        >
                                            {date.getDate()}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {mode === 'months' && (
                        <div className="uc-dp-mode-grid uc-dp-mode-grid--months" role="group" aria-label={`Choose month, ${view.getFullYear()}`}>
                            {MONTHS.map((name, i) => {
                                const viewYear = view.getFullYear();
                                const disabledMonth = (minYear && viewYear < minYear)
                                    || (maxYear && viewYear > maxYear)
                                    || (minYear && viewYear === minYear && i < minMonth)
                                    || (maxYear && viewYear === maxYear && i > maxMonth);
                                const cellClasses = [
                                    'uc-dp-cell',
                                    draftYear === view.getFullYear() && draftMonth === i ? 'is-selected' : '',
                                    i === todayMonth && view.getFullYear() === todayYear ? 'is-current' : '',
                                ].filter(Boolean).join(' ');
                                return (
                                    <button
                                        key={name}
                                        type="button"
                                        className={cellClasses}
                                        disabled={disabledMonth}
                                        onClick={() => pickMonth(i)}
                                    >
                                        {name}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {mode === 'years' && (
                        <div className="uc-dp-mode-grid uc-dp-mode-grid--years" role="group" aria-label={`Choose year, ${decadeBase} to ${decadeBase + 11}`}>
                            {yearsInGrid.map((year) => {
                                const outOfRange = (minYear && year < minYear) || (maxYear && year > maxYear);
                                const cellClasses = [
                                    'uc-dp-cell',
                                    draftYear === year ? 'is-selected' : '',
                                    year === todayYear ? 'is-current' : '',
                                ].filter(Boolean).join(' ');
                                return (
                                    <button
                                        key={year}
                                        type="button"
                                        className={cellClasses}
                                        disabled={outOfRange}
                                        onClick={() => pickYear(year)}
                                    >
                                        {year}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div className="uc-dp-footer">
                        <button type="button" className="uc-dp-cancel" onClick={() => close(true)}>Cancel</button>
                        <span className={`uc-dp-selection${draft ? '' : ' is-empty'}`} aria-live="polite">
                            <span>{draft ? formatHuman(draft) : 'No date selected'}</span>
                            {draft && (
                                <button
                                    type="button"
                                    className="uc-dp-selection-clear"
                                    aria-label="Clear selected date"
                                    onClick={() => { setDraft(''); onChange?.(''); }}
                                >
                                    <X size={11} aria-hidden="true" />
                                </button>
                            )}
                        </span>
                        <button
                            type="button"
                            className="uc-dp-confirm"
                            disabled={!draft}
                            onClick={applyValue}
                        >
                            Select
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
