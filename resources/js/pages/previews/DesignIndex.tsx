import { Head } from '@inertiajs/react';
import { ArrowRight, LayoutGrid } from 'lucide-react';

interface PreviewLink {
    name: string;
    href: string;
    description: string;
    variants?: string;
}

const groups: Array<{ title: string; items: PreviewLink[] }> = [
    {
        title: 'Homepage',
        items: [
            {
                name: 'Home Refresh — live homepage',
                href: '/previews/home-refresh',
                description: 'The current public landing design with the 3 UX feels and the new hero animations.',
                variants: '?design=1..5',
            },
            {
                name: 'Home Designs',
                href: '/previews/home-designs',
                description: 'Earlier homepage design exploration, kept for comparison.',
                variants: '?design=1..5',
            },
            {
                name: 'Objective Designs',
                href: '/previews/objective-designs',
                description: '5 candidate treatments for the System Objective panel inside About the System.',
                variants: '?design=1..5',
            },
        ],
    },
    {
        title: 'Illness statistics',
        items: [
            { name: 'Illness Statistics v1', href: '/previews/illness-statistics', description: 'First-pass illness stats design study.' },
            { name: 'Illness Statistics v2', href: '/previews/illness-statistics-2', description: 'Second exploration of the admin illness analytics screens.' },
            { name: 'Illness Statistics v3', href: '/previews/illness-statistics-3', description: 'Third exploration — before the final direction was picked.' },
            { name: 'Illness Statistics v4', href: '/previews/illness-statistics-4', description: 'Fourth exploration — candidate for the shipped design.' },
            { name: 'Illness Font Preview', href: '/previews/illness-fonts', description: 'Typeface shortlist for the analytics visual language.' },
            { name: 'Illness Dropdown Preview', href: '/previews/illness-dropdowns', description: 'Dropdown / autocomplete experiments for the condition filter.' },
        ],
    },
    {
        title: 'Canvases & role designs',
        items: [
            { name: 'Patient Canvas', href: '/previews/patient-canvas', description: 'Patient-facing screens exploration.' },
            { name: 'Nurse Canvas', href: '/previews/nurse-canvas', description: 'Nurse station screens exploration.' },
            { name: 'Doctor Canvas', href: '/previews/doctor-canvas', description: 'Doctor console screens exploration.' },
            { name: 'Doctor Designs', href: '/previews/doctor-designs', description: 'Doctor-facing design variants.' },
            { name: 'Admin Designs', href: '/previews/admin-designs', description: 'Admin design variants.' },
            { name: 'Admin Reference Designs', href: '/previews/admin-reference', description: 'Admin reference layout study.' },
            { name: 'Authorization Designs', href: '/previews/authorization-designs', description: 'Role/authorization screen treatments.' },
            { name: 'Queue Designs', href: '/previews/queue-designs', description: 'TV queue display redesign variants.', variants: '?design=1..10' },
        ],
    },
];

export default function DesignIndex() {
    return (
        <main className="di-page">
            <Head title="UCIMS · Design review index" />
            <header className="di-head">
                <span className="di-badge" aria-hidden="true">
                    <LayoutGrid size={18} />
                </span>
                <div>
                    <h1>UCIMS Design Review Index</h1>
                    <p>Every local preview in one place. Local-only — none of these routes ship to production.</p>
                </div>
            </header>

            {groups.map((group) => (
                <section key={group.title} className="di-group" aria-label={group.title}>
                    <h2>{group.title}</h2>
                    <div className="di-grid">
                        {group.items.map((item) => (
                            <a key={item.href} className="di-card" href={item.href}>
                                <span className="di-card-name">{item.name}</span>
                                <span className="di-card-desc">{item.description}</span>
                                {item.variants && <span className="di-card-variants">{item.variants}</span>}
                                <span className="di-card-go" aria-hidden="true">
                                    Open preview <ArrowRight size={13} />
                                </span>
                            </a>
                        ))}
                    </div>
                </section>
            ))}

            <style>{`
                .di-page {
                    min-height: 100svh;
                    background: #f7f5f2;
                    color: #1f1718;
                    font-family: 'Instrument Sans', ui-sans-serif, system-ui, -apple-system, sans-serif;
                    padding: 40px clamp(20px, 4vw, 56px) 80px;
                }
                .di-head {
                    display: flex;
                    align-items: center;
                    gap: 18px;
                    max-width: 1120px;
                    margin: 0 auto 34px;
                }
                .di-badge {
                    display: grid;
                    place-items: center;
                    width: 46px;
                    height: 46px;
                    border-radius: 12px;
                    background: #6b0f15;
                    color: #e8be5d;
                    flex-shrink: 0;
                }
                .di-head h1 {
                    font-size: clamp(24px, 3vw, 32px);
                    font-weight: 700;
                    letter-spacing: -0.03em;
                    color: #4e0a10;
                }
                .di-head p {
                    margin-top: 4px;
                    font-size: 13px;
                    color: #6c625f;
                }
                .di-group {
                    max-width: 1120px;
                    margin: 0 auto 30px;
                }
                .di-group h2 {
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.18em;
                    text-transform: uppercase;
                    color: #a08d80;
                    margin-bottom: 12px;
                    padding-left: 4px;
                }
                .di-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 14px;
                }
                .di-card {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    padding: 18px 18px 44px;
                    border-radius: 14px;
                    border: 1px solid #e7e0d8;
                    background: #fff;
                    text-decoration: none;
                    color: inherit;
                    transition: border-color 0.18s, transform 0.18s, box-shadow 0.18s;
                }
                .di-card:hover {
                    border-color: #6b0f15;
                    transform: translateY(-2px);
                    box-shadow: 0 12px 28px rgb(45 8 12 / 0.12);
                }
                .di-card:focus-visible {
                    outline: 3px solid #c9982e;
                    outline-offset: 3px;
                }
                .di-card-name {
                    font-size: 15px;
                    font-weight: 700;
                    letter-spacing: -0.01em;
                    color: #4e0a10;
                }
                .di-card-desc {
                    font-size: 12.5px;
                    line-height: 1.6;
                    color: #6c625f;
                }
                .di-card-variants {
                    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                    font-size: 10.5px;
                    color: #8a7d74;
                    background: #f3efe9;
                    border-radius: 6px;
                    padding: 3px 8px;
                    width: fit-content;
                }
                .di-card-go {
                    position: absolute;
                    left: 18px;
                    bottom: 14px;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    color: #6b0f15;
                }
            `}</style>
        </main>
    );
}
