/* Sector Pulse — replay engine. Data: window.PULSE_DATA (built from Yahoo Finance bars). */
(function(){
'use strict';
const D=window.PULSE_DATA, NS='http://www.w3.org/2000/svg';
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const COL={cyan:'#3fd6ff',violet:'#a77bff',teal:'#2fe0b4',coral:'#ff6b6b',amber:'#ffb547',white:'#f4f7ff',ti:'#8b97ad',muted:'#9aa8c4',line:'#22304f'};
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function el(t,a,p){const e=document.createElementNS(NS,t);for(const k in a)if(a[k]!=null)e.setAttribute(k,a[k]);p&&p.appendChild(e);return e;}
function tx(p,x,y,s,a){const t=el('text',Object.assign({x,y,class:'svglbl'},a||{}),p);t.textContent=s;return t;}
function clear(s){while(s.firstChild)s.removeChild(s.firstChild);}
const M={};D.meta.forEach(m=>M[m.k]=m);
const fmt=v=>v==null?'—':(v>0?'+':'')+v.toFixed(1)+'%';
function mix(a,b,t){const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));const A=p(a),B=p(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('');}
function heat(v){if(v==null)return'#1a2238';const t=Math.max(-1,Math.min(1,v/10));return t<0?mix('#1a2442','#ff6b6b',Math.pow(-t,.7)):mix('#1a2442','#2fe0b4',Math.pow(t,.7));}
const ROLE={eda:'EDA software',design:'Chip design',tool:'Equipment',mat:'Materials',fab:'Foundry',mem:'Memory (own fabs)',test:'Test equipment',int:'System integration',cust:'AI cloud customer'};

/* ---------- events (UTC) with sources ---------- */
const EV=[
 {t:'2026-11-04T21:00Z',l:'Nov 4',h:'After the close: Qualcomm guides weak; chip and data-center stocks already sliding into the midterm aftermath',src:[['StockAnalysis: Nasdaq 100 falls as chip stocks slide','https://stockanalysis.com/news/nasdaq-100-falls-chip-stocks-slide/']]},
 {t:'2026-11-05T14:30Z',l:'Nov 5 crash',h:'Chip stocks have their second-worst day on record: the PHLX Semiconductor Index falls 12.25%, erasing ~$1.5T. Nvidia −9.3%, AMD −17.3%',study:'2026-11-05',src:[['24/7 Wall St.: Chip stocks’ second-worst day on record','https://247wallst.com/investing/2026/11/06/chip-stocks-just-had-their-second-worst-day-on-record/'],['Trefis: What sent Nvidia lower (no company-specific news)','https://www.trefis.com/stock/nvda/articles/623357/what-sent-nvidia-stock-lower/2026-11-06']]},
 {t:'2026-11-09T00:00Z',l:'Huang news',h:'Sun Nov 8 (US evening): Jensen Huang confirms an affair; Nvidia confirms an investigation amid reports the woman was allegedly spying for Beijing',src:[['Fast Company','https://fastcompany.com/91638448/nvidia-stock-falling-today-jensen-huang-affair-spy-scandal-rocks-ai']]},
 {t:'2026-11-09T14:30Z',l:'Nov 9',h:'Nvidia falls as much as 8.8%, closes about 4.3% lower (~$192B). The broader market rallies; AMD jumps 10%+ on a Google deal and an upgrade',study:'2026-11-09',src:[['TweakTown','https://www.tweaktown.com/rss/click/news/114589/?c=news-mf'],['Al Jazeera','https://www.aljazeera.com/economy/2026/11/9/nvidia-shares-slump-amid-investigation-into-ceo-jensen-huang']]},
 {t:'2026-11-10T13:00Z',l:'Report',h:'The Information reports the relationship may have helped move ≥$7.5B of chips to Chinese firms. Allegations; Reuters could not verify. Nvidia −5.5%',study:'2026-11-10',src:[['Motley Fool','https://www.fool.com/investing/2026/11/10/why-nvidia-stock-just-fell-again/']]},
 {t:'2026-11-10T21:30Z',l:'CoreWeave',h:'After the close: CoreWeave beats on revenue and raises 2026 guidance, signaling a pullback from heavy borrowing',src:[['CNBC via BizToc','https://biztoc.com/x/c2bdd2a059b735dc']]},
 {t:'2026-11-12T13:00Z',l:'Huang resigns',h:'Nvidia announces Jensen Huang has resigned, effective immediately; CFO Colette Kress is interim CEO (8-K dated Nov 12; exact release time not verified, but the stock opened ~5% lower). Nvidia −4.3% while AMD and Broadcom rose ~5–6%',study:'2026-11-12',src:[['Nvidia 8-K: CEO transition (SEC)','https://www.sec.gov/Archives/edgar/data/0001045810/000104581026000082/nvidiaannouncesceotransiti.htm']]},
 {t:'2026-11-11T14:30Z',l:'Rebound',h:'CoreWeave jumps (closes +24.7%), igniting a rally in AI cloud and memory names; Nvidia +2.9%',study:'2026-11-11',src:[['Reuters via The Star','https://www.thestar.com.my/tech/tech-news/2026/11/11/coreweave-sparks-ai-cloud-stock-rally-lifts-nvidia-as-results-ease-bubble-fears'],['Archyde','https://www.archyde.com/coreweave-revenue-hits-3-66-billion-nasdaq-gains-1-60/']]}];
EV.sort((a,b)=>Date.parse(a.t)-Date.parse(b.t));
const NEXT={h:'Next scheduled catalyst: Nvidia, now under an interim CEO, reports fiscal Q3 2027 results on Tue Nov 17 (~1:20 p.m. PT; call 2 p.m. PT).',src:['Nvidia 8-K (SEC)','https://www.sec.gov/Archives/edgar/data/0001045810/000104581026000082/nvidiaannouncesceotransiti.htm']};
$('#srcList').innerHTML=EV.flatMap(e=>e.src).concat([NEXT.src]).map(s=>`<li><a href="${s[1]}">${s[0]}</a></li>`).join('');

/* ---------- time index ---------- */
const G=D.grid, Gt=G.map(s=>Date.parse(s));
const H={};Object.keys(D.hourly).forEach(k=>{H[k]=D.hourly[k].map(r=>[Date.parse(r[0]),r[1]]);});
function valAt(k,ti){const a=H[k];if(!a)return null;const T=Gt[ti];let lo=-1;for(let i=0;i<a.length&&a[i][0]<=T;i++)lo=i;if(lo<0)return null;return{v:a[lo][1],age:(T-a[lo][0])/36e5,fresh:a[lo][0]===T};}
const MK=[['NYSE/Nasdaq','nv'],['Tokyo','tel'],['Taipei','fox'],['Seoul','hynix']];

/* ---------- pulse map ---------- */
const svg=$('#pmap');
const defs=el('defs',null,svg);const f=el('filter',{id:'gl',x:'-50%',y:'-50%',width:'200%',height:'200%'},defs);el('feGaussianBlur',{stdDeviation:5,result:'b'},f);const mg=el('feMerge',null,f);el('feMergeNode',{in:'b'},mg);el('feMergeNode',{in:'SourceGraphic'},mg);
const gG=el('g',null,svg),gE=el('g',null,svg),gP=el('g',null,svg),gN=el('g',null,svg);
const groups=[[['cdn','snps','nv','amd','avgo'],'DESIGN (FABLESS)',COL.cyan],[['amat','lam','tel','asml','kla','disco'],'EQUIPMENT',COL.ti],[['shin','sumco','jsr','ajin','ibiden','unim'],'MATERIALS',COL.white],[['tsmc'],'FAB + PACKAGING',COL.violet],[['hynix','mu','sams'],'MEMORY (OWN FABS)',COL.violet],[['adv','ter'],'TEST',COL.coral],[['fox','wis'],'INTEGRATION',COL.teal],[['crwv'],'CUSTOMER',COL.cyan]];
groups.forEach(g=>{const xs=g[0].map(k=>M[k].x),ys=g[0].map(k=>M[k].y);const pad=g[0].includes('tsmc')?100:78;const x0=Math.min(...xs)-pad,x1=Math.max(...xs)+pad,y0=Math.min(...ys)-46,y1=Math.max(...ys)+32;
  el('rect',{x:x0,y:y0,width:x1-x0,height:y1-y0,rx:14,fill:'#0b1430',opacity:.55,stroke:g[2],'stroke-opacity':.2,'stroke-dasharray':'3 5'},gG);tx(gG,x0+10,y0+14,g[1],{fill:g[2],'font-size':10});});
const edgeEls=D.edges.map(e=>{const A=M[e[0]],B=M[e[1]];const mx=(A.x+B.x)/2;const d=`M${A.x},${A.y} C${mx},${A.y} ${mx},${B.y} ${B.x},${B.y}`;
  const c=e[3]==null?0:e[3];const p=el('path',{d,fill:'none',stroke:'#3a4a72','stroke-width':1+Math.max(0,c)*5,'stroke-opacity':.25+Math.max(0,c)*.5},gE);return{e,p,d};});
const nodeEls={};
D.meta.forEach(m=>{const g=el('g',{class:'wnode',tabindex:0,role:'button','aria-label':m.n},gN);const w=Math.max(112,m.n.length*7.6+24),h=44;
  const r=el('rect',{x:m.x-w/2,y:m.y-h/2,width:w,height:h,rx:8,fill:'#101b38',stroke:'#3a4a72','stroke-width':1.2},g);
  tx(g,m.x,m.y-4,m.n,{'text-anchor':'middle',class:'svgtitle','font-size':12.5});const v=tx(g,m.x,m.y+13,'',{'text-anchor':'middle','font-size':11,fill:COL.white});
    nodeEls[m.k]={g,r,v,w,h};
  const sel=()=>{selNode=selNode===m.k?null:m.k;render();};g.addEventListener('click',sel);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();sel();}});});
