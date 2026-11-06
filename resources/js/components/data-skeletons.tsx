import { Skeleton } from '@/components/ui/skeleton';

export function DetailSkeleton({ fields = 6, label = 'Loading details' }: { fields?: number; label?: string }) {
 return <div className="data-skeleton ds-details" role="status" aria-label={label} aria-busy="true"><span className="sr-only">{label}</span><Skeleton className="h-5 w-2/5"/><div className="ds-field-grid">{Array.from({length:fields},(_,i)=><div key={i} className="ds-field"><Skeleton className="h-3 w-1/3"/><Skeleton className="h-10 w-full"/></div>)}</div><Skeleton className="h-4 w-3/4"/></div>;
}
export function ListSkeleton({ rows = 4, columns = 4, label = 'Loading records' }: { rows?: number; columns?: number; label?: string }) {
 return <div className="data-skeleton ds-list" role="status" aria-label={label} aria-busy="true"><span className="sr-only">{label}</span>{Array.from({length:rows},(_,i)=><div className="ds-row" style={{gridTemplateColumns:`repeat(${columns},minmax(0,1fr))`}} key={i}>{Array.from({length:columns},(_,j)=><Skeleton key={j} className={j===0?'h-4 w-3/5':'h-4 w-4/5'}/>)}</div>)}</div>;
}
export function TableSkeletonRows({ columns = 5, rows = 4 }: { columns?: number; rows?: number }) {
 return <>{Array.from({length:rows},(_,i)=><tr key={i} className="data-skeleton" aria-busy="true">{Array.from({length:columns},(_,j)=><td key={j} style={{padding:'18px 12px'}}>{i===0&&j===0&&<span role="status" className="sr-only">Loading records</span>}<Skeleton className="h-4 w-3/4"/></td>)}</tr>)}</>;
}
export function MetricSkeleton() { return <div className="data-skeleton" role="status" aria-label="Loading metric"><Skeleton className="h-10 w-24"/></div>; }
export function ChartSkeleton() { return <div className="data-skeleton ds-chart" role="status" aria-label="Loading chart data" aria-busy="true">{[45,70,55,85,65,95,75].map((height,i)=><Skeleton key={i} className="w-full" style={{height:`${height}%`}}/>)}</div>; }
export function ServingSkeleton() { return <div className="data-skeleton ds-serving" role="status" aria-label="Loading queue" aria-busy="true"><Skeleton className="h-28 w-48"/><Skeleton className="h-4 w-4/5"/><Skeleton className="h-6 w-24"/></div>; }
