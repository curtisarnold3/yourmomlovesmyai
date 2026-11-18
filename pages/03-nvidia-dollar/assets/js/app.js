/* Tracing $1 of Nvidia Sales: data-driven chapters. All quantities come from window.FIN_MODEL. */
(function(){
'use strict';
const M = window.FIN_MODEL;
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const COL = {cyan:'#2aa9e0', amber:'#d99a1e', violet:'#9a7df0', teal:'#16a37a', coral:'#ec5a76', slate:'#55607e', slate2:'#3f4865', ink:'#eef2fb', ink2:'#b9c3dc', ink3:'#8590ad'};
const BASE_B = M.meta.base_revenue_m/1000;
const NARROW = () => window.innerWidth < 600;
const RENDERS = [];

/* ---------- formatting ---------- */
function cents(v, dec=0, signed=false){
  const s = v < 0 ? '−' : (signed ? '+' : '');
  const a = Math.abs(v);
  if (a >= 1) return s + '$' + a.toFixed(2);
  return s + (a*100).toFixed(dec) + '¢';
}
const fv = (v, mode, signed=false) => cents(v, mode==='filed'?1:0, signed);
const bil = m => '$' + (Math.abs(m)/1000).toFixed(1) + 'B';
const STATUS = {source:['b-source','Source'], verified:['b-verified','Verified'], calculated:['b-calculated','Calculated'], hypothetical:['b-hypothetical','Hypothetical'], unverified:['b-unverified','Unverified'], 'partly verified':['b-partly','Partly verified'], 'source+verified':['b-verified','Source + verified'], 'source+calculated':['b-calculated','Source + calculated']};
function badge(st){const [c,l]=STATUS[st]||STATUS.source;const d=M.meta.status_vocabulary[st.split('+')[0]]||l;return `<span class="badge ${c}" tabindex="0" title="${d}">${l}</span>`}
function srcLine(ids){return 'Sources: ' + ids.map(id=>{const s=M.sources[id];return s.url?`<a href="${s.url}" target="_blank" rel="noopener">${s.title}</a>`:s.title}).join(' · ')}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')}
function wrap(label, max=14){const w=label.split(' ');const lines=[''];w.forEach(x=>{if((lines[lines.length-1]+' '+x).trim().length>max&&lines[lines.length-1])lines.push(x);else lines[lines.length-1]=(lines[lines.length-1]+' '+x).trim()});return lines.slice(0,3)}
function tspans(lines,x,dy=14){return lines.map((l,i)=>`<tspan x="${x}" dy="${i?dy:0}">${esc(l)}</tspan>`).join('')}
function pressGroup(btns, active){btns.forEach(b=>b.setAttribute('aria-pressed', String(b===active)))}

/* ---------- SVG patterns ---------- */
function defs(p){return `<defs>
  <pattern id="${p}-hatchC" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="rgba(236,90,118,.10)"/><line x1="0" y1="0" x2="0" y2="6" stroke="#ec5a76" stroke-width="2"/></pattern>
  <pattern id="${p}-hatchA" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="rgba(217,154,30,.12)"/><line x1="0" y1="0" x2="0" y2="7" stroke="#d99a1e" stroke-width="1.6" stroke-opacity=".8"/></pattern>
  <pattern id="${p}-hatchV" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="6" height="6" fill="rgba(154,125,240,.25)"/><line x1="0" y1="0" x2="0" y2="6" stroke="#9a7df0" stroke-width="1.6"/></pattern>
  <pattern id="${p}-ledger" width="8" height="7" patternUnits="userSpaceOnUse"><rect width="8" height="7" fill="rgba(42,169,224,.08)"/><line x1="0" y1="6" x2="8" y2="6" stroke="#2aa9e0" stroke-width=".8" stroke-opacity=".55"/></pattern>
  <linearGradient id="${p}-gC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4cc3f3"/><stop offset="1" stop-color="#1d86b8"/></linearGradient>
  <linearGradient id="${p}-gT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#25c08f"/><stop offset="1" stop-color="#0f7d5d"/></linearGradient>
  <linearGradient id="${p}-gA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0b443"/><stop offset="1" stop-color="#b47b10"/></linearGradient>
  <linearGradient id="${p}-gV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b39bff"/><stop offset="1" stop-color="#7559d6"/></linearGradient>
  <linearGradient id="${p}-gS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#66708f"/><stop offset="1" stop-color="#3f4865"/></linearGradient>
  <filter id="${p}-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>`}
/* style: fill+stroke attributes for a financial treatment */
function treat(p, t){
  switch(t){
    case 'revenue': return `fill="url(#${p}-gC)" stroke="#7fd6fa" stroke-width="1"`;
    case 'cost': return `fill="url(#${p}-gS)" stroke="#7a84a3" stroke-width="1"`;
    case 'tax': return `fill="#363e58" stroke="#6a7494" stroke-width="1"`;
    case 'paper': return `fill="url(#${p}-hatchV)" stroke="#b9a6ff" stroke-width="1.4" stroke-dasharray="3 3"`;
    case 'ledger': return `fill="url(#${p}-ledger)" stroke="#2aa9e0" stroke-width="2"`;
    case 'cash': return `fill="url(#${p}-gT)" stroke="#5be0b5" stroke-width="1"`;
    case 'cashminus': return `fill="#3a4a5e" stroke="#7a8aa6" stroke-width="1"`;
    case 'financing': return `fill="url(#${p}-hatchA)" stroke="#d99a1e" stroke-width="1.4"`;
    case 'investing': return `fill="rgba(42,169,224,.18)" stroke="#2aa9e0" stroke-width="1.4" stroke-dasharray="5 3"`;
    case 'deployed': return `fill="url(#${p}-gA)" stroke="#f3c56b" stroke-width="1"`;
    case 'equity': return `fill="url(#${p}-gV)" stroke="#c7b8ff" stroke-width="1"`;
    case 'commit': return `fill="rgba(217,154,30,.10)" stroke="#d99a1e" stroke-width="1.6" stroke-dasharray="6 4"`;
    case 'capacity': return `fill="rgba(42,169,224,.10)" stroke="#2aa9e0" stroke-width="1.6" stroke-dasharray="2 3"`;
    case 'guarantee': return `fill="rgba(236,90,118,.16)" stroke="#ec5a76" stroke-width="1.6" stroke-dasharray="6 4"`;
    case 'hypo': return `fill="url(#${p}-hatchC)" stroke="#ec5a76" stroke-width="1.6" stroke-dasharray="2 4"`;
    case 'residual': return `fill="none" stroke="#b9c3dc" stroke-width="1.2" stroke-dasharray="2 2"`;
    case 'ghost': return `fill="none" stroke="#8590ad" stroke-width="1.2" stroke-dasharray="4 4"`;
    default: return `fill="#55607e"`;
  }
}

/* ---------- tooltip ---------- */
const tip = $('#tip');
function showTip(html, x, y){tip.innerHTML=html;tip.classList.add('on');const r=tip.getBoundingClientRect();let tx=x+14,ty=y+14;if(tx+r.width>innerWidth-8)tx=x-r.width-14;if(ty+r.height>innerHeight-8)ty=y-r.height-14;tip.style.left=tx+'px';tip.style.top=ty+'px'}
function hideTip(){tip.classList.remove('on')}
document.addEventListener('mousemove', e=>{const t=e.target.closest&&e.target.closest('[data-tip]');if(t)showTip(t.getAttribute('data-tip'),e.clientX,e.clientY);else hideTip()});
document.addEventListener('focusin', e=>{const t=e.target.closest&&e.target.closest('[data-tip]');if(t){const r=t.getBoundingClientRect();showTip(t.getAttribute('data-tip'),r.right,r.top)}});
document.addEventListener('focusout', hideTip);
document.addEventListener('keydown', e=>{if(e.key==='Escape')hideTip()});
document.addEventListener('click', e=>{const t=e.target.closest&&e.target.closest('[data-tip]');if(t&&(e.pointerType==='touch'||matchMedia('(hover: none)').matches)){showTip(t.getAttribute('data-tip'),e.clientX,e.clientY);clearTimeout(window.__tt);window.__tt=setTimeout(hideTip,3500)}});
function focusTips(root){$$('.mark[data-tip]:not([data-hit])',root).forEach(el=>{el.setAttribute('tabindex','0');el.setAttribute('role','img');el.setAttribute('aria-label',el.getAttribute('data-tip').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim())})}
// SVG marks that act as buttons
function bindHits(root, fn){$$('[data-hit]', root).forEach(el=>{
  el.setAttribute('tabindex','0');el.setAttribute('role','button');el.classList.add('hit');
  el.addEventListener('click',()=>fn(el.getAttribute('data-hit')));
  el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();const id=el.getAttribute('data-hit');fn(id);const n=root.querySelector(`[data-hit="${id}"]`);if(n)n.focus()}});
})}

