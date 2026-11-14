/* Scenario E: "Taiwan goes dark" — a transparent, assumption-driven toy model. Not a forecast. */
(function(){
'use strict';
const D=window.PULSE_DATA,NS='http://www.w3.org/2000/svg';const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
const COL={cyan:'#3fd6ff',violet:'#a77bff',teal:'#2fe0b4',coral:'#ff6b6b',amber:'#ffb547',white:'#f4f7ff',ti:'#8b97ad',muted:'#9aa8c4'};
function el(t,a,p){const e=document.createElementNS(NS,t);for(const k in a)if(a[k]!=null)e.setAttribute(k,a[k]);p&&p.appendChild(e);return e;}
function tx(p,x,y,s,a){const t=el('text',Object.assign({x,y,class:'svglbl'},a||{}),p);t.textContent=s;return t;}
function mix(a,b,t){const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));const A=p(a),B=p(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('');}
const M={};D.meta.forEach(m=>M[m.k]=m);
const TW=new Set(['tsmc','fox','wis','unim']);
/* exposure assumptions: down = depends on Taiwan output; up = sells into Taiwan fabs; alt = could gain as alternative capacity */
const EXP={
 nv:[.95,0,'Every Nvidia AI GPU is made and packaged by TSMC, almost all of it in Taiwan.'],amd:[.9,0,'GPUs and CPUs fabbed at TSMC.'],avgo:[.85,0,'Custom accelerators and networking chips fabbed at TSMC.'],
 cdn:[.35,.2,'Design work continues, but customers’ tape-outs to TSMC stall.'],snps:[.35,.2,'Same as Cadence.'],
 amat:[0,.55,'Taiwan fabs are a major customer (assumed share).'],lam:[0,.5,'Major Taiwan customer base (assumed).'],tel:[0,.55,'Coat/develop and etch tools for Taiwan fabs (assumed).'],
 asml:[0,.7,'One estimate puts TSMC at ~70–80% of annual EUV machine output.'],kla:[0,.6,'Inspection tools for Taiwan fabs (assumed).'],disco:[0,.6,'Dicing tools; Taiwan is a key market (assumed).'],
 shin:[0,.45,'Ships wafers and photoresist into Taiwan.'],sumco:[0,.5,'Ships wafers into Taiwan.'],ajin:[0,.2,'ABF is a small part of a food company.'],
 ibiden:[.3,.3,'Japanese substrate maker; its customers package in Taiwan.'],unim:[.5,.5,'Taiwan-based substrate maker.'],
 tsmc:[1,1,'The fabs themselves.'],hynix:[.45,0,'HBM must be co-packaged with GPUs at TSMC in Taiwan.'],
 mu:[.8,0,'More than 65% of its DRAM is made in Taiwan; its largest HBM site is in Taichung.'],sams:[.2,0,'Korean fabs; a possible alternative foundry, so a relative beneficiary in this model.',1],
 adv:[0,.55,'Testers for Taiwan fabs and packagers (assumed).'],ter:[0,.45,'Testers; smaller Taiwan share (assumed).'],
 fox:[.85,0,'Taiwan-based assembler; no GPUs to build with.'],wis:[.9,0,'Taiwan-based assembler; no GPUs to build with.'],crwv:[.75,0,'No new GPUs; the existing fleet keeps running and becomes scarce.']};
const SC={
 halted:{n:'Fabs halted (invasion)',m:[.7,.95,1,1,.95,.9],asset:.6},
 blockade:{n:'Full blockade (nothing in or out)',m:[.5,.75,.95,1,.95,.9],asset:.35},
 export:{n:'Export embargo (chips can’t leave)',m:[.4,.65,.85,.95,.9,.85],asset:.25},
 import:{n:'Import embargo (materials can’t enter)',m:[.3,.5,.75,.9,.9,.85],asset:.25}};
const DAYS=[0,7,30,90,180,365],LBL=['Day 0','Week 1','Month 1','Month 3','Month 6','Year 1'];
let st={sc:'blockade',i:0,peak:45,inv:6};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function downLoss(sc,d){if(sc==='import')return clamp((d-st.inv*7)/21,0,1);return 1;}
function upLoss(sc,d){if(sc==='export')return clamp(d/30,0,1)*.8;return 1;}
function model(){const sc=SC[st.sc],d=DAYS[st.i],P=st.peak/100,m=sc.m[st.i],Dl=downLoss(st.sc,d),Ul=upLoss(st.sc,d);const out={};
  D.meta.forEach(x=>{const e=EXP[x.k];if(!e||!x.t){out[x.k]=null;return;}const score=Math.max(e[0]*Dl,e[1]*Ul);const b=clamp(x.beta||1,.5,1.6);
    let dd=-P*m*(.25*b+.75*score);if(e[3])dd=P*m*.35*(1-Dl*.2)-P*m*.15;if(TW.has(x.k))dd=-(1-(1+dd)*(1-sc.asset*Math.min(1,.4+d/120)));out[x.k]=clamp(dd,-.95,.6);});
  // one round of network spill-over along supply links (not for Taiwan-domiciled nodes)
  const nb={};D.edges.forEach(e=>{(nb[e[0]]=nb[e[0]]||[]).push(e[1]);(nb[e[1]]=nb[e[1]]||[]).push(e[0]);});
  const o2={...out};Object.keys(out).forEach(k=>{if(out[k]==null||TW.has(k)||EXP[k][3])return;const ns=(nb[k]||[]).map(j=>out[j]).filter(v=>v!=null);if(!ns.length)return;const avg=ns.reduce((a,b)=>a+b,0)/ns.length;o2[k]=clamp(.85*out[k]+.15*Math.min(avg,out[k]),-.95,.6);});
  return{dd:o2,Dl,Ul,m};}
function heat(v){if(v==null)return'#1a2238';if(v>=0)return mix('#1a2442','#2fe0b4',Math.min(1,v/.3));return mix('#1a2442','#ff6b6b',Math.pow(Math.min(1,-v/.7),.75));}
function edgeState(e,R){const a=e[0],b=e[1],f=e[2],d=DAYS[st.i],sc=st.sc;const aT=TW.has(a),bT=TW.has(b);
  if(!aT&&!bT)return'ok';
  if(aT&&bT)return sc==='halted'||(sc!=='export'&&R.Dl>=1)?'cut':'strained';
  const inbound=bT; // flows into Taiwan
  if(inbound){if(f==='info')return sc==='halted'?'cut':'strained';if(sc==='export')return d>=30?'frozen':'strained';return'cut';}
  if(sc==='import')return R.Dl>=1?'cut':(R.Dl>0?'draining':'draining');return'cut';}
const svg=$('#scMap');
function draw(){const R=model();while(svg.firstChild)svg.removeChild(svg.firstChild);
  const defs=el('defs',null,svg);const f=el('filter',{id:'sg',x:'-50%',y:'-50%',width:'200%',height:'200%'},defs);el('feGaussianBlur',{stdDeviation:6,result:'b'},f);const mg=el('feMerge',null,f);el('feMergeNode',{in:'b'},mg);el('feMergeNode',{in:'SourceGraphic'},mg);
  // Taiwan zone

  D.edges.forEach(e=>{const A=M[e[0]],B=M[e[1]],s=edgeState(e,R);const mx=(A.x+B.x)/2;const d=`M${A.x},${A.y} C${mx},${A.y} ${mx},${B.y} ${B.x},${B.y}`;
    const sty={ok:{stroke:'#3a4a72',w:1.5,o:.45},cut:{stroke:COL.coral,w:2,o:.85,dash:'3 7'},draining:{stroke:COL.amber,w:2.4,o:.9,dash:'10 5'},strained:{stroke:COL.amber,w:1.6,o:.6,dash:'2 5'},frozen:{stroke:COL.amber,w:1.6,o:.5,dash:'1 8'}}[s];
    el('path',{d,fill:'none',stroke:sty.stroke,'stroke-width':sty.w,'stroke-opacity':sty.o,'stroke-dasharray':sty.dash||null},svg);
    if(s==='cut'){const t=.5;const px=(1-t)**3*A.x+3*(1-t)**2*t*mx+3*(1-t)*t*t*mx+t**3*B.x,py=(1-t)**3*A.y+3*(1-t)**2*t*A.y+3*(1-t)*t*t*B.y+t**3*B.y;
      el('path',{d:`M${px-5},${py-5} L${px+5},${py+5} M${px+5},${py-5} L${px-5},${py+5}`,stroke:COL.coral,'stroke-width':2.2},svg);}});
  D.meta.forEach(m=>{const v=R.dd[m.k];const w=Math.max(112,m.n.length*7.6+24),h=44;const g=el('g',null,svg);
    el('rect',{x:m.x-w/2,y:m.y-h/2,width:w,height:h,rx:8,fill:heat(v),stroke:TW.has(m.k)?COL.coral:'#3a4a72','stroke-width':TW.has(m.k)?1.8:1.1,filter:v!=null&&v<-.55?'url(#sg)':null},g);
    if(TW.has(m.k))tx(g,m.x-w/2+6,m.y-h/2-5,'TAIWAN-BASED',{'font-size':9,fill:COL.coral});
    const dark=v!=null&&Math.abs(v)>=.35;const t1=tx(g,m.x,m.y-4,m.n,{'text-anchor':'middle',class:'svgtitle','font-size':12.5});t1.style.fill=dark?'#06101e':'#f4f7ff';
    const t2=tx(g,m.x,m.y+13,v==null?'private':((v>0?'+':'')+Math.round(v*100)+'%'),{'text-anchor':'middle','font-size':11});t2.style.fill=dark?'#06101e':COL.white;t2.style.fontWeight=dark?'700':'400';});
  // legend
  const L=[['#3a4a72','unaffected link',''],[COL.amber,'draining inventory / strained','10 5'],[COL.coral,'cut','3 7']];
  L.forEach((l,i)=>{el('line',{x1:40+i*300,x2:80+i*300,y1:742,y2:742,stroke:l[0],'stroke-width':2.4,'stroke-dasharray':l[2]||null},svg);tx(svg,88+i*300,746,l[1],{'font-size':10.5});});
  tx(svg,1200,746,'node % = modeled stock drawdown (illustrative)',{'text-anchor':'end','font-size':10.5,fill:COL.amber});
  // readouts
  const rows=D.meta.filter(m=>R.dd[m.k]!=null).sort((a,b)=>R.dd[a.k]-R.dd[b.k]);const fmt=v=>(v>0?'+':'')+Math.round(v*100)+'%';
  const avg=rows.reduce((a,m)=>a+R.dd[m.k],0)/rows.length;
  $('#scPhase').innerHTML=`<h4>${SC[st.sc].n} · ${LBL[st.i]}</h4><p>${phaseText(R)}</p><p style="margin-top:8px">Average modeled drawdown across the map: <b>${fmt(avg)}</b>. Hardest hit: ${rows.slice(0,3).map(m=>`${m.n} ${fmt(R.dd[m.k])}`).join(', ')}. Most insulated: ${rows.slice(-3).reverse().map(m=>`${m.n} ${fmt(R.dd[m.k])}`).join(', ')}.</p>`;
  const b=$('#scBars');while(b.firstChild)b.removeChild(b.firstChild);const x0b=170,sc=4.6,rh=26;
  el('line',{x1:x0b+95*sc*.0,x2:x0b,y1:8,y2:rows.length*rh+8,stroke:COL.ti,'stroke-opacity':.4},b);
  rows.forEach((m,i)=>{const v=R.dd[m.k]*100,y=10+i*rh;tx(b,8,y+16,m.n,{'font-size':11,fill:COL.white});
    const w=Math.abs(v)*sc*.85;el('rect',{x:v<0?x0b:x0b,y:y+4,width:Math.max(2,w),height:rh-9,rx:3,fill:v<0?COL.coral:COL.teal,opacity:.85},b);
    tx(b,x0b+Math.max(2,w)+6,y+17,fmt(v/100),{'font-size':10.5,fill:COL.muted});});
  $$('#scSteps .btn').forEach((x,k)=>x.setAttribute('aria-pressed',String(k===st.i)));$$('#scKind .btn').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.sc===st.sc)));}
