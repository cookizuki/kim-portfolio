import { nextIndex, swipeStep } from './carousel-state.js';
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll('.project-carousel').forEach(root => {
  const slides = [...root.querySelectorAll('.project-slide')];
  const selectors = [...root.querySelectorAll('[data-project-select]')];
  const surface = root.querySelector('.project-viewport');
  const orbit = root.querySelector('.project-orbit');
  const back = root.querySelector('.orbit-back');
  const modal=root.querySelector('.project-fullscreen');
  let opener, scrollLock;
  if (orbit && back) {
    root.dataset.overview = 'true';
    back.addEventListener('click', () => {
      if(modal?.open) modal.close();
      else restoreOverview();
    });
  }
  function restoreOverview() {
    settle(); delete root.dataset.detail; root.dataset.overview='true'; back.hidden=true;
    selectors.forEach(b=>b.setAttribute('aria-pressed','false'));
    if(scrollLock) {
      document.documentElement.style.overflow=scrollLock.html;
      document.body.style.overflow=scrollLock.body;
      window.scrollTo({top:scrollLock.y,behavior:'instant'});scrollLock=null;
    }
    root.dataset.restoring='true';
    (opener || selectors[index])?.focus({preventScroll:true});
    delete root.dataset.restoring;
    document.dispatchEvent(new Event('portfolio:modal-close'));
  }
  if(modal) {
    modal.addEventListener('close',restoreOverview);
    modal.addEventListener('keydown',event=>{
      if(event.target.closest('.screenshot-viewer'))return;
      event.stopPropagation();
      if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();move(event.key==='ArrowRight'?1:-1);}
    });
  }
  function openDetail() {
    if (!orbit || !back) return;
    opener=selectors[index];
    delete root.dataset.overview; root.dataset.detail='true'; back.hidden=false;
    selectors.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
    if(modal&&!modal.open) {
      scrollLock={html:document.documentElement.style.overflow,body:document.body.style.overflow,y:scrollY};
      document.documentElement.style.overflow='hidden';document.body.style.overflow='hidden';
      modal.showModal();modal.scrollTop=0;
    }
    back.focus({preventScroll:true});
  }
  let index = 0, animations = [], run = 0, touch, suppressClick = false;
  function settle() {
    run++;
    animations.forEach(a => a.cancel()); animations = [];
    slides.forEach(slide => {delete slide.dataset.departing;});
    delete root.dataset.moving;
  }
  function prepare(target) {
    for(const offset of [0, 1, -1]) {
      slides[nextIndex(target, offset, slides.length)]?.querySelectorAll('img').forEach(img => {
        img.loading = 'eager'; img.decode?.().catch(() => {});
      });
    }
  }
  function select(target, direction = target > index ? 1 : -1) {
    if (!slides.length || target === index) return;
    const outgoing = slides[index];
    const previousTransform = getComputedStyle(outgoing).transform;
    const returningTransform = slides[target].dataset.departing === 'true' ? getComputedStyle(slides[target]).transform : null;
    settle();
    if (outgoing.contains(document.activeElement)) (modal?.open ? modal : root).focus({preventScroll: true});
    index = target; prepare(index);
    slides.forEach((slide, i) => {
      slide.inert = i !== index;
      slide.setAttribute('aria-hidden', String(i !== index));
      slide.dataset.peek = String(slides.length > 1 && i === nextIndex(index, 1, slides.length));
    });
    selectors.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    root.querySelector('.project-counter').textContent = `PROJECT ${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    if (!reduced.matches && !document.hidden) {
      const token = run;
      outgoing.dataset.departing = 'true'; root.dataset.moving = 'true';
      animations = [
        outgoing.animate([{transform:previousTransform,opacity:1},{transform:`translateX(${-direction*105}%) scale(.98)`,opacity:.4}],{duration:420,easing:'cubic-bezier(.22,.7,.2,1)'}),
        slides[index].animate([{transform:returningTransform || `translateX(${direction*105}%) scale(.98)`,opacity:.5},{transform:'translateX(0) scale(1)',opacity:1}],{duration:420,easing:'cubic-bezier(.22,.7,.2,1)'})
      ];
      Promise.all(animations.map(a=>a.finished)).then(()=>{if(run===token)settle();}).catch(()=>{});
    }
  }
  function move(step) { select(nextIndex(index, step, slides.length), step); }
  // Preload adjacent screenshots only as Selected Work approaches the viewport.
  if (typeof IntersectionObserver !== 'undefined') {
    const observer = new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){prepare(index);observer.disconnect();}},{rootMargin:'300px'});
    observer.observe(root);
  }
  root.querySelectorAll('[data-project-step]').forEach(button => button.addEventListener('click', () => move(Number(button.dataset.projectStep))));
  selectors.forEach((button, i) => button.addEventListener('click', () => {select(i); openDetail();}));
  root.addEventListener('keydown', event => {
    if (root.dataset.overview || event.target.closest('dialog, input, textarea, select')) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1); }
    if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); select(event.key === 'Home' ? 0 : slides.length - 1); }
  });
  surface.addEventListener('touchstart', event => {
    suppressClick = false;
    if (event.target.closest('dialog') || event.touches.length !== 1) { touch = null; return; }
    const t = event.touches[0]; touch = {x: t.clientX, y: t.clientY};
  }, {passive: true});
  surface.addEventListener('touchend', event => {
    if (!touch) return;
    const t = event.changedTouches[0], step = swipeStep(t.clientX - touch.x, t.clientY - touch.y);
    touch = null;
    if (step) { suppressClick = true; move(step); if (event.isTrusted) document.dispatchEvent(new Event('portfolio:project-swipe')); }
  }, {passive: true});
  surface.addEventListener('touchcancel', () => { touch = null; });
  surface.addEventListener('click', event => {
    if (suppressClick) { suppressClick = false; event.preventDefault(); event.stopPropagation(); }
  }, true);
  document.addEventListener('visibilitychange', () => {if(document.hidden)settle();});
  reduced.addEventListener('change', () => { if (reduced.matches) settle(); });
});
