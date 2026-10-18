import {createImageViewer} from '../src/scripts/image-viewer.js';
﻿import test from 'node:test';
import assert from 'node:assert/strict';
import { nextIndex, swipeStep } from '../src/scripts/carousel-state.js';

test('carousel navigation wraps both ways and handles empty and single slides', () => {
  assert.equal(nextIndex(0, -1, 2), 1);
  assert.equal(nextIndex(1, 1, 2), 0);
  assert.equal(nextIndex(0, 1, 0), 0);
  assert.equal(nextIndex(0, 1, 1), 0);
  assert.equal(nextIndex(0, 101, 2), 1);
});
test('swiping distinguishes horizontal intent from vertical scrolling and taps', () => {
  assert.equal(swipeStep(-80, 10), 1);
  assert.equal(swipeStep(80, 10), -1);
  assert.equal(swipeStep(30, 2), 0);
  assert.equal(swipeStep(80, 100), 0);
  assert.equal(swipeStep(0, 120), 0);
});
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Exercise the real event handlers with a small DOM adapter, without a browser dependency.
class Element {
  constructor() { this.listeners = {}; this.dataset = {}; this.hidden = false; this.children = []; }
  setAttribute(name, value) { (this.attributes ??= {})[name] = value; }
  contains() { return false; }
  closest() { return null; }
  addEventListener(type, listener) { (this.listeners[type] ??= []).push(listener); }
  fire(type, event = {}) { for (const listener of this.listeners[type] ?? []) listener(event); }
  querySelector(selector) { return this.nodes?.[selector] ?? null; }
  querySelectorAll(selector) { return this.lists?.[selector] ?? []; }
  replaceChildren(...children) { this.children = children; }
  cloneNode() { return new Element(); }
  animate(frames, options) { this.frames = frames; this.options = options; const animation = {cancelled: false, cancel() {this.cancelled = true;}}; this.animation = animation; return animation; }
  focus() { this.focused = true; }
}
function fixture(count = 2) {
  const root = new Element(), dialog = new Element();
  const slides = Array.from({length: count}, (_, i) => {
    const slide = new Element(), button = new Element();
    slide.hidden = i !== 0; slide.dataset.caption = `Screen ${i + 1}`;
    button.closest = () => slide; button.dataset.openIndex = i;
    slide.nodes = {img: new Element(), '.screenshot-open': button};
    return slide;
  });
  const controls = slides.map((_,i) => {const button = new Element();button.dataset.imageSelect=i;return button;});
  const viewerControls = slides.map((_,i) => {const button=new Element();button.dataset.viewerSelect=i;return button;});
  const secondary = slides.map((_,i) => {const button=new Element();button.dataset.openIndex=i;button.hidden=i!==1;return button;});
  dialog.nodes = {'.viewer-image': new Element(), '.viewer-caption': new Element(), '.viewer-close': new Element()};
  dialog.lists = {'[data-viewer-select]': viewerControls, 'button:not([hidden])': [dialog.nodes['.viewer-close'], ...viewerControls]};
  dialog.showModal = () => {dialog.open = true;};
  dialog.close = () => {dialog.open = false; dialog.fire('close');};
  root.nodes = {dialog, '.screenshot-window': new Element(), '.screenshot-caption': new Element(), '.screenshot-counter': new Element(), '.screenshot-peek': new Element()};
  root.lists = {'.screenshot-slide': slides, '[data-image-select]': controls, '[data-open-index]': [...slides.map(s => s.nodes['.screenshot-open']),...secondary], '.screenshot-secondary':secondary};
  return {root, slides, controls, dialog, viewerControls, secondary};
}
function mount(fixtures, reduced = false) {
  const source = readFileSync(new URL('../src/scripts/carousel.js', import.meta.url), 'utf8').replace(/^import .*;\r?\n/, '');
  vm.runInNewContext(source, {createImageViewer, nextIndex, swipeStep, matchMedia: () => ({matches: reduced, addEventListener() {}}), document: {querySelectorAll: () => fixtures.map(f => f.root), addEventListener() {}}});
}
test('actual carousel handlers keep independent state and cancel rapid transitions', () => {
  const a = fixture(), b = fixture(); mount([a, b]);
  a.controls[1].fire('click');
  assert.equal(a.slides[1].hidden, false); assert.equal(b.slides[0].hidden, false);
  const firstAnimation = a.slides[1].animation;
  a.controls[0].fire('click');
  assert.equal(firstAnimation.cancelled, true); assert.equal(a.slides[0].hidden, false);
});
test('viewer switches screenshots and restores the original opener on close', () => {
  const a = fixture(); mount([a]);
  const opener = a.slides[0].nodes['.screenshot-open']; opener.fire('click');
  assert.equal(a.dialog.open, true);
  a.viewerControls[1].fire('click');
  assert.match(a.dialog.nodes['.viewer-caption'].textContent, /Screen 2/);
  a.dialog.nodes['.viewer-close'].fire('click');
  assert.equal(a.dialog.open, false); assert.equal(opener.focused, true); assert.equal(a.slides[0].hidden, false);
});

