import {readingProgress} from './preference-state.js';
// Collapse navigation before the full row becomes crowded.
(() => {
 const header = document.querySelector('.ki-nav');
 const button = header.querySelector('.nav-toggle');
 const nav = header.querySelector('nav');
 const compact = matchMedia('(max-width: 1340px)');
 function close(restore = false) {
   button.setAttribute('aria-expanded', 'false');
   nav.hidden = compact.matches;
   if (restore) button.focus();
 }
 function resize() { button.hidden = !compact.matches; close(); }
 button.addEventListener('click', () => {
   const open = button.getAttribute('aria-expanded') !== 'true';
   button.setAttribute('aria-expanded', String(open)); nav.hidden = !open;
 });
 nav.addEventListener('click', event => { if (event.target.closest('a')) close(true); });
 document.addEventListener('keydown', event => { if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') { event.preventDefault(); close(true); } });
 compact.addEventListener('change', resize);
 resize();
})();

// One scheduled update per frame, including document and viewport resizing.
(() => {
 const header = document.querySelector('.ki-nav');
 const progress = header.querySelector('.reading-progress span');
 const links = [...header.querySelectorAll('nav a[href^="#"]')];
 const sections = links.map(link => document.querySelector(link.getAttribute('href')));
 let frame = 0;
 function update() {
   frame = 0;
   const height = header.getBoundingClientRect().height;
   document.documentElement.style.setProperty('--header-height', `${height}px`);
   const value = readingProgress(window.scrollY, document.documentElement.scrollHeight, window.innerHeight);
   progress.style.transform = `scaleX(${value})`;
   let active = -1;
   sections.forEach((section, i) => { if (section && section.getBoundingClientRect().top <= height + 30) active = i; });
   if (value === 1) active = sections.length - 1;
   links.forEach((link, i) => { if (i === active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
 }
 function schedule() { if (!frame) frame = requestAnimationFrame(update); }
 window.addEventListener('scroll', schedule, {passive:true});
 window.addEventListener('resize', schedule);
 new ResizeObserver(schedule).observe(document.body);
 new ResizeObserver(schedule).observe(header);
 document.fonts?.ready.then(schedule);
 schedule();
})();
