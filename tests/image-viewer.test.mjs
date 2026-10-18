import test from 'node:test';
import assert from 'node:assert/strict';
import {createImageViewer} from '../src/scripts/image-viewer.js';
function fixture() {
  const content = {childElementCount:1, children:['current'], replaceChildren(image){this.children=[image];}};
  const caption = {textContent:'Current caption'};
  const viewer = createImageViewer({querySelector:s=>s === '.viewer-image' ? content : caption});
  function image(src) {
    let resolve, reject;
    const promise = new Promise((a,b)=>{resolve=a;reject=b;});
    return {src, resolve, reject, cloneNode(){return {src,decode:()=>promise};}};
  }
  return {content,caption,viewer,image};
}
const flush = async () => {await Promise.resolve();await Promise.resolve();await Promise.resolve();};
test('slow decode retains current frame and caption; rapid navigation cannot commit stale images', async()=>{
  const a=fixture(), slow=a.image('slow'), latest=a.image('latest');
  a.viewer.show(slow,'Slow');a.viewer.show(latest,'Latest');
  assert.equal(a.content.children[0],'current');assert.equal(a.caption.textContent,'Current caption');
  latest.resolve();await flush();assert.equal(a.content.children[0].src,'latest');
  slow.resolve();await flush();assert.equal(a.content.children[0].src,'latest');assert.equal(a.caption.textContent,'Latest');
});
test('failed loads retain current frame; closing invalidates pending swaps',async()=>{
  const a=fixture(), bad=a.image('bad');a.viewer.show(bad,'Bad');bad.reject(Error('network'));await flush();
  assert.equal(a.content.children[0],'current');assert.match(a.caption.textContent,/could not load/);
  const next=a.image('next');a.viewer.show(next,'Next');a.viewer.cancel();next.resolve();await flush();
  assert.equal(a.content.children[0],'current');
});
test('adjacent preloading decodes before a synchronous ready-frame swap',async()=>{
  const a=fixture(), next=a.image('next');a.viewer.preload([next]);next.resolve();await flush();
  a.viewer.show(next,'Next');assert.equal(a.content.children[0].src,'next');assert.equal(a.caption.textContent,'Next');
});
