import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/scripts/portrait-flight.js',import.meta.url),'utf8').replace('export function','function');
function setup({loaded=true}={}) {
  const frames=new Map(), draws=[]; let removed=false, resolve;
  const ctx={scale(){},clearRect(){},drawImage(...args){draws.push(args)}};
  const canvas={setAttribute(){},getContext(){return ctx},remove(){removed=true}};
  const image={complete:loaded,naturalWidth:1086,naturalHeight:1448,getBoundingClientRect(){return {left:160,top:180,width:200,height:270}},decode(){return new Promise(r=>resolve=r)}};
  let id=0;
  const sandbox={document:{createElement(){return canvas}},performance:{now:()=>0},innerWidth:390,innerHeight:844,devicePixelRatio:3,Math,requestAnimationFrame(fn){frames.set(++id,fn);return id},cancelAnimationFrame(id){frames.delete(id)}};
  vm.runInNewContext(source,sandbox);
  const stop=sandbox.portraitFlight(image,{prepend(){}});
  return {stop,frames,draws,canvas,resolve:()=>resolve(),removed:()=>removed,tick(t){const [id,fn]=frames.entries().next().value;frames.delete(id);fn(t)}};
}
test('portrait pixels reach the responsive image box and release their canvas',()=>{
  const a=setup();assert.equal(a.canvas.width,585);a.tick(2400);
  assert.ok(a.draws.length>0 && a.draws.length<1000);
  const first=a.draws[0];assert.equal(first[5],160);assert.equal(first[6],180);
  a.tick(2800);assert.equal(a.frames.size,0);assert.ok(a.removed());
});
test('skip cancels a pending frame and late image decode cannot restart it',async()=>{
  const a=setup();a.stop();assert.equal(a.frames.size,0);assert.ok(a.removed());
  const b=setup({loaded:false});b.stop();b.resolve();await Promise.resolve();assert.equal(b.frames.size,0);assert.equal(b.draws.length,0);
});