let selNode=null,cur=0,prevVals={},LIVE=null,mode='replay';
function liveVal(k){const r=LIVE&&LIVE.rows[k];return r?{v:r.pct,age:r.ageH,fresh:r.ageH<1.01}:null;}
function render(){
  const ti=cur,vals={},L=mode==='live';D.meta.forEach(m=>vals[m.k]=L?liveVal(m.k):valAt(m.k,ti));const smh=L?liveVal('smh'):valAt('smh',ti),spx=L?liveVal('spx'):valAt('spx',ti);
  D.meta.forEach(m=>{const n=nodeEls[m.k],x=vals[m.k];const v=x&&x.v;n.r.setAttribute('fill',heat(v));
    n.r.setAttribute('stroke',selNode===m.k?COL.white:(x&&x.fresh?mix('#3a4a72','#ffffff',.5):'#3a4a72'));n.r.setAttribute('stroke-dasharray',x&&x.age>1.5?'4 3':'');n.r.setAttribute('stroke-width',selNode===m.k?2.5:1.2);
    n.v.textContent=m.t?(m.t.replace('^','')+'  '+(x?fmt(v):'no data')):'not listed';const dark=v!=null&&Math.abs(v)>=5;n.v.style.fill=dark?'#06101e':COL.white;n.v.style.fontWeight=dark?'700':'400';n.g.querySelector('.svgtitle').style.fill=dark?'#06101e':'#f4f7ff';
    const dim=selNode&&selNode!==m.k&&!D.edges.some(e=>(e[0]===selNode&&e[1]===m.k)||(e[1]===selNode&&e[0]===m.k));n.g.setAttribute('opacity',dim?.3:1);});
  // edges: glow when both ends moved the same way strongly in fresh bars
  clear(gP);
  edgeEls.forEach(o=>{const a=vals[o.e[0]],b=vals[o.e[1]];const act=!selNode||o.e[0]===selNode||o.e[1]===selNode;o.p.setAttribute('opacity',act?1:.15);
    if(a&&b&&(a.fresh||b.fresh)&&Math.abs(a.v)>2&&Math.abs(b.v)>2&&Math.sign(a.v)===Math.sign(b.v)&&act){
      const c=a.v<0?COL.coral:COL.teal;el('path',{d:o.d,fill:'none',stroke:c,'stroke-width':2.5,opacity:.75,filter:'url(#gl)'},gP);
      if(!reduced){const dot=el('circle',{r:4,fill:c},gP);el('animateMotion',{dur:'1.6s',repeatCount:'indefinite',path:o.d},dot);}}});
  // shock rings on big hour-over-hour changes
  D.meta.forEach(m=>{const x=vals[m.k],p=prevVals[m.k];if(x&&p&&x.fresh&&Math.abs(x.v-p.v)>=2){const c=x.v<p.v?COL.coral:COL.teal;const r=el('circle',{cx:m.x,cy:m.y,r:30,fill:'none',stroke:c,'stroke-width':2,opacity:.8},gP);
    if(!reduced){el('animate',{attributeName:'r',from:28,to:70,dur:'1.4s',repeatCount:'indefinite'},r);el('animate',{attributeName:'opacity',from:.8,to:0,dur:'1.4s',repeatCount:'indefinite'},r);}}});
  prevVals=vals;
  // clock
  const T=L?new Date(Date.parse(LIVE.builtAt)):new Date(Gt[ti]);$('#clockUtc').textContent=(L?'LIVE · updated ':'')+T.toISOString().slice(0,16).replace('T',' ')+' UTC';
  const o=(z)=>T.toLocaleString('en-US',{timeZone:z,weekday:'short',hour:'numeric',minute:'2-digit'});$('#clockLocal').textContent=`New York ${o('America/New_York')} · Tokyo ${o('Asia/Tokyo')}`;
  $('#mkts').innerHTML=MK.map(([n,k])=>{const x=vals[k];return`<span class="${x&&x.age<1.01?'open':''}">${n}</span>`;}).join('');
  // now readout
  if(selNode){const m=M[selNode],x=vals[selNode];const nb=D.edges.filter(e=>e[0]===selNode||e[1]===selNode).map(e=>e[0]===selNode?e[1]:e[0]);
    $('#nowRead').innerHTML=`<h4>${m.n} · ${ROLE[m.role]} · ${m.cc}</h4><p>${m.t?`At this moment: <b>${x?fmt(x.v):'no bar yet'}</b> vs. previous close. Sector beta ${m.beta??'—'} (moves ~${m.beta??'?'}× the chip ETF on a typical day); beta to Nvidia ${m.bnv??'—'}.`:'Privately held: no market price, but still a supplier in the chain.'}</p><p style="margin-top:8px">Linked to: ${nb.map(k=>`${M[k].n} <span class=m>(${vals[k]?fmt(vals[k].v):'—'})</span>`).join(', ')}.</p>`;}
  else{const live=D.meta.filter(m=>vals[m.k]&&vals[m.k].age<1.01);const ups=live.filter(m=>vals[m.k].v>0).length;const sorted=[...D.meta].filter(m=>vals[m.k]).sort((a,b)=>vals[a.k].v-vals[b.k].v);
    const nv=vals.nv;const gap=nv&&smh?nv.v-smh.v:null;
    $('#nowRead').innerHTML=`<h4>Right now on the map</h4><p>Chip ETF (SMH): <b>${smh?fmt(smh.v):'—'}</b> · S&amp;P 500: ${spx?fmt(spx.v):'—'}<br>Trading this hour: ${live.length} companies, ${ups} up / ${live.length-ups} down.<br>Weakest: ${sorted.slice(0,2).map(m=>`${m.n} ${fmt(vals[m.k].v)}`).join(', ')}<br>Strongest: ${sorted.slice(-2).reverse().map(m=>`${m.n} ${fmt(vals[m.k].v)}`).join(', ')}${gap!=null&&Math.abs(gap)>3?`<br><b style="color:${COL.amber}">Nvidia is ${Math.abs(gap).toFixed(1)} pts ${gap<0?'below':'above'} the chip ETF</b>, a sign of a company-specific move.`:''}</p><p class=m style="margin-top:6px;font-size:13px">Tap a company to trace its links.</p>`;}
  if(L){liveSide(vals,smh);return;}
  // news
  const past=EV.filter(e=>Date.parse(e.t)<=Gt[ti]);const e=past[past.length-1];
  $('#newsRead').innerHTML=e?`<h4>Latest headline · ${e.l}</h4><p>${e.h}</p><p style="margin-top:6px">${e.src.map(s=>`<a href="${s[1]}">${s[0]}</a>`).join(' · ')}</p>`:'<h4>Headlines</h4><p>Event markers appear as the replay reaches them.</p>';
  $('#t').value=ti;$('#t').setAttribute('aria-valuetext',T.toISOString().slice(0,16)+' UTC');}
