import test from 'node:test';
import assert from 'node:assert/strict';
import {initPhotography} from '../src/scripts/photography.js';

function fixture(reduced = true) {
  const doc = {body:{style:{position:'',top:'',left:'',right:'',width:'',overflow:'',paddingRight:'7px'}},documentElement:{style:{overflow:''},clientWidth:980}};
  const win = {matchMedia:()=>({matches:reduced,addEventListener(){}}),scrollX:0,scrollY:900,innerWidth:1000,getComputedStyle:()=>({paddingRight:'7px'}),scrollTo(value){this.restored=value;}};
  class Element {
    constructor(){this.events={};this.dataset={};this.children=[];}
    addEventListener(type,fn){(this.events[type]??=[]).push(fn);}
    fire(type,event={}){for(const fn of this.events[type]??[])fn(event);}
    querySelector(key){return this.nodes?.[key];}
    querySelectorAll(key){return this.lists?.[key]??[];}
    replaceChildren(...nodes){this.children=nodes;}
    focus(){doc.activeElement=this;}
    animate(frames, options){this.animation={frames,options,cancelled:false,cancel(){this.cancelled=true;}};return this.animation;}
    cloneNode(){return Object.assign(new Element(),{src:this.src});}
  }
  const root=new Element(),dialog=new Element(),close=new Element(),content=new Element(),caption=new Element();
  const openers=['Flower','Kite','Withered'].map((title,i)=>{const button=new Element(),img=new Element();button.dataset.title=title;img.src=`photo-${i}.jpg`;button.nodes={img};return button;});
  const controls=[-1,1].map(step=>{const button=new Element();button.dataset.photoStep=step;return button;});
  dialog.nodes={'.viewer-close':close,'.viewer-image':content,'.viewer-caption':caption};
  dialog.lists={'[data-photo-step]':controls,button:[close,...controls]};
  dialog.showModal=()=>{dialog.open=true;};
  dialog.close=()=>{dialog.open=false;dialog.fire('close');};
  root.nodes={dialog};root.lists={'.photo-open':openers};
  initPhotography(root,doc,win);
  return {root,dialog,close,content,caption,openers,controls,doc,win};
}
test('photography opens selected full image and restores exact scroll styles and opener on close',()=>{
  const a=fixture();a.openers[1].fire('click');
  assert.equal(a.dialog.open,true);assert.equal(a.content.children[0].src,'photo-1.jpg');
  assert.equal(a.content.children[0].loading,'eager');assert.equal(a.doc.activeElement,a.close);
  assert.equal(a.doc.body.style.position,'fixed');assert.equal(a.doc.body.style.top,'-900px');assert.equal(a.doc.body.style.paddingRight,'27px');
  a.controls[1].fire('click');assert.match(a.caption.textContent,/Withered/);
  a.close.fire('click');assert.equal(a.doc.activeElement,a.openers[1]);
  assert.equal(a.doc.body.style.position,'');assert.equal(a.doc.body.style.paddingRight,'7px');assert.equal(a.doc.documentElement.style.overflow,'');
  assert.deepEqual(a.win.restored,{left:0,top:900,behavior:'instant'});
});
test('photo arrow navigation wraps within photography and native close event releases scroll lock',()=>{
  const a=fixture();a.openers[0].fire('click');
  const key=key=>a.dialog.fire('keydown',{key,preventDefault(){},stopPropagation(){}});
  key('ArrowLeft');assert.match(a.caption.textContent,/Withered/);
  key('ArrowRight');assert.match(a.caption.textContent,/Flower/);
  a.controls[1].fire('click');assert.match(a.caption.textContent,/Kite/);
  // Escape uses the native dialog close event; the same cleanup runs for every close.
  a.dialog.close();assert.equal(a.doc.body.style.position,'');assert.equal(a.doc.activeElement,a.openers[0]);
});
test('Tab and Shift+Tab stay inside the photo viewer',()=>{
  const a=fixture();a.openers[0].fire('click');
  a.dialog.fire('keydown',{key:'Tab',shiftKey:true,preventDefault(){},stopPropagation(){}});
  assert.equal(a.doc.activeElement,a.controls[1]);
  a.dialog.fire('keydown',{key:'Tab',shiftKey:false,preventDefault(){},stopPropagation(){}});
  assert.equal(a.doc.activeElement,a.close);
});

test('photo opening uses a short contained fade/scale and reduced motion skips it',()=>{
  const a=fixture(false);a.openers[0].fire('click');assert.equal(a.dialog.animation.options.duration,220);
  a.close.fire('click');assert.equal(a.dialog.animation.cancelled,true);
  const b=fixture(true);b.openers[0].fire('click');assert.equal(b.dialog.animation,undefined);
});
