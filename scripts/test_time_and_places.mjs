import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {renderTimeAndPlaces,renderExplorerCallout,chapterAtlasLink} from '../review/time-and-places.js';
const root=resolve(import.meta.dirname,'../review');
const read=name=>JSON.parse(readFileSync(resolve(root,name),'utf8'));
const data=read('time-and-places.json');
const context={people:read('characters.json').people,items:read('media.json').items,stories:read('stories.json'),assetStories:read('asset-stories.json')};
const eventIds=new Set(data.events.map(event=>event.id));
const placeIds=new Set(data.places.map(place=>place.id));
assert.equal(eventIds.size,data.events.length);
assert.equal(placeIds.size,data.places.length);
const occupied=new Set();
for(const event of data.events){
  assert(['biscuit','gravy','world','shared'].includes(event.lane));
  assert(Number.isInteger(event.row)&&event.row>=0);
  const key=`${event.row}/${event.lane}`;assert(!occupied.has(key),`Colliding milestone: ${key}`);occupied.add(key);
}
for(const edge of data.edges){
  let previous=-1;
  for(const id of edge.nodes){assert(eventIds.has(id));const row=data.events.find(event=>event.id===id).row;assert(row>=previous,'Trail order must run downward');previous=row}
}
assert(data.events.find(e=>e.id==='bastion-begins').row<data.events.find(e=>e.id==='writhe').row);
assert(data.events.find(e=>e.id==='flashback').row<data.events.find(e=>e.id==='return').row);
assert.equal(data.events.filter(e=>e.lane==='shared').length,1);
assert(data.events.findIndex(e=>e.id==='hell')<data.events.findIndex(e=>e.id==='windglum'),'Phone order must show the trap before Biscuit reaches Windglum');
assert.deepEqual(data.edges.find(e=>e.lane==='gravy').nodes,['gravy-grotto','ants','hell']);
for(const place of data.places){
  assert(['surface','north','beyond'].includes(place.region));
  if(place.media)assert(context.items.some(item=>item.id===place.media));
  if(place.illustration?.src)assert(existsSync(resolve(root,place.illustration.src)));
  if(place.illustration?.chapter)assert(context.stories[place.illustration.chapter].scenes[place.illustration.scene-1].image);
}
assert.deepEqual(data.places.filter(place=>place.pin).map(place=>place.id),['oakhurst','sunless']);
assert.notEqual(data.places.find(p=>p.id==='zandikar').id,data.places.find(p=>p.id==='red-keep').id);
function references(value){if(!value||typeof value!=='object')return;if(value.chapter&&value.scene)assert(context.stories[value.chapter]?.scenes[value.scene-1],`Missing scene ${JSON.stringify(value)}`);if(value.portrait)assert(context.people.some(person=>person.slug===value.portrait));for(const child of Object.values(value))references(child)}
references(data);
for(const key of ['cityMap','roadMap'])assert(context.items.some(item=>item.id===data[key]));
for(const landmark of data.landmarks)assert(landmark.pin.every(n=>n>0&&n<100));
let images=0,links=0;
for(const page of ['timeline','brindinford','atlas']){
 const html=renderTimeAndPlaces(data,page,context);
 assert(!html.includes('undefined'));
 assert(!/\bboss\b/i.test(html));
 assert.equal((html.match(/<h1>/g)??[]).length,1);
 assert(html.lastIndexOf('Continue exploring the campaign')>html.lastIndexOf('</article>'));
 for(const [,href] of html.matchAll(/href="([^"]+)"/g)){
   const [slug,section,entry]=href.replace(/^#\//,'').split('/');
   if(slug==='time-and-places'){assert(['timeline','brindinford','atlas','maps'].includes(section));if(entry)assert(eventIds.has(entry)||placeIds.has(entry)||data.landmarks.some(l=>l.id===entry))}
   else if(section==='scene')assert(context.stories[slug]?.scenes[Number(entry)-1]);
   else if(slug==='companions')assert(context.people.some(person=>person.slug===section));
   else assert(['timeline','further-tales','fungal-bloom'].includes(slug));
   links++;
 }
 for(const [,src] of html.matchAll(/<img[^>]+src="([^"]+)"/g)){assert(existsSync(resolve(root,src)),src);images++}
}
const rendered=renderTimeAndPlaces(data,'timeline',context);
for(const event of data.events)assert.equal(rendered.split(`data-event="${event.id}"`).length-1,1);
assert(rendered.indexOf('data-fold="present"')<rendered.indexOf('data-fold="earlier"'),'Accessible order follows the travellers');
assert(renderExplorerCallout().includes('#/time-and-places/brindinford'));
for(const slug of ['sunless-citadel','forge-of-fury','speaker-in-dreams','standing-stone','nightfang-spire','deep-horizon','iron-fortress','white-plume','frostmaiden','fungal-bloom','bastion'])assert(chapterAtlasLink(slug));
console.log(`Time & Places: ${data.events.length} milestones, ${data.places.length} places, ${data.landmarks.length} comparisons; ${links} rendered links and ${images} image references passed.`);