const rng=$('#t');rng.max=G.length-1;rng.addEventListener('input',()=>{cur=+rng.value;render();});
// event markers + buttons
const t0=Gt[0],t1=Gt[Gt.length-1];
EV.forEach(e=>{const T=Date.parse(e.t);if(T<t0||T>t1)return;const pos=(T-t0)/(t1-t0)*100;const i=document.createElement('i');i.style.left=pos+'%';i.dataset.l=e.l;$('#evMarks').appendChild(i);
  const b=document.createElement('button');b.className='btn';b.textContent=e.l;b.addEventListener('click',()=>{let k=Gt.findIndex(x=>x>=T);if(k<0)k=G.length-1;stop();cur=k;render();if(e.study)setStudy(e.study,false);});$('#evBtns').appendChild(b);});
let timer=null,speed=1;const SP=[1,2,4];
function stop(){if(timer){clearInterval(timer);timer=null;}$('#play').textContent='▶ Play replay';$('#play').setAttribute('aria-pressed','false');}
$('#play').addEventListener('click',()=>{if(timer){stop();return;}$('#play').textContent='❚❚ Pause';$('#play').setAttribute('aria-pressed','true');if(cur>=G.length-1)cur=0;timer=setInterval(()=>{cur++;if(cur>=G.length-1){cur=G.length-1;render();stop();return;}render();},900/speed);});
$('#speed').addEventListener('click',()=>{speed=SP[(SP.indexOf(speed)+1)%3];$('#speed').textContent='Speed '+speed+'×';if(timer){stop();$('#play').click();}});

