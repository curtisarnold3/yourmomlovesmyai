/* WHO ACTUALLY MAKES AI CHIPS? — interaction + illustration engine
   All illustrations are generated SVG; all explanatory text lives in HTML/DOM. */
(function(){
'use strict';
const NS='http://www.w3.org/2000/svg';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const C=Math.cos(Math.PI/6), S=0.5;
const COL={bg:'#060b18',panel:'#0e1830',line:'#22304f',line2:'#2f4068',graphite:'#2a3346',ti:'#8b97ad',text:'#e9eef8',muted:'#9aa8c4',
  cyan:'#3fd6ff',amber:'#ffb547',violet:'#a77bff',teal:'#2fe0b4',coral:'#ff6b6b',white:'#f4f7ff',si:'#7c8db5',copper:'#d9905a'};

/* ---------------- motion preference ---------------- */
const mq=window.matchMedia('(prefers-reduced-motion: reduce)');
let reduced=mq.matches;
try{ const s=localStorage.getItem('aichips-motion'); if(s) reduced=(s==='off'); }catch(e){}
const mt=$('#motiontoggle');
function applyMotion(){document.documentElement.classList.toggle('reduce-motion',reduced);document.body.classList.toggle('reduce-motion',reduced);
  mt.textContent='Motion: '+(reduced?'off':'on');mt.setAttribute('aria-pressed',String(reduced));
  $$('svg').forEach(s=>{try{reduced?s.pauseAnimations():s.unpauseAnimations()}catch(e){}});}
mt.addEventListener('click',()=>{reduced=!reduced;try{localStorage.setItem('aichips-motion',reduced?'off':'on')}catch(e){};applyMotion();});

/* ---------------- svg helpers ---------------- */
function el(tag,attrs,parent){const e=document.createElementNS(NS,tag);if(attrs)for(const k in attrs){if(attrs[k]!==undefined&&attrs[k]!==null)e.setAttribute(k,attrs[k]);}if(parent)parent.appendChild(e);return e;}
function txt(parent,x,y,str,cls,attrs){const t=el('text',Object.assign({x,y,class:cls||'svglbl'},attrs||{}),parent);t.textContent=str;return t;}
function clear(s){while(s.firstChild)s.removeChild(s.firstChild);}
function hex2rgb(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return[(n>>16)&255,(n>>8)&255,n&255];}
function shade(h,f){const[r,g,b]=hex2rgb(h);const m=v=>Math.round(f>=0?v+(255-v)*f:v*(1+f));return'#'+[m(r),m(g),m(b)].map(v=>Math.max(0,Math.min(255,v)).toString(16).padStart(2,'0')).join('');}
function P(o,x,y,z){return[o.x+(x-y)*C*o.s,o.y+(x+y)*S*o.s-z*o.s];}
function pts(o,arr){return arr.map(p=>P(o,p[0],p[1],p[2]).map(v=>v.toFixed(1)).join(',')).join(' ');}
/* isometric box: visible faces top, front-left (y+d), front-right (x+w) */
function box(parent,o,b){
  const {x,y,z,w,d,h}=b, c=b.c||COL.graphite, g=el('g',{class:b.cls||null,opacity:b.op},parent);
  const sw=b.sw===undefined?0.8:b.sw, st=b.stroke||shade(c,.35);
  el('polygon',{points:pts(o,[[x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+h],[x,y+d,z+h]]),fill:b.cL||shade(c,-.18),stroke:st,'stroke-width':sw,'stroke-opacity':.55},g);
  el('polygon',{points:pts(o,[[x+w,y,z],[x+w,y+d,z],[x+w,y+d,z+h],[x+w,y,z+h]]),fill:b.cR||shade(c,-.42),stroke:st,'stroke-width':sw,'stroke-opacity':.55},g);
  el('polygon',{points:pts(o,[[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]]),fill:b.cT||shade(c,.12),stroke:st,'stroke-width':sw,'stroke-opacity':.8},g);
  return g;}
function plane(parent,o,x,y,z,w,d,attrs){return el('polygon',Object.assign({points:pts(o,[[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z]])},attrs),parent);}
function line3(parent,o,a,b,attrs){const p=P(o,...a),q=P(o,...b);return el('line',Object.assign({x1:p[0],y1:p[1],x2:q[0],y2:q[1]},attrs),parent);}
function poly3(parent,o,arr,attrs){return el('polyline',Object.assign({points:pts(o,arr),fill:'none'},attrs),parent);}
function defs(svg){let d=svg.querySelector('defs');if(!d)d=el('defs',null,svg);return d;}
function glowFilter(svg,id,color,std){const d=defs(svg);if(svg.querySelector('#'+id))return;const f=el('filter',{id,x:'-50%',y:'-50%',width:'200%',height:'200%'},d);f.setAttribute('filterUnits','objectBoundingBox');
  el('feGaussianBlur',{stdDeviation:std||4,result:'b'},f);const m=el('feMerge',null,f);el('feMergeNode',{in:'b'},m);el('feMergeNode',{in:'SourceGraphic'},m);}
function linGrad(svg,id,stops,x2,y2){const d=defs(svg);if(svg.querySelector('#'+id))return;const g=el('linearGradient',{id,x1:0,y1:0,x2:x2===undefined?0:x2,y2:y2===undefined?1:y2},d);stops.forEach(s=>el('stop',{offset:s[0],'stop-color':s[1],'stop-opacity':s[2]===undefined?1:s[2]},g));}
function radGrad(svg,id,stops){const d=defs(svg);if(svg.querySelector('#'+id))return;const g=el('radialGradient',{id},d);stops.forEach(s=>el('stop',{offset:s[0],'stop-color':s[1],'stop-opacity':s[2]===undefined?1:s[2]},g));}
function setPressed(btns,active,attr){btns.forEach(b=>b.setAttribute(attr||'aria-pressed',String(b===active)));}
function tween(dur,fn,done){if(reduced){fn(1);done&&done();return;}const t0=performance.now();function f(t){const k=Math.min(1,(t-t0)/dur);fn(k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2);k<1?requestAnimationFrame(f):(done&&done());}requestAnimationFrame(f);}
function coHTML(list){return '<div class="who">'+list.map(c=>`<span class="co role-${c[2]||'tool'}"><i>${c[1]}</i>${c[0]}</span>`).join('')+'</div>';}
function setRead(id,h,p,cos){const r=document.getElementById(id);r.innerHTML=`<h4>${h}</h4><p>${p}</p>`+(cos&&cos.length?coHTML(cos):'');}

/* ---------------- progress, nav, reveal ---------------- */
const prog=$('#progress');
const chapters=$$('section.chapter');
const navA=$$('#chapnav a'), mobA=$$('#mobnav a');
function onScroll(){const h=document.documentElement;const p=h.scrollTop/(h.scrollHeight-h.clientHeight);prog.style.width=(p*100).toFixed(2)+'%';
  let cur=-1;chapters.forEach((c,i)=>{if(c.getBoundingClientRect().top<window.innerHeight*0.45)cur=i;});
  navA.forEach((a,i)=>{a.classList.toggle('on',i===cur);a.classList.toggle('done',i<cur);if(i===cur)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});
  mobA.forEach((a,i)=>{const on=i===cur;if(on&&!a.classList.contains('on')){a.scrollIntoView({inline:'center',block:'nearest',behavior:'auto'});}a.classList.toggle('on',on);});
  trayFromScroll();}
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.12});
$$('.rv').forEach(e=>io.observe(e));

/* ======================= HERO WORLD ======================= */
(function hero(){
  const svg=$('#heroWorld');const o={x:800,y:330,s:1};
  glowFilter(svg,'hg','#3fd6ff',3);
  linGrad(svg,'fadeV',[[0,'#060b18',0],[.75,'#060b18',.35],[1,'#060b18',1]]);
  const g=el('g',{opacity:.9},svg);
  // ground grid
  for(let i=-14;i<=14;i++){line3(g,o,[i*60,-840,0],[i*60,840,0],{stroke:'#16223f','stroke-width':1});line3(g,o,[-840,i*60,0],[840,i*60,0],{stroke:'#16223f','stroke-width':1});}
  // facilities along a route (design → wafer → fab → test → package → assembly → data center)
  const sites=[
    {x:-600,y:-120,w:120,d:90,h:70,c:'#22406a',acc:COL.cyan,lbl:'design'},
    {x:-380,y:-360,w:90,d:90,h:50,c:'#2b3550',acc:COL.white,lbl:'wafers'},
    {x:-180,y:-90,w:260,d:170,h:90,c:'#2c2950',acc:COL.violet,lbl:'fab'},
    {x:200,y:-300,w:110,d:90,h:55,c:'#2a3346',acc:COL.ti,lbl:'tools'},
    {x:220,y:40,w:120,d:110,h:60,c:'#2c2950',acc:COL.violet,lbl:'packaging'},
    {x:-60,y:300,w:90,d:80,h:45,c:'#3a2533',acc:COL.coral,lbl:'test'},
    {x:420,y:260,w:160,d:110,h:65,c:'#173c3a',acc:COL.teal,lbl:'assembly'},
    {x:560,y:-120,w:150,d:150,h:105,c:'#1b2a46',acc:COL.cyan,lbl:'data center'}];
  // paths
  const route=[[-540,-75],[-335,-315],[255,-255],[-50,-5],[280,95],[-15,340],[500,315],[635,-45]];
  const types=[COL.cyan,COL.violet,COL.ti,COL.violet,COL.coral,COL.teal,COL.teal];
  for(let i=0;i<route.length-1;i++){const a=route[i],b=route[i+1];
    const l=line3(g,o,[a[0],a[1],1],[b[0],a[1],1],{stroke:types[i],'stroke-width':2,'stroke-opacity':.6});const l2=line3(g,o,[b[0],a[1],1],[b[0],b[1],1],{stroke:types[i],'stroke-width':2,'stroke-opacity':.6});
    if(i===0){l.setAttribute('class','flowdash');l2.setAttribute('class','flowdash');}}
  sites.forEach(s=>{box(g,o,{x:s.x,y:s.y,z:0,w:s.w,d:s.d,h:s.h,c:s.c,stroke:s.acc,sw:.8});
    // roof equipment
    box(g,o,{x:s.x+s.w*.15,y:s.y+s.d*.2,z:s.h,w:s.w*.25,d:s.d*.25,h:12,c:shade(s.c,.2),stroke:s.acc,sw:.5});
    // window strips
    for(let k=1;k<4;k++){line3(g,o,[s.x+6,s.y+s.d,s.h*k/4],[s.x+s.w-6,s.y+s.d,s.h*k/4],{stroke:s.acc,'stroke-opacity':.45,'stroke-width':1.2,filter:'url(#hg)'});}
    const p=P(o,s.x+s.w/2,s.y+s.d/2,s.h+30);txt(g,p[0],p[1],s.lbl.toUpperCase(),'svglbl',{'text-anchor':'middle',fill:s.acc,opacity:.75,'font-size':10});});
  // fab = big cleanroom: violet glow
  el('rect',{x:0,y:0,width:1600,height:900,fill:'url(#fadeV)'},svg);
})();

/* ======================= CH1 STACK ======================= */
const ch1={mode:'all'};
function drawStack(){
  const svg=$('#stackSvg');clear(svg);glowFilter(svg,'g1c',COL.cyan,4);glowFilter(svg,'g1v',COL.violet,4);
  const o={x:280,y:440,s:1};
  const layers=[
    {n:'Applications',c:'#2a3a5c',acc:'#c9d4ee',z:400},
    {n:'Models',c:'#2a3352',acc:'#c9d4ee',z:310},
    {n:'Infrastructure',c:'#24304c',acc:'#c9d4ee',z:220},
    {n:'Chips',c:'#1d2948',acc:COL.cyan,z:130,chips:true},
    {n:'Energy',c:'#3a2f1c',acc:COL.amber,z:40}];
  const W=260,D=200,H=26;
  // draw bottom-up
  [...layers].reverse().forEach(L=>{
    const dim=(ch1.mode!=='all'&&!L.chips)?.18:1;
    const g=el('g',{opacity:dim,class:'hl'},svg);
    if(!L.chips){box(g,o,{x:0,y:0,z:L.z,w:W,d:D,h:H,c:L.c,stroke:L.acc,sw:.7});
      if(L.n==='Energy'){for(let i=0;i<5;i++)line3(g,o,[20+i*48,20,L.z+H],[20+i*48,D-20,L.z+H],{stroke:COL.amber,'stroke-width':1.4,'stroke-opacity':.7});}
      if(L.n==='Infrastructure'){for(let i=0;i<4;i++)for(let j=0;j<3;j++)box(g,o,{x:22+i*60,y:24+j*58,z:L.z+H,w:34,d:30,h:22,c:'#2b3a5e',stroke:'#7d92c4',sw:.4});}
      if(L.n==='Models'){for(let i=0;i<6;i++)for(let j=0;j<5;j++){const p=P(o,20+i*44,20+j*40,L.z+H);el('circle',{cx:p[0],cy:p[1],r:2.4,fill:'#c9d4ee',opacity:.75},g);}}
      if(L.n==='Applications'){for(let i=0;i<3;i++)box(g,o,{x:26+i*76,y:60,z:L.z+H,w:56,d:80,h:4,c:'#3b4e7c',stroke:'#c9d4ee',sw:.4});}
    }else{
      const lo=(ch1.mode==='memory')?.22:1, me=(ch1.mode==='logic')?.22:1;
      const gl=el('g',{opacity:lo,class:'hl',filter:ch1.mode==='logic'?'url(#g1c)':null},g);
      const gm=el('g',{opacity:me,class:'hl',filter:ch1.mode==='memory'?'url(#g1v)':null},g);
      box(gl,o,{x:0,y:0,z:L.z,w:W/2-3,d:D,h:H,c:'#123a55',stroke:COL.cyan,sw:.9});
      box(gm,o,{x:W/2+3,y:0,z:L.z,w:W/2-3,d:D,h:H,c:'#2b1f55',stroke:COL.violet,sw:.9});
      // logic: three big dies (Nvidia/AMD/Broadcom)
      [[18,22],[18,82],[18,142]].forEach((p,i)=>{box(gl,o,{x:p[0],y:p[1],z:L.z+H,w:90,d:40,h:6,c:'#1d5a7c',stroke:COL.cyan,sw:.6});
        for(let k=0;k<4;k++)line3(gl,o,[p[0]+10+k*20,p[1]+6,L.z+H+6],[p[0]+10+k*20,p[1]+34,L.z+H+6],{stroke:COL.cyan,'stroke-opacity':.5,'stroke-width':.8});});
      // memory: stacked towers
      for(let i=0;i<3;i++)for(let j=0;j<3;j++){for(let k=0;k<4;k++)box(gm,o,{x:W/2+20+i*36,y:22+j*60,z:L.z+H+k*5,w:24,d:34,h:4,c:'#4a3690',stroke:COL.violet,sw:.4});}
      let p=P(o,W/4,D+30,L.z);txt(gl,p[0]-60,p[1]+18,'LOGIC','svglbl c',{'font-size':12,'font-weight':600});
      p=P(o,W*3/4,D+30,L.z);txt(gm,p[0]-40,p[1]+18,'MEMORY','svglbl v',{'font-size':12,'font-weight':600});
    }
    const p=P(o,W,0,L.z+H/2);txt(g,p[0]+16,p[1]+4,L.n.toUpperCase(),'svglbl',{fill:L.acc,'font-size':12.5,'font-weight':L.chips?700:400});
    if(L.chips){const q=P(o,W,0,L.z+H/2);el('line',{x1:q[0]+4,y1:q[1],x2:q[0]+12,y2:q[1],stroke:COL.cyan},g);txt(g,q[0]+16,q[1]+20,'← this story','svglbl',{'font-size':10.5,fill:COL.muted});}
  });
}
const ch1Text={
  all:['Five layers, one dependency chain','Every layer rests on the one below it. Models can\'t train without infrastructure, infrastructure is empty without chips, and chips draw on enormous amounts of energy. Pick a chip family to look closer.',[]],
  logic:['Logic chips: the processors','Logic chips execute instructions and do the arithmetic: GPUs, CPUs and custom accelerators (ASICs). In AI, the big names are designers, not factories. They create the blueprint and pay someone else to build it.',[['Nvidia','US','design'],['AMD','US','design'],['Broadcom','US','design']]],
  memory:['Memory chips: where the data waits','Memory chips store data: DRAM for working memory, NAND flash for storage, and HBM, a vertically stacked DRAM built to feed AI processors. Unlike the logic designers, the big memory makers design <em>and</em> manufacture their chips in their own fabs. Logic and memory are complements: a fast processor with slow memory sits idle.',[['SK Hynix','KR','mem'],['Samsung','KR','mem'],['Micron','US','mem']]]};
