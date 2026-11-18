import React, { useEffect, useId, useMemo, useRef, useState } from 'react';

/**
 * UCIMSSelect — the system's standard dropdown.
 *
 * Drop-in replacement for a native <select>: keep the same <option> children.
 *
 *   <UCIMSSelect value={college} onChange={(e) => setCollege(e.target.value)}>
 *       <option value="">All Colleges</option>
 *       {colleges.map((c) => <option key={c}>{c}</option>)}
 *   </UCIMSSelect>
 *
 * The onChange handler receives a native-style event ({ target: { value } }),
 * so existing `e.target.value` handlers work unchanged.
 *
 * Optional small-caps label above the control:
 *   <UCIMSSelect label="College" ...>
 *
 * If an option's text ends with a short code in parentheses —
 * e.g. "College of Information and Computing (CIC)" — the code is rendered
 * as a right-aligned badge: "College of Information and Computing [CIC]".
 */

const BADGE_RE = /^(.*?)\s*\(([A-Za-z0-9&/\- ]{1,10})\)\s*$/;

function flattenText(node) {
    if (node === null || node === undefined || typeof node === 'boolean') return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(flattenText).join('');
    if (React.isValidElement(node)) return flattenText(node.props.children);
    return '';
}

function splitBadge(text) {
    const m = BADGE_RE.exec(text.trim());
    if (!m) return { label: text.trim(), badge: null };
    return { label: m[1].trim(), badge: m[2].trim() };
}

export default function UCIMSSelect({
    value,
    onChange,
    children,
    label,
    disabled = false,
    error = false,
    id,
    name,
    className = '',
    style,
    title,
    required = false,
    maxLength: _maxLength, // bind() spreads input-only props; keep them off <button>
    pattern: _pattern,
    inputMode: _inputMode,
    autoComplete: _autoComplete,
    ...rest
}) {
    const autoId = useId();
    const controlId = id || `ucims-select-${autoId}`;
    const rootRef = useRef(null);
    const listRef = useRef(null);
    const buttonRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const options = useMemo(() => {
        return React.Children.toArray(children)
            .filter(React.isValidElement)
            .map((el) => {
                const text = flattenText(el.props.children);
                const val = el.props.value !== undefined ? el.props.value : text;
                return { value: String(val), ...splitBadge(text) };
            });
    }, [children]);

    const current = String(value ?? '');
    const selectedIndex = options.findIndex((o) => o.value === current);
    const selected = selectedIndex >= 0 ? options[selectedIndex] : null;
    const display = selected ? selected.label : (options[0] && options[0].value === '' ? options[0].label : 'Select…');

    const emit = (v) => {
        if (onChange) onChange({ target: { value: v }, currentTarget: { value: v } });
    };

    const choose = (index) => {
        const opt = options[index];
        if (!opt) return;
        emit(opt.value);
        setOpen(false);
        setActiveIndex(-1);
        buttonRef.current?.focus();
    };

    // Close on outside click / Escape; restore focus handling.
    useEffect(() => {
        if (!open) return undefined;
        const onDocMouseDown = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) {
                setOpen(false);
                setActiveIndex(-1);
            }
        };
        const onKey = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                setOpen(false);
                setActiveIndex(-1);
                buttonRef.current?.focus();
            }
        };
        document.addEventListener('mousedown', onDocMouseDown, true);
        document.addEventListener('keydown', onKey, true);
        return () => {
            document.removeEventListener('mousedown', onDocMouseDown, true);
            document.removeEventListener('keydown', onKey, true);
        };
    }, [open]);

    // Keep the keyboard-focused option in view.
    useEffect(() => {
        if (open && activeIndex >= 0 && listRef.current) {
            const el = listRef.current.children[activeIndex];
            if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
        }
    }, [open, activeIndex]);

    const onButtonKeyDown = (e) => {
        if (disabled) return;
        const last = options.length - 1;
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (!open) { setOpen(true); setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0); }
                else setActiveIndex((i) => (i >= last ? 0 : i + 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (!open) { setOpen(true); setActiveIndex(selectedIndex >= 0 ? selectedIndex : last); }
                else setActiveIndex((i) => (i <= 0 ? last : i - 1));
                break;
            case 'Home':
                if (open) { e.preventDefault(); setActiveIndex(0); }
                break;
            case 'End':
                if (open) { e.preventDefault(); setActiveIndex(last); }
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (open) { if (activeIndex >= 0) choose(activeIndex); else setOpen(false); }
                else { setOpen(true); setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0); }
                break;
            case 'Tab':
                setOpen(false);
                break;
            default: {
                // Type-ahead: jump to the next option starting with the typed character.
                if (open && e.key.length === 1 && /\S/.test(e.key)) {
                    const ch = e.key.toLowerCase();
                    for (let offset = 1; offset <= options.length; offset += 1) {
                        const idx = (Math.max(activeIndex, selectedIndex) + offset) % options.length;
                        if (options[idx].label.toLowerCase().startsWith(ch)) { setActiveIndex(idx); break; }
                    }
                }
            }
        }
    };

    return (
        <div
            ref={rootRef}
            className={`ucims-select${error ? ' ucims-select--error' : ''}${className ? ` ${className}` : ''}`}
            style={style}
        >
            {label && <label className="ucims-select__label" htmlFor={controlId}>{label}</label>}
            <button
                ref={buttonRef}
                type="button"
                id={controlId}
                name={name}
                className="ucims-select__control"
                disabled={disabled}
                title={title}
                required={required}
                {...rest}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-invalid={error || undefined}
                onClick={() => { if (!disabled) { setOpen((v) => !v); setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0); } }}
                onKeyDown={onButtonKeyDown}
            >
                <span className="ucims-select__value">{display}</span>
                <svg className="ucims-select__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
            </button>
            {open && !disabled && (
                <ul ref={listRef} className="ucims-select__panel" role="listbox" aria-label={label || 'Options'} tabIndex={-1}>
                    {options.map((opt, i) => (
                        <li
                            key={`${opt.value}-${i}`}
                            role="option"
                            aria-selected={opt.value === current}
                            className={`ucims-select__option${opt.value === current ? ' is-selected' : ''}${i === activeIndex ? ' is-active' : ''}`}
                            onMouseEnter={() => setActiveIndex(i)}
                            onClick={() => choose(i)}
                        >
                            <span className="ucims-select__option-label">{opt.label}</span>
                            {opt.badge && <span className="ucims-select__badge">{opt.badge}</span>}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
