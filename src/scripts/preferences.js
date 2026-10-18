import './interaction-sounds.js';
﻿import {resolveTheme, revealRadius} from './preference-state.js';
const html = document.documentElement;
const themeButton = document.querySelector('#theme-toggle');
const soundButton = document.querySelector('#sound-toggle');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const system = matchMedia('(prefers-color-scheme: dark)');
const read = key => {try {return localStorage.getItem(key);} catch {return null;}};
const save = (key, value) => {try {localStorage.setItem(key, value);} catch {}};
let preference = read('kim-theme'), transition, reveal, switching = false;
function applyTheme(theme) {
  html.dataset.theme = theme;
  html.style.colorScheme = theme;
  themeButton.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0b0b0d' : '#f5f4ef');
  document.dispatchEvent(new Event('portfolio:theme'));
}
applyTheme(resolveTheme(preference, system.matches));
themeButton.hidden = soundButton.hidden = false;
themeButton.addEventListener('click', async () => {
  if (switching) return;
  preference = html.dataset.theme === 'dark' ? 'light' : 'dark';
  save('kim-theme', preference);
  const apply = () => applyTheme(preference);
  if (!document.startViewTransition || reduced.matches || document.querySelector('.ki-skip:not([hidden])')) {apply(); return;}
  switching = true;
  try {
    const rect = themeButton.getBoundingClientRect(), x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
    transition = document.startViewTransition(apply);
    await transition.ready;
    if (!reduced.matches) {
      reveal = html.animate({clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${revealRadius(x,y,innerWidth,innerHeight)}px at ${x}px ${y}px)`]}, {duration: 450, easing: 'ease-out', pseudoElement: '::view-transition-new(root)'});
      await reveal.finished;
    }
    await transition.finished;
  } catch {apply(); transition?.skipTransition();}
  finally {switching = false; transition = null; reveal = null;}
});
reduced.addEventListener('change', () => {if (reduced.matches) {reveal?.cancel(); transition?.skipTransition();}});
system.addEventListener('change', () => {if (preference !== 'light' && preference !== 'dark') applyTheme(resolveTheme(null, system.matches));});