function phaseText(R){const s=st.sc,i=st.i,inv=st.inv;
  const T={
   0:{halted:'Production at Taiwan’s fabs stops. TSMC makes roughly 90% of the world’s most advanced chips, so the leading edge loses most of its supply in a single day. Markets reprice everything that touches Taiwan before a single shipment is missed.',
      blockade:'Ships and planes can’t get in or out. Finished chips are stranded, and the wafers, chemicals and spare parts fabs consume daily stop arriving. Fabs can keep running for a while on stock, but nothing they make can leave.',
      export:'Chips can’t leave Taiwan, but materials and tools still arrive. Fabs could keep producing for a while, yet every wafer simply piles up in warehouses.',
      import:'Materials and tools can’t enter, but finished chips can still ship. Output continues on stockpiled wafers, chemicals and parts, for about '+inv+' weeks in this model.'},
   1:{halted:'Customers live off chips already in transit and in warehouses. Rack builders outside Taiwan face empty parts bins; Taiwan-based assemblers like Foxconn and Wistron face disruption at home too.',
      blockade:'The pipeline of chips already shipped (boats, warehouses, OEM stock) is the only supply. AI cloud providers start rationing new capacity.',
      export:'Downstream the effect is the same as a halt: no new GPUs. Upstream, tool and materials makers still deliver, but their customers can’t sell anything.',
      import:i>=1&&R.Dl<=0?'Business looks almost normal downstream while inventories drain, but equipment and materials makers have already lost a major market.':'Stockpiles are running low.'},
   2:{halted:'Spot prices for GPUs and HBM spike. Memory is hit too: Micron makes most of its DRAM in Taiwan, and HBM still has to be packaged next to GPUs at TSMC.',
      blockade:'Fabs run out of key inputs and output collapses even for domestic use. Equipment makers lose their largest single customer region.',
      export:'Warehouses in Taiwan fill up, and fabs begin cutting output because nothing ships. Orders for new tools freeze.',
      import:R.Dl>=1?'Inventories are exhausted and output stops. Downstream now looks like a halt.':'Inventories are being drawn down; downstream supply starts to thin.'},
   3:{halted:'Capacity outside Taiwan (TSMC’s Arizona fab, Samsung, Intel) ramps, but it is small, and advanced packaging (CoWoS) has little capacity outside Taiwan. The AI build-out effectively pauses.',
      blockade:'Same as a halt for buyers. Pressure grows for emergency capacity elsewhere; Samsung’s foundry looks relatively better positioned.',
      export:'The chip shortage hits everything from AI racks to cars and phones; the leading edge is gone.',
      import:'Output has stopped; prices of existing GPUs and racks spike, and owners of installed fleets gain pricing power.'},
   4:{halted:'Markets begin to price in rebuilding elsewhere, a process measured in years: new fabs take years to build and qualify.',blockade:'Partial relief is possible if the blockade loosens, but the system has already learned how fragile it is.',export:'If the embargo ends, stranded inventory floods out and prices whipsaw.',import:'Partial relief if inputs resume; fabs need weeks to restart and requalify.'},
   5:{halted:'A year on, the leading edge is still supply-constrained. The model’s market curve eases slightly as investors look toward new capacity, but nothing here is a forecast.',blockade:'A year on, outcomes depend entirely on politics; the model only shows the mechanics of dependence.',export:'A year on, outcomes depend on whether the embargo ended.',import:'A year on, outcomes depend on whether inputs resumed.'}};
  return T[i][s];}
