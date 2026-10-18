import test from 'node:test';
import assert from 'node:assert/strict';
import {createSoundPlayer, initInteractionSounds, soundForControl, SOUND_URLS} from '../src/scripts/interaction-sounds.js';

function fixture() {
  let time = 1000;
  const clips = [], errors = [];
  class Audio {
    constructor(url) {this.url = url; this.calls = 0; this.paused = false; clips.push(this);}
    addEventListener() {}
    play() {this.calls++; return Promise.resolve();}
    pause() {this.paused = true;}
  }
  const options = {AudioClass:Audio, now:()=>time, report:(...args)=>errors.push(args)};
  return {clips, errors, options, advance:(n=200)=>{time+=n;}};
}
test('muted startup and saved enabled state never play without activation; confirmation uses WAV at .35', async () => {
  const a = fixture(), player = createSoundPlayer(a.options);
  player.play(); assert.equal(a.clips.length,0);
  player.setEnabled(true); assert.equal(a.clips.length,0);
  player.play('soft',{hover:true}); assert.equal(a.clips.length,0);
  player.play('click',{confirmation:true}); await Promise.resolve();
  assert.equal(a.clips[0].url,SOUND_URLS.click); assert.equal(a.clips[0].volume,.35);
  player.setEnabled(false); assert.equal(a.clips[0].paused,true); assert.equal(a.clips[0].currentTime,0);
});
test('hover has quiet volume and global cooldown; clicks take priority and replace active audio', async () => {
  const a = fixture(), player = createSoundPlayer(a.options); player.setEnabled(true); player.play(); await Promise.resolve();
  a.advance(); player.play('soft',{hover:true}); assert.equal(a.clips[1].volume,.12);
  a.advance(30); player.play('soft',{hover:true}); assert.equal(a.clips[1].calls,1);
  player.play('switch'); assert.equal(a.clips[1].paused,true); assert.equal(a.clips[2].volume,.35);
  player.play('click'); assert.equal(a.clips[0].calls,1);
});
test('playback rejection is reported, with no unhandled promise or active effect', async () => {
  const errors = [];
  class Blocked {addEventListener() {} play(){return Promise.reject(Error('NotAllowedError'));} pause(){}}
  const player = createSoundPlayer({AudioClass:Blocked,report:(...args)=>errors.push(args)});
  player.setEnabled(true); player.play(); await new Promise(resolve=>setImmediate(resolve));
  assert.equal(errors.length,1); assert.match(errors[0][0],/thock-click.wav/);
});
test('control routing distinguishes project/theme switches and screenshot/dialog soft actions', () => {
  const c = token => ({matches:selector=>selector.split(', ').includes(token)});
  for(const token of ['#theme-toggle','[data-project-step]','[data-project-select]']) assert.equal(soundForControl(c(token)),'switch');
  for(const token of ['[data-image-select]','[data-viewer-select]','.viewer-close']) assert.equal(soundForControl(c(token)),'soft');
  assert.equal(soundForControl(c('a')),'click');
});
test('delegated events confirm enable once, ignore nested hover/touch, persist and mute', async () => {
  const a = fixture(), listeners = {}, values = new Map();
  function control() {return {attrs:{},setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];},closest(selector){return selector==='[inert]'?null:this;},contains(target){return target===this;},matches(){return false;}};}
  const toggle = control(), other = control();
  const doc = {querySelector:()=>toggle,addEventListener(type,fn){listeners[type]=fn;}};
  initInteractionSounds(doc,{...a.options,finePointer:{matches:true},storage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)}});
  assert.equal(toggle.attrs['aria-pressed'],'false'); assert.equal(a.clips.length,0);
  listeners.click({isTrusted:true,target:toggle}); await Promise.resolve();
  assert.equal(a.clips[0].calls,1); assert.equal(values.get('kim-sound'),'on');
  a.advance(); listeners.pointerover({isTrusted:true,pointerType:'mouse',target:other,relatedTarget:null});
  assert.equal(a.clips[1].calls,1);
  a.advance(); listeners.pointerover({isTrusted:true,pointerType:'mouse',target:other,relatedTarget:other});
  listeners.pointerover({isTrusted:true,pointerType:'touch',target:other,relatedTarget:null});
  assert.equal(a.clips[1].calls,1);
  listeners.click({isTrusted:true,target:toggle}); assert.equal(a.clips[1].paused,true);
  assert.equal(values.get('kim-sound'),'off'); assert.equal(toggle.attrs['aria-pressed'],'false');
});