/* ---------- generic waterfall ---------- */
function waterfall(steps, o){
  const nw=NARROW(), rot=nw&&steps.length>6, p=o.id, W=o.W||(nw?420:640), H=(o.H||340)+(nw?(rot?60:20):0), padL=nw?44:40, padR=8, padT=34, padB=nw?(rot?110:74):58;
  const n=steps.length, bw=(W-padL-padR)/n, barW=Math.min(64,bw*0.62);
  const vmax=o.max||1.05, y=v=>padT+(1-v/vmax)*(H-padT-padB);
  let cum=0, out=defs(p);
  // grid
  for(let g=0; g<=vmax+1e-9; g+=o.gridStep||0.25){out+=`<line class="grid" x1="${padL}" x2="${W-padR}" y1="${y(g)}" y2="${y(g)}"/><text class="tick" x="${padL-6}" y="${y(g)+4}" text-anchor="end">${cents(g)}</text>`}
  out+=`<line class="axis" x1="${padL}" x2="${W-padR}" y1="${y(0)}" y2="${y(0)}"/>`;
  steps.forEach((s,i)=>{
    const v=s.value; let a,b;
    if(s.kind==='total'){a=0;b=v;cum=v}else{a=cum;b=cum+v;cum=b}
    const top=y(Math.max(a,b)), h=Math.max(1.5,Math.abs(y(a)-y(b))), cx=padL+bw*i+bw/2, x=cx-barW/2;
    const vis=o.shown==null||i<o.shown, act=!o.active||o.active===s.id;
    const op=vis?(act?1:.28):0;
    out+=`<g class="mark" style="opacity:${op}" data-hit="${s.id}" data-tip="<b>${esc(s.label)}</b><br><span class='t-num'>${fv(v,o.mode,s.kind!=='total')}</span>${s.m!=null?' · '+bil(s.m):''}${s.tipx?'<br>'+esc(s.tipx):''}">
      <rect class="focusring" x="${x-4}" y="${top-4}" width="${barW+8}" height="${h+8}" rx="6" fill="transparent"/>
      <rect x="${x}" y="${top}" width="${barW}" height="${h}" rx="4" ${treat(p,s.treat)}/>
      <text class="lab-num" x="${cx}" y="${top-8}" text-anchor="middle">${fv(v,o.mode,s.kind!=='total')}</text>
      ${rot?`<text class="lab" x="${cx+4}" y="${H-padB+14}" text-anchor="end" transform="rotate(-38 ${cx+4} ${H-padB+14})" style="font-size:11.5px">${esc(s.short||s.label)}</text>`:`<text class="lab" x="${cx}" y="${H-padB+18}" text-anchor="middle" ${nw?'style="font-size:11px"':''}>${tspans(wrap(s.short||s.label,nw?8:13),cx,nw?12:14)}</text>`}</g>`;
    if(i<n-1 && vis && (o.shown==null||i+1<o.shown)){const nx=padL+bw*(i+1)+bw/2-barW/2;out+=`<line x1="${x+barW}" x2="${nx}" y1="${y(cum)}" y2="${y(cum)}" stroke="#8590ad" stroke-dasharray="2 3" stroke-width="1"/>`}
  });
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria||'Waterfall chart')}">${out}</svg>`;
}
function table(rows, head){return `<table><thead><tr>${head.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((c,i)=>`<td class="${i?'n':''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`}

/* ---------- the recurring dollar ---------- */
function bill(style, w=64, h=36){
  const p='bill'+style;
  const base=`<rect x="2" y="2" width="${w-4}" height="${h-4}" rx="5"`;
  let body='', glyphFill='#06101f';
  switch(style){
    case 'revenue': body=`${base} fill="#2aa9e0" stroke="#9fe0ff"/><rect x="6" y="6" width="${w-12}" height="${h-12}" rx="3" fill="none" stroke="#06101f" stroke-opacity=".35"/>`;break;
    case 'accounting': body=`${base} fill="none" stroke="#2aa9e0" stroke-width="1.6"/>${[12,18,24].map(yy=>`<line x1="9" x2="${w-9}" y1="${yy}" y2="${yy}" stroke="#2aa9e0" stroke-opacity=".45"/>`).join('')}`;glyphFill='#2aa9e0';break;
    case 'cash': body=`${base} fill="#16a37a" stroke="#6ff0c2"/>`;break;
    case 'available': body=`<clipPath id="${p}c"><rect x="${w/2}" y="0" width="${w}" height="${h}"/></clipPath>${base} fill="#16a37a" stroke="#6ff0c2"/>${base} fill="#d99a1e" clip-path="url(#${p}c)"/>`;break;
    case 'deployed': body=`${base} fill="#d99a1e" stroke="#ffd37a"/>`;break;
    case 'holdings': body=`${base} fill="#9a7df0" stroke="#d6c9ff" stroke-dasharray="3 2"/>`;break;
    case 'promise': body=`${base} fill="rgba(217,154,30,.08)" stroke="#d99a1e" stroke-width="1.8" stroke-dasharray="5 3"/>`;glyphFill='#d99a1e';break;
    case 'contingent': body=`<pattern id="${p}h" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#ec5a76" stroke-width="1.6"/></pattern>${base} fill="url(#${p}h)" stroke="#ec5a76" stroke-width="1.6" stroke-dasharray="3 3"/>`;glyphFill='#ffd0d9';break;
    case 'network': body=`${base} fill="none" stroke="#2aa9e0"/><rect x="5" y="5" width="${w-10}" height="${h-10}" rx="4" fill="none" stroke="#9a7df0" stroke-dasharray="3 2"/><rect x="8" y="8" width="${w-16}" height="${h-16}" rx="3" fill="none" stroke="#ec5a76" stroke-dasharray="2 3"/>`;glyphFill='#eef2fb';break;
  }
  return `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true">${body}<text x="${w/2}" y="${h/2+6}" text-anchor="middle" font-size="17" font-weight="800" fill="${glyphFill}" font-family="system-ui">$</text></svg>`;
}
const DOLLAR = {
  revenue:['revenue','Revenue: a customer paid for a rack.'],
  accounting:['accounting','Profit: an accounting result. Nothing physically moves.'],
  cash:['cash','Operating cash: money actually collected from the business.'],
  available:['available','Available cash: operations plus borrowing plus assets sold. Only part of it is earned.'],
  deployed:['deployed','Deployed capital: cash turned into ownership stakes.'],
  holdings:['holdings','Holdings: valued, not cashed. A gain is on paper until a stake is sold.'],
  promise:['promise','A promise: money that may be owed later, and may never be paid.'],
  contingent:['contingent','Exposure: a ceiling on what could be owed, not a loss.'],
  network:['network','One dollar, many relationships: customer, investee, borrower and partner.'],
};

/* ================= HERO ================= */
function hero(){
  const s=new ISO.Scene({scale:30});
  s.plate(0,0,9,7,{grid:1});
  s.glassBox(0.4,0.4,0,8.2,6.2,3.9,'42,169,224',{alpha:.03,edge:.18,sw:.8});
  s.curve([0.4,5.2,0.2],[3.6,3.9,1.2],2.2,`fill="none" stroke="${COL.cyan}" stroke-width="7" stroke-linecap="round" opacity=".85" filter="url(#h-glow)"`);
  s.curve([5.0,3.5,2.6],[8.4,1.0,0.3],2.4,`fill="none" stroke="${COL.amber}" stroke-width="5" stroke-linecap="round" opacity=".9" class="dash-anim" stroke-dasharray="10 6"`);
  s.curve([5.0,3.8,2.2],[8.0,5.8,0.3],1.8,`fill="none" stroke="${COL.violet}" stroke-width="4" stroke-linecap="round" opacity=".85"`);
  s.curve([4.6,4.4,1.5],[2.0,6.6,0.2],1.2,`fill="none" stroke="${COL.coral}" stroke-width="2.4" stroke-dasharray="4 5" opacity=".9"`);
  [[3.4,2.6],[4.7,2.6],[3.4,3.9]].forEach(([x,y])=>s.rack(x,y,0,{h:3.2}));
  s.campus(0.6,4.6,2.0,1.6,0.8);
  s.neocloud(7.0,0.6,1.6,1.2,0.6);
  s.lab(7.0,4.6,1.2,1.1,1.0);
  s.defs.push(`<filter id="h-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
  $('#heroArt').innerHTML=s.autoSvg(16);
}

/* ================= CH1 ================= */
function ch1(){
  const R=M.revenue, cats=R.categories;
  const color={hyperscale:COL.cyan, acie:'#58c4e8', edge:'#8fa3c8'};
  let mode='source', sel=null;
  const val=c=>mode==='source'?c.source:c.h1_filed;
  function art(){
    const s=new ISO.Scene({scale:27});
    s.defs.push(`<filter id="c1-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    s.plate(0,0,12,10,{grid:1});
    // back-right: AI clouds & enterprise; left: hyperscalers; front: edge
    s.neocloud(6.8,0.5,2.6,1.7,0.9); s.neocloud(9.6,0.6,1.8,1.4,0.7,{color:'#24344a'}); s.box(9.8,2.6,0,1.2,1.0,1.1,{color:'#2b3352'});
    s.campus(0.5,5.6,2.6,3.9,1.1,{glow:COL.cyan});
    const hub=[5.6,4.4,1.8];
    const zones={hyperscale:[3.1,7.0,1.0], acie:[8.2,2.3,0.8], edge:[8.6,7.6,0.5]};
    cats.forEach(c=>{
      const w=Math.max(2, val(c)*58), on=!sel||sel===c.id;
      s.curve(zones[c.id],hub,1.4,`fill="none" stroke="${color[c.id]}" stroke-width="${w.toFixed(1)}" stroke-linecap="round" opacity="${on?0.9:0.15}" ${on?`filter="url(#c1-glow)"`:''} class="flow" data-hit="${c.id}" data-tip="<b>${esc(c.label)}</b><br><span class='t-num'>${fv(val(c),mode)}</span> of each $1"`);
    });
    [[4.4,3.2],[5.7,3.2],[4.4,4.5]].forEach(([x,y])=>s.rack(x,y,0,{h:3.0}));
    s.devices(7.6,7.6);
    s.text(1.8,7.6,2.4,'Hyperscalers','class="lab-strong" font-size="12.5" text-anchor="middle"');
    s.text(8.4,0.6,2.2,NARROW()?'AI clouds (ACIE)':'AI clouds & enterprise (ACIE)','class="lab-strong" font-size="12.5" text-anchor="middle"');
    s.text(9.6,9.4,-0.6,NARROW()?'Edge: PCs, gaming':'Edge: PCs, gaming, robots','class="lab-strong" font-size="12.5" text-anchor="middle"');
    s.text(4.6,3.0,3.9,'Nvidia racks','class="lab-strong" font-size="12.5" text-anchor="middle" style="fill:#9ff0c0"');
    return s.autoSvg(10);
  }
  function bar(){
    const W=640,H=78,pad=2; let x=0, out='';
    const tot=cats.reduce((a,c)=>a+val(c),0);
    cats.forEach(c=>{const w=val(c)/tot*W, on=!sel||sel===c.id;
      out+=`<g class="mark" style="opacity:${on?1:.3}" data-hit="${c.id}" data-tip="<b>${esc(c.label)}</b><br><span class='t-num'>${fv(val(c),mode)}</span>">
        <rect x="${x+pad/2}" y="8" width="${Math.max(1,w-pad)}" height="34" rx="4" fill="${color[c.id]}"/>
        <text x="${x+8}" y="31" class="lab-num" fill="#06101f" style="fill:#06101f;font-weight:700">${w>44?fv(val(c),mode):''}</text>
        <text x="${x+4}" y="62" class="lab">${w>110?esc(c.label.split(':')[0].split('(')[0]):''}</text></g>`; x+=w;});
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="100 percent bar of revenue by customer group">${out}</svg>`;
  }
  function explain(){
    const c=cats.find(x=>x.id===sel);
    if(!c){$('#ch1Explain').innerHTML=`Revenue is the only point where the dollar really is a dollar paid by a customer. Flow widths are drawn to scale. ${mode==='source'?`Showing the stated rounded split, <b>51 / 41 / 8</b> ${badge('source')}. It matches the 10-Q's six-month split of 51.6 / 40.8 / 7.6 ${badge('verified')}.`:`Showing the 10-Q's exact six-month split, <b>51.6 / 40.8 / 7.6</b> ${badge('verified')}: $91.8B / $72.5B / $13.6B. The source rounded it to 51/41/8.`} Hyperscale and ACIE are the two halves of Nvidia's Data Center business. Pick a group to learn more.`;return}
    const extra={hyperscale:'Public clouds and large consumer-internet platforms. They also rent capacity to frontier labs, which is why OpenAI and Anthropic spending can show up here.',
      acie:'Nvidia\'s newest reporting bucket: AI clouds (CoreWeave, Nebius, Crusoe, Lambda), sovereign AI projects, industrial users and enterprises running AI on-premise. Several of these customers are also companies Nvidia has invested in (Chapter 5).',
      edge:'Gaming GeForce cards, AI PCs, workstations, cars and robots. It was the whole company in 2010. Now it\'s rounding.'}[c.id];
    $('#ch1Explain').innerHTML=`<b>${esc(c.label)}</b> · <span class="val">${fv(c.source,'source')}</span> as stated ${badge('source')} · <span class="val">${fv(c.h1_filed,'filed')}</span> in the 10-Q (${bil(c.amount_m_h1)} over six months) ${badge('verified')}<br>${extra}<br><span style="color:var(--ink-3)">Examples: ${esc(c.examples)}</span>`;
  }
  function render(){$('#ch1Art').innerHTML=art();$('#ch1Bar').innerHTML=bar();explain();bindHits($('#ch1Art'),pick);bindHits($('#ch1Bar'),pick);
    $$('#ch1Cats .btn').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===sel)))}
  function pick(id){sel=sel===id?null:id;render()}
  $('#ch1Cats').innerHTML=cats.map(c=>`<button class="btn" data-id="${c.id}" aria-pressed="false"><span class="sw" style="background:${color[c.id]}"></span>${esc(c.label.split(':')[0].split('(')[0].trim())}</button>`).join(' ');
  $$('#ch1Cats .btn').forEach(b=>b.addEventListener('click',()=>pick(b.dataset.id)));
  const mb=$$('#ch1 [data-mode]');mb.forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;pressGroup(mb,b);render()}));
  $('#ch1Table').innerHTML=table(cats.map(c=>[esc(c.label),cents(c.source),cents(c.h1_filed,1),cents(c.q2_share,1),bil(c.amount_m_h1)]),['Group','As stated','10-Q six months','Q2 only','Six-month $']);
  $('#ch1Src').innerHTML=srcLine(R.sources)+'<br>'+esc(R.note);
  render();RENDERS.push(render);
}

