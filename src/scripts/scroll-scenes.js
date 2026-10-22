// One scheduled frame per scroll/resize. Native scrolling remains fully available.
const scenes = [...document.querySelectorAll('[data-scroll-scene]')];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const compact = matchMedia('(max-height: 700px)');
const clamp = x => Math.max(0,Math.min(1,x));
const mix = (a,b,t) => a+(b-a)*t;
let frame = 0;
function render() {
  frame=0;
  if (document.querySelector('dialog[open]')) return;
  for (const scene of scenes) {
    const stage=scene.querySelector('.scene-stage');
    const enabled=!reduced.matches&&!compact.matches;
    scene.toggleAttribute('data-scroll-ready',enabled);
    const rect=scene.getBoundingClientRect();
    const top=parseFloat(getComputedStyle(stage).top)||0;
    const distance=Math.max(1,scene.offsetHeight-stage.offsetHeight);
    const progress=clamp((top-rect.top)/distance);
    scene.dataset.progress=String(progress);
    if(scene.dataset.scrollScene==='about') {
      const title=scene.querySelector('.about-title'),panel=scene.querySelector('.about-reveal'),background=scene.querySelector('.about-background');
      const reveal=enabled?clamp((progress-.18)/.5):1;
      title.style.opacity=enabled?String(1-clamp(progress/.35)): '1';
      title.style.transform=enabled?`translateY(${-progress*80}px)`:'none';
      panel.style.opacity=String(reveal);
      panel.style.clipPath=`inset(${(1-reveal)*100}% 0 0)`;
      panel.style.transform=`translateY(${(1-reveal)*50}px)`;
      panel.inert=enabled&&reveal<.15;
      background.style.transform=enabled?`scale(${1.1-progress*.1})`:'none';
      background.style.opacity=String(enabled?1-reveal*.65:.35);
    }
    if(scene.dataset.scrollScene==='experience') scene.dispatchEvent(new CustomEvent('scene:progress',{detail:{progress,enabled}}));
    if(scene.dataset.scrollScene==='work') {
      const orbit=scene.querySelector('.project-orbit'),cards=[...scene.querySelectorAll('[data-project-select]')];
      const title=scene.querySelector('.orbit-title');
      if(!enabled) {
        cards.forEach(c=>{c.style.transform='';c.style.width='';c.style.opacity='';c.style.zIndex='';});title.style.opacity='1';
        scene.querySelector('.project-selectors').style.borderColor='';
        continue;
      }
      const w=orbit.clientWidth,h=orbit.clientHeight;
      const small=w<700, radius=Math.min(w*(small?.29:.25),h*.29,230);
      const initial=Math.min(small?140:240,w*.32);
      const large=Math.min(w*.82,(h-150)*1.35,780);
      const unfold=clamp((progress-.12)/.2);
      const position=clamp((progress-.35)/.58)*(cards.length-1);
      title.style.opacity=String(1-clamp(progress/.18));
      scene.querySelector('.project-selectors').style.borderColor=progress>.25?'transparent':'';
      cards.forEach((card,i)=>{
        const angle=(i/cards.length*Math.PI*2-Math.PI/2)+progress*.8;
        const x=mix(Math.cos(angle)*radius,(i-position)*(large+100),unfold);
        const y=mix(Math.sin(angle)*radius,0,unfold);
        const width=mix(initial,large,unfold);
        card.style.width=`${width}px`;
        card.style.transform=`translate(-50%,-50%) translate(${x}px,${y}px) rotate(${mix(-6,0,unfold)}deg)`;
        card.style.opacity=String(mix(1,Math.abs(i-position)>1?.15:1,unfold));
        card.style.zIndex=String(10-Math.round(Math.abs(i-position)));
      });
      const selected=cards[Math.round(position)];
      scene.querySelector('[data-work-caption]').textContent=progress<.25?'Click any project to open full screen ↗':`${Math.round(position)+1} / ${cards.length} · ${selected?.dataset.projectName || ''} · Click to expand ↗`;
    }
  }
}
function schedule(){if(!frame)frame=requestAnimationFrame(render);}
window.addEventListener('scroll',schedule,{passive:true});
window.addEventListener('resize',schedule,{passive:true});
reduced.addEventListener('change',schedule);compact.addEventListener('change',schedule);
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else schedule();});
document.addEventListener('portfolio:modal-close',schedule);
scenes.forEach(scene=>scene.addEventListener('scene:seek',e=>{
  if(!scene.hasAttribute('data-scroll-ready'))return;
  const stage=scene.querySelector('.scene-stage'),top=parseFloat(getComputedStyle(stage).top)||0;
  const start=scrollY+scene.getBoundingClientRect().top-top;
  window.scrollTo({top:start+clamp(e.detail.progress)*(scene.offsetHeight-stage.offsetHeight),behavior:'instant'});
  schedule();
}));
document.querySelectorAll('[data-project-select]').forEach((card,i,all)=>card.addEventListener('focus',()=>{
  if(card.closest('.project-carousel')?.dataset.restoring)return;
  const scene=card.closest('[data-scroll-scene]');
  if(card.matches(':focus-visible')&&scene?.hasAttribute('data-scroll-ready')) scene.dispatchEvent(new CustomEvent('scene:seek',{detail:{progress:.35+.58*i/Math.max(1,all.length-1)}}));
}));
const resize=new ResizeObserver(schedule);scenes.forEach(s=>resize.observe(s.querySelector('.scene-stage')));
schedule();
