// One scheduled frame per scroll/resize. Native scrolling remains fully available.
const scenes = [...document.querySelectorAll('[data-scroll-scene]')];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = x => Math.max(0,Math.min(1,x));
const mix = (a,b,t) => a+(b-a)*t;
let frame = 0;
function render() {
  frame=0;
  if (document.querySelector('dialog[open]')) return;
  for (const scene of scenes) {
    const stage=scene.querySelector('.scene-stage');
    const enabled=!reduced.matches;
    scene.toggleAttribute('data-scroll-ready',enabled);
    const rect=scene.getBoundingClientRect();
    const top=parseFloat(getComputedStyle(stage).top)||0;
    const distance=Math.max(1,scene.offsetHeight-stage.offsetHeight);
    const progress=clamp((top-rect.top)/distance);
    scene.dataset.progress=String(progress);
    if(scene.dataset.scrollScene==='about') {
      const title=scene.querySelector('.about-title'),panel=scene.querySelector('.about-reveal'),background=scene.querySelector('.about-background');
      // First reveal the entire scene through an opening iris, then hold the
      // centered title before moving into the restored portrait composition.
      const entrance=clamp(progress/.28);
      const reveal=enabled?clamp((progress-.57)/.27):1;
      title.style.opacity=enabled?String(clamp(entrance*2)*(1-clamp((progress-.48)/.15))):'1';
      title.style.clipPath=enabled?`inset(${(1-entrance)*50}% 0 ${(1-entrance)*50}% 0)`:'none';
      title.style.transform=enabled?`scale(${mix(.82,1.15,clamp(progress/.65))})`:'none';
      panel.style.opacity=String(reveal);
      panel.style.clipPath=`inset(${(1-reveal)*100}% 0 0)`;
      panel.style.transform=`translateY(${(1-reveal)*80}px)`;
      panel.inert=enabled&&reveal<.15;
      background.style.clipPath=enabled?`circle(${mix(6,85,entrance)}% at 50% 50%)`:'none';
      background.style.transform=enabled?`scale(${mix(1.45,1,clamp(progress/.65))}) translateY(${-progress*25}px)`:'none';
      background.style.opacity=String(enabled?1-reveal*.7:.35);
      scene.querySelector('.about-restored-portrait').style.transform=`rotate(${mix(-12,-3,reveal)}deg) scale(${mix(.85,1,reveal)})`;
    }
    if(scene.dataset.scrollScene==='experience') scene.dispatchEvent(new CustomEvent('scene:progress',{detail:{progress,enabled}}));
    if(scene.dataset.scrollScene==='work') {
      const orbit=scene.querySelector('.project-orbit'),cards=[...scene.querySelectorAll('[data-project-select]')];
      const title=scene.querySelector('.orbit-title');
      if(!enabled) {
        cards.forEach(c=>{c.style.transform='';c.style.width='';c.style.opacity='';c.style.zIndex='';c.style.scale='';c.style.removeProperty('--card-caption-size');});title.style.opacity='1';title.style.transform='';
        scene.querySelector('.project-selectors').style.borderColor='';
        continue;
      }
      const w=orbit.clientWidth,h=orbit.clientHeight;
      const small=w<700;
      const radius=Math.min(w*(small?.28:.32),h*.31,300);
      const initial=Math.min(small?125:230,w*.38,h*.36);
      const large=Math.min(w*.86,(h-115)*1.38,900);
      // A sustained half-turn makes the circular gallery unmistakable.
      // The circle then opens into a vertical sequence of individual previews.
      const unfold=clamp((progress-.38)/.16);
      const position=clamp((progress-.56)/.4)*(cards.length-1);
      title.style.opacity=String(1-clamp((progress-.35)/.12));
      title.style.transform=`scale(${1-progress*.35})`;
      const ring=scene.querySelector('.project-selectors');
      ring.style.borderColor='transparent';
      cards.forEach((card,i)=>{
        const angle=i/cards.length*Math.PI*2-Math.PI/2+clamp(progress/.4)*Math.PI;
        const x=mix(Math.cos(angle)*radius,0,unfold);
        const y=mix(Math.sin(angle)*radius,(i-position)*(h*.95),unfold);
        const width=mix(initial,large,unfold);
        card.style.width=`${width}px`;
        card.style.scale="1";
        card.style.setProperty("--card-caption-size",`${mix(small?9:11,small?12:16,unfold)}px`);
        card.style.transform=`translate(-50%,-50%) translate(${x}px,${y}px) rotate(${mix(Math.sin(angle)*15,0,unfold)}deg) scale(${mix(1,Math.max(.82,1-Math.abs(i-position)*.12),unfold)})`;
        card.style.opacity=String(mix(1,Math.max(0,1-Math.abs(i-position)*.8),unfold));
        card.style.zIndex=String(10-Math.round(Math.abs(i-position)));
      });
      const selected=cards[Math.round(position)];
      scene.querySelector('[data-work-caption]').textContent=progress<.45?'Scroll through the circle · Click to expand ↗':`${Math.round(position)+1} / ${cards.length} · ${selected?.dataset.projectName || ''} · Click to expand ↗`;

    }
  }
}
function schedule(){if(!frame)frame=requestAnimationFrame(render);}
window.addEventListener('scroll',schedule,{passive:true});
window.addEventListener('resize',schedule,{passive:true});
reduced.addEventListener('change',schedule);
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
  if(card.matches(':focus-visible')&&scene?.hasAttribute('data-scroll-ready')) scene.dispatchEvent(new CustomEvent('scene:seek',{detail:{progress:.56+.4*i/Math.max(1,all.length-1)}}));
}));
const resize=new ResizeObserver(schedule);scenes.forEach(s=>resize.observe(s.querySelector('.scene-stage')));
schedule();
