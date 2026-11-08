import {Browser} from 'file:///C:/Users/Gina/.codex/skills/design-taste-frontend/scripts/lib/cdp.mjs';
const b=await Browser.launch({extraArgs:['--disable-features=LocalNetworkAccessChecks']});const p=await b.newPage({width:1440,height:1100});const errors=[];
try{await p.goto('http://127.0.0.1:8000/previews/patient-canvas?design=10&state=queue',{settleMs:6000});
for(const state of ['queue','triaged','doctor','examined','done']){await p.eval(s=>{const e=document.querySelector('select');e.value=s;e.dispatchEvent(new Event('change',{bubbles:true}))},state);await new Promise(r=>setTimeout(r,150));if(!await p.eval(()=>!!document.querySelector('.cq-ticket')))errors.push(state);await p.screenshot({path:`public/previews/patient-canvas-assets/centered-${state}.jpg`,quality:85});}
await p.eval(()=>{const e=document.querySelector('select');e.value='triaged';e.dispatchEvent(new Event('change',{bubbles:true}))});
for(const width of [768,390]){await p.setViewport({width,height:1050});await p.screenshot({path:`public/previews/patient-canvas-assets/centered-${width}.jpg`});if(await p.eval(()=>document.documentElement.scrollWidth>innerWidth))errors.push(width)}
console.log(JSON.stringify({errors,console:p.consoleErrors}));}finally{await b.close()}
