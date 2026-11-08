import {Browser} from 'file:///C:/Users/Gina/.codex/skills/design-taste-frontend/scripts/lib/cdp.mjs';
const b=await Browser.launch({extraArgs:["--disable-features=LocalNetworkAccessChecks"]});
const p=await b.newPage({width:1440,height:1000});
const failures=[];
try {
 await p.goto('http://127.0.0.1:8000/previews/doctor-canvas',{settleMs:7000});
 console.log(await p.eval(()=>document.body.innerText.slice(0,400)));
 for(let i=1;i<=10;i++){
  await p.eval(i=>document.querySelectorAll('.dc-choices button')[i-1].click(),i);
  await new Promise(r=>setTimeout(r,180));
  const state=await p.eval(()=>({heading:document.querySelector('h1')?.textContent,overflow:document.documentElement.scrollWidth>innerWidth}));
  if(state.heading!=='Active Consultations'||state.overflow)failures.push({i,state});
  await p.screenshot({path:`public/previews/doctor-canvas-assets/design-${i}.jpg`,quality:85});
 }
 await p.eval(()=>document.querySelector('.dc-choices button').click());
 await p.eval(()=>document.querySelector('[aria-label="Toggle sidebar"]').click());
 if(!await p.eval(()=>!!document.querySelector('.dc-collapsed'))) failures.push('collapse');
 await p.eval(()=>document.querySelector('.dc-state').click());
 if(!await p.eval(()=>document.body.innerText.includes('No patients waiting'))) failures.push('empty');
 await p.eval(()=>document.querySelector('.dc-state').click());
 await p.eval(()=>document.querySelector('.dc-primary').click());
 if(!await p.eval(()=>!!document.querySelector('[role=dialog]'))) failures.push('dialog');
 await p.eval(()=>document.querySelector('.dc-close').click());
 for(const width of [768,390]){
  await p.setViewport({width,height:1000});
  console.log(await p.eval(()=>document.body.innerText.slice(0,400)));
 for(let i=1;i<=10;i++){
   await p.eval(i=>document.querySelectorAll('.dc-choices button')[i-1].click(),i);
   if(await p.eval(()=>document.documentElement.scrollWidth>innerWidth))failures.push({width,i,overflow:true});
  }
  await p.screenshot({path:`public/previews/doctor-canvas-assets/width-${width}.jpg`});
 }
 console.log(JSON.stringify({failures}));
}finally{await b.close()}





