import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

    // Truncated numbered pagination: always first + last, neighbours around the
    // current page, ellipses in between — or a flat window near the edges.
    const pageCount = result.pageCount;
    const page = result.page;
    const entries = [];
    if (pageCount <= 7) {
        for (let p = 1; p <= pageCount; p += 1) entries.push(p);
    } else {
        const wanted = new Set([1, pageCount, page - 1, page, page + 1]);
        if (page <= 4) {
            [2, 3, 4, 5].forEach(p => wanted.add(p));
        } else if (page >= pageCount - 3) {
            [pageCount - 1, pageCount - 2, pageCount - 3, pageCount - 4].forEach(p => wanted.add(p));
        }
        const sorted = [...wanted].filter(p => p >= 1 && p <= pageCount).sort((a, b) => a - b);
        for (const p of sorted) {
            if (entries.length > 0 && p - entries[entries.length - 1] > 1) entries.push('…');
            entries.push(p);
        }
    }

    const controls = (
        <nav aria-label={`${label} pagination`} className="pg-nav">
            <button
                type="button"
                className="pg-btn pg-arrow"
                aria-label={`Previous page of ${label}`}
                disabled={page <= 1}
                onClick={() => go(page - 1)}
            >
                <ChevronLeft size={16} aria-hidden="true" />
            </button>
            {entries.map((entry, index) => entry === '…' ? (
                <span key={`ellipsis-${index}`} className="pg-ellipsis" aria-hidden="true">…</span>
            ) : (
                <button
                    key={entry}
                    type="button"
                    className="pg-btn pg-page"
                    aria-current={entry === page ? 'page' : undefined}
                    onClick={() => go(entry)}
                >
                    {entry}
                </button>
            ))}
            <button
                type="button"
                className="pg-btn pg-arrow"
                aria-label={`Next page of ${label}`}
                disabled={page >= pageCount}
                onClick={() => go(page + 1)}
            >
                <ChevronRight size={16} aria-hidden="true" />
            </button>
            {autoAdvance && pageCount > 1 && <span className="pg-rotate-note">Rotates every 10 seconds</span>}
        </nav>
    );

    return (
        <>
            {result.items.map((item, index) => children(item, result.offset + index))}
            {tableColumns
                ? <tr><td colSpan={tableColumns}>{controls}</td></tr>
                : controls}
        </>
    );
}
