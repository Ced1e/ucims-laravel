import {Browser} from 'file:///C:/Users/Gina/.codex/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import fs from 'node:fs';
const b=await Browser.launch({extraArgs:['--disable-features=LocalNetworkAccessChecks']});
const p=await b.newPage({width:1440,height:1050});const failures=[];const wait=()=>new Promise(r=>setTimeout(r,120));
try{
 await p.goto('http://127.0.0.1:8000/previews/patient-canvas',{settleMs:6500});
 for(let i=1;i<=10;i++){await p.eval(i=>document.querySelectorAll('.dc-choices button')[i-1].click(),i);await wait();if(await p.eval(()=>document.documentElement.scrollWidth>innerWidth))failures.push('desktop '+i);await p.screenshot({path:`public/previews/patient-canvas-assets/design-${i}.jpg`,quality:85});}
 await p.eval(()=>document.querySelector('.pc-service-0 button').click());await wait();
 await p.eval(()=>document.querySelector('.pc-types button').click());await wait();
 await p.eval(()=>document.querySelector('.pc-form .dc-primary').click());await wait();
 if(!await p.eval(()=>document.querySelector('.pc-ticket-number')?.textContent==='026'))failures.push('queue flow');
 await p.screenshot({path:'public/previews/patient-canvas-assets/queue.jpg',quality:85});
 for(const state of ['done','error','start']){await p.eval(s=>{const e=document.querySelector('select');e.value=s;e.dispatchEvent(new Event('change',{bubbles:true}))},state);await wait();if(state==='done'&&!await p.eval(()=>document.body.innerText.includes('Consultation complete')))failures.push('completion');}
 await p.eval(()=>document.querySelector('.pc-service-1 button').click());await wait();if(!await p.eval(()=>!!document.querySelector('.pc-form textarea')))failures.push('certificate form');
 await p.eval(()=>document.querySelector('[aria-label="Patient portal"]').click());
 await p.eval(()=>document.querySelector('[aria-label="Toggle sidebar"]').click());
 for(const width of [768,390]){await p.setViewport({width,height:1000});for(let i=1;i<=10;i++){await p.eval(i=>document.querySelectorAll('.dc-choices button')[i-1].click(),i);await wait();if(await p.eval(()=>document.documentElement.scrollWidth>innerWidth))failures.push(`${width} design ${i}`)}await p.screenshot({path:`public/previews/patient-canvas-assets/width-${width}.jpg`});}
 const names=await p.eval(()=>[...document.querySelectorAll('.dc-choices button')].map(e=>e.title));
 const cards=names.map((n,i)=>`<a href="/previews/patient-canvas?design=${i+1}"><img loading="lazy" src="/previews/patient-canvas-assets/design-${i+1}.jpg" alt="${n}"><h2>${i+1}. ${n}</h2><p>Open interactive preview →</p></a>`).join('');
 let gallery=fs.readFileSync('public/previews/doctor-canvas-gallery.html','utf8').replaceAll('Doctor','Patient').replaceAll('doctor','patient').replace(/<main>[\s\S]*<\/main>/,`<main>${cards}</main>`);
 fs.writeFileSync('public/previews/patient-canvas-gallery.html',gallery);
 console.log(JSON.stringify({failures,errors:p.consoleErrors}));
}finally{await b.close()}
