import React from 'react';

// Small shared pieces for the patient registration wizard (legacy USeP styling).

export function Field({ label, required, error, hint, children }) {
    return (
        <div className="field" data-invalid={error ? '' : undefined}>
            {label && (
                <label>
                    {label}
                    {required ? ' *' : ''}
                </label>
            )}
            {children}
            {hint && <div className="text-xs text-muted" style={{ marginTop: 4 }}>{hint}</div>}
            {error && (
                <div className="text-xs" style={{ color: '#C0392B', marginTop: 4 }}>
                    {error}
                </div>
            )}
        </div>
    );
}

export function YesNo({ value, onChange, name }) {
    return (
        <div style={{ display: 'flex', gap: 26, margin: '4px 0 8px', alignItems: 'center' }}>
            {['Yes', 'No'].map((opt) => (
                <label key={opt} className="uc-radio-row">
                    <input type="radio" name={name} value={opt} className="uc-radio" checked={value === opt} onChange={() => onChange(opt)} /> {opt}
                </label>
            ))}
        </div>
    );
}

export function SectionTitle({ children }) {
    return (
        <div className="card-title" style={{ fontSize: '1rem', color: 'var(--maroon)', marginBottom: 12 }}>
            {children}
        </div>
    );
}
