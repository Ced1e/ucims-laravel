const digitsOnly = (value) => String(value ?? '').replace(/\D/g, '');

/** Keep Philippine mobile input readable while storing only its eleven digits. */
export function formatPhilippineMobile(value) {
    return digitsOnly(value).slice(0, 11);
}

/** Format UCIMS patient IDs as YYYY-##### and staff IDs as N-001/D-001/A-001. */
export function formatClinicId(value, kind = 'patient') {
    const source = String(value ?? '').toUpperCase();
    if (kind === 'staff') {
        const prefix = source.match(/[A-Z]/)?.[0] ?? '';
        const digits = digitsOnly(source).slice(0, 3);
        return prefix ? `${prefix}-${digits}` : digits;
    }

    const digits = digitsOnly(source).slice(0, 9);
    return digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
}

/** Let users type a standard BP value while preventing letters or additional segments. */
export function formatBloodPressure(value) {
    const source = String(value ?? '');
    const [rawSystolic = '', rawDiastolic = ''] = source.split('/', 2);
    const joined = digitsOnly(source).slice(0, 6);
    if (source.includes('/')) {
        return `${digitsOnly(rawSystolic).slice(0, 3)}/${digitsOnly(rawDiastolic).slice(0, 3)}`;
    }
    return joined.length > 3 ? `${joined.slice(0, 3)}/${joined.slice(3)}` : joined;
}

/** Remove non-numeric characters and enforce configured decimal precision/range. */
export function numericInput(value, { min = 0, max = Number.POSITIVE_INFINITY, decimals = 0 } = {}) {
    const raw = String(value ?? '').replace(/[^0-9.]/g, '');
    const [whole = '', ...fractionParts] = raw.split('.');
    const fraction = fractionParts.join('').slice(0, decimals);
    const normalized = decimals > 0 && raw.includes('.') ? `${whole}.${fraction}` : whole;
    if (normalized === '' || normalized === '.') return normalized;
    const number = Number(normalized);
    if (!Number.isFinite(number)) return '';
    const bounded = Math.min(max, Math.max(min, number));
    return decimals > 0 ? String(bounded).slice(0, whole.length + 1 + decimals) : String(Math.trunc(bounded));
}

export function usepEmailError(value) {
    const email = String(value ?? '').trim();
    if (!email) return 'Enter a USeP email address.';
    return /^[A-Z0-9._%+-]+@usep\.edu\.ph$/i.test(email)
        ? null
        : 'Use a USeP email address (name@usep.edu.ph).';
}

export const patterns = {
    patientClinicId: '^20\\d{2}-\\d{5}$',
    staffClinicId: '^[ADN]-\\d{3}$',
    philippineMobile: '^09\\d{9}$',
    bloodPressure: '^\\d{2,3}/\\d{2,3}$',
};