(function(){const k=$('#scKind');Object.entries(SC).forEach(([id,o])=>{const b=document.createElement('button');b.className='btn';b.dataset.sc=id;b.textContent=o.n;b.addEventListener('click',()=>{st.sc=id;draw();});k.appendChild(b);});
  const s=$('#scSteps');LBL.forEach((l,i)=>{const b=document.createElement('button');b.className='btn';b.textContent=l;b.addEventListener('click',()=>{stop();st.i=i;draw();});s.appendChild(b);});
  $('#scPeak').addEventListener('input',e=>{st.peak=+e.target.value;$('#scPeakV').textContent=st.peak+'%';draw();});
  $('#scInv').addEventListener('input',e=>{st.inv=+e.target.value;$('#scInvV').textContent=st.inv+' weeks';draw();});
  let tm=null;window.stopScen=stop;function stop(){if(tm){clearInterval(tm);tm=null;}$('#scPlay').textContent='▶ Play scenario';$('#scPlay').setAttribute('aria-pressed','false');}
  $('#scPlay').addEventListener('click',()=>{if(tm){stop();return;}st.i=0;draw();$('#scPlay').textContent='❚❚ Pause';$('#scPlay').setAttribute('aria-pressed','true');tm=setInterval(()=>{if(st.i>=LBL.length-1){stop();return;}st.i++;draw();},2200);});
  // assumptions table
  $('#scTable').innerHTML='<tr><th>Company</th><th>Needs Taiwan output</th><th>Sells into Taiwan</th><th>Sector beta</th><th>Why</th></tr>'+D.meta.filter(m=>EXP[m.k]&&m.t).map(m=>{const e=EXP[m.k];return`<tr><td>${m.n}${TW.has(m.k)?' <span class="illus">TW</span>':''}</td><td>${Math.round(e[0]*100)}%</td><td>${Math.round(e[1]*100)}%</td><td>${m.beta}</td><td>${e[2]}</td></tr>`;}).join('');
  draw();})();
})();
