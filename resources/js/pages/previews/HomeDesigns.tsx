import { Head, Link } from '@inertiajs/react';
import { ArrowDown, ArrowRight, ArrowUpRight, CalendarCheck, FileCheck2, HeartPulse, Monitor, Pill, UserPlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

const choices = [
    { name: 'University Standard', detail: 'A formal centered introduction, clear actions, and a balanced service grid.', title: <>University Clinic<br />Information Management System</> },
    { name: 'Care Gateway', detail: 'A split introduction with direct access to the three most useful tasks.', title: <>Your university clinic.<br />One place to start.</> },
    { name: 'Campus Journal', detail: 'An editorial layout with a concise introduction and a service directory.', title: <>Connected care.<br />For our community.</> },
    { name: 'Maroon Signature', detail: 'A maroon identity bar, bright welcoming introduction, and a strong About section.', title: <>University care,<br />thoughtfully connected.</> },
    { name: 'Community First', detail: 'A people-led introduction placing the project team beside the system’s purpose.', title: <>Built for USeP.<br />Built around care.</> },
    { name: 'Clinic Concierge', detail: 'A compact introduction beside a maroon action panel, with services arranged as a directory.', title: <>Welcome to your<br />university clinic.</> },
    { name: 'University Prospectus', detail: 'A formal serif masthead and a wide team photograph, followed by a spacious two-column service layout.', title: <>Care for our<br />university community.</> },
    { name: 'Service First', detail: 'A concise maroon introduction brings clinic services into view sooner, with a quieter About section.', title: <>University healthcare.<br />Clearly connected.</> },
    { name: 'Campus Frame', detail: 'An inset maroon welcome panel, carefully framed content, and a compact horizontal service directory.', title: <>Your care.<br />Your campus.</> },
    { name: 'Community Spotlight', detail: 'A large team photograph leads the introduction, paired with clear account actions and a maroon About section.', title: <>People at the heart<br />of university care.</> },
];
const services = [
    { title: 'Check-up', Icon: HeartPulse, text: 'Medical consultations and physical examinations for students and university personnel.' },
    { title: 'Medicine request', Icon: Pill, text: 'Request available medicines for minor illnesses and health conditions.' },
    { title: 'Follow-up consultation', Icon: CalendarCheck, text: 'Review treatment progress and monitor ongoing health conditions.' },
    { title: 'Medical certificate', Icon: FileCheck2, text: 'Request documentation for school, employment, OJT, and return to school or work.' },
];
function Actions() {
    return <div className="hp-actions"><Button asChild size="lg"><Link href="/login">Login <ArrowRight aria-hidden="true" /></Link></Button><Button asChild variant="outline" size="lg"><Link href="/register">Register <UserPlus aria-hidden="true" /></Link></Button></div>;
}
function TaskCard() {
    return <Card className="hp-task-card"><CardHeader><CardTitle>Your next step</CardTitle><CardDescription>Choose how you want to connect with the clinic.</CardDescription></CardHeader><CardContent className="flex flex-col gap-3"><Button asChild size="lg"><Link href="/login">Login with your Clinic ID <ArrowRight aria-hidden="true" /></Link></Button><Button asChild variant="outline" size="lg"><Link href="/register">Create your account <UserPlus aria-hidden="true" /></Link></Button><Separator /><Button asChild variant="ghost" size="lg"><Link href="/tv-queue">View the live queue <Monitor aria-hidden="true" /></Link></Button></CardContent><CardFooter><p>For students and university personnel.</p></CardFooter></Card>;
}
export default function HomeDesigns({ initialDesign = 1 }: { initialDesign?: number }) {
    const [design, setDesign] = useState(Math.min(choices.length, Math.max(1, initialDesign)));
    const root = useRef<HTMLDivElement>(null);
    const choice = choices[design - 1];
    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const observer = new IntersectionObserver(entries => entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)' });
            observer.unobserve(entry.target);
        }), { threshold: .12 });
        root.current?.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, [design]);
    function select(value: string) {
        if (!value) return;
        const next = Number(value);
        setDesign(next);
        window.history.replaceState(null, '', `/previews/home-designs?design=${next}`);
        window.scrollTo({ top: 0, behavior: 'instant' });
    }
    return <div ref={root} className={cn('hp', `hp-design-${design}`)}>
        <Head title={`UCIMS · ${choice.name}`} />
        <a className="hp-skip" href="#hp-main">Skip to content</a>
        <aside className="hp-preview" aria-label="Design comparison"><div className="hp-container"><div className="hp-preview-heading"><strong>Homepage design studio</strong><span>Preview only · shadcn/ui</span></div><ToggleGroup type="single" value={String(design)} onValueChange={select} aria-label="Choose a homepage design" className="flex-wrap justify-start gap-2">{choices.map((item, i) => <ToggleGroupItem key={item.name} value={String(i + 1)} aria-label={`Design ${i + 1}: ${item.name}`}>{i + 1}. {item.name}</ToggleGroupItem>)}</ToggleGroup><p aria-live="polite">{choice.detail}</p></div></aside>
        <header className="hp-header"><div className="hp-container hp-header-inner"><Link href="/" className="hp-brand" aria-label="USeP home"><img src="/assets/img/University of Southeastern Philippines Seal.png" width="72" height="72" alt="" /><span>University of<br />Southeastern Philippines<small>University Clinic</small></span></Link><nav aria-label="Main navigation"><a href="#hp-services">Services</a><a href="#hp-about">About</a><a href="#hp-contact">Contact</a><Button asChild variant="outline"><Link href="/tv-queue"><Monitor aria-hidden="true" />Live queue</Link></Button></nav></div></header>
        <main id="hp-main" key={design}>
            <section className="hp-hero"><div className="hp-container hp-hero-grid"><div className="hp-hero-copy" data-reveal><p className="hp-identity">University of Southeastern Philippines · UCIMS</p><h1>{choice.title}</h1><p className="hp-hero-summary">A central place for clinic visits, patient records, consultations, and health documentation.</p>{![2, 6].includes(design) && <Actions />}<a href="#hp-services" className="hp-explore">Explore clinic services <ArrowDown aria-hidden="true" size={16} /></a></div>{[2, 6].includes(design) && <div className="hp-task-zone" data-reveal><TaskCard /></div>}{[5, 7, 10].includes(design) && <figure className="hp-hero-photo" data-reveal><img src="/assets/img/team.jpg" width="640" height="480" alt="UCIMS project team at the university clinic" /><figcaption>The people behind the UCIMS project.</figcaption></figure>}</div><svg className="hp-hero-trace" viewBox="0 0 1200 95" preserveAspectRatio="none" aria-hidden="true"><path pathLength="100" d="M0 58H650l25-20 22 38 30-66 35 78 25-40 24 10H1200" /></svg></section>
            <div className="hp-container hp-context"><strong>University healthcare, connected.</strong><span>For students and university personnel</span><a href="/tv-queue">Open live queue <ArrowUpRight size={15} aria-hidden="true" /></a></div>
            <section className="hp-container hp-section" id="hp-services"><div className="hp-section-heading" data-reveal><div><p className="hp-section-label">Clinic services</p><h2>Care for your everyday needs.</h2></div><p>Explore the services available through the USeP University Clinic.</p></div><div className="hp-services">{services.map(({ title, Icon, text }) => <Card key={title} className="hp-service" data-reveal><CardHeader><span className="hp-icon"><Icon size={23} aria-hidden="true" /></span><CardTitle><h3>{title}</h3></CardTitle></CardHeader><CardContent><p>{text}</p></CardContent></Card>)}</div></section>
            <section id="hp-about" className="hp-about"><div className="hp-container hp-section hp-about-grid"><div data-reveal><p className="hp-section-label">About the system</p><h2>One platform.<br />A more connected clinic.</h2><p>UCIMS is a centralized digital registry developed for the healthcare services of the University of Southeastern Philippines.</p><p>It brings patient registration, consultation documentation, medical history, and certificate processing together in one platform.</p><div className="hp-purpose"><h3>Our purpose</h3><p>Support quality university healthcare through clearer workflows, accurate records, and access based on each user’s role.</p></div></div><figure data-reveal><img src="/assets/img/team.jpg" width="640" height="480" alt="UCIMS research team" loading="lazy" /><figcaption>UCIMS project team · University of Southeastern Philippines</figcaption></figure></div></section>
            <section id="hp-contact" className="hp-container hp-section hp-contact"><div data-reveal><p className="hp-section-label">University channels</p><h2>Stay connected with USeP.</h2><p>Find university updates and general inquiries through these official channels.</p></div><Card data-reveal><CardHeader><CardTitle>Connect with the university</CardTitle><CardDescription>Official USeP channels</CardDescription></CardHeader><CardContent className="flex flex-col gap-2"><Button asChild variant="ghost" className="justify-between"><a href="https://www.facebook.com/USePofficial" target="_blank" rel="noopener noreferrer">Facebook · @USePofficial <ArrowUpRight aria-hidden="true" /></a></Button><Separator /><Button asChild variant="ghost" className="justify-between"><a href="https://www.instagram.com/usepofficial/" target="_blank" rel="noopener noreferrer">Instagram · @usepofficial <ArrowUpRight aria-hidden="true" /></a></Button><Separator /><Button asChild variant="ghost" className="justify-between"><a href="mailto:pad@usep.edu.ph">pad@usep.edu.ph <ArrowUpRight aria-hidden="true" /></a></Button></CardContent></Card></section>
            <section className="hp-closing"><div className="hp-container"><div><h2>Access your clinic account.</h2><p>Your connection to university care starts here.</p></div><Actions /></div></section>
        </main><footer className="hp-container hp-footer"><span>© 2026 University of Southeastern Philippines</span><span>University Clinic Information Management System</span></footer>
    </div>;
}