/* ---------- heat matrix ---------- */
const ORDER=['cdn','snps','nv','amd','avgo','amat','lam','kla','asml','tel','disco','shin','sumco','ajin','ibiden','unim','tsmc','hynix','mu','sams','adv','ter','fox','wis','crwv'];
const days=D.usDays;let studyDay='2026-11-09';
function drawHM(){const s=$('#hm');clear(s);const x0=150,y0=40,cw=(1240-x0-20)/days.length,ch=(660-y0-30)/(ORDER.length+2);
  days.forEach((d,j)=>{const ev=EV.find(e=>e.study===d);tx(s,x0+j*cw+cw/2,y0-8,d.slice(5),{'text-anchor':'middle','font-size':9.5,fill:ev?COL.amber:COL.muted});if(d===studyDay)el('rect',{x:x0+j*cw,y:y0-2,width:cw,height:(ORDER.length+2)*ch+4,fill:'none',stroke:COL.white,'stroke-width':1.5,rx:3},s);});
  const rows=ORDER.map(k=>[k,M[k].n+(M[k].asia?' ↳':''),D.aligned[k]||{}]);
  const smh={},spx={};D.daily.smh.forEach(r=>smh[r[0]]=r[2]);D.daily.spx.forEach(r=>spx[r[0]]=r[2]);
  rows.push(['smh','Chip ETF (SMH)',smh]);rows.push(['spx','S&P 500',spx]);
  rows.forEach((r,i)=>{const y=y0+i*ch+(i>=ORDER.length?8:0);tx(s,x0-8,y+ch/2+4,r[1],{'text-anchor':'end','font-size':10.5,fill:i>=ORDER.length?COL.amber:COL.white});
    days.forEach((d,j)=>{const v=r[2][d];const c=el('rect',{x:x0+j*cw+1,y:y+1,width:cw-2,height:ch-2,rx:2,fill:heat(v==null?null:v),style:'cursor:pointer'},s);
      const t=el('title',null,c);t.textContent=`${r[1].replace(' ↳','')} · ${d}: ${v==null?'no data':fmt(v)}`;c.addEventListener('click',()=>setStudy(d,true));
      if(v!=null&&Math.abs(v)>=6)tx(s,x0+j*cw+cw/2,y+ch/2+3.5,Math.round(v),{'text-anchor':'middle','font-size':8.5,fill:'#fff','pointer-events':'none'});});});
  tx(s,x0,650,'↳ Tokyo / Taipei / Seoul listing: shown under the US session it follows (its next local trading day).',{'font-size':10,fill:COL.muted});}