$$('[data-ch1]').forEach(b=>b.addEventListener('click',()=>{ch1.mode=b.dataset.ch1;setPressed($$('[data-ch1]'),b);const t=ch1Text[ch1.mode];setRead('ch1read',t[0],t[1],t[2]);drawStack();}));
drawStack();

/* ======================= CH2 ORDER ======================= */
(function order(){
  const svg=$('#orderSvg');glowFilter(svg,'g2',COL.cyan,3);
  const o={x:560,y:230,s:.9};
  // ground
  for(let i=-8;i<=8;i++){line3(svg,o,[i*60,-480,0],[i*60,480,0],{stroke:'#121c35'});line3(svg,o,[-480,i*60,0],[480,i*60,0],{stroke:'#121c35'});}
  // data center (customer) at left-front
  const dc={x:-140,y:240,w:200,d:150,h:70};
  box(svg,o,{...dc,z:0,c:'#1b2a46',stroke:COL.cyan});
  for(let i=0;i<6;i++)box(svg,o,{x:dc.x+14+i*30,y:dc.y+20,z:dc.h,w:18,d:24,h:14,c:'#2a3c63',stroke:'#7d92c4',sw:.4});
  for(let k=1;k<5;k++)line3(svg,o,[dc.x+8,dc.y+dc.d,k*14],[dc.x+dc.w-8,dc.y+dc.d,k*14],{stroke:COL.cyan,'stroke-opacity':.35});
  // design HQ (fabless) right-back
  const hq={x:180,y:-220,w:170,d:130,h:110};
  box(svg,o,{...hq,z:0,c:'#22406a',stroke:COL.cyan});
  for(let r=1;r<6;r++)for(let k=0;k<6;k++){const a=P(o,hq.x+12+k*26,hq.y+hq.d,r*18);el('rect',{x:a[0]-1,y:a[1]-6,width:12,height:6,fill:COL.cyan,opacity:.18+((r*k)%3)*.12},svg);}
  // ghost fab next to HQ (not owned)
  const gf={x:400,y:-180,w:150,d:110,h:60};
  const gg=el('g',{opacity:.55},svg);
  [[gf.x,gf.y,0],[gf.x+gf.w,gf.y,0],[gf.x+gf.w,gf.y+gf.d,0],[gf.x,gf.y+gf.d,0]].forEach((p,i,a)=>{const q=a[(i+1)%4];line3(gg,o,p,q,{stroke:COL.ti,'stroke-dasharray':'5 5'});line3(gg,o,[p[0],p[1],gf.h],[q[0],q[1],gf.h],{stroke:COL.ti,'stroke-dasharray':'5 5'});line3(gg,o,p,[p[0],p[1],gf.h],{stroke:COL.ti,'stroke-dasharray':'5 5'});});
  let p=P(o,gf.x+gf.w/2,gf.y+gf.d/2,gf.h+30);txt(svg,p[0],p[1],'NO FACTORY OF ITS OWN','svglbl',{'text-anchor':'middle'});
  txt(svg,p[0],p[1]+14,'manufacturing is outsourced','svglbl',{'text-anchor':'middle',fill:COL.dim||'#6b7895','font-size':10});
  // path: order from DC to HQ
  const a=P(o,dc.x+dc.w/2,dc.y+dc.d/2,dc.h+4), m1=P(o,20,40,160), b=P(o,hq.x,hq.y+hq.d/2,hq.h*0.6);
  const d=`M${a[0]},${a[1]} Q${m1[0]},${m1[1]-60} ${b[0]},${b[1]}`;
  el('path',{d,fill:'none',stroke:COL.cyan,'stroke-width':2,class:'flowdash',filter:'url(#g2)'},svg);
  // packet (order) moving
  const pk=el('g',null,svg);el('rect',{x:-12,y:-8,width:24,height:16,rx:2,fill:'#0c2a3c',stroke:COL.cyan,'stroke-width':1.4},pk);el('path',{d:'M-12,-8 L0,1 L12,-8',fill:'none',stroke:COL.cyan,'stroke-width':1.2},pk);
  const am=el('animateMotion',{dur:'4s',repeatCount:'indefinite',path:d},pk);
  // spec sheet output from HQ heading right (to foundry, later)
  const s0=P(o,hq.x+hq.w/2,hq.y+hq.d,20), s1=[640,380];
  el('path',{d:`M${s0[0]},${s0[1]} C${s0[0]+80},${s0[1]} ${s1[0]-60},${s1[1]-60} ${s1[0]},${s1[1]}`,fill:'none',stroke:COL.cyan,'stroke-width':1.6,'stroke-dasharray':'3 6',opacity:.8},svg);
  const sh=el('g',{transform:`translate(${s1[0]+6},${s1[1]-30})`},svg);
  el('rect',{width:70,height:88,rx:4,fill:'#0b1d33',stroke:COL.cyan,'stroke-width':1.2},sh);
  for(let i=0;i<7;i++)el('line',{x1:10,x2:i%3===2?40:60,y1:16+i*10,y2:16+i*10,stroke:COL.cyan,'stroke-opacity':.6},sh);
  el('rect',{x:38,y:56,width:22,height:22,fill:'none',stroke:COL.violet},sh);el('path',{d:'M42,60h14v14h-14z M49,60v14 M42,67h14',stroke:COL.violet,'stroke-width':.7,fill:'none'},sh);
  txt(sh,35,106,'DESIGN SPEC','svglbl c',{'text-anchor':'middle'});txt(sh,35,120,'→ Chapter 3','svglbl',{'text-anchor':'middle','font-size':10});
  // labels
  p=P(o,dc.x,dc.y+dc.d,0);txt(svg,p[0]+20,p[1]+40,'CUSTOMER','svglbl w',{'font-weight':600});txt(svg,p[0]+20,p[1]+56,'data-center operator · e.g. CoreWeave','svglbl',{'font-size':10.5});
  p=P(o,hq.x,hq.y,hq.h);txt(svg,p[0]-60,p[1]-30,'CHIP DESIGNER','svglbl c',{'font-weight':600});txt(svg,p[0]-60,p[1]-16,'Nvidia · AMD · Broadcom','svglbl w',{'font-size':11});
  txt(svg,m1[0]-150,m1[1]-40,'PROCESSOR ORDER','svglbl c');
})();

/* ======================= CH3 DESIGN VIEWS ======================= */
const ch3Info=[
  ['Functional block diagram','Architects start with what the chip must do: thousands of parallel compute cores grouped into clusters, a large shared cache, controllers that talk to high-bandwidth memory, and high-speed links to other chips. Each block becomes its own design project.'],
  ['Logic representation','Engineers write the behavior in a hardware description language (top). Synthesis software in the EDA suite translates it into logic gates and flip-flops (bottom), then verification tools simulate it, often for months, to catch bugs before any silicon exists.'],
  ['Physical layout','Place-and-route software arranges vast numbers of standard cells into rows and draws the wiring between them across many stacked metal layers (horizontal on one layer, vertical on the next). It checks timing, power and the foundry\'s design rules as it goes.'],
  ['Manufacturing-ready design data','The finished layout is exported as geometry: one pattern per manufacturing layer. Those layers become a set of photomasks, and the data, built to the foundry\'s process design kit, is sent to the fab. This hand-off is tape-out. Still no chip, just very precise information.']];
