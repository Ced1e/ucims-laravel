import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { HeartPulse, FileCheck2, FlaskConical, FolderOpen, History, PanelLeft, ArrowRight, Search, Check, X } from 'lucide-react';
import '../../../css/doctor-canvas.css';
const designs = [
 ['Clinic Canvas','The closest match to your admin: balanced summary cards and a spacious queue table.'],
 ['Consultation Focus','A featured consultation above a quieter remaining queue.'],
 ['Patient Cards','Three equal patient cards with clearly separated actions.'],
 ['Split Workspace','Choose a queue entry on the left and review its summary on the right.'],
 ['Compact Ledger','A denser, precise table for scanning a longer patient list.'],
 ['Queue & Requests','The consultation queue beside shortcuts to existing request sections.'],
 ['Open Canvas','A lighter workspace with inline counts and generous breathing room.'],
 ['Consultation List','Full-width patient rows with an easy-to-scan action area.'],
 ['Queue Sequence','A numbered vertical queue emphasizing the order of consultations.'],
 ['Framed Workspace','An inset white work surface with a compact summary rail.'],
];
const sections = [['Active Consultations',HeartPulse],['MedCert Requests',FileCheck2],['Lab Requests',FlaskConical],['Record Management',FolderOpen],['Examination History',History]] as const;
const patients = [
 {id:'026',name:'Sample Patient A',purpose:'Check-up',time:'9:10 AM'},
 {id:'027',name:'Sample Patient B',purpose:'Follow-up',time:'9:18 AM'},
 {id:'028',name:'Sample Patient C',purpose:'Check-up',time:'9:24 AM'},
];
type Patient = typeof patients[number];
const steps=['Triage Assessment','Physician Diagnosis','Prescriptions','Finalization'];
export default function DoctorCanvas({initialDesign=1}:{initialDesign?:number}) {
 const [design,setDesign]=useState(initialDesign),[collapsed,setCollapsed]=useState(false),[section,setSection]=useState('Active Consultations'),[empty,setEmpty]=useState(false),[query,setQuery]=useState(''),[selected,setSelected]=useState('026'),[modal,setModal]=useState(''),[step,setStep]=useState(0);
 useEffect(()=>{
  if(!modal)return;
  const before=document.activeElement as HTMLElement;
  const handler=(event:KeyboardEvent)=>{
   if(event.key==='Escape')setModal('');
   if(event.key==='Tab'){
    const items=Array.from(document.querySelectorAll<HTMLButtonElement>('.dc-modal button'));
    const first=items[0],last=items[items.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
   }
  };
  document.addEventListener('keydown',handler);
  return()=>{document.removeEventListener('keydown',handler);before?.focus()};
 },[modal]);
 const active=section===sections[0][0];
 const rows=empty?[]:patients.filter(p=>`${p.id} ${p.name} ${p.purpose}`.toLowerCase().includes(query.toLowerCase()));
 const chosen=rows.find(p=>p.id===selected)||rows[0];
 const open=(action:string,p:Patient)=>{setModal(`${action} · ${p.name}`);setStep(0)};
 const actions=(p:Patient)=><div className="dc-actions"><button className="dc-primary" onClick={()=>open('Examine',p)}>Examine <ArrowRight size={14}/></button><button onClick={()=>open('Completed',p)}>Completed</button></div>;
 const tag=<span className="dc-badge">With doctor</span>;
 const patientCard=(p:Patient)=><article className="dc-patient" key={p.id}><div className="dc-card-head"><span className="dc-number">#{p.id}</span>{tag}</div><h3>{p.name}</h3><p>{p.purpose}</p><dl><div><dt>Time in</dt><dd>{p.time}</dd></div><div><dt>Queue status</dt><dd>With doctor</dd></div></dl>{actions(p)}</article>;
 const table=(items=rows)=><div className="dc-table-scroll"><table><thead><tr><th>Queue</th><th>Patient</th><th>Purpose</th><th>Status</th><th>Actions</th></tr></thead><tbody>{items.map(p=><tr key={p.id}><td className="dc-number">#{p.id}</td><td><strong>{p.name}</strong><small>Time in · {p.time}</small></td><td>{p.purpose}</td><td>{tag}</td><td>{actions(p)}</td></tr>)}</tbody></table></div>;
 const list=(items=rows)=><div className="dc-rows">{items.map((p,i)=><article key={p.id}><span className="dc-number">{design===9?<><small>QUEUE</small>{p.id}</>:`#${p.id}`}</span><div><h3>{p.name}</h3><p>{p.purpose} <span>· {p.time}</span></p></div>{tag}{actions(p)}</article>)}</div>;
 const stats=<div className="dc-stats">{[['Active consultations',empty?'0':'3','Active Consultations'],['Certificate requests',empty?'0':'2','MedCert Requests'],['Lab requests',empty?'0':'1','Lab Requests']].map(([name,count,target])=><button key={name} onClick={()=>setSection(target)}><span>{name}</span><strong>{count}</strong><ArrowRight size={15}/></button>)}</div>;
 const requestRail=<aside className="dc-request-rail"><h2>Requests</h2><p>Continue your existing workflows.</p>{sections.slice(1,3).map(([name,Icon],i)=><button key={name} onClick={()=>setSection(name)}><Icon size={20}/><span>{name}<small>{empty?'0':i===0?'2':'1'} pending · sample data</small></span><ArrowRight size={16}/></button>)}<div className="dc-note"><FolderOpen size={18}/><h3>Patient records</h3><p>Access existing records from Record Management.</p><button onClick={()=>setSection('Record Management')}>View records <ArrowRight size={14}/></button></div></aside>;
 return <div className={`dc-preview dc-v${design} ${collapsed?'dc-collapsed':''}`}><Head title={`Doctor design ${design} · ${designs[design-1][0]}`}/>
 <div className="dc-review"><div><strong>Doctor workspace / 10 design choices</strong><small>Preview only · Fictional data · No records are changed</small></div><div className="dc-choices" aria-label="Design choices">{designs.map(([name],i)=><button key={name} aria-pressed={design===i+1} title={name} onClick={()=>{setDesign(i+1);history.replaceState(null,'',`?design=${i+1}`)}}>{i+1}</button>)}</div><button className="dc-state" onClick={()=>setEmpty(v=>!v)}>{empty?'Show sample patients':'Show empty state'}</button></div>
 <div className="dc-caption"><strong>{design}. {designs[design-1][0]}</strong><span>{designs[design-1][1]}</span></div>
 <div className="dc-shell"><aside className="dc-sidebar"><a href="/" className="dc-brand"><img src="/assets/img/University of Southeastern Philippines Seal.png" width="42" height="42" alt="USeP home"/><span>USeP Clinic<small>Doctor workspace</small></span></a><div className="dc-nav"><p>WORKSPACE</p><nav>{sections.map(([name,Icon])=><button key={name} title={name} aria-label={name} aria-current={section===name?'page':undefined} onClick={()=>{setSection(name);setQuery('')}}><Icon size={18}/><span>{name}</span></button>)}</nav></div><div className="dc-profile"><span className="dc-avatar">DR</span><div><strong>Sample Doctor</strong><small>Clinic physician</small></div></div></aside>
 <main className="dc-main"><div className="dc-topbar"><button aria-label="Toggle sidebar" aria-expanded={!collapsed} onClick={()=>setCollapsed(v=>!v)}><PanelLeft size={18}/></button><strong>{section}</strong><span>USeP · University Clinic</span></div><div className="dc-content"><header className="dc-heading"><div><h1>{section}</h1><p>{active?'Review assigned patients and continue their care.':'Your existing doctor workspace, organized consistently.'}</p></div><span className="dc-preview-label">Sample data</span></header>
 {stats}<div className="dc-workspace"><section className="dc-panel"><div className="dc-panel-heading"><div><h2>{active?'Assigned patient queue':section}</h2><p>{active?`${empty?0:3} assigned consultations`:'Design preview · existing workflow retained'}</p></div><label className="dc-search"><Search size={16}/><input aria-label="Search sample patients" placeholder="Search patient or queue…" value={query} onChange={e=>setQuery(e.target.value)}/></label></div>
 {!rows.length?<div className="dc-empty"><HeartPulse size={30}/><h3>{query?'No matching patients':active?'No patients waiting':'No records to display'}</h3><p>{query?'Try another name or queue number.':'New entries will appear here when available.'}</p></div>:!active?<div className="dc-rows">{rows.slice(0,section==='Lab Requests'?1:2).map(p=><article key={p.id}><div><h3>{p.name}</h3><p>{section==='Examination History'?'Completed consultation':section==='Record Management'?'Patient record':section==='Lab Requests'?'Laboratory request':'Medical certificate request'}</p></div><button onClick={()=>open('Review preview',p)}>View preview <ArrowRight size={14}/></button></article>)}</div>:design===2?<><div className="dc-focus"><div><span className="dc-eyebrow">FIRST IN ASSIGNED QUEUE</span><h2>#{rows[0].id} <span>{rows[0].name}</span></h2><p>{rows[0].purpose} · Time in {rows[0].time}</p></div><div>{tag}{actions(rows[0])}</div></div>{table(rows.slice(1))}</>:design===3?<div className="dc-cards">{rows.map(patientCard)}</div>:design===4?<div className="dc-split"><div className="dc-select-list">{rows.map(p=><button key={p.id} aria-pressed={chosen?.id===p.id} onClick={()=>setSelected(p.id)}><span className="dc-number">#{p.id}</span><span><strong>{p.name}</strong><small>{p.purpose}</small></span><ArrowRight size={15}/></button>)}</div>{chosen&&patientCard(chosen)}</div>:[8,9].includes(design)?list():table()}
 <footer className="dc-pagination"><span>{rows.length?`1–${rows.length} of ${rows.length}`:'0 results'}</span><div><button disabled>Previous</button><span>Page 1 of 1</span><button disabled>Next</button></div></footer></section>{design===6&&requestRail}</div><footer className="dc-footnote">University Clinic Information Management System<span>Design review · Existing clinical logic retained</span></footer></div></main></div>
 {modal&&<div className="dc-overlay" onClick={()=>setModal('')}><section className="dc-modal" role="dialog" aria-modal="true" aria-label="Action preview" onClick={e=>e.stopPropagation()}><button className="dc-close" aria-label="Close preview" autoFocus onClick={()=>setModal('')}><X size={18}/></button><h2>{modal}</h2><p>Visual preview only. No patient record will be changed.</p>{modal.startsWith('Examine')?<><div className="dc-steps">{steps.map((s,i)=><button key={s} aria-pressed={step===i} onClick={()=>setStep(i)}>{i+1}. {s}</button>)}</div><div className="dc-modal-body"><Check size={22}/><h3>{steps[step]}</h3><p>Existing fields, clinical validation and permissions will be kept when a design is selected.</p></div></>:<div className="dc-modal-body">This action is simulated for design review. Completion and record updates remain in the working doctor page.</div>}<button onClick={()=>setModal('')}>Close preview</button></section></div>}
 </div>;
}

