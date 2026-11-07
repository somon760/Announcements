import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {renderFurtherTales, renderChapterTales, renderTalesCallout, bindFurtherTales} from '../review/further-tales.js';

const root=resolve(import.meta.dirname,'../review');
const read=name=>JSON.parse(readFileSync(resolve(root,name),'utf8'));
const data=read('further-tales.json');
const context={stories:read('stories.json'),people:read('characters.json').people,items:read('media.json').items,assetStories:read('asset-stories.json')};
const pages=new Set(data.sections.map(section=>section.slug));
assert.equal(pages.size,6);
assert.equal(data.threads.length,5);
assert.equal(data.quotes.length,4);
assert.equal(data.epilogues.characters.length,8);
const eraIds=new Set(data.farewellEras.map(era=>era.id));
assert.equal(eraIds.size,data.farewellEras.length,'Adventure groups must have unique IDs');
const farewellIds=new Set(data.leftBehind.map(entry=>entry.id));
assert.equal(farewellIds.size,data.leftBehind.length,'Farewell entries must have unique IDs');
const farewellHTML=renderFurtherTales(data,'those-left-behind',context);
for(const entry of data.leftBehind) {
  assert(eraIds.has(entry.era),`Unassigned farewell: ${entry.id}`);
  assert.equal(farewellHTML.split(`id="tale-${entry.id}"`).length-1,1,`Farewell must render once: ${entry.id}`);
}


function checkReferences(value) {
  if(!value||typeof value!=='object') return;
  if(value.chapter&&value.scene) {
    assert(context.stories[value.chapter]?.scenes[value.scene-1],`Missing scene ${JSON.stringify(value)}`);
  }
  if(value.media) assert(context.items.some(item=>item.id===value.media),`Missing media ${value.media}`);
  if(value.person) assert(context.people.some(person=>person.slug===value.person),`Missing person ${value.person}`);
  for(const child of Object.values(value)) checkReferences(child);
}
checkReferences(data);
for(const id of data.films) assert.equal(context.items.find(item=>item.id===id)?.kind,'video');

let links=0,images=0;
for(const section of [undefined,...pages]) {
  const html=renderFurtherTales(data,section,context);
  assert(!html.includes('undefined'));
  assert(!/\bboss\b/i.test(html));
  assert.equal((html.match(/<h1>/g)??[]).length,1);
  assert(html.lastIndexOf('Continue through the tales')>html.lastIndexOf('</article>'));
  for(const [,href] of html.matchAll(/href="([^"]+)"/g)) {
    const [slug,child,entry]=href.replace(/^#\//,'').split('/');
    if(slug==='further-tales') {
      assert(!child||pages.has(child),`Invalid tale route ${href}`);
      if(entry) assert(renderFurtherTales(data,child,context).includes(`id="tale-${entry}"`),`Invalid tale entry ${href}`);
    } else if(slug==='revelations') assert(context.stories[child],`Missing linked story ${href}`);
    else if(slug==='companions') assert(!child||context.people.some(person=>person.slug===child));
    else if(child==='scene') assert(context.stories[slug]?.scenes[Number(entry)-1],`Invalid scene link ${href}`);
    else assert(['','timeline','companions'].includes(slug)||context.stories[slug],`Invalid route ${href}`);
    links++;
  }
  for(const [,path] of html.matchAll(/<img[^>]+src="([^"]+)"/g)) {assert(existsSync(resolve(root,path)),`Missing artwork ${path}`);images++}
}
assert(renderTalesCallout().includes('#/further-tales'));
for(const slug of ['deep-horizon','writhe-below','white-plume','frostmaiden','fungal-bloom','bastion']) assert(renderChapterTales(slug));
assert.equal(renderChapterTales('sunless-citadel'),'');

// Exercise the real category binding, including repeated changes and reset.
const buttons=['all','weapons','arcana','keepsakes'].map(group=>({dataset:{treasuryGroup:group},setAttribute(key,value){this[key]=value},addEventListener(_,fn){this.click=fn}}));
const entries=data.treasury.map(item=>({dataset:{treasuryEntry:item.group},hidden:false}));
const status={textContent:''};
const fakeMain={querySelectorAll(selector){return selector==='[data-treasury-group]'?buttons:selector==='[data-treasury-entry]'?entries:[]},querySelector(){return status}};
bindFurtherTales(fakeMain,()=>{});
for(const group of ['weapons','keepsakes','arcana','all']) {
  buttons.find(button=>button.dataset.treasuryGroup===group).click();
  const expected=data.treasury.filter(item=>group==='all'||item.group===group).length;
  assert.equal(entries.filter(entry=>!entry.hidden).length,expected);
  assert.equal(buttons.filter(button=>button['aria-pressed']==='true').length,1);
  assert.equal(status.textContent,`${expected} histories`);
}
console.log(`Further Tales: seven views, ${links} links and ${images} artwork references checked; category changes and reset passed.`);
