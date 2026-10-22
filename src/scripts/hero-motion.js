
(()=>{
const root=document.getElementById('kim-portfolio'),stage=root.querySelector('.ki-stage'),knot=root.querySelector('.kl-object'),skip=document.querySelector('.ki-skip'),name=root.querySelector('.ki-name'),canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d'),status=document.querySelector('#ki-status');
const reduce=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(pointer:fine)');let targetX=0,targetY=0,x=0,y=0,frame=0,visible=true,scroll=0,targetScroll=0;
const lifecycle=new AbortController(), options={signal:lifecycle.signal};
const mesh=[];
function curve(t){const r=1+.36*Math.cos(3*t);return [r*Math.cos(2*t),r*Math.sin(2*t),.36*Math.sin(3*t)];}
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>{const n=Math.hypot(...a);return a.map(v=>v/n)};
for(let i=0;i<180;i++){const t=i/180*Math.PI*2,c=curve(t),next=curve(t+.001),tangent=unit(next.map((v,j)=>v-c[j])),n=unit(cross(tangent,[0,0,1])),b=unit(cross(tangent,n));const ring=[];for(let j=0;j<14;j++){const a=j/14*Math.PI*2,normal=n.map((v,k)=>v*Math.cos(a)+b[k]*Math.sin(a));ring.push({p:c.map((v,k)=>v+.145*normal[k]),n:normal});}mesh.push(ring);}
function rotate(p){const ay=.6+x*.28,ax=.35+y*.24;const a=[p[0]*Math.cos(ay)+p[2]*Math.sin(ay),p[1],-p[0]*Math.sin(ay)+p[2]*Math.cos(ay)];return [a[0],a[1]*Math.cos(ax)-a[2]*Math.sin(ax),a[1]*Math.sin(ax)+a[2]*Math.cos(ax)];}
function draw(){const r=canvas.getBoundingClientRect();if(!r.width)return;const d=Math.min(devicePixelRatio||1,2);if(canvas.width!==Math.round(r.width*d)||canvas.height!==Math.round(r.height*d)){canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);}ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,r.width,r.height);const scale=Math.min(r.width,r.height)*.28;const points=mesh.map(ring=>ring.map(v=>{const p=rotate(v.p),n=rotate(v.n),perspective=4/(4-p[2]);return {x:r.width/2+p[0]*scale*perspective,y:r.height/2+p[1]*scale*perspective,z:p[2],n};}));const faces=[];for(let i=0;i<180;i++)for(let j=0;j<14;j++){const v=[points[i][j],points[(i+1)%180][j],points[(i+1)%180][(j+1)%14],points[i][(j+1)%14]];faces.push({v,z:v.reduce((s,a)=>s+a.z,0)/4});}faces.sort((a,b)=>a.z-b.z);for(const f of faces){const n=unit(f.v.reduce((a,v)=>a.map((s,i)=>s+v.n[i]),[0,0,0]));const light=Math.max(0,dot(n,unit([-.5,-.7,1]))),spec=Math.pow(Math.max(0,n[2]),12);const value=Math.round(Math.min(245,34+light*155+spec*70));ctx.fillStyle=`rgb(${value},${value},${value})`;ctx.beginPath();f.v.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();}}

// Intro owns transform; ambient depth uses the independent translate property.
// The real portrait receives no pointer or scroll transforms.
function resetDepth(){targetX=targetY=x=y=scroll=targetScroll=0;name.style.translate='none';knot.style.translate='none';}
function allowed(){return !document.documentElement?.dataset?.intro&&skip.hidden&&!reduce.matches&&!document.hidden&&visible;}
function tick(){
 frame=0;if(!allowed())return;
 const dx=targetX-x,dy=targetY-y,ds=targetScroll-scroll;
 x+=dx*.12;y+=dy*.12;scroll+=ds*.12;
 name.style.translate=`${-x*5}px ${-y*3-scroll*28}px`;
 knot.style.translate=`${x*7}px ${y*4-scroll*14}px`;
 draw();
 if(Math.abs(dx)+Math.abs(dy)+Math.abs(ds)>.001)schedule();
}
function schedule(){if(!frame&&allowed())frame=requestAnimationFrame(tick);}
function scrollTarget(){const r=stage.getBoundingClientRect();targetScroll=Math.min(1,Math.max(0,-r.top/Math.max(1,r.height)));schedule();}
stage.addEventListener('pointermove',e=>{
 if(!allowed()||!fine.matches||e.pointerType==='touch')return;
 const r=stage.getBoundingClientRect();
 targetX=Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1));
 targetY=Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1));schedule();
},options);
stage.addEventListener('pointerleave',()=>{targetX=targetY=0;schedule();},options);
window.addEventListener('scroll',scrollTarget,{passive:true,...options});
const resize=new ResizeObserver(()=>{if(!document.hidden&&visible){draw();scrollTarget();}});resize.observe(canvas);
const visibility=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){draw();scrollTarget();}else{cancelAnimationFrame(frame);frame=0;}});visibility.observe(stage);
const intro=new MutationObserver(()=>{
 cancelAnimationFrame(frame);frame=0;resetDepth();
 if(skip.hidden){draw();scrollTarget();}
});intro.observe(skip,{attributes:true,attributeFilter:['hidden']});
const revealAnimations=new Set();
function cancelReveals(){revealAnimations.forEach(a=>a.cancel());revealAnimations.clear();}
reduce.addEventListener('change',()=>{cancelAnimationFrame(frame);frame=0;resetDepth();cancelReveals();if(!document.hidden)draw();},options);
fine.addEventListener('change',()=>{targetX=targetY=0;schedule();},options);
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;cancelReveals();}else{draw();scrollTarget();}},options);
const revealed=new WeakSet();
const reveals=new IntersectionObserver(entries=>{
 for(const entry of entries){
  if(!entry.isIntersecting||revealed.has(entry.target))continue;
  revealed.add(entry.target);reveals.unobserve(entry.target);
  if(reduce.matches||document.hidden)continue;
  if(entry.target.hasAttribute?.('data-scroll-scene'))continue;
  const elements=entry.target.id==='ke-about'?[...entry.target.querySelectorAll('.kim-about-photo,#about-heading,p,.ke-resume')]:[entry.target];
  elements.forEach((element,i)=>{
   const a=element.animate([{opacity:.35,translate:'0 16px'},{opacity:1,translate:'0 0'}],{duration:460,delay:i*70,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'});
   revealAnimations.add(a);a.finished.then(()=>revealAnimations.delete(a)).catch(()=>{});
  });
 }
},{threshold:.12});
root.querySelectorAll('#ke-about,.kx-entry,.kx-credential').forEach(el=>reveals.observe(el));
window.addEventListener('pagehide',event=>{
 cancelAnimationFrame(frame);frame=0;cancelReveals();
 if(!event.persisted){lifecycle.abort();resize.disconnect();visibility.disconnect();intro.disconnect();reveals.disconnect();}
},options);
window.addEventListener('pageshow',()=>{draw();scrollTarget();},options);
draw();scrollTarget();
})();