/* ================= CH2 ================= */
function ch2(){
  const I=M.income; let mode='source', shown=null, active=null;
  const tr={rev:'revenue',cogs:'cost',opex:'cost',gains:'paper',tax:'tax',ni:'ledger'};
  const short={rev:'Revenue',cogs:'Cost of chips',opex:'Overhead & R&D',gains:'Investment gains',tax:'Taxes',ni:'Net income'};
  const why={
    rev:'<b>Revenue</b> is the price of racks, networking and software Nvidia delivered in the period. It counts when delivered, even if the customer hasn\'t paid yet (Chapter 3).',
    cogs:'<b>Cost of revenue</b>: TSMC wafers, HBM memory from SK Hynix and Micron, assembly by Foxconn and Wistron, and so on. Gross margin is about 75%.',
    opex:'<b>Operating expenses</b>: engineers, R&D, sales and admin. Stock compensation is included here even though it uses no cash.',
    gains:'<b>Other income</b>, mostly "gains from equity securities": the rise in value of stakes Nvidia owns. Accounting rules put this through profit even when nothing is sold. It\'s profit, but no customer paid for it.',
    tax:'<b>Income tax</b> on pre-tax profit, about 16.5% here. Nvidia guides 16–18% for the year.',
    ni:'<b>Net income</b>: what\'s left on paper. It\'s an <i>accounting result</i>, drawn as an outlined ledger rather than solid money, because it doesn\'t sit in a vault anywhere. It\'s not an allocation of the $1 in cash.'};
  const steps=()=>I.steps.map(s=>({id:s.id,label:s.label,short:short[s.id],kind:s.kind==='total'?'total':'delta',value:mode==='source'?s.source:s.verified,m:s.m,treat:tr[s.id],tipx:s.detail}));
  function render(){
    $('#ch2Chart').innerHTML=waterfall(steps(),{id:'c2',mode,shown,active,max:1.05,aria:'Income statement bridge from $1.00 revenue to net income'});
    bindHits($('#ch2Chart'),id=>{active=active===id?null:id;render()});
    const s=I.steps.find(x=>x.id===(active||(shown?I.steps[shown-1].id:null)));
    $('#ch2Explain').innerHTML=s?`${why[s.id]}<br><span class="val">${fv(mode==='source'?s.source:s.verified,mode,s.kind!=='total')}</span> per $1 · ${bil(s.m)} over six months ${badge('verified')}`:
      (mode==='source'?`$1.00 − 25¢ − 9¢ + 13¢ − 13¢ = <b>66¢</b> ${badge('source')}. The filing gives 66.4¢ ($118.0B) ${badge('verified')}. Step through it with the buttons, or tap a bar.`
        :`Exact 10-Q values: ${I.steps.slice(0,-1).map((x,i)=>i?(x.verified<0?' − ':' + ')+cents(Math.abs(x.verified),1):'$1.00').join('')} = <b>${cents(I.steps[5].verified,1)}</b> (${bil(I.steps[5].m)}) ${badge('verified')}. Other income is mostly equity gains, plus interest.`);
    $$('#ch2Steps .btn').forEach((b,i)=>b.setAttribute('aria-pressed',String(shown!=null&&i===shown-1)));
  }
  $('#ch2Steps').innerHTML=I.steps.map((s,i)=>`<button class="btn small" aria-pressed="false" data-i="${i}">${i+1} · ${short[s.id]}</button>`).join(' ')+` <button class="btn small" id="ch2All">Show all</button>`;
  $$('#ch2Steps [data-i]').forEach(b=>b.addEventListener('click',()=>{shown=+b.dataset.i+1;active=I.steps[shown-1].id;render()}));
  $('#ch2All').addEventListener('click',()=>{shown=null;active=null;render()});
  const mb=$$('#ch2 [data-mode]');mb.forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;pressGroup(mb,b);render()}));
  $('#ch2Table').innerHTML=table(I.steps.map(s=>[esc(s.label),cents(s.source,0,s.kind!=='total'),cents(s.verified,1,s.kind!=='total'),bil(s.m)]),['Line','As stated','10-Q','Six-month $']);
  $('#ch2Src').innerHTML=srcLine(I.sources);
  render();RENDERS.push(render);
}