const EDA=[['Cadence','US','design'],['Synopsys','US','design']];
function drawDesign(v){
  const svg=$('#designSvg');clear(svg);glowFilter(svg,'g3',COL.cyan,2.5);
  $('#ch3tag').textContent=ch3Info[v][0].toLowerCase();
  setRead('ch3read',ch3Info[v][0],ch3Info[v][1],EDA);
  if(v===0){
    const X=70,Y=60,W=500,H=400;el('rect',{x:X,y:Y,width:W,height:H,rx:6,fill:'#0b1730',stroke:COL.cyan,'stroke-width':1.5},svg);
    // HBM PHY left/right
    for(let i=0;i<3;i++){[X+6,X+W-46].forEach(xx=>{el('rect',{x:xx,y:Y+30+i*120,width:40,height:100,fill:'#251a4a',stroke:COL.violet},svg);});}
    txt(svg,X+26,Y+H+18,'HBM interface','svglbl v',{'text-anchor':'middle'});txt(svg,X+W-26,Y+H+18,'HBM interface','svglbl v',{'text-anchor':'middle'});
    // compute clusters
    for(let r=0;r<2;r++)for(let c=0;c<4;c++){const gx=X+62+c*96,gy=Y+28+r*218;el('rect',{x:gx,y:gy,width:86,height:126,fill:'#0f2a44',stroke:COL.cyan,'stroke-opacity':.8},svg);
      for(let i=0;i<3;i++)for(let j=0;j<5;j++)el('rect',{x:gx+6+i*26,y:gy+8+j*23,width:22,height:18,fill:COL.cyan,opacity:.18+((i+j)%3)*.08},svg);}
    // L2 band
    el('rect',{x:X+62,y:Y+166,width:380,height:68,fill:'#1a2240',stroke:COL.white,'stroke-opacity':.5},svg);
    for(let i=0;i<16;i++)el('rect',{x:X+68+i*23.5,y:Y+174,width:19,height:52,fill:COL.white,opacity:.08},svg);
    txt(svg,X+252,Y+205,'SHARED L2 CACHE','svglbl w',{'text-anchor':'middle','font-size':12});
    txt(svg,X+252,Y+221,'+ on-chip network','svglbl',{'text-anchor':'middle','font-size':10});
    txt(svg,X+105,Y+22,'COMPUTE CLUSTERS (many cores each)','svglbl c',{'font-size':10});
    // IO
    el('rect',{x:X+62,y:Y+H-16,width:380,height:10,fill:COL.amber,opacity:.6},svg);txt(svg,X+252,Y+H+34,'chip-to-chip links · PCIe · power delivery','svglbl a',{'text-anchor':'middle'});
    txt(svg,X+W/2,Y-18,'GPU DIE · FLOORPLAN SKETCH','svglbl w',{'text-anchor':'middle',fill:COL.muted});
  }else if(v===1){
    // RTL code card
    const code=['module mac (input clk,','  input  [7:0] a, b,','  output reg [15:0] acc);','  always @(posedge clk)','    acc <= acc + a * b;','endmodule'];
    el('rect',{x:40,y:30,width:560,height:150,rx:8,fill:'#081325',stroke:COL.line2},svg);
    txt(svg,56,52,'HARDWARE DESCRIPTION (VERILOG) · a multiply-accumulate unit','svglbl c',{'font-size':10});
    code.forEach((l,i)=>txt(svg,60,78+i*17,l,'svglbl w',{'font-size':12.5,'xml:space':'preserve',style:'white-space:pre'}));
    // arrow
    el('path',{d:'M320,190 v28',stroke:COL.cyan,'stroke-width':2,'marker-end':''},svg);el('path',{d:'M312,210 l8,10 l8,-10',fill:'none',stroke:COL.cyan,'stroke-width':2},svg);
    txt(svg,336,210,'synthesis','svglbl c');
    // gate schematic: 1-bit full adder + DFF
    const gy=250;
    function andG(x,y){el('path',{d:`M${x},${y} h18 a16,16 0 0 1 0,32 h-18 z`,fill:'#0f2a44',stroke:COL.cyan,'stroke-width':1.4},svg);}
    function xorG(x,y){el('path',{d:`M${x+4},${y} q22,0 34,16 q-12,16 -34,16 q10,-16 0,-32z`,fill:'#0f2a44',stroke:COL.cyan,'stroke-width':1.4},svg);el('path',{d:`M${x-2},${y} q10,16 0,32`,fill:'none',stroke:COL.cyan,'stroke-width':1.4},svg);}
    function orG(x,y){el('path',{d:`M${x},${y} q22,0 34,16 q-12,16 -34,16 q10,-16 0,-32z`,fill:'#0f2a44',stroke:COL.cyan,'stroke-width':1.4},svg);}
    xorG(150,gy);xorG(260,gy);andG(150,gy+80);andG(260,gy+120);orG(360,gy+100);
    const w=(d)=>el('path',{d,fill:'none',stroke:'#7fbfe0','stroke-width':1.2},svg);
    w(`M70,${gy+8} H148`);w(`M70,${gy+24} H148`);w(`M110,${gy+8} V${gy+88} H150`);w(`M95,${gy+24} V${gy+104} H150`);
    w(`M188,${gy+16} H220 V${gy+8} H258`);w(`M70,${gy+60} H230 V${gy+24} H258`);w(`M220,${gy+16} V${gy+128} H260`);w(`M230,${gy+60} V${gy+144} H260`);
    w(`M184,${gy+96} H330 V${gy+108} H362`);w(`M294,${gy+136} H330 V${gy+124} H362`);
    w(`M298,${gy+16} H460`);w(`M396,${gy+116} H440 V${gy+180} H530`);
    // DFF
    el('rect',{x:460,y:gy-6,width:70,height:56,fill:'#1d1840',stroke:COL.violet,'stroke-width':1.4},svg);txt(svg,495,gy+18,'D  Q','svglbl v',{'text-anchor':'middle'});el('path',{d:`M460,${gy+36} l8,6 l-8,6`,fill:'none',stroke:COL.violet},svg);
    w(`M530,${gy+12} H585`);
    txt(svg,64,gy+5,'a','svglbl w',{'text-anchor':'end'});txt(svg,64,gy+28,'b','svglbl w',{'text-anchor':'end'});txt(svg,64,gy+64,'cin','svglbl w',{'text-anchor':'end'});
    txt(svg,590,gy+16,'sum (registered)','svglbl w',{'font-size':10});txt(svg,535,gy+184,'carry → next bit','svglbl w',{'font-size':10});
    txt(svg,320,gy+225,'GATE-LEVEL NETLIST · one bit of an adder, repeated billions of times across the chip','svglbl',{'text-anchor':'middle','font-size':10});
  }else if(v===2){
    // inset floorplan
    el('rect',{x:24,y:24,width:150,height:120,fill:'#0b1730',stroke:COL.cyan},svg);
    for(let r=0;r<2;r++)for(let c=0;c<4;c++)el('rect',{x:40+c*30,y:32+r*66,width:26,height:38,fill:COL.cyan,opacity:.15},svg);
    el('rect',{x:40,y:72,width:118,height:20,fill:COL.white,opacity:.1},svg);
    el('rect',{x:76,y:38,width:12,height:12,fill:'none',stroke:COL.amber,'stroke-width':1.5},svg);
    el('path',{d:'M88,44 L240,80',stroke:COL.amber,'stroke-dasharray':'3 3'},svg);
    txt(svg,24,160,'full die','svglbl');
    // zoomed region: standard cell rows
    const X=240,Y=70,W=370,H=400;el('rect',{x:X,y:Y,width:W,height:H,fill:'#081325',stroke:COL.amber,'stroke-opacity':.8},svg);
    const cols=['#1e4f6b','#2a3f73','#1f5c55','#3c2f6e','#25496e'];let seed=7;const rnd=()=>{seed=(seed*9301+49297)%233280;return seed/233280;};
    for(let r=0;r<10;r++){const yy=Y+10+r*39;el('rect',{x:X,y:yy-3,width:W,height:3,fill:COL.amber,opacity:.35},svg);
      let xx=X+6;while(xx<X+W-20){const cw=14+Math.floor(rnd()*30);el('rect',{x:xx,y:yy+2,width:Math.min(cw,X+W-6-xx),height:30,fill:cols[Math.floor(rnd()*5)],stroke:'#8fb3d9','stroke-opacity':.25},svg);xx+=cw+2;}}
    // routing M1 horizontal (cyan) M2 vertical (violet)
    for(let i=0;i<22;i++){const yy=Y+18+Math.floor(rnd()*380),x1=X+10+rnd()*200;el('line',{x1,x2:x1+40+rnd()*150,y1:yy,y2:yy,stroke:COL.cyan,'stroke-width':2.2,opacity:.85},svg);}
    for(let i=0;i<18;i++){const xx=X+12+Math.floor(rnd()*340),y1=Y+10+rnd()*250;el('line',{x1:xx,x2:xx,y1,y2:y1+40+rnd()*130,stroke:COL.violet,'stroke-width':2.2,opacity:.85},svg);
      el('rect',{x:xx-2.5,y:y1-2.5,width:5,height:5,fill:COL.white},svg);}
    txt(svg,X,Y-10,'ZOOMED: standard-cell rows + routing','svglbl w');
    const lg=[[COL.cyan,'metal 1 (horizontal)'],[COL.violet,'metal 2 (vertical)'],[COL.white,'via'],[COL.amber,'power rail']];
    lg.forEach((l,i)=>{el('rect',{x:24,y:210+i*22,width:14,height:8,fill:l[0]},svg);txt(svg,46,218+i*22,l[1],'svglbl',{'font-size':10.5});});
    txt(svg,24,330,'Real chips stack','svglbl',{'font-size':10.5});txt(svg,24,344,'over a dozen metal','svglbl',{'font-size':10.5});txt(svg,24,358,'layers like this.','svglbl',{'font-size':10.5});
  }else{
    const o={x:250,y:120,s:1};
    const layers=[['active area',COL.teal],['gate',COL.violet],['contact',COL.white],['metal 1',COL.cyan],['via 1',COL.white],['metal 2',COL.violet],['… dozens more',COL.ti]];
    layers.forEach((L,i)=>{const z=i*48;plane(svg,o,0,0,z,220,170,{fill:shade(L[1],-.75),'fill-opacity':.75,stroke:L[1],'stroke-width':1.2});
      let seed=i*31+5;const rnd=()=>{seed=(seed*9301+49297)%233280;return seed/233280;};
      for(let k=0;k<7;k++){const horiz=(i%2===1);const a=10+rnd()*180,b=10+rnd()*140;if(horiz)line3(svg,o,[a,b,z],[Math.min(215,a+30+rnd()*90),b,z],{stroke:L[1],'stroke-width':2.2});else line3(svg,o,[a,b,z],[a,Math.min(165,b+30+rnd()*80),z],{stroke:L[1],'stroke-width':2.2});}
      const p=P(o,220,0,z);txt(svg,p[0]+14,p[1]+4,'MASK '+(i+1)+' · '+L[0],'svglbl',{fill:L[1]});});
    // data file → fab
    el('rect',{x:440,y:400,width:170,height:70,rx:6,fill:'#0b1d33',stroke:COL.cyan},svg);
    txt(svg,525,424,'LAYOUT DATABASE','svglbl c',{'text-anchor':'middle'});txt(svg,525,440,'(GDSII / OASIS files)','svglbl',{'text-anchor':'middle','font-size':10});txt(svg,525,458,'→ mask shop → foundry','svglbl w',{'text-anchor':'middle','font-size':10.5});
    txt(svg,30,480,'One photomask per patterned layer. A leading-edge chip can need well over 50.','svglbl',{'font-size':10.5});
  }
}
$$('[data-ch3]').forEach(b=>b.addEventListener('click',()=>{setPressed($$('[data-ch3]'),b,'aria-selected');drawDesign(+b.dataset.ch3);}));
$$('[data-ch3]').forEach((b,i,all)=>b.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){const n=all[(i+(e.key==='ArrowRight'?1:all.length-1))%all.length];n.focus();n.click();}}));
drawDesign(0);

/* ======================= CH4 WAFER ZOOM ======================= */
const ch4Info=[
  ['Entire wafer','A 300 mm polished silicon wafer, sliced from a single-crystal ingot (left) grown from ultra-pure silicon. Its mirror-flat surface is where every later step happens. It arrives at the fab from a wafer supplier.','100 mm','ingot → wafer',[['Shin-Etsu','JP','mat'],['SUMCO','JP','mat']]],
  ['Repeated die pattern','The design is printed again and again in a grid. Each rectangle is one future chip (a die), separated by thin scribe lanes where the saw will later cut. Partial dies at the round edge are wasted, one reason big AI dies are expensive.','10 mm','die grid',[]],
  ['One die','A single large AI processor die is a few centimeters across at most; the lithography field size caps how big one die can be. Inside you can make out the floorplan from Chapter 3: compute clusters, cache, memory interfaces.','5 mm','single die',[]],
  ['Device region','Zoomed deep in: transistors sit at the bottom, built into the silicon, with a tall stack of metal wiring above them. Leading-edge transistors are tens of nanometers in size; this panel is a schematic, not a micrograph.','~50 nm','transistors + wiring',[]]];
function drawWafer(lv){
  const svg=$('#waferSvg');clear(svg);
  radGrad(svg,'wgrad',[[0,'#c5d2ef'],[.55,'#7c8db5'],[1,'#3a4a72']]);
  linGrad(svg,'irid',[[0,'#3fd6ff',.25],[.5,'#a77bff',.2],[1,'#2fe0b4',.22]],1,1);
  const info=ch4Info[lv];$('#ch4tag').textContent=info[3];setRead('ch4read',info[0],info[1],info[4]);
  $('#zoom').setAttribute('aria-valuetext',info[0]);
  const scaleBar=(len,label)=>{el('line',{x1:40,x2:40+len,y1:570,y2:570,stroke:COL.white,'stroke-width':2},svg);el('line',{x1:40,x2:40,y1:564,y2:576,stroke:COL.white},svg);el('line',{x1:40+len,x2:40+len,y1:564,y2:576,stroke:COL.white},svg);txt(svg,40,556,label,'svglbl w');};
  if(lv===0){
    // ingot (iso cylinder)
    const cx=110,cy=150,rx=60,ry=24,h=300;
    linGrad(svg,'ing',[[0,'#46557c'],[.45,'#aab7d6'],[1,'#2d3a5e']],1,0);
    el('rect',{x:cx-rx,y:cy,width:rx*2,height:h,fill:'url(#ing)'},svg);el('ellipse',{cx,cy:cy+h,rx,ry,fill:'#2d3a5e'},svg);el('ellipse',{cx,cy,rx,ry,fill:'#b9c6e4',stroke:'#e9eef8','stroke-width':.6},svg);
    el('path',{d:`M${cx-rx},${cy+h} a${rx},${ry} 0 0 0 ${rx*2},0`,fill:'#3a4870'},svg);
    txt(svg,cx,cy+h+50,'single-crystal ingot','svglbl',{'text-anchor':'middle'});
    // slices
    for(let i=0;i<3;i++)el('ellipse',{cx:cx,cy:cy+h+20+i*0,rx:0,ry:0,fill:'#9fb0d6',stroke:'#e9eef8','stroke-width':.5,opacity:.6+i*.12},svg);
    // wafer
    const wx=410,wy=300,R=190;
    el('circle',{cx:wx,cy:wy,r:R,fill:'url(#wgrad)',stroke:'#e9eef8','stroke-width':1},svg);
    el('circle',{cx:wx,cy:wy,r:R,fill:'url(#irid)'},svg);
    // faint die grid
    const dw=R*2/300*26,dh=R*2/300*33;
    for(let x=wx-R;x<wx+R;x+=dw)for(let y=wy-R;y<wy+R;y+=dh){const c=[[x,y],[x+dw,y],[x,y+dh],[x+dw,y+dh]].every(q=>Math.hypot(q[0]-wx,q[1]-wy)<R-4);if(c)el('rect',{x:x+1,y:y+1,width:dw-2,height:dh-2,fill:'none',stroke:'#1a2a50','stroke-opacity':.55},svg);}
    el('path',{d:`M${wx-6},${wy+R-1} l6,-8 l6,8`,fill:'#060b18'},svg);txt(svg,wx,wy+R+22,'notch','svglbl',{'text-anchor':'middle'});
    txt(svg,wx,wy-R-14,'300 mm WAFER','svglbl w',{'text-anchor':'middle'});
    scaleBar(R*2/3,'100 mm');
    el('rect',{x:wx-R/2-30,y:wy-R/2-10,width:0,height:0},svg);
  }else if(lv===1){
    const ox=320,oy=290,dw=150,dh=190,sc=6;
    el('rect',{x:0,y:0,width:640,height:600,fill:'#5d6f9a'},svg);el('rect',{x:0,y:0,width:640,height:600,fill:'url(#irid)'},svg);
    for(let i=-3;i<=3;i++)for(let j=-2;j<=2;j++){const x=ox-dw/2+i*(dw+sc),y=oy-dh/2+j*(dh+sc);
      const g=el('g',null,svg);el('rect',{x,y,width:dw,height:dh,fill:'#1b2950',stroke:'#c5d2ef','stroke-width':.6},g);
      for(let r=0;r<2;r++)for(let c=0;c<4;c++)el('rect',{x:x+14+c*31,y:y+14+r*96,width:27,height:66,fill:COL.cyan,opacity:.18},g);
      el('rect',{x:x+14,y:y+84,width:120,height:22,fill:COL.white,opacity:.1},g);
      el('rect',{x:x+3,y:y+14,width:8,height:162,fill:COL.violet,opacity:.35},g);el('rect',{x:x+dw-11,y:y+14,width:8,height:162,fill:COL.violet,opacity:.35},g);}
    txt(svg,ox,oy+dh/2+sc+14,'scribe lane','svglbl w',{'text-anchor':'middle'});
    el('rect',{x:ox-dw/2-3,y:oy-dh/2-3,width:dw+6,height:dh+6,fill:'none',stroke:COL.cyan,'stroke-width':2},svg);
    scaleBar(dw*10/26,'10 mm');
  }else if(lv===2){
    const X=110,Y=60,W=420,H=480;
    el('rect',{x:X,y:Y,width:W,height:H,fill:'#13204a',stroke:'#c5d2ef'},svg);
    for(let r=0;r<2;r++)for(let c=0;c<4;c++){const gx=X+50+c*82,gy=Y+30+r*250;el('rect',{x:gx,y:gy,width:74,height:170,fill:'#0f2a44',stroke:COL.cyan,'stroke-opacity':.7},svg);
      for(let i=0;i<3;i++)for(let j=0;j<8;j++)el('rect',{x:gx+5+i*23,y:gy+6+j*20.5,width:19,height:16,fill:COL.cyan,opacity:.15+((i*j)%4)*.06},svg);}
    el('rect',{x:X+50,y:Y+210,width:320,height:60,fill:'#1a2240',stroke:COL.white,'stroke-opacity':.4},svg);
    for(let i=0;i<3;i++){el('rect',{x:X+8,y:Y+40+i*140,width:34,height:120,fill:'#251a4a',stroke:COL.violet},svg);el('rect',{x:X+W-42,y:Y+40+i*140,width:34,height:120,fill:'#251a4a',stroke:COL.violet},svg);}
    el('rect',{x:X+200,y:Y+250,width:14,height:14,fill:'none',stroke:COL.amber,'stroke-width':2},svg);txt(svg,X+222,Y+262,'next zoom','svglbl a');
    txt(svg,X+W/2,Y-14,'ONE DIE (schematic floorplan)','svglbl w',{'text-anchor':'middle'});
    scaleBar(W*5/26,'5 mm');
  }else{
    // nanosheet transistor cross-section schematic + wiring
    el('rect',{x:0,y:430,width:640,height:170,fill:'#3d4b72'},svg);txt(svg,20,590,'silicon substrate','svglbl w');
    for(let t=0;t<3;t++){const tx=70+t*190;
      el('rect',{x:tx,y:380,width:40,height:50,fill:'#6e7fa8'},svg);el('rect',{x:tx+110,y:380,width:40,height:50,fill:'#6e7fa8'},svg);
      // gate wraps sheets
      el('rect',{x:tx+44,y:330,width:62,height:100,rx:4,fill:'#4b2f8e',stroke:COL.violet},svg);
      for(let k=0;k<3;k++)el('rect',{x:tx+30,y:350+k*24,width:90,height:10,fill:'#c5d2ef'},svg);
      el('rect',{x:tx+54,y:300,width:42,height:30,fill:COL.white,opacity:.8},svg);
      el('rect',{x:tx+8,y:350,width:24,height:30,fill:COL.white,opacity:.6},svg);el('rect',{x:tx+118,y:350,width:24,height:30,fill:COL.white,opacity:.6},svg);}
    // metal stack
    const mets=[[268,22,COL.cyan],[220,26,COL.violet],[164,34,COL.cyan],[96,44,COL.violet]];
    mets.forEach((m,i)=>{for(let k=0;k<(10-i*2);k++){const w=640/(10-i*2);el('rect',{x:k*w+w*.2,y:m[0],width:w*.6,height:m[1],fill:m[2],opacity:.75},svg);}
      for(let k=0;k<4;k++)el('rect',{x:40+k*150+i*20,y:m[0]+m[1],width:10,height:(i===0?32:mets[i-1][0]-m[0]-m[1]),fill:COL.white,opacity:.7},svg);});
    txt(svg,620,320,'transistors (gate wraps stacked silicon sheets)','svglbl w',{'text-anchor':'end','font-size':10.5});
    txt(svg,620,86,'wiring layers grow thicker toward the top','svglbl w',{'text-anchor':'end','font-size':10.5});
    txt(svg,20,62,'NOT TO SCALE · schematic of a leading-edge device region','svglbl a');
    scaleBar(60,'~ 50 nm (order of magnitude)');
  }
  $('#ch4scale').textContent=lv===3?'Schematic cut-away. Proportions are simplified; the scale bar is order-of-magnitude only.':'Scale bar applies to the main view.';
}
$('#zoom').addEventListener('input',e=>drawWafer(+e.target.value));
drawWafer(0);

