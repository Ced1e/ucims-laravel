import { ListSkeleton, ServingSkeleton } from '@/components/data-skeletons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import { Clock3, HeartPulse, Maximize2, Minimize2, Stethoscope } from 'lucide-react';
import { useEffect, useState } from 'react';

const empty = { waiting: [], nurse: [], doctor: [] };
const number = (value) => String(value).padStart(3, '0');

function WaitingStrip({ entries }) {
    const [page, setPage] = useState(0);
    const perPage = 8;
    const pages = Math.ceil(entries.length / perPage);

    useEffect(() => {
        setPage(0);
    }, [entries.map((e) => e.queueNumber).join(',')]);

    useEffect(() => {
        if (pages < 2) return;
        const id = setInterval(() => setPage((p) => (p + 1) % pages), 8000);
        return () => clearInterval(id);
    }, [pages]);

    const slice = entries.slice((page % Math.max(1, pages)) * perPage, (page % Math.max(1, pages)) * perPage + perPage);

    return (
        <>
            <div className="q5-wait-grid">
                {slice.map((entry, idx) => {
                    const order = (page % Math.max(1, pages)) * perPage + idx + 1;
                    const isNext = order === 1;
                    return (
                        <div key={entry.queueNumber} className={`q5-wait-chip ${isNext ? 'is-next' : ''}`}>
                            <strong>{number(entry.queueNumber)}</strong>
                            <span>{isNext ? 'NEXT' : `#${order}`}</span>
                        </div>
                    );
                })}
            </div>
            {pages > 1 && (
                <p className="q5-wait-meta">
                    Page {page + 1} of {pages} · {entries.length} patients in waiting area
                </p>
            )}
        </>
    );
}

