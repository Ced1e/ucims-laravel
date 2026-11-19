import { Head } from '@inertiajs/react';
import { Check, Type } from 'lucide-react';

/*
 * Font lab — pick what goes in the Illness Statistics panel.
 *  Section A: the ICD-10 chip (current: system monospace = option 01)
 *  Section B: the condition title (current: DM Serif Display)
 *
 * Columns are identical except for font-family, so only the typeface changes.
 */

const PANEL_SENTENCE = 'Acute upper respiratory infection, unspecified accounts for 50% of 2 diagnoses.';
const SAMPLE_CODES = ['J06.9', 'K29.70', 'R50.9'];

const BADGES = [
    { n: 1, name: 'System Mono', family: "ui-monospace, 'Cascadia Mono', Consolas, 'Liberation Mono', monospace", tag: 'System · no download', weights: '400/600', note: 'Engineered, clinical, zero network cost. Current choice.' },
    { n: 2, name: 'IBM Plex Mono', family: "'IBM Plex Mono', monospace", tag: 'Google Fonts · OFL', weights: '400/500/600', note: 'Corporate mono with true tabular figures and an industrial edge.' },
    { n: 3, name: 'JetBrains Mono', family: "'JetBrains Mono', monospace", tag: 'Google Fonts · OFL', weights: '400/600', note: 'Friendly, rounded mono — reads softer at small sizes.' },
    { n: 4, name: 'IBM Plex Sans', family: "'IBM Plex Sans', sans-serif", tag: 'Google Fonts · OFL', weights: '400/600/700', note: 'Government-report sans; loses the code-look, gains calm.' },
    { n: 5, name: 'Open Sans', family: "'Open Sans', sans-serif", tag: 'Already in the app', weights: '300/400/600/700', note: 'The brand font itself — one family everywhere, nothing new to load.' },
    { n: 6, name: 'Inter', family: "'Inter', sans-serif", tag: 'Google Fonts · OFL', weights: '400/500/600/700', note: 'Default dashboard typeface; clinical, focused, very compact.' },
];

const TITLES = [
    { n: 7, name: 'Open Sans 600', family: "'Open Sans', sans-serif", weight: '600', tag: 'Already in the app', note: 'All-sans title — most legible in dense panels, zero new import.' },
    { n: 8, name: 'IBM Plex Sans 600', family: "'IBM Plex Sans', sans-serif", weight: '600', tag: 'Google Fonts · OFL', note: 'Matches the Plex badge (option 04); built for print reports.' },
    { n: 9, name: 'Source Serif 4 600', family: "'Source Serif 4', serif", weight: '600', tag: 'Google Fonts · OFL', note: 'Calm, restrained serif — a professional medical journal feel.' },
    { n: 10, name: 'Public Sans 600', family: "'Public Sans', sans-serif", weight: '600', tag: 'Google Fonts · OFL', note: 'The US-government neutral (Section 508); silent, corporate, accessible.' },
];

const CURRENT = { badge: 1, title: 'DM Serif Display' };

export default function IllnessFontPreview() {
    return (
        <>
            <Head title="Illness statistics — font lab">
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&family=Public+Sans:wght@400;600&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&display=swap"
                />
            </Head>

            <div className="ifp-page">
                <header className="ifp-top">
                    <span className="ifp-kicker">Admin · Reports · font lab</span>
                    <h1>Pick the type for the panel</h1>
                    <p>
                        Section A covers the ICD-10 chip on the top-right of the condition detail. Section B covers the
                        condition title. Every card renders the same text in the same box — only the font changes, so what
                        you see is exactly what ships. <b>Current state:</b> option 01 (system mono) for the chip, DM Serif Display for the title.
                    </p>
                </header>

                <section aria-labelledby="badge-lab">
                    <div className="ifp-head">
                        <h2 id="badge-lab"><Type size={15} aria-hidden="true" /> A — The ICD-10 chip</h2>
                        <span className="ifp-head-note">Current: <b>01 · System Mono</b></span>
                    </div>
                    <div className="ifp-grid">
                        {BADGES.map((font) => (
                            <article key={font.n} className={`ifp-card${font.n === CURRENT.badge ? ' is-current' : ''}`}>
                                <header className="ifp-card-head">
                                    <span className="ifp-num">{String(font.n).padStart(2, '0')}</span>
                                    <div>
                                        <h3 style={{ fontFamily: font.family }}>{font.name}</h3>
                                        <p>{font.tag} · weights {font.weights}</p>
                                    </div>
                                    {font.n === CURRENT.badge && <span className="ifp-cur"><Check size={12} aria-hidden="true" /> now</span>}
                                </header>
                                <div className="ifp-samples">
                                    {SAMPLE_CODES.map((code) => (
                                        <span
                                            key={code}
                                            className="ifp-chip"
                                            style={{ fontFamily: font.family, fontWeight: 600 }}
                                        >
                                            {code}
                                        </span>
                                    ))}
                                </div>
                                <p className="ifp-meta" style={{ fontFamily: font.family }}>
                                    50% of 14 cases · Jun–Nov 2026
                                </p>
                                <p className="ifp-note">{font.note}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section aria-labelledby="title-lab">
                    <div className="ifp-head">
                        <h2 id="title-lab"><Type size={15} aria-hidden="true" /> B — The condition title</h2>
                        <span className="ifp-head-note">Current: <b>DM Serif Display</b></span>
                    </div>
                    <div className="ifp-title-grid">
                        <article className="ifp-card is-current">
                            <header className="ifp-card-head">
                                <span className="ifp-num">—</span>
                                <div>
                                    <h3 style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400 }}>DM Serif Display</h3>
                                    <p>The current serif · already loaded</p>
                                </div>
                                <span className="ifp-cur"><Check size={12} aria-hidden="true" /> now</span>
                            </header>
                            <h3 className="ifp-title" style={{ fontFamily: "'DM Serif Display', serif" }}>Acute upper respiratory infection, unspecified</h3>
                            <p className="ifp-note">High-contrast display serif. Elegant, editorial — but heavier than the compact admin panel needs.</p>
                        </article>

                        {TITLES.map((font) => (
                            <article key={font.n} className="ifp-card">
                                <header className="ifp-card-head">
                                    <span className="ifp-num">{String(font.n).padStart(2, '0')}</span>
                                    <div>
                                        <h3 style={{ fontFamily: font.family, fontWeight: Number(font.weight) }}>{font.name}</h3>
                                        <p>{font.tag}</p>
                                    </div>
                                </header>
                                <h3 className="ifp-title" style={{ fontFamily: font.family, fontWeight: Number(font.weight) }}>
                                    Acute upper respiratory infection, unspecified
                                </h3>
                                <p className="ifp-note">{font.note}</p>
                            </article>
                        ))}
                    </div>

                    <p className="ifp-foot-note">
                        Body line used everywhere: {PANEL_SENTENCE} — rendered in each card so you can compare word endings and digit shapes too.
                    </p>
                </section>

                <footer className="ifp-foot">
                    <p>
                        Pick badge + title by number (e.g. <b>"badge 04, title 07"</b>) and I'll wire it into{' '}
                        <code>admin-illness-statistics.css</code> for the real Reports panel. System fonts cost zero requests;&nbsp;Google fonts add one cached request to <code>fonts.googleapis.com</code>.
                    </p>
                </footer>
            </div>
        </>
    );
}
