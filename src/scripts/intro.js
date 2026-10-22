import { portraitFlight } from './portrait-flight.js';
// The head bootstrap owns the pre-paint state and independent recovery deadline.
(() => {
  const root = document.getElementById('kim-portfolio');
  if (!root) return;
  const stage = root.querySelector('.ki-stage');
  const portrait = root.querySelector('.ki-portrait');
  const name = root.querySelector('.ki-name');
  const surname = name?.querySelector('span');
  const site = root.querySelector('.ke-site');
  const nav = root.querySelector('.ki-nav');
  const description = root.querySelector('.ki-description');
  const mark = document.querySelector('.ki-intro-mark');
  const skip = document.querySelector('.ki-skip');
  const play = root.querySelector('#ki-play');
  const status = document.querySelector('#ki-status');
  if (![stage, portrait, name, surname, site, nav, description, mark, skip, play, status].every(Boolean)) return;

  const bootstrap = window.kimIntro;
  if (bootstrap) bootstrap.cancel = () => finish();
  const supports = [root.querySelector('.ki-nav'), ...root.querySelectorAll('.ki-support')].filter(Boolean);
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sessionKey = 'kim-intro-seen';
  let cancelFlight = () => {};
  let animations = [], timer, running = false, ownsInert = false;

  function finish(message = 'Landing page ready') {
    const restoreFocus = document.activeElement === skip;
    const completed = running && !message.includes('unavailable');
    running = false;
    cancelFlight();
    bootstrap?.release();
    if (document.documentElement) delete document.documentElement.dataset.intro;
    if (ownsInert) {root.inert = false; root.removeAttribute('data-intro-inert'); ownsInert = false;}
    if (completed) {try { sessionStorage.setItem(sessionKey, '1'); } catch {}}
    clearTimeout(timer);
    animations.forEach(animation => animation.cancel());
    animations = [];
    mark.style.visibility = 'hidden';
    skip.hidden = true;
    status.textContent = message;
    // The bootstrap releases the overlay, scroll lock and page inert state together.
    if (restoreFocus) root.querySelector('.hero-primary')?.focus({preventScroll: true});
  }

  function animate(element, frames, options) {
    animations.push(element.animate(frames, {fill: 'both', ...options}));
  }

  function start() {
    finish();
    if (motion.matches) { finish('Reduced motion: landing page shown immediately'); return; }
    if (typeof stage.animate !== 'function') { finish('Landing page ready: animation unavailable'); return; }
    running = true;
    if (document.documentElement) document.documentElement.dataset.intro = 'pending';
    skip.hidden = false;
    mark.style.visibility = 'visible';
    status.textContent = 'Playing intro';
    // Install the cleanup deadline before creating any effects.
    timer = setTimeout(() => finish(), 3100);
    try {
      if (!root.inert) {ownsInert = true; root.inert = true; root.setAttribute('data-intro-inert', '');}
      const ease = 'cubic-bezier(.22,1,.36,1)';
      const background = getComputedStyle(site).backgroundColor;
      const ink = getComputedStyle(name).color;
      const stroke = getComputedStyle(surname).webkitTextStrokeColor;
      const epoch = document.timeline?.currentTime;

      // 0-.4: a legible mark. .4-.7: crossfade into the portrait reveal.
      animate(mark, [{opacity:1, transform:'none'}, {opacity:0, transform:'translateY(-8px)'}],
        {delay:400, duration:300, easing:'ease-in-out'});

      // Draw actual image tiles through the scatter and reassembly, then hand
      // back to the unchanged, responsive portrait element.
      animate(portrait, [{opacity:0}, {opacity:1}], {delay:2400,duration:250});
      cancelFlight = portraitFlight(portrait.querySelector('img'), document.querySelector('.intro-overlay'));

      // 1-1.9: typography arrives DURING portrait travel, preserving solid/outline styling.
      animate(name, [{opacity:0, clipPath:'inset(0 100% 0 0)', transform:'translateY(14px)'},
        {opacity:1, clipPath:'inset(0 0% 0 0)', transform:'translateY(0)'}],
        {delay:1000, duration:850, easing:ease});
      animate(name, [{color:'#fff'}, {color:ink}], {delay:1700,duration:600});
      animate(surname, [{webkitTextStrokeColor:'#fff'}, {webkitTextStrokeColor:stroke}], {delay:1700,duration:600});
      [site, document.documentElement, document.body].forEach(surface => {
        if (surface?.animate) animate(surface, [{backgroundColor:'#0b0b0d'}, {backgroundColor:background}], {delay:1700,duration:600});
      });
      animate(nav, [{backgroundColor:'#0b0b0d'}, {backgroundColor:getComputedStyle(nav).backgroundColor}], {delay:1700,duration:600});
      const enter = (element, delay) => {
        if (element) animate(element, [{opacity:0,transform:'translateY(10px)'}, {opacity:1,transform:'translateY(0)'}],
          {delay,duration:350,easing:ease});
      };
      // Only leaf groups animate: no fading parent multiplies their opacity.
      [...description.children].forEach((element, index) => enter(element, 1700 + index * 75));
      enter(nav, 1900);
      enter(root.querySelector('.hero-scroll'), 1980);
      enter(root.querySelector('.kl-object'), 2100);
      // All effects share one clock. The deadline also recovers if finished never resolves.
      if (typeof epoch === 'number') animations.forEach(animation => {animation.startTime = epoch;});
      if (document.documentElement) document.documentElement.dataset.intro = 'running';
      skip.focus({preventScroll: true});
    } catch {
      finish('Landing page ready: animation unavailable');
    }
  }

  play.hidden = false;
  play.addEventListener('click', () => {
    stage.scrollIntoView({behavior: 'instant', block: 'start'});
    start();
  });
  skip.addEventListener('click', () => {
    finish('Intro skipped: landing page ready');
    root.querySelector('.hero-primary')?.focus({preventScroll: true});
  });
  motion.addEventListener('change', () => {
    if (motion.matches) finish('Reduced motion: landing page shown immediately');
  });
  // Follow anchors normally, including links used while the intro is playing.
  document.addEventListener('click', event => {
    if (running && event.target.closest('a[href^="#"]')) finish();
  });
  window.addEventListener('hashchange', () => { if (running) finish(); });
  window.addEventListener('pagehide', () => finish());
  // A resize invalidates measured travel. Settle immediately into the new layout.
  window.addEventListener('resize', () => {if (running) finish('Landing page ready: viewport resized');});
  // Never leave keyboard focus on an invisible, animating control.
  root.addEventListener('focusin', event => {
    if (running && supports.some(element => element.contains(event.target))) finish();
  });

  let seen = false;
  try { seen = sessionStorage.getItem(sessionKey) === '1'; } catch { /* Storage is optional. */ }
  if (location.hash) finish('Section navigation: intro skipped');
  else if (motion.matches) finish('Reduced motion: landing page shown immediately');
  else if (seen || (bootstrap && !bootstrap.pending)) finish('Intro already played this session. Use Replay intro in the footer.');
  else start();
})();
