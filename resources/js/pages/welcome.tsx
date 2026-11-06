import { Head, Link } from '@inertiajs/react';
import { ArrowDown, ArrowRight, ArrowUpRight, CalendarCheck, FileCheck2, HeartPulse, Monitor, Pill, UserPlus } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const services = [
    { title: 'Check-up', Icon: HeartPulse, text: 'Medical consultations and physical examinations for students and university personnel.' },
    { title: 'Medicine request', Icon: Pill, text: 'Request available medicines for minor illnesses and health conditions.' },
    { title: 'Follow-up consultation', Icon: CalendarCheck, text: 'Review treatment progress and monitor ongoing health conditions.' },
    { title: 'Medical certificate', Icon: FileCheck2, text: 'Request documentation for school, employment, OJT, and return to school or work.' },
];
function Actions() {
    return <div className="hp-actions"><Button asChild size="lg"><Link href="/login">Login <ArrowRight aria-hidden="true" /></Link></Button><Button asChild variant="outline" size="lg"><Link href="/register">Register <UserPlus aria-hidden="true" /></Link></Button></div>;
}
export default function Welcome() {
    const root = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const observer = new IntersectionObserver(entries => entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)' });
            observer.unobserve(entry.target);
        }), { threshold: .12 });
        root.current?.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, []);
    return <div ref={root} className="hp hp-design-3 hp-selected">
        <Head title="UCIMS · University Clinic" />
        <a className="hp-skip" href="#hp-main">Skip to content</a>
        <header className="hp-header"><div className="hp-container hp-header-inner"><Link href="/" className="hp-brand" aria-label="USeP home"><img src="/assets/img/University of Southeastern Philippines Seal.png" width="72" height="72" alt="" /><span>University of<br />Southeastern Philippines<small>University Clinic</small></span></Link><nav aria-label="Main navigation"><a href="#hp-services">Services</a><a href="#hp-about">About</a><a href="#hp-contact">Contact</a><Button asChild><Link href="/tv-queue"><Monitor aria-hidden="true" />Live queue</Link></Button></nav></div></header>
        <main id="hp-main">
            <section className="hp-hero"><div className="hp-container hp-hero-grid"><div className="hp-hero-copy" data-reveal><p className="hp-identity">University of Southeastern Philippines · UCIMS</p><h1>Connected care.<br />For our community.</h1><p className="hp-hero-summary">A central place for clinic visits, patient records, consultations, and health documentation.</p><Actions /><a href="#hp-services" className="hp-explore">Explore clinic services <ArrowDown aria-hidden="true" size={16} /></a></div></div><svg className="hp-hero-trace" viewBox="0 0 1200 95" preserveAspectRatio="none" aria-hidden="true"><path pathLength="100" d="M0 58H650l25-20 22 38 30-66 35 78 25-40 24 10H1200" /></svg></section>
            <section className="hp-container hp-section" id="hp-services"><div className="hp-section-heading" data-reveal><div><p className="hp-section-label">Clinic services</p><h2>Care for your everyday needs.</h2></div><p>Explore the services available through the USeP University Clinic.</p></div><div className="hp-services">{services.map(({ title, Icon, text }) => <Card key={title} className="hp-service" data-reveal><CardHeader><span className="hp-icon"><Icon size={23} aria-hidden="true" /></span><CardTitle><h3>{title}</h3></CardTitle></CardHeader><CardContent><p>{text}</p></CardContent></Card>)}</div></section>
            <section id="hp-about" className="hp-about"><div className="hp-container hp-section hp-about-grid"><div data-reveal><p className="hp-section-label">About the system</p><h2>One platform.<br />A more connected clinic.</h2><p>UCIMS is a centralized digital registry developed for the healthcare services of the University of Southeastern Philippines.</p><p>It brings patient registration, consultation documentation, medical history, and certificate processing together in one platform.</p><div className="hp-purpose"><h3>Our purpose</h3><p>Support quality university healthcare through clearer workflows, accurate records, and access based on each user’s role.</p></div></div><figure data-reveal><img src="/assets/img/team.jpg" width="640" height="480" alt="UCIMS research team" loading="lazy" /><figcaption>UCIMS project team · University of Southeastern Philippines</figcaption></figure></div></section>
            <section id="hp-contact" className="hp-container hp-section hp-contact"><div data-reveal><p className="hp-section-label">University channels</p><h2>Stay connected with USeP.</h2><p>Find university updates and general inquiries through these official channels.</p></div><Card data-reveal><CardHeader><CardTitle>Connect with the university</CardTitle><CardDescription>Official USeP channels</CardDescription></CardHeader><CardContent className="flex flex-col gap-2"><Button asChild variant="ghost" className="justify-between"><a href="https://www.facebook.com/USePofficial" target="_blank" rel="noopener noreferrer">Facebook · @USePofficial <ArrowUpRight aria-hidden="true" /></a></Button><Separator /><Button asChild variant="ghost" className="justify-between"><a href="https://www.instagram.com/usepofficial/" target="_blank" rel="noopener noreferrer">Instagram · @usepofficial <ArrowUpRight aria-hidden="true" /></a></Button><Separator /><Button asChild variant="ghost" className="justify-between"><a href="mailto:pad@usep.edu.ph">pad@usep.edu.ph <ArrowUpRight aria-hidden="true" /></a></Button></CardContent></Card></section>
            <section className="hp-closing"><div className="hp-container"><div><h2>Access your clinic account.</h2><p>Your connection to university care starts here.</p></div><Actions /></div></section>
        </main><footer className="hp-container hp-footer"><span>© 2026 University of Southeastern Philippines</span><span>University Clinic Information Management System</span></footer>
    </div>;
}