/* ================= CH3 ================= */
function ch3(){
  const F=M.cfo; let mode='source', view='bridge', active=null;
  const short={ni:'Net income',paper:'Investment gains',ar:'Receivables',inv:'Inventory',pre:'Prepayments',pay:'Bills, taxes & advances',nc:'Non-cash items'};
  function steps(){
    const v=s=>mode==='source'?s.source:s.verified;
    const st=F.steps.map(s=>({id:s.id,label:s.label,short:short[s.id],kind:s.kind==='total'?'total':'delta',value:v(s),m:s.m,treat:s.kind==='total'?'ledger':(s.id==='paper'?'paper':(s.kind==='minus'?'cashminus':'cash')),tipx:s.why}));
    if(mode==='source'&&Math.abs(F.rounding_residual_source)>0.001) st.push({id:'resid',label:'Rounding residual (stated items sum to 41¢)',short:'Rounding residual',kind:'delta',value:F.rounding_residual_source,treat:'residual'});
    st.push({id:'ocf',label:'Cash from operations',short:'Operating cash',kind:'total',value:v(F.result),m:F.result.m,treat:'cash'});
    return st;
  }
  function pair(){ // side-by-side comparison
    const W=640,H=340,p='c3p',ni=mode==='source'?0.66:F.steps[0].verified,ocf=mode==='source'?0.42:F.result.verified;
    const y=v=>30+(1-v/0.8)*260, bw=120;
    const mk=(x,v,t,lab,on,id)=>`<g class="mark" style="opacity:${on?1:.25}" data-hit="${id}" data-tip="<b>${lab}</b><br><span class='t-num'>${fv(v,mode)}</span>"><rect x="${x}" y="${y(v)}" width="${bw}" height="${y(0)-y(v)}" rx="5" ${treat(p,t)}/><text class="lab-num" x="${x+bw/2}" y="${y(v)-9}" text-anchor="middle" style="font-size:16px">${fv(v,mode)}</text><text class="lab-strong" x="${x+bw/2}" y="${y(0)+22}" text-anchor="middle">${lab}</text></g>`;
    let g=defs(p)+`<line class="axis" x1="60" x2="${W-40}" y1="${y(0)}" y2="${y(0)}"/>`;
    g+=`<text class="lab" x="${150+bw/2}" y="${y(0)+40}" text-anchor="middle">accounting earnings</text><text class="lab" x="${390+bw/2}" y="${y(0)+40}" text-anchor="middle">money actually collected</text>`;
    g+=mk(150,ni,'ledger','Net income',view!=='ocf','ni')+mk(390,ocf,'cash','Operating cash flow',view!=='ni','ocf');
    g+=`<path d="M${150+bw} ${y(ni)} C ${330} ${y(ni)}, ${330} ${y(ocf)}, ${390} ${y(ocf)}" fill="none" stroke="#8590ad" stroke-dasharray="3 4"/><text class="lab" x="${270+bw/2-60}" y="${(y(ni)+y(ocf))/2-8}" text-anchor="middle">gap ${fv(ni-ocf,mode)}</text>`;
    return `<svg viewBox="${NARROW()?'110 0 470 '+(H+10):'0 0 '+W+' '+H}" role="img" aria-label="Net income compared with operating cash flow">${g}</svg>`;
  }
  function render(){
    if(view==='bridge'){$('#ch3Chart').innerHTML=waterfall(steps(),{id:'c3',mode,active,max:0.8,gridStep:0.2,H:360,aria:'Bridge from net income to operating cash flow'});}
    else $('#ch3Chart').innerHTML=pair();
    bindHits($('#ch3Chart'),id=>{if(view!=='bridge'){view=id;active=null;pressGroup($$('#ch3 [data-view]'),$(`#ch3 [data-view="${id}"]`))}else active=active===id?null:id;render()});
    const s=[...F.steps,F.result].find(x=>x.id===active);
    let html;
    if(view==='ni') html=`<b>Net income: ${fv(mode==='source'?0.66:F.steps[0].verified,mode)}</b> ${badge('verified')}. That's profit under accounting rules: revenue when earned, costs when incurred, investment gains when valued. It's drawn as a ledger outline because it's a measurement, not money in hand.`;
    else if(view==='ocf') html=`<b>Operating cash flow: ${fv(mode==='source'?0.42:F.result.verified,mode)}</b> (${bil(F.result.m)}) ${badge('verified')}. Cash that actually came in from running the business. It's drawn solid teal because it's real money.`;
    else if(s&&s.why) html=`<b>${esc(s.label)}</b> · <span class="val">${fv(mode==='source'?s.source:s.verified,mode,true)}</span> · ${bil(s.m)} ${badge('verified')}<br>${esc(s.why)}`;
    else if(active==='resid') html=`<b>Rounding residual: +1¢</b> ${badge('calculated')}. The stated rounded items sum to 41¢, but its total says 42¢. The exact filing values sum to 41.8¢, so the gap is rounding and doesn't hide a missing adjustment. Switch to "10-Q (exact)" and it disappears.`;
    else if(mode==='filed') html=`Exact 10-Q values: ${F.steps.map((x,i)=>i?(x.verified<0?' − ':' + ')+cents(Math.abs(x.verified),1):cents(x.verified,1)).join('')} = <b>${cents(F.result.verified,1)}</b> of operating cash (${bil(F.result.m)}) ${badge('verified')}. Using unrounded figures, there's no residual.`;
    else html=`Start at 66¢ of profit, remove what didn't arrive as cash, add back what didn't leave as cash, and you get <b>42¢</b> ${badge('source')} ${badge('verified')}. Gray bars took cash away, teal bars added it back, and the hatched purple bar is paper gains. ${esc(F.note)}`;
    $('#ch3Explain').innerHTML=html;
  }
  const vb=$$('#ch3 [data-view]');vb.forEach(b=>b.addEventListener('click',()=>{view=b.dataset.view;active=null;pressGroup(vb,b);render()}));
  const mb=$$('#ch3 [data-mode]');mb.forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;pressGroup(mb,b);render()}));
  $('#ch3Table').innerHTML=table([...F.steps,F.result].map(s=>[esc(s.label),cents(s.source,0,!!s.kind&&s.kind!=='total'),cents(s.verified,1,!!s.kind&&s.kind!=='total'),bil(s.m)]),['Line','As stated','10-Q','Six-month $']);
  $('#ch3Src').innerHTML=srcLine(F.sources);
  render();RENDERS.push(render);
}

/* ================= CH4 ================= */
function ch4(){
  const K=M.cash; let sel=null;
  const W=700,H=400,top=40,usable=300,k=usable/0.63;
  const tmap={ocf:'cash',debt:'financing',sec:'investing',kept:'cash',share:'deployed',eco:'equity'};
  const scol={ocf:COL.teal,debt:COL.amber,sec:COL.cyan,kept:COL.teal,share:COL.amber,eco:COL.violet};
  const klass={operating:'Operating activity',financing:'Financing activity (borrowed: not earnings)',investing:'Investing activity (asset sold: not revenue)',retained:'Kept / internal use',returned:'Returned to owners',deployed:'Deployed into other companies'};
  function render(){
    const p='c4'; let g=defs(p);
    const xL=0,wL=216,xM=330,wM=56,xR=520,wR=110,gap=14;
    // left nodes
    let yL=top, yMin=top, out=[];
    const nodeL=K.sources_of_cash.map(s=>{const h=s.source*k;const n={...s,y:yL,h};yL+=h+gap;return n});
    const totalH=0.63*k, yM=top+ (nodeL[nodeL.length-1].y+nodeL[nodeL.length-1].h-top-totalH)/2;
    let yR=top; const nodeR=K.uses_of_cash.map(s=>{const h=s.source*k;const n={...s,y:yR,h};yR+=h+gap;return n});
    const yRoff=(yL-yR)/2; nodeR.forEach(n=>n.y+=yRoff);
    // links left->mid
    let cm=yM;
    nodeL.forEach(n=>{const on=!sel||sel===n.id;const x1=xL+wL,x2=xM;g+=`<path class="ribbon" d="M${x1} ${n.y} C ${(x1+x2)/2} ${n.y}, ${(x1+x2)/2} ${cm}, ${x2} ${cm} L ${x2} ${cm+n.h} C ${(x1+x2)/2} ${cm+n.h}, ${(x1+x2)/2} ${n.y+n.h}, ${x1} ${n.y+n.h} Z" fill="${scol[n.id]}" fill-opacity="${on?.32:.06}" stroke="${scol[n.id]}" stroke-opacity="${on?.6:.1}" ${n.class==='financing'?'stroke-dasharray="5 3"':''}/>`;cm+=n.h});
    cm=yM;
    nodeR.forEach(n=>{const on=!sel||sel===n.id;const x1=xM+wM,x2=xR;g+=`<path class="ribbon" d="M${x1} ${cm} C ${(x1+x2)/2} ${cm}, ${(x1+x2)/2} ${n.y}, ${x2} ${n.y} L ${x2} ${n.y+n.h} C ${(x1+x2)/2} ${n.y+n.h}, ${(x1+x2)/2} ${cm+n.h}, ${x1} ${cm+n.h} Z" fill="${scol[n.id]}" fill-opacity="${on?.32:.06}" stroke="${scol[n.id]}" stroke-opacity="${on?.6:.1}"/>`;cm+=n.h});
    const node=(n,x,w,anchor)=>{const on=!sel||sel===n.id;return `<g class="mark" style="opacity:${on?1:.35}" data-hit="${n.id}" data-tip="<b>${esc(n.label)}</b><br><span class='t-num'>${cents(n.source)}</span> stated · ${cents(n.verified,1)} filed · ${bil(n.m)}"><rect x="${x}" y="${n.y}" width="${w}" height="${n.h}" rx="5" ${treat(p,tmap[n.id])}/>
      <text class="lab-num" x="${x+w/2}" y="${n.y+n.h/2+5}" text-anchor="middle" style="font-size:15px;font-weight:700;fill:#fff;paint-order:stroke;stroke:#06101f;stroke-width:3px">${cents(n.source)}</text>
      <text class="lab" x="${anchor==='end'?x-8:x+w+8}" y="${n.y+n.h/2-2}" text-anchor="${anchor}">${tspans(wrap(n.label,anchor==='end'?16:18),anchor==='end'?x-8:x+w+8,14)}</text></g>`};
    // nodes: put labels outside
    nodeL.forEach(n=>{g+=node(n,xL+wL-46,46,'end')});
    g+=`<g><rect x="${xM}" y="${yM}" width="${wM}" height="${totalH}" rx="6" ${treat(p,'cash')}/><text class="lab-num" x="${xM+wM/2}" y="${yM-12}" text-anchor="middle" style="font-size:16px">63¢</text><text class="lab-strong" x="${xM+wM/2}" y="${yM+totalH+20}" text-anchor="middle">New cash</text><text class="lab" x="${xM+wM/2}" y="${yM+totalH+36}" text-anchor="middle">(the stated subtotal)</text></g>`;
    nodeR.forEach(n=>{g+=node(n,xR,46,'start')});
    g+=`<text class="tick" x="${xL+wL-23}" y="${top-14}" text-anchor="middle">WHERE IT CAME FROM</text><text class="tick" x="${xR+23}" y="${top-14}" text-anchor="middle">WHERE IT WENT</text>`;
    $('#ch4Chart').innerHTML=`<svg viewBox="-16 0 ${W+16} ${H+20}" role="img" aria-label="Cash flow diagram: operating cash 42 cents, borrowing 14 cents and securities sold 7 cents make 63 cents of new cash, used as 13 cents kept, 26 cents to shareholders and 24 cents invested in the AI ecosystem.">${g}</svg>`;
    bindHits($('#ch4Chart'),pick);
    const n=[...K.sources_of_cash,...K.uses_of_cash].find(x=>x.id===sel);
    $('#ch4Explain').innerHTML=n?`<b>${esc(n.label)}</b> · <span class="val">${cents(n.source)}</span> stated ${badge('source')} · <span class="val">${cents(n.verified,1)}</span> = ${bil(n.m)} filed ${badge(n.id==='kept'?'calculated':'verified')}<br><span style="color:var(--ink-3)">${klass[n.class]}.</span> ${esc(n.why||(n.id==='ocf'?'The cash from operations in Chapter 3. It\'s the only source here that the business itself earned.':''))}`:
      `Only the teal stream on the left was <i>earned</i>. The hatched amber stream was borrowed, and the dashed cyan stream came from selling assets Nvidia already owned. On the right: purple became stakes in other companies, solid amber went to shareholders, and teal stayed home. ${badge('verified')} ${esc(K.note)}`;
    $$('#ch4Btns .btn').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===sel)));
  }
  function pick(id){sel=sel===id?null:id;render()}
  $('#ch4Btns').innerHTML=[...K.sources_of_cash,...K.uses_of_cash].map(n=>`<button class="btn small" data-id="${n.id}" aria-pressed="false"><span class="sw" style="background:${scol[n.id]}"></span>${esc(n.label.split('(')[0].trim())}</button>`).join(' ');
  $$('#ch4Btns .btn').forEach(b=>b.addEventListener('click',()=>pick(b.dataset.id)));
  $('#ch4Table').innerHTML=table([...K.sources_of_cash,{label:'= New cash',source:K.new_cash.source,verified:K.new_cash.verified,m:K.new_cash.m},...K.uses_of_cash].map(s=>[esc(s.label),cents(s.source),cents(s.verified,1),bil(s.m)]),['Item','As stated','10-Q','Six-month $'])+
    `<p style="margin:8px 0 0">Comparison only: $1.00 of revenue vs 63¢ of new cash leaves a 37¢ gap (on the whiteboard). That gap isn't a use of cash. It's the costs, taxes and working capital already covered in Chapters 2–3, offset by the borrowing and asset sales here.</p>`;
  $('#ch4Src').innerHTML=srcLine(K.sources);
  render();
}

