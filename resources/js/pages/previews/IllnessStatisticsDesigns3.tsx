import { Head } from '@inertiajs/react';
import {
    Activity,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    CircleAlert,
    ClipboardList,
    HeartPulse,
    Search,
    Sparkles,
} from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import {
    Progress,
} from '@/components/ui/progress';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

/*
 * Illness Statistics — round 3, three designs built with shadcn/ui primitives.
 *
 *  10 Clinical Summary  — KPI cards + "top conditions" progress list + compact register
 *  11 Registry Ledger   — sortable data table first, filters and search folded into the header
 *  12 Insights Brief    — tabbed narrative: Snapshot / Conditions / Method
 *
 * Preview only. Nothing is wired into Admin/Analytics.jsx yet.
 * All three reuse the clinic's data pipeline shape (completed visits).
 */

type Mode = 'word' | 'code';

type Illness = {
    name: string;
    code: string;
    cases: number;
    chapter: string;
};

const MONTHS = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];

const FEW: Illness[] = [
    { name: 'Acute upper respiratory infection, unspecified', code: 'J06.9', cases: 1, chapter: 'Respiratory' },
    { name: 'Cough', code: 'R05', cases: 1, chapter: 'Symptoms' },
];

const TYPICAL: Illness[] = [
    { name: 'Acute upper respiratory infection, unspecified', code: 'J06.9', cases: 14, chapter: 'Respiratory' },
    { name: 'Acute nasopharyngitis [common cold]', code: 'J00', cases: 11, chapter: 'Respiratory' },
    { name: 'Acute pharyngitis, unspecified', code: 'J02.9', cases: 8, chapter: 'Respiratory' },
    { name: 'Fever, unspecified', code: 'R50.9', cases: 7, chapter: 'Symptoms' },
    { name: 'Headache', code: 'R51', cases: 6, chapter: 'Symptoms' },
    { name: 'Gastritis, unspecified, without bleeding', code: 'K29.70', cases: 5, chapter: 'Digestive' },
    { name: 'Essential (primary) hypertension', code: 'I10', cases: 4, chapter: 'Circulatory' },
    { name: 'Cough', code: 'R05', cases: 3, chapter: 'Symptoms' },
];

const MANY: Illness[] = [
    ...TYPICAL,
    { name: 'Dengue fever [classical dengue]', code: 'A90', cases: 3, chapter: 'Infectious' },
    { name: 'Typhoid fever', code: 'A01.0', cases: 3, chapter: 'Infectious' },
    { name: 'Allergic rhinitis due to pollen', code: 'J30.1', cases: 3, chapter: 'Respiratory' },
    { name: 'Acute bronchitis, unspecified', code: 'J20.9', cases: 2, chapter: 'Respiratory' },
    { name: 'Urinary tract infection, site not specified', code: 'N39.0', cases: 2, chapter: 'Genitourinary' },
    { name: 'Myalgia', code: 'M79.1', cases: 2, chapter: 'Musculoskeletal' },
    { name: 'Dermatitis, unspecified', code: 'L30.9', cases: 2, chapter: 'Skin' },
    { name: 'Constipation, unspecified', code: 'K59.00', cases: 2, chapter: 'Digestive' },
    { name: 'Migraine, unspecified', code: 'G43.9', cases: 1, chapter: 'Nervous' },
    { name: 'Conjunctivitis, unspecified', code: 'H10.9', cases: 1, chapter: 'Eye / ear' },
];

const SETS: Record<'few' | 'typical' | 'many', Illness[]> = { few: FEW, typical: TYPICAL, many: MANY };

const MONTH_WEIGHTS = [0.55, 1.15, 0.8, 1.35, 0.85, 1.2];

function monthValue(row: Illness, index: number): number {
    if (!row.cases) return 0;
    const weight = MONTH_WEIGHTS[(index + row.code.length) % MONTH_WEIGHTS.length];
    return Math.max(0, Math.round((row.cases / MONTHS.length) * weight));
}

function monthTotals(rows: Illness[]): number[] {
    return MONTHS.map((_, index) => rows.reduce((sum, row) => sum + monthValue(row, index), 0));
}

function sumCases(rows: Illness[]): number {
    return rows.reduce((total, row) => total + row.cases, 0);
}

function share(cases: number, total: number): number {
    return total ? Math.round((cases / total) * 1000) / 10 : 0;
}

