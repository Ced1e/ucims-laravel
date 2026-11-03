export const PAGE_SIZE = 20;

// Slice only the rendered view. Callers retain the original collection for totals/export.
export function paginate(records, requestedPage = 1, requestedSize = PAGE_SIZE) {
    const data = Array.isArray(records) ? records : [];
    const size = Math.min(PAGE_SIZE, Math.max(1, Number.isFinite(requestedSize) ? Math.floor(requestedSize) : PAGE_SIZE));
    const total = data.length;
    const pageCount = Math.max(1, Math.ceil(total / size));
    const page = Math.min(pageCount, Math.max(1, Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 1));
    const offset = (page - 1) * size;
    return { items: data.slice(offset, offset + size), page, pageCount, total, offset,
        start: total ? offset + 1 : 0, end: Math.min(offset + size, total) };
}

// Compare ordered record identities, not mutable status/name/count fields updated by polling.
// Keyless primitive/configuration rows retain a value-based fallback.
export function listIdentity(records) {
    return JSON.stringify((Array.isArray(records) ? records : []).map(record => {
        if (!record || typeof record !== 'object') return record;
        const keys = Object.keys(record).filter(key => key === 'id' || key === 'key' || key === 'queueNumber' || key.endsWith('_id')).sort();
        return keys.length ? keys.map(key => [key, record[key]]) : record;
    }));
}