/* ================= CH5 ================= */
function ch5(){
  const layers=[['energy','1 · Energy'],['chips','2 · Chips'],['infra','3 · Infrastructure'],['models','4 · Models'],['apps','5 · Applications']];
  const cos=M.companies; let selL=null, selC='openai';
  const pos={};
  function art(){
    const s=new ISO.Scene({scale:24});
    s.defs.push(`<filter id="c5-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
    const W=9.5,D=2.1,T=0.32,dy=2.5,dz=1.25;
    const layerCol={energy:'#22334a',chips:'#203a3a',infra:'#1f2f4a',models:'#2a2550',apps:'#25304a'};
    const nvPos=[4.1,0.6]; // centre of chips slab
    layers.forEach(([id,name],i)=>{
      const oy=-i*dy, oz=i*dz, on=!selL||selL===id;
      s.box(0,oy,oz,W,D,T,{color:layerCol[id],top:id==='chips'?'#2a4d3c':ISO.shade(layerCol[id],.12),stroke:id==='chips'?'#4fbf8a':'#3e4c74',sw:id==='chips'?1.4:.9,opacity:on?1:.35});
      s.text(-0.25,oy+D,oz+T*0.2,name,`class="lab-strong" font-size="12" text-anchor="end" opacity="${on?1:.4}"`);
      const list=cos.filter(c=>c.layer===id);
      list.forEach((c,k)=>{let x=0.7+k*(id==='models'?1.2:1.4);if(id==='chips'&&x>3.4)x+=2.0;const y=oy+0.45+(k%2)*0.8;pos[c.id]=[x,y,oz+T]});
      if(id==='chips'){pos.nvidia=[nvPos[0],oy+nvPos[1],oz+T]}
    });
    // relationship arcs from Nvidia
    const nv=pos.nvidia, nvTop=[nv[0]+0.5,nv[1]+0.5,nv[2]+1.9];
    cos.forEach(c=>{const p=pos[c.id];if(!p)return;const on=(!selL||selL===c.layer);const conf=c.status==='verified';
      const tgt=[p[0]+0.22,p[1]+0.22,p[2]+0.55];
      const lift=Math.max(0.6,(p[2]-nvTop[2])*0.5+1.4);
      s.curve(nvTop,tgt,lift,`fill="none" stroke="${COL.violet}" stroke-width="${conf?2:1.1}" opacity="${on?(conf?.85:.4):.06}" ${conf&&on?'filter="url(#c5-glow)"':''}`);
      if(/guarantee/i.test(c.rel)||c.id==='sbenergy') s.curve(nvTop,tgt,lift+0.7,`fill="none" stroke="${COL.coral}" stroke-width="1.8" stroke-dasharray="5 4" opacity="${on?.95:.08}"`);
      if(/capacity/i.test(c.rel)) s.curve(nvTop,tgt,lift-0.4,`fill="none" stroke="${COL.cyan}" stroke-width="1.6" stroke-dasharray="1.5 3.5" stroke-linecap="round" opacity="${on?.9:.08}"`);
    });
    // nodes (draw after arcs so they sit on top)
    layers.forEach(([id])=>{
      cos.filter(c=>c.layer===id).forEach(c=>{const p=pos[c.id];const on=(!selL||selL===id);const conf=c.status==='verified';const isSel=selC===c.id;
        const col=id==='models'||id==='apps'?'#6f58c9':id==='chips'?'#3c7a8c':id==='energy'?'#8a6a2a':'#2f6f99';
        s.add(`<g data-hit="${c.id}" data-tip="<b>${esc(c.name)}</b><br>${esc(c.rel)}<br><span class='t-num'>${esc(c.amount)}</span>" aria-label="${esc(c.name)}">`);
        s.box(p[0],p[1],p[2],0.45,0.45,conf?0.55:0.3,{color:col,opacity:on?(conf?1:.55):.15,stroke:isSel?'#ffd37a':ISO.shade(col,.4),sw:isSel?2:.8,dash:conf?null:'2 2'});
        if(isSel||(selL===id)) s.text(p[0]+0.2,p[1]+0.2,p[2]+(conf?0.95:0.7),esc(c.name),`class="lab" font-size="10.5" text-anchor="middle" style="paint-order:stroke;stroke:#060b18;stroke-width:3px"`);
        s.add('</g>');
      });
    });
    // Nvidia hardware block
    s.rack(nv[0],nv[1],nv[2],{w:0.9,d:0.9,h:1.9,trays:7,led:'#76d39a'});
    s.text(nv[0]+0.4,nv[1]+0.4,nv[2]+2.4,'NVIDIA','class="lab-strong" font-size="11.5" text-anchor="middle" style="fill:#9ff0c0;letter-spacing:.08em"');
    return s.autoSvg(14,'role="img" aria-label="Five stacked layers of the AI economy with Nvidia on the chip layer and relationship arcs to companies in every layer"');
  }
  function card(){
    const c=cos.find(x=>x.id===selC);
    if(!c){$('#ch5Card').innerHTML='Select a company.';return}
    $('#ch5Card').innerHTML=`<h4>${esc(c.name)} ${badge(c.status)}</h4><dl><dt>Layer</dt><dd>${layers.find(l=>l[0]===c.layer)[1]}</dd><dt>Relationship</dt><dd>${esc(c.rel)}</dd><dt>Amount</dt><dd>${esc(c.amount)}</dd><dt>When</dt><dd>${esc(c.period)}</dd><dt>Source</dt><dd style="font-size:13px">${c.src.map(id=>{const s=M.sources[id];return s.url?`<a href="${s.url}" target="_blank" rel="noopener">${esc(s.title.slice(0,70))}${s.title.length>70?'…':''}</a>`:esc(s.title.slice(0,70))}).join('<br>')}</dd></dl>`;
  }
  function list(){
    const L=selL?layers.filter(l=>l[0]===selL):layers;
    $('#ch5Cos').innerHTML=L.map(([id,name])=>`<div style="width:100%;display:flex;flex-wrap:wrap;gap:6px;align-items:center"><span class="lbl" style="width:120px;font-size:11px;font-family:var(--mono);color:var(--ink-3);text-transform:uppercase">${name.split('·')[1]}</span>${cos.filter(c=>c.layer===id).map(c=>`<button class="btn small" data-co="${c.id}" aria-pressed="${c.id===selC}" ${c.status==='verified'?'':'style="opacity:.75;border-style:dashed"'}>${esc(c.name)}</button>`).join('')}${id==='chips'?'<span style="font-size:12px;color:var(--ink-4)">+ Nvidia\'s own hardware</span>':''}</div>`).join('');
    $$('#ch5Cos [data-co]').forEach(b=>b.addEventListener('click',()=>{selC=b.dataset.co;render()}));
  }
  function render(){$('#ch5Art').innerHTML=art();bindHits($('#ch5Art'),id=>{selC=id;render()});card();list();
    $$('#ch5Layers .btn').forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.l||null)===selL)))}
  $('#ch5Layers').innerHTML=`<button class="btn small" data-l="" aria-pressed="true">All layers</button> `+layers.map(([id,n])=>`<button class="btn small" data-l="${id}" aria-pressed="false">${n}</button>`).join(' ');
  $$('#ch5Layers .btn').forEach(b=>b.addEventListener('click',()=>{selL=b.dataset.l||null;const f=cos.find(c=>!selL||c.layer===selL);if(selL&&f&&cos.find(c=>c.id===selC).layer!==selL)selC=f.id;render()}));
  $('#ch5Src').innerHTML='Company amounts come from announcements. Nvidia\'s 10-Q reports totals but names no investees. '+srcLine(['s-supply','s-neocloud','s-openai','s-anthropic',"s-ohio"]);
  render();
}

/* ================= CH6 ================= */
function ch6(){
  const P=M.portfolio; let mode='source', active=null, mixSel=null;
  const tr={open:'equity',new:'deployed',buy:'deployed',appr:'paper',val:'paper',sell:'cashminus',close:'equity'};
  const short={open:'Jan 2026 holdings',new:'New investment',buy:'Equity bought',sell:'Equity sold',appr:'Appreciation',val:'Valuation change',close:'Jul 2026 holdings'};
  const why={open:'What Nvidia owned in other companies on Jan 25, 2026: public stocks plus private stakes. Mostly frontier labs (Anthropic, xAI), then supply-chain names like Intel.',
    new:'Cash that left Nvidia and became stakes. The source says most of it was one $30B OpenAI investment, with the rest in optics suppliers, Marvell and neoclouds.',
    buy:'Purchases of equity securities in the cash-flow statement: $42.4B.',
    sell:'Equity securities sold for $7.2B. Selling turns a holding back into cash (Chapter 4\'s "securities sold").',
    appr:'The stated net "appreciation". It\'s a change in <i>value</i>, not cash received. In the filing it equals valuation gains (~13¢) minus equity sold (~4¢).',
    val:'Calculated residual: the change in holdings not explained by buying or selling. That\'s mostly mark-to-market gains on public stakes and re-pricing of private ones. It lines up with the $23.7B of gains in Chapter 2.',
    close:'About $99B of stakes on Jul 26, 2026, valued but not cashed. Selling it all at once would almost certainly fetch less.'};
  function steps(){const b=mode==='source'?P.bridge_source:P.bridge_filed;return b.map(s=>({id:s.id,label:s.label,short:short[s.id],kind:s.kind==='total'?'total':'delta',value:mode==='source'?s.source:s.verified,m:s.m,treat:tr[s.id],tipx:s.detail}))}
  function mix(){
    const W=640,H=150,p='c6m';let g=defs(p);
    const cols={labs:'equity',supply:'investing',neo:'capacity',apps:'ghost'};
    const sc=560/0.6;
    const row=(y,label,data,tot)=>{let x=70,out=`<text class="lab-strong" x="0" y="${y+20}">${label}</text>`;data.forEach(d=>{const w=d.source*sc;const on=!mixSel||mixSel===d.id;
      out+=`<g class="mark" style="opacity:${on?1:.3}" data-hit="${d.id}" data-tip="<b>${esc(d.label)}</b><br><span class='t-num'>${cents(d.source)}</span>${d.note?'<br>'+esc(d.note):''}"><rect x="${x+1}" y="${y}" width="${Math.max(2,w-2)}" height="30" rx="4" ${treat(p,cols[d.id]||'equity')}/><text x="${x+6}" y="${y+20}" class="lab-num" style="font-size:12px">${w>34?cents(d.source):''}</text></g>`;x+=w});
      return out+`<text class="lab-num" x="${x+8}" y="${y+20}">= ${cents(tot)}</text>`};
    g+=row(10,'New',P.new_mix_source.map(d=>({...d,id:d.id})),0.24);
    g+=row(62,'July',P.close_mix_source,0.56);
    g+=`<g font-size="11.5" fill="#8590ad">${[['equity','Frontier labs'],['investing','Supply chain'],['capacity','Neoclouds'],['ghost','Apps & physical AI']].map((l,i)=>`<rect x="${70+i*140}" y="118" width="14" height="10" rx="2" ${treat(p,l[0])}/><text x="${90+i*140}" y="127" class="lab">${l[1]}</text>`).join('')}</g>`;
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Composition of new investment and July holdings by category">${g}</svg>`;
  }
  function render(){
    $('#ch6Chart').innerHTML=waterfall(steps(),{id:'c6',mode,active,max:0.6,gridStep:0.1,H:330,aria:'Investment portfolio bridge from January to July 2026'});
    $('#ch6Mix').innerHTML=mix();
    bindHits($('#ch6Chart'),id=>{active=active===id?null:id;render()});bindHits($('#ch6Mix'),id=>{mixSel=mixSel===id?null:id;active=null;render()});
    const s=steps().find(x=>x.id===active), m=[...P.close_mix_source].find(x=>x.id===mixSel);
    let html;
    if(s) html=`<b>${esc(s.label)}</b> · <span class="val">${fv(s.value,mode,s.kind!=='total')}</span>${s.m?' · '+bil(s.m):''} ${badge(mode==='source'?'source':(s.id==='val'?'calculated':'verified'))}<br>${why[s.id]}`;
    else if(m) html=`<b>${esc(m.label)}</b>: <span class="val">${cents(m.source)}</span> of the July holdings ${badge('source')}. ${esc(m.note)} ${badge('unverified')} The filing doesn't break holdings down by company.`;
    else html=mode==='source'?`22¢ + 24¢ + 10¢ = <b>56¢</b> ${badge('source')}. The filing agrees: 22.5¢ → 55.6¢ (${bil(P.bridge_filed[0].m)} → ${bil(P.bridge_filed[4].m)}) ${badge('verified')}. Switch to the 10-Q view to see sales and gains separately.`
      :`The 10-Q view separates what the stated figure nets together: +23.8¢ bought, −4.1¢ sold, and +13.4¢ of valuation change ${badge('calculated')}. Purple hatching means value that's on paper only.`;
    $('#ch6Explain').innerHTML=html;
    $$('#ch6Btns .btn').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===active)));
  }
  function btns(){const ids=mode==='source'?['open','new','appr','close']:['open','buy','sell','val','close'];
    $('#ch6Btns').innerHTML=ids.map(id=>`<button class="btn small" data-id="${id}" aria-pressed="false">${short[id]}</button>`).join(' ');
    $$('#ch6Btns .btn').forEach(b=>b.addEventListener('click',()=>{active=active===b.dataset.id?null:b.dataset.id;mixSel=null;render()}))}
  const mb=$$('#ch6 [data-mode]');mb.forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;active=null;pressGroup(mb,b);btns();render()}));
  $('#ch6Table').innerHTML=table([...P.bridge_source.map(s=>['Stated: '+esc(s.label),cents(s.source),'']),...P.bridge_filed.map(s=>['10-Q: '+esc(s.label),cents(s.verified,1),bil(s.m)])],['Item','Per $1','$']);
  $('#ch6Src').innerHTML=srcLine(P.sources)+'<br>'+esc(P.note);
  btns();render();RENDERS.push(render);
}