function projectFixture(count = 3) {
  const root = new Element(), track = new Element(), surface = new Element();
  track.style = {};
  const slides = Array.from({length: count}, (_, i) => {const slide = new Element(); slide.inert = i !== 0; return slide;});
  const selectors = slides.map((_, i) => {const button = new Element(); button.dataset.projectSelect = i; return button;});
  const controls = [-1, 1].map(step => {const button = new Element(); button.dataset.projectStep = step; return button;});
  root.nodes = {'.project-track': track, '.project-viewport': surface, '.project-counter': new Element()};
  root.lists = {'.project-slide': slides, '[data-project-select]': selectors, '[data-project-step]': controls};
  return {root, track, surface, slides, selectors, controls};
}
function mountProjects(a, reduced = false) {
  const source = readFileSync(new URL('../src/scripts/project-carousel.js', import.meta.url), 'utf8').replace(/^\uFEFF?import .*;\r?\n/, '');
  vm.runInNewContext(source, {nextIndex, swipeStep, getComputedStyle: () => ({transform: 'none'}), matchMedia: () => ({matches: reduced, addEventListener() {}}), document: {querySelectorAll: () => [a.root], addEventListener() {}}});
}
test('project Next, Previous, selectors and wrap update the whole active slide', () => {
  const a = projectFixture(); mountProjects(a);
  a.controls[1].fire('click');
  assert.equal(a.slides[1].inert, false); assert.equal(a.slides[0].inert, true);
  assert.equal(a.slides[0].attributes['aria-hidden'], 'true');
  assert.equal(a.root.nodes['.project-counter'].textContent, 'PROJECT 02 / 03');
  const firstAnimation = a.slides[1].animation;
  a.controls[1].fire('click');
  assert.equal(a.slides[2].inert, false); assert.equal(firstAnimation.cancelled, true);
  a.controls[0].fire('click'); assert.equal(a.slides[1].inert, false);
  a.selectors[0].fire('click'); assert.equal(a.slides[0].inert, false);
  a.controls[0].fire('click'); assert.equal(a.slides[2].inert, false);
  a.controls[1].fire('click'); assert.equal(a.slides[0].inert, false);
});
test('project keyboard navigation and future projects use data-driven slide count', () => {
  const a = projectFixture(4); mountProjects(a, true);
  const key = key => a.root.fire('keydown', {key, target: a.root, preventDefault() {}});
  key('ArrowRight'); assert.equal(a.slides[1].inert, false);
  key('End'); assert.equal(a.slides[3].inert, false);
  assert.equal(a.root.nodes['.project-counter'].textContent, 'PROJECT 04 / 04');
  key('Home'); assert.equal(a.slides[0].inert, false);
  assert.ok(a.slides.every(slide => slide.animation === undefined));
});
test('mobile swipes change projects but vertical gestures do not; next click is suppressed', () => {
  const a = projectFixture(); mountProjects(a, true);
  function swipe(x, y) {
    a.surface.fire('touchstart', {target: a.root, touches: [{clientX: 100, clientY: 100}]});
    a.surface.fire('touchend', {changedTouches: [{clientX: x, clientY: y}]});
  }
  swipe(90, 200); assert.equal(a.slides[0].inert, false);
  swipe(10, 110); assert.equal(a.slides[1].inert, false);
  let prevented = false;
  a.surface.fire('click', {preventDefault() {prevented = true;}, stopPropagation() {}});
  assert.equal(prevented, true);
});
test('thumbnail selection affects only its gallery, never project navigation', () => {
  const a = projectFixture(), first = fixture(), second = fixture();
  mountProjects(a); mount([first, second], true);
  first.controls[1].fire('click');
  assert.equal(first.slides[1].hidden, false); assert.equal(second.slides[0].hidden, false);
  assert.equal(a.slides[0].inert, false); assert.equal(first.slides[1].animation, undefined);
});