/* ======================= CH5 FAB BAY ======================= */
(function fab(){
  const svg=$('#fabSvg');const o={x:250,y:205,s:.8};glowFilter(svg,'g5',COL.violet,3);
  // floor (raised floor tiles)
  plane(svg,o,0,0,0,620,300,{fill:'#0d1730',stroke:COL.line2});
  for(let i=1;i<31;i++)line3(svg,o,[i*20,0,0],[i*20,300,0],{stroke:'#16223f'});for(let i=1;i<15;i++)line3(svg,o,[0,i*20,0],[620,i*20,0],{stroke:'#16223f'});
  // back wall cutaway
  el('polygon',{points:pts(o,[[0,0,0],[620,0,0],[620,0,190],[0,0,190]]),fill:'#0f1a36',stroke:COL.line2,opacity:.8},svg);
  el('polygon',{points:pts(o,[[0,0,0],[0,300,0],[0,300,190],[0,0,190]]),fill:'#0c1530',stroke:COL.line2,opacity:.8},svg);
  // FFU ceiling grid hint
  for(let i=0;i<8;i++)line3(svg,o,[i*80,0,190],[i*80,0,170],{stroke:COL.ti,'stroke-opacity':.3});
  const tools=[
    {x:30,y:60,w:90,d:70,h:70,c:'#2a3346',lbl:'Deposition',who:'Applied Materials · Lam',acc:COL.ti},
    {x:150,y:60,w:90,d:70,h:62,c:'#2a3346',lbl:'Coat / develop track',who:'Tokyo Electron',acc:COL.ti},
    {x:270,y:40,w:170,d:100,h:105,c:'#33394f',lbl:'EUV scanner',who:'ASML',acc:COL.violet},
    {x:470,y:60,w:90,d:70,h:66,c:'#2a3346',lbl:'Etch',who:'Lam · Tokyo Electron · Applied',acc:COL.ti},
    {x:470,y:190,w:90,d:70,h:56,c:'#3a2533',lbl:'Inspection',who:'KLA',acc:COL.coral}];
  // rail (overhead AMHS)
  const railZ=150;poly3(svg,o,[[20,170,railZ],[600,170,railZ],[600,230,railZ],[400,230,railZ]],{stroke:COL.ti,'stroke-width':3,'stroke-opacity':.8});
  tools.forEach((t,ti)=>{const stem=16+(ti%2)*26;box(svg,o,{x:t.x,y:t.y,z:0,w:t.w,d:t.d,h:t.h,c:t.c,stroke:t.acc,sw:.9});
    // load ports
    box(svg,o,{x:t.x+10,y:t.y+t.d,z:20,w:t.w-20,d:12,h:8,c:'#3c465f',stroke:t.acc,sw:.4});
    // status light
    const s=P(o,t.x+t.w-8,t.y+t.d,t.h-8);el('circle',{cx:s[0],cy:s[1],r:2.5,fill:t.acc,filter:'url(#g5)'},svg);
    const front=t.lbl==='Inspection';const p0=P(o,t.x+t.w/2,t.y+t.d/2,t.h+4),lz=185+(ti%2)*26;let p=P(o,t.x+t.w/2,t.y+t.d/2,lz);if(front){const q=P(o,t.x+t.w,t.y+t.d,0);p=[q[0]-40,q[1]+34];}if(!front)el('line',{x1:p0[0],y1:p0[1],x2:p[0],y2:p[1],stroke:t.acc,'stroke-opacity':.5,'stroke-dasharray':'2 3'},svg);
    txt(svg,p[0],p[1]-14,t.lbl.toUpperCase(),'svglbl w',{'text-anchor':'middle','font-size':10});txt(svg,p[0],p[1]-3,t.who,'svglbl',{'text-anchor':'middle','font-size':9.5,fill:t.acc});});
  // EUV light path glow inside scanner
  line3(svg,o,[300,90,30],[420,90,95],{stroke:COL.violet,'stroke-width':2,filter:'url(#g5)',opacity:.9});
  // pods moving on rail
  const path=P(o,20,170,railZ),path2=P(o,600,170,railZ),path3=P(o,600,230,railZ),path4=P(o,400,230,railZ);
  const d=`M${path[0]},${path[1]} L${path2[0]},${path2[1]} L${path3[0]},${path3[1]} L${path4[0]},${path4[1]}`;
  for(let i=0;i<3;i++){const g=el('g',null,svg);el('rect',{x:-9,y:-14,width:18,height:14,rx:2,fill:'#c9d4ee',stroke:COL.violet},g);el('line',{x1:0,x2:0,y1:-14,y2:-22,stroke:COL.ti},g);
    el('animateMotion',{dur:'9s',begin:(-i*3)+'s',repeatCount:'indefinite',path:d},g);}
  const lp=P(o,610,200,railZ+10);txt(svg,lp[0]+6,lp[1],'overhead transport','svglbl',{'font-size':10});txt(svg,lp[0]+6,lp[1]+12,'(sealed wafer pods)','svglbl',{'font-size':9.5});
  const tp=P(o,0,300,0);txt(svg,tp[0]+10,tp[1]+22,'TSMC CLEANROOM (cutaway)','svglbl v',{'font-size':11});
})();

/* ======================= CH5 PROCESS STEPPER ======================= */
const FAB=[
  {n:'Thin-film deposition',d:'A thin layer of material (an insulator, metal or other film) is laid down over the whole wafer, often just atoms to nanometers thick. That film is what the circuit will be carved from.',who:[['Applied Materials','US','tool'],['Lam Research','US','tool']]},
  {n:'Photoresist coating',d:'A light-sensitive chemical, photoresist, is spun onto the wafer as an even coat. It acts as a stencil-to-be. A coater/developer "track" applies it; the resist chemistry comes from specialist materials makers such as JSR, Shin-Etsu and TOK.',who:[['Tokyo Electron','JP','tool'],['JSR','JP','mat'],['Shin-Etsu','JP','mat']]},
  {n:'Lithographic exposure',d:'The scanner projects the pattern from a mask onto the resist. Light chemically changes the exposed regions. Nothing is cut yet; the pattern exists only as a latent image in the resist.',who:[['ASML','NL','tool']]},
  {n:'Resist development',d:'A developer solution washes away the exposed resist (for a "positive" resist), leaving a stencil of openings that matches the mask pattern. The same track tool that coated the wafer usually develops it.',who:[['Tokyo Electron','JP','tool']]},
  {n:'Pattern transfer (etch)',d:'Plasma etch tools remove the film wherever the stencil is open, cutting straight down. The resist protects everything else. Now the pattern is physically in the material.',who:[['Lam Research','US','tool'],['Tokyo Electron','JP','tool'],['Applied Materials','US','tool']]},
  {n:'Strip, fill and further processing',d:'The leftover resist is stripped. Depending on the layer, trenches may be filled with metal and polished flat, or ions implanted, or the wafer cleaned and annealed. Each layer has its own recipe.',who:[['Applied Materials','US','tool'],['Lam Research','US','tool']]},
  {n:'Layer-by-layer repetition',d:'The wafer loops back through deposition, coating, exposure, etch and more. The source video puts it at around 80 passes. Transistors are built at the bottom first, then wiring layers stack on top. Not every layer follows the same steps.',who:[]},
  {n:'Inspection and process control',d:'Between steps, inspection and metrology tools scan for particles, pattern defects and misalignment, and measure film thickness and feature sizes. Problems caught early can be fixed before more value is added.',who:[['KLA','US','test']]}];
let fabStep=0,fabTimer=null,repN=0;
function buildRail(){const r=$('#fabRail');FAB.forEach((s,i)=>{const b=document.createElement('button');b.setAttribute('role','tab');b.innerHTML=`<span class="n">0${i+1}</span>${s.n}`;b.addEventListener('click',()=>{stopPlay();setFab(i);});
  b.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();stopPlay();setFab((fabStep+1)%8);r.children[fabStep].focus();}if(e.key==='ArrowLeft'){e.preventDefault();stopPlay();setFab((fabStep+7)%8);r.children[fabStep].focus();}});r.appendChild(b);});}
function setFab(i){fabStep=i;$$('#fabRail button').forEach((b,k)=>{b.setAttribute('aria-selected',String(k===i));b.classList.toggle('done',k<i);b.tabIndex=k===i?0:-1;});
  $('#fabCount').textContent=(i+1)+' / 8';const s=FAB[i];setRead('fabRead',(i+1)+'. '+s.n,s.d,s.who);drawXS(i);}