/* ---------- event study ---------- */
function setStudy(d,scroll){studyDay=d;drawHM();drawBars();$$('#stBtns .btn').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.d===d)));if(scroll)$('#study').scrollIntoView({behavior:reduced?'auto':'smooth'});}
function drawBars(){const S=D.studies[studyDay];const s=$('#bars');clear(s);$('#stDay').textContent=studyDay;if(!S)return;
  const rows=[...S.rows].sort((a,b)=>a[3]-b[3]);const x0=330,sc=14,rh=(760-50)/rows.length;
  el('line',{x1:x0,x2:x0,y1:20,y2:745,stroke:COL.ti,'stroke-opacity':.5},s);[-20,-10,10,20].forEach(v=>{el('line',{x1:x0+v*sc/1.4,x2:x0+v*sc/1.4,y1:20,y2:745,stroke:COL.line,'stroke-dasharray':'2 4'},s);tx(s,x0+v*sc/1.4,16,(v>0?'+':'')+v+'%',{'text-anchor':'middle','font-size':9});});
  rows.forEach((r,i)=>{const m=M[r[0]],y=30+i*rh,k=sc/1.4;const a=r[1],e=r[2],g=r[3];
    tx(s,8,y+rh/2+4,m.n,{'font-size':10.5,fill:COL.white});
    el('rect',{x:Math.min(x0,x0+a*k),y:y+2,width:Math.abs(a*k),height:rh-5,rx:2,fill:a<0?COL.coral:COL.teal,opacity:.8},s);
    el('line',{x1:x0+e*k,x2:x0+e*k,y1:y,y2:y+rh-1,stroke:COL.white,'stroke-width':2},s);
    tx(s,630,y+rh/2+4,(g>0?'+':'')+g.toFixed(1),{'text-anchor':'end','font-size':10,fill:Math.abs(g)>=4?COL.amber:COL.muted});});
  tx(s,630,745,'gap vs. expected (pts)',{'text-anchor':'end','font-size':9,fill:COL.muted});
  // verdict
  const sm=S.smh,n=S.rows.length,same=S.rows.filter(r=>Math.sign(r[1])===Math.sign(sm)).length,med=[...S.rows.map(r=>Math.abs(r[3]))].sort((a,b)=>a-b)[Math.floor(n/2)];
  const lo=rows[0],hi=rows[rows.length-1];let v,h;
  if(Math.abs(sm)>=3&&same/n>=.75){h='Systemic: the network moved as one';v=`The chip ETF moved ${fmt(sm)} and ${same} of ${n} companies moved the same way. The typical company landed within ~${med.toFixed(1)} pts of what its sector beta implied, so this was a shared, sector-wide repricing that transmitted across design, equipment, materials and memory alike.`;}
  else if(Math.abs(lo[3])>=4||Math.abs(hi[3])>=4){const big=Math.abs(lo[3])>=Math.abs(hi[3])?lo:hi;h=`Company-specific: ${M[big[0]].n} broke from the pack`;v=`The chip ETF moved ${fmt(sm)}, but ${M[big[0]].n} moved ${fmt(big[1])}, about ${Math.abs(big[3]).toFixed(1)} pts ${big[3]<0?'worse':'better'} than its sector sensitivity implied. ${same} of ${n} companies followed the sector's direction instead, so the shock did <em>not</em> cascade through the supply chain.`+(lo[3]<-4&&hi[3]>4?` At the other extreme, ${M[hi[0]].n} beat expectations by ${hi[3].toFixed(1)} pts, consistent with money rotating within the sector.`:'');}
  else{h='An ordinary day';v=`The chip ETF moved ${fmt(sm)}; no company strayed more than ~4 pts from its expected move.`;}
  const ev=EV.find(e=>e.study===studyDay);
  $('#stRead').innerHTML=`<h4>${h}</h4><p>${v}</p>${ev?`<p style="margin-top:8px"><b>News that day:</b> ${ev.h}</p>`:''}`;}
