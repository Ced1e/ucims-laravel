import { Head } from '@inertiajs/react';
import { useState } from 'react';
import {
    ArrowRight,
    Crosshair,
    HeartPulse,
    Quote,
    ShieldCheck,
    Target,
} from 'lucide-react';

const OBJECTIVE_TEXT =
    'The general objective of the proposed University Clinic Information Management System (UCIMS) is to develop a web-based, role-based platform that streamlines and automates the operational workflow of the university clinic, enhancing the efficiency of patient registration, consultation management, and clinical documentation while ensuring data integrity and user-specific access control.';

const designs = [
    {
        name: 'Maroon Statement',
        short: 'Split editorial panel — the current About panel, refined.',
        rationale:
            'Stays inside the existing brand system (maroon gradient, gold accent, hairline divider). Information-dense, high contrast, calm hierarchy — the safest ship.',
    },
    {
        name: 'Swiss Objective',
        short: 'Swiss/minimal grid — numeral, rule, single accent.',
        rationale:
            'Verified match for the product profile: "Minimalism & Swiss Style" (styles.csv) — grid-based, single accent, no decoration; best fit for enterprise, documentation and professional tools.',
    },
    {
        name: 'Soft Clinical',
        short: 'Soft-UI/neumorphism card — embossed panel and inset badge.',
        rationale:
            'The health-sector pattern returned by the ui-ux-pro-max design system pass (soft UI, rounded 12–24px, low-cost performance). Keeps gains in calmness; needs the stated 4.5:1 text contrast to stay safe.',
    },
    {
        name: 'Editorial Motto',
        short: 'Academic pull-quote — serif, centred, one thesis line.',
        rationale:
            'General guidance (no database match found for this treatment): academic pull-quote typeset for an institutional/academic audience — ceremonial, human, and readable at a glance.',
    },
    {
        name: 'Mission Band',
        short: 'Full-bleed maroon strip — edge-to-edge statement with live mark.',
        rationale:
            'General guidance (dark statement/mission strip pattern): full-width band with a gold hairline and a vertical wordmark; reads as a mission statement rather than a card.',
    },
];