function drawXS(i){
  const svg=$('#xsSvg');clear(svg);glowFilter(svg,'gx',COL.violet,4);
  const W=640,base=330;
  // substrate + existing device layer
  el('rect',{x:0,y:base,width:W,height:70,fill:'#3d4b72'},svg);txt(svg,12,392,'silicon wafer (with layers already built)','svglbl w',{'font-size':10});
  el('rect',{x:0,y:base-26,width:W,height:26,fill:'#2b3658'},svg);
  for(let k=0;k<8;k++)el('rect',{x:30+k*78,y:base-22,width:30,height:18,fill:COL.teal,opacity:.55},svg);
  const filmTop=base-60,resistTop=filmTop-34;
  const opens=[[90,150],[250,310],[410,470]];
  if(i===6){ // repetition: accumulating stack
    const layersN=10;let y=base-26;
    for(let L=0;L<layersN;L++){const h=L<3?12:L<7?16:22;y-=h;const col=L<3?COL.teal:(L%2?COL.violet:COL.cyan);
      el('rect',{x:0,y,width:W,height:h,fill:'#1a2342',stroke:'#2b3a62','stroke-width':.5},svg);
      const n=L<3?16:L<7?10:6;for(let k=0;k<n;k++){const w=W/n;el('rect',{x:k*w+w*.25,y:y+2,width:w*.5,height:h-4,fill:col,opacity:.7,class:'rep'+L},svg);}
    }
    el('path',{d:`M612,${base-30} V${y+4}`,stroke:COL.white,'stroke-width':1.5},svg);el('path',{d:`M606,${y+12} l6,-8 l6,8`,fill:'none',stroke:COL.white},svg);
    txt(svg,604,base-60,'transistors + contacts first','svglbl t',{'text-anchor':'end'});txt(svg,604,y+26,'wiring layers on top','svglbl c',{'text-anchor':'end'});
    txt(svg,20,40,'EACH BAND = one patterning loop (or several)','svglbl w');
    // loop icon
    const g=el('g',{transform:'translate(70,95)'},svg);el('circle',{r:28,fill:'none',stroke:COL.violet,'stroke-width':2,'stroke-dasharray':'120 60'},g);el('path',{d:'M24,-14 l6,10 l-12,0z',fill:COL.violet},g);
    if(!reduced)el('animateTransform',{attributeName:'transform',type:'rotate',from:'0',to:'360',dur:'4s',repeatCount:'indefinite',additive:'sum'},g);
    txt(svg,110,92,'deposit → coat → expose → develop → etch → …','svglbl v',{'font-size':10.5});txt(svg,110,108,'repeated layer after layer','svglbl',{'font-size':10.5});
    return;}
  // film
  const filmOn=i>=0;
  if(filmOn){if(i<=3){el('rect',{x:0,y:filmTop,width:W,height:34,fill:'#5b6b8f',class:i===0?'glow-v':null},svg);}
    else if(i>=4){ // etched film: segments between openings
      let prev=0;opens.forEach(op=>{el('rect',{x:prev,y:filmTop,width:op[0]-prev,height:34,fill:'#5b6b8f'},svg);prev=op[1];});el('rect',{x:prev,y:filmTop,width:W-prev,height:34,fill:'#5b6b8f'},svg);
      if(i>=5){opens.forEach(op=>el('rect',{x:op[0],y:filmTop,width:op[1]-op[0],height:34,fill:COL.copper,opacity:.9},svg));}
    }}
  if(i===0){ // atoms raining
    for(let k=0;k<40;k++){const x=(k*53)%W,y=40+((k*37)%200);const c=el('circle',{cx:x,cy:y,r:2.2,fill:COL.violet,opacity:.8},svg);
      if(!reduced){el('animate',{attributeName:'cy',from:y-60,to:filmTop-2,dur:(1.2+(k%5)*.3)+'s',repeatCount:'indefinite'},c);}}
    txt(svg,W-12,filmTop-8,'new thin film','svglbl v',{'text-anchor':'end'});}
  // resist
  if(i>=1&&i<=4){if(i<=2){el('rect',{x:0,y:resistTop,width:W,height:34,fill:'#c9a3ff',opacity:.55,class:i===1?'glow-v':null},svg);}
    if(i===2){opens.forEach(op=>el('rect',{x:op[0],y:resistTop,width:op[1]-op[0],height:34,fill:'url(#hatch)'},svg));
      const d=defs(svg);const pt=el('pattern',{id:'hatch',width:6,height:6,patternUnits:'userSpaceOnUse',patternTransform:'rotate(45)'},d);el('rect',{width:6,height:6,fill:'#ffd6f0',opacity:.5},pt);el('line',{x1:0,y1:0,x2:0,y2:6,stroke:'#fff','stroke-width':2},pt);
      // mask + light
      el('rect',{x:0,y:66,width:W,height:12,fill:'#1d2340',stroke:COL.ti,'stroke-dasharray':'4 4'},svg);
      txt(svg,10,58,'patterned light arriving from the scanner\'s mirror optics (see Chapter 6)','svglbl w');
      opens.forEach(op=>{for(let k=0;k<4;k++){const x=op[0]+8+k*16;el('rect',{x:x-3,y:80,width:6,height:resistTop-80,fill:COL.violet,opacity:.18},svg);el('line',{x1:x,x2:x,y1:80,y2:resistTop,stroke:COL.violet,'stroke-width':2.2,class:'flowdash'},svg);}});
      txt(svg,W-12,resistTop-8,'exposed resist (latent image)','svglbl v',{'text-anchor':'end'});}
    if(i>=3){let prev=0;opens.forEach(op=>{el('rect',{x:prev,y:resistTop,width:op[0]-prev,height:34,fill:'#c9a3ff',opacity:.55},svg);prev=op[1];});el('rect',{x:prev,y:resistTop,width:W-prev,height:34,fill:'#c9a3ff',opacity:.55},svg);
      txt(svg,W-12,resistTop-8,i===3?'openings where resist was exposed':'resist protects; plasma cuts the openings','svglbl v',{'text-anchor':'end'});}
    if(i===4){opens.forEach(op=>{for(let k=0;k<5;k++){const x=op[0]+6+k*12;el('line',{x1:x,x2:x,y1:resistTop-40,y2:filmTop+30,stroke:COL.cyan,'stroke-width':1.5,'stroke-dasharray':'2 4',class:'flowdash'},svg);}});}
    if(i===1)txt(svg,W-12,resistTop-8,'photoresist coat','svglbl v',{'text-anchor':'end'});}
  if(i===5){txt(svg,W-12,filmTop-10,'resist stripped · trenches filled with metal · polished flat','svglbl',{'text-anchor':'end',fill:COL.copper});}
  if(i===7){ // inspection beam
    el('rect',{x:0,y:filmTop,width:W,height:34,fill:'#5b6b8f'},svg);opens.forEach(op=>el('rect',{x:op[0],y:filmTop,width:op[1]-op[0],height:34,fill:COL.copper,opacity:.9},svg));
    el('circle',{cx:330,cy:filmTop-2,r:9,fill:'none',stroke:COL.coral,'stroke-width':2},svg);el('circle',{cx:330,cy:filmTop-4,r:3,fill:COL.coral},svg);
    txt(svg,346,filmTop-14,'particle flagged','svglbl r');
    const beam=el('polygon',{points:`200,40 230,40 ${330},${filmTop-4}`,fill:COL.cyan,opacity:.25},svg);
    el('rect',{x:180,y:20,width:70,height:22,fill:'#2a3346',stroke:COL.coral},svg);txt(svg,215,35,'inspect','svglbl w',{'text-anchor':'middle','font-size':10});
    if(!reduced){el('animateTransform',{attributeName:'transform',type:'translate',values:'-150 0;250 0;-150 0',dur:'5s',repeatCount:'indefinite'},beam);}
  }
}
function stopPlay(){if(fabTimer){clearInterval(fabTimer);fabTimer=null;$('#fabPlay').setAttribute('aria-pressed','false');$('#fabPlay').textContent='▶ Play cycle';}}
buildRail();setFab(0);
$('#fabPrev').addEventListener('click',()=>{stopPlay();setFab((fabStep+7)%8);});
$('#fabNext').addEventListener('click',()=>{stopPlay();setFab((fabStep+1)%8);});
$('#fabPlay').addEventListener('click',()=>{if(fabTimer){stopPlay();return;}$('#fabPlay').setAttribute('aria-pressed','true');$('#fabPlay').textContent='❚❚ Pause';fabTimer=setInterval(()=>setFab((fabStep+1)%8),2600);});

/* ======================= CH6 LITHOGRAPHY ======================= */
const LITHO=[
  {n:'Light source',d:'A high-power CO₂ laser hits tiny droplets of molten tin tens of thousands of times a second. Each hit makes a plasma that glows with 13.5 nm EUV light. A collector mirror gathers it.',k:'src'},
  {n:'Illuminator',d:'A train of multilayer mirrors shapes and evens out the light so the mask is lit uniformly. Every mirror loses some light, so the source has to be extremely bright to start with.',k:'ill'},
  {n:'Reticle (mask)',d:'The reticle carries one layer\'s pattern, at four times final size. For EUV it is a reflective mirror with an absorber pattern on top, held upside-down on a stage that scans back and forth.',k:'ret'},
  {n:'Projection optics',d:'Another set of precision mirrors shrinks the reflected pattern by 4× and focuses it onto the wafer. Mirror surfaces must be polished to atomic-scale smoothness.',k:'proj'},
  {n:'Exposure on the wafer',d:'The wafer stage and reticle stage scan in perfect sync, printing one field, then stepping to the next, until the whole wafer is covered. The light leaves a latent image in the resist.',k:'waf'},
  {n:'Develop → pattern',d:'Back on the track, development removes the exposed resist. What remains is a stencil of the circuit layer, ready for etch. Then the wafer goes back for the next layer.',k:'dev'}];
let lithoStep=0;
function drawLitho(i){
  const svg=$('#lithoSvg');clear(svg);glowFilter(svg,'gl',COL.violet,5);glowFilter(svg,'gla',COL.amber,4);
  const on=(k)=>LITHO[i].k===k;const dim=(k)=>on(k)?1:.45;
  // chamber outline
  el('rect',{x:20,y:30,width:640,height:460,rx:16,fill:'#0a1226',stroke:COL.line2},svg);txt(svg,36,52,'VACUUM ENCLOSURE','svglbl',{'font-size':10});
  // source vessel
  const sg=el('g',{opacity:dim('src')},svg);
  el('rect',{x:40,y:300,width:150,height:160,rx:10,fill:'#1a2033',stroke:on('src')?COL.amber:COL.ti},sg);
  el('line',{x1:20,x2:100,y1:430,y2:388,stroke:COL.amber,'stroke-width':3,filter:'url(#gla)'},sg);txt(sg,46,478,'CO₂ laser','svglbl a');
  for(let k=0;k<5;k++)el('circle',{cx:110,cy:320+k*12,r:2.5,fill:'#c9d4ee'},sg);
  el('circle',{cx:110,cy:386,r:10,fill:COL.violet,filter:'url(#gl)'},sg);
  el('path',{d:'M60,420 Q110,470 165,420',fill:'none',stroke:'#c5d2ef','stroke-width':4},sg);txt(sg,170,446,'collector','svglbl',{'font-size':10});
  txt(sg,48,318,'tin droplets','svglbl',{'font-size':10});
  // illuminator mirrors
  const ig=el('g',{opacity:dim('ill')},svg);
  [[210,290],[260,130]].forEach(m=>{el('rect',{x:m[0]-26,y:m[1]-5,width:52,height:10,rx:2,fill:'#c5d2ef',stroke:on('ill')?COL.cyan:'none',transform:`rotate(-20 ${m[0]} ${m[1]})`},ig);});
  txt(ig,222,320,'illuminator mirrors','svglbl',{'font-size':10});
  // reticle stage top
  const rg=el('g',{opacity:dim('ret')},svg);
  el('rect',{x:310,y:58,width:200,height:22,fill:'#1d2340',stroke:on('ret')?COL.cyan:COL.ti},rg);
  for(let k=0;k<9;k++)el('rect',{x:318+k*21,y:76,width:10,height:4,fill:'#060b18'},rg);
  txt(rg,410,50,'REFLECTIVE RETICLE · scanning stage','svglbl w',{'text-anchor':'middle','font-size':10});
  if(!reduced&&(on('waf')||on('ret')))el('animateTransform',{attributeName:'transform',type:'translate',values:'-20 0;20 0;-20 0',dur:'2s',repeatCount:'indefinite'},rg);
  // projection optics box
  const pg=el('g',{opacity:dim('proj')},svg);
  el('rect',{x:330,y:150,width:200,height:220,rx:10,fill:'#121a33',stroke:on('proj')?COL.cyan:COL.ti},pg);
  [[360,190,20],[500,220,-20],[370,280,15],[490,320,-15]].forEach(m=>el('rect',{x:m[0]-24,y:m[1]-4,width:48,height:8,rx:2,fill:'#c5d2ef',transform:`rotate(${m[2]} ${m[0]} ${m[1]})`},pg));
  txt(pg,430,390,'PROJECTION MIRRORS · 4× reduction','svglbl w',{'text-anchor':'middle','font-size':10});
  // wafer stage
  const wg=el('g',{opacity:dim('waf')>.5||on('dev')?1:.45},svg);
  el('rect',{x:320,y:430,width:240,height:26,fill:'#2a3346',stroke:on('waf')?COL.cyan:COL.ti},wg);
  el('ellipse',{cx:440,cy:428,rx:90,ry:9,fill:'#7c8db5',stroke:'#c9a3ff','stroke-width':2},wg);
  txt(wg,440,474,'WAFER ON SCANNING STAGE · resist on top','svglbl w',{'text-anchor':'middle','font-size':10});
  if(!reduced&&on('waf'))el('animateTransform',{attributeName:'transform',type:'translate',values:'5 0;-5 0;5 0',dur:'2s',repeatCount:'indefinite'},wg);
  // light path (only up to current step)
  const path=[[110,386],[210,290],[260,130],[350,80],[360,190],[500,220],[370,280],[490,320],[440,425]];
  const upto=[3,3,4,8,9,9][i];
  const d='M'+path.slice(0,upto).map(p=>p.join(',')).join(' L');
  el('path',{d,fill:'none',stroke:COL.violet,'stroke-width':i>=3?3:4,'stroke-linejoin':'round',filter:'url(#gl)',opacity:.95},svg);
  el('path',{d,fill:'none',stroke:'#fff','stroke-width':1,'stroke-dasharray':'4 8',class:'flowdash',opacity:.8},svg);
  // inset: resist state
  const ix=560,iy=130;const ig2=el('g',null,svg);
  el('rect',{x:ix-10,y:iy-30,width:110,height:150,rx:8,fill:'#081325',stroke:COL.line2},ig2);txt(ig2,ix+45,iy-14,'RESIST','svglbl',{'text-anchor':'middle','font-size':9.5});
  el('rect',{x:ix,y:iy+70,width:90,height:20,fill:'#5b6b8f'},ig2);
  const ops=[[ix+12,ix+26],[ix+40,ix+52],[ix+66,ix+80]];
  if(i<4){el('rect',{x:ix,y:iy+46,width:90,height:24,fill:'#c9a3ff',opacity:.55},ig2);txt(ig2,ix+45,iy+20,'unexposed','svglbl',{'text-anchor':'middle','font-size':9.5});}
  else if(i===4){el('rect',{x:ix,y:iy+46,width:90,height:24,fill:'#c9a3ff',opacity:.55},ig2);ops.forEach(o2=>el('rect',{x:o2[0],y:iy+46,width:o2[1]-o2[0],height:24,fill:'#ffd6f0',opacity:.9},ig2));txt(ig2,ix+45,iy+20,'latent image','svglbl v',{'text-anchor':'middle','font-size':9.5});}
  else{let pv=ix;ops.forEach(o2=>{el('rect',{x:pv,y:iy+46,width:o2[0]-pv,height:24,fill:'#c9a3ff',opacity:.7},ig2);pv=o2[1];});el('rect',{x:pv,y:iy+46,width:ix+90-pv,height:24,fill:'#c9a3ff',opacity:.7},ig2);txt(ig2,ix+45,iy+20,'stencil','svglbl t',{'text-anchor':'middle','font-size':9.5});}
  txt(svg,36,74,'ASML EUV SYSTEM (schematic)','svglbl v',{'font-size':10});
}
function setLitho(i){lithoStep=i;$$('#lithoTabs .btn').forEach((b,k)=>{b.setAttribute('aria-selected',String(k===i));b.tabIndex=k===i?0:-1;});const s=LITHO[i];setRead('lithoRead',(i+1)+'. '+s.n,s.d,i===5?[['Tokyo Electron','JP','tool']]:[['ASML','NL','tool']]);drawLitho(i);}
(function(){const t=$('#lithoTabs');LITHO.forEach((s,i)=>{const b=document.createElement('button');b.className='btn v';b.setAttribute('role','tab');b.innerHTML=`<span class="k">${i+1}</span>${s.n}`;b.addEventListener('click',()=>setLitho(i));
  b.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const n=(lithoStep+(e.key==='ArrowRight'?1:5))%6;setLitho(n);t.querySelectorAll('.btn')[n].focus();}});t.appendChild(b);});})();
