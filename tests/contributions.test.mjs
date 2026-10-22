import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {nextIndex,swipeStep} from '../src/scripts/carousel-state.js';
const source=readFileSync(new URL('../src/scripts/contributions.js',import.meta.url),'utf8').replace(/^import .*;\n/,'');
function setup(){
 const animations=[];
 class El {
  constructor(){this.dataset={};this.attrs={};this.events={};}
  addEventListener(k,fn){(this.events[k]??=[]).push(fn)}
  fire(k,e={}){for(const fn of this.events[k]||[])fn(e)}
  setAttribute(k,v){this.attrs[k]=v}
  removeAttribute(k){delete this.attrs[k]}
  hasAttribute(k){return k in this.attrs}
  animate(frames,options){let resolve,reject;const a={frames,options,cancelled:false,finished:new Promise((r,j)=>{resolve=r;reject=j}),finish(){resolve()},cancel(){this.cancelled=true;reject(new Error('cancelled'))}};animations.push(a);return a}
 }
 const root=new El(),scene=new El(),slides=Array.from({length:3},()=>new El()),count=new El(),controls=new El(),prev=new El(),next=new El(),motion=new El();prev.dataset.roleStep='-1';next.dataset.roleStep='1';
 root.closest=()=>scene;root.querySelectorAll=s=>s==='.contribution-slide'?slides:[prev,next];root.querySelector=s=>s==='[data-role-count]'?count:controls;
 const document=new El();document.querySelector=()=>root;document.hidden=false;
 vm.runInNewContext(source,{document,matchMedia:()=>motion,nextIndex,swipeStep,getComputedStyle:()=>({transform:'matrix(1,0,0,1,12,0)',opacity:'0.8'}),CustomEvent:class{constructor(type,args){this.type=type;this.detail=args.detail}}});
 return {root,scene,slides,animations,next,prev};
}
test('outgoing roles retain their end frame until both effects are cleaned up',async()=>{
 const a=setup();a.next.fire('click');assert.equal(a.animations.length,2);
 assert.equal(a.animations[0].options.fill,'both');assert.equal(a.animations[1].options.fill,'both');
 assert.equal(a.animations[0].options.duration,a.animations[1].options.duration);
 a.animations.forEach(x=>x.finish());await new Promise(resolve=>setImmediate(resolve));
 assert.equal(a.slides.filter(s=>s.hasAttribute('data-leaving')).length,0);
 assert.equal(a.slides.filter(s=>!s.inert).length,1);
});
test('rapid role reversal cancels obsolete effects and settles to the latest role',async()=>{
 const a=setup();a.next.fire('click');const old=a.animations.slice();a.prev.fire('click');
 assert.ok(old.every(x=>x.cancelled));assert.equal(a.slides[0].inert,false);
 a.animations.slice(2).forEach(x=>x.finish());await new Promise(resolve=>setImmediate(resolve));
 assert.equal(a.slides.filter(s=>s.hasAttribute('data-leaving')).length,0);
});
