import { useEffect, useState } from 'react';
import { paginate, listIdentity } from '../lib/pagination.mjs';

/**
 * One independent paginator per rendered record list; safe inside table bodies.
 * @template T
 * @param {{items?: T[], children: (item: T, index: number) => import('react').ReactNode, tableColumns?: number, autoAdvance?: boolean, label?: string, pageSize?: number}} props
 */
export default function PaginatedItems({ items = [], children, tableColumns, autoAdvance = false, label = 'Records', pageSize = 20 }) {
    const signature = listIdentity(items);
    const [position, setPosition] = useState({ page: 1, signature });
    const requestedPage = !autoAdvance && position.signature !== signature ? 1 : position.page;
    const result = paginate(items, requestedPage, pageSize);
    // Persist reset/clamp so a previously selected page cannot reappear after filtering.
    useEffect(() => {
        setPosition(previous => previous.page === result.page && previous.signature === signature
            ? previous : { page: result.page, signature });
    }, [result.page, signature]);
    useEffect(() => {
        if (!autoAdvance || result.pageCount <= 1) return;
        const timer = setInterval(() => setPosition(previous => ({ ...previous,
            page: previous.page >= result.pageCount ? 1 : previous.page + 1 })), 10000);
        return () => clearInterval(timer);
    }, [autoAdvance, result.pageCount]);
    const go = page => setPosition({ page, signature });
    const controls = (
        <nav aria-label={`${label} pagination`} style={{ gridColumn: '1 / -1', width: '100%', flexShrink: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '12px 8px' }}>
            <button type="button" className="btn btn-outline btn-sm" aria-label={`Previous page of ${label}`} disabled={result.page <= 1} onClick={() => go(result.page - 1)}>Previous</button>
            <span role="status" aria-live={autoAdvance ? 'off' : 'polite'} style={{ fontSize: '.85rem' }}>
                {result.start}–{result.end} of {result.total} · Page {result.page} of {result.pageCount}
            </span>
            <button type="button" className="btn btn-outline btn-sm" aria-label={`Next page of ${label}`} disabled={result.page >= result.pageCount} onClick={() => go(result.page + 1)}>Next</button>
            {autoAdvance && result.pageCount > 1 && <span style={{ fontSize: '.75rem' }}>Rotates every 10 seconds</span>}
        </nav>
    );
    return <>{result.items.map((item, index) => children(item, result.offset + index))}
        {tableColumns ? <tr><td colSpan={tableColumns}>{controls}</td></tr> : controls}
    </>;
}