setLitho(0);
(function scale(){const svg=$('#scaleSvg');const x0=30,x1=570,y=90;el('line',{x1:x0,x2:x1,y1:y,y2:y,stroke:COL.ti,'stroke-width':1.5},svg);
  // log10 meters from -1 (0.1 m) to -8 (10 nm)
  const X=(e)=>x0+(x1-x0)*(-e)/8;
  for(let e=0;e>=-8;e--){const x=X(e);el('line',{x1:x,x2:x,y1:y-6,y2:y+6,stroke:COL.ti},svg);}
  [[0,'1 m'],[-3,'1 mm'],[-6,'1 µm'],[-8,'10 nm']].forEach(m=>txt(svg,X(m[0]),y+22,m[1],'svglbl',{'text-anchor':'middle','font-size':10}));
  const marks=[[Math.log10(0.3),'wafer · 300 mm',COL.white,-1],[Math.log10(0.025),'large die · ~cm',COL.cyan,1],[Math.log10(7e-5),'human hair',COL.amber,-1],[Math.log10(3e-8),'finest features · tens of nm',COL.violet,1]];
  marks.forEach(m=>{const x=X(m[0]);el('circle',{cx:x,cy:y,r:5,fill:m[2]},svg);const ty=m[3]<0?y-24:y+44;el('line',{x1:x,x2:x,y1:y,y2:ty+(m[3]<0?6:-12),stroke:m[2],'stroke-opacity':.6},svg);txt(svg,x,ty,m[1],'svglbl',{'text-anchor':'middle',fill:m[2],'font-size':10.5});});
  txt(svg,x0,20,'LOG SCALE · each tick = 10× smaller · labels 1,000× apart','svglbl',{'font-size':9.5});})();

/* ======================= CH7 WAFER MAP ======================= */
const MAP={R:240,cx:280,cy:280,dw:34,dh:40};
const dies=[];(function(){const {R,cx,cy,dw,dh}=MAP;for(let i=-8;i<8;i++)for(let j=-7;j<7;j++){const x=cx+i*dw,y=cy+j*dh;const c=[[x,y],[x+dw,y],[x,y+dh],[x+dw,y+dh]].every(q=>Math.hypot(q[0]-cx,q[1]-cy)<R-6);if(c)dies.push({i,j,x,y,fail:false,why:[]});}})();
const DEFECTS=[
  {id:'particle',n:'Particle cluster',col:COL.coral,who:[['KLA','US','test']],d:'A cluster of particles landed during one step. Any die it touches may be killed. Inspection between steps found it, so engineers can trace which tool shed the particles and fix it before other wafers are hit.',hit:d=>Math.hypot(d.x+17-210,d.y+20-200)<55,draw:(g)=>{for(let k=0;k<14;k++){el('circle',{cx:210+Math.cos(k*2.3)*28*((k%4)/4+.3),cy:200+Math.sin(k*1.7)*26*((k%3)/3+.3),r:2.6,fill:COL.coral},g);}}},
  {id:'scratch',n:'Scratch',col:COL.coral,who:[['KLA','US','test']],d:'A long scratch, often from handling or polishing, cuts across several dies in a line. It shows up as a distinctive arc on the inspection map, which points engineers toward the mechanical cause.',hit:d=>{const t=((d.x+17)-300)/160;const yy=330+t*90;return Math.abs((d.y+20)-yy)<24&&(d.x+17)>300&&(d.x+17)<470;},draw:(g)=>el('path',{d:'M300,330 Q390,360 470,420',stroke:COL.coral,'stroke-width':2.5,fill:'none'},g)},
  {id:'edge',n:'Edge-ring loss',col:COL.coral,who:[['KLA','US','test']],d:'Dies near the wafer edge are more likely to fail, because films and focus are harder to control there. With large AI dies, a ring of edge losses removes a meaningful share of the wafer.',hit:d=>Math.hypot(d.x+17-MAP.cx,d.y+20-MAP.cy)>MAP.R-58,draw:(g)=>el('circle',{cx:MAP.cx,cy:MAP.cy,r:MAP.R-22,fill:'none',stroke:COL.coral,'stroke-width':10,'stroke-opacity':.25},g)},
  {id:'repeater',n:'Repeating pattern defect',col:COL.coral,who:[['KLA','US','test']],d:'The same flaw at the same spot in every die points to the mask or the lithography step, not a random particle: each exposure prints it again. On this wafer, inspection caught it as a marginal pattern before it killed dies, but left unfixed it would repeat on every die of every wafer.',kill:false,hit:d=>true,draw:(g)=>{dies.forEach(d=>el('rect',{x:d.x+22,y:d.y+8,width:5,height:5,fill:COL.coral,opacity:.85},g));}}];
let mapSel=null,sorted=false,diced=false;
function drawMap(){
  const svg=$('#mapSvg');clear(svg);radGrad(svg,'mgrad',[[0,'#3a4a72'],[1,'#1e2a4c']]);
  const {R,cx,cy,dw,dh}=MAP;
  el('circle',{cx,cy,r:R,fill:'url(#mgrad)',stroke:'#c5d2ef'},svg);
  el('path',{d:`M${cx-7},${cy+R} l7,-9 l7,9`,fill:'#060b18'},svg);
  const g=el('g',null,svg);
  dies.forEach(d=>{let fill='#24345e',st='#5f75a8';
    if(sorted){fill=d.fail?'#5a2330':'#14453c';st=d.fail?COL.coral:COL.teal;}
    if(mapSel&&DEFECTS.find(x=>x.id===mapSel).hit(d)){st=COL.coral;fill=sorted?fill:'#4a2738';}
    let tx=0,ty=0;if(diced){const vx=d.x+dw/2-cx,vy=d.y+dh/2-cy;tx=vx*.12;ty=vy*.12;}
    const r=el('rect',{x:d.x+1+tx,y:d.y+1+ty,width:dw-2,height:dh-2,fill,stroke:st,'stroke-width':1},g);
    if(diced&&!reduced){r.style.transition='x .6s, y .6s';}});
  const dg=el('g',null,svg);DEFECTS.forEach(D=>{const s=el('g',{opacity:(!mapSel||mapSel===D.id)?1:.25},dg);D.draw(s);});
  if(sorted){const pass=dies.filter(d=>!d.fail).length;txt(svg,cx,568,`ILLUSTRATIVE SORT · ${pass} of ${dies.length} dies pass`,'svglbl t',{'text-anchor':'middle'});}
  else txt(svg,cx,568,`${dies.length} complete dies on this (illustrative) wafer`,'svglbl',{'text-anchor':'middle'});
  if(diced){txt(svg,cx,592,'DICED · good dies go on to packaging; failed dies are scrapped','svglbl w',{'text-anchor':'middle','font-size':10.5});}
}
dies.forEach(d=>{DEFECTS.forEach(D=>{if(D.kill!==false&&D.hit(d))d.why.push(D.id);});d.fail=d.why.length>0;});
(function(){const box=$('#defectBtns');DEFECTS.forEach(D=>{const b=document.createElement('button');b.className='btn';b.setAttribute('aria-pressed','false');b.textContent=D.n;b.dataset.def=D.id;
  b.addEventListener('click',()=>{mapSel=mapSel===D.id?null:D.id;$$('#defectBtns .btn').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.def===mapSel)));
    if(mapSel){const n=dies.filter(D.hit).length;setRead('mapRead',D.n,D.d+` <em>On this map it touches ${n} dies.</em>`,D.who);}else mapIntro();drawMap();});box.appendChild(b);});})();
function mapIntro(){setRead('mapRead','Why defects matter','Every complete die on this wafer is a potential AI processor. Each defect that lands on a die can kill it, so the fraction of good dies (the yield) drives the cost of every chip. Select a finding to see where it is and what it means.',[['KLA','US','test']]);}
mapIntro();
$('#sortBtn').addEventListener('click',e=>{sorted=!sorted;e.currentTarget.setAttribute('aria-pressed',String(sorted));e.currentTarget.textContent=sorted?'Hide sort results':'Run electrical sort';
  if(sorted){const pass=dies.filter(d=>!d.fail).length;setRead('mapRead','Wafer sort (illustrative)',`Before cutting, probe cards touch every die and automated testers run electrical tests. Here ${pass} of ${dies.length} dies pass (green) and ${dies.length-pass} fail (red). These numbers are made up for teaching; real yields are confidential.`,[['Advantest','JP','test'],['Teradyne','US','test']]);}else mapIntro();drawMap();});
$('#diceBtn').addEventListener('click',e=>{diced=!diced;e.currentTarget.setAttribute('aria-pressed',String(diced));e.currentTarget.textContent=diced?'Reassemble wafer':'Dice the wafer';
  if(diced)setRead('mapRead','Dicing','Saws and lasers cut along the scribe lanes to separate the dies. Good dies move on to packaging, where they\'ll be tested again as finished parts.',[['DISCO','JP','tool']]);else mapIntro();drawMap();});
drawMap();

/* ======================= CH8 PACKAGE ======================= */
const PKG={sel:'all',ex:1,path:false};
const PKGP=[
  {id:'logic',n:'Logic dies',d:'Two near-maximum-size GPU dies, cut from the wafer in Chapter 7, joined so tightly they act as one GPU. They do the math, but only as fast as data arrives.',who:[['TSMC','TW','fab']]},
  {id:'hbm',n:'HBM stacks',d:'Each tower is several DRAM dies stacked on a base die and connected vertically by through-silicon vias (TSVs). The memory makers build these in their own memory fabs and ship finished stacks to TSMC. Placing them right next to the GPU gives thousands of parallel wires and enormous bandwidth.',who:[['SK Hynix','KR','mem'],['Micron','US','mem'],['Samsung','KR','mem']]},
  {id:'bumps',n:'Microbumps & connections',d:'Tens of thousands of tiny solder bumps join the dies to the interposer. Larger bumps join the interposer to the substrate, and solder balls underneath connect the package to the board.',who:[]},
  {id:'interposer',n:'Interposer + bridges',d:'The layer everything sits on, carrying signals sideways between dies and down to the substrate. Nvidia\'s Blackwell GPUs use TSMC\'s CoWoS-L: fine wiring layers with small silicon bridges embedded only where dies meet. The older Hopper generation used one large silicon interposer (CoWoS-S).',who:[['TSMC','TW','fab']]},
  {id:'substrate',n:'Package substrate (ABF)',d:'A multilayer board-like base that spreads connections out to a coarser pitch. Its insulating build-up layers (striped) are made from Ajinomoto Build-up Film; substrate makers such as Unimicron and Ibiden build the substrate itself.',who:[['Ajinomoto','JP','mat']]},
  {id:'all',n:'Completed package',d:'Collapsed, the pieces form one package several centimeters across. Without the HBM, interposer and substrate, the logic dies would be very expensive paperweights.',who:[['TSMC','TW','fab'],['SK Hynix','KR','mem'],['Micron','US','mem'],['Ajinomoto','JP','mat']]}];
function drawPkg(){
  const svg=$('#pkgSvg');clear(svg);glowFilter(svg,'g8',COL.violet,4);glowFilter(svg,'g8c',COL.cyan,4);
  const o={x:250,y:310,s:.8};const e=PKG.ex;const sel=PKG.sel;
  const op=(id)=>sel==='all'||sel===id?1:.16;
  const zS=0,zC=40+90*e, zI=zC+14+60*e, zB=zI+8+40*e;
  const SW=300,SD=260;
  // substrate (ABF build-up layers in gold)
  const gs=el('g',{opacity:op('substrate'),class:'hl'},svg);
  for(let i=0;i<9;i++)for(let j=0;j<8;j++){const p=P(o,20+i*33,20+j*31,zS-4);el('circle',{cx:p[0],cy:p[1],r:3.6,fill:'#c9c9d6'},gs);}
  const layersS=[['#1f5c3a',6],['#d6c27a',4],['#24314f',6],['#d6c27a',4],['#2a3a5a',8],['#d6c27a',4],['#1f5c3a',5]];
  let zz=zS;layersS.forEach(L=>{box(gs,o,{x:0,y:0,z:zz,w:SW,d:SD,h:L[1],c:L[0],stroke:'#7a8aa8',sw:.3});zz+=L[1];});
  let p=P(o,SW,0,zz/2);txt(gs,p[0]+12,p[1],'PACKAGE SUBSTRATE','svglbl w');txt(gs,p[0]+12,p[1]+13,'gold = ABF build-up layers','svglbl',{'font-size':10,fill:'#d6c27a'});
  // C4 bumps
  const gb=el('g',{opacity:op('bumps'),class:'hl'},svg);
  for(let i=0;i<11;i++)for(let j=0;j<9;j++){const q=P(o,45+i*21,45+j*21,zz+(zC-zz)/2);el('circle',{cx:q[0],cy:q[1],r:2.2,fill:'#e2e6f0'},gb);}
  // CoWoS-L interposer: molded RDL interposer + embedded local silicon bridges
  const gi=el('g',{opacity:op('interposer'),class:'hl'},svg);
  box(gi,o,{x:30,y:30,z:zC,w:240,d:200,h:12,c:'#3a4258',stroke:'#c5d2ef',sw:.5});
  for(let k=0;k<14;k++)line3(gi,o,[38+k*17,36,zC+12],[38+k*17,224,zC+12],{stroke:COL.cyan,'stroke-opacity':.28,'stroke-width':.7});
  const bridges=[];[44,90,136,182].forEach(y=>{bridges.push([78,y+8,18,22]);bridges.push([204,y+8,18,22]);});bridges.push([128,120,44,18]);
  bridges.forEach(b=>box(gi,o,{x:b[0],y:b[1],z:zC+9,w:b[2],d:b[3],h:3.5,c:'#9fb0d6',stroke:'#fff',sw:.4}));
  p=P(o,270,30,zC+6);txt(gi,p[0]+12,p[1],'INTERPOSER (CoWoS-L)','svglbl w');txt(gi,p[0]+12,p[1]+13,'wiring layers + embedded','svglbl',{'font-size':10});txt(gi,p[0]+12,p[1]+25,'silicon bridges (light)','svglbl',{'font-size':10});
  // microbumps
  const gb2=el('g',{opacity:op('bumps'),class:'hl'},svg);
  for(let i=0;i<15;i++)for(let j=0;j<12;j++){const q=P(o,44+i*15,40+j*16,zI+(zB-zI)/2-2);el('circle',{cx:q[0],cy:q[1],r:1.4,fill:'#e2e6f0'},gb2);}
  p=P(o,30,230,zI);txt(gb,Math.max(8,p[0]-130),p[1]+6,'BUMPS & SOLDER','svglbl w');
  // objects: 8 HBM stacks + 2 logic dies, painter-sorted
  const gh=el('g',{opacity:op('hbm'),class:'hl',filter:sel==='hbm'?'url(#g8)':null},svg);
  const gl=el('g',{opacity:op('logic'),class:'hl',filter:sel==='logic'?'url(#g8c)':null},svg);
  const objs=[];[40,86,132,178].forEach(y=>{objs.push({t:'h',x:42,y});objs.push({t:'h',x:220,y});});
  objs.push({t:'l',x:96,y:44,w:108,d:82});objs.push({t:'l',x:96,y:134,w:108,d:82});
  objs.sort((a,b)=>(a.x+a.y)-(b.x+b.y));
  objs.forEach(ob=>{if(ob.t==='h'){for(let k=0;k<9;k++)box(gh,o,{x:ob.x,y:ob.y,z:zB+k*(5+e*2.5),w:36,d:40,h:5,c:k===0?'#3a2f6e':'#4b3a92',stroke:COL.violet,sw:.4});}
    else{box(gl,o,{x:ob.x,y:ob.y,z:zB,w:ob.w,d:ob.d,h:9,c:'#1d5a7c',stroke:COL.cyan,sw:.8});for(let c=0;c<4;c++)plane(gl,o,ob.x+6+c*25,ob.y+8,zB+9,21,ob.d-16,{fill:COL.cyan,opacity:.18});}});
  p=P(o,150,44,zB+12);txt(gl,p[0]+70,p[1]-70,'2 LOGIC DIES (one GPU)','svglbl c');
  p=P(o,42,40,zB+60);txt(gh,p[0]-130,p[1]-10,'8 HBM STACKS','svglbl v');txt(gh,p[0]-130,p[1]+4,'DRAM dies on a base die','svglbl',{'font-size':10});
  if(PKG.path){const a=P(o,60,60,zB+30+e*20),b=P(o,60,60,zC+12),c2=P(o,87,60,zC+12),d=P(o,110,60,zC+12),f=P(o,110,60,zB);
    const dpath=`M${a[0]},${a[1]} L${b[0]},${b[1]} L${c2[0]},${c2[1]} L${d[0]},${d[1]} L${f[0]},${f[1]}`;
    el('path',{d:dpath,fill:'none',stroke:COL.violet,'stroke-width':3,filter:'url(#g8)'},svg);el('path',{d:dpath,fill:'none',stroke:'#fff','stroke-width':1,'stroke-dasharray':'3 6',class:'flowdash'},svg);
    txt(svg,c2[0]+10,c2[1]+24,'HBM → bumps → silicon bridge → bumps → GPU die','svglbl v',{'font-size':10});}
}
(function(){const box=$('#pkgBtns');PKGP.forEach(pp=>{const b=document.createElement('button');b.className='btn'+(pp.id==='hbm'||pp.id==='interposer'?' v':'');b.textContent=pp.n;b.dataset.pkg=pp.id;b.setAttribute('aria-pressed',String(pp.id==='all'));
  b.addEventListener('click',()=>{PKG.sel=pp.id;$$('#pkgBtns .btn').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));setRead('pkgRead',pp.n,pp.d,pp.who);drawPkg();});box.appendChild(b);});})();
