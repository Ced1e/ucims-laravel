import PaginatedItems from '../components/paginated-items.jsx';
import { useCallback, useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';

// ─────────────────────────────────────────────────────────────
// Live Queue board (ported from legacy index.html #page-tv-queue +
// initTVQueue() / updateTVQueue() in assets/js/shared.js).
// Public page: shows queue numbers and masked names only.
// ─────────────────────────────────────────────────────────────
const REFRESH_MS = 3000;

const EMPTY = { waiting: [], nurse: [], doctor: [], done: [] };

function useManilaClock() {
    const [now, setNow] = useState(() => formatClock());
    useEffect(() => {
        const id = setInterval(() => setNow(formatClock()), 1000);
        return () => clearInterval(id);
    }, []);
    return now;
}

function formatClock() {
    return new Date().toLocaleTimeString('en-US', {
        timeZone: 'Asia/Manila',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

function QueueCard({ entry, color }) {
    return (
        <div
            style={{
                background: '#fdfdfc',
                border: '1px solid var(--border)',
                borderLeft: `5px solid ${color}`,
                padding: '10px 14px',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 8,
            }}
        >
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color, minWidth: 50, textAlign: 'center' }}>
                #{entry.queueNumber}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <div
                    style={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: '#333',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {entry.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    {entry.visit}
                </div>
            </div>
        </div>
    );
}

function Column({ title, icon, color, entries, emptyText }) {
    return (
        <div
            style={{
                background: '#ffffff',
                borderRadius: 16,
                borderTop: `6px solid ${color}`,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                border: '1px solid var(--border)',
                borderTopWidth: 6,
                borderTopColor: color,
                minHeight: 0,
            }}
        >
            <div
                style={{
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color,
                    marginBottom: 12,
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                }}
            >
                <i className={`bi ${icon}`}></i> {title}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 6 }}>
                {entries.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: 20 }}>
                        {emptyText}
                    </div>
                ) : (
                    <PaginatedItems items={entries} autoAdvance pageSize={4} label={title}>{(e) => <QueueCard key={`${e.queueNumber}-${e.name}`} entry={e} color={color} />}</PaginatedItems>
                )}
            </div>
        </div>
    );
}

export default function TvQueue() {
    const [board, setBoard] = useState(EMPTY);
    const [offline, setOffline] = useState(false);
    const clock = useManilaClock();

    const load = useCallback(async () => {
        try {
            const { data } = await axios.get('/api/tv-queue', { headers: { Accept: 'application/json' } });
            setBoard({
                waiting: data.waiting ?? [],
                nurse: data.nurse ?? [],
                doctor: data.doctor ?? [],
                done: data.done ?? [],
            });
            setOffline(false);
        } catch {
            // Keep showing the last known board; just flag the connection.
            setOffline(true);
        }
    }, []);

    useEffect(() => {
        load();
        const id = setInterval(() => {
            if (!document.hidden) load();
        }, REFRESH_MS);
        return () => clearInterval(id);
    }, [load]);

    return (
        <>
            <Head title="Live Queue">
                <link rel="stylesheet" href="/assets/css/main.css" />
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
            </Head>

            <div style={{ background: '#F5F4F0', color: '#333', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Header */}
                <div
                    style={{
                        padding: '12px 30px',
                        background: 'var(--maroon)',
                        borderBottom: '4px solid var(--gold)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                        flexShrink: 0,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <img
                            src="/assets/img/logo.png"
                            alt="USeP"
                            style={{ width: 50, height: 50, borderRadius: '50%', border: '2px solid var(--gold)', background: '#fff' }}
                        />
                        <div>
                            <div
                                style={{
                                    fontFamily: "'Barlow Condensed', sans-serif",
                                    fontSize: '1.8rem',
                                    fontWeight: 700,
                                    color: 'var(--gold)',
                                    letterSpacing: 1,
                                    textTransform: 'uppercase',
                                    lineHeight: 1,
                                }}
                            >
                                USeP Clinic
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#fff', opacity: 0.9, marginTop: 2, letterSpacing: 1 }}>
                                Live Patient Queue Board
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'monospace', fontSize: '2rem', color: '#fff', fontWeight: 'bold', letterSpacing: 2 }}>
                            {clock}
                        </div>
                        <Link
                            href="/"
                            className="btn btn-outline btn-sm"
                            style={{
                                color: '#fff',
                                borderColor: 'rgba(255,255,255,0.4)',
                                background: 'rgba(0,0,0,0.2)',
                                marginTop: 4,
                                fontSize: '0.75rem',
                                padding: '4px 10px',
                            }}
                        >
                            <i className="bi bi-arrow-left"></i> Exit TV Mode
                        </Link>
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding: '20px 30px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1, minHeight: 0 }}>
                    {offline && (
                        <div
                            style={{
                                background: '#fff3cd',
                                border: '1px solid #ffe08a',
                                color: '#6b5200',
                                borderRadius: 8,
                                padding: '6px 14px',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                textAlign: 'center',
                            }}
                        >
                            <i className="bi bi-wifi-off"></i> Connection lost. Showing the last update and retrying…
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, flex: 1, minHeight: 0 }}>
                        <Column
                            title="Waiting Area"
                            icon="bi-hourglass-split"
                            color="var(--gold)"
                            entries={board.waiting}
                            emptyText="No patients waiting."
                        />
                        <Column
                            title="Nurse Station"
                            icon="bi-clipboard2-pulse"
                            color="var(--maroon)"
                            entries={board.nurse}
                            emptyText="Nurse station clear."
                        />
                        <Column
                            title="Doctor's Clinic"
                            icon="bi-heart-pulse"
                            color="var(--blue)"
                            entries={board.doctor}
                            emptyText="Doctor clinic clear."
                        />
                    </div>

                    {/* Recently completed */}
                    <div
                        style={{
                            background: '#ffffff',
                            borderRadius: 16,
                            border: '1px solid var(--border)',
                            borderTop: '6px solid var(--green)',
                            padding: '12px 20px',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                            flexShrink: 0,
                            minHeight: 200,
                        }}
                    >
                        <div
                            style={{
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                color: 'var(--green)',
                                marginBottom: 10,
                                textAlign: 'center',
                                textTransform: 'uppercase',
                                letterSpacing: 1,
                            }}
                        >
                            <i className="bi bi-check-circle"></i> Recently Completed
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
                            {board.done.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '1rem', width: '100%' }}>
                                    No completed visits yet today.
                                </div>
                            ) : (
                                <PaginatedItems items={board.done} autoAdvance pageSize={4} label="Recently completed">{(q) => (
                                    <div
                                        key={`${q.queueNumber}-${q.name}`}
                                        style={{
                                            background: '#f9fdfa',
                                            border: '1px solid #c3e6cb',
                                            borderBottom: '4px solid var(--green)',
                                            padding: '10px 16px',
                                            borderRadius: 12,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            minWidth: 140,
                                        }}
                                    >
                                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--green)', lineHeight: 1 }}>
                                            #{q.queueNumber}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '0.9rem',
                                                fontWeight: 700,
                                                color: '#333',
                                                textAlign: 'center',
                                                maxWidth: 120,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                        >
                                            {q.name}
                                        </div>
                                    </div>
                                )}</PaginatedItems>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

// The board is a full-screen public display: opt out of the default AppLayout
// (sidebar/header) without touching the shared layout resolver in app.tsx.
TvQueue.layout = (page) => page;
