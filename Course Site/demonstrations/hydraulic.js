import {constants as C,defaults,initialState,valveCommand,flowAt,advance} from './hydraulic-model.mjs?v=20261107';
const $=id=>document.getElementById(id),p={...defaults};
let state=initialState(),playing=false,last=null,frame=null,lastPhase='';
const fmt=(n,d=1)=>Number(n.toFixed(d)).toString();
function pressureColour(value){const q=Math.max(0,Math.min(1,(value-C.pT)/(p.pressureBar*1e5-C.pT))),r=.5+.5*Math.tanh(7*(q-.5));return `rgb(${Math.round(70+175*r)},${Math.round(150+15*r)},${Math.round(230-155*r)})`;}
const path=points=>points.map((q,i)=>`${i?'L':'M'}${q[0]},${q[1]}`).join(' ');
function dots(points,on){
  if(!on)return '';
  const lengths=points.slice(1).map((q,i)=>Math.hypot(q[0]-points[i][0],q[1]-points[i][1])),total=lengths.reduce((a,b)=>a+b,0);
  let result='';const spacing=55,phase=(state.volume*260000)%spacing;
  for(let d=phase;d<total;d+=spacing){let remain=d,i=0;while(i<lengths.length-1&&remain>lengths[i])remain-=lengths[i++];const t=lengths[i]?remain/lengths[i]:0,a=points[i],b=points[i+1];result+=`<circle cx="${a[0]+t*(b[0]-a[0])}" cy="${a[1]+t*(b[1]-a[1])}" r="3.7" fill="#fff4d2"/>`;}
  return result;
}
function pipe(points,colour,on=false,width=12){const d=path(points);return `<path d="${d}" fill="none" stroke="#344d64" stroke-width="${width+5}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${colour}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`+dots(points,on);}
// Upright layout: cylinder above valve; pump and open reservoir below.
function label(x,y,text,small=false,colour=''){return `<text x="${x}" y="${y}" text-anchor="middle" ${small?'class="small"':''} ${colour?`style="fill:${colour}"`:''}>${text}</text>`;}
function drawing(f){
  const cx=300+state.y/C.stroke*400,target=300+p.target/C.stroke*400,a=pressureColour(f.pA),b=pressureColour(f.pB),high=pressureColour(f.pS),low=pressureColour(f.pT),moving=Math.abs(f.Q)>1e-10,ext=f.u>0,ret=f.u<0;
  const offset=-42*f.u,left=360+offset,right=560+offset;
  const aLine=[[400,400],[400,355],[300,355],[300,285]],bLine=[[600,400],[600,355],[700,355],[700,285]];
  let out=`<defs><clipPath id="cylinder-oil"><rect x="282" y="132" width="436" height="151"/></clipPath></defs>`;
  out+=label(500,44,'Equal-area double-rod cylinder');
  out+=`<path d="M300,95H700" stroke="#53718b"/><path d="M300,88V102 M700,88V102" stroke="#53718b"/>`+label(300,79,'0 mm',true)+label(700,79,'400 mm',true)+label(500,79,'y · piston displacement',true,'#5de0ce');
  if(p.mode==='servo')out+=`<path d="M${target-7},105L${target+7},105L${target},94Z" fill="#ffbf69"/>`+label(target,121,'target',true,'#ffbf69');
  out+=`<circle cx="${cx}" cy="95" r="5" fill="#5de0ce"/><g clip-path="url(#cylinder-oil)"><rect x="282" y="132" width="${cx-291}" height="151" fill="${a}" fill-opacity=".65"/><rect x="${cx+9}" y="132" width="${709-cx}" height="151" fill="${b}" fill-opacity=".65"/></g>`;
  // The two rod ends and the load translate with the same piston.
  out+=`<rect x="${cx-300}" y="198" width="600" height="18" rx="3" fill="#9aabba" stroke="#d4e2eb"/><rect x="${cx-9}" y="132" width="18" height="151" rx="2" fill="#d5e1e9" stroke="#647f96"/><path d="M280,198V130H720V198 M280,216V285H720V216" stroke="#a6c1d5" stroke-width="5" fill="none"/><rect x="${cx+306}" y="170" width="64" height="76" rx="6" fill="#244c70" stroke="#b9d1e2"/>`+label(cx+338,214,'Load',true);
  out+=label(330,160,'Chamber A',true)+label(660,160,'Chamber B',true);
  out+=pipe(ext?aLine:[...aLine].reverse(),a,moving)+pipe(ret?bLine:[...bLine].reverse(),b,moving);
  const chamberA=[[300,285],[300,250],[cx-28,250]],chamberB=[[700,285],[700,250],[cx+28,250]];
  out+=dots(ext?chamberA:[...chamberA].reverse(),moving)+dots(ret?chamberB:[...chamberB].reverse(),moving);
  out+=label(180,320,`p<tspan baseline-shift="sub" font-size="12">A</tspan> = ${fmt(f.pA/1e5)} bar`,false,a)+label(840,320,`p<tspan baseline-shift="sub" font-size="12">B</tspan> = ${fmt(f.pB/1e5)} bar`,false,b)+label(190,350,'q₁ · mass flow',true)+label(810,350,'q₂ · mass flow',true);
  out+=`<path d="M255,351H292 M708,351H745" stroke="#abc0ce" stroke-width="1.3" fill="none"/>`;
  // One common tank supplies the pump and receives both return connections.
  out+=`<rect x="142" y="678" width="756" height="25" fill="#244f75"/><path d="M140,650V705H900V650" class="wire"/>`+label(280,698,'Reservoir · p₀ = 1 bar',true);
  out+=pipe([[340,510],[340,560],[180,560],[180,690]],low,moving&&ret)+pipe([[660,510],[660,560],[860,560],[860,690]],low,moving&&ext);
  out+=pipe([[500,690],[500,620]],low,moving)+pipe([[500,560],[500,510]],high,moving);
  out+=`<circle cx="500" cy="590" r="30" fill="#18384e" stroke="#b1cadb" stroke-width="2"/><path d="M488,603H512L500,574Z" fill="#ffbf69"/>`+label(650,592,`Pump · pₛ = ${p.pressureBar} bar`);
  // Cutaway valve: matching port/land widths give ideal zero overlap.
  out+=`<rect x="300" y="400" width="400" height="120" rx="10" fill="#1b3045" stroke="#a4bdd0" stroke-width="2"/><rect x="360" y="400" width="80" height="32" fill="${a}"/><rect x="560" y="400" width="80" height="32" fill="${b}"/><rect x="320" y="492" width="40" height="28" fill="${low}"/><rect x="480" y="492" width="40" height="28" fill="${high}"/><rect x="640" y="492" width="40" height="28" fill="${low}"/><rect x="310" y="430" width="380" height="64" fill="${low}" fill-opacity=".55"/><rect x="${left+80}" y="430" width="120" height="64" fill="${high}" fill-opacity=".75"/>`;
  if(ext){const ax=440+offset/2,bx=640+offset/2;out+=pipe([[500,510],[500,442],[ax,442],[ax,419],[400,400]],a,moving,8)+pipe([[600,400],[bx,419],[bx,442],[660,442],[660,510]],low,moving,8);}
  if(ret){const ax=360+offset/2,bx=560+offset/2;out+=pipe([[500,510],[500,442],[bx,442],[bx,419],[600,400]],b,moving,8)+pipe([[400,400],[ax,419],[ax,442],[340,442],[340,510]],low,moving,8);}
  out+=`<rect x="${290+offset}" y="460" width="420" height="5" rx="2" fill="#a0b3c1"/><rect x="${left}" y="430" width="80" height="64" rx="3" fill="#8095a6" stroke="#d4e2eb"/><rect x="${right}" y="430" width="80" height="64" rx="3" fill="#8095a6" stroke="#d4e2eb"/>`;
  out+=label(430,386,'A')+label(570,386,'B')+label(245,544,'p₀ · return',true)+label(575,544,'pₛ · supply',true)+label(755,544,'p₀ · return',true);
  out+=label(835,424,'Spool valve')+label(835,451,f.u>0?'← extend opening':f.u<0?'retract opening →':'centred: closed',true)+label(835,477,`x/xₘₐₓ = ${fmt(f.u*100,0)}%`,true);
  out+=label(835,505,'K₁ · local valve gain',true);
  out+=label(155,438,'x · valve displacement',true,'#5de0ce')+label(155,461,'positive x ←',true,'#5de0ce');
  out+=`<path d="M235,462H${290+offset}" stroke="#5de0ce" stroke-width="1.4" stroke-dasharray="4 4"/>`;
  out+=label(910,105,'A · effective piston area',true)+label(910,80,'ρ · oil density',true);
  out+=label(cx+338,270,'b · viscous load',true);
  if(Math.abs(f.force)>0.1){const start=cx+338,sgn=Math.sign(f.force),end=start+sgn*52;out+=`<path d="M${start},150H${end}" stroke="#ffbf69" stroke-width="3"/><path d="M${end},150l${-sgn*10},-6v12Z" fill="#ffbf69"/>`+label(start,138,'F',true);}else{out+=label(cx+338,138,'F = 0 N',true);}
  return `<g id="hydraulic-circuit" >${out}</g>`;
}
function render(){
  const f=flowAt(valveCommand(state,p),state.y,p.pressureBar);
  $('scene').innerHTML=drawing(f);$('scene').dataset.position=state.y.toFixed(6);$('scene').dataset.command=f.u.toFixed(5);
  $('scene').setAttribute('aria-label',`Spool ${f.u>0?'extends':f.u<0?'retracts':'holds'} the cylinder; piston position ${fmt(state.y*1000)} mm`);
  const phase=(f.u>0?'Extend · P → A, B → T':f.u<0?'Retract · P → B, A → T':'Hold · A and B closed')+(f.blocked?' · end stop':'');
  if(phase!==lastPhase){$('phase').textContent=phase;lastPhase=phase;}
  $('time').textContent=fmt(state.t)+' s';$('position').textContent=fmt(state.y*1000)+' mm';$('valve').textContent=fmt(f.u*100,0)+'%';$('flow').textContent=fmt(C.rho*Math.abs(f.Q),3)+' kg/s';$('pa').textContent=fmt(f.pA/1e5)+' bar';$('pb').textContent=fmt(f.pB/1e5)+' bar';$('force').textContent=fmt(f.force,0)+' N';
  document.querySelectorAll('[data-manual]').forEach(b=>b.setAttribute('aria-pressed',String(p.mode==='manual'&&+b.dataset.manual===p.manual)));
}
function pause(){playing=false;last=null;if(frame!==null)cancelAnimationFrame(frame);frame=null;$('play').textContent='▶ Play';}
function tick(now){if(!playing)return;if(last!==null)state=advance(state,Math.min((now-last)/1000,0.08),p);last=now;render();frame=requestAnimationFrame(tick);}
function play(){if(playing)return;playing=true;last=null;$('play').textContent='Ⅱ Pause';frame=requestAnimationFrame(tick);}
$('play').onclick=()=>playing?pause():play();
$('step').onclick=()=>{pause();state=advance(state,0.15,p);render();};
$('reset').onclick=()=>{pause();state=initialState();render();};
$('mode').onchange=e=>{p.mode=e.target.value;if(p.mode==='cycle')state.t=0;$('target').disabled=p.mode!=='servo';render();};
document.querySelectorAll('[data-manual]').forEach(b=>b.onclick=()=>{p.mode='manual';p.manual=+b.dataset.manual;$('mode').value='manual';$('target').disabled=true;render();play();});
$('pressure').oninput=e=>{p.pressureBar=+e.target.value;$('pressure-value').textContent=p.pressureBar+' bar';render();};
$('opening').oninput=e=>{p.opening=+e.target.value/100;$('opening-value').textContent=e.target.value+'%';render();};
$('target').oninput=e=>{p.target=+e.target.value/1000;$('target-value').textContent=e.target.value+' mm';render();};
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
render();

document.addEventListener('model-pause',pause);