$('#explodeBtn').addEventListener('click',e=>{const target=PKG.ex>.5?0:1;const from=PKG.ex;const b=e.currentTarget;b.setAttribute('aria-pressed',String(target===1));b.textContent=target?'Collapse package':'Explode package';
  tween(700,k=>{PKG.ex=from+(target-from)*k;drawPkg();});});
$('#pathBtn').addEventListener('click',e=>{PKG.path=!PKG.path;e.currentTarget.setAttribute('aria-pressed',String(PKG.path));drawPkg();
  if(PKG.path)setRead('pkgRead','Memory ↔ logic connection','Data leaves an HBM stack through its bottom bumps, crosses a few millimeters through an embedded silicon bridge\'s ultra-fine wiring, and climbs into the GPU die. Thousands of these paths run in parallel, which is what "high bandwidth" means here.',[['SK Hynix','KR','mem'],['Micron','US','mem'],['TSMC','TW','fab']]);});
setRead('pkgRead',PKGP[5].n,PKGP[5].d,PKGP[5].who);drawPkg();

/* ======================= CH9 COMPUTE TRAY ======================= */
const TRAY=[
  {n:'Tray enclosure',d:'A thin sheet-metal tray, one rack unit (1U, about 4.4 cm) tall, built to slide into a rack. Everything else mounts inside it.',who:[['Foxconn','TW','int'],['Wistron','TW','int']]},
  {n:'Board + power distribution',d:'The main board carries power and signals. Thick copper planes and voltage regulators turn the rack\'s DC power into the very low, very high-current voltages the chips need.',who:[['Foxconn','TW','int'],['Wistron','TW','int']]},
  {n:'Processor packages',d:'The finished GPU packages from Chapter 8 are mounted onto Nvidia-designed boards, paired with Nvidia\'s Grace CPUs. In this rack design, each tray holds two CPUs and four GPUs.',who:[['TSMC','TW','fab'],['Nvidia','US','design']]},
  {n:'Memory + supporting parts',d:'CPU memory chips sit beside each CPU, along with management controllers, storage drives and hundreds of small passive components from many other suppliers.',who:[]},
  {n:'Networking',d:'Network cards and data-processing units at the front link the tray to the wider data center. High-speed connectors at the back plug into the rack\'s GPU-to-GPU fabric.',who:[['Nvidia','US','design']]},
  {n:'Liquid cooling',d:'Cold plates clamp onto every CPU and GPU, with coolant lines running to quick-disconnect fittings at the back. Air alone can\'t carry away this much heat.',who:[['Foxconn','TW','int'],['Wistron','TW','int']]},
  {n:'Finished tray',d:'Lid on, tested, and ready to slide into a rack. The assembler, not Nvidia, physically builds it, to Nvidia\'s design.',who:[['Foxconn','TW','int'],['Wistron','TW','int']]}];
let trayStep=-1,trayManual=false;
function drawTray(s){
  const svg=$('#traySvg');clear(svg);glowFilter(svg,'g9a',COL.amber,3);glowFilter(svg,'g9t',COL.teal,3);glowFilter(svg,'g9c',COL.cyan,3);
  const o={x:330,y:120,s:.95};const L=420,Dp=300,H=26;
  const drop=(k)=>s===k?0:0;
  // enclosure base
  box(svg,o,{x:0,y:0,z:0,w:L,d:Dp,h:4,c:'#3a4256',stroke:'#9aa8c4',sw:.6});
  // side walls
  box(svg,o,{x:0,y:0,z:4,w:L,d:4,h:H,c:'#353d52',stroke:'#9aa8c4',sw:.4});box(svg,o,{x:0,y:0,z:4,w:4,d:Dp,h:H,c:'#353d52',stroke:'#9aa8c4',sw:.4});
  const vis=(k)=>s>=k;
  if(vis(1)){box(svg,o,{x:14,y:14,z:4,w:L-28,d:Dp-28,h:3,c:'#1e4a3a',stroke:'#4f8f7a',sw:.4});
    for(let i=0;i<6;i++)line3(svg,o,[30+i*62,20,7],[30+i*62,Dp-20,7],{stroke:COL.amber,'stroke-width':s===1?2:1,'stroke-opacity':s===1?.95:.4,filter:s===1?'url(#g9a)':null});
    for(let i=0;i<8;i++)box(svg,o,{x:330,y:24+i*32,z:7,w:20,d:20,h:8,c:'#4a4030',stroke:COL.amber,sw:.4});}
  if(vis(5)&&!vis(6)){} // drawn later
  const mods=[[60,40],[60,170]];
  if(vis(2)){mods.forEach(m=>{box(svg,o,{x:m[0],y:m[1],z:7,w:230,d:100,h:3,c:'#1a3a54',stroke:COL.cyan,sw:.4});
      box(svg,o,{x:m[0]+10,y:m[1]+25,z:10,w:44,d:50,h:5,c:'#2a3346',stroke:COL.cyan,sw:.5}); // CPU
      [0,1].forEach(k=>{box(svg,o,{x:m[0]+80+k*72,y:m[1]+12,z:10,w:60,d:76,h:6,c:'#1d5a7c',stroke:COL.cyan,sw:.6,cls:s===2?'glow-c':null});
        if(!vis(5)){plane(svg,o,m[0]+98+k*72,m[1]+30,16,24,40,{fill:COL.cyan,opacity:.3});}});});
    }
  if(vis(3)){mods.forEach(m=>{for(let k=0;k<4;k++)box(svg,o,{x:m[0]+12+k*10,y:m[1]+80,z:10,w:7,d:14,h:3,c:'#4b3a92',stroke:COL.violet,sw:.3});});
    for(let k=0;k<4;k++)box(svg,o,{x:300+k*12,y:Dp-60,z:7,w:8,d:40,h:10,c:'#3b4560',stroke:COL.white,sw:.3});}
  if(vis(4)){for(let k=0;k<4;k++)box(svg,o,{x:L-30,y:30+k*62,z:7,w:26,d:40,h:14,c:'#2a3346',stroke:COL.cyan,sw:.5,cls:s===4?'glow-c':null});
    for(let k=0;k<4;k++)box(svg,o,{x:6,y:30+k*66,z:7,w:18,d:34,h:16,c:'#2a2950',stroke:COL.violet,sw:.5,cls:s===4?'glow-v':null});
    const lp=P(o,L,0,30);txt(svg,lp[0]+10,lp[1]-4,'front: NICs / DPUs','svglbl c',{'font-size':10});const lp2=P(o,0,Dp,30);txt(svg,lp2[0]-150,lp2[1]+10,'rear: GPU fabric connectors','svglbl v',{'font-size':10});}
  if(vis(5)){mods.forEach(m=>{box(svg,o,{x:m[0]+8,y:m[1]+22,z:15,w:48,d:56,h:5,c:'#1d5a4c',stroke:COL.teal,sw:.6,cls:s===5?'glow-t':null});
      [0,1].forEach(k=>box(svg,o,{x:m[0]+78+k*72,y:m[1]+10,z:16,w:64,d:80,h:6,c:'#1d5a4c',stroke:COL.teal,sw:.6,cls:s===5?'glow-t':null}));
      poly3(svg,o,[[m[0]+32,m[1]+50,22],[m[0]+32,m[1]+50,30],[m[0]+110,m[1]+50,30],[m[0]+182,m[1]+50,30],[m[0]+182,m[1]+50,30],[20,m[1]+50,30]],{stroke:COL.teal,'stroke-width':2.4,filter:s===5?'url(#g9t)':null});});
    box(svg,o,{x:6,y:120,z:7,w:14,d:60,h:20,c:'#1d5a4c',stroke:COL.teal,sw:.5});}
  if(vis(6)){box(svg,o,{x:0,y:0,z:4+H,w:L,d:Dp,h:3,c:'#4a5268',stroke:'#c5d2ef',sw:.6,op:.92});
    const t=P(o,L/2,Dp/2,H+8);txt(svg,t[0],t[1],'1U COMPUTE TRAY','svglbl w',{'text-anchor':'middle','font-size':12});txt(svg,t[0],t[1]+15,'2 CPUs · 4 GPUs · liquid-cooled','svglbl t',{'text-anchor':'middle','font-size':10.5});}
  $('#trayStepN').textContent=Math.max(0,s);
}
function setTray(s,fromBtn){if(s===trayStep)return;trayStep=s;const k=Math.max(0,s);const t=TRAY[k];setRead('trayRead',(k+1)+'. '+t.n,t.d,t.who);$$('#trayBtns .btn').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===k)));drawTray(k);}
(function(){const box=$('#trayBtns');TRAY.forEach((t,i)=>{const b=document.createElement('button');b.className='btn t';b.innerHTML=`<span class="k">${i+1}</span>${t.n}`;b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>{
  const sc=$('#trayScroll');const r=sc.getBoundingClientRect();const top=window.scrollY+r.top;const span=sc.offsetHeight-window.innerHeight*0.8;
  window.scrollTo({top:top+span*(i+.5)/7,behavior:reduced?'auto':'smooth'});setTray(i);});box.appendChild(b);});})();
function trayFromScroll(){const sc=$('#trayScroll');if(!sc)return;const r=sc.getBoundingClientRect();const span=sc.offsetHeight-window.innerHeight*0.8;const p=Math.min(.999,Math.max(0,(-r.top+60)/span));setTray(Math.floor(p*7));}
setTray(0);

/* ======================= CH10 RACK ======================= */
const RACK={sel:null};
const RACKT={
  compute:['Compute','18 compute trays like the one you just built: 72 GPUs and 36 CPUs in one cabinet. Each GPU package carries its own HBM. This is the part people call "the chip," and it\'s only one of four systems.',[['Nvidia','US','design'],['TSMC','TW','fab'],['SK Hynix','KR','mem'],['Micron','US','mem']]],
  network:['Networking','Nine switch trays in the middle of the rack, connected by a copper cable spine at the back, let every GPU talk to every other GPU at very high speed, so the rack acts like one huge processor. Separate network cards link racks together across the data center.',[['Nvidia','US','design']]],
  power:['Power','Power shelves at the top and bottom convert facility power and feed a vertical busbar at the back, which every tray taps into. A rack like this draws on the order of 120 kilowatts, roughly the average draw of about a hundred US homes.',[]],
  cooling:['Cooling','Coolant flows down manifolds at the back of the rack, through every tray\'s cold plates, and out to a coolant distribution unit that dumps the heat. Without liquid cooling, this density simply isn\'t possible.',[['Foxconn','TW','int'],['Wistron','TW','int']]]};
