export const SOUND_URLS = {
  click: '/sounds/thock-click.wav',
  switch: '/sounds/thock-switch.wav',
  soft: '/sounds/thock-soft.wav',
};

// One playback owner. HTMLAudio.play() is invoked synchronously inside the gesture;
// no suspended AudioContext or asynchronous fetch/decode can consume activation.
export function createSoundPlayer({AudioClass, now = () => performance.now(), report = () => {}}) {
  const clips = new Map();
  let enabled = false, unlocked = false, active, epoch = 0;
  let lastClick = -Infinity, lastHover = -Infinity;
  function stop() {
    epoch++;
    if (active) {active.pause(); active.currentTime = 0; active = null;}
  }
  return {
    setEnabled(value) {enabled = value; if (!enabled) stop();},
    stop,
    play(kind = 'click', {hover = false, confirmation = false} = {}) {
      if (!enabled || !AudioClass || (hover && !unlocked)) return;
      const time = now();
      if (hover ? time - Math.max(lastHover, lastClick) < 180 : !confirmation && time - lastClick < 80) return;
      if (hover) lastHover = time; else lastClick = time;
      stop();
      const token = epoch, url = SOUND_URLS[kind];
      try {
        let clip = clips.get(kind);
        if (!clip) {
          clip = new AudioClass(url); clip.preload = 'auto';
          clip.addEventListener('error', () => report(`Could not load ${url}`, clip.error));
          clips.set(kind, clip);
        }
        active = clip; clip.volume = hover ? .12 : .35; clip.currentTime = 0;
        const playback = clip.play();
        Promise.resolve(playback).then(() => {
          if (token === epoch && enabled) unlocked = true;
        }).catch(error => {
          if (token !== epoch) return; // Expected cancellation after mute or replacement.
          stop(); report(`Playback failed for ${url}. Check the asset request and browser audio permissions.`, error);
        });
      } catch (error) {stop(); report(`Unable to play ${url}`, error);}
    }
  };
}

export function soundForControl(control) {
  if (control.matches('#theme-toggle, [data-project-step], [data-project-select]')) return 'switch';
  if (control.matches('[data-image-select], [data-viewer-select], .viewer-close')) return 'soft';
  return 'click';
}

export function initInteractionSounds(doc, {AudioClass, finePointer, storage, report, now} = {}) {
  const toggle = doc.querySelector('#sound-toggle');
  if (!toggle) return;
  const player = createSoundPlayer({AudioClass, now, report});
  let enabled = false;
  try {enabled = storage.getItem('kim-sound') === 'on';} catch {}
  function sync() {
    player.setEnabled(enabled);
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.setAttribute('aria-label', enabled ? 'Mute interaction sounds' : 'Enable interaction sounds');
  }
  sync(); toggle.hidden = false;
  const selector = 'button, a[href], summary, [role="button"]';
  const controlFor = target => target?.closest?.(selector);
  const usable = control => control && !control.disabled && control.getAttribute('aria-disabled') !== 'true' && !control.closest('[inert]');
  doc.addEventListener('click', event => {
    if (!event.isTrusted || event.defaultPrevented) return;
    const control = controlFor(event.target);
    if (!usable(control)) return;
    if (control === toggle) {
      enabled = !enabled;
      try {storage.setItem('kim-sound', enabled ? 'on' : 'off');} catch {}
      sync();
      if (enabled) player.play('click', {confirmation: true});
      return;
    }
    player.play(soundForControl(control));
  });
  doc.addEventListener('pointerover', event => {
    if (!event.isTrusted || event.pointerType !== 'mouse' || !finePointer.matches) return;
    const control = controlFor(event.target);
    // Ignore moving between icon/text descendants of the same control.
    if (!usable(control) || control.contains(event.relatedTarget)) return;
    player.play('soft', {hover: true});
  });
  doc.addEventListener('keydown', event => {
    if (!event.isTrusted || event.repeat) return;
    if (event.key === 'Escape' && doc.querySelector('dialog[open]')) player.play('soft');
    else if (['ArrowLeft','ArrowRight','Home','End'].includes(event.key) && event.target.closest('.project-carousel') && !event.target.closest('dialog')) player.play('switch');
  }, true);
  doc.addEventListener('portfolio:project-swipe', () => player.play('switch'));
  doc.addEventListener('visibilitychange', () => {if (doc.hidden) player.stop();});
  return player;
}

if (typeof document !== 'undefined') {
  let storage;
  try {storage = window.localStorage;} catch {}
  initInteractionSounds(document, {
    AudioClass: window.Audio,
    finePointer: matchMedia('(any-hover: hover) and (any-pointer: fine)'),
    storage,
    report: (message, error) => {if (import.meta.env.DEV) console.warn(`[Portfolio sound] ${message}`, error);},
  });
}