test('wraparound transitions follow Next/Previous direction and animate complete slides', async () => {
  const a = projectFixture(); mountProjects(a);
  a.controls[0].fire('click');
  assert.match(a.slides[2].frames[0].transform, /translateX\(-105%\)/);
  assert.equal(a.slides[2].options.duration, 420);
  await new Promise(resolve => setImmediate(resolve));
  a.controls[1].fire('click');
  assert.match(a.slides[0].frames[0].transform, /translateX\(105%\)/);
  assert.equal(a.slides[2].inert, true);
  assert.equal(a.slides[0].inert, false);
});
test('three-image galleries retain the landing page and open the visible phone in its own viewer', () => {
  const a = fixture(3); mount([a]);
  a.secondary[1].fire('click');
  assert.match(a.dialog.nodes['.viewer-caption'].textContent, /2 \/ 3/);
  assert.equal(a.slides[0].hidden, false);
  a.viewerControls[2].fire('click');
  assert.match(a.dialog.nodes['.viewer-caption'].textContent, /3 \/ 3/);
  a.dialog.nodes['.viewer-close'].fire('click');
  assert.equal(a.secondary[1].focused,true);
  a.controls[2].fire('click');
  assert.equal(a.slides[2].hidden,false);
  assert.equal(a.secondary[0].hidden,false);
  assert.equal(a.secondary[1].hidden,true);
});

test('viewer keyboard arrows wrap across all screenshots without changing the project composition', () => {
  const a=fixture(3);mount([a]);a.secondary[1].fire('click');
  const key=key=>a.dialog.fire('keydown',{key,stopPropagation(){},preventDefault(){}});
  key('ArrowRight');assert.match(a.dialog.nodes['.viewer-caption'].textContent,/3 \/ 3/);
  key('ArrowRight');assert.match(a.dialog.nodes['.viewer-caption'].textContent,/1 \/ 3/);
  key('ArrowLeft');assert.match(a.dialog.nodes['.viewer-caption'].textContent,/3 \/ 3/);
  assert.equal(a.slides[0].hidden,false);
});

test('slow gallery decoding retains current composition and ignores superseded requests', async () => {
  const a=fixture(3);let resolve;
  a.slides[2].nodes.img.decode=()=>new Promise(done=>{resolve=done;});mount([a]);
  a.controls[1].fire('click');assert.equal(a.slides[0].hidden,false);
  a.controls[0].fire('click');resolve();await new Promise(done=>setImmediate(done));
  assert.equal(a.slides[0].hidden,false);assert.equal(a.slides[1].hidden,true);
});

test('rapid reversal resumes the returning slide from its current visual transform', () => {
  const a = projectFixture(); mountProjects(a);
  a.controls[1].fire('click');
  a.controls[0].fire('click');
  // Mock computed style is none; returning from offscreen would incorrectly be -105%.
  assert.equal(a.slides[0].frames[0].transform, 'none');
  assert.equal(a.slides[0].inert, false);
});


test('failed gallery decoding retains its current screenshot and reports the failure', async () => {
  const a=fixture(3);a.slides[1].nodes.img.decode=()=>Promise.reject(Error('network'));
  mount([a]);a.controls[1].fire('click');await new Promise(done=>setImmediate(done));
  assert.equal(a.slides[0].hidden,false);
  assert.match(a.root.nodes['.screenshot-caption'].textContent,/could not load/);
});

test('opening a viewer cancels pending gallery changes so focus returns to a visible opener', async () => {
  const a=fixture(3);let resolve;a.slides[1].nodes.img.decode=()=>new Promise(done=>{resolve=done;});
  mount([a]);a.controls[1].fire('click');const opener=a.slides[0].nodes['.screenshot-open'];opener.fire('click');
  resolve();await new Promise(done=>setImmediate(done));a.dialog.nodes['.viewer-close'].fire('click');
  assert.equal(a.slides[0].hidden,false);assert.equal(opener.focused,true);
});
