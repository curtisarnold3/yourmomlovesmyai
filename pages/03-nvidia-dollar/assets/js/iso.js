/* Isometric illustration kit. Local SVG, no numbers baked in.
   Every scene is generated as vector so labels/values stay editable. */
(function(){
  const C = Math.cos(Math.PI/6), S = 0.5;
  function hex2rgb(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return[(n>>16)&255,(n>>8)&255,n&255]}
  function rgb2hex(r,g,b){return'#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('')}
  function shade(h,f){const[r,g,b]=hex2rgb(h);return f>=0?rgb2hex(r+(255-r)*f,g+(255-g)*f,b+(255-b)*f):rgb2hex(r*(1+f),g*(1+f),b*(1+f))}

  class Scene{
    constructor(opt={}){this.s=opt.scale||22;this.ox=opt.ox||0;this.oy=opt.oy||0;this.parts=[];this.defs=[];this.bb=[1e9,1e9,-1e9,-1e9];}
    P(x,y,z=0){const a=(x-y)*C*this.s+this.ox,b=(x+y)*S*this.s-z*this.s+this.oy;const B=this.bb;if(a<B[0])B[0]=a;if(b<B[1])B[1]=b;if(a>B[2])B[2]=a;if(b>B[3])B[3]=b;return[a,b]}
    autoSvg(pad=20,attrs=''){const B=this.bb;return this.svg(`${(B[0]-pad).toFixed(0)} ${(B[1]-pad).toFixed(0)} ${(B[2]-B[0]+2*pad).toFixed(0)} ${(B[3]-B[1]+2*pad).toFixed(0)}`,attrs)}
    pts(arr){return arr.map(p=>this.P(...p).map(v=>v.toFixed(1)).join(',')).join(' ')}
    add(svg){this.parts.push(svg);return this}
    poly(arr,attrs=''){return this.add(`<polygon points="${this.pts(arr)}" ${attrs}/>`)}
    line(a,b,attrs=''){const p=this.P(...a),q=this.P(...b);return this.add(`<line x1="${p[0].toFixed(1)}" y1="${p[1].toFixed(1)}" x2="${q[0].toFixed(1)}" y2="${q[1].toFixed(1)}" ${attrs}/>`)}
    path(arr,attrs=''){const d=arr.map((p,i)=>(i?'L':'M')+this.P(...p).map(v=>v.toFixed(1)).join(' ')).join(' ');return this.add(`<path d="${d}" ${attrs}/>`)}
    curve(a,b,lift,attrs=''){ // quadratic arc between two iso points, lifted in z
      const p=this.P(...a),q=this.P(...b);const m=this.P((a[0]+b[0])/2,(a[1]+b[1])/2,Math.max(a[2]||0,b[2]||0)+lift);
      return this.add(`<path d="M${p[0].toFixed(1)} ${p[1].toFixed(1)} Q${m[0].toFixed(1)} ${m[1].toFixed(1)} ${q[0].toFixed(1)} ${q[1].toFixed(1)}" ${attrs}/>`)}
    text(x,y,z,str,attrs=''){const p=this.P(x,y,z);const fs=+((attrs.match(/font-size="([\d.]+)"/)||[])[1]||12);const w=String(str).replace(/&[a-z]+;/g,'x').length*fs*0.56;const B=this.bb;
      const anc=/text-anchor="middle"/.test(attrs)?0.5:(/text-anchor="end"/.test(attrs)?1:0);const x0=p[0]-w*anc,x1=x0+w;if(x0<B[0])B[0]=x0;if(x1>B[2])B[2]=x1;if(p[1]-fs<B[1])B[1]=p[1]-fs;
      return this.add(`<text x="${p[0].toFixed(1)}" y="${p[1].toFixed(1)}" ${attrs}>${str}</text>`)}
    box(x,y,z,w,d,h,o={}){
      const base=o.color||'#2a3552', st=o.stroke||shade(base,.25), sw=o.sw??0.8, op=o.opacity??1, dash=o.dash?`stroke-dasharray="${o.dash}"`:'';
      const top=o.top||shade(base,.18), left=o.left||shade(base,-.18), right=o.right||shade(base,-.38);
      const g=`stroke="${st}" stroke-width="${sw}" stroke-linejoin="round" ${dash}`;
      this.add(`<g opacity="${op}" ${o.cls?`class="${o.cls}"`:''} ${o.id?`id="${o.id}"`:''}>`);
      this.poly([[x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+h],[x,y+d,z+h]],`fill="${left}" ${g}`);
      this.poly([[x+w,y,z],[x+w,y+d,z],[x+w,y+d,z+h],[x+w,y,z+h]],`fill="${right}" ${g}`);
      this.poly([[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]],`fill="${top}" ${g}`);
      this.add('</g>');return this;
    }
    glassBox(x,y,z,w,d,h,rgb,o={}){ // translucent legal/financial structure; rgb like '236,90,118'
      const a=o.alpha??0.10;
      return this.box(x,y,z,w,d,h,{top:`rgba(${rgb},${a*1.4})`,left:`rgba(${rgb},${a})`,right:`rgba(${rgb},${a*0.7})`,stroke:`rgba(${rgb},${o.edge??0.85})`,sw:o.sw||1.2,dash:o.dash,cls:o.cls,id:o.id})}
    plate(x,y,w,d,o={}){ // ground plate with grid
      this.box(x,y,-0.25,w,d,0.25,{color:o.color||'#141d33',top:o.top||'#121a2e',stroke:o.stroke||'rgba(160,190,255,.18)',sw:.8});
      const gs=o.grid||1;for(let i=gs;i<w;i+=gs)this.line([x+i,y,0],[x+i,y+d,0],'stroke="rgba(160,190,255,.06)" stroke-width="1"');
      for(let j=gs;j<d;j+=gs)this.line([x,y+j,0],[x+w,y+j,0],'stroke="rgba(160,190,255,.06)" stroke-width="1"');return this}
    // --- physical objects ---
    rack(x,y,z=0,o={}){ // GPU rack: compute trays, switch trays, liquid-cooling manifold
      const w=o.w||1.1,d=o.d||0.9,h=o.h||3.4,led=o.led||'#2aa9e0';
      this.box(x,y,z,w,d,h,{color:'#1d2640',top:'#2a3555',left:'#161e33',right:'#10172a',stroke:'#3a4870'});
      const trays=o.trays||12;
      for(let i=1;i<trays;i++){const zz=z+0.18+i*(h-0.3)/trays;
        this.line([x+0.06,y+d,zz],[x+w-0.06,y+d,zz],`stroke="${i%5===0?'#5a6a95':'#2c3858'}" stroke-width="${i%5===0?1.4:0.8}"`);
        this.line([x+0.12,y+d,zz-0.09],[x+0.32,y+d,zz-0.09],`stroke="${led}" stroke-width="1.6" stroke-linecap="round" class="pulse" style="animation-delay:${(i*0.17)%2}s"`);}
      // cooling manifold on the side
      this.line([x+w,y+0.18,z+0.15],[x+w,y+0.18,z+h-0.1],'stroke="#2aa9e0" stroke-opacity=".55" stroke-width="2"');
      this.line([x+w,y+0.3,z+0.15],[x+w,y+0.3,z+h-0.1],'stroke="#ec5a76" stroke-opacity=".35" stroke-width="2"');
      return this}
    campus(x,y,w,d,h,o={}){ // hyperscale campus: long halls + roof chillers
      const c=o.color||'#27324f';
      this.box(x,y,0,w,d,h,{color:c,top:shade(c,.12),stroke:shade(c,.3)});
      const n=Math.max(2,Math.floor(w/0.7));
      for(let i=0;i<n;i++){const cx=x+0.25+i*(w-0.5)/n;this.box(cx,y+0.2,h,0.35,d-0.4,0.18,{color:'#3a4669',stroke:'#4b5a84',sw:.5})}
      for(let k=0;k<3;k++){const zz=0.25+k*(h-0.4)/3;this.line([x+0.15,y+d,zz],[x+w-0.15,y+d,zz],`stroke="${o.glow||'#2aa9e0'}" stroke-opacity=".45" stroke-width="1.2"`)}
      return this}
    lab(x,y,w,d,h,o={}){ // model lab: office block + glass compute cube
      const c=o.color||'#2c2a4f';
      this.box(x,y,0,w,d,h,{color:c,stroke:shade(c,.35)});
      for(let k=1;k<4;k++){this.line([x+0.1,y+d,k*h/4],[x+w-0.1,y+d,k*h/4],'stroke="#9a7df0" stroke-opacity=".5" stroke-width="1"')}
      this.box(x+w*0.2,y+d*0.2,h,w*0.6,d*0.6,h*0.45,{top:'rgba(154,125,240,.35)',left:'rgba(154,125,240,.18)',right:'rgba(154,125,240,.12)',stroke:'#b9a6ff',sw:1});
      return this}
    neocloud(x,y,w,d,h,o={}){ // GPU cloud hall: box + rows of racks visible through glass roof
      const c=o.color||'#1f3445';
      this.box(x,y,0,w,d,h,{color:c,stroke:shade(c,.35)});
      for(let i=0;i<4;i++)this.line([x+0.2+i*(w-0.4)/3,y+0.2,h+0.01],[x+0.2+i*(w-0.4)/3,y+d-0.2,h+0.01],'stroke="#2aa9e0" stroke-opacity=".6" stroke-width="1.4"');
      return this}
    bank(x,y,w,d,h,o={}){ // financier: columns + pediment
      const c=o.color||'#3a3326';
      this.box(x,y,0,w,d,0.2,{color:'#4a4330',stroke:'#7a6a40'});
      this.box(x+0.1,y+0.1,0.2,w-0.2,d-0.2,h,{color:c,stroke:'#7a6a40'});
      for(let i=0;i<5;i++){const xx=x+0.2+i*(w-0.4)/4;this.line([xx,y+d-0.1,0.2],[xx,y+d-0.1,0.2+h],'stroke="#d99a1e" stroke-opacity=".55" stroke-width="1.6"')}
      this.poly([[x,y+d,h+0.2],[x+w,y+d,h+0.2],[x+w/2,y+d,h+0.75]],'fill="#4a4330" stroke="#d99a1e" stroke-opacity=".6"');
      return this}
    plant(x,y,o={}){ // energy: cooling tower + solar rows + pylons
      for(let r=0;r<3;r++)for(let c=0;c<3;c++)this.box(x+c*0.75,y+r*0.6,0,0.6,0.42,0.06,{color:'#1d3b5a',top:'#2b5c8a',stroke:'#4a86c0',sw:.5});
      const tx=x+2.9,ty=y+0.9,p=this.P(tx,ty,0),q=this.P(tx,ty,1.8),rw=0.85*this.s,rt=0.55*this.s;
      this.add(`<path d="M${p[0]-rw} ${p[1]} Q${p[0]-rt*0.6} ${(p[1]+q[1])/2} ${q[0]-rt} ${q[1]} L${q[0]+rt} ${q[1]} Q${p[0]+rt*0.6} ${(p[1]+q[1])/2} ${p[0]+rw} ${p[1]} Z" fill="#2c3550" stroke="#5a6a95"/>`);
      this.add(`<ellipse cx="${q[0]}" cy="${q[1]}" rx="${rt}" ry="${rt*0.45}" fill="#1a2238" stroke="#5a6a95"/>`);
      this.add(`<ellipse cx="${q[0]}" cy="${q[1]-14}" rx="${rt*0.9}" ry="${rt*0.5}" fill="rgba(200,215,255,.06)"/>`);
      return this}
    devices(x,y,o={}){ // edge: laptop, console, robot
      this.box(x,y,0,1.1,0.75,0.07,{color:'#2b3352',stroke:'#4b5a84'});
      this.poly([[x,y,0.07],[x+1.1,y,0.07],[x+1.1,y,0.8],[x,y,0.8]],'fill="#141b2f" stroke="#4b5a84"');
      this.poly([[x+0.07,y,0.14],[x+1.03,y,0.14],[x+1.03,y,0.74],[x+0.07,y,0.74]],'fill="rgba(42,169,224,.22)"');
      this.box(x+1.5,y+0.1,0,0.55,0.75,0.35,{color:'#252d48',stroke:'#4b5a84'});
      this.line([x+2.5,y+0.4,0],[x+2.5,y+0.4,0.7],'stroke="#8590ad" stroke-width="3" stroke-linecap="round"');
      this.line([x+2.5,y+0.4,0.7],[x+2.9,y+0.4,1.0],'stroke="#8590ad" stroke-width="3" stroke-linecap="round"');
      this.line([x+2.9,y+0.4,1.0],[x+3.15,y+0.4,0.8],'stroke="#2aa9e0" stroke-width="3" stroke-linecap="round"');
      return this}
    svg(vb,attrs=''){return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" ${attrs}><defs>${this.defs.join('')}</defs>${this.parts.join('')}</svg>`}
  }
  window.ISO={Scene,shade,P:(s,x,y,z)=>s.P(x,y,z)};
})();