export default function ObjectiveDesigns({ initialDesign = 1 }: { initialDesign?: number }) {
    const [design, setDesign] = useState(() => {
        const fromUrl = typeof window !== 'undefined' ? Number(new URLSearchParams(window.location.search).get('design')) : 0;
        return fromUrl >= 1 && fromUrl <= designs.length ? fromUrl : initialDesign;
    });

    function select(next: number) {
        setDesign(next);
        const url = new URL(window.location.href);
        url.searchParams.set('design', String(next));
        window.history.replaceState(null, '', url.pathname + url.search);
    }

    const current = designs[design - 1] ?? designs[0];

    return (
        <div className="od-page">
            <Head title="UCIMS · System objective — design review" />

            <header className="od-picker">
                <div>
                    <strong>System Objective — design review</strong>
                    <small>Local preview · About the System · copy unchanged</small>
                </div>
                <div className="od-picker-group" role="group" aria-label="Design choice">
                    {designs.map((d, i) => (
                        <button
                            key={d.name}
                            type="button"
                            aria-pressed={design === i + 1}
                            aria-label={`Design ${i + 1}: ${d.name}`}
                            onClick={() => select(i + 1)}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            </header>

            <div className="od-caption">
                <h1>{design}. {current.name}</h1>
                <p>
                    {current.short}
                    <span className="od-rationale">{current.rationale}</span>
                </p>
            </div>

            <main className="od-stage">
                {/* Context mock — what the panel sits inside */}
                <section className="od-about" aria-label="About the System context preview">
                    <div className="od-about-copy">
                        <p className="od-eyebrow">ABOUT THE SYSTEM</p>
                        <h2>One Platform for a Connected Clinic</h2>
                        <p>
                            UCIMS is a centralized digital registry developed for the healthcare
                            services of the University of Southeastern Philippines.
                        </p>
                        <p>
                            It brings patient registration, consultation documentation, medical
                            history, and certificate processing together in one cohesive platform.
                        </p>
                        <div className="od-purpose">
                            <h3>Our Purpose</h3>
                            <p>
                                Support quality university healthcare through clearer workflows,
                                accurate records, and secure access tailored to each user’s role.
                            </p>
                        </div>
                    </div>
                    <figure className="od-photo">
                        <img
                            src="/assets/img/team.jpg"
                            width={640}
                            height={480}
                            loading="lazy"
                            alt="UCIMS project team, University of Southeastern Philippines"
                        />
                        <figcaption>UCIMS Project Team · University of Southeastern Philippines</figcaption>
                    </figure>
                </section>

                {/* ── Variant 1 · Maroon Statement (brand-refined split) ── */}
                {design === 1 && (
                    <figure className="od-objective od-obj-1" aria-label="System objective, design 1">
                        <div className="od-obj-1-head">
                            <span className="od-label">System Objective</span>
                            <p>What the university clinic system sets out to achieve.</p>
                        </div>
                        <p className="od-text">{OBJECTIVE_TEXT}</p>
                    </figure>
                )}

                {/* ── Variant 2 · Swiss Objective (minimal grid, single accent) ── */}
                {design === 2 && (
                    <figure className="od-objective od-obj-2" aria-label="System objective, design 2">
                        <span className="od-obj-2-index" aria-hidden="true">01</span>
                        <span className="od-obj-2-rule" aria-hidden="true" />
                        <div>
                            <span className="od-label">System Objective</span>
                            <p className="od-text" style={{ marginTop: 14 }}>{OBJECTIVE_TEXT}</p>
                        </div>
                    </figure>
                )}

                {/* ── Variant 3 · Soft Clinical (soft-UI health pattern) ── */}
                {design === 3 && (
                    <figure className="od-objective od-obj-3" aria-label="System objective, design 3">
                        <span className="od-obj-3-badge" aria-hidden="true">
                            <Target size={34} strokeWidth={1.8} />
                        </span>
                        <div>
                            <span className="od-label">System Objective</span>
                            <p className="od-text">{OBJECTIVE_TEXT}</p>
                        </div>
                    </figure>
                )}

                {/* ── Variant 4 · Editorial Motto (academic pull-quote) ── */}
                {design === 4 && (
                    <figure className="od-objective od-obj-4" aria-label="System objective, design 4">
                        <span className="od-obj-4-quote" aria-hidden="true">
                            <Quote size={34} strokeWidth={1.6} />
                        </span>
                        <span className="od-label">The General Objective</span>
                        <span className="od-obj-4-rule" aria-hidden="true" />
                        <p className="od-text">{OBJECTIVE_TEXT}</p>
                        <p className="od-obj-4-foot">University Clinic Information Management System</p>
                    </figure>
                )}

                {/* ── Variant 5 · Mission Band (full-bleed maroon strip) ── */}
                {design === 5 && (
                    <figure className="od-objective od-obj-5" aria-label="System objective, design 5">
                        <span className="od-obj-5-icon" aria-hidden="true">
                            <Crosshair size={36} strokeWidth={1.5} />
                        </span>
                        <div>
                            <span className="od-label">System Objective</span>
                            <span className="od-obj-5-lead">What the clinic sets out to achieve</span>
                            <p className="od-text">{OBJECTIVE_TEXT}</p>
                        </div>
                        <span className="od-obj-5-mark" aria-hidden="true">UCIMS</span>
                    </figure>
                )}

                <p style={{ margin: '26px 4px 0', fontSize: 12, color: 'var(--muted)' }}>
                    <a
                        href="/"
                        style={{ color: 'var(--maroon)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                        Back to the live homepage <ArrowRight size={13} aria-hidden="true" />
                    </a>
                </p>
            </main>
        </div>
    );
}