function drawRack(){
  const svg=$('#rackSvg');clear(svg);glowFilter(svg,'gr',COL.cyan,3);
  const o={x:250,y:505,s:1};const W=150,D=180,U=11.5;const s=RACK.sel;
  const op=(k)=>!s||s===k?1:.14;
  // frame back posts
  // layout from bottom: 3 power, 8 compute, 9 switch, 10 compute, 3 power, 1 TOR (approx GB200 NVL72 arrangement)
  const seq=[].concat(Array(4).fill('power'),Array(8).fill('compute'),Array(9).fill('network'),Array(10).fill('compute'),Array(4).fill('power'),['network','network']);
  const total=seq.length*U+20;
  // rear busbar + manifolds (behind)
  const gp=el('g',{opacity:op('power'),class:'hl'},svg);box(gp,o,{x:W*0.45,y:-6,z:0,w:8,d:6,h:total,c:'#7a5a20',stroke:COL.amber,sw:.5});
  const gc=el('g',{opacity:op('cooling'),class:'hl'},svg);box(gc,o,{x:8,y:-8,z:0,w:10,d:8,h:total,c:'#1d5a4c',stroke:COL.teal,sw:.5});box(gc,o,{x:W-18,y:-8,z:0,w:10,d:8,h:total,c:'#1d5a4c',stroke:COL.teal,sw:.5});
  const gn=el('g',{opacity:op('network'),class:'hl'},svg);box(gn,o,{x:W*0.65,y:-10,z:20,w:24,d:10,h:total-40,c:'#3a2f6e',stroke:COL.violet,sw:.5});
  // cabinet sides
  box(svg,o,{x:-6,y:0,z:0,w:6,d:D,h:total,c:'#202838',stroke:'#4a5878',sw:.4,op:.9});
  seq.forEach((k,i)=>{const z=10+i*U;const c=k==='power'?'#4a4030':k==='compute'?'#253652':'#2b2850';const acc=k==='power'?COL.amber:k==='compute'?COL.cyan:COL.violet;
    const g=el('g',{opacity:op(k),class:'hl'},svg);box(g,o,{x:0,y:0,z,w:W,d:D,h:U-1.5,c,stroke:acc,sw:.4});
    // front details
    const a=P(o,W,0,z+U/2),b=P(o,W,D,z+U/2);
    if(k==='compute'){for(let q=0;q<6;q++){const t=q/6+.06;el('rect',{x:a[0]+(b[0]-a[0])*t-2,y:a[1]+(b[1]-a[1])*t-2,width:5,height:3,fill:COL.cyan,opacity:.7},g);}}
    if(k==='network'){for(let q=0;q<10;q++){const t=q/10+.04;el('rect',{x:a[0]+(b[0]-a[0])*t-1.5,y:a[1]+(b[1]-a[1])*t-2,width:3,height:3,fill:COL.violet,opacity:.8},g);}}
    if(k==='power'){el('line',{x1:a[0]+(b[0]-a[0])*.1,y1:a[1]+(b[1]-a[1])*.1,x2:a[0]+(b[0]-a[0])*.5,y2:a[1]+(b[1]-a[1])*.5,stroke:COL.amber,'stroke-width':1.5,opacity:.8},g);}
  });
  box(svg,o,{x:0,y:D,z:0,w:W,d:4,h:total,c:'#1a2030',stroke:'#4a5878',sw:.4,op:.25});
  // top cap
  box(svg,o,{x:-6,y:0,z:total,w:W+6,d:D,h:6,c:'#202838',stroke:'#4a5878',sw:.4});
  // labels
  const lab=(k,zc,str,col)=>{const p=P(o,W,0,zc);const g=el('g',{opacity:op(k)},svg);el('line',{x1:p[0]+4,y1:p[1],x2:p[0]+40,y2:p[1],stroke:col,'stroke-opacity':.7},g);txt(g,p[0]+44,p[1]+4,str,'svglbl',{fill:col,'font-size':11});};
  lab('power',10+2*U,'power shelves ×4',COL.amber);lab('compute',10+8*U,'compute trays ×8 (32 GPUs)',COL.cyan);lab('network',10+16.5*U,'NVLink switch trays ×9',COL.violet);lab('compute',10+26*U,'compute trays ×10 (40 GPUs)',COL.cyan);lab('power',10+33*U,'power shelves ×4',COL.amber);lab('network',10+36*U,'management switches',COL.violet);
  const bp=P(o,W*0.45,-6,total+30);txt(svg,bp[0]-80,bp[1]-6,'rear: busbar · cable spine · coolant manifolds','svglbl',{'font-size':10});
}
$$('[data-rack]').forEach(b=>b.addEventListener('click',()=>{RACK.sel=RACK.sel===b.dataset.rack?null:b.dataset.rack;$$('[data-rack]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.rack===RACK.sel)));
  if(RACK.sel){const t=RACKT[RACK.sel];setRead('rackRead',t[0],t[1],t[2]);}else rackIntro();drawRack();}));
function rackIntro(){setRead('rackRead','Four systems in one cabinet','A finished AI rack is compute, networking, power and cooling, engineered together. Select a layer to highlight it.',[['Foxconn','TW','int'],['Wistron','TW','int']]);}
rackIntro();drawRack();

/* ======================= CH10 SUPPLY-CHAIN LANDSCAPE ======================= */
const FLOW={
  info:{n:'Design information',stroke:COL.cyan,w:1.6,dash:'6 6',anim:true},
  wafer:{n:'Physical wafers',stroke:COL.violet,w:3.2},
  tool:{n:'Equipment to fabs',stroke:COL.ti,w:4,double:true},
  mat:{n:'Materials',stroke:COL.white,w:1.8,dash:'1.5 5',cap:'round'},
  pkg:{n:'Dies & packages',stroke:COL.teal,w:2.6},
  sys:{n:'Finished systems',stroke:COL.teal,w:7,double:true}};
const FV={};Object.keys(FLOW).forEach(k=>FV[k]=true);
const N={
  cust:{x:1150,y:360,n:'AI customer',c:'data center / cloud',col:COL.cyan,r:'design'},
  nv:{x:130,y:250,n:'Nvidia',c:'US · design',col:COL.cyan},amd:{x:130,y:330,n:'AMD',c:'US · design',col:COL.cyan},avgo:{x:130,y:410,n:'Broadcom',c:'US · design',col:COL.cyan},
  cdn:{x:130,y:95,n:'Cadence',c:'US · EDA software',col:COL.cyan},snps:{x:130,y:155,n:'Synopsys',c:'US · EDA software',col:COL.cyan},
  shin:{x:330,y:600,n:'Shin-Etsu',c:'JP · wafers, resist',col:COL.white},sumco:{x:330,y:660,n:'SUMCO',c:'JP · wafers',col:COL.white},
  jsr:{x:470,y:660,n:'JSR',c:'JP · photoresist',col:COL.white},
  amat:{x:330,y:88,n:'Applied Materials',c:'US · deposition',col:COL.ti},lam:{x:480,y:88,n:'Lam Research',c:'US · deposition, etch',col:COL.ti},
  tel:{x:630,y:88,n:'Tokyo Electron',c:'JP · coat/develop',col:COL.ti},asml:{x:330,y:160,n:'ASML',c:'NL · EUV lithography',col:COL.ti},
  kla:{x:480,y:160,n:'KLA',c:'US · inspection',col:COL.ti},disco:{x:630,y:160,n:'DISCO',c:'JP · dicing',col:COL.ti},
  tsmc:{x:540,y:360,n:'TSMC',c:'TW · fab + CoWoS packaging',col:COL.violet,big:true},
  hynix:{x:790,y:570,n:'SK Hynix',c:'KR · own memory fabs',col:COL.violet},mu:{x:790,y:640,n:'Micron',c:'US · own memory fabs',col:COL.violet},
  ajin:{x:600,y:600,n:'Ajinomoto',c:'JP · ABF film',col:COL.white},subs:{x:600,y:520,n:'Substrate makers',c:'e.g. Unimicron, Ibiden',col:COL.white},
  test:{x:800,y:230,n:'Advantest · Teradyne',c:'JP · US · testers',col:COL.coral},
  fox:{x:930,y:330,n:'Foxconn',c:'TW · system assembly',col:COL.teal},wis:{x:930,y:410,n:'Wistron',c:'TW · system assembly',col:COL.teal}};
const E=[['cust','nv','info'],['cust','amd','info'],['cust','avgo','info'],['cdn','nv','info'],['snps','nv','info'],['cdn','amd','info'],['snps','amd','info'],['cdn','avgo','info'],['snps','avgo','info'],
  ['nv','tsmc','info'],['amd','tsmc','info'],['avgo','tsmc','info'],['nv','fox','info'],
  ['shin','tsmc','wafer'],['sumco','tsmc','wafer'],['shin','hynix','wafer'],['sumco','mu','wafer'],['lam','hynix','tool'],['asml','mu','tool'],
  ['amat','tsmc','tool'],['lam','tsmc','tool'],['tel','tsmc','tool'],['asml','tsmc','tool'],['kla','tsmc','tool'],['disco','tsmc','tool'],['test','tsmc','tool'],
  ['jsr','tsmc','mat'],['shin','tsmc','mat'],['ajin','subs','mat'],['subs','tsmc','mat'],
  ['hynix','tsmc','pkg'],['mu','tsmc','pkg'],['tsmc','fox','pkg'],['tsmc','wis','pkg'],
  ['fox','cust','sys'],['wis','cust','sys']];
let worldSel=null;
function drawWorld(){
  const svg=$('#mapWorld');clear(svg);glowFilter(svg,'gw',COL.cyan,3);glowFilter(svg,'gwt',COL.teal,4);
  // column bands
  const groups=[[['cdn','snps','nv','amd','avgo'],'DESIGN (FABLESS)',COL.cyan],[['amat','lam','tel','asml','kla','disco'],'EQUIPMENT MAKERS',COL.ti],[['shin','sumco','jsr','ajin','subs'],'MATERIALS',COL.white],[['tsmc'],'FAB + PACKAGING',COL.violet],[['hynix','mu'],'MEMORY (OWN FABS)',COL.violet],[['test'],'TEST EQUIPMENT',COL.coral],[['fox','wis'],'SYSTEM INTEGRATION',COL.teal],[['cust'],'CUSTOMER',COL.cyan]];
  groups.forEach(g=>{const xs=g[0].map(k=>N[k].x),ys=g[0].map(k=>N[k].y);const pad=g[0].includes('tsmc')?110:80;const x0=Math.min(...xs)-pad,x1=Math.max(...xs)+pad,y0=Math.min(...ys)-48,y1=Math.max(...ys)+34;
    el('rect',{x:x0,y:y0,width:x1-x0,height:y1-y0,rx:14,fill:'#0b1430',opacity:.6,stroke:g[2],'stroke-opacity':.22,'stroke-dasharray':'3 5'},svg);txt(svg,x0+12,y0+15,g[1],'svglbl',{fill:g[2],'font-size':10});});
  const conn=new Set();if(worldSel){E.forEach(e=>{if(e[0]===worldSel||e[1]===worldSel){conn.add(e[0]);conn.add(e[1]);}});}
  const eg=el('g',null,svg);
  E.forEach(e=>{if(!FV[e[2]])return;const A=N[e[0]],B=N[e[1]],F=FLOW[e[2]];
    const active=!worldSel||e[0]===worldSel||e[1]===worldSel;
    const mx=(A.x+B.x)/2;const d=`M${A.x},${A.y} C${mx},${A.y} ${mx},${B.y} ${B.x},${B.y}`;
    const g=el('g',{opacity:active?1:.08},eg);
    if(F.double){el('path',{d,fill:'none',stroke:F.stroke,'stroke-width':F.w,'stroke-opacity':.85},g);el('path',{d,fill:'none',stroke:'#0a1226','stroke-width':F.w-2.4},g);if(e[2]==='sys')el('path',{d,fill:'none',stroke:F.stroke,'stroke-width':1,'stroke-dasharray':'2 10',class:'flowdash'},g);}
    else el('path',{d,fill:'none',stroke:F.stroke,'stroke-width':F.w,'stroke-dasharray':F.dash||null,'stroke-linecap':F.cap||'butt',class:F.anim?'flowdash':null,'stroke-opacity':.9},g);
    // arrowhead dot at destination
    el('circle',{cx:B.x-(B.x>A.x?16:-16),cy:B.y,r:F.double?3.5:2.6,fill:F.stroke},g);});
  Object.keys(N).forEach(k=>{const n=N[k];const active=!worldSel||conn.has(k)||k===worldSel;
    const g=el('g',{opacity:active?1:.25,tabindex:0,role:'button','aria-label':n.n+', '+n.c,style:'cursor:pointer',class:'wnode'},svg);
    const w=n.big?190:Math.max(118,n.n.length*8+28,n.c.length*6.2+20),h=n.big?70:42;
    // isometric pad
    el('rect',{x:n.x-w/2,y:n.y-h/2+5,width:w,height:h,rx:8,fill:'#000',opacity:.35},g);
    el('rect',{x:n.x-w/2,y:n.y-h/2,width:w,height:h,rx:8,fill:k===worldSel?shade(n.col,-.55):'#101b38',stroke:n.col,'stroke-width':k===worldSel?2:1.1},g);
    txt(g,n.x,n.y-(n.big?6:2),n.n,'svgtitle',{'text-anchor':'middle','font-size':n.big?20:13});
    txt(g,n.x,n.y+(n.big?16:13),n.c,'svglbl',{'text-anchor':'middle','font-size':9.5});
    const act=()=>{worldSel=worldSel===k?null:k;drawWorld();worldInfo();setTimeout(()=>{const f=[...$$('#mapWorld .wnode')].find(x=>x.getAttribute('aria-label').startsWith(n.n));f&&f.focus();},0);};
    g.addEventListener('click',act);g.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();act();}});});
}
function worldInfo(){if(!worldSel){setRead('worldRead','Select a company','Tap any node to highlight what flows in and out of it.');return;}
  const n=N[worldSel];const ins=E.filter(e=>e[1]===worldSel).map(e=>`${N[e[0]].n} <span style="color:var(--muted)">(${FLOW[e[2]].n.toLowerCase()})</span>`),outs=E.filter(e=>e[0]===worldSel).map(e=>`${N[e[1]].n} <span style="color:var(--muted)">(${FLOW[e[2]].n.toLowerCase()})</span>`);
  setRead('worldRead',n.n+' · '+n.c,(ins.length?'<strong>Receives from:</strong> '+ins.join(', ')+'. ':'')+(outs.length?'<strong>Sends to:</strong> '+outs.join(', ')+'.':''));}
(function legend(){const L=$('#flowLegend');Object.keys(FLOW).forEach(k=>{const F=FLOW[k];const b=document.createElement('button');b.setAttribute('aria-pressed','true');
  const s=document.createElementNS(NS,'svg');s.setAttribute('viewBox','0 0 42 12');s.setAttribute('aria-hidden','true');
  if(F.double){el('line',{x1:2,x2:40,y1:6,y2:6,stroke:F.stroke,'stroke-width':Math.min(F.w,8)},s);el('line',{x1:2,x2:40,y1:6,y2:6,stroke:'#0a1226','stroke-width':Math.min(F.w,8)-2.4},s);}else el('line',{x1:2,x2:40,y1:6,y2:6,stroke:F.stroke,'stroke-width':F.w,'stroke-dasharray':F.dash||null,'stroke-linecap':F.cap||'butt'},s);
  b.appendChild(s);b.appendChild(document.createTextNode(F.n));b.addEventListener('click',()=>{FV[k]=!FV[k];b.setAttribute('aria-pressed',String(FV[k]));drawWorld();});L.appendChild(b);});})();
drawWorld();

/* ---------------- init ---------------- */
window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',onScroll);
applyMotion();onScroll();
window.__aichips={setFab,setLitho,setTray,drawPkg,PKG,dies};
})();