/* ================= CH7 ================= */
function ch7(){
  const Cm=M.commitments, items=Cm.filed_items; let view='all';
  const groupOf={eqc:'commit',csa:'commit',aica:'commit',lease3p:'commit',lps:'guar',sbe:'guar'};
  const ttype=i=>i.type==='guarantee'?'guarantee':i.type==='capacity_backstop'?'capacity':i.type==='own_use'?'ghost':'commit';
  function art(){
    const s=new ISO.Scene({scale:26});
    const vis=g=>view==='all'||view===g;
    const o=g=>vis(g)?1:.12;
    s.plate(0,0,13,9,{grid:1});
    // Nvidia block (left) and the data center (center)
    s.rack(0.8,3.4,0,{w:1,d:1,h:2.6,trays:9});
    s.text(1.3,3.0,3.2,'Nvidia','class="lab-strong" font-size="12" text-anchor="middle"');
    // guarantees: translucent coral shell
    s.add(`<g opacity="${o('guar')}">`);s.glassBox(4.0,1.2,0,7.6,6.4,3.4,'236,90,118',{alpha:.07,edge:.9,dash:'7 5',sw:1.4});s.add('</g>');
    // contingent trigger: hatched trapdoor under the campus
    s.add(`<g opacity="${o('cont')}">`);
    s.poly([[4.4,7.0,0.01],[11.2,7.0,0.01],[11.2,7.9,0.01],[4.4,7.9,0.01]],`fill="url(#c7-h)" stroke="#ec5a76" stroke-dasharray="3 3"`);
    s.text(6.2,9.4,0,'pays only if the tenant defaults','class="lab" font-size="11.5" text-anchor="middle" style="fill:#f7a2b2"');
    s.add('</g>');
    // commitments scaffolding: dashed amber frame
    s.add(`<g opacity="${o('commit')}">`);s.glassBox(4.8,2.0,0,6.0,4.6,2.4,'217,154,30',{alpha:.03,edge:.95,dash:'5 4',sw:1.3});s.add('</g>');
    // the data center
    s.campus(5.6,2.8,4.4,3.0,1.2,{glow:COL.cyan});
    // cash already invested: solid amber pipes from Nvidia
    s.add(`<g opacity="${o('cash')}">`);
    s.curve([1.8,4.0,1.4],[5.6,3.6,1.2],1.6,`fill="none" stroke="${COL.amber}" stroke-width="7" stroke-linecap="round"`);
    s.curve([1.8,4.4,1.0],[5.6,5.0,0.8],1.0,`fill="none" stroke="${COL.amber}" stroke-width="4" stroke-linecap="round"`);
    s.add('</g>');
    // labels
    s.text(11.8,1.0,3.6,'Guarantees','class="lab-strong" font-size="12" style="fill:#f7a2b2" opacity="'+o('guar')+'"');
    s.text(11.3,2.4,2.9,'Commitments','class="lab-strong" font-size="12" style="fill:#f3c56b" opacity="'+o('commit')+'"');
    s.text(3.4,3.0,2.8,'Cash invested','class="lab-strong" font-size="12" style="fill:#f3c56b" opacity="'+o('cash')+'"');
    s.text(10.3,3.4,0.5,'AI data center','class="lab-strong" font-size="12" text-anchor="start"');
    s.defs.push(`<pattern id="c7-h" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#ec5a76" stroke-width="2"/></pattern>`);
    return s.autoSvg(12,'role="img" aria-label="Isometric data center wrapped in layers: solid amber pipes of cash invested, a dashed amber frame of commitments, a translucent coral shell of guarantees, and a hatched trapdoor marking payments that happen only if a tenant defaults."');
  }
  function chart(){
    const p='c7', W=700, rowH=30, left=262, sc=290/0.62;
    const rows=[
      {g:'cash',label:'Equity bought, Feb–Jul 2026 (cash paid)',v:M.cash.uses_of_cash[2].verified,m:M.cash.uses_of_cash[2].m,t:'deployed'},
      {g:'cash',label:'Holdings, Jul 2026 (incl. ~$24B gains)',v:M.portfolio.bridge_filed[4].verified,m:M.portfolio.bridge_filed[4].m,t:'equity',note:'Market or carrying value. Includes valuation gains, so not all of it is cash paid in.'},
      ...items.map(i=>({g:groupOf[i.id],label:i.label,v:i.per_dollar,m:i.m,t:ttype(i),note:i.note})),
      {g:'cont',label:'Payout if every guarantee were called',v:items.filter(i=>i.type==='guarantee').reduce((a,i)=>a+i.per_dollar,0),m:108500,t:'ghost',note:'The same $108.5B as the two guarantee rows above, not extra. A worst case where tenants default AND the assets recover nothing.'},
      {g:'cont',label:'Expected payout: not disclosed',v:null,t:'hypo'},
    ];
    let g=defs(p), y=10, lastG=null;
    const head={cash:'Cash already invested',commit:'Contractual commitments',guar:'Credit guarantees (maximum)',cont:'Potential contingent payments'};
    rows.forEach(r=>{
      if(r.g!==lastG){g+=`<text class="tick" x="0" y="${y+14}" style="letter-spacing:.1em">${head[r.g].toUpperCase()}</text>`;y+=22;lastG=r.g}
      const on=view==='all'||view===r.g;
      const w=r.v==null?120:Math.max(2,r.v*sc);
      g+=`<g class="mark" style="opacity:${on?1:.18}" data-tip="<b>${esc(r.label)}</b>${r.v!=null?`<br><span class='t-num'>${cents(r.v,1)}</span> · ${bil(r.m)}`:''}${r.note?'<br>'+esc(r.note):''}">
        <text class="lab" x="${left-10}" y="${y+18}" text-anchor="end">${esc(r.label.length>38?r.label.slice(0,37)+'…':r.label)}</text>
        <rect x="${left}" y="${y+4}" width="${w}" height="${rowH-10}" rx="4" ${treat(p,r.t)}/>
        <text class="lab-num" x="${left+w+8}" y="${y+18}">${r.v==null?'?':cents(r.v,1)+' · '+bil(r.m)}</text></g>`;
      y+=rowH;
    });
    return `<svg viewBox="0 0 ${W} ${y+6}" role="img" aria-label="Bars comparing cash invested, commitments, guarantees and potential payments, per dollar of sales">${g}</svg>`;
  }
  const txt={
    all:`The stated <b>$1.23</b> ${badge('source')} equals one combination of filed items, ${bil(Cm.reconstructed_total_m)} = <b>${cents(Cm.reconstructed_total,1)}</b> ${badge('calculated')}. That includes $29B of cloud compute Nvidia buys for itself (gray outline). Leave that out and ecosystem promises come to <b>${cents(Cm.ecosystem_total,1)}</b>. Five kinds of item are in the mix: future equity checks, capacity agreements, leases to pass on, own-use cloud and guarantees. Solid shapes are money already paid, dashed shapes are promises, and coral marks risk that appears only if someone else fails to pay. The guarantees' expected payout isn't disclosed anywhere.`,
    cash:`<b>Cash already invested</b> ${badge('verified')}: 23.8¢ of equity bought in six months, part of 55.6¢ of holdings. This money has actually left Nvidia's bank account and is drawn as solid amber pipes.`,
    commit:`<b>Contractual commitments</b> ${badge('verified')}: $25B of future equity investments (possibly including the last $10B of the OpenAI pledge), $36B of AI-cloud capacity agreements, and $20B of leases Nvidia signed and plans to reassign to third parties. All are agreed and not yet paid, and some are "subject to certain contingencies." Drawn as a dashed amber frame. The $29B gray row is cloud compute for Nvidia's own R&D. It's a commitment, but it isn't support for anyone else.`,
    guar:`<b>Credit guarantees</b> ${badge('verified')}: lease and power-payment guarantees capped at $105B for the SB Energy/OpenAI Ohio campus (the press calls them residual-value guarantees) (signed Aug 2026) and $3.5B of land, power and shell guarantees for AI clouds. These are <i>maximums</i>. Nvidia pays only if a tenant defaults, and only the shortfall. The Ohio guarantees don't take effect until each lease starts (first phase expected FY2029), and OpenAI has agreed to indemnify Nvidia for certain losses. Drawn as a translucent coral shell.`,
    cont:`<b>Potential contingent payments</b>: the guarantees' gross cap ${badge('verified')} is the same 61¢ shown above, not an additional amount. The <i>expected</i> payout ${badge('unverified')} isn't disclosed anywhere, and nobody knows it. If OpenAI pays its rent, Nvidia pays nothing. If it defaulted in a bad market, Nvidia could owe part of the cap. The cap is a worst-case ceiling, not a forecast.`,
  };
  function render(){$('#ch7Art').innerHTML=art();$('#ch7Chart').innerHTML=chart();focusTips($('#ch7Chart'));$('#ch7Explain').innerHTML=txt[view]}
  const vb=$$('#ch7 [data-view]');vb.forEach(b=>b.addEventListener('click',()=>{view=b.dataset.view;pressGroup(vb,b);render()}));
  $('#ch7Table').innerHTML=table([...items.map(i=>[esc(i.label),cents(i.per_dollar,1),bil(i.m)]),['<b>Reconstructed total</b>',cents(Cm.reconstructed_total,1),bil(Cm.reconstructed_total_m)],['Stated total',cents(Cm.source_total),''],...Cm.source_mix.map(x=>['Stated mix: '+esc(x.label),cents(x.source),''])],['Item','Per $1','$']);
  $('#ch7Src').innerHTML=srcLine(Cm.sources)+'<br>'+esc(Cm.note);
  render();
}

