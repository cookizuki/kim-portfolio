import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function setup({intro = false, reduced = false, fine = true} = {}) {
  class Element {
    constructor(){this.style={};this.events={};}
    addEventListener(type,fn){(this.events[type]??=[]).push(fn);}
    fire(type,e={}){for(const fn of this.events[type]??[])fn(e);}
    getBoundingClientRect(){return {left:0,top:this.top??0,width:1000,height:650};}
  }
  const name=new Element(),knot=new Element(),photo=new Element(),stage=new Element(),skip=new Element(),canvas=new Element();
  skip.hidden=!intro;
  const ctx={setTransform(){},clearRect(){},beginPath(){},lineTo(){},moveTo(){},closePath(){},fill(){}};
  canvas.getContext=()=>ctx;
  canvas.getBoundingClientRect=()=>({width:80,height:80});
  const root={querySelector:s=>({'.ki-stage':stage,'.kl-object':knot,'.ki-skip':skip,'.ki-name':name,canvas,'.ki-portrait img':photo}[s]),querySelectorAll:()=>[]};
  const doc=new Element();doc.getElementById=()=>root;doc.querySelector=root.querySelector;
  const win=new Element(),reduce=new Element(),pointer=new Element();reduce.matches=reduced;pointer.matches=fine;
  const raf=new Map();let id=0,mutation;
  class Observer {constructor(fn){this.fn=fn;}observe(){}unobserve(){}disconnect(){}}
  class Mutation extends Observer {constructor(fn){super(fn);mutation=fn;}}
  vm.runInNewContext(readFileSync(new URL('../src/scripts/hero-motion.js',import.meta.url),'utf8'),{
    document:doc,window:win,matchMedia:s=>s.includes('reduced')?reduce:pointer,AbortController,ResizeObserver:Observer,IntersectionObserver:Observer,MutationObserver:Mutation,devicePixelRatio:1,
    requestAnimationFrame:fn=>{raf.set(++id,fn);return id;},cancelAnimationFrame:id=>raf.delete(id)
  });
  function flush(){let count=0;while(raf.size&&count++<150){const entries=[...raf];raf.clear();entries.forEach(([,fn])=>fn());}assert.ok(count<150);}
  return {name,knot,photo,stage,skip,doc,win,reduce,raf,mutation,flush};
}
test('hero stays still during intro, then interpolates bounded name/knot depth without moving portrait',()=>{
  const a=setup({intro:true});a.stage.fire('pointermove',{clientX:5000,clientY:5000,pointerType:'mouse'});
  assert.equal(a.raf.size,0);
  a.skip.hidden=true;a.mutation();a.stage.fire('pointermove',{clientX:5000,clientY:5000,pointerType:'mouse'});a.flush();
  const [x,y]=a.name.style.translate.split(' ').map(parseFloat);assert.ok(Math.abs(x)<=5&&Math.abs(y)<=3);
  assert.ok(Math.abs(x)>4);assert.deepEqual(a.photo.style,{});
  a.skip.hidden=false;a.mutation();assert.equal(a.name.style.translate,'none');assert.equal(a.raf.size,0);
});
test('scroll depth is bounded, reduced motion resets, and hidden tabs stop queued frames',()=>{
  const a=setup();a.stage.top=-10000;a.win.fire('scroll');a.flush();
  assert.ok(Math.abs(parseFloat(a.name.style.translate.split(' ')[1]))<=28);
  a.doc.hidden=true;a.doc.fire('visibilitychange');assert.equal(a.raf.size,0);
  a.reduce.matches=true;a.reduce.fire('change');assert.equal(a.name.style.translate,'none');
  a.doc.hidden=false;a.doc.fire('visibilitychange');assert.equal(a.raf.size,0);
});
test('touch composition never depends on pointer hover',()=>{
  const a=setup({fine:false});a.flush();a.stage.fire('pointermove',{clientX:900,clientY:400,pointerType:'touch'});assert.equal(a.raf.size,0);assert.deepEqual(a.photo.style,{});
});