(function(){const b=$('#stBtns');[['2026-11-05','Nov 5 · sector crash'],['2026-11-09','Nov 9 · Huang news'],['2026-11-10','Nov 10 · chip-flow report'],['2026-11-11','Nov 11 · CoreWeave rebound'],['2026-11-12','Nov 12 · Huang resigns']].forEach(([d,l])=>{const x=document.createElement('button');x.className='btn';x.dataset.d=d;x.textContent=l;x.addEventListener('click',()=>setStudy(d,false));b.appendChild(x);});})();

/* ---------- correlation matrix ---------- */
(function(){const s=$('#cm');const K=ORDER.filter(k=>D.corr.keys.includes(k));const idx=k=>D.corr.keys.indexOf(k);const x0=132,y0=120,c=(640-x0-10)/K.length;
  const seq=v=>v<0?'#1a2238':v<.5?mix('#16203c','#1d5a7c',v/.5):mix('#1d5a7c','#bff4ff',(v-.5)/.5);
  K.forEach((a,i)=>{tx(s,x0-6,y0+i*c+c/2+3,M[a].n,{'text-anchor':'end','font-size':8.5,fill:COL.white});const t=tx(s,0,0,M[a].n,{'font-size':8.5,fill:COL.white,transform:`translate(${x0+i*c+c/2+3},${y0-6}) rotate(-60)`});
    K.forEach((b,j)=>{const v=D.corr.v[idx(a)][idx(b)];const r=el('rect',{x:x0+j*c+.5,y:y0+i*c+.5,width:c-1,height:c-1,fill:seq(v),tabindex:-1},s);
      const show=()=>{$('#corrRead').innerHTML=`<h4>${M[a].n} ↔ ${M[b].n}: ${v.toFixed(2)}</h4><p>${a===b?'A company is perfectly correlated with itself.':v>=.7?'These two have moved nearly in lockstep: a shock to one has usually shown up in the other the same session.':v>=.45?'Moderately linked: they often move together, but not always.':'Loosely linked: news for one has often not moved the other.'}</p>`;};
      r.addEventListener('mouseenter',show);r.addEventListener('click',show);});});
  // NVDA strongest partners
  const nv=idx('nv');const best=K.filter(k=>k!=='nv').map(k=>[k,D.corr.v[nv][idx(k)]]).sort((a,b)=>b[1]-a[1]);
  window.__nvBest=best;})();