/* ================= CH8 ================= */
function ch8(){
  const E=M.exposure; let sc=E.scenarios[1];
  $('#guardrail').textContent=E.guardrail;
  const tmap={hold:'equity',commit:'guarantee',mou:'hypo'};
  function render(){
    const p='c8', W=640, H=420, base=360, k=300/2.6, x0=270, bw=110;
    let g=defs(p);
    for(let v=0; v<=2.5; v+=0.5){const y=base-v*k;g+=`<line class="grid" x1="60" x2="${W-20}" y1="${y}" y2="${y}"/><text class="tick" x="54" y="${y+4}" text-anchor="end">${cents(v)}</text>`}
    // $1 of sales reference
    g+=`<rect x="100" y="${base-1*k}" width="80" height="${k}" rx="4" ${treat(p,'revenue')}/><text class="lab-num" x="140" y="${base-k-8}" text-anchor="middle">$1.00</text><text class="lab" x="140" y="${base+18}" text-anchor="middle">${tspans(['Sales','(six months)'],140)}</text>`;
    g+=`<line x1="90" x2="${W-20}" y1="${base-k}" y2="${base-k}" stroke="#2aa9e0" stroke-dasharray="4 4" stroke-opacity=".6"/>`;
    let cum=0;
    E.layers.forEach(L=>{const on=sc.layers.includes(L.id);const h=L.source*k;const y=base-(cum+L.source)*k;
      g+=`<g class="mark" style="opacity:${on?1:.12}" data-tip="<b>${esc(L.label)}</b><br><span class='t-num'>${cents(L.source)}</span> stated · ${cents(L.calc,1)} rebuilt${L.note?'<br>'+esc(L.note):''}">
        <rect x="${x0}" y="${y+1}" width="${bw}" height="${h-2}" rx="4" ${treat(p,tmap[L.id])}/>
        ${on?`<text class="lab-num" x="${x0+bw/2}" y="${y+h/2+5}" text-anchor="middle" style="font-weight:700;paint-order:stroke;stroke:#06101f;stroke-width:3px">${cents(L.source)}</text>
        <line x1="${x0+bw+4}" x2="${x0+bw+16}" y1="${y+h/2}" y2="${y+h/2}" stroke="#8590ad"/>
        <text class="lab" x="${x0+bw+22}" y="${y+h/2-4}">${tspans(wrap(L.label,30),x0+bw+22,14)}</text>`:''}</g>`;
      if(on)cum+=L.source;});
    g+=`<text class="lab-num" x="${x0+bw/2}" y="${base-cum*k-12}" text-anchor="middle" style="font-size:18px;font-weight:700">${cents(sc.source)}</text>`;
    g+=`<text class="lab" x="${x0+bw/2}" y="${base+18}" text-anchor="middle">${tspans(wrap(sc.label,20),x0+bw/2)}</text>`;
    $('#ch8Chart').innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="group" aria-label="Stacked exposure: ${esc(sc.label)} totals ${cents(sc.source)} per dollar of sales">${g}</svg>`;
    focusTips($('#ch8Chart'));
    const parts=E.layers.filter(L=>sc.layers.includes(L.id));
    const dollars={hold:'$99B',commit:'$218.5B',mou:'$125B (illustrative)'};
    $('#ch8Explain').innerHTML=`<b>${esc(sc.label)}: ${cents(sc.source)}</b> ${badge(sc.id==='s1'?'verified':(sc.id==='s2'?'calculated':'hypothetical'))}<br>`+parts.map(L=>`${cents(L.source)} (${dollars[L.id]}) = ${esc(L.label)}`).join(' + ')+
      `<br><span style="color:var(--ink-3)">${sc.id==='s1'?'Stakes Nvidia owns today, at market or carrying value, including gains.':sc.id==='s2'?'Adds gross caps on things Nvidia has agreed to. They may never be paid in full, and some may overlap. The biggest, the $105B Ohio guarantee (59¢), counts here at its full cap even though it isn\'t in force yet. And the $25B of equity commitments would become holdings once paid, so the two layers aren\'t independent. Excluding Nvidia\'s own cloud purchases: $1.62.':'Adds an illustrative figure for non-binding MOUs with no disclosed cap. It\'s a worst case on top of a worst case, not an expected outcome. Excluding own-use cloud: $2.32.'}</span>`;
    $$('#ch8Btns .btn').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===sc.id)));
  }
  $('#ch8Btns').innerHTML=E.scenarios.map((s,i)=>`<button class="btn" data-id="${s.id}" aria-pressed="false">${i+1} · ${esc(s.label)}</button>`).join(' ');
  $$('#ch8Btns .btn').forEach(b=>b.addEventListener('click',()=>{sc=E.scenarios.find(s=>s.id===b.dataset.id);render()}));
  const eco=M.commitments.ecosystem_total;
  $('#ch8Table').innerHTML=table([...E.layers.map(L=>[esc(L.label),cents(L.source),cents(L.calc,1)]),['Commitments excl. Nvidia\'s own-use cloud','',cents(eco,1)],...E.scenarios.map(s=>['<b>'+esc(s.label)+'</b>',cents(s.source),s.id==='s2'?cents(0.5561+eco,2)+' excl. own-use':s.id==='s3'?cents(0.5561+eco+0.7029,2)+' excl. own-use':''])],['Layer','As stated','Rebuilt'])+`<p style="margin:8px 0 0"><b>Lehman comparison</b> ${badge('verified')}: Lehman ${esc(E.lehman.lehman_ratio)}. ${esc(E.lehman.why_not_comparable)}</p>`;
  $('#ch8Src').innerHTML=srcLine(E.sources);
  render();
}

/* ================= CH9 ================= */
function ch9(){
  const types=[
    {id:'product',label:'Product purchases',col:COL.cyan,dash:'',w:3.2,step:0},
    {id:'services',label:'Computing services',col:'#58d6ae',dash:'',w:2.2,step:0},
    {id:'equity',label:'Equity ownership',col:COL.violet,dash:'',w:2.4,step:1},
    {id:'cash',label:'Cash investment (2026)',col:COL.amber,dash:'',w:3,step:1},
    {id:'credit',label:'Credit support',col:COL.coral,dash:'6 5',w:2.4,step:2},
    {id:'commit',label:'Contractual commitments',col:COL.amber,dash:'3 5',w:2,step:2},
    {id:'hypo',label:'Non-binding MOUs',col:COL.coral,dash:'1.5 5',w:2.4,step:2},
  ];
  const on=new Set(types.map(t=>t.id)); let step=RM?3:0;
  const N={nv:[9.5,9.5,2.6],hyper:[2.6,3.2,1.3],neo:[16.2,3.2,1.0],labs:[3.0,15.6,1.6],supply:[16.4,15.6,1.0],fin:[10.2,20.4,1.2],ohio:[0.8,9.8,1.4],energy:[0.6,19.2,0.6]};
  const E=[
    ['nv','hyper','product'],['nv','neo','product'],['nv','ohio','product'],['nv','labs','product'],
    ['neo','nv','services'],
    ['nv','labs','equity'],['nv','neo','equity'],['nv','supply','equity'],['nv','energy','equity'],
    ['nv','labs','cash'],['nv','supply','cash'],['nv','neo','cash'],
    ['nv','ohio','credit'],['nv','neo','credit'],
    ['nv','fin','hypo'],['nv','neo','commit'],['nv','labs','commit'],
  ];
  const labels={nv:'Nvidia (chips layer)',hyper:'Hyperscalers',neo:'Neoclouds: CoreWeave, Nebius',labs:'Frontier labs: OpenAI, Anthropic, xAI',supply:'Suppliers: Intel, Marvell, optics',fin:'Six financiers ($500B MOUs)',ohio:'Ohio campus (SB Energy, leased by OpenAI)',energy:'Energy: SB Energy'};
  function draw(){
    const s=new ISO.Scene({scale:22});
    s.plate(-1,-1,21,24,{grid:2});
    s.campus(1.0,1.6,3.6,2.4,1.1);s.campus(1.4,4.4,2.2,1.4,0.8,{color:'#2c3656'});
    s.neocloud(14.4,1.6,3.0,2.0,0.9);s.neocloud(15.2,4.0,2.0,1.4,0.7,{color:'#23364a'});
    s.lab(1.4,14.2,1.6,1.4,1.6);s.lab(3.6,14.6,1.2,1.1,1.1,{color:'#332b55'});s.lab(1.8,16.6,1.0,1.0,0.9,{color:'#2e2850'});
    s.box(14.8,14.4,0,1.6,1.4,1.0,{color:'#24354a'});s.box(16.8,14.6,0,1.2,1.0,0.7,{color:'#223644'});s.box(15.4,16.4,0,1.0,1.0,0.6,{color:'#283248'});
    for(let i=0;i<6;i++)s.bank(7.4+i%3*1.9,19.6+Math.floor(i/3)*1.9,1.4,1.2,0.6);
    s.glassBox(-0.6,8.2,0,3.0,3.2,2.0,'236,90,118',{alpha:.07,dash:'6 4'});s.campus(-0.2,8.8,2.2,2.0,0.9);
    s.plant(-0.6,18.0);
    // edges
    E.forEach(([a,b,t],i)=>{const T=types.find(x=>x.id===t);const vis=on.has(t)&&T.step<=step;const off=(i%3-1)*0.35;
      const A=N[a],B=N[b];s.curve([A[0]+off,A[1]-off,A[2]],[B[0]-off,B[1]+off,B[2]],2.2+(i%4)*0.5,`fill="none" stroke="${T.col}" stroke-width="${T.w}" ${T.dash?`stroke-dasharray="${T.dash}"`:''} stroke-linecap="round" opacity="${vis?.85:0}" style="transition:opacity .5s"`)});
    [[8.6,8.6],[10.0,8.6],[8.6,10.0],[10.0,10.0]].forEach(([x,y])=>s.rack(x,y,0,{h:2.6}));
    Object.entries(N).forEach(([k,p])=>s.text(p[0],p[1],p[2]+(k==='nv'?1.6:1.4),labels[k],`class="lab-strong" font-size="${k==='nv'?13:11.5}" text-anchor="middle" style="paint-order:stroke;stroke:#060b18;stroke-width:4px${k==='nv'?';fill:#9ff0c0':''}"`));
    $('#netStage').innerHTML=s.autoSvg(10,'preserveAspectRatio="xMidYMid meet"');
  }
  $('#ch9Btns').innerHTML+=types.map(t=>`<button class="btn small" data-t="${t.id}" aria-pressed="true"><span class="sw" style="background:${t.dash?'transparent':t.col};border:2px ${t.dash?'dashed':'solid'} ${t.col}"></span>${t.label}</button>`).join('');
  $('#ch9Btns').insertAdjacentHTML('beforeend',' <button class="btn small" id="ch9All">Show all</button>');
  $('#ch9All').addEventListener('click',()=>{types.forEach(t=>on.add(t.id));$$('#ch9Btns [data-t]').forEach(b=>b.setAttribute('aria-pressed','true'));step=3;draw();$('#ch9Explain').innerHTML='All seven relationship types shown.'});
  $$('#ch9Btns [data-t]').forEach(b=>b.addEventListener('click',()=>{const t=b.dataset.t;on.has(t)?on.delete(t):on.add(t);b.setAttribute('aria-pressed',String(on.has(t)));step=3;draw();explain(t)}));
  function explain(t){const T=types.find(x=>x.id===t);const d={product:'Customers buy racks and systems. This is revenue, where the dollar started (Chapter 1).',services:'Nvidia also buys computing back from neoclouds through cloud-service agreements. Its customer is also its supplier.',equity:'Stakes Nvidia owns, worth ~$99B in July 2026 (Chapter 6).',cash:'Cash paid out for new stakes during 2026: ~$42B in six months (Chapter 4).',credit:'Guarantees and credit support: up to $105B for Ohio, plus neocloud leases and land/power guarantees (Chapter 7).',commit:'Agreed future payments: equity commitments, AI-cloud capacity agreements and leases (Chapter 7).',hypo:'Non-binding memoranda with six financiers. Nvidia may provide residual-value support case by case. An illustration, not an obligation (Chapter 8).'}[t];
    $('#ch9Explain').innerHTML=`<b style="color:${T.col}">${T.label}</b>: ${on.has(t)?'shown':'hidden'}. ${d}`}
  $('#ch9Explain').innerHTML='Click a relationship type to hide or show its lines. Line colors and dash styles match the rest of the page: solid means paid or owned, dashed means promised, dotted means non-binding.';
  const wrapEl=$('#netWrap'), svgScale=()=>{const sv=$('#netStage svg');if(!sv)return;
    if(RM||innerWidth<=960){sv.style.transform='none';return}
    const r=wrapEl.getBoundingClientRect(), total=r.height-innerHeight, pr=Math.min(1,Math.max(0,-r.top/Math.max(1,total)));
    const ns=Math.min(3,Math.floor(pr*4.2)); if(ns!==step&&on.size===types.length){step=ns;draw()}
    const sc=1.45-0.45*Math.min(1,pr*1.35); $('#netStage svg').style.transform=`scale(${sc.toFixed(3)})`;
    $$('.netcopy .step').forEach(p=>p.classList.toggle('on',+p.dataset.step<=step));};
  if(RM||innerWidth<=960){step=3;$$('.netcopy .step').forEach(p=>p.classList.add('on'))}
  draw(); addEventListener('scroll',svgScale,{passive:true}); addEventListener('resize',svgScale); svgScale();
}

/* ================= CLAIMS + SOURCES ================= */
function claims(){
  $('#claimsTable tbody').innerHTML=M.claims.map(c=>`<tr><td>${esc(c.claim)}</td><td>${badge(c.status)}</td><td>${esc(c.finding)}</td></tr>`).join('');
  $('#srcList').innerHTML=Object.entries(M.sources).map(([id,s])=>`<li>${s.url?`<a href="${s.url}" target="_blank" rel="noopener">${esc(s.title)}</a>`:esc(s.title)} <span style="color:var(--ink-4)">(${esc(s.kind)})</span></li>`).join('');
}

/* ================= SCROLL: reveal, nav, dollar dock ================= */
function scrollUX(){
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});
  $$('.reveal').forEach(el=>io.observe(el));
  const chapters=$$('section.chapter[id]'), links=$$('.chapnav a'), dock=$('#dock');
  function onScroll(){
    const h=document.documentElement; $('#progress').style.width=(h.scrollTop/(h.scrollHeight-h.clientHeight)*100)+'%';
    let cur=null; chapters.forEach(c=>{const r=c.getBoundingClientRect();if(r.top<innerHeight*0.45)cur=c});
    links.forEach(a=>a.setAttribute('aria-current',String(cur&&a.getAttribute('href')==='#'+cur.id)));
    const d=cur&&cur.dataset.dollar;
    if(d&&DOLLAR[d]){dock.classList.add('on');document.body.classList.add('dock-on');if(dock.dataset.s!==d){dock.dataset.s=d;$('#dockGlyph').innerHTML=bill(DOLLAR[d][0]);$('#dockText').textContent=DOLLAR[d][1];dock.classList.remove('tuck');clearTimeout(window.__dk);if(innerWidth<=600)window.__dk=setTimeout(()=>dock.classList.add('tuck'),2600)}}
    else {dock.classList.remove('on');document.body.classList.remove('dock-on')}
  }
  let lastY=scrollY;addEventListener('scroll',()=>{if(innerWidth<=600){const y=scrollY;if(y<lastY-6)dock.classList.remove('tuck');else if(y>lastY+6&&!window.__dkHold)dock.classList.add('tuck');lastY=y}},{passive:true});
  addEventListener('scroll',onScroll,{passive:true});onScroll();
}

hero();ch1();ch2();ch3();ch4();ch5();ch6();ch7();ch8();ch9();claims();scrollUX();
let lastNarrow=NARROW();addEventListener('resize',()=>{if(NARROW()!==lastNarrow){lastNarrow=NARROW();RENDERS.forEach(f=>f())}});
window.__ready=true;
})();