function TicketStation({
    code,
    title,
    entries,
    nurse,
    ready,
    loading,
    locationLabel,
    requirementLabel,
}) {
    const serving = entries.filter((e) => e.serving);
    const others = entries.filter((e) => !e.serving);
    const activeTicket = serving.length
        ? number(serving[0].queueNumber)
        : entries.length === 1
          ? number(entries[0].queueNumber)
          : '—';
    const isCalling = serving.length > 0;
    const hasAssigned = entries.length > 0;
    const queued = isCalling ? others : others.slice(1);

    return (
        <Card className={`q5-ticket ${nurse ? 'is-nurse' : 'is-doctor'} ${isCalling ? 'is-calling' : ''}`}>
            <CardHeader className="q5-ticket-top">
                <div>
                    <CardDescription className="q5-ticket-eyebrow">{code}</CardDescription>
                    <CardTitle className="q5-ticket-title">{title}</CardTitle>
                </div>
            </CardHeader>

            <CardContent className="q5-ticket-body">
                {loading ? (
                    <ServingSkeleton />
                ) : (
                    <>
                        <div className="q5-ticket-main">
                            <div>
                                <span className="q5-ticket-caption">
                                    {isCalling ? 'CALLED TICKET' : hasAssigned ? 'SERVING TICKET' : 'CURRENT TICKET'}
                                </span>
                                <div className="q5-ticket-number">{activeTicket}</div>
                            </div>
                            <div className="q5-ticket-side">
                                <Badge variant="secondary" className="q5-counter-pill">
                                    {nurse ? <HeartPulse data-icon="inline-start" /> : <Stethoscope data-icon="inline-start" />}
                                    {nurse ? 'Proceed to Window 1' : 'Consultation Room 2'}
                                </Badge>
                            </div>
                        </div>

                        <div className="q5-ticket-meta">
                            <div className="q5-meta-box">
                                <span>STATION LOCATION</span>
                                <strong>{locationLabel}</strong>
                            </div>
                            <div className="q5-meta-box">
                                <span>{isCalling ? 'CHECK-IN REQUIREMENT' : 'STATION STATUS'}</span>
                                <strong>
                                    {!ready
                                        ? 'Reconnecting to clinic feed'
                                        : isCalling
                                          ? requirementLabel
                                          : hasAssigned
                                            ? 'Patient currently at station'
                                            : 'Standby for next call'}
                                </strong>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>

            {queued.length > 0 && (
                <CardFooter className="q5-ticket-foot">
                    <span className="q5-foot-label">{nurse ? 'QUEUED AT THIS STATION' : 'NEXT FOR PHYSICIAN'}</span>
                    <div className="q5-foot-chips">
                        {queued.slice(0, 4).map((e) => (
                            <Badge key={e.queueNumber} variant="outline" className="q5-queue-pill">
                                {number(e.queueNumber)}
                            </Badge>
                        ))}
                    </div>
                </CardFooter>
            )}
        </Card>
    );
}

export default function TvQueue() {
    const [board, setBoard] = useState(empty);
    const [connection, setConnection] = useState('Connecting');
    const [ready, setReady] = useState(false);
    const [updated, setUpdated] = useState(null);
    const [now, setNow] = useState(new Date());
    const [full, setFull] = useState(false);
    const [error, setError] = useState('');
    const loading = !ready && connection === 'Connecting';

    useEffect(() => {
        let stopped = false,
            timer,
            controller;
        async function load() {
            controller = new AbortController();
            try {
                const { data } = await axios.get('/api/tv-queue', {
                    signal: controller.signal,
                    timeout: 10000,
                    headers: { Accept: 'application/json' },
                });
                if (stopped) return;
                setBoard(
                    Object.fromEntries(
                        Object.keys(empty).map((key) => [
                            key,
                            Array.isArray(data[key])
                                ? data[key]
                                      .filter((e) => e.queueNumber != null)
                                      .map((e) => ({
                                          queueNumber: e.queueNumber,
                                          serving: e.serving === true,
                                      }))
                                : [],
                        ]),
                    ),
                );
                setReady(true);
                setConnection('Live Clinic Feed');
                setUpdated(new Date());
            } catch {
                if (!stopped) setConnection('Reconnecting');
            } finally {
                if (!stopped) timer = setTimeout(load, 3000);
            }
        }
        load();
        return () => {
            stopped = true;
            clearTimeout(timer);
            controller?.abort();
        };
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        const change = () => setFull(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', change);
        return () => {
            clearInterval(timer);
            document.removeEventListener('fullscreenchange', change);
        };
    }, []);

    async function fullscreen() {
        try {
            if (document.fullscreenElement) await document.exitFullscreen();
            else await document.querySelector('.q-board')?.requestFullscreen();
            setError('');
        } catch {
            setError('Full screen is unavailable in this browser.');
        }
    }

    return (
        <div className="hp q-preview q-live q5-kiosk">
            <Head title="Live Queue · USeP Clinic" />
            <div className="q-board q5-board">
                <aside className="q5-rail">
                    <div className="q5-rail-top">
                        <Link href="/" className="q5-brand" aria-label="USeP Clinic home">
                            <img
                                src="/assets/img/University of Southeastern Philippines Seal.png"
                                alt="USeP seal"
                                width="52"
                                height="52"
                            />
                            <div>
                                <strong>USeP Clinic</strong>
                                <small>Obrero Campus · UCIMS</small>
                            </div>
                        </Link>

                        <Separator className="q5-rail-sep" />

                        <div className="q5-rail-heading">
                            <span className="q5-rail-eyebrow">QUEUE MONITOR</span>
                            <h1>Now Serving</h1>
                            <Badge variant="secondary" role="status" className="q5-live-badge">
                                <span className="q5-dot" aria-hidden="true" />
                                {connection}
                            </Badge>
                        </div>

                        <Separator className="q5-rail-sep" />

                        <div className="q5-rail-clock">
                            <span className="q5-clock-label">PHILIPPINE STANDARD TIME</span>
                            <time>
                                {now.toLocaleTimeString('en-US', {
                                    timeZone: 'Asia/Manila',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true,
                                })}
                            </time>
                            <small>
                                {now.toLocaleDateString('en-US', {
                                    timeZone: 'Asia/Manila',
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </small>
                        </div>
                    </div>

                    <div className="q5-rail-bottom">
                        <Button
                            variant="outline"
                            size="lg"
                            className={`q5-tv-btn${full ? ' is-exit' : ''}`}
                            onClick={fullscreen}
                        >
                            {full ? <Minimize2 data-icon="inline-start" /> : <Maximize2 data-icon="inline-start" />}
                            {full ? 'Exit TV mode' : 'Enter Fullscreen TV Mode'}
                        </Button>
                        {error && (
                            <small className="q5-error" role="alert">
                                {error}
                            </small>
                        )}
                    </div>
                </aside>

                <main className="q5-canvas">
                    {connection === 'Reconnecting' && (
                        <div className="q5-connection" role="status">
                            Connection interrupted.{' '}
                            {updated
                                ? `Showing last update from ${updated.toLocaleTimeString('en-US', { timeZone: 'Asia/Manila' })}.`
                                : 'Queue feed is reconnecting.'}{' '}
                            Retrying automatically every 3 seconds.
                        </div>
                    )}

                    <div className="q5-bento">
                        <TicketStation
                            code="STATION 01 · TRIAGE & VITALS"
                            title="Nurse Station"
                            entries={board.nurse}
                            nurse
                            ready={ready}
                            loading={loading}
                            locationLabel="Triage Bay 01 · Ground Floor"
                            requirementLabel="Present USeP ID Card"
                        />
                        <TicketStation
                            code="STATION 02 · MEDICAL CONSULTATION"
                            title="Doctor’s Clinic"
                            entries={board.doctor}
                            nurse={false}
                            ready={ready}
                            loading={loading}
                            locationLabel="Consultation Room 02"
                            requirementLabel="Referred from Triage Bay"
                        />

                        <Card className="q5-deck-card">
                            <CardHeader className="q5-deck-head">
                                <div>
                                    <CardTitle className="q5-deck-title">Waiting Area Queue</CardTitle>
                                    <CardDescription className="q5-deck-sub">
                                        Patients checked in at clinic reception
                                    </CardDescription>
                                </div>
                                <Badge className="q5-count-badge">
                                    <Clock3 data-icon="inline-start" />
                                    {board.waiting.length} Waiting
                                </Badge>
                            </CardHeader>
                            <CardContent className="q5-deck-content">
                                {loading ? (
                                    <ListSkeleton columns={4} rows={2} label="Loading waiting queue" />
                                ) : board.waiting.length ? (
                                    <WaitingStrip entries={board.waiting} />
                                ) : (
                                    <div className="q5-inline-empty">
                                        <strong>{ready ? 'No patients currently in lobby queue' : 'Syncing waiting list'}</strong>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}

TvQueue.layout = (page) => page;
