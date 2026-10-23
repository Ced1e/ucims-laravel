import React from 'react';

// Small shared pieces for the patient registration wizard (legacy USeP styling).

export function Field({ label, required, error, hint, children }) {
    return (
        <div className="field">
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
        <div style={{ display: 'flex', gap: 22, margin: '4px 0 8px' }}>
            {['Yes', 'No'].map((opt) => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', textTransform: 'none', letterSpacing: 0, fontSize: '.9rem', fontWeight: 500 }}>
                    <input type="radio" name={name} checked={value === opt} onChange={() => onChange(opt)} style={{ width: 'auto' }} /> {opt}
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
