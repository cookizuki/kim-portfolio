import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {readingProgress, resolveTheme, revealRadius} from '../src/scripts/preference-state.js';

test('progress clamps endpoints, resizes, and handles a page without overflow', () => {
  assert.equal(readingProgress(0, 2000, 800), 0);
  assert.equal(readingProgress(1200, 2000, 800), 1);
  assert.equal(readingProgress(600, 2000, 800), .5);
  assert.equal(readingProgress(600, 3200, 800), .25);
  assert.equal(readingProgress(-20, 2000, 800), 0);
  assert.equal(readingProgress(1500, 2000, 800), 1);
  assert.equal(readingProgress(0, 800, 800), 0);
});
test('theme follows system until a valid explicit choice; reveal covers farthest corner', () => {
  assert.equal(resolveTheme(null, true), 'dark');
  assert.equal(resolveTheme(null, false), 'light');
  assert.equal(resolveTheme('light', true), 'light');
  assert.equal(resolveTheme('dark', false), 'dark');
  assert.equal(resolveTheme('invalid', true), 'dark');
  assert.equal(revealRadius(0, 0, 300, 400), 500);
});
function setup({saved = {}, dark = false, reduced = false, audioBlocked = false, transition = false} = {}) {
  const storage = new Map(Object.entries(saved)), sources = [];
  let created = 0, clock = 1000, transitionCount = 0;
  class Element {
    constructor() {this.listeners = {}; this.attrs = {}; this.dataset = {}; this.style = {};}
    addEventListener(type, fn) {(this.listeners[type] ??= []).push(fn);}
    async fire(type, event = {}) {for(const fn of this.listeners[type] ?? []) await fn(event);}
    setAttribute(key, value) {this.attrs[key] = value;}
    getBoundingClientRect() {return {left: 20, top: 20, width: 44, height: 44};}
    animate() {return {finished: Promise.resolve(), cancel() {}};}
    closest() {return this;}
  }
  const html = new Element(), theme = new Element(), sound = new Element(), meta = new Element();
  const system = new Element(), motion = new Element(); system.matches = dark; motion.matches = reduced;
  const document = new Element(); document.documentElement = html;
  document.querySelector = selector => ({'#theme-toggle': theme, '#sound-toggle': sound, 'meta[name="theme-color"]': meta}[selector] ?? null);
  document.dispatchEvent = () => {};
  let release;
  if (transition) document.startViewTransition = apply => {
    transitionCount++; apply();
    return {ready: new Promise(resolve => {release = resolve;}), finished: Promise.resolve(), skipTransition() {release();}};
  };
  class AudioContext {
    constructor() {created++; this.state = 'suspended'; this.sampleRate = 1000; this.currentTime = 0;}
    async resume() {if (audioBlocked) throw Error('blocked'); this.state = 'running';}
    createBuffer(_, length) {return {getChannelData: () => new Float32Array(length)};}
    createBufferSource() {const s = {connect() {}, disconnect() {}, start() {}, stop(time) {if(time === undefined) this.stopped = true;}}; sources.push(s); return s;}
    createBiquadFilter() {return {frequency:{}, Q:{}, connect() {}, disconnect() {}};}
    createGain() {return {gain: {setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}}, connect() {}, disconnect() {}};}
  }
  const source = readFileSync(new URL('../src/scripts/preferences.js', import.meta.url), 'utf8').replace(/^\uFEFF?import .*;\r?\n/gm, '');
  vm.runInNewContext(source, {document, window:{AudioContext}, resolveTheme, revealRadius, matchMedia: query => query.includes('reduced') ? motion : system,
    localStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)}, Event:class {}, innerWidth:1000, innerHeight:800, performance:{now:()=>clock}});
  async function click(button) {clock += 100; await button.fire('click'); await document.fire('click', {isTrusted:true,target:button}); await Promise.resolve();}
  return {html, theme, sound, system, motion, storage, sources, document, click, created:()=>created, transitions:()=>transitionCount, release:()=>release()};
}
test('theme fallback persists explicit choice and ignores later system changes', async () => {
  const a = setup({dark: true}); assert.equal(a.html.dataset.theme, 'dark');
  await a.click(a.theme); assert.equal(a.html.dataset.theme, 'light'); assert.equal(a.storage.get('kim-theme'), 'light');
  await a.system.fire('change'); assert.equal(a.html.dataset.theme, 'light');
  assert.equal(a.theme.attrs['aria-label'], 'Switch to dark mode');
});
test('system changes apply before explicit choice and reduced motion bypasses reveal', async () => {
  const a = setup({reduced: true, transition:true}); a.system.matches = true; await a.system.fire('change');
  assert.equal(a.html.dataset.theme, 'dark'); await a.click(a.theme); assert.equal(a.transitions(),0);
});
test('rapid theme clicks do not overlap transitions', async () => {
  const a = setup({transition:true}); const first = a.theme.fire('click');
  await a.theme.fire('click'); assert.equal(a.transitions(),1);
  a.release(); await first; assert.equal(a.html.dataset.theme,'dark');
});
