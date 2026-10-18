import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/scripts/intro-bootstrap.js',import.meta.url),'utf8');
function setup({seen=false,hash='',reduced=false,blocked=false}={}) {
 const html={dataset:{}},events={},timers=new Map(),nodes=[{inert:true,removeAttribute(){this.removed=true;}}];
 const document={documentElement:html,querySelectorAll:()=>nodes,addEventListener:(name,fn)=>events[name]=fn};
 const window={addEventListener:(name,fn)=>events[name]=fn};
 const storage={getItem(){if(blocked)throw Error();return seen?'1':null;},setItem(){}};
 vm.runInNewContext(source,{document,window,location:{hash},sessionStorage:storage,matchMedia:()=>({matches:reduced,addEventListener(){}}),setTimeout(fn){timers.set(1,fn);return 1;},clearTimeout(id){timers.delete(id);}});
 return {html,events,timers,nodes,state:window.kimIntro};
}
test('head bootstrap gates fresh first paint, but not completed, anchor, or reduced-motion visits',()=>{
 assert.equal(setup().html.dataset.intro,'pending');
 for(const options of [{seen:true},{hash:'#ke-work'},{reduced:true}]) assert.equal(setup(options).html.dataset.intro,undefined);
});
test('blocked storage still gates first paint; missing module watchdog releases page and focus restrictions',()=>{
 const a=setup({blocked:true});assert.equal(a.html.dataset.intro,'pending');
 a.timers.get(1)();assert.equal(a.html.dataset.intro,undefined);assert.equal(a.nodes[0].inert,false);assert.equal(a.state.pending,false);
});
test('early Skip works even before the animation module loads',()=>{
 const a=setup();a.events.click({target:{closest:()=>true}});assert.equal(a.html.dataset.intro,undefined);assert.equal(a.timers.size,0);
});
