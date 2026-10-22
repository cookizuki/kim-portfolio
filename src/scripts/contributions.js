import { nextIndex, swipeStep } from './carousel-state.js';
const root = document.querySelector('.contribution-carousel');
if (root) {
  const slides = [...root.querySelectorAll('.contribution-slide')];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, effects = [], touch;
  const settle = () => {effects.forEach(a=>a.cancel()); effects=[]; slides.forEach(s=>s.removeAttribute('data-leaving'));};
  function show(next, direction=1) {
    settle();
    const old=slides[index]; index=next;
    slides.forEach((slide,i)=>{slide.inert=i!==index;slide.setAttribute('aria-hidden',String(i!==index));});
    root.querySelector('[data-role-count]').textContent=`${String(index+1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;
    if(old!==slides[index]&&!motion.matches&&!document.hidden) {
      old.setAttribute('data-leaving','');
      effects=[old.animate([{transform:'translateX(0)',opacity:1},{transform:`translateX(${-direction*90}%)`,opacity:0}],{duration:550,easing:'cubic-bezier(.22,1,.36,1)'}),slides[index].animate([{transform:`translateX(${direction*90}%)`,opacity:0},{transform:'translateX(0)',opacity:1}],{duration:650,easing:'cubic-bezier(.22,1,.36,1)'})];
      const current=effects;Promise.all(current.map(a=>a.finished)).then(()=>{if(effects===current)settle();}).catch(()=>{});
    }
  }
  const move = step=>show(nextIndex(index,step,slides.length),step);
  show(0);root.dataset.ready='true';root.querySelector('.contribution-controls').hidden=false;
  root.querySelectorAll('[data-role-step]').forEach(b=>b.addEventListener('click',()=>move(Number(b.dataset.roleStep))));
  root.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}});
  root.addEventListener('touchstart',e=>{touch=e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;},{passive:true});
  root.addEventListener('touchend',e=>{if(!touch)return;const t=e.changedTouches[0],step=swipeStep(t.clientX-touch.x,t.clientY-touch.y);touch=null;if(step)move(step);},{passive:true});
  root.addEventListener('touchcancel',()=>{touch=null;});
  motion.addEventListener('change',settle);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)settle();});
}