(function(){const L=Object.entries(D.lag).map(([t,v])=>[D.meta.find(m=>m.t===t),v]).filter(x=>x[0]);const better=L.filter(([m,v])=>v.nextSession-v.sameDate>=.1);
  $('#lagText').innerHTML=`Mostly no. For most Asian listings, the correlation with the US chip ETF is about the same whether you match them to the same calendar date or to the US session just before (typically ~0.4 either way), so information flows in both directions. The exceptions, where the previous US session explains noticeably more: ${better.map(([m,v])=>`${m.n} (${v.sameDate.toFixed(2)} → ${v.nextSession.toFixed(2)})`).join(', ')}.`;})();

/* ---------- watch cards ---------- */
(function(){const ms=D.meta.filter(m=>m.beta!=null);const hiB=[...ms].sort((a,b)=>b.beta-a.beta).slice(0,5),loB=[...ms].sort((a,b)=>a.beta-b.beta).slice(0,5);const nb=window.__nvBest.slice(0,4);
  const st9=D.studies['2026-11-09'];const up9=st9.rows.filter(r=>r[1]>0).length;
  const cards=[['Amplifiers',`In sector-wide moves these have swung the most relative to the chip ETF (6-month beta): ${hiB.map(m=>`${m.n} ${m.beta}`).join(', ')}. When the whole map turns one color, expect them to be the deepest shade.`],
   ['Shock absorbers',`Lowest sector sensitivity: ${loB.map(m=>`${m.n} ${m.beta}`).join(', ')}. EDA software and diversified materials makers have typically moved least on chip-sector days.`],
   ['Nvidia-only vs. sector shocks',`Nvidia's own beta to the chip ETF is just ${M.nv.beta}, and its closest co-movers are ${nb.map(([k,v])=>`${M[k].n} (${v.toFixed(2)})`).join(', ')}. On Nov 9, while Nvidia fell, ${up9} of ${st9.rows.length} companies on the map rose; on Nov 12, the day Huang resigned, AMD and Broadcom again beat their sector-implied moves by 6–7 pts. So far, the leadership shock has stayed with Nvidia. ${NEXT.h} <a href="${NEXT.src[1]}">Source</a>`]];
  $('#watchCards').innerHTML=cards.map(c=>`<div class="card"><h5>${c[0]}</h5><p>${c[1]}</p></div>`).join('');})();


