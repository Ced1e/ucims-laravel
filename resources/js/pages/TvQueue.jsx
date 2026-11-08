import { ListSkeleton, ServingSkeleton } from '@/components/data-skeletons';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Monitor, Minimize, HeartPulse, Clock3, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const empty = { waiting: [], nurse: [], doctor: [], done: [] };
const number = value => String(value).padStart(3, '0');
function QueueList({ entries }) {
 const [page, setPage] = useState(0);
 const pages = Math.ceil(entries.length / 4);
 useEffect(() => { setPage(0); }, [entries.map(e => e.queueNumber).join(',')]);
 useEffect(() => { if(pages < 2) return; const id = setInterval(() => setPage(p => (p+1)%pages), 8000); return () => clearInterval(id); }, [pages]);
 return <><div className="q-wait-list">{entries.slice((page%Math.max(1,pages))*4,(page%Math.max(1,pages))*4+4).map(e => <div key={e.queueNumber}><strong>{number(e.queueNumber)}</strong></div>)}</div>{pages>1&&<p>Page {page+1} of {pages} · {entries.length} in total</p>}</>;
}
function Station({ title, entries, nurse, ready, loading }) {
 const serving = entries.filter(e => e.serving);
 const others = entries.filter(e => !e.serving);
 return <Card className={`q-station ${nurse?'q-nurse':'q-doctor'}`}><CardHeader><CardDescription><HeartPulse aria-hidden="true" />{title}</CardDescription><CardTitle>{!ready?(loading?'Loading…':'Unavailable'):serving.length?'NOW SERVING':entries.length?'At this station':'Ready to welcome you'}</CardTitle></CardHeader><CardContent>
 {loading ? <ServingSkeleton /> : <>
 {serving.length ? serving.map(e => <div key={e.queueNumber}><div className="q-number">{number(e.queueNumber)}</div><Badge variant="secondary"><span className="q-dot" />Now serving</Badge></div>) : <div className="q-number">{entries.length===1?number(entries[0].queueNumber):'—'}</div>}
 <p>{!ready?'Queue information is unavailable.':serving.length?`Please proceed to the ${title.toLowerCase()}.`:entries.length?'Please wait for clinic staff to assist you.':'No patient at this station.'}</p>
 {(serving.length ? others.length>0 : others.length>1)&&<><p>Also at this station</p><QueueList entries={others}/></>}
 </>}
 </CardContent></Card>;
}
export default function TvQueue() {
 const [board,setBoard] = useState(empty);
 const [connection,setConnection] = useState('Connecting');
 const [ready,setReady] = useState(false);
 const [updated,setUpdated] = useState(null);
 const [now,setNow] = useState(new Date());
 const [full,setFull] = useState(false);
 const [error,setError] = useState('');
 const loading = !ready && connection === 'Connecting';
 useEffect(() => {
  let stopped=false, timer, controller;
  async function load() {
   controller=new AbortController();
   try { const {data}=await axios.get('/api/tv-queue',{signal:controller.signal,timeout:10000,headers:{Accept:'application/json'}});
    if(stopped)return;
    setBoard(Object.fromEntries(Object.keys(empty).map(key=>[key,Array.isArray(data[key])?data[key].filter(e=>e.queueNumber!=null).map(e=>({queueNumber:e.queueNumber,serving:e.serving===true,completedTime:key==='done'&&typeof e.completedTime==='string'?e.completedTime.trim():null})):[]])));
    setReady(true);setConnection('Live');setUpdated(new Date());
   } catch { if(!stopped)setConnection('Reconnecting'); }
   finally { if(!stopped)timer=setTimeout(load,3000); }
  }
  load();return()=>{stopped=true;clearTimeout(timer);controller?.abort();};
 },[]);
 useEffect(()=>{const timer=setInterval(()=>setNow(new Date()),1000);const change=()=>setFull(!!document.fullscreenElement);document.addEventListener('fullscreenchange',change);return()=>{clearInterval(timer);document.removeEventListener('fullscreenchange',change);};},[]);
 async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.q-board').requestFullscreen();setError('');}catch{setError('Full screen is unavailable in this browser.');}}
 return <div className="hp q-preview q-design-6 q-live"><Head title="Live Queue · USeP Clinic"/><div className="q-board"><header className="q-header"><Link href="/" className="q-brand" aria-label="USeP home"><img src="/assets/img/University of Southeastern Philippines Seal.png" alt="USeP seal" width="64" height="64"/><span><strong>USeP Clinic</strong><small>University of Southeastern Philippines</small></span></Link><div className="q-heading"><span className="q-eyebrow">LIVE QUEUE</span><h1>Now serving</h1><Badge variant="secondary" role="status"><span className="q-dot"/>{connection}</Badge></div><div className="q-tools"><time>{now.toLocaleTimeString('en-US',{timeZone:'Asia/Manila',hour:'2-digit',minute:'2-digit',hour12:true})}</time><small>{now.toLocaleDateString('en-US',{timeZone:'Asia/Manila',weekday:'long',month:'short',day:'numeric'})}</small><Button variant="outline" size="sm" onClick={fullscreen}>{full?<Minimize data-icon="inline-start"/>:<Monitor data-icon="inline-start"/>}{full?'Exit TV mode':'TV mode'}</Button>{error&&<small role="alert">{error}</small>}</div></header>
 <main className="q-main"><div className="q-intro"><p>Please watch for your queue number.</p><span>Proceed when your number is called <ArrowRight size={16} aria-hidden="true"/></span></div>
 {connection==='Reconnecting'&&<p className="q-connection" role="status">Connection interrupted. {updated?`Showing the last update at ${updated.toLocaleTimeString('en-US',{timeZone:'Asia/Manila'})}.`:'Queue information is unavailable.'} Reconnecting automatically.</p>}
 <div className="q-grid"><Card className="q-waiting"><CardHeader><CardDescription><Clock3 aria-hidden="true"/>Waiting area</CardDescription><CardTitle>{!ready?'Connecting…':board.waiting.length?'Up next':'All caught up'}</CardTitle></CardHeader><CardContent>{loading ? <ListSkeleton columns={1} rows={4} label="Loading waiting queue" /> : board.waiting.length?<><QueueList entries={board.waiting}/><p>Please remain in the waiting area.</p></>:<div className="q-empty"><Clock3 aria-hidden="true"/><strong>{ready?'No patients waiting':'Queue unavailable'}</strong><p>{ready?'New queue numbers will appear here.':'Reconnecting automatically.'}</p></div>}</CardContent></Card><Station title="Nurse station" entries={board.nurse} nurse ready={ready} loading={loading}/><Station title="Doctor’s clinic" entries={board.doctor} ready={ready} loading={loading}/></div>
 <Card className="q-completed"><CardHeader><CardTitle><Check aria-hidden="true"/>Recently completed</CardTitle><CardDescription>Latest 5 visits today</CardDescription></CardHeader><CardContent>{loading ? <ListSkeleton columns={5} rows={1} label="Loading completed visits" /> : board.done.length?<div className="q-done-list">{board.done.slice(0,5).map(e=><Badge key={e.queueNumber} variant="secondary"><Check aria-hidden="true"/><span>{number(e.queueNumber)}</span><span className="q-completed-separator" aria-hidden="true">·</span>{e.completedTime?<time className="q-completed-time" aria-label={`Completed at ${e.completedTime}`}>{e.completedTime}</time>:<span className="q-completed-time">Time unavailable</span>}</Badge>)}</div>:<p>{ready?'No completed visits yet today.':'Queue information is unavailable.'}</p>}</CardContent></Card><footer className="q-footer"><span>University Clinic Information Management System</span><span>Queue numbers only · Thank you for your patience</span></footer></main></div></div>;
}
TvQueue.layout = page => page;

