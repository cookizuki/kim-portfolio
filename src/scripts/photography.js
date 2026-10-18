import {createImageViewer} from './image-viewer.js';
﻿// Uses the same native dialog, contain layout, and focus pattern as project viewers.
// The collection is scoped to Creative; it never changes the project carousel.
export function initPhotography(root, doc = document, win = window) {
  const openers = [...root.querySelectorAll('.photo-open')];
  const dialog = root.querySelector('dialog');
  const viewer = createImageViewer(dialog);
  const close = dialog.querySelector('.viewer-close');
  let index = 0, opener, restoreScroll, opening;
  const reduced = win.matchMedia?.('(prefers-reduced-motion: reduce)');
  reduced?.addEventListener('change', () => {if(reduced.matches)opening?.cancel();});
  doc.addEventListener?.('visibilitychange', () => {if(doc.hidden)opening?.cancel();});
  function render() {
    viewer.show(openers[index].querySelector('img'), `${index + 1} / ${openers.length} - ${openers[index].dataset.title}`);
    viewer.preload([-1, 1].map(step => openers[(index + step + openers.length) % openers.length].querySelector('img')));
  }
  function move(step) {index = (index + step + openers.length) % openers.length; render();}
  function lockScroll() {
    const body = doc.body, html = doc.documentElement;
    const x = win.scrollX, y = win.scrollY;
    const properties = ['position', 'top', 'left', 'right', 'width', 'overflow', 'paddingRight'];
    const previous = Object.fromEntries(properties.map(key => [key, body.style[key]]));
    const overflow = html.style.overflow;
    const gutter = Math.max(0, win.innerWidth - html.clientWidth);
    const padding = parseFloat(win.getComputedStyle(body).paddingRight) || 0;
    Object.assign(body.style, {position:'fixed', top:`-${y}px`, left:'0', right:'0', width:'100%', overflow:'hidden', paddingRight:`${padding + gutter}px`});
    html.style.overflow = 'hidden';
    return () => {
      Object.assign(body.style, previous); html.style.overflow = overflow;
      win.scrollTo({left:x, top:y, behavior:'instant'});
    };
  }
  openers.forEach((button, i) => button.addEventListener('click', () => {
    index = i; opener = button; render();
    dialog.showModal(); restoreScroll = lockScroll(); close.focus();
    opening?.cancel();
    if (reduced && !reduced.matches && !doc.hidden) opening = dialog.animate([{opacity:0,transform:'scale(.975)'},{opacity:1,transform:'scale(1)'}],{duration:220,easing:'ease-out'});
  }));
  close.addEventListener('click', () => dialog.close());
  dialog.querySelectorAll('[data-photo-step]').forEach(button => button.addEventListener('click', () => move(Number(button.dataset.photoStep))));
  dialog.addEventListener('close', () => {viewer.cancel(); opening?.cancel(); restoreScroll?.(); restoreScroll = null; opener?.focus({preventScroll:true});});
  dialog.addEventListener('keydown', event => {
    event.stopPropagation();
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1);}
    if (event.key === 'Tab') {
      const buttons = [...dialog.querySelectorAll('button')];
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && doc.activeElement === first) {event.preventDefault(); last.focus();}
      else if (!event.shiftKey && doc.activeElement === last) {event.preventDefault(); first.focus();}
    }
    // Native dialog cancel handles Escape without overriding browser behavior.
  });
}
if (typeof document !== 'undefined') {
  const root = document.querySelector('#ke-creative');
  if (root) initPhotography(root);
}
