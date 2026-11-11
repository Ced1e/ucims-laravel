import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import {
    ArrowDown,
    ArrowRight,
    ArrowUp,
    ArrowUpRight,
    CalendarCheck,
    CheckCircle2,
    ChevronDown,
    ClipboardList,
    FileCheck2,
    FileText,
    HeartPulse,
    Mail,
    Monitor,
    Pill,
    Stethoscope,
    UserPlus,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

/*
 * UCIMS Homepage — Design 1 (Refined Legacy Classic) with 3 UX Feels
 * - Yellow underline between Maroon hero and white/cream section REMOVED
 * - 100vh Full-Screen Maroon Hero (Design 1: Refined Legacy Classic)
 * - 3 Interactive UX Feels to choose from:
 *   1. Guided Scroll & Sticky Active Nav (smooth scroll cue, sticky glass nav with active section indicator, scroll-reveal sections, back-to-top button)
 *   2. Tactile Micro-Interactions & Quick-Jump Pills (interactive section jump pills on hero, tactile card elevation + icon fill transitions)
 *   3. Interactive Service Steps & Live Queue Peek (expandable inline live queue status drawer on hero + interactive step-by-step clinic guide on service cards)
 */

const SEAL = '/assets/img/University of Southeastern Philippines Seal.png';

export const homeDesigns = [
    {
        id: 1,
        name: 'Guided Scroll & Sticky Nav',
        detail: 'Smooth borderless transition with an animated "Explore Services" scroll cue, sticky glass navbar that highlights your active section as you scroll, and floating Back-to-Top button.',
    },
    {
        id: 2,
        name: 'Tactile Hover & Quick-Jump',
        detail: 'Interactive quick-jump navigation chips under the System Objective card, tactile service card hover elevation with maroon icon-fill transitions, and smooth section reveals.',
    },
    {
        id: 3,
        name: 'Interactive Clinic Explorer',
        detail: 'Soft curved horizon transition, a toggleable Live Queue quick-peek drawer inside the hero, and clickable Service cards that reveal step-by-step clinic instructions.',
    },
];

const OBJECTIVE_TEXT =
    'The general objective of the proposed University Clinic Information Management System (UCIMS) is to develop a web-based, role-based platform that streamlines and automates the operational workflow of the university clinic, enhancing the efficiency of patient registration, consultation management, and clinical documentation while ensuring data integrity and user-specific access control.';

const services = [
    {
        title: 'Check-up',
        Icon: HeartPulse,
        text: 'Medical consultations and physical examinations for students and university personnel.',
        steps: ['Log in to your UCIMS account', 'Select Check-up in the clinic queue', 'Proceed to Nurse Station for vitals', 'Consult with the University Physician'],
        duration: 'Est. 15–20 mins',
    },
    {
        title: 'Medicine request',
        Icon: Pill,
        text: 'Request available medicines for minor illnesses and health conditions.',
        steps: ['Log in and choose Medicine Request', 'Nurse verifies symptoms & vitals', 'Receive initial starter medication', 'Recorded automatically in your chart'],
        duration: 'Est. 5–10 mins',
    },
    {
        title: 'Follow-up consultation',
        Icon: CalendarCheck,
        text: 'Review treatment progress and monitor ongoing health conditions.',
        steps: ['Check in with your previous visit record', 'Nurse updates vital signs', 'Physician reviews recovery progress', 'Updated prescription or clearance issued'],
        duration: 'Est. 10–15 mins',
    },
    {
        title: 'Medical certificate',
        Icon: FileCheck2,
        text: 'Request documentation for school, employment, OJT, and return to school or work.',
        steps: ['Submit request via Patient Portal', 'Complete physical examination if needed', 'Physician reviews and signs clearance', 'Download or claim official certificate'],
        duration: 'Same-day release',
    },
];

const pillars = [
    {
        title: 'Patient Registration',
        Icon: ClipboardList,
        text: 'One structured digital health record for every student, faculty member, and staff.',
    },
    {
        title: 'Clinical Consultations',
        Icon: Stethoscope,
        text: 'Triage vitals, physician examination, and prescriptions recorded in one seamless flow.',
    },
    {
        title: 'Medical Certificates',
        Icon: FileText,
        text: 'Medical excuses and clearances requested, reviewed, and released on time.',
    },
];

function FacebookLogo() {
    return (
        <span className="hr-brand-badge hr-fb" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" focusable="false">
                <path
                    fill="#fff"
                    d="M13.6 21v-8.2h2.76l.41-3.2H13.6V7.56c0-.93.26-1.56 1.59-1.56h1.7V3.14c-.3-.04-1.3-.14-2.47-.14-2.45 0-4.12 1.49-4.12 4.23v2.37H7.54v3.2h2.76V21h3.3Z"
                />
            </svg>
        </span>
    );
}

function InstagramLogo() {
    return (
        <span className="hr-brand-badge hr-ig" aria-hidden="true">
            <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                focusable="false"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <rect x="3" y="3" width="18" height="18" rx="5.2" />
                <circle cx="12" cy="12" r="4.1" />
                <circle cx="17.3" cy="6.7" r="1.2" fill="#fff" stroke="none" />
            </svg>
        </span>
    );
}

function EmailLogo() {
    return (
        <span className="hr-brand-badge hr-mail" aria-hidden="true">
            <Mail size={21} strokeWidth={2.2} />
        </span>
    );
}

const channels = [
    { name: 'Facebook', handle: '@USePofficial', href: 'https://www.facebook.com/USePofficial', Logo: FacebookLogo, external: true },
    { name: 'Instagram', handle: '@usepofficial', href: 'https://www.instagram.com/usepofficial/', Logo: InstagramLogo, external: true },
    { name: 'Email', handle: 'pad@usep.edu.ph', href: 'mailto:pad@usep.edu.ph', Logo: EmailLogo, external: false },
];

// ─────────────────────────────────────────────────────────────
// Live Queue Hook (for UX Feel 3 Live Queue Quick-Peek)
// ─────────────────────────────────────────────────────────────
type Entry = { queueNumber: number; serving: boolean };
type Board = { waiting: Entry[]; nurse: Entry[]; doctor: Entry[] };

const pad = (value: number) => String(value).padStart(3, '0');

function cleanEntries(value: unknown): Entry[] {
    if (!Array.isArray(value)) return [];
    return value
        .filter((entry) => entry && entry.queueNumber != null)
        .map((entry) => ({ queueNumber: Number(entry.queueNumber), serving: entry.serving === true }));
}

function stationNumber(entries: Entry[]): string {
    const serving = entries.find((entry) => entry.serving);
    if (serving) return pad(serving.queueNumber);
    if (entries.length === 1) return pad(entries[0].queueNumber);
    return '—';
}

function useLiveQueue() {
    const [board, setBoard] = useState<Board | null>(null);
    const [online, setOnline] = useState(false);

    useEffect(() => {
        let stopped = false;
        let timer: number | undefined;
        let controller: AbortController | undefined;

        async function load() {
            controller = new AbortController();
            try {
                const { data } = await axios.get('/api/tv-queue', {
                    signal: controller.signal,
                    timeout: 10000,
                    headers: { Accept: 'application/json' },
                });
                if (stopped) return;
                setBoard({
                    waiting: cleanEntries(data?.waiting),
                    nurse: cleanEntries(data?.nurse),
                    doctor: cleanEntries(data?.doctor),
                });
                setOnline(true);
            } catch {
                if (!stopped) setOnline(false);
            } finally {
                if (!stopped) timer = window.setTimeout(load, 10000);
            }
        }

        void load();
        return () => {
            stopped = true;
            window.clearTimeout(timer);
            controller?.abort();
        };
    }, []);

    return { board, online };
}

function smoothScrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ─────────────────────────────────────────────────────────────
// Header & Hero (Design 1: Refined Legacy Classic)
// ─────────────────────────────────────────────────────────────
function Header({ activeSection, scrolled }: { activeSection: string; scrolled: boolean }) {
    return (
        <header className={`hr-header ${scrolled ? 'is-scrolled' : ''}`}>
            <div className="hr-container hr-header-inner">
                <Link href="/" className="hr-brand" aria-label="USeP University Clinic home">
                    <img src={SEAL} width={50} height={50} alt="" />
                    <span>
                        <strong>UNIVERSITY OF SOUTHEASTERN PHILIPPINES</strong>
                        <small>WE BUILD DREAMS WITHOUT LIMITS</small>
                    </span>
                </Link>
                <nav aria-label="Main navigation">
                    <a
                        href="#hr-services"
                        className={activeSection === 'services' ? 'is-active' : undefined}
                        onClick={(e) => {
                            e.preventDefault();
                            smoothScrollTo('hr-services');
                        }}
                    >
                        SERVICES
                    </a>
                    <a
                        href="#hr-about"
                        className={activeSection === 'about' ? 'is-active' : undefined}
                        onClick={(e) => {
                            e.preventDefault();
                            smoothScrollTo('hr-about');
                        }}
                    >
                        ABOUT
                    </a>
                    <a
                        href="#hr-contact"
                        className={activeSection === 'contact' ? 'is-active' : undefined}
                        onClick={(e) => {
                            e.preventDefault();
                            smoothScrollTo('hr-contact');
                        }}
                    >
                        CONTACT
                    </a>
                    <Link href="/tv-queue" className="hr-live-btn">
                        <Monitor size={15} aria-hidden="true" />
                        <span>LIVE QUEUE</span>
                        <span className="hr-live-ping" aria-hidden="true" />
                    </Link>
                </nav>
            </div>
        </header>
    );
}

function Actions() {
    return (
        <div className="hr-actions" role="group" aria-label="Account access">
            <Link href="/login" className="hr-btn hr-btn-gold">
                <span>Login</span>
                <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link href="/register" className="hr-btn hr-btn-ghost">
                <span>Register</span>
                <UserPlus size={17} aria-hidden="true" />
            </Link>
        </div>
    );
}

function ObjectiveCard({ ux }: { ux: number }) {
    const { board, online } = useLiveQueue();
    const [peekOpen, setPeekOpen] = useState(true);

    return (
        <div className="hr-objective-card">
            <h2>SYSTEM OBJECTIVE</h2>
            <p>{OBJECTIVE_TEXT}</p>

            {/* UX Feel 2: Interactive Quick-Jump Section Chips */}
            {ux === 2 && (
                <div className="hr-ux2-jumps" aria-label="Quick section jump">
                    <button type="button" onClick={() => smoothScrollTo('hr-services')}>
                        <HeartPulse size={14} aria-hidden="true" />
                        <span>4 Clinic Services</span>
                        <ArrowDown size={13} aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => smoothScrollTo('hr-about')}>
                        <ClipboardList size={14} aria-hidden="true" />
                        <span>System Workflow &amp; Team</span>
                        <ArrowDown size={13} aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => smoothScrollTo('hr-contact')}>
                        <Mail size={14} aria-hidden="true" />
                        <span>Official Channels</span>
                        <ArrowDown size={13} aria-hidden="true" />
                    </button>
                </div>
            )}

            {/* UX Feel 3: Interactive Live Queue Quick-Peek Drawer inside the Objective Card */}
            {ux === 3 && (
                <div className="hr-ux3-peek">
                    <button
                        type="button"
                        className="hr-ux3-peek-toggle"
                        aria-expanded={peekOpen}
                        onClick={() => setPeekOpen((v) => !v)}
                    >
                        <span className="hr-ux3-peek-title">
                            <span className="hr-live-ping" aria-hidden="true" />
                            Live Clinic Queue Status ({online ? 'Online' : 'Syncing'})
                        </span>
                        <span className="hr-ux3-peek-action">
                            {peekOpen ? 'Hide live numbers' : 'Peek live numbers'}
                            <ChevronDown size={15} className={peekOpen ? 'is-open' : ''} />
                        </span>
                    </button>
                    {peekOpen && (
                        <div className="hr-ux3-peek-drawer">
                            <div className="hr-ux3-stat">
                                <span>Nurse Station</span>
                                <strong>{board ? stationNumber(board.nurse) : '—'}</strong>
                            </div>
                            <div className="hr-ux3-stat">
                                <span>Doctor’s Clinic</span>
                                <strong>{board ? stationNumber(board.doctor) : '—'}</strong>
                            </div>
                            <div className="hr-ux3-stat">
                                <span>Waiting in Lobby</span>
                                <strong>{board ? String(board.waiting.length) : '0'}</strong>
                            </div>
                            <Link href="/tv-queue" className="hr-ux3-open-tv">
                                Open TV Kiosk <ArrowUpRight size={14} />
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Below-the-Fold Sections
// ─────────────────────────────────────────────────────────────
function SectionHeading({
    label,
    title,
    children,
    align = 'center',
}: {
    label: string;
    title: string;
    children?: ReactNode;
    align?: 'center' | 'left';
}) {
    return (
        <div className={`hr-heading is-${align}`}>
            <p className="hr-label">{label}</p>
            <h2>{title}</h2>
            {children && <p className="hr-sub">{children}</p>}
        </div>
    );
}

function Services({ ux }: { ux: number }) {
    const [activeService, setActiveService] = useState<string>('Check-up');

    return (
        <section id="hr-services" className="hr-section hr-services-section">
            <div className="hr-container">
                <SectionHeading label="CLINIC SERVICES" title="Care for Your Everyday Needs">
                    Explore the medical and health documentation services available through the USeP University Clinic.
                </SectionHeading>
                <div className="hr-services">
                    {services.map(({ title, Icon, text, steps, duration }) => {
                        const isSelected = ux === 3 && activeService === title;
                        return (
                            <article
                                key={title}
                                className={`hr-card hr-service ${ux === 3 ? 'is-interactive' : ''} ${isSelected ? 'is-selected' : ''}`}
                                onClick={ux === 3 ? () => setActiveService(title) : undefined}
                            >
                                <div className="hr-service-head">
                                    <span className="hr-service-icon">
                                        <Icon size={20} aria-hidden="true" />
                                    </span>
                                    <h3>{title}</h3>
                                    {ux >= 2 && <span className="hr-service-badge">{duration}</span>}
                                </div>
                                <p>{text}</p>

                                {/* UX Feel 3: Expandable Step-by-Step Clinic Guide */}
                                {ux === 3 && (
                                    <div className="hr-service-steps">
                                        <div className="hr-steps-label">
                                            <span>How this service works</span>
                                            <small>{isSelected ? 'Active view' : 'Click card to inspect'}</small>
                                        </div>
                                        {isSelected && (
                                            <ol className="hr-steps-list">
                                                {steps.map((step) => (
                                                    <li key={step}>
                                                        <CheckCircle2 size={14} aria-hidden="true" />
                                                        <span>{step}</span>
                                                    </li>
                                                ))}
                                            </ol>
                                        )}
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

function About() {
    return (
        <section id="hr-about" className="hr-section hr-about">
            <div className="hr-container">
                <div className="hr-about-grid">
                    <div className="hr-about-copy">
                        <SectionHeading label="ABOUT THE SYSTEM" title="One Platform for a Connected Clinic" align="left" />
                        <p>
                            UCIMS is a centralized digital registry developed for the healthcare services of the University of Southeastern Philippines.
                        </p>
                        <p>
                            It brings patient registration, consultation documentation, medical history, and certificate processing together in one cohesive platform.
                        </p>
                        <div className="hr-purpose">
                            <h3>Our Purpose</h3>
                            <p>
                                Support quality university healthcare through clearer workflows, accurate records, and secure access tailored to each user’s role.
                            </p>
                        </div>
                    </div>
                    <figure className="hr-about-photo">
                        <img src="/assets/img/team.jpg" width={640} height={480} alt="UCIMS project team" loading="lazy" />
                        <figcaption>UCIMS Project Team · University of Southeastern Philippines</figcaption>
                    </figure>
                </div>
                <div className="hr-pillars">
                    {pillars.map(({ title, Icon, text }) => (
                        <article key={title} className="hr-card hr-pillar">
                            <div className="hr-service-head">
                                <span className="hr-service-icon">
                                    <Icon size={20} aria-hidden="true" />
                                </span>
                                <h3>{title}</h3>
                            </div>
                            <p>{text}</p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}

function Contact() {
    return (
        <section id="hr-contact" className="hr-section hr-contact">
            <div className="hr-container">
                <SectionHeading label="GET IN TOUCH" title="Connect With Us">
                    Reach out to the University of Southeastern Philippines through our official communication channels.
                </SectionHeading>
                <div className="hr-channels">
                    {channels.map(({ name, handle, href, Logo, external }) => (
                        <a
                            key={name}
                            className="hr-card hr-channel"
                            href={href}
                            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                            aria-label={`${name}: ${handle}${external ? ' (opens in a new tab)' : ''}`}
                        >
                            <Logo />
                            <span className="hr-channel-text">
                                <strong>{name}</strong>
                                <small>{handle}</small>
                            </span>
                            <ArrowUpRight className="hr-channel-arrow" size={16} aria-hidden="true" />
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}

function Footer() {
    return (
        <footer className="hr-footer">
            <div className="hr-container">
                <span>© 2026 University of Southeastern Philippines · University Clinic</span>
                <span>University Clinic Information Management System (UCIMS)</span>
            </div>
        </footer>
    );
}

export default function HomeRefresh({
    initialDesign = 1,
    showPicker = true,
}: {
    initialDesign?: number;
    showPicker?: boolean;
}) {
    const [design, setDesign] = useState(() => {
        if (typeof window !== 'undefined') {
            const param = Number(new URLSearchParams(window.location.search).get('design'));
            if (param >= 1 && param <= homeDesigns.length) return param;
        }
        return Math.min(homeDesigns.length, Math.max(1, initialDesign));
    });
    const [activeSection, setActiveSection] = useState<string>('hero');
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => {
            setScrolled(window.scrollY > 48);
            const y = window.scrollY + 220;
            const contactEl = document.getElementById('hr-contact');
            const aboutEl = document.getElementById('hr-about');
            const servicesEl = document.getElementById('hr-services');
            if (contactEl && y >= contactEl.offsetTop) setActiveSection('contact');
            else if (aboutEl && y >= aboutEl.offsetTop) setActiveSection('about');
            else if (servicesEl && y >= servicesEl.offsetTop) setActiveSection('services');
            else setActiveSection('hero');
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const choice = homeDesigns[design - 1] ?? homeDesigns[0];

    function select(next: number) {
        setDesign(next);
        const url = new URL(window.location.href);
        url.searchParams.set('design', String(next));
        window.history.replaceState(null, '', url.pathname + url.search);
    }

    return (
        <div className={`hp hr hr-ux-${design}`}>
            <Head title={showPicker ? `UCIMS · ${choice.name}` : 'University Clinic Information Management System'} />
            <a className="hr-skip" href="#hr-main">
                Skip to content
            </a>

            {/* Full-Viewport Maroon Stage (100vh, No Yellow Underline) */}
            <div className="hr-stage">
                <Header activeSection={activeSection} scrolled={scrolled} />
                <section id="hr-main" className="hr-hero">
                    <div className="hr-container hr-hero-inner">
                        <div className="hr-hero-top">
                            <p className="hr-eyebrow">UNIVERSITY OF SOUTHEASTERN PHILIPPINES</p>
                            <h1>
                                Clinic Information
                                <br />
                                Management System
                            </h1>
                            <p className="hr-hero-summary">
                                A centralized digital platform for managing clinic visits, patient records, consultations, and health documentation securely.
                            </p>
                            <Actions />
                        </div>

                        <ObjectiveCard ux={design} />

                        {/* Smooth Scroll-Down UX Cue */}
                        <button
                            type="button"
                            className="hr-scroll-cue"
                            onClick={() => smoothScrollTo('hr-services')}
                            aria-label="Scroll down to Clinic Services"
                        >
                            <span>Explore Clinic Services</span>
                            <span className="hr-scroll-chevron">
                                <ChevronDown size={16} aria-hidden="true" />
                            </span>
                        </button>
                    </div>
                </section>
            </div>

            <main>
                <Services ux={design} />
                <About />
                <Contact />
            </main>
            <Footer />

            {/* Back to top button when scrolled */}
            {scrolled && (
                <button
                    type="button"
                    className="hr-back-top"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    aria-label="Back to top"
                >
                    <ArrowUp size={17} aria-hidden="true" />
                </button>
            )}

            {/* Floating Bottom-Right UX Feel Switcher */}
            {showPicker && (
                <aside className="hr-floating-picker" aria-label="UX feel switcher">
                    <span className="hr-picker-label">UX Feel:</span>
                    <div className="hr-preview-choices" role="group" aria-label="Choose a UX feel">
                        {homeDesigns.map((item, i) => (
                            <button
                                key={item.name}
                                type="button"
                                aria-pressed={design === i + 1}
                                onClick={() => select(i + 1)}
                                title={item.detail}
                            >
                                {i + 1}. {item.name}
                            </button>
                        ))}
                    </div>
                </aside>
            )}
        </div>
    );
}
