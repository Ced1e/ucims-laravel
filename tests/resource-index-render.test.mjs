import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const require = createRequire(import.meta.url);
const reactUrl = pathToFileURL(require.resolve('react')).href;
const dataUrl = text => 'data:text/javascript;base64,' + Buffer.from(text).toString('base64');
const compile = source => dataUrl(ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext}}).outputText.replaceAll('"react/jsx-runtime"',JSON.stringify(pathToFileURL(require.resolve('react/jsx-runtime')).href)));
const pagination = compile(fs.readFileSync(new URL('../resources/js/components/paginated-items.jsx',import.meta.url),'utf8').replace("'react'",JSON.stringify(reactUrl)).replace("'../lib/pagination.mjs'",JSON.stringify(new URL('../resources/js/lib/pagination.mjs',import.meta.url).href)));
const inertia = dataUrl(`import React from ${JSON.stringify(reactUrl)}; export const Head=()=>null; export const Link=({children,...props})=>React.createElement('a',props,children); export const router={post(url){globalThis.__resourceActions.push(url)},delete(url){globalThis.__resourceActions.push(url)}}; export const useForm=()=>router;`);
const layout = dataUrl('export default function Layout({children}){return children}');
const cases = [
 ['ClinicQueue','clinicQueues','queue_id','clinic-queue',{}],
 ['Consultations','consultations','consultation_id','consultations',{diagnosis:'Recorded diagnosis',treatment:'Recorded treatment'}],
 ['Endorsed','endorsements','endorsed_id','endorsed',{}],
 ['LabRequests','requests','lab_request_id','lab-requests',{laboratory_request:'Recorded test',attachments:'Recorded result'}],
 ['MedicalCertificates','certificates','certificate_id','medical-certificates',{queue_id:88,issued_date:'2026-11-02',purpose:'Recorded purpose'}],
 ['MedicineIssuances','issuances','issuance_id','medicine-issuances',{queue_id:88,issued_date:'2026-11-02'}],
 ['PatientAuth','auths','patient_auth_id','patient-auth',{}],
 ['PprDemographics','demographics','demographics_id','ppr-demographics',{patient_id:88,contact_no:'Recorded contact',city_address:'Recorded address'}],
 ['PprHealthQuestionnaires','questionnaires','questionnaire_id','ppr-health-questionnaires',{patient_id:88,hosp_admitted:'Yes',surgery:'No'}],
 ['PprHealthRecords','records','hr_id','ppr-health-records',{patient_id:88,gen_appearance:'Recorded appearance',blood_pressure:'120/80'}],
 ['PprPermanents','permanents','permanent_id','ppr-permanents',{patient_id:88,patient_type:'Student',college_dept:'Recorded college'}],
 ['Prescriptions','prescriptions','prescription_id','prescriptions',{}],
 ['Staff','staff','staff_profile_id','staff',{user:{clinic_id:'S-001',firstname:'Test',lastname:'Staff'}}],
 ['TriageRecord','records','triage_id','triage-records',{}],
 ['TriageRecords','records','triage_id','triage-records',{}],
];
for (const [page,prop,pk,route,fields] of cases) {
 test(`${page}: real model props render 20 rows with valid edit destinations`,async()=>{
  let source=fs.readFileSync(new URL(`../resources/js/pages/${page}/Index.jsx`,import.meta.url),'utf8').replace("'../../components/paginated-items.jsx'",JSON.stringify(pagination)).replace("'@inertiajs/react'",JSON.stringify(inertia)).replace("'@/layouts/app-layout'",JSON.stringify(layout)).replace("'react'",JSON.stringify(reactUrl));
  const {default:Page}=await import(compile(source));
  const records=Array.from({length:21},(_,i)=>({...fields,[pk]:901+i}));
  const markup=renderToStaticMarkup(React.createElement(Page,{[prop]:records}));
  assert.ok(markup.includes(`href="/${route}/901/edit"`));
  assert.ok(markup.includes(`href="/${route}/920/edit"`));
  assert.ok(!markup.includes(`href="/${route}/921/edit"`));
  assert.ok(markup.includes('1–20 of 21'));
  assert.ok(!markup.includes('/undefined/'));
  for (const value of Object.values(fields).filter(v=>typeof v==='string' && v.startsWith('Recorded'))) assert.ok(markup.includes(value),value);
  globalThis.__resourceActions=[];
  const visit=node=>{
   if(!node || typeof node!=='object') return;
   if(Array.isArray(node)){node.forEach(visit);return;}
   if(node.type?.name==='PaginatedItems'){visit(node.props.children(records[0],0));return;}
   if(node.type==='button' && node.props.onClick && node.props.children!=='Disable') node.props.onClick();
   visit(node.props?.children);
  };
  visit(Page({[prop]:records}));
  for(const url of globalThis.__resourceActions) assert.ok(url===`/${route}/901` || url===`/${route}/901/clone`,url);
  if(page!=='ClinicQueue') assert.ok(globalThis.__resourceActions.includes(`/${route}/901/clone`));
  const blank=renderToStaticMarkup(React.createElement(Page,{[prop]:[{[pk]:901}]}));
  if(page==='PprHealthQuestionnaires'||page==='PprPermanents') assert.ok(blank.includes('Not recorded'));
 });
}
