import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../src/scripts/intro.js', import.meta.url), 'utf8').replace(/^import .*;\n/, '');
function setup({storage = new Map(), hash = '', reduced = false, failAnimation = false, storageBlocked = false, animationAvailable = true, width = 1200, height = 800} = {}) {
  const effects = [], timers = new Map(), flights = [];
  let timerId = 0;
  const document = {activeElement: null, documentElement:{dataset:{}}, timeline:{currentTime:4200}};
  class Element {
    constructor() {this.style = {}; this.hidden = false; this.listeners = {}; this.children = []; this.clientWidth = 1100; this.offsetLeft = 500; this.offsetWidth = 400; this.offsetTop = 0; this.offsetHeight = 600;}
    setAttribute() {}
    removeAttribute() {}
    getBoundingClientRect() {return {left:500,top:100,width:400,height:600};}
    querySelector() {return new Element();}
    cloneNode() {return new Element();}
    addEventListener(type, listener) {(this.listeners[type] ??= []).push(listener);}
    fire(type, event = {}) {for (const listener of this.listeners[type] ?? []) listener(event);}
    appendChild(child) {this.children.push(child);}
    replaceChildren() {this.children = [];}
    contains(target) {return this === target || this.children.includes(target);}
    focus() {document.activeElement = this;}
    scrollIntoView() {this.scrolled = true;}
    animate(frames, options) {
      if (failAnimation && effects.length === 2) throw new Error('Animation failed');
      const effect = {element: this, frames, options, cancelled: false, cancel() {this.cancelled = true;}};
      effects.push(effect); return effect;
    }
  }
  const root = new Element(), window = new Element(), motion = new Element();
  window.innerWidth=width; window.innerHeight=height;
  motion.matches = reduced; window.matchMedia = () => motion;
  const nodes = Object.fromEntries(['.ke-site','.ki-description','.hero-scroll','.kl-object','.ki-stage','.ki-portrait','.ki-name','.ki-intro-mark','.ki-particles','.ki-skip','#ki-play','#ki-status','.ki-nav','.hero-primary'].map(key => [key, new Element()]));
  nodes['.ki-description'].children = [new Element(), new Element(), new Element()];
  nodes['.ki-skip'].hidden = nodes['#ki-play'].hidden = true;
  if (!animationAvailable) nodes['.ki-stage'].animate = undefined;
  root.querySelector = key => nodes[key];
  root.querySelectorAll = () => [nodes['.hero-primary']];
  const events = new Element();
  Object.assign(document, {getElementById: () => root, querySelector: key => nodes[key], createElement: () => new Element(), addEventListener: events.addEventListener.bind(events)});
  vm.runInNewContext(source, {portraitFlight: () => {const flight = {cancelled:false}; flights.push(flight); return () => {flight.cancelled=true;};}, document, window, getComputedStyle: () => ({backgroundColor:'#f5f4ef',color:'#19191b',webkitTextStrokeColor:'#19191b'}), location: {hash}, sessionStorage: {
    getItem(key) {if (storageBlocked) throw Error('Blocked'); return storage.get(key);},
    setItem(key, value) {if (storageBlocked) throw Error('Blocked'); storage.set(key, value);}
  }, setTimeout(fn, delay) {timers.set(++timerId, {fn, delay}); return timerId;}, clearTimeout(id) {timers.delete(id);}});
  return {nodes, root, window, motion, document, events, effects, timers, storage, flights};
}
function assertClean(a) {
  assert.equal(a.nodes['.ki-skip'].hidden, true);
  assert.equal(a.document.documentElement.dataset.intro, undefined);
  assert.ok(!a.root.inert);
  assert.equal(a.nodes['.ki-intro-mark'].style.visibility, 'hidden');
  assert.equal(a.timers.size, 0);
  assert.ok(a.effects.every(effect => effect.cancelled));
  assert.ok(a.flights.every(flight => flight.cancelled));
}
test('coordinated timeline overlaps portrait travel, name and supporting content, then settles at 3100ms', () => {
  const a = setup();
  assert.equal(a.nodes['.ki-skip'].hidden, false);
  assert.equal(a.nodes['#ki-play'].hidden, false);
  const mark = a.effects.find(e => e.element === a.nodes['.ki-intro-mark']);
  assert.equal(mark.options.delay, 400); assert.equal(mark.frames[0].opacity, 1);
  const portrait = a.effects.find(e => e.element === a.nodes['.ki-portrait']);
  const name = a.effects.find(e => e.element === a.nodes['.ki-name'] && e.frames[0].clipPath);
  assert.equal(portrait.options.duration, 250);
  assert.equal(portrait.options.delay, 2400);
  assert.equal(a.flights.length, 1);
  assert.equal(name.options.delay, 1000);
  assert.ok(name.options.delay < portrait.options.delay);
  assert.equal(portrait.frames.at(-1).opacity, 1);
  const description = a.nodes['.ki-description'].children.map(child => a.effects.find(e => e.element === child));
  assert.deepEqual(description.map(e => e.options.delay), [1700,1775,1850]);
  assert.equal([...a.timers.values()][0].delay, 3100);
  assert.ok(a.effects.every(effect => effect.startTime === 4200));
  assert.equal(a.storage.has('kim-intro-seen'), false);
  [...a.timers.values()][0].fn(); assertClean(a);
  assert.equal(a.storage.get('kim-intro-seen'), '1');
});
test('same-session load skips automatically; footer Replay still works', () => {
  const first = setup();
  [...first.timers.values()][0].fn();
  const a = setup({storage: first.storage});
  assert.equal(a.effects.length, 0);
  assert.match(a.nodes['#ki-status'].textContent, /already played/);
  a.nodes['#ki-play'].fire('click');
  assert.ok(a.effects.length > 0); assert.equal(a.nodes['.ki-stage'].scrolled, true);
  assert.equal(a.document.activeElement, a.nodes['.ki-skip']);
  [...a.timers.values()][0].fn(); assertClean(a);
  assert.equal(a.document.activeElement, a.nodes['.hero-primary']);
});
test('Skip cancels all effects and restores focus; repeated replay leaves one deadline', () => {
  const a = setup();
  a.nodes['.ki-skip'].fire('click'); assertClean(a);
  assert.equal(a.document.activeElement, a.nodes['.hero-primary']);
  a.nodes['#ki-play'].fire('click');
  const previous = [...a.effects];
  a.nodes['#ki-play'].fire('click');
  assert.equal(a.timers.size, 1); assert.ok(previous.every(effect => effect.cancelled));
});
test('reduced motion is immediate, including Replay, and does not consume session', () => {
  const a = setup({reduced: true});
  a.nodes['#ki-play'].fire('click');
  assert.equal(a.effects.length, 0); assertClean(a);
  assert.equal(a.storage.has('kim-intro-seen'), false);
  assert.match(a.nodes['#ki-status'].textContent, /Reduced motion/);
});
test('changing to reduced motion during playback cleans up immediately', () => {
  const a = setup(); a.motion.matches = true; a.motion.fire('change'); assertClean(a);
});
test('direct section navigation skips without consuming a fresh session', () => {
  const storage = new Map(), a = setup({hash: '#ke-work', storage});
  assert.equal(a.effects.length, 0); assert.equal(storage.has('kim-intro-seen'), false);
  assert.equal(a.nodes['.ki-stage'].scrolled, undefined);
  const next = setup({storage}); assert.ok(next.effects.length > 0);
});
test('anchors, keyboard focus, and page exit clean up ongoing playback', () => {
  const a = setup(); a.events.fire('click', {target: {closest: () => ({})}}); assertClean(a);
  const b = setup(); b.window.fire('hashchange'); assertClean(b);
  const c = setup(); c.root.fire('focusin', {target: c.nodes['.hero-primary']}); assertClean(c);
  const d = setup(); d.window.fire('pagehide'); assertClean(d);
});
test('blocked storage does not prevent playback or cleanup', () => {
  const a = setup({storageBlocked: true}); assert.ok(a.effects.length > 0);
  a.nodes['.ki-skip'].fire('click'); assertClean(a);
});
test('unavailable or throwing animation API leaves the page visible with no pending effects', () => {
  const a = setup({failAnimation: true}); assertClean(a);
  assert.equal(a.storage.has('kim-intro-seen'), false);
  const b = setup({animationAvailable: false}); assertClean(b);
});


test('mobile portrait hands off to the responsive image and resizing settles into the responsive final layout', () => {
  const a = setup({width:390,height:844});
  assert.equal(a.document.documentElement.dataset.intro, 'running');
  assert.equal(a.root.inert, true);
  const portrait = a.effects.find(e => e.element === a.nodes['.ki-portrait']);
  assert.equal(portrait.frames[0].opacity, 0);
  assert.equal(a.flights.length, 1);
  assert.deepEqual(a.nodes['.ki-portrait'].style, {});
  a.window.fire('resize'); assertClean(a);
});

test('Skip at each overlapping phase cancels every effect and restores the complete page', () => {
  for (const time of [300,800,1400,2000,2500]) {
    const a = setup();
    a.effects.forEach(effect => {effect.currentTime = time;});
    a.nodes['.ki-skip'].fire('click'); assertClean(a);
  }
});
