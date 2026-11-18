/**
 * Canonical ordering for filter dropdown options derived from live data.
 * First-appearance order is non-deterministic across requests, so sort
 * everything into a fixed, predictable sequence. Unknown values keep a
 * trailing alphabetical slot instead of being dropped.
 */
const YEAR_ORDER = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];

const COLLEGE_ORDER = [
    'College of Information and Computing',
    'College of Technology',
    'College of Engineering',
    'College of Arts and Sciences',
    'College of Applied Economics',
    'College of Business Administration',
    'College of Education',
];

// Full option lists for filter dropdowns — shown regardless of what the
// current dataset contains, so the filters stay complete.
export const ALL_COLLEGES = [...COLLEGE_ORDER];
export const ALL_YEAR_LEVELS = [...YEAR_ORDER];
export const ALL_PATIENT_TYPES = ['Student', 'Faculty', 'Staff'];

/**
 * Stored college values sometimes carry a parenthetical code, e.g.
 * "College of Information and Computing (CIC)". Compare the plain name so
 * coded and uncoded rows land on the same option.
 */
export function collegeBase(value) {
    return String(value ?? '')
        .replace(/\s*\([^)]*\)\s*$/g, '')
        .trim()
        .toLowerCase();
}

/** True when two college strings denote the same college. */
export function sameCollege(a, b) {
    return collegeBase(a) === collegeBase(b);
}
const TYPE_ORDER = ['Student', 'Faculty', 'Staff'];

function byCanonical(list, order) {
    const index = (value) => {
        const i = order.indexOf(value);
        return i === -1 ? order.length : i;
    };
    return [...new Set(list)].sort(
        (a, b) => index(a) - index(b) || String(a).localeCompare(String(b)),
    );
}

/** Year levels in ascending order; N/A is excluded from filter lists. */
export function sortYearLevels(list) {
    return byCanonical(
        list.filter((v) => v && v !== 'N/A'),
        YEAR_ORDER,
    );
}

/** Colleges in official USeP order, Faculty / Staff last. */
export function sortColleges(list) {
    return byCanonical(
        list.filter(Boolean),
        COLLEGE_ORDER,
    );
}

/** Patient types: Student, Faculty, then Staff; others alphabetical. */
export function sortTypes(list) {
    return byCanonical(
        list.filter(Boolean),
        TYPE_ORDER,
    );
}

/** Plain alphabetical sort with duplicates removed (e.g. staff names). */
export function sortAlphabetical(list) {
    return [...new Set(list.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
}