function normalizeCode(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function filterRows(rows: Illness[], mode: Mode, query: string): Illness[] {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;

    return rows.filter((row) =>
        mode === 'code'
            ? normalizeCode(row.code).includes(normalizeCode(needle))
            : row.name.toLowerCase().includes(needle),
    );
}

function useSearch(rows: Illness[]) {
    const [mode, setMode] = useState<Mode>('word');
    const [q, setQ] = useState('');
    const deferredQ = useDeferredValue(q);
    const filtered = useMemo(() => filterRows(rows, mode, deferredQ), [rows, mode, deferredQ]);

    return {
        mode,
        setMode: (value: string | string[]) => setMode((Array.isArray(value) ? value[0] : value) as Mode),
        q,
        setQ,
        filtered,
    };
}

function SearchControls({
    mode,
    setMode,
    q,
    setQ,
    placeholderCode = 'J06.9',
}: {
    mode: Mode;
    setMode: (value: string | string[]) => void;
    q: string;
    setQ: (value: string) => void;
    placeholderCode?: string;
}) {
    return (
        <div className="sds3-controls">
            <ToggleGroup
                type="single"
                value={mode}
                onValueChange={setMode}
                variant="outline"
                size="sm"
                aria-label="Search illnesses by"
                className="shadow-none"
            >
                <ToggleGroupItem value="word" aria-label="Search by disease or condition">Word</ToggleGroupItem>
                <ToggleGroupItem value="code" aria-label="Search by ICD-10 code">ICD-10</ToggleGroupItem>
            </ToggleGroup>
            <div className="relative min-w-0 flex-1 sm:min-w-64">
                <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="search"
                    value={q}
                    onChange={(event) => setQ(event.target.value)}
                    placeholder={mode === 'code' ? `Code, e.g. ${placeholderCode}` : 'Condition, e.g. cough'}
                    aria-label={mode === 'code' ? 'Search by ICD-10 code' : 'Search by disease or condition'}
                    className="pl-9"
                />
            </div>
        </div>
    );
}

function ShareBar({ value, max }: { value: number; max: number }) {
    return <Progress value={max ? Math.max(4, (value / max) * 100) : 0} className="h-1.5 w-full" aria-hidden="true" />;
}

function NoResults({ onClear }: { onClear: () => void }) {
    return (
        <Empty className="border">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <Search aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>No condition matches</EmptyTitle>
                <EmptyDescription>
                    Try a broader keyword, or search by ICD-10 code instead (e.g. J06.9).
                </EmptyDescription>
            </EmptyHeader>
            <Button variant="outline" size="sm" onClick={onClear}>
                Clear search
            </Button>
        </Empty>
    );
}

// ─────────────────────────────────────────────────────────────
// 10 — Clinical Summary
// ─────────────────────────────────────────────────────────────

function Design10({ rows }: { rows: Illness[] }) {
    const { mode, setMode, q, setQ, filtered } = useSearch(rows);
    const total = sumCases(filtered);
    const max = filtered[0]?.cases ?? 1;
    const leader = filtered[0];
    const peakMonth = monthTotals(filtered).indexOf(Math.max(...monthTotals(filtered), 0));

    return (
        <Card className="gap-0 overflow-hidden p-0">
            <CardHeader className="gap-4 border-b bg-muted/30 px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            Illness statistics
                        </span>
                        <CardTitle className="text-xl">Clinical summary</CardTitle>
                        <CardDescription>Completed visits · Jun–Nov 2026</CardDescription>
                    </div>
                    <SearchControls mode={mode} setMode={setMode} q={q} setQ={setQ} />
                </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-4 px-6 py-5">
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <Card className="gap-1 p-4 shadow-none">
                        <span className="text-xs text-muted-foreground">Diagnoses</span>
                        <span className="text-3xl font-semibold tabular-nums">{total}</span>
                    </Card>
                    <Card className="gap-1 p-4 shadow-none">
                        <span className="text-xs text-muted-foreground">Unique conditions</span>
                        <span className="text-3xl font-semibold tabular-nums">{filtered.length}</span>
                    </Card>
                    <Card className="gap-1 p-4 shadow-none">
                        <span className="text-xs text-muted-foreground">Most common</span>
                        <span className="truncate text-sm font-semibold" title={leader?.name}>
                            {leader?.name ?? '—'}
                        </span>
                        {leader && <Badge variant="secondary" className="w-fit">{leader.code}</Badge>}
                    </Card>
                    <Card className="gap-1 p-4 shadow-none">
                        <span className="text-xs text-muted-foreground">Peak month</span>
                        <span className="text-3xl font-semibold">{filtered.length ? MONTHS[peakMonth] : '—'}</span>
                        <span className="text-xs text-muted-foreground">most diagnoses recorded</span>
                    </Card>
                </div>

                <div className="grid min-w-0 gap-4 lg:grid-cols-5">
                    <Card className="min-w-0 gap-3 p-4 shadow-none lg:col-span-2">
                        <div className="flex items-center justify-between gap-2">
                            <CardTitle className="text-sm">Top conditions</CardTitle>
                            <Badge variant="secondary">{Math.min(5, filtered.length)} shown</Badge>
                        </div>
                        <div className="grid gap-3">
                            {filtered.slice(0, 5).map((row) => (
                                <div key={`${row.code}-${row.name}`} className="grid min-w-0 gap-1">
                                    <div className="flex items-baseline justify-between gap-2 text-sm">
                                        <span className="truncate font-medium" title={row.name}>{row.name}</span>
                                        <span className="tabular-nums text-muted-foreground">{row.cases}</span>
                                    </div>
                                    <ShareBar value={row.cases} max={max} />
                                </div>
                            ))}
                            {!filtered.length && <p className="text-sm text-muted-foreground">Nothing to show.</p>}
                        </div>
                    </Card>

                    <Card className="min-w-0 gap-3 overflow-hidden p-0 shadow-none lg:col-span-3">
                        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
                            <CardTitle className="text-sm">Register</CardTitle>
                            <Badge variant="secondary">{filtered.length} entries</Badge>
                        </div>
                        <div className="max-h-72 overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Condition</TableHead>
                                        <TableHead>ICD-10</TableHead>
                                        <TableHead className="text-right">Cases</TableHead>
                                        <TableHead>Share</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.slice(0, 8).map((row) => (
                                        <TableRow key={`${row.code}-${row.name}`}>
                                            <TableCell className="max-w-56 truncate font-medium" title={row.name}>
                                                {row.name}
                                            </TableCell>
                                            <TableCell><Badge variant="outline">{row.code || '—'}</Badge></TableCell>
                                            <TableCell className="text-right tabular-nums">{row.cases}</TableCell>
                                            <TableCell className="w-28"><ShareBar value={row.cases} max={max} /></TableCell>
                                        </TableRow>
                                    ))}
                                    {!filtered.length && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="p-0">
                                                <NoResults onClear={() => setQ('')} />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </div>
            </CardContent>
        </Card>
    );
}

// ─────────────────────────────────────────────────────────────
// 11 — Registry Ledger
// ─────────────────────────────────────────────────────────────

type SortKey = 'name' | 'cases' | 'share';

function Design11({ rows }: { rows: Illness[] }) {
    const { mode, setMode, q, setQ, filtered } = useSearch(rows);
    const total = sumCases(filtered);
    const max = filtered[0]?.cases ?? 1;
    const [sort, setSort] = useState<SortKey>('cases');
    const [dir, setDir] = useState<'asc' | 'desc'>('desc');
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const sorted = useMemo(() => {
        const next = [...filtered];
        next.sort((a, b) => {
            const diff = sort === 'name'
                ? a.name.localeCompare(b.name)
                : sort === 'cases'
                    ? a.cases - b.cases
                    : share(a.cases, total) - share(b.cases, total);
            return dir === 'asc' ? diff : -diff;
        });

        return next;
    }, [filtered, sort, dir, total]);

    const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const current = Math.min(page, pages);
    const pageRows = sorted.slice((current - 1) * pageSize, current * pageSize);

    function toggleSort(key: SortKey) {
        if (sort === key) {
            setDir((value) => (value === 'asc' ? 'desc' : 'asc'));
        } else {
            setSort(key);
            setDir('desc');
        }
    }

    return (
        <Card className="gap-0 overflow-hidden p-0">
            <CardHeader className="gap-4 border-b px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <ClipboardList aria-hidden="true" className="size-4 text-muted-foreground" />
                            <CardTitle className="text-base">Illness register</CardTitle>
                            <Badge variant="secondary">{filtered.length} conditions · {total} diagnoses</Badge>
                        </div>
                        <CardDescription>
                            One row per recorded condition. Sort by cases or share; search by word or ICD-10.
                        </CardDescription>
                    </div>
                    <SearchControls mode={mode} setMode={setMode} q={q} setQ={setQ} />
                </div>
            </CardHeader>

            <div className="max-h-[30rem] overflow-auto">
                <Table>
                    <TableHeader className="sticky top-0 z-10 bg-card">
                        <TableRow>
                            <TableHead>
                                <button type="button" className="sds3-sort" onClick={() => toggleSort('name')}>
                                    Condition <ArrowUpDown aria-hidden="true" className="size-3.5 text-muted-foreground" />
                                </button>
                            </TableHead>
                            <TableHead>ICD-10</TableHead>
                            <TableHead className="text-right">
                                <button type="button" className="sds3-sort ml-auto" onClick={() => toggleSort('cases')}>
                                    Cases <ArrowUpDown aria-hidden="true" className="size-3.5 text-muted-foreground" />
                                </button>
                            </TableHead>
                            <TableHead className="w-64">
                                <button type="button" className="sds3-sort" onClick={() => toggleSort('share')}>
                                    Share <ArrowUpDown aria-hidden="true" className="size-3.5 text-muted-foreground" />
                                </button>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pageRows.map((row) => (
                            <TableRow key={`${row.code}-${row.name}`}>
                                <TableCell className="max-w-md truncate font-medium" title={row.name}>
                                    {row.name}
                                </TableCell>
                                <TableCell><Badge variant="outline">{row.code || '—'}</Badge></TableCell>
                                <TableCell className="text-right text-base font-semibold tabular-nums">{row.cases}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Progress value={max ? (row.cases / max) * 100 : 0} className="h-1.5 w-full" />
                                        <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">
                                            {share(row.cases, total)}%
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!pageRows.length && (
                            <TableRow>
                                <TableCell colSpan={4} className="p-6">
                                    <NoResults onClear={() => setQ('')} />
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <CardFooter className="justify-between gap-4 border-t py-3">
                <p className="text-xs text-muted-foreground">
                    Showing {pageRows.length ? (current - 1) * pageSize + 1 : 0}–{Math.min(current * pageSize, sorted.length)} of {sorted.length}
                </p>
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" onClick={() => setPage(current - 1)} disabled={current <= 1} aria-label="Previous page">
                        <ChevronLeft />
                    </Button>
                    <span className="px-2 text-xs tabular-nums text-muted-foreground">
                        Page {String(current).padStart(2, '0')} / {String(pages).padStart(2, '0')}
                    </span>
                    <Button variant="outline" size="icon" onClick={() => setPage(current + 1)} disabled={current >= pages} aria-label="Next page">
                        <ChevronRight />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}

// ─────────────────────────────────────────────────────────────
// 12 — Insights Brief
// ─────────────────────────────────────────────────────────────

function Design12({ rows }: { rows: Illness[] }) {
    const { mode, setMode, q, setQ, filtered } = useSearch(rows);
    const total = sumCases(filtered);
    const max = filtered[0]?.cases ?? 1;
    const leader = filtered[0];
    const monthly = monthTotals(filtered);
    const peakMonth = monthly.indexOf(Math.max(...monthly, 0));

    return (
        <Card className="gap-0 overflow-hidden p-0">
            <CardHeader className="gap-4 border-b bg-muted/30 px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            <Sparkles aria-hidden="true" className="size-3.5" /> Illness statistics · Insights brief
                        </span>
                        <CardTitle className="text-xl">What the numbers say</CardTitle>
                        <CardDescription>A short narrative for the monthly report, generated from the same completed visits.</CardDescription>
                    </div>
                    <SearchControls mode={mode} setMode={setMode} q={q} setQ={setQ} />
                </div>
            </CardHeader>

            <Tabs defaultValue="snapshot" className="gap-0">
                <div className="border-b px-6 pt-4">
                    <TabsList aria-label="Insights sections">
                        <TabsTrigger value="snapshot">Snapshot</TabsTrigger>
                        <TabsTrigger value="conditions">Conditions</TabsTrigger>
                        <TabsTrigger value="method">Method &amp; data</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="snapshot" className="px-6 py-5">
                    <div className="grid gap-4">
                        <Alert>
                            <HeartPulse aria-hidden="true" />
                            <AlertTitle>
                                {leader ? `${leader.name} leads this period with ${leader.cases} cases.` : 'No diagnoses recorded yet.'}
                            </AlertTitle>
                            <AlertDescription>
                                {filtered.length
                                    ? `${leader?.code}. Peak month: ${MONTHS[peakMonth]} (${Math.max(...monthly)} diagnoses). Share of all filtered cases: ${share(leader?.cases ?? 0, total)}%.`
                                    : 'Once completed visits carry a diagnosis, the leading condition appears here automatically.'}
                            </AlertDescription>
                        </Alert>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <Card className="gap-1 p-4 shadow-none">
                                <span className="text-xs text-muted-foreground">Diagnoses</span>
                                <span className="text-2xl font-semibold tabular-nums">{total}</span>
                            </Card>
                            <Card className="gap-1 p-4 shadow-none">
                                <span className="text-xs text-muted-foreground">Conditions tracked</span>
                                <span className="text-2xl font-semibold tabular-nums">{filtered.length}</span>
                            </Card>
                            <Card className="gap-1 p-4 shadow-none">
                                <span className="text-xs text-muted-foreground">Busiest month</span>
                                <span className="text-2xl font-semibold">{filtered.length ? MONTHS[peakMonth] : '—'}</span>
                            </Card>
                        </div>

                        <Card className="gap-3 p-4 shadow-none">
                            <CardTitle className="text-sm">Monthly load</CardTitle>
                            <div className="flex h-36 items-end gap-2 border-b pb-1">
                                {monthly.map((value, index) => {
                                    const maxMonth = Math.max(...monthly, 1);

                                    return (
                                        <div key={MONTHS[index]} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                                            <span className="text-xs font-medium tabular-nums text-muted-foreground">{value}</span>
                                            <div
                                                className="sds3-col"
                                                style={{ height: `${Math.max(6, (value / maxMonth) * 100)}%` }}
                                                role="img"
                                                aria-label={`${MONTHS[index]}: ${value} diagnoses`}
                                            />
                                            <span className="text-[0.65rem] uppercase text-muted-foreground">{MONTHS[index]}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="conditions" className="px-0 py-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Condition</TableHead>
                                <TableHead>ICD-10</TableHead>
                                <TableHead className="text-right">Cases</TableHead>
                                <TableHead className="pr-6 text-right">Share</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.slice(0, 8).map((row) => (
                                <TableRow key={`${row.code}-${row.name}`}>
                                    <TableCell className="max-w-md pl-6">
                                        <div className="grid min-w-0 gap-1">
                                            <span className="truncate font-medium" title={row.name}>{row.name}</span>
                                            <ShareBar value={row.cases} max={max} />
                                        </div>
                                    </TableCell>
                                    <TableCell><Badge variant="outline">{row.code || '—'}</Badge></TableCell>
                                    <TableCell className="text-right tabular-nums">{row.cases}</TableCell>
                                    <TableCell className="pr-6 text-right text-xs tabular-nums text-muted-foreground">
                                        {share(row.cases, total)}%
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!filtered.length && (
                                <TableRow>
                                    <TableCell colSpan={4} className="p-6">
                                        <NoResults onClear={() => setQ('')} />
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TabsContent>

                <TabsContent value="method" className="px-6 py-5">
                    <div className="grid max-w-3xl gap-4 text-sm leading-6 text-muted-foreground">
                        <p>
                            Figures count one diagnosis per completed consultation. Monthly spreads are derived from each visit's
                            recorded date, grouped by calendar month.
                        </p>
                        <ul className="grid list-disc gap-2 pl-5">
                            <li>Both word search ("cough") and ICD-10 code search ("J06.9", "j06 9") are supported; matching ignores case, spaces and punctuation.</li>
                            <li>Share percentages are computed against the currently filtered set, so numbers change as the clinic narrows the search.</li>
                            <li>Preview figures use a deterministic sample distribution; the live build reads the same visit dates already loaded by Reports.</li>
                        </ul>
                        <Alert variant="default" className="border-dashed">
                            <Activity aria-hidden="true" />
                            <AlertTitle>Before this goes to the classmate's DB</AlertTitle>
                            <AlertDescription>
                                Confirm the visit-completed filter and the ICD-10 deduplication rule so diagnoses recorded twice for the
                                same consultation aren't double-counted.
                            </AlertDescription>
                        </Alert>
                    </div>
                </TabsContent>
            </Tabs>
        </Card>
    );
}

// ─────────────────────────────────────────────────────────────
// Page shell
// ─────────────────────────────────────────────────────────────

const DESIGNS = [
    {
        n: 10,
        name: 'Clinical Summary',
        best: 'Ward rounds, monthly debriefs',
        detail: 'KPI tiles, a top-conditions progress list and a compact register on one Card — the fastest read of the three. Search and ICD-10 toggle live in the header.',
        Component: Design10,
    },
    {
        n: 11,
        name: 'Registry Ledger',
        best: 'Audit, print, weekly reporting',
        detail: 'A single sortable, sticky-header table with badges for ICD codes, empty-state handling and pagination — the densest view for people who really want the register.',
        Component: Design11,
    },
    {
        n: 12,
        name: 'Insights Brief',
        best: 'Storytelling, review meetings',
        detail: 'A tabbed narrative card: snapshot with callout and monthly load chart, the conditions table, and a method tab explaining data sources and caveats.',
        Component: Design12,
    },
];

export default function IllnessStatisticsDesigns3() {
    const [dataKey, setDataKey] = useState<'few' | 'typical' | 'many'>('typical');

    const rows = useMemo(
        () => [...SETS[dataKey]].sort((a, b) => b.cases - a.cases || a.name.localeCompare(b.name)),
        [dataKey],
    );

    return (
        <>
            <Head title="Illness statistics — round 3" />

            <div className="sds3-scope sds3-page">
                <header className="sds3-top">
                    <div>
                        <span className="sds3-kicker">Admin · Reports · round 3</span>
                        <h1>Three shadcn builds</h1>
                        <p>
                            Composed from the project's shadcn/ui components (Card, Table, Tabs, Progress, ToggleGroup, Empty, Alert…)
                            with the default neutral theme and a maroon accent scoped to this page.{' '}
                            Nothing is wired into <code>Admin/Analytics.jsx</code> yet; the first nine directions live at{' '}
                            <a href="/previews/illness-statistics">/previews/illness-statistics</a> and{' '}
                            <a href="/previews/illness-statistics-2">/previews/illness-statistics-2</a>.
                        </p>
                    </div>

                    <div className="sds3-top-controls">
                        <span className="sds3-kicker">Sample data</span>
                        <ToggleGroup
                            type="single"
                            value={dataKey}
                            onValueChange={(value: string | string[]) =>
                                setDataKey((Array.isArray(value) ? value[0] : value) as 'few' | 'typical' | 'many')
                            }
                            variant="outline"
                            size="sm"
                            aria-label="Sample data set"
                        >
                            <ToggleGroupItem value="few">Few · 2</ToggleGroupItem>
                            <ToggleGroupItem value="typical">Typical · 8</ToggleGroupItem>
                            <ToggleGroupItem value="many">Many · 18</ToggleGroupItem>
                        </ToggleGroup>
                    </div>
                </header>

                <nav className="sds3-jump" aria-label="Jump to a design">
                    {DESIGNS.map((design) => (
                        <a key={design.n} href={`#design-${design.n}`} className="sds3-jump-link">
                            <b>{String(design.n).padStart(2, '0')}</b>
                            {design.name}
                        </a>
                    ))}
                </nav>

                {DESIGNS.map(({ n, name, best, detail, Component }) => (
                    <section key={n} id={`design-${n}`} className="sds3-section">
                        <div className="sds3-section-head">
                            <span className="sds3-section-num">{String(n).padStart(2, '0')}</span>
                            <div>
                                <h2>{name}</h2>
                                <p>{detail}</p>
                            </div>
                            <span className="sds3-best"><b>Best for</b> {best}</span>
                        </div>
                        <Component rows={rows} />
                    </section>
                ))}

                <footer className="sds3-footer">
                    <p>
                        <CircleAlert aria-hidden="true" className="inline size-4 align-[-2px]" /> Monthly splits are deterministic sample data for the preview;
                        production will use the visit dates already loaded by Reports. Pick a number (10, 11 or 12 — or a blend) and I'll port it in.
                    </p>
                </footer>
            </div>
        </>
    );
}
