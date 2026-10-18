// Runs synchronously after theme selection, before the body is parsed.
(() => {
  const html = document.documentElement;
  let seen = false;
  try { seen = sessionStorage.getItem('kim-intro-seen') === '1'; } catch {}
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const state = window.kimIntro = {pending: !seen && !location.hash && !motion.matches};
  let deadline;
  state.release = () => {
    state.pending = false;
    clearTimeout(deadline);
    delete html.dataset.intro;
    document.querySelectorAll('[data-intro-inert]').forEach(node => {
      node.inert = false; node.removeAttribute('data-intro-inert');
    });
  };
  if (!state.pending) return;
  html.dataset.intro = 'pending';
  // A recovery deadline, not a delay before showing or starting the intro.
  deadline = setTimeout(() => { state.cancel?.(); state.release(); }, 6000);
  document.addEventListener('click', event => {
    if (html.dataset.intro && event.target.closest('.ki-skip')) {
      state.cancel?.(); state.release();
      try { sessionStorage.setItem('kim-intro-seen', '1'); } catch {}
    }
  });
  window.addEventListener('hashchange', () => {state.cancel?.(); state.release();});
  motion.addEventListener('change', () => {
    if (motion.matches) {state.cancel?.(); state.release();}
  });
})();