/* ---------- live mode ---------- */
function ago(iso){const m=Math.round((Date.now()-Date.parse(iso))/60000);return m<90?m+' min ago':Math.round(m/60)+' h ago';}
function liveSide(vals,smh){
  const rows=Object.entries(LIVE.rows).filter(([k])=>M[k]);const ex=rows.filter(([k,r])=>r.excess!=null).sort((a,b)=>a[1].excess-b[1].excess);
  const lo=ex[0],hi=ex[ex.length-1];const fresh=rows.filter(([k,r])=>r.ageH<1.01).length;
  let verdict;if(LIVE.alerts.length)verdict=LIVE.alerts.map(a=>`<b style="color:${COL.amber}">● ${a.msg}</b>`).join('<br>');
  else verdict=`No notable break: every company is within ~4 pts of what its sector beta implies, and the chip ETF hasn't moved ≥3% as a block.`;
  const watch=LIVE.watch&&LIVE.watch.length?`<p style="margin-top:8px"><b>Next Asian session, if history holds:</b> ${LIVE.watch.slice(0,4).map(w=>`${w.n} ~${w.impl>0?'+':''}${w.impl}% <span class=m>(corr ${w.corr})</span>`).join(', ')}. <span class=m>Beta-implied pattern, not a forecast.</span></p>`:'';
  $('#nowRead').innerHTML=`<h4>Live read · ${ago(LIVE.builtAt)}</h4><p>Chip ETF (SMH): <b>${fmt(LIVE.smh)}</b> · S&amp;P 500: ${fmt(LIVE.spx)} · ${fresh} companies trading now.<br>Furthest below its sector-implied move: ${lo?`${M[lo[0]].n} (${fmt(lo[1].pct)}, gap ${lo[1].excess.toFixed(1)} pts)`:'—'}<br>Furthest above: ${hi?`${M[hi[0]].n} (${fmt(hi[1].pct)}, gap +${hi[1].excess.toFixed(1)} pts)`:'—'}</p><p style="margin-top:8px">${verdict}</p>${watch}`;
  $('#newsRead').innerHTML=`<h4>Latest headlines</h4>`+(LIVE.news||[]).slice(0,6).map(n=>`<p style="margin:0 0 7px;font-size:13.5px"><a href="${n.link}">${n.title.replace(/</g,'&lt;')}</a> <span class=m>· ${ago(n.t)}</span></p>`).join('');}
function setMode(m){mode=m;$$('#modeBtns .btn').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.m===m)));$('.scrub').style.display=m==='live'?'none':'';if(m==='live')stop();prevVals={};render();}
(function(){const box=document.createElement('div');box.className='ctl';box.id='modeBtns';box.setAttribute('role','group');box.setAttribute('aria-label','Mode');box.style.margin='0 0 12px';
  box.innerHTML='<button class="btn" data-m="replay" aria-pressed="true">Replay: Nov 3–13</button><button class="btn t" data-m="live" aria-pressed="false" disabled>Live now</button>';
  $('#replay .wrap').insertBefore(box,$('.replay-grid'));box.querySelectorAll('.btn').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.m)));})();
function applyLive(raw){try{const d=raw&&(typeof raw.data==='function'?raw.data():raw);if(!d)return;if(d.json)LIVE=JSON.parse(d.json);else if(d.builtAt&&d.rows)LIVE=d;else return;LIVE.alerts=LIVE.alerts||[];LIVE.news=LIVE.news||[];}catch(e){return;}
  const age=(Date.now()-Date.parse(LIVE.builtAt))/36e5;const b=$('#liveBadge');b.className='badge'+(age<2?' live':'');b.innerHTML=`<i></i>Live feed: ${age<2?'connected':'last update'} · ${ago(LIVE.builtAt)}`;
  const lb=$('#modeBtns [data-m="live"]');lb.disabled=false;
  $('#liveText').innerHTML=`Refreshed hourly during US and Asian sessions (weekdays). Last snapshot ${ago(LIVE.builtAt)}. ${LIVE.alerts.length?'<b style="color:#ffb547">Active alerts: '+LIVE.alerts.map(a=>a.msg).join('; ')+'</b>':'No active alerts.'} <span class=m>Source: ${LIVE.source}.</span>`;
  if(mode==='live')render();}
(function(){const b=$('#liveBadge');const say=t=>{if(!LIVE)b.innerHTML='<i></i>Live feed: '+t;};
  async function pull(){try{const r=await fetch('assets/live.json',{cache:'no-store'});if(!r.ok){say('no live snapshot yet · historical replay');return;}const d=await r.json();applyLive(d);}catch(e){say('unavailable here ('+(e&&e.message||e)+') · historical replay');}}
  say('connecting…');pull();setInterval(pull,5*60*1000);})();

/* ---------- init ---------- */
cur=Math.max(0,Gt.findIndex(x=>x>=Date.parse('2026-11-09T14:30Z')));
render();drawHM();setStudy('2026-11-09',false);
window.__pulse={render,setStudy,get cur(){return cur},set cur(v){cur=v;render();}};
})();
