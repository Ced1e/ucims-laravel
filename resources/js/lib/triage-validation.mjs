/**
 * Shared sanitise/validate helpers for clinic vital-sign fields.
 * Used by the nurse triage modal and the triage-record pages so the
 * same limits and error messages apply everywhere.
 */
import { formatBloodPressure } from './input-validation.mjs';

export const vitalConfig = {
    heart_rate: { label: 'Heart rate', min: 30, max: 220, decimals: 0, unit: 'bpm' },
    pulse_rate: { label: 'Pulse rate', min: 30, max: 220, decimals: 0, unit: 'bpm' },
    temperature: { label: 'Temperature', min: 30, max: 45, decimals: 1, unit: '°C' },
    resp_rate: { label: 'Respiratory rate', min: 5, max: 60, decimals: 0, unit: 'breaths/min' },
    o2_saturation: { label: 'O₂ saturation', min: 0, max: 100, decimals: 0, unit: '%' },
    weight: { label: 'Weight', min: 10, max: 300, decimals: 1, unit: 'kg' },
    height: { label: 'Height', min: 50, max: 250, decimals: 1, unit: 'cm' },
};

/** Keep only what the field can realistically hold — no letters, no wild ranges. */
export function sanitizeVital(name, raw) {
    if (name === 'blood_pressure') return formatBloodPressure(raw);
    const config = vitalConfig[name];
    if (!config) return String(raw ?? '');
    const allowDecimal = config.decimals > 0;
    const cleaned = String(raw ?? '').replace(allowDecimal ? /[^0-9.]/g : /[^0-9]/g, '');
    if (!allowDecimal) return cleaned.slice(0, 3);
    const dot = cleaned.indexOf('.');
    const whole = (dot === -1 ? cleaned : cleaned.slice(0, dot)).slice(0, 3);
    if (dot === -1) return whole;
    const fraction = cleaned.slice(dot + 1).replace(/\./g, '').slice(0, config.decimals);
    return `${whole}.${fraction}`;
}

/** Range check for one vital field — returns null when valid, message otherwise. */
export function validateVital(name, raw) {
    const config = vitalConfig[name];
    const value = String(raw ?? '').trim();
    if (!value) return null; // presence/required is handled separately
    if (!config) return null;
    const number = Number(value);
    if (!Number.isFinite(number)) return `Enter a number for ${config.label.toLowerCase()}.`;
    if (number < config.min || number > config.max) {
        return `${config.label} must be between ${config.min} and ${config.max}.`;
    }
    return null;
}

/** Blood pressure has its own structure — required, NNN/NNN, and sys > dia. */
export function validateBloodPressure(raw) {
    const value = String(raw ?? '').trim();
    if (!value) return 'Blood pressure is required.';
    if (!/^\d{2,3}\/\d{2,3}$/.test(value)) return 'Format: systolic/diastolic, e.g. 120/80.';
    const [sys, dia] = value.split('/').map(Number);
    if (sys < 70 || sys > 250) return 'Systolic must be between 70 and 250 mmHg.';
    if (dia < 40 || dia > 150) return 'Diastolic must be between 40 and 150 mmHg.';
    if (sys <= dia) return 'Systolic must be greater than diastolic.';
    return null;
}

/** Complaint text must contain words — not just digits or symbols. */
export function validateChiefComplaint(raw) {
    const value = String(raw ?? '').trim();
    if (!value) return 'Chief complaint is required.';
    if (value.length < 3) return 'Please describe the complaint more clearly.';
    if (!/[a-zA-Z]/.test(value)) {
        return 'Chief complaint must contain words, not just numbers or symbols.';
    }
    return null;
}

export function validateNotes(raw, max = 1000) {
    const value = String(raw ?? '');
    if (value.length > max) return `Notes must be ${max} characters or fewer.`;
    return null;
}
